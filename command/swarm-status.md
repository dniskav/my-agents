---
description: Check the status of the current swarm or mission session
subtask: true
---

Check the status of active mission/swarm sessions in the current project.

## Instructions

1. Find active sessions:
```bash
ls -lt .tmp/sessions/ 2>/dev/null | head -10
```

2. For each session, read its `manifest.json`:
```bash
cat .tmp/sessions/{id}/manifest.json 2>/dev/null
```

3. Display formatted status:

```
## Active Sessions

### 20260504-143022-mission-dark-mode
Task: Add dark mode support
Last activity: 2 hours ago
Progress:
  ✅ Intake
  ✅ Interview
  ✅ Plan approved
  ⏸️ Execution (in progress)
  ⬜ Verification
  ⬜ Closure

### No other active sessions
```

4. If no sessions found:
```
No active mission or swarm sessions found in .tmp/sessions/.
Start one with /mission "task" or /swarm "task"
```
