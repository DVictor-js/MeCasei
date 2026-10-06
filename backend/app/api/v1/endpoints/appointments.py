from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.auth import current_user
from app.db.session import get_db
from app.models import Appointment, User
from app import schemas as s
from app.services import records
from app.services.common import owned
from app.api.v1.errors import ERROR_RESPONSES

router = APIRouter(tags=["Appointments"], responses=ERROR_RESPONSES)

@router.get("/weddings/{wedding_id}/appointments", response_model=list[s.AppointmentRead], summary="Listar compromissos", name="list_appointments")
def list_records(wedding_id: UUID, limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0),
                 search: str | None = None, rsvp_status: s.Rsvp | None = None,
                 group_id: UUID | None = None, status: str | None = None, category: str | None = None,
                 db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.list_records(db,Appointment,wedding_id,user.id,limit,offset,search,rsvp_status,group_id,status,category)

@router.post("/weddings/{wedding_id}/appointments", response_model=s.AppointmentRead, status_code=201, summary="Cadastrar compromisso", name="create_appointments")
def create_record(payload: s.AppointmentCreate, wedding_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.create_record(db,Appointment,wedding_id,user.id,payload)

@router.get("/appointments/{record_id}", response_model=s.AppointmentRead, summary="Consultar compromisso", name="get_appointments")
def get_record(record_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return owned(db,Appointment,record_id,user.id)

@router.patch("/appointments/{record_id}", response_model=s.AppointmentRead, summary="Editar compromisso", name="update_appointments")
def update_record(record_id: UUID, payload: s.AppointmentUpdate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.update_record(db,Appointment,record_id,user.id,payload)

@router.delete("/appointments/{record_id}", status_code=204, response_model=None, summary="Excluir compromisso", name="delete_appointments")
def delete_record(record_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.delete_record(db,Appointment,record_id,user.id)
