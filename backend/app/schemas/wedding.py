from datetime import date, datetime
from uuid import UUID
from pydantic import Field


from app.schemas.common import StrictModel

class WeddingCreate(StrictModel):
    partner_one_name: str = Field(default="", max_length=200)
    partner_two_name: str = Field(default="", max_length=200)
    wedding_date: date | None = None
    city: str | None = Field(default=None, max_length=200)
    guest_target: int | None = Field(default=None, ge=0)
    budget_target_cents: int = Field(default=0, ge=0)
    onboarding_completed: bool = False


class WeddingUpdate(StrictModel):
    partner_one_name: str | None = Field(default=None, max_length=200)
    partner_two_name: str | None = Field(default=None, max_length=200)
    wedding_date: date | None = None
    city: str | None = Field(default=None, max_length=200)
    guest_target: int | None = Field(default=None, ge=0)
    budget_target_cents: int | None = Field(default=None, ge=0)
    onboarding_completed: bool | None = None


class WeddingRead(WeddingCreate):
    id: UUID
    created_at: datetime
    updated_at: datetime
