---
name: spring-docker-vercel
description: Use when adding Docker Compose, CI/CD and optional Vercel Docker deployment to the existing Java Spring Boot SQL Server project.
---
# Spring Docker Vercel

Read `AGENTS.md`, `docs/SOURCE_AUDIT.md`, and related source files. Provide Vietnamese progress and exact file-level changes.

## Workflow
1. Verify Java version, Maven setup, package layout, SQL Server config, resource files, paths, Spring Security.
2. Create additive Docker multi-stage and compose for development; SQL Server is persistent via volume, secrets via env, backend healthcheck, no schema reset.
3. Run Maven tests, build, Docker compose, API smoke. If tools unavailable, mark NOT RUN.
4. For Vercel, current Docker container functions/Services are supported (beta), but request-driven and ephemeral; require **external SQL Server** and test cold starts/memory/connection. Decide if simpler Vercel static + external API host is better.
5. Microservices proposal only with boundary and measurable need; preserve modular monolith until stable.
## Acceptance
Health endpoint, database persists, no hardcoded secrets, deployment routing `/api`, documented fallback strategy.
