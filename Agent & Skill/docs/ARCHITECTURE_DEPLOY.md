# Architecture & Deployment — keep it evolutionary

## Current state (do not rewrite by default)
`Browser HTML/CSS/JS + Phaser3` -> `Spring Boot 3.3.5 monolith /api` -> `SQL Server`. 56 tables, strong coupling in existing data; preserve original production contracts.

## Phase 1–3: Modular monolith recommended
Package boundaries in current Spring Boot: identity, game, learning-content, progress, administration, common. Contracts via service interfaces; shared DB and transaction boundaries until proven necessary to split. Add DTO validation, security, idempotent game result posting, health, logging.

## Phase 4: Docker local
- Docker multi-stage for Spring Boot Java17 using Maven build, runtime slim JRE; compose with persistent SQL Server volume; healthchecks and secret env vars.
- Development SQL Server 2022 EULA and resource prerequisites verified. Avoid bundling SQL data or plaintext password into image.
- Install Maven wrapper if permitted (otherwise build with Maven image), `.dockerignore`, tests before image build.
- Frontend option A: keep Spring Boot serving static assets, simplest release.
- Frontend option B: static assets hosted on Vercel, Spring Boot hosted separately with HTTPS, CORS review and external DB; requires route-base compatibility.
- Current Vercel (Nov 2026) supports OCI Docker container Vercel Functions in beta, including multiple services via `vercel.json`. This **does not** mean local Docker Compose/SQL Server instance can persist as a background process on Vercel. Data is external; containers are request-driven, volatile, have limits and scale-to-zero; ensure Spring boot + SQL Server connection cold starts and resource footprint are acceptable before claiming production-ready.
- Vercel services proof-of-concept: backend Dockerfile, frontend separate service or existing static route; service rewrite `/api/(.*)` backend, others frontend. Set PORT and health endpoints per official docs; check deployment limits and current availability on target plan.

## Proposed microservice split only if justified
Identity Service: auth, sessions, roles
Lexicon Content Service: English/IT sets, words, senses, import approval
Game Session Service: raid/quiz start, turn submit, score events
Progression Service: XP/coins/level/mastery schedule
Analytics/Leaderboard: aggregated read models/event consumers

```
Client -> Gateway/BFF -> Identity
                      -> Game Session -> GameResultPublished (outbox)
                      -> Lexicon Content
                      -> Progression consumes result idempotently
                      -> Analytics consumes sanitized events
```

Each service eventually owns its DB schema; plan data migrations, consistency, API versioning, tracing, auth delegation, retries, metrics, network and costs. Do not attempt a one-PR 56-table split. For a solo educational project, modular monolith is usually easier to stabilize and deploy.

## Deployment acceptance
- `docker compose up --build` app + SQL Server healthy, persistent volume after restart.
- API login and raid routes correct from deployed frontend; no exposed SQL port in production.
- Secrets via environment/manager; no hardcoded local db connection in image.
- Automated migration with rollback strategy and seed safety; never reset real DB.
- CORS strictly scoped, TLS HTTPS, auth validated.
- Real mobile browser test of the deployed site and measured cold starts.

## Official references
- https://vercel.com/kb/guide/does-vercel-support-docker-deployments
- https://vercel.com/backends
- https://docs.docker.com/compose/
- https://docs.spring.io/spring-boot/
