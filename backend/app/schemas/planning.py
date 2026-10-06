from datetime import date, datetime
from typing import Literal
from uuid import UUID
from pydantic import AwareDatetime, Field


from app.schemas.common import StrictModel

class TaskCreate(StrictModel):
    title: str = Field(min_length=1, max_length=300)
    description: str | None = None
    category: str = Field(min_length=1, max_length=200)
    due_date: date | None = None
    status: Literal["pending", "completed"] = "pending"
    priority: Literal["low", "medium", "high"] = "medium"
    responsible: Literal["self", "partner", "both"] = "both"
    related_vendor_id: UUID | None = None
    related_event_id: UUID | None = None
    completed_at: AwareDatetime | None = None


class TaskUpdate(StrictModel):
    title: str | None = Field(default=None, min_length=1, max_length=300)
    description: str | None = None
    category: str | None = Field(default=None, min_length=1, max_length=200)
    due_date: date | None = None
    status: Literal["pending", "completed"] | None = None
    priority: Literal["low", "medium", "high"] | None = None
    responsible: Literal["self", "partner", "both"] | None = None
    related_vendor_id: UUID | None = None
    related_event_id: UUID | None = None
    completed_at: AwareDatetime | None = None


class TaskRead(TaskCreate):
    id: UUID
    wedding_id: UUID
    created_at: datetime
    updated_at: datetime


class SubtaskCreate(StrictModel):
    title: str = Field(min_length=1, max_length=300)
    completed: bool = False
    sort_order: int = Field(default=0, ge=0)


class SubtaskUpdate(StrictModel):
    title: str | None = Field(default=None, min_length=1, max_length=300)
    completed: bool | None = None
    sort_order: int | None = Field(default=None, ge=0)


class SubtaskRead(SubtaskCreate):
    id: UUID
    task_id: UUID
    created_at: datetime
