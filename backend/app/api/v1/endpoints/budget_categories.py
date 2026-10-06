from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.auth import current_user
from app.db.session import get_db
from app.models import BudgetCategory, User
from app import schemas as s
from app.services import records
from app.services.common import owned
from app.api.v1.errors import ERROR_RESPONSES

router = APIRouter(tags=["Finances"], responses=ERROR_RESPONSES)

@router.get("/weddings/{wedding_id}/budget-categories", response_model=list[s.CategoryRead], summary="Listar categorias financeiras", name="list_budget-categories")
def list_records(wedding_id: UUID, limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0),
                 search: str | None = None, rsvp_status: s.Rsvp | None = None,
                 group_id: UUID | None = None, status: str | None = None, category: str | None = None,
                 db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.list_records(db,BudgetCategory,wedding_id,user.id,limit,offset,search,rsvp_status,group_id,status,category)

@router.post("/weddings/{wedding_id}/budget-categories", response_model=s.CategoryRead, status_code=201, summary="Cadastrar categoria financeira", name="create_budget-categories")
def create_record(payload: s.CategoryCreate, wedding_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.create_record(db,BudgetCategory,wedding_id,user.id,payload)

@router.get("/budget-categories/{record_id}", response_model=s.CategoryRead, summary="Consultar categoria financeira", name="get_budget-categories")
def get_record(record_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return owned(db,BudgetCategory,record_id,user.id)

@router.patch("/budget-categories/{record_id}", response_model=s.CategoryRead, summary="Editar categoria financeira", name="update_budget-categories")
def update_record(record_id: UUID, payload: s.CategoryUpdate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.update_record(db,BudgetCategory,record_id,user.id,payload)

@router.delete("/budget-categories/{record_id}", status_code=204, response_model=None, summary="Excluir categoria financeira", name="delete_budget-categories")
def delete_record(record_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.delete_record(db,BudgetCategory,record_id,user.id)
