from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.auth import current_user
from app.db.session import get_db
from app.models import Vendor, User
from app import schemas as s
from app.services import records
from app.services.common import owned
from app.api.v1.errors import ERROR_RESPONSES

router = APIRouter(tags=["Vendors"], responses=ERROR_RESPONSES)

@router.get("/weddings/{wedding_id}/vendors", response_model=list[s.VendorRead], summary="Listar fornecedores", name="list_vendors")
def list_records(wedding_id: UUID, limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0),
                 search: str | None = None, rsvp_status: s.Rsvp | None = None,
                 group_id: UUID | None = None, status: str | None = None, category: str | None = None,
                 db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.list_records(db,Vendor,wedding_id,user.id,limit,offset,search,rsvp_status,group_id,status,category)

@router.post("/weddings/{wedding_id}/vendors", response_model=s.VendorRead, status_code=201, summary="Cadastrar fornecedor", name="create_vendors")
def create_record(payload: s.VendorCreate, wedding_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.create_record(db,Vendor,wedding_id,user.id,payload)

@router.get("/vendors/{record_id}", response_model=s.VendorRead, summary="Consultar fornecedor", name="get_vendors")
def get_record(record_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return owned(db,Vendor,record_id,user.id)

@router.patch("/vendors/{record_id}", response_model=s.VendorRead, summary="Editar fornecedor", name="update_vendors")
def update_record(record_id: UUID, payload: s.VendorUpdate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.update_record(db,Vendor,record_id,user.id,payload)

@router.delete("/vendors/{record_id}", status_code=204, response_model=None, summary="Excluir fornecedor", name="delete_vendors")
def delete_record(record_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.delete_record(db,Vendor,record_id,user.id)
