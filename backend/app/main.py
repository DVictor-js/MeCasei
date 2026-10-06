from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.api.v1.router import router
from app.core.config import get_settings
from app.db.session import get_db
from app.schemas.health import HealthRead
from app.services.health import check_health
from app import __version__

tags = [
    {"name": "Authentication", "description": "Conta, tokens e encerramento de sessão."},
    {"name": "Weddings", "description": "Casamentos acessíveis pelo usuário autenticado."},
    {"name": "Planning", "description": "Tarefas e subtarefas do planejamento."},
    {"name": "Guests", "description": "Convidados, grupos e convites por evento."},
    {"name": "Events", "description": "Momentos do casamento."},
    {"name": "Finances", "description": "Orçamento total, distribuição e resumo financeiro."},
    {"name": "Vendors", "description": "Profissionais pesquisados e contratados."},
    {"name": "Payments", "description": "Parcelas e registro de pagamento."},
    {"name": "Appointments", "description": "Visitas, reuniões e compromissos do planejamento."},
    {"name": "Import & Sync", "description": "Importação inicial transacional do planejamento local."},
    {"name": "Health", "description": "Disponibilidade da API e do PostgreSQL."},
]
settings = get_settings()
app = FastAPI(title="MeCasei API", version=__version__,
    description="Planejamento de casamento com IDs UUID e valores em centavos. Recursos protegidos exigem Bearer JWT e membership.",
    openapi_tags=tags)
app.add_middleware(CORSMiddleware,allow_origins=settings.origins,allow_credentials=False,
    allow_methods=["GET","POST","PATCH","PUT","DELETE"],allow_headers=["Authorization","Content-Type"])
app.include_router(router)

@app.get("/health",response_model=HealthRead,tags=["Health"],summary="Verificar API e conexão PostgreSQL",
         responses={500:{"description":"PostgreSQL indisponível."}})
def health(db: Session = Depends(get_db)):
    return check_health(db)
