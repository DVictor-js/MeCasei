from datetime import date, datetime
from typing import Literal
from uuid import UUID
from pydantic import Field


from app.schemas.common import StrictModel, VendorStatus

class CategoryCreate(StrictModel):
    name: str = Field(min_length=1, max_length=200)
    planned_cents: int = Field(default=0, ge=0)


class CategoryUpdate(StrictModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    planned_cents: int | None = Field(default=None, ge=0)


class CategoryRead(CategoryCreate):
    id: UUID
    wedding_id: UUID
    created_at: datetime
    updated_at: datetime


class VendorCreate(StrictModel):
    budget_category_id: UUID | None = None
    name: str = Field(min_length=1, max_length=200)
    category: str = Field(default="Outros", min_length=1, max_length=200)
    contact: str | None = Field(default=None, max_length=300)
    total_cost_cents: int = Field(default=0, ge=0)
    status: VendorStatus = "researching"
    notes: str | None = None


class VendorUpdate(StrictModel):
    budget_category_id: UUID | None = None
    name: str | None = Field(default=None, min_length=1, max_length=200)
    category: str | None = Field(default=None, min_length=1, max_length=200)
    contact: str | None = Field(default=None, max_length=300)
    total_cost_cents: int | None = Field(default=None, ge=0)
    status: VendorStatus | None = None
    notes: str | None = None


class VendorRead(VendorCreate):
    id: UUID
    wedding_id: UUID
    created_at: datetime
    updated_at: datetime


class PaymentCreate(StrictModel):
    vendor_id: UUID | None = None
    budget_category_id: UUID | None = None
    title: str = Field(min_length=1, max_length=300)
    amount_cents: int = Field(ge=0)
    due_date: date
    paid_date: date | None = None
    status: Literal["pending", "paid"] = "pending"


class PaymentUpdate(StrictModel):
    vendor_id: UUID | None = None
    budget_category_id: UUID | None = None
    title: str | None = Field(default=None, min_length=1, max_length=300)
    amount_cents: int | None = Field(default=None, ge=0)
    due_date: date | None = None
    paid_date: date | None = None
    status: Literal["pending", "paid"] | None = None


class PaymentRead(PaymentCreate):
    id: UUID
    wedding_id: UUID
    created_at: datetime
    updated_at: datetime


class BudgetRead(StrictModel):
    budget_target_cents: int
    distributed_cents: int
    undistributed_cents: int
    contracted_cents: int
    paid_cents: int
    pending_installments_cents: int
    remaining_contracted_cents: int
