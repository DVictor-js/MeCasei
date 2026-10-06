# Entrega — MeCasei Fase 2.5

## Resultado

O projeto existente foi atualizado **Expo SDK 54 → 55 → 56 → 57**, nesta ordem. Estado final: Expo `57.0.25`, React `19.2.3`, React Native `0.86.3`, Expo Router `57.0.23` e `expo-sqlite` `57.0.3` no lockfile. As cinco abas e as rotas Stack permanecem em Expo Router, sem imports diretos de `@react-navigation/*` nas telas. A identidade e o nome continuam centralizados em `constants/identity.json`/`constants/brand.ts` e `app.config.ts`.

O MVP local da Fase 2 foi preservado: onboarding, Hoje, tarefas/subtarefas, convidados/grupos/RSVP, eventos, compromissos, orçamento/categorias, fornecedores e pagamentos. O banco local continua `mecasei.db`, com WAL, foreign keys e migrations incrementais. A nova migration SQLite `004_sync` cria `sync_entities` e `app_settings` sem alterar os dados das entidades.

## Backend entregue

`backend/` contém FastAPI, SQLAlchemy 2, Pydantic, PostgreSQL, Alembic, Docker Compose, Dockerfile e testes. A migration PostgreSQL `0001_initial` cria 15 tabelas: `users`, `weddings`, `wedding_members`, `tasks`, `task_subtasks`, `guest_groups`, `guests`, `wedding_events`, `guest_event_invitations`, `budget_categories`, `vendors`, `payments`, `appointments`, `auth_sessions` e `import_jobs`.

Em `/api/v1` há registro, login, refresh, `/auth/me`, logout; casamentos e resumo financeiro; CRUD de tarefas, convidados, grupos, eventos, categorias, fornecedores, pagamentos e compromissos; subtarefas e convites por evento; importação transacional e idempotente. Listagens aceitam paginação, e tarefas/convidados têm filtros simples. `/docs`, `/redoc` e `/health` estão disponíveis. Todo recurso de casamento exige membership e vínculos entre entidades são conferidos no mesmo casamento. Os IDs remotos são UUIDs.

Senhas são hashes Argon2; access/refresh tokens são JWT com sessão revogável. Configuração e segredos vêm do ambiente. A regra financeira distingue orçamento total, categorias distribuídas, valor contratado, valor pago, parcelas pendentes cadastradas e saldo contratado a pagar.

## Integração mobile entregue

`services/api/` centraliza HTTP, autenticação e tokens. `expo-secure-store` guarda a sessão no app nativo. `.env.example` documenta `EXPO_PUBLIC_API_URL`. As telas `app/auth/` permitem boas-vindas, login, cadastro e escolha explícita de importação. Um planejamento já existente não é enviado automaticamente. `services/sync/importLocal.ts` envia casamento e relações em snapshot; `localMapping.ts` guarda o mapeamento local↔remoto; `syncCoordinator.ts` tenta enviar alterações posteriores e mantém as offline como pendentes. A Home e as listas continuam lendo SQLite. Mais mostra estado de conta/sync e oferece retry manual e logout, sem apagar os dados locais.

## Validação executada

- Checkpoint A: TypeScript, lint, 21 testes, Expo Doctor 21/21, `expo install --check` e export de bundles Android/iOS passaram.
- Checkpoint B: Alembic aplicado em PostgreSQL de desenvolvimento e de teste; 6 testes da API passaram, incluindo autenticação, IDOR entre usuários, relações, regras financeiras e importação atômica/idempotente.
- Checkpoint C: TypeScript e lint passaram; 22 testes Node passaram e 1 teste integrado opt-in ficou ignorado no `npm test` normal. O teste integrado separado, com SQLite + API real + PostgreSQL, passou. Expo Doctor 21/21, `expo install --check` e export Android/iOS passaram.
- Expo Go SDK 57.0.9 no emulador Android: onboarding local com Alex & Dani, 22/05/2027, Sao Paulo, 120 pessoas e R$ 60.000; 12 tarefas geradas; cinco abas abriram; casamento/tarefas persistiram após fechar e reabrir. Cadastro de conta, importação escolhida pelo usuário e sessão persistida após reabrir passaram. Mais mostrou **Sincronizado**. Uma tarefa criada pelo app após a importação gerou HTTP 201 no backend. Logout seguido de **Continuar neste dispositivo** manteve Alex & Dani e as 13 tarefas locais.

## Limitações e pendências

- O teste de migração preservando dados da Fase 2 foi automatizado; a instalação antiga do Expo Go no emulador foi substituída para SDK 57, então não houve teste nativo com o mesmo sandbox antigo.
- O teste integrado automatizado cobriu tarefa offline pendente. O cenário offline não foi repetido manualmente no emulador.
- Sync não restaura dados em um aparelho novo, não faz merge de mudanças concorrentes e não garante retry automático em segundo plano. A criação remota após perda da resposta ainda não tem idempotência por entidade.
- Compartilhamento do casal, Modo Decisão, RSVP público e demais recursos futuros continuam fora do escopo. Nenhuma tela de promessa desses recursos foi adicionada.
- Para uso real fora da rede de desenvolvimento, são necessários HTTPS, hospedagem da API/PostgreSQL, configuração de firewall, backups e políticas de operação.

## Executar

No mobile, instale Node 22 e rode `npm ci`, copie `.env.example` para `.env`, ajuste `EXPO_PUBLIC_API_URL` para o IP local do computador, então execute `npm start` (ou `npm run android`). Não é necessário instalar Expo globalmente. Para usar somente SQLite, escolha **Continuar neste dispositivo**.

No backend, entre em `backend/`, copie `.env.example` para `.env`, defina `POSTGRES_PASSWORD`, a mesma senha em `DATABASE_URL` e `JWT_SECRET_KEY`. Depois crie um virtualenv Python 3.12+, instale `requirements.txt`, rode `docker compose up -d postgres`, `alembic upgrade head` e `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`. Instruções completas e de testes em [backend/README.md](backend/README.md).

## Verificação final

Após o ajuste de versão para `0.2.5`, `npm run typecheck` e `npm run lint` passaram; `npm test` terminou com **22 aprovados, 0 falhas, 1 integrado opt-in ignorado**. `npm run doctor` passou **21/21** e `npx expo install --check` informou dependências alinhadas. Os **6 testes backend** passaram. O teste integrado opt-in foi executado separadamente e passou. `npx expo export --platform all` gerou bundles **Android, iOS e Web** em `work/final-export` sem erro. Há dois avisos de depreciação em dependências da suíte Python e avisos de `react-test-renderer` em testes legados; nenhum causou falha.
