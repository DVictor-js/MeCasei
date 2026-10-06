from typing import Any
from uuid import UUID
from pydantic import Field
from app.schemas.common import StrictModel

class ImportItem(StrictModel):
    local_id: str = Field(min_length=1, max_length=200)
    data: dict[str, Any]


class ImportRequest(StrictModel):
    client_import_id: str = Field(min_length=1, max_length=200)
    wedding: ImportItem
    budget_categories: list[ImportItem] = Field(default_factory=list, max_length=1000)
    guest_groups: list[ImportItem] = Field(default_factory=list, max_length=1000)
    wedding_events: list[ImportItem] = Field(default_factory=list, max_length=1000)
    vendors: list[ImportItem] = Field(default_factory=list, max_length=1000)
    tasks: list[ImportItem] = Field(default_factory=list, max_length=10000)
    task_subtasks: list[ImportItem] = Field(default_factory=list, max_length=50000)
    guests: list[ImportItem] = Field(default_factory=list, max_length=10000)
    guest_event_invitations: list[ImportItem] = Field(default_factory=list, max_length=50000)
    payments: list[ImportItem] = Field(default_factory=list, max_length=10000)
    appointments: list[ImportItem] = Field(default_factory=list, max_length=10000)


class ImportRead(StrictModel):
    wedding_id: UUID
    mapping: dict[str, dict[str, str]]
