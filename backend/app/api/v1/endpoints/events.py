from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.auth import current_user
from app.db.session import get_db
from app.models import WeddingEvent, User
from app import schemas as s
from app.services import records
from app.services.common import owned
from app.api.v1.errors import ERROR_RESPONSES

router = APIRouter(tags=["Events"], responses=ERROR_RESPONSES)

@router.get("/weddings/{wedding_id}/events", response_model=list[s.EventRead], summary="Listar eventos do casamento", name="list_events")
def list_records(wedding_id: UUID, limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0),
                 search: str | None = None, rsvp_status: s.Rsvp | None = None,
                 group_id: UUID | None = None, status: str | None = None, category: str | None = None,
                 db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.list_records(db,WeddingEvent,wedding_id,user.id,limit,offset,search,rsvp_status,group_id,status,category)

@router.post("/weddings/{wedding_id}/events", response_model=s.EventRead, status_code=201, summary="Cadastrar evento do casamento", name="create_events")
def create_record(payload: s.EventCreate, wedding_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.create_record(db,WeddingEvent,wedding_id,user.id,payload)

@router.get("/events/{record_id}", response_model=s.EventRead, summary="Consultar evento do casamento", name="get_events")
def get_record(record_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return owned(db,WeddingEvent,record_id,user.id)

@router.patch("/events/{record_id}", response_model=s.EventRead, summary="Editar evento do casamento", name="update_events")
def update_record(record_id: UUID, payload: s.EventUpdate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.update_record(db,WeddingEvent,record_id,user.id,payload)

@router.delete("/events/{record_id}", status_code=204, response_model=None, summary="Excluir evento do casamento", name="delete_events")
def delete_record(record_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.delete_record(db,WeddingEvent,record_id,user.id)
