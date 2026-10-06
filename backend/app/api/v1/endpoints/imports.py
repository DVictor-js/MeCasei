from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.auth import current_user
from app.db.session import get_db
from app.models import User
from app import schemas as s
from app.services import imports as service
from app.api.v1.errors import ERROR_RESPONSES
router = APIRouter(tags=["Import & Sync"], responses={code: ERROR_RESPONSES[code] for code in (400, 401, 409)})


@router.post("/imports", response_model=s.ImportRead, status_code=201, summary="Salvar planejamento local na conta", description="Importação atômica com mapeamento local ID para UUID. Repetir client_import_id na mesma conta retorna a importação anterior sem duplicar dados.")
def import_local(payload: s.ImportRequest, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return service.import_local(payload,db,user)
