from app.services import guests as related
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.auth import current_user
from app.db.session import get_db
from app.models import Guest, User
from app import schemas as s
from app.services import records
from app.services.common import owned
from app.api.v1.errors import ERROR_RESPONSES

router = APIRouter(tags=["Guests"], responses=ERROR_RESPONSES)

@router.get("/weddings/{wedding_id}/guests", response_model=list[s.GuestRead], summary="Listar convidados", name="list_guests")
def list_records(wedding_id: UUID, limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0),
                 search: str | None = None, rsvp_status: s.Rsvp | None = None,
                 group_id: UUID | None = None, status: str | None = None, category: str | None = None,
                 db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.list_records(db,Guest,wedding_id,user.id,limit,offset,search,rsvp_status,group_id,status,category)

@router.post("/weddings/{wedding_id}/guests", response_model=s.GuestRead, status_code=201, summary="Cadastrar convidado", name="create_guests")
def create_record(payload: s.GuestCreate, wedding_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.create_record(db,Guest,wedding_id,user.id,payload)

@router.get("/guests/{record_id}", response_model=s.GuestRead, summary="Consultar convidado", name="get_guests")
def get_record(record_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return owned(db,Guest,record_id,user.id)

@router.patch("/guests/{record_id}", response_model=s.GuestRead, summary="Editar convidado", name="update_guests")
def update_record(record_id: UUID, payload: s.GuestUpdate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.update_record(db,Guest,record_id,user.id,payload)

@router.delete("/guests/{record_id}", status_code=204, response_model=None, summary="Excluir convidado", name="delete_guests")
def delete_record(record_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.delete_record(db,Guest,record_id,user.id)


@router.get("/guests/{guest_id}/invitations", response_model=list[s.InvitationRead], status_code=200, summary="Listar convites por evento")
def list_invitations(guest_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return related.list_invitations(guest_id,db,user)

@router.put("/guests/{guest_id}/events/{event_id}", response_model=s.InvitationRead, status_code=200, summary="Definir convite para evento")
def put_invitation(guest_id: UUID, event_id: UUID, payload: s.InvitationCreate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return related.put_invitation(guest_id,event_id,payload,db,user)

@router.delete("/guests/{guest_id}/events/{event_id}", response_model=None, status_code=204, summary="Remover convite de evento")
def delete_invitation(guest_id: UUID, event_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return related.delete_invitation(guest_id,event_id,db,user)
