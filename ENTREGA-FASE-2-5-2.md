# Entrega — MeCasei Fase 2.5.2 / software 2.5.2

## Objetivo e escopo final

A orientação final priorizou execução local simples e retirou hospedagem/Railway dos requisitos. Nenhum deploy remoto foi feito, nenhuma conta/projeto Railway foi criado e nenhuma URL fictícia é necessária.

O fluxo oficial é: clonar/extrair, configurar backend/.env com uma chave JWT válida, executar **docker compose up --build** e abrir http://localhost:8000/docs. Apenas Docker Desktop é requisito do backend completo; Python, PostgreSQL, Alembic e Uvicorn rodam nos containers.

Não houve funcionalidade nova, redesign, mudança de stack/MVVM, alteração de regras de negócio ou avanço para Fase 3/Modo Decisão. A versão de software **2.5.2** foi escolhida explicitamente para esta entrega e seu commit; mobile e API a declaram, sem extrair versão do nome de uma fase acadêmica.

## Arquitetura

`app/` + `src/` continuam sendo o mobile em MVVM, incluindo cliente HTTP, SQLite e sync. `backend/` é o único FastAPI. Há um único Dockerfile do backend e um único Compose na raiz com postgres/api.

```text
Mobile / MVVM → SQLite local/offline
                    ↓ sync / HTTP
               FastAPI Docker :8000
                    ↓ postgres:5432
               PostgreSQL (host 5433)
```

App local funciona com **Continuar neste dispositivo**, sem backend/conta/.env da API. Para app + API, configure EXPO_PUBLIC_API_URL com o IPv4 do computador. Expo Tunnel atende somente Metro; não expõe FastAPI. Hospedagem permanece uma opção futura, sem configurar serviços remotos nesta fase.

## Arquivos

Criados: `backend/scripts/start.py`, `backend/scripts/check_api.py`, `backend/tests/test_environment.py`, `docs/DEPLOYMENT.md`, `.gitattributes` e este documento.

Modificados: configuração central e leitura segura da chave JWT, metadados/versionamento FastAPI, Dockerfile, Compose, Alembic ini (remoção da URL fictícia não usada), exemplos de ambiente, gitignore, READMEs, ARCHITECTURE, package.json/lock e OpenAPI exportado. O suporte oficial `@expo/ngrok` foi incluído em devDependencies, para npm ci resolver o requisito de Expo Tunnel localmente.

Nenhuma migration foi criada, removida ou alterada. Hashes dos arquivos app/src/migrations e contagens das tabelas de desenvolvimento foram comparados antes/depois do startup e preservados.

## Ambiente e startup

APP_ENV, DATABASE_URL, JWT_SECRET_KEY, PORT e CORS_ALLOWED_ORIGINS são centralizados. Aliases antigos ENVIRONMENT/CORS_ORIGINS continuam aceitos, com prioridade das novas variáveis. URLs postgres/postgresql são normalizadas para psycopg sem perder hostname, credenciais ou parâmetros.

JWT vazio, curto, CHANGE_ME e o placeholder antigo são rejeitados. SecretStr e ocultação de inputs/repr evitam exibir chaves/conexão nos erros de configuração. Os exemplos não contêm segredos reais.

`python scripts/start.py` valida configuração, aplica Alembic e inicia Uvicorn em PORT. Migration falha impede a API de iniciar. Compose usa development/reload, postgres:5432, healthcheck PostgreSQL e dependência service_healthy, host PostgreSQL 5433/API 8000. Volume existente é preservado; não há reset/create_all.

CORS aceita origens web explícitas, sem wildcard ou cookies/credentials. JWT continua no header Authorization; docs/health são públicos. Configuração genérica de PORT, ambiente e Dockerfile foi mantida para eventual hospedagem futura, não como requisito atual.

## Validações

