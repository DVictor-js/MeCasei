# MeCasei

Aplicativo de planejamento de casamento com tarefas, convidados, orçamento e agenda conectados. O mobile usa Expo SDK 57, React Native, MVVM e SQLite. O **único backend** é FastAPI com PostgreSQL.

Repositório oficial: https://github.com/DVictor-js/MeCasei · Versão: **2.5.2**.

## Quero ver a API / Swagger

**Pré-requisito: Docker Desktop iniciado.** Não precisa instalar Python, PostgreSQL, Alembic ou Uvicorn no computador.

Na pasta do projeto clonado/extraído, configure o ambiente uma vez:

```powershell
Copy-Item backend/.env.example backend/.env
# Edite backend/.env: troque JWT_SECRET_KEY=CHANGE_ME por uma chave aleatória de pelo menos 32 caracteres.
docker compose up --build
```

Se `.env` já existir, preserve seus valores. Como gerar a chave está no [README técnico](backend/README.md). O exemplo é propositalmente inválido: a API rejeita CHANGE_ME, segredo vazio ou curto.

Depois do build, abra:

| Recurso | Endereço |
| --- | --- |
| API | http://localhost:8000 |
| Swagger | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |
| OpenAPI | http://localhost:8000/openapi.json |
| Health | http://localhost:8000/health |

O Compose sobe PostgreSQL, aguarda o banco saudável, aplica **alembic upgrade head** e inicia FastAPI. `/health` confirma a conexão PostgreSQL e retorna `{"status":"ok"}`. Falha de migration impede o início da API; não há reset automático de dados.

Banco: **host 5433 → container 5432**. API conecta ao hostname Docker **postgres**; não usa localhost para falar com o banco dentro do container. PostgreSQL do Windows em 5432 pode continuar ligado.

## Quero abrir o aplicativo

**Pré-requisitos: Node.js 22.13+ e Expo Go compatível com SDK 57.** Na raiz:

```powershell
npm.cmd ci
npm.cmd run start:tunnel
```

Abra Expo Go e escaneie o QR Code. Escolha **Continuar neste dispositivo** para usar onboarding, tarefas, convidados, finanças e agenda com SQLite local. Essa experiência não exige backend, hospedagem, conta Railway nem arquivo `.env` para a API. Não é necessário instalar Expo globalmente.

**Expo Tunnel atende somente Metro/Expo. Ele não cria túnel para FastAPI.** O suporte `@expo/ngrok` é uma dependência de desenvolvimento do bundler, não um túnel da API. Se você já clonou o projeto, `npm.cmd ci` instala esse suporte.

## Quero testar aplicativo + API

1. Configure backend/.env como acima e execute `docker compose up --build`.
2. Rode `ipconfig` e encontre o IPv4 do computador na rede usada pelo celular.
3. Copie `.env.example` para `.env` na raiz, se ainda não existir, e configure `EXPO_PUBLIC_API_URL=http://IP-DO-PC:8000`.
4. Execute `npm.cmd ci` e `npm.cmd run start:tunnel`.

**localhost no celular físico é o próprio celular, não o computador.** O celular deve alcançar a rede local e a porta 8000 da API; o firewall pode precisar permitir essa porta. Android Emulator normalmente usa `http://10.0.2.2:8000`; iOS Simulator no mesmo Mac pode usar `http://localhost:8000`. Reinicie Expo depois de mudar a URL.

Login e cópia remota exigem a API configurada. Ao entrar, escolha explicitamente **Salvar na minha conta** para importar seu planejamento local. Sem conexão, os dados locais permanecem; Mais permite tentar sincronizar novamente. Ainda não há restauração em outro aparelho nem merge de conflitos.

## Estrutura e bancos

| Caminho | Responsabilidade |
| --- | --- |
| `app/` | Rotas Expo Router e composição mínima |
| `src/` | Aplicativo React Native em MVVM, incluindo cliente HTTP, SQLite e sync |
| `backend/` | ÚNICO backend FastAPI |
| `docs/` | Documentação arquitetural e opções futuras |
| `docker-compose.yml` | Infraestrutura local: API + PostgreSQL |

