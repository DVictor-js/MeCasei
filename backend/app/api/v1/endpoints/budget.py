from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.auth import current_user
from app.db.session import get_db
from app.models import User
from app import schemas as s
from app.services import finances as service
from app.api.v1.errors import ERROR_RESPONSES
router = APIRouter(tags=["Finances"], responses=ERROR_RESPONSES)


@router.get("/weddings/{wedding_id}/budget", response_model=s.BudgetRead, status_code=200, summary="Consultar resumo financeiro", description="Valores em centavos. Orçamento total é independente da distribuição por categoria. Saldo contratado é contratado menos pago; parcelas pendentes cadastradas são uma medida separada.")
def get_budget(wedding_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return service.get_budget(wedding_id,db,user)
