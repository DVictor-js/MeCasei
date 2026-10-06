from datetime import datetime
from uuid import UUID
from pydantic import EmailStr, Field


from app.schemas.common import StrictModel, Rsvp

class GroupCreate(StrictModel):
    name: str = Field(min_length=1, max_length=200)


class GroupUpdate(StrictModel):
    name: str = Field(min_length=1, max_length=200)


class GroupRead(GroupCreate):
    id: UUID
    wedding_id: UUID
    created_at: datetime


class GuestCreate(StrictModel):
    group_id: UUID | None = None
    name: str = Field(min_length=1, max_length=200)
    phone: str | None = Field(default=None, max_length=80)
    email: EmailStr | None = None
    rsvp_status: Rsvp = "pending"
    companion_count: int = Field(default=0, ge=0)
    dietary_restrictions: str | None = None
    table_name: str | None = Field(default=None, max_length=200)
    invitation_sent: bool = False


class GuestUpdate(StrictModel):
    group_id: UUID | None = None
    name: str | None = Field(default=None, min_length=1, max_length=200)
    phone: str | None = Field(default=None, max_length=80)
    email: EmailStr | None = None
    rsvp_status: Rsvp | None = None
    companion_count: int | None = Field(default=None, ge=0)
    dietary_restrictions: str | None = None
    table_name: str | None = Field(default=None, max_length=200)
    invitation_sent: bool | None = None


class GuestRead(GuestCreate):
    id: UUID
    wedding_id: UUID
    created_at: datetime
    updated_at: datetime


class InvitationCreate(StrictModel):
    event_id: UUID
    invited: bool = True
    rsvp_status: Rsvp = "pending"


class InvitationRead(InvitationCreate):
    id: UUID
    guest_id: UUID
