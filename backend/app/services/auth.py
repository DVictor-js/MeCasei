from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.core.auth import decode_token, issue_tokens, password_hash, valid_session
from app.models import AuthSession, User
from app.models.common import now
from app.schemas import LoginRequest, RefreshRequest, UserCreate

def register(payload: UserCreate, db: Session):
    email = str(payload.email).strip().lower()
    user = User(name=payload.name.strip(), email=email, password_hash=password_hash.hash(payload.password))
    db.add(user)
    try:
        db.flush()
        tokens = issue_tokens(db, user)
        db.commit()
        return tokens
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Não foi possível criar a conta com este email") from exc


def login(payload: LoginRequest, db: Session):
    user = db.scalar(select(User).where(User.email == str(payload.email).lower()))
    if user is None or not user.is_active or not password_hash.verify(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email ou senha inválidos")
    tokens = issue_tokens(db, user)
    db.commit()
    return tokens


def refresh(payload: RefreshRequest, db: Session):
    user_id, session_id = decode_token(payload.refresh_token, "refresh")
    user, session = valid_session(db, user_id, session_id)
    session.revoked_at = now()
    tokens = issue_tokens(db, user)
    db.commit()
    return tokens


def logout(identity: tuple[User, AuthSession], db: Session):
    identity[1].revoked_at = now()
    db.commit()
    return None
