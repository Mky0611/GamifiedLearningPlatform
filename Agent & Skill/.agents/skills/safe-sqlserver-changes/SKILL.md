---
name: safe-sqlserver-changes
description: "Review Java 17 Spring Boot 3.3.5 JPA and SQL Server code without destructive migrations."
---
# safe-sqlserver-changes
## Workflow
1. Inventory schema, entities and JPA timestamp fields; reproduce insert/update failures if dev DB exists.
2. Identify missing defaults and `@Column(insertable=false)` inconsistencies with actual SQL Server T-SQL semantics.
3. Propose SQL Server migration DDL separately with backfill strategy, compatibility and rollback.
4. Inspect progression XP/coins for transaction and idempotency; test duplicate reward submissions.
5. Keep SQL Server datasource and current Java/Spring Boot versions. Postgres-specific advice, `CONCURRENTLY`, RLS and Spring 4 changes are out of scope.
6. Every external database connection must use least-privilege SQL credential; avoid automatic MCP writes.
