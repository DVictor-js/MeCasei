from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.auth import current_user
from app.db.session import get_db
from app.models import User
from app import schemas as s
from app.services import weddings as service
from app.api.v1.errors import ERROR_RESPONSES
router = APIRouter(tags=["Weddings"], responses=ERROR_RESPONSES)


@router.get("/weddings", response_model=list[s.WeddingRead], status_code=200, summary="Listar meus casamentos")
def list_weddings(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return service.list_weddings(db,user)

@router.post("/weddings", response_model=s.WeddingRead, status_code=201, summary="Criar casamento")
def create_wedding(payload: s.WeddingCreate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return service.create_wedding(payload,db,user)

@router.get("/weddings/{wedding_id}", response_model=s.WeddingRead, status_code=200, summary="Consultar casamento")
def get_wedding(wedding_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return service.get_wedding(wedding_id,db,user)

@router.patch("/weddings/{wedding_id}", response_model=s.WeddingRead, status_code=200, summary="Editar casamento")
def update_wedding(wedding_id: UUID, payload: s.WeddingUpdate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return service.update_wedding(wedding_id,payload,db,user)
