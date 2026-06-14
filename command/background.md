---
description: Check history and status of recent mission and swarm sessions running in the background
---

# Background Sessions

Show the status of active and recent mission/swarm sessions for the current project.

## task

$ARGUMENTS

## Instructions

### List all sessions (default)

```bash
ls -lt .tmp/sessions/ 2>/dev/null | head -20
```

For each session directory, read `manifest.json`:
```bash
for d in .tmp/sessions/*/; do
  echo "--- $(basename $d) ---"
  cat "$d/manifest.json" 2>/dev/null | grep -E '"task"|"phases"|"iteration"'
  echo
done
```

Display formatted:
```
## Background Sessions

### 🟡 In Progress
session: 20260504-143022-mission-dark-mode
  task: Add dark mode
  phase: execution (step 3 of 6)
  started: 2h ago

### ✅ Completed (last 5)
session: 20260503-091500-mission-auth
  task: Authentication system
  phase: closed
  report: mission-report.md

### No failed sessions
```

### If a session ID is provided as argument

```bash
cat .tmp/sessions/{arg}/manifest.json 2>/dev/null
cat .tmp/sessions/{arg}/execution-report.md 2>/dev/null
```

Show full details of that specific session.

### If no sessions exist

```
No background sessions found in .tmp/sessions/.

Start one with:
  /mission "your task"   ← full structured workflow
  /swarm "your task"     ← parallel execution for simpler tasks
```

## Notes

- Sessions are stored in `.tmp/sessions/` within the project directory
- To resume an interrupted session: `/mission-continue`
- To check swarm progress: `/swarm-status`
- To abort a session: `/swarm-abort`
