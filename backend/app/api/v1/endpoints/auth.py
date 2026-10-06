from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.auth import current_user, current_identity
from app.db.session import get_db
from app.models import User, AuthSession
from app import schemas as s
from app.services import auth as service
from app.api.v1.errors import ERROR_RESPONSES
router = APIRouter(tags=["Authentication"], responses={code: ERROR_RESPONSES[code] for code in (401, 409)})


@router.post("/auth/register", response_model=s.TokenPair, status_code=201, summary="Criar conta")
def register(payload: s.UserCreate, db: Session = Depends(get_db)):
    return service.register(payload,db)

@router.post("/auth/login", response_model=s.TokenPair, status_code=200, summary="Entrar na conta")
def login(payload: s.LoginRequest, db: Session = Depends(get_db)):
    return service.login(payload,db)

@router.post("/auth/refresh", response_model=s.TokenPair, status_code=200, summary="Renovar sessão", description="Emite novos tokens e revoga a sessão anterior, incluindo seus tokens de acesso e refresh.")
def refresh(payload: s.RefreshRequest, db: Session = Depends(get_db)):
    return service.refresh(payload,db)

@router.get("/auth/me", response_model=s.UserRead, status_code=200, summary="Consultar usuário autenticado")
def me(user: User = Depends(current_user)):
    return user

@router.post("/auth/logout", response_model=None, status_code=204, summary="Encerrar sessão")
def logout(identity: tuple[User, AuthSession] = Depends(current_identity), db: Session = Depends(get_db)):
    return service.logout(identity,db)
