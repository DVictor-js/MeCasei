from uuid import UUID
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models import Guest, GuestEventInvitation, User, WeddingEvent
from app.schemas import InvitationCreate
from app.services.common import commit, owned

def list_invitations(guest_id: UUID, db: Session, user: User):
    owned(db, Guest, guest_id, user.id)
    return db.scalars(select(GuestEventInvitation).where(GuestEventInvitation.guest_id == guest_id)).all()


def put_invitation(guest_id: UUID, event_id: UUID, payload: InvitationCreate, db: Session, user: User):
    guest = owned(db, Guest, guest_id, user.id)
    event = db.get(WeddingEvent, event_id)
    if not event or event.wedding_id != guest.wedding_id or payload.event_id != event_id:
        raise HTTPException(status_code=400, detail="Evento inválido para este convidado")
    record = db.scalar(select(GuestEventInvitation).where(GuestEventInvitation.guest_id == guest_id, GuestEventInvitation.event_id == event_id))
    if record is None:
        record = GuestEventInvitation(guest_id=guest_id, event_id=event_id)
        db.add(record)
    record.invited = payload.invited
    record.rsvp_status = payload.rsvp_status
    return commit(db, record)


def delete_invitation(guest_id: UUID, event_id: UUID, db: Session, user: User):
    owned(db, Guest, guest_id, user.id)
    record = db.scalar(select(GuestEventInvitation).where(GuestEventInvitation.guest_id == guest_id, GuestEventInvitation.event_id == event_id))
    if record is None:
        raise HTTPException(status_code=404, detail="Convite não encontrado")
    db.delete(record)
    commit(db)
    return None
