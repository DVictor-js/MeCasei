from uuid import UUID
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models import User, Wedding, WeddingMember
from app.schemas import WeddingCreate, WeddingUpdate
from app.services.common import commit, require_member

def list_weddings(db: Session, user: User):
    return db.scalars(select(Wedding).join(WeddingMember).where(WeddingMember.user_id == user.id).order_by(Wedding.created_at)).all()


def create_wedding(payload: WeddingCreate, db: Session, user: User):
    wedding = Wedding(**payload.model_dump())
    db.add(wedding)
    db.flush()
    db.add(WeddingMember(wedding_id=wedding.id, user_id=user.id, role="owner"))
    return commit(db, wedding)


def get_wedding(wedding_id: UUID, db: Session, user: User):
    require_member(db, wedding_id, user.id)
    return db.get(Wedding, wedding_id)


def update_wedding(wedding_id: UUID, payload: WeddingUpdate, db: Session, user: User):
    require_member(db, wedding_id, user.id)
    wedding = db.get(Wedding, wedding_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(wedding, key, value)
    if wedding.onboarding_completed and not (wedding.partner_one_name.strip() and wedding.partner_two_name.strip() and wedding.wedding_date and wedding.city and wedding.guest_target is not None):
        raise HTTPException(status_code=400, detail="Dados do casamento incompletos")
    return commit(db, wedding)
