# MeCasei API — Docker local

O único backend está em `backend/`: FastAPI, SQLAlchemy 2, Alembic, PostgreSQL, Pydantic, JWT e Argon2. O [README principal](../README.md) traz o início rápido. Docker Desktop é o único requisito para executar o backend completo.

## Executar

Na raiz do projeto, na primeira configuração:

```powershell
Copy-Item backend/.env.example backend/.env
# Configure JWT_SECRET_KEY em backend/.env.
docker compose up --build
```

O Compose inicia PostgreSQL, aguarda seu healthcheck, executa Alembic e inicia Uvicorn. A API usa `postgres:5432`; no host, PostgreSQL fica em 5433 e API em 8000. Dados existentes/volume são preservados; não há create_all ou reset no startup. Swagger: http://localhost:8000/docs. ReDoc, OpenAPI e health ficam em `/redoc`, `/openapi.json`, `/health`.

## Ambiente e segredo JWT

| Variável | Função |
| --- | --- |
| APP_ENV | development no Compose; ambientes futuros são configuração opcional |
| DATABASE_URL | Conexão PostgreSQL completa; postgres/postgresql são normalizados para psycopg |
| JWT_SECRET_KEY | Chave aleatória com pelo menos 32 caracteres; vazio/CHANGE_ME/chave curta são rejeitados |
| PORT | Porta Uvicorn; 8000 local, configurável em outro ambiente |
| CORS_ALLOWED_ORIGINS | Origens web explícitas separadas por vírgula; sem wildcard |
| DATABASE_HOST/PORT | Compose ajusta o banco para postgres:5432 |
| POSTGRES_USER/PASSWORD/DB | Inicialização local do PostgreSQL |
| ACCESS_TOKEN_EXPIRE_MINUTES / REFRESH_TOKEN_EXPIRE_DAYS | Validade dos tokens |

Os aliases ENVIRONMENT/CORS_ORIGINS antigos continuam aceitos. O arquivo privado `backend/.env` é ignorado pelo Git e Dockerfile. A imagem recebe variáveis em runtime. Os exemplos contêm apenas placeholders, sem segredos reais.

Gere uma chave usando apenas Windows PowerShell, sem Python instalado:

```powershell
$jwtBytes = New-Object byte[] 48
$jwtGenerator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$jwtGenerator.GetBytes($jwtBytes)
[Convert]::ToBase64String($jwtBytes)
$jwtGenerator.Dispose()
```

Cole o resultado em backend/.env. Se alterar POSTGRES_PASSWORD, ajuste a mesma senha em DATABASE_URL, codificando caracteres especiais. Alterar o arquivo não altera automaticamente a senha já armazenada em um volume existente.

CORS não usa cookies/credentials: JWT vai no header Authorization. Expo Go nativo não depende de CORS de navegador; Swagger é same-origin. Clientes web precisam de origem explicitamente configurada. O default development é http://localhost:8081.

## Estrutura, startup e migrations

`api/v1/router.py` agrega routers explícitos; services mantêm regras, membership e relações; models/schemas são agrupados por domínio. `core/config.py` centraliza o ambiente; `db/` fornece sessões. Versão semântica vem de `app.__version__`.

O entry point `python scripts/start.py` valida configuração, executa `alembic upgrade head`, interrompe se falhar e substitui o processo por Uvicorn em PORT. Compose solicita `--reload` para desenvolvimento. As 15 tabelas e a migration existente são preservadas.

```powershell
docker compose exec api alembic current
docker compose exec api alembic upgrade head
```

Para alterar schema futuramente, crie migration Alembic. Não substitua migrations por create_all nem apague o banco para atualizar.

## Swagger / OpenAPI / Postman

Docs e health são públicos; os recursos exigem JWT/membership. Register/login retornam access_token para Authorize. Sem token, endpoint protegido retorna 401; recurso de outro usuário retorna 404. Refresh/logout mantêm revogação.

```powershell
docker compose exec api python scripts/export_openapi.py
```

FastAPI gera backend/docs/openapi.json. Postman importa esse arquivo ou http://localhost:8000/openapi.json. A fixture anterior é somente teste de compatibilidade, não uma definição manual da API.

## Testes e verificação

Na raiz, crie uma vez o banco isolado (adapte o usuário):

```powershell
docker compose exec postgres psql -U mecasei -d postgres -c "CREATE DATABASE mecasei_test"
docker compose exec api pytest tests -q
docker compose exec api python scripts/check_api.py http://localhost:8000
```

Os testes usam mecasei_test e são independentes de nuvem. Cobrem regras existentes, auth, IDOR, importação, paridade, segredos inválidos, URLs PostgreSQL, CORS e startup/porta. O script de verificação somente lê docs/health/OpenAPI.

Para o teste integrado mobile/API, na raiz com API local em execução:

```powershell
$env:MECASEI_API_INTEGRATION = "1"
node --test tests/sync-integration.cjs
Remove-Item Env:MECASEI_API_INTEGRATION
```

## Python direto — opcional para debugging

Esse fluxo não é necessário para rodar a API com Docker. Se desejar depurar no host, instale Python 3.12+, execute `docker compose up -d postgres` na raiz e pare a API se a porta estiver ocupada (`docker compose stop api`). Dentro de backend:

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe scripts/start.py --reload
```

No macOS/Linux, use `.venv/bin/python`. DATABASE_URL do host aponta para 127.0.0.1:5433. Para pytest direto: `.venv\Scripts\python.exe -m pytest tests -q`.

## Hospedagem futura — opcional

O mesmo Dockerfile aceita DATABASE_URL, JWT_SECRET_KEY, APP_ENV, PORT e CORS por ambiente. Nenhum serviço Railway foi criado, nenhuma URL remota é necessária e deploy não é requisito da Fase 2.5.2. [DEPLOYMENT.md](../docs/DEPLOYMENT.md) registra somente possibilidades futuras.
