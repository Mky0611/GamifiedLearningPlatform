# 50 — Git Workflow & Branching Conventions

- **Primary Release Line:** Stay on the active feature branch requested (currently `feature/p4b3-rpg-combat-learning`); NEVER create throwaway checkpoint branches or one branch per milestone.
- **Approved Branch Naming:**
  - `main` (protected baseline; NEVER auto-merge or force-push)
  - `feature/short-description`
  - `fix/short-description`
  - `refactor/short-description`
  - `hotfix/short-description`
  (lowercase, kebab-case, concise purpose).
- **Conventional Commits:** `feat(combat):`, `feat(vocabulary):`, `feat(animation):`, `fix(theme):`, `fix(raid):`, `feat(seo):`, `test(qa):`, `docs(release):`, `chore(deploy):`.
- **Safety Boundaries:** NEVER delete local/remote branches autonomously, NEVER `git push --force`, NEVER `git reset --hard`, NEVER merge `main` autonomously.