- Mobile: TypeScript e lint passaram; **23 testes aprovados, zero falhas, 1 integrado opt-in ignorado** na suíte comum.
- Teste integrado executado separadamente: passou com SQLite/API reais, incluindo importação, UUIDs, persistência, envio online e alteração offline pendente.
- Backend: **19 testes aprovados no host e no Docker**. Os oito anteriores foram preservados, e os novos cobrem segredo inválido, aliases, CORS, URL/driver PostgreSQL, falha de migration e porta variável.
- Paridade OpenAPI passou novamente. Paths, request/response schemas e security permaneceram compatíveis; metadados foram atualizados. FastAPI gerou backend/docs/openapi.json.
- Expo Doctor: **21/21**; expo install --check informou dependências alinhadas após instalar o suporte de tunnel.
- Compose com dados existentes: API/PostgreSQL saudáveis; `/health`, `/docs`, `/redoc`, `/openapi.json` responderam corretamente. JWT inválido em container terminou com exit 2 e não iniciou Uvicorn.
- Instalação isolada com volume vazio e exemplo de configuração + segredo gerado: **15 tabelas**, `0001_initial (head)` e os quatro endpoints públicos funcionando. Portas de host alternativas foram usadas somente para esse teste coexistir com a API principal.
- Dockerfile sem override foi testado também com PORT=8123 e URL PostgreSQL em formato genérico; os endpoints funcionaram e `/auth/me` sem token respondeu 401. Esse teste de portabilidade foi local, sem serviço de nuvem.
- Expo Tunnel conectou e ficou pronto no teste. O suporte global não foi detectado pelo runtime Node desta máquina; a dependência de desenvolvimento local resolveu essa execução. Não houve teste novo em aparelho físico nesta fase.

Os containers temporários de verificação são encerrados ao finalizar; a API principal permanece em 8000. Bancos/volumes existentes não são apagados.

## Git / GitHub

Repositório oficial: https://github.com/DVictor-js/MeCasei. Git local foi inicializado em main e origin configurado. Autoria local usa DVictor-js com noreply GitHub, sem alterar identidade global. Commit inicial e tag da versão 2.5.2 são preparados depois da revisão staged.

Gitignore bloqueia .env/backend/.env, ambientes privados, tokens/credenciais, bancos, caches, node_modules, virtualenvs e temporários. Os dois .env.example permanecem incluídos. Antes do commit/push, arquivos staged são conferidos contra os segredos reais locais. Exemplos/fixtures contêm apenas dados fictícios ou placeholders públicos.

O resultado do push e o identificador do commit são informados ao final da sessão. Se não houver autenticação disponível, execute na pasta original com .git:

```powershell
git status
git remote -v
git push -u origin main --follow-tags
```

Git Credential Manager pode abrir o login GitHub na execução interativa. Não coloque token no origin nem use force push para esse repositório novo.

## Comandos

API, primeira configuração:

```powershell
Copy-Item backend/.env.example backend/.env
# Gere/configure JWT_SECRET_KEY.
docker compose up --build
# Swagger: http://localhost:8000/docs
# Health: http://localhost:8000/health
```

App com SQLite:

```powershell
npm.cmd ci
npm.cmd run start:tunnel
```

App + API: suba Docker, descubra IPv4 com ipconfig, configure EXPO_PUBLIC_API_URL=http://IP-DO-PC:8000 no .env da raiz e execute o script de tunnel. localhost no celular é o próprio celular.

## Limitações e opção futura

Deploy não é requisito e não foi realizado. Caso seja desejado futuramente, configurar serviço/banco/domínio/segredos e validar remoto será outra etapa; [DEPLOYMENT.md](docs/DEPLOYMENT.md) é opcional.

Persistem os limites de sync e as depreciações de test-renderer/TestClient. npm reportou **31 alertas de auditoria (11 moderados e 20 altos)** após incluir o suporte de desenvolvimento do tunnel; não foi executado audit fix --force nem alterado SDK para contorná-los. Não são segredos no Git, mas pedem revisão de dependências separada. O serviço externo de tunnel pode ficar indisponível; o app também possui npm start para rede local.
