from uuid import UUID
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models import Task, TaskSubtask, User
from app.schemas import SubtaskCreate, SubtaskUpdate
from app.services.common import commit, owned

def list_subtasks(task_id: UUID, db: Session, user: User):
    owned(db, Task, task_id, user.id)
    return db.scalars(select(TaskSubtask).where(TaskSubtask.task_id == task_id).order_by(TaskSubtask.sort_order, TaskSubtask.created_at)).all()


def create_subtask(task_id: UUID, payload: SubtaskCreate, db: Session, user: User):
    owned(db, Task, task_id, user.id)
    record = TaskSubtask(task_id=task_id, **payload.model_dump())
    db.add(record)
    return commit(db, record)


def owned_subtask(db: Session, subtask_id: UUID, user_id: UUID) -> TaskSubtask:
    record = db.get(TaskSubtask, subtask_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Subtarefa não encontrada")
    owned(db, Task, record.task_id, user_id)
    return record


def update_subtask(subtask_id: UUID, payload: SubtaskUpdate, db: Session, user: User):
    record = owned_subtask(db, subtask_id, user.id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(record, key, value)
    return commit(db, record)


def delete_subtask(subtask_id: UUID, db: Session, user: User):
    db.delete(owned_subtask(db, subtask_id, user.id))
    commit(db)
    return None
