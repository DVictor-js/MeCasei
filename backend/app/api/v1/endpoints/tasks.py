from app.services import planning as related
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.auth import current_user
from app.db.session import get_db
from app.models import Task, User
from app import schemas as s
from app.services import records
from app.services.common import owned
from app.api.v1.errors import ERROR_RESPONSES

router = APIRouter(tags=["Planning"], responses=ERROR_RESPONSES)

@router.get("/weddings/{wedding_id}/tasks", response_model=list[s.TaskRead], summary="Listar tarefas", name="list_tasks")
def list_records(wedding_id: UUID, limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0),
                 search: str | None = None, rsvp_status: s.Rsvp | None = None,
                 group_id: UUID | None = None, status: str | None = None, category: str | None = None,
                 db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.list_records(db,Task,wedding_id,user.id,limit,offset,search,rsvp_status,group_id,status,category)

@router.post("/weddings/{wedding_id}/tasks", response_model=s.TaskRead, status_code=201, summary="Cadastrar tarefa", name="create_tasks")
def create_record(payload: s.TaskCreate, wedding_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.create_record(db,Task,wedding_id,user.id,payload)

@router.get("/tasks/{record_id}", response_model=s.TaskRead, summary="Consultar tarefa", name="get_tasks")
def get_record(record_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return owned(db,Task,record_id,user.id)

@router.patch("/tasks/{record_id}", response_model=s.TaskRead, summary="Editar tarefa", name="update_tasks")
def update_record(record_id: UUID, payload: s.TaskUpdate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.update_record(db,Task,record_id,user.id,payload)

@router.delete("/tasks/{record_id}", status_code=204, response_model=None, summary="Excluir tarefa", name="delete_tasks")
def delete_record(record_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.delete_record(db,Task,record_id,user.id)


@router.get("/tasks/{task_id}/subtasks", response_model=list[s.SubtaskRead], status_code=200, summary="Listar subtarefas")
def list_subtasks(task_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return related.list_subtasks(task_id,db,user)

@router.post("/tasks/{task_id}/subtasks", response_model=s.SubtaskRead, status_code=201, summary="Criar subtarefa")
def create_subtask(task_id: UUID, payload: s.SubtaskCreate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return related.create_subtask(task_id,payload,db,user)

@router.patch("/subtasks/{subtask_id}", response_model=s.SubtaskRead, status_code=200, summary="Editar subtarefa")
def update_subtask(subtask_id: UUID, payload: s.SubtaskUpdate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return related.update_subtask(subtask_id,payload,db,user)

@router.delete("/subtasks/{subtask_id}", response_model=None, status_code=204, summary="Excluir subtarefa")
def delete_subtask(subtask_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return related.delete_subtask(subtask_id,db,user)
