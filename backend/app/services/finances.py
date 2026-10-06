from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.models import BudgetCategory, Payment, User, Vendor, Wedding
from app.schemas import BudgetRead
from app.services.common import require_member

def get_budget(wedding_id: UUID, db: Session, user: User):
    require_member(db, wedding_id, user.id)
    wedding = db.get(Wedding, wedding_id)
    distributed = db.scalar(select(func.coalesce(func.sum(BudgetCategory.planned_cents), 0)).where(BudgetCategory.wedding_id == wedding_id))
    contracted = db.scalar(select(func.coalesce(func.sum(Vendor.total_cost_cents), 0)).where(Vendor.wedding_id == wedding_id, Vendor.status == "contracted"))
    paid = db.scalar(select(func.coalesce(func.sum(Payment.amount_cents), 0)).where(Payment.wedding_id == wedding_id, Payment.status == "paid"))
    pending = db.scalar(select(func.coalesce(func.sum(Payment.amount_cents), 0)).where(Payment.wedding_id == wedding_id, Payment.status == "pending"))
    return BudgetRead(
        budget_target_cents=wedding.budget_target_cents,
        distributed_cents=distributed,
        undistributed_cents=wedding.budget_target_cents - distributed,
        contracted_cents=contracted,
        paid_cents=paid,
        pending_installments_cents=pending,
        remaining_contracted_cents=contracted - paid,
    )
