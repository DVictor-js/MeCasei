# Arquitetura — Fase 2.5.1

`app/` + `src/` formam o aplicativo mobile. `backend/` é o único backend, usando FastAPI. SQLite é o banco local do aparelho; PostgreSQL é o banco remoto do backend. São duas camadas de armazenamento, não dois backends.

```text
View (interface e navegação)
  ↓
ViewModel (hooks: estado, loading, error, refresh e ações)
  ↓
Model / Repository (entidades, domínio e persistência)
  ↓
SQLite / cliente HTTP

Expo → SQLite → Sync → FastAPI → PostgreSQL
```

## Mobile

```text
app/                  rotas Expo Router e composição mínima
src/core/
  api/                cliente HTTP e interfaces remotas
  database/           SQLite: migrations e repositório local
  session/            sessão e SecureStore
  sync/               importação, mapeamento e fila
  theme/              identidade, tokens e opções
  navigation/         providers e layouts Router
src/features/
  auth/ home/ planning/ guests/ finances/ wedding/ organization/
src/shared/
  components/         Views reutilizadas e componentes visuais
  viewmodel/          carregamento, feedback e editores compartilhados
  models/             formulários, validação e seleção de registros
  types/ utils/       entidades, dinheiro, datas e confirmação visual
```

Features separam domínio em `model/`, hooks em `viewmodel/` e renderização em `view/`. `useHomeViewModel`, `usePlanningViewModel`, `useGuestsViewModel`, `useFinancesViewModel`, `useWeddingViewModel` e `useAuthViewModel` preparam dados e coordenam ações. Views decidem navegação e não executam SQL, HTTP ou sync. Formulários/listas reutilizam `EntityEditor`/`CollectionScreen` com `useEntityEditorViewModel`/`useCollectionViewModel`; organização também usa esses ViewModels, evitando cópias por domínio. Auth reutiliza o Model central em `core/session` e `core/api`.

Rotas principais exportam Views; secundárias compõem a View reutilizada com entidade/etapa. Aliases `@/core`, `@/features`, `@/shared` apontam para `src/`. [Mapa dos arquivos movidos](docs/MOBILE-MOVES.md).

`mecasei.db`, migrations 001–004, WAL, foreign keys e `user_version` permanecem. IDs locais não foram convertidos. Dinheiro permanece inteiro em centavos. Orçamento total, distribuído, contratado, pago e parcelas pendentes continuam medidas distintas.

## Backend único

```text
backend/app/
  main.py              composição FastAPI, metadados e health
  api/v1/router.py     composição de routers explícitos
  api/v1/endpoints/    auth, weddings, tasks, guests, guest_groups,
                       events, budget, budget_categories, vendors,
                       payments, appointments, imports
  services/            domínio e operações autorizadas
  models/ schemas/     SQLAlchemy/Pydantic agrupados por domínio
  core/ db/            ambiente, JWT/Argon2, engine e sessões
```

Endpoints recebem input, usam autenticação e chamam services. Membership, vínculos, status/data de tarefa e pagamento, orçamento e importação continuam centralizados. `services/records.py` compartilha persistência; não registra rotas. Todos os caminhos/métodos estão explícitos nos routers. O contrato preserva inclusive parâmetros legados.

As 15 tabelas, constraints, índices, UUIDs, `auth_sessions`, `import_jobs` e Alembic `0001_initial` permanecem. Mover modelos não exigiu nova migration.

## Sessão, importação e sync

Tokens nativos ficam no SecureStore. API usa JWT/Argon2, valida membership e revoga sessão no logout. `EXPO_PUBLIC_API_URL` configura o mobile; segredos/conexão ficam no ambiente backend.

O usuário escolhe importar o planejamento local. API cria snapshot em transação idempotente por `client_import_id`; mobile registra local ID↔UUID em `sync_entities`. SQLite continua fonte imediata da Home/listas. Alterações ficam `dirty` e são enviadas pelo coordenador, com retry manual em Mais. Logout preserva o banco.

Permanecem os limites da Fase 2.5: sem restauração em aparelho novo, merge de conflitos ou retry automático garantido em segundo plano. Criação remota com resposta perdida pode precisar de reconciliação.

## OpenAPI e execução

`/docs`, `/redoc` e `/openapi.json` vêm da mesma instância FastAPI. `backend/scripts/export_openapi.py` exporta o contrato oficial. A fixture OpenAPI gerada da Fase 2.5 serve apenas para teste de compatibilidade.

O único Compose, na raiz, sobe PostgreSQL + API. Banco usa 5432 internamente e 5433 no host; API usa hostname `postgres`. Um volume anterior pode ser reutilizado como externo. Em desenvolvimento, Alembic roda antes do Uvicorn; produção exige migrations como etapa explícita. README da raiz é a porta de entrada.

## Execução — Fase 2.5.2

O fluxo oficial é local: configurar backend/.env, executar docker compose up --build e abrir Swagger em http://localhost:8000/docs. Apenas Docker Desktop é necessário para o backend completo. O Compose aguarda PostgreSQL saudável, usa postgres:5432 e publica banco em 5433/API em 8000.

O mobile continua disponível com SQLite sem backend; conexão com a API local usa EXPO_PUBLIC_API_URL e o IPv4 do computador no celular físico. Expo Tunnel atende somente Metro, sem expor FastAPI.

A configuração genérica centraliza APP_ENV, DATABASE_URL, JWT_SECRET_KEY, PORT e CORS_ALLOWED_ORIGINS, com aliases anteriores. Segredo inválido impede startup. O script portátil aplica migrations antes de Uvicorn e interrompe se falharem. CORS usa origens explícitas, sem cookies/credentials; os recursos continuam protegidos por JWT.

Dockerfile e variáveis permitem hospedagem futura opcional. Railway não é requisito, não foi provisionado e não há URL fictícia/conta remota necessária. A versão 2.5.2 foi escolhida explicitamente para esta entrega de software, sem derivação automática do nome da fase.
