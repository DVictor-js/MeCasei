from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.auth import current_user
from app.db.session import get_db
from app.models import GuestGroup, User
from app import schemas as s
from app.services import records
from app.services.common import owned
from app.api.v1.errors import ERROR_RESPONSES

router = APIRouter(tags=["Guests"], responses=ERROR_RESPONSES)

@router.get("/weddings/{wedding_id}/guest-groups", response_model=list[s.GroupRead], summary="Listar grupos de convidados", name="list_guest-groups")
def list_records(wedding_id: UUID, limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0),
                 search: str | None = None, rsvp_status: s.Rsvp | None = None,
                 group_id: UUID | None = None, status: str | None = None, category: str | None = None,
                 db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.list_records(db,GuestGroup,wedding_id,user.id,limit,offset,search,rsvp_status,group_id,status,category)

@router.post("/weddings/{wedding_id}/guest-groups", response_model=s.GroupRead, status_code=201, summary="Cadastrar grupo de convidados", name="create_guest-groups")
def create_record(payload: s.GroupCreate, wedding_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.create_record(db,GuestGroup,wedding_id,user.id,payload)

@router.get("/guest-groups/{record_id}", response_model=s.GroupRead, summary="Consultar grupo de convidados", name="get_guest-groups")
def get_record(record_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return owned(db,GuestGroup,record_id,user.id)

@router.patch("/guest-groups/{record_id}", response_model=s.GroupRead, summary="Editar grupo de convidados", name="update_guest-groups")
def update_record(record_id: UUID, payload: s.GroupUpdate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.update_record(db,GuestGroup,record_id,user.id,payload)

@router.delete("/guest-groups/{record_id}", status_code=204, response_model=None, summary="Excluir grupo de convidados", name="delete_guest-groups")
def delete_record(record_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.delete_record(db,GuestGroup,record_id,user.id)
