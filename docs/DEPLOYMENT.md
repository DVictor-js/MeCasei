# Deploy futuro — opcional

**O fluxo oficial da Fase 2.5.2 é local: configurar backend/.env e executar docker compose up --build.** Railway ou outra hospedagem não é requisito, não foi provisionada e não precisa de conta/domínio para o projeto funcionar.

O repositório oficial é https://github.com/DVictor-js/MeCasei. O monorepo tem um único backend em `backend/`, com o mesmo `backend/Dockerfile` usado localmente. Não crie backend-demo, outra pasta ou outro repositório da API.

Se houver interesse em hospedar posteriormente:

- Use `backend/` como raiz do serviço e seu Dockerfile.
- Forneça DATABASE_URL de um PostgreSQL privado, JWT_SECRET_KEY forte, APP_ENV apropriado e CORS_ALLOWED_ORIGINS explícito.
- O CMD `python scripts/start.py` aplica Alembic antes de Uvicorn, interrompe o startup se a migration falhar e respeita PORT da plataforma (fallback 8000). Não execute migrations durante build.
- Não configure DATABASE_HOST/PORT de banco do Compose nesse serviço; forneça a URL completa. URLs postgres:// e postgresql:// são normalizadas para psycopg.
- Publique apenas a API, configure `/health` e preserve dados/volume do banco. Não copie `.env` ou segredos para o Git/imagem.
- Depois de obter uma URL HTTPS real, configure EXPO_PUBLIC_API_URL no mobile, teste auth/CRUD/persistência e atualize a documentação. Não há URL fictícia nem domínio remoto necessário agora.

No Railway, esse preparo pode ser aplicado manualmente a um serviço ligado ao mesmo monorepo, com Root Directory `/backend`. A interface/provisionamento e os testes remotos seriam parte de uma futura etapa autorizada. Demo não deve ser confundida com produção nem conter dados pessoais sensíveis.

Expo Tunnel atende somente Metro; não expõe FastAPI. Para mobile com backend local, use o IPv4 do computador conforme o README. Testes backend e mobile permanecem locais e independentes de nuvem.

Referências opcionais: [Railway monorepo](https://docs.railway.com/deployments/monorepo), [Dockerfile](https://docs.railway.com/builds/dockerfiles), [healthcheck/PORT](https://docs.railway.com/deployments/healthchecks).
