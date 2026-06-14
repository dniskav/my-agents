---
description: List all missions in the current project — completed, active, and interrupted
---

You are listing all missions tracked in the current project.

## Instructions

### Step 1: Find mission reports (completed missions)

```bash
find . -name "mission-report.md" -not -path '*/node_modules/*' -not -path '*/.git/*' 2>/dev/null
```

For each `mission-report.md` found, read its header to extract:
- Task description
- Date
- Completion %

### Step 2: Find active / interrupted sessions

```bash
ls .tmp/sessions/ 2>/dev/null | grep "mission"
```

For each session directory, read its `manifest.json` to extract:
- Task
- Last activity timestamp
- Current phase
- Completion state

### Step 3: Present the list

```
## Missions in this project

### ✅ Completed
| Date | Task | Completion | Report |
|------|------|-----------|--------|
| 2026-05-04 | Add dark mode | 95% | mission-report.md |
| 2026-05-03 | Auth system | 100% | auth/mission-report.md |

### ⏸️ Active / Interrupted
| Session | Task | Last activity | Status |
|---------|------|--------------|--------|
| 20260504-143022-mission-checkout | Checkout flow | 2h ago | Execution phase |

### Actions
- Resume interrupted mission: /mission-continue
- Start new mission: /mission "description"
- Start fast PoC: /tiny-mission "description"
```

If no missions found:
```
No missions found in this project.
Start one with /mission "description" or /tiny-mission "description"
```
