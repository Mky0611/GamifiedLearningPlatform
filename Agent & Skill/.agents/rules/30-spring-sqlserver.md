---
trigger: model_decision
description: "Use for Java services, SQL Server/JPA entities, schema migrations, rewards, session handling or API security."
---
# Existing Java / SQL Server rules
- Maintain Java 17, Spring Boot 3.3.5, JPA and Microsoft SQL Server; do not switch to Postgres or Spring Boot 4 due to third-party skill defaults.
- Investigate NOT NULL timestamps vs insertable=false mappings with reproducible tests before changing entities/schema.
- Verify combat rewards, XP and coins are idempotent and server-validated. No client-trusted userId without authenticated principal.
- For schema changes, write a reviewed, non-destructive forward migration and rollback strategy. Never auto-apply DROP/TRUNCATE/DELETE against existing data.
- For any SQL MCP, use a database login with SELECT-only permission and separate nonproduction environment; MCP 'readonly' flags alone are not a DB security boundary.
