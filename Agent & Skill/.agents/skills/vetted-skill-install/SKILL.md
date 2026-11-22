---
name: vetted-skill-install
description: "Review external GitHub agent skills, custom agents and MCP tools before adopting them."
---
# vetted-skill-install
## Workflow
1. Select one clearly relevant skill from a reputable repository. Read its current LICENSE, SKILL.md, scripts and install hooks.
2. Flag network scripts, encoded payloads, shell execution, environment reads, credential access and broad MCP permissions.
3. Confirm the install destination: Antigravity workspace `.agents/skills/<name>/SKILL.md`, Claude `.claude/skills/`, Gemini CLI `.gemini/skills/` as applicable.
4. Do not blindly copy Claude subagents to Antigravity: validate tool names and YAML frontmatter with official docs.
5. Use Git pins; ask before running installers; install project-scoped only. Review diffs and rollback instructions.
