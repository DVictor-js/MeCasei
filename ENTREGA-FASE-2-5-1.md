# Entrega — MeCasei Fase 2.5.1

## Baseline registrada antes da refatoração

TypeScript e lint passaram; a suíte mobile teve 22 testes aprovados e 1 teste integrado opt-in ignorado. A primeira execução backend falhou porque o Docker Desktop/PostgreSQL estavam desligados. Após iniciar o serviço existente, os 6 testes backend passaram sem alteração do código. O OpenAPI anterior foi exportado para comparação de contrato.

Problemas encontrados: rotas principais misturam renderização, estado, ações e cálculos; componentes de edição coordenam persistência diretamente; arquivos mobile espalhados na raiz; routers FastAPI registrados dinamicamente em resources.py; modelos/schemas concentrados; Compose restrito ao banco e à porta 5432 do host; README com caminho absoluto de uma máquina. A busca em código ativo e testes não encontrou dependência de outputs/ (somente a exclusão do TypeScript).

## Refatoração

Esta fase reorganizou código e execução; nenhuma funcionalidade de produto nova foi implementada. Não houve redesign, mudança de regra financeira, migração de tecnologia backend ou avanço para Modo Decisão/Fase 3.

## Estrutura antes/depois

Antes: rotas e UI em `app/`, componentes/hooks/services/database/types/utils/constants/forms na raiz; routers genéricos em `backend/app/api/resources.py`; modelos/schemas concentrados; Compose apenas de PostgreSQL dentro de backend; cópias históricas em outputs.

Depois: `app/` contém exports/composição mínima; `src/core/` concentra API, SQLite, sessão, sync, identidade e navegação; `src/features/` agrupa auth, home, planning, guests, finances, wedding e organization; `src/shared/` reúne UI, ViewModels de edição/listas, definições de formulário, tipos e helpers. O único backend continua em `backend/`. Há um único Compose, na raiz, para API e PostgreSQL. `outputs/` foi removido e o ZIP da entrega anterior foi preservado fora do projeto.

O [mapa de movimentações](docs/MOBILE-MOVES.md) registra 70 arquivos movidos/extraídos. As antigas pastas da raiz foram removidas; imports usam aliases para `src/`. Testes existentes mantiveram suas verificações e receberam apenas os ajustes necessários de resolução de imports.

## MVVM

- Views renderizam e navegam; não executam SQL, fetch, operações de domínio ou sincronização.
- ViewModels de Home, Planejamento, Convidados, Finanças, Casamento e Auth carregam estado, preparam dados e coordenam ações. Mais, importação, startup, subtarefas e resumo de fornecedor também receberam ViewModels.
- Formulários/listas compartilham `useEntityEditorViewModel` e `useCollectionViewModel`, usados também por eventos e compromissos. Essa reutilização evita duplicar editores por feature.
- Models existentes foram preservados em suas features, com repositório local em `core/database`, cliente remoto em `core/api` e coordenação em `core/sync`. Home permanece baseada no SQLite.
- Um teste de fronteiras protege rotas enxutas e impede acesso a dados diretamente pelas Views.

## FastAPI e contrato

`backend/app/api/v1/router.py` agrega routers explícitos em `endpoints/`: auth, weddings, tasks, guests, guest_groups, events, budget, budget_categories, vendors, payments, appointments e imports. `resources.py` e os routers antigos foram removidos. Persistência comum é compartilhada em um service; não há registro dinâmico de rotas.

Modelos e schemas foram agrupados em user/auth, wedding, planning, guests, finances, organization e sync. Services coordenam membership, vínculos, pagamentos, conclusão de tarefas, orçamento e importação. JWT, Argon2, SQLAlchemy 2 e PostgreSQL continuam.

OpenAPI foi exportado antes e depois. O teste compara paths, métodos, parâmetros, security, request/response schemas e todos os schemas anteriores. Passou sem quebra de contrato. A única exceção documental é `/health`, cujo corpo existente `{"status":"ok"}` agora tem response_model explícito. Nenhuma migration de banco nova foi criada. Hashes das migrations SQLite/Alembic e contagens das tabelas de desenvolvimento foram preservados.

## Swagger e OpenAPI

Metadados da API e tags: Authentication, Weddings, Planning, Guests, Events, Finances, Vendors, Payments, Appointments, Import & Sync e Health. Endpoints receberam summaries, modelos de resposta, erros documentados e descrições onde úteis.

`/docs`, `/redoc`, `/openapi.json` e `/health` responderam 200 no Compose principal e na instalação com volume vazio. `backend/scripts/export_openapi.py` gera `backend/docs/openapi.json` usando FastAPI. Postman importa esse arquivo ou a URL; não existe coleção manual paralela. `backend/scripts/healthcheck.py` usa somente a biblioteca padrão Python.

## Docker e dados

Compose canônico na raiz sobe PostgreSQL 17 + API. PostgreSQL usa porta 5432 interna e 5433 no host, configurável por ambiente. API conecta a `postgres:5432`, espera o health do banco, aplica Alembic e inicia Uvicorn. A configuração é de desenvolvimento; produção exige migrations como etapa explícita, sem reload/bind mounts.

O volume anterior foi reutilizado como externo, preservando seus registros. Em uma segunda execução isolada com volume vazio, a inicialização criou as 15 tabelas e chegou a `0001_initial (head)`. Os containers de teste foram encerrados. O Compose antigo dentro de backend foi removido.

## Comandos exatos

Mobile local, na raiz, primeira instalação:

```powershell
npm.cmd ci
Copy-Item .env.example .env
npm.cmd start
# Se necessário, apenas para o bundler:
npm.cmd run start:tunnel
```

API, na raiz:

```powershell
Copy-Item backend/.env.example backend/.env
# Configure JWT_SECRET_KEY em backend/.env.
docker compose up --build
# Swagger: http://localhost:8000/docs
```

Full stack: configure `EXPO_PUBLIC_API_URL=http://SEU_IP:8000` no `.env` da raiz, depois inicie Expo. O túnel Expo não cria túnel da API. Leia [README principal](README.md) para portas/firewall e [README backend](backend/README.md) para Python direto, Alembic, variáveis e testes.

## Validações finais

- TypeScript e lint passaram.
- Mobile: 23 testes aprovados, zero falhas, 1 integrado opt-in ignorado na suíte comum. O integrado foi executado separadamente e passou, com API/PostgreSQL reais: importação, UUIDs, persistência, envio de tarefa e alteração offline pendente.
- Backend: 8 testes aprovados no host e no container. Incluem os 6 testes anteriores e os novos testes de paridade OpenAPI/documentação/health.
- Expo Doctor: 21/21; `expo install --check`: dependências alinhadas.
- Foram necessárias correções oficiais de patch para a validação atual: Expo 57.0.26, Constants 57.0.20, Router 57.0.24. SDK continua 57; React 19.2.3 e React Native 0.86.3 permanecem.
- Bundles finais Android, iOS e Web exportados com sucesso após os patches, em `work/refactor-final-export`.

## Problemas conhecidos

Os avisos de depreciação de react-test-renderer e TestClient/httpx permanecem nos testes. O npm reportou 30 alertas de auditoria de dependências (10 moderados e 20 altos); não foi aplicado audit fix --force nem alterado o SDK principal para tratá-los. A revisão desses alertas está fora desta refatoração.

A validação desta fase usou os testes de formulários/navegação em 320–430dp e os bundles; a homologação em aparelho físico não foi repetida. Permanecem os limites de sync da Fase 2.5: sem restauração em aparelho novo, merge de conflitos ou retry automático garantido. Uma criação remota com resposta perdida ainda pode exigir reconciliação.
