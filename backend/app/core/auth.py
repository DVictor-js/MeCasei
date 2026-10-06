from datetime import timedelta
from uuid import UUID
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pwdlib import PasswordHash
from sqlalchemy.orm import Session
from app.core.config import get_settings
from app.db.session import get_db
from app.models import AuthSession, User
from app.models.common import now
from app.schemas import TokenPair

password_hash = PasswordHash.recommended()
bearer = HTTPBearer(auto_error=False)


def encode_token(user_id: UUID, session_id: UUID, kind: str, expires: timedelta) -> str:
    at = now()
    return jwt.encode(
        {"sub": str(user_id), "sid": str(session_id), "typ": kind, "iat": at, "exp": at + expires},
        get_settings().jwt_secret_key.get_secret_value(),
        algorithm="HS256",
    )


def decode_token(token: str, kind: str) -> tuple[UUID, UUID]:
    try:
        claims = jwt.decode(token, get_settings().jwt_secret_key.get_secret_value(), algorithms=["HS256"], options={"require": ["sub", "sid", "typ", "exp"]})
        if claims["typ"] != kind:
            raise ValueError("wrong token type")
        return UUID(claims["sub"]), UUID(claims["sid"])
    except (jwt.PyJWTError, ValueError, KeyError) as exc:
        raise HTTPException(status_code=401, detail="Sessão inválida ou expirada") from exc


def valid_session(db: Session, user_id: UUID, session_id: UUID) -> tuple[User, AuthSession]:
    session = db.get(AuthSession, session_id)
    user = db.get(User, user_id)
    if not session or not user or not user.is_active or session.user_id != user_id or session.revoked_at or session.expires_at <= now():
        raise HTTPException(status_code=401, detail="Sessão inválida ou expirada")
    return user, session


def issue_tokens(db: Session, user: User) -> TokenPair:
    settings = get_settings()
    session = AuthSession(user_id=user.id, expires_at=now() + timedelta(days=settings.refresh_token_expire_days))
    db.add(session)
    db.flush()
    return TokenPair(
        access_token=encode_token(user.id, session.id, "access", timedelta(minutes=settings.access_token_expire_minutes)),
        refresh_token=encode_token(user.id, session.id, "refresh", timedelta(days=settings.refresh_token_expire_days)),
    )


def current_identity(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> tuple[User, AuthSession]:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Autenticação necessária")
    user_id, session_id = decode_token(credentials.credentials, "access")
    return valid_session(db, user_id, session_id)


def current_user(identity: tuple[User, AuthSession] = Depends(current_identity)) -> User:
    return identity[0]
