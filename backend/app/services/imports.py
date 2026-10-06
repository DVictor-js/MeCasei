from typing import Any
from uuid import UUID, uuid4
from fastapi import HTTPException
from pydantic import BaseModel, ValidationError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.models import Appointment, BudgetCategory, Guest, GuestEventInvitation, GuestGroup, ImportJob, Payment, Task, TaskSubtask, User, Vendor, Wedding, WeddingEvent, WeddingMember
from app import schemas as s
from app.services.common import normalize_payment, normalize_task

from app.schemas.sync import ImportRequest, ImportRead

SYSTEM_FIELDS = {"id", "wedding_id", "task_id", "guest_id", "created_at", "updated_at", "planning_generated", "related_decision_id", "source_decision_option_id"}
LINKS = {
    "group_id": "guest_groups",
    "budget_category_id": "budget_categories",
    "related_vendor_id": "vendors",
    "related_event_id": "wedding_events",
    "vendor_id": "vendors",
    "task_id": "tasks",
    "event_id": "wedding_events",
}
ORDER = [
    ("budget_categories", BudgetCategory, s.CategoryCreate),
    ("guest_groups", GuestGroup, s.GroupCreate),
    ("wedding_events", WeddingEvent, s.EventCreate),
    ("vendors", Vendor, s.VendorCreate),
    ("tasks", Task, s.TaskCreate),
    ("task_subtasks", TaskSubtask, s.SubtaskCreate),
    ("guests", Guest, s.GuestCreate),
    ("guest_event_invitations", GuestEventInvitation, s.InvitationCreate),
    ("payments", Payment, s.PaymentCreate),
    ("appointments", Appointment, s.AppointmentCreate),
]


def parse_data(data: dict[str, Any], schema: type[BaseModel], mapping: dict[str, dict[str, str]]) -> dict:
    allowed = set(schema.model_fields)
    extra = set(data) - allowed - SYSTEM_FIELDS
    if extra:
        raise HTTPException(status_code=422, detail=f"Campos não permitidos na importação: {', '.join(sorted(extra))}")
    values = {key: value for key, value in data.items() if key in allowed}
    for key, table in LINKS.items():
        if key in values and values[key] is not None:
            remote = mapping[table].get(str(values[key]))
            if not remote:
                raise HTTPException(status_code=400, detail=f"Relação local ausente: {key}")
            values[key] = remote
    try:
        return schema.model_validate(values).model_dump()
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors(include_input=False)) from exc


def import_local(payload: ImportRequest, db: Session, user: User):
    previous = db.scalar(select(ImportJob).where(ImportJob.user_id == user.id, ImportJob.client_import_id == payload.client_import_id))
    if previous:
        return ImportRead(wedding_id=previous.wedding_id, mapping=previous.mapping)

    mapping: dict[str, dict[str, str]] = {"weddings": {payload.wedding.local_id: str(uuid4())}}
    for table, _, _ in ORDER:
        items = getattr(payload, table)
        ids = [item.local_id for item in items]
        if len(ids) != len(set(ids)):
            raise HTTPException(status_code=400, detail=f"IDs locais duplicados: {table}")
        mapping[table] = {local_id: str(uuid4()) for local_id in ids}

    wedding_id = UUID(mapping["weddings"][payload.wedding.local_id])
    try:
        wedding_data = parse_data(payload.wedding.data, s.WeddingCreate, mapping)
        db.add(Wedding(id=wedding_id, **wedding_data))
        db.flush()
        db.add(WeddingMember(wedding_id=wedding_id, user_id=user.id, role="owner"))
        for table, model, schema in ORDER:
            for item in getattr(payload, table):
                data = parse_data(item.data, schema, mapping)
                if model is Task:
                    normalize_task(data)
                if model is Payment:
                    normalize_payment(data)
                if model is TaskSubtask:
                    data["task_id"] = UUID(mapping["tasks"].get(str(item.data.get("task_id")), "00000000-0000-0000-0000-000000000000"))
                    if data["task_id"].int == 0:
                        raise HTTPException(status_code=400, detail="Subtarefa sem tarefa local")
                elif model is GuestEventInvitation:
                    guest_id = mapping["guests"].get(str(item.data.get("guest_id")))
                    if not guest_id:
                        raise HTTPException(status_code=400, detail="Convite sem convidado local")
                    data["guest_id"] = UUID(guest_id)
                else:
                    data["wedding_id"] = wedding_id
                db.add(model(id=UUID(mapping[table][item.local_id]), **data))
            db.flush()
        db.add(ImportJob(user_id=user.id, client_import_id=payload.client_import_id, wedding_id=wedding_id, mapping=mapping))
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Importação em conflito; dados locais preservados") from exc
    except Exception:
        db.rollback()
        raise
    return ImportRead(wedding_id=wedding_id, mapping=mapping)
