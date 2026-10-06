from datetime import datetime
from uuid import UUID
from pydantic import AwareDatetime, Field


from app.schemas.common import StrictModel

class EventCreate(StrictModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    event_date: AwareDatetime
    location: str | None = Field(default=None, max_length=300)


class EventUpdate(StrictModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    event_date: AwareDatetime | None = None
    location: str | None = Field(default=None, max_length=300)


class EventRead(EventCreate):
    id: UUID
    wedding_id: UUID
    created_at: datetime
    updated_at: datetime


class AppointmentCreate(StrictModel):
    title: str = Field(min_length=1, max_length=300)
    description: str | None = None
    appointment_date: AwareDatetime
    location: str | None = Field(default=None, max_length=300)
    vendor_id: UUID | None = None
    task_id: UUID | None = None


class AppointmentUpdate(StrictModel):
    title: str | None = Field(default=None, min_length=1, max_length=300)
    description: str | None = None
    appointment_date: AwareDatetime | None = None
    location: str | None = Field(default=None, max_length=300)
    vendor_id: UUID | None = None
    task_id: UUID | None = None


class AppointmentRead(AppointmentCreate):
    id: UUID
    wedding_id: UUID
    created_at: datetime
    updated_at: datetime