```text
MeCasei mobile (MVVM) → SQLite local/offline
                           ↓ sync / HTTP
                      FastAPI Docker :8000
                           ↓ postgres:5432
                      PostgreSQL (host 5433)
```

SQLite é o banco local do aplicativo. PostgreSQL é o banco do backend. **Não existem dois backends.** [Arquitetura](ARCHITECTURE.md) · [Entrega](ENTREGA-FASE-2-5-2.md).

## Configuração e comandos úteis

Backend: APP_ENV, DATABASE_URL, JWT_SECRET_KEY, PORT e CORS_ALLOWED_ORIGINS. O Compose configura `development`, porta 8000 e hostname `postgres`. As variáveis antigas ENVIRONMENT/CORS_ORIGINS continuam compatíveis. Sem cookies de sessão: JWT usa header Authorization e CORS permite apenas origens web explícitas, sem wildcard/credentials.

Mobile: EXPO_PUBLIC_API_URL é uma URL pública de conexão, sem tokens. A raiz também pode configurar `API_PORT` e `POSTGRES_PORT` se os padrões estiverem ocupados. Para reutilizar volume anterior, configure POSTGRES_VOLUME e POSTGRES_VOLUME_EXTERNAL=true; não substitua `.env` existente nem apague o volume para atualizar.

```powershell
docker compose up --build -d
docker compose ps
docker compose logs -f api
docker compose stop  # preserva o banco
```

Swagger e OpenAPI são parte da entrega. No Swagger, register/login retornam access_token para **Authorize**; os recursos protegidos continuam exigindo JWT. Postman importa http://localhost:8000/openapi.json ou `backend/docs/openapi.json`, gerado pela própria aplicação:

```powershell
docker compose exec api python scripts/export_openapi.py
```

## Testes

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run doctor
# Crie uma vez o banco de teste; adapte o usuário se necessário:
docker compose exec postgres psql -U mecasei -d postgres -c "CREATE DATABASE mecasei_test"
docker compose exec api pytest tests -q
```

Os testes não dependem de hospedagem externa. Debug Python, migrations, geração de segredo e verificação opcional estão em [backend/README.md](backend/README.md).

## Troubleshooting

| Problema | Solução |
| --- | --- |
| Docker Desktop não iniciado | Abra Docker Desktop e aguarde o engine. |
| npm.ps1 bloqueado | Use npm.cmd/npx.cmd, sem alterar ExecutionPolicy. |
| npm não reconhecido | Instale Node.js e reabra o terminal. |
| Porta 5432 ocupada | Não interfere: Docker usa 5433 no host. |
| 5433 ou 8000 ocupada | Configure as portas do host na raiz e atualize URLs. |
| Swagger não abre / health não responde | Veja `docker compose ps` e `docker compose logs api`; aguarde o build/migrations. |
| .env ausente | API: copie backend/.env.example. Mobile com API: copie o exemplo da raiz. |
| JWT_SECRET_KEY inválida | Gere uma chave aleatória de pelo menos 32 caracteres; CHANGE_ME não inicia a API. |
| Expo Tunnel / @expo/ngrok | Rode npm.cmd ci. O suporte está em devDependencies; se o serviço de tunnel estiver indisponível, tente novamente ou use npm.cmd start na rede local. |
| Celular não acessa localhost | Configure o IPv4 do computador em EXPO_PUBLIC_API_URL e confira rede/firewall. |
| API não conecta ao banco | Confira URL/credenciais. Alterar .env não altera automaticamente a senha já persistida no volume. |

## Deploy futuro / opcional

Dockerfile reutilizável, DATABASE_URL, PORT, APP_ENV, segredo JWT e CORS permitem hospedagem futura, inclusive Railway. **Deploy não é requisito desta fase e nenhum serviço remoto foi criado.** O projeto funciona localmente; não exige domínio ou conta de nuvem. [Opções futuras](docs/DEPLOYMENT.md).
