from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.auth import current_user
from app.db.session import get_db
from app.models import Payment, User
from app import schemas as s
from app.services import records
from app.services.common import owned
from app.api.v1.errors import ERROR_RESPONSES

router = APIRouter(tags=["Payments"], responses=ERROR_RESPONSES)

@router.get("/weddings/{wedding_id}/payments", response_model=list[s.PaymentRead], summary="Listar pagamentos", name="list_payments")
def list_records(wedding_id: UUID, limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0),
                 search: str | None = None, rsvp_status: s.Rsvp | None = None,
                 group_id: UUID | None = None, status: str | None = None, category: str | None = None,
                 db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.list_records(db,Payment,wedding_id,user.id,limit,offset,search,rsvp_status,group_id,status,category)

@router.post("/weddings/{wedding_id}/payments", response_model=s.PaymentRead, status_code=201, summary="Cadastrar pagamento", name="create_payments")
def create_record(payload: s.PaymentCreate, wedding_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.create_record(db,Payment,wedding_id,user.id,payload)

@router.get("/payments/{record_id}", response_model=s.PaymentRead, summary="Consultar pagamento", name="get_payments")
def get_record(record_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return owned(db,Payment,record_id,user.id)

@router.patch("/payments/{record_id}", response_model=s.PaymentRead, summary="Editar pagamento", name="update_payments")
def update_record(record_id: UUID, payload: s.PaymentUpdate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.update_record(db,Payment,record_id,user.id,payload)

@router.delete("/payments/{record_id}", status_code=204, response_model=None, summary="Excluir pagamento", name="delete_payments")
def delete_record(record_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return records.delete_record(db,Payment,record_id,user.id)
