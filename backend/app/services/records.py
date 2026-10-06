from uuid import UUID
from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models import BudgetCategory, Guest, Payment, Task, Vendor
from app.services.common import commit, list_page, normalize_payment, normalize_task, owned, require_member, validate_links

def list_records(db: Session, model: type, wedding_id: UUID, user_id: UUID,
                 limit: int, offset: int, search=None, rsvp_status=None, group_id=None, status=None, category=None):
    require_member(db, wedding_id, user_id)
    conditions = []
    if model is Guest:
        if search: conditions.append(Guest.name.ilike(f"%{search}%"))
        if rsvp_status: conditions.append(Guest.rsvp_status == rsvp_status)
        if group_id: conditions.append(Guest.group_id == group_id)
    if model is Task:
        if status:
            if status not in ("pending", "completed"):
                raise HTTPException(status_code=400, detail="Status inválido")
            conditions.append(Task.status == status)
        if category: conditions.append(Task.category == category)
    return list_page(db,model,wedding_id,limit,offset,*conditions)

def create_record(db: Session, model: type, wedding_id: UUID, user_id: UUID, payload: BaseModel):
    require_member(db,wedding_id,user_id)
    data=payload.model_dump()
    validate_links(db,wedding_id,data)
    if model is Payment: normalize_payment(data)
    if model is Task: normalize_task(data)
    record=model(wedding_id=wedding_id,**data)
    db.add(record)
    return commit(db,record)

def update_record(db: Session, model: type, record_id: UUID, user_id: UUID, payload: BaseModel):
    record=owned(db,model,record_id,user_id)
    data=payload.model_dump(exclude_unset=True)
    validate_links(db,record.wedding_id,data)
    if model is Payment: normalize_payment(data,record)
    if model is Task: normalize_task(data,record)
    for key,value in data.items(): setattr(record,key,value)
    return commit(db,record)

def delete_record(db: Session, model: type, record_id: UUID, user_id: UUID):
    record=owned(db,model,record_id,user_id)
    if model is BudgetCategory:
        related=db.scalar(select(Vendor.id).where(Vendor.budget_category_id==record.id).limit(1)) or db.scalar(select(Payment.id).where(Payment.budget_category_id==record.id).limit(1))
        if related: raise HTTPException(status_code=409,detail="Categoria vinculada a fornecedor ou pagamento")
    db.delete(record)
    commit(db)
