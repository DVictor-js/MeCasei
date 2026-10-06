from datetime import date
from uuid import UUID
from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.models import BudgetCategory, GuestGroup, Task, Vendor, WeddingEvent, WeddingMember

RELATED_MODELS = {
    "group_id": GuestGroup,
    "budget_category_id": BudgetCategory,
    "related_vendor_id": Vendor,
    "related_event_id": WeddingEvent,
    "vendor_id": Vendor,
    "task_id": Task,
    "event_id": WeddingEvent,
}


def require_member(db: Session, wedding_id: UUID, user_id: UUID) -> None:
    member = db.scalar(select(WeddingMember.id).where(WeddingMember.wedding_id == wedding_id, WeddingMember.user_id == user_id))
    if member is None:
        raise HTTPException(status_code=404, detail="Casamento não encontrado")


def owned(db: Session, model: type, record_id: UUID, user_id: UUID):
    record = db.get(model, record_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Registro não encontrado")
    wedding_id = record.wedding_id if hasattr(record, "wedding_id") else None
    if wedding_id is None:
        raise RuntimeError("Acesso de recurso sem vínculo ao casamento")
    require_member(db, wedding_id, user_id)
    return record


def validate_links(db: Session, wedding_id: UUID, data: dict) -> None:
    for key, model in RELATED_MODELS.items():
        value = data.get(key)
        if value is None:
            continue
        record = db.get(model, value)
        if record is None or record.wedding_id != wedding_id:
            raise HTTPException(status_code=400, detail=f"Vínculo inválido: {key}")


def apply_fields(record: object, data: BaseModel) -> None:
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(record, key, value)


def normalize_payment(data: dict, current: object | None = None) -> dict:
    status = data.get("status", getattr(current, "status", "pending"))
    if status == "paid":
        data["paid_date"] = data.get("paid_date") or getattr(current, "paid_date", None) or date.today()
    else:
        data["paid_date"] = None
    return data


def normalize_task(data: dict, current: object | None = None) -> dict:
    from app.models.common import now
    status = data.get("status", getattr(current, "status", "pending"))
    data["completed_at"] = (data.get("completed_at") or getattr(current, "completed_at", None) or now()) if status == "completed" else None
    return data


def commit(db: Session, record: object | None = None):
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Registro em conflito com dados existentes") from exc
    if record is not None:
        db.refresh(record)
    return record


def list_page(db: Session, model: type, wedding_id: UUID, limit: int, offset: int, *conditions):
    return db.scalars(
        select(model).where(model.wedding_id == wedding_id, *conditions).order_by(model.created_at, model.id).limit(limit).offset(offset)
    ).all()
