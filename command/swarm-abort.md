---
description: Abort the current swarm or mission and optionally clean up session files
subtask: true
---

Abort the active swarm or mission session.

## Instructions

1. Find active sessions:
```bash
ls -lt .tmp/sessions/ 2>/dev/null | head -5
```

If no active session:
```
No active session found. Nothing to abort.
```

2. Confirm with user:
```
Found active session: "{task}" ({id})
Current phase: {phase}

Abort this session? (y/n)
Note: code changes already made will NOT be automatically reverted — use git to revert if needed.
```

STOP. Wait for user.

3. If confirmed:
```bash
# Show what's been done so far
cat .tmp/sessions/{id}/execution-report.md 2>/dev/null | head -20

# Remove session files
rm -rf .tmp/sessions/{id}/
```

4. Report:
```
Session aborted and session files removed.

To revert code changes made during execution:
  git diff --stat HEAD    ← see what changed
  git restore .           ← revert all (careful!)
  git restore {file}      ← revert specific file

To start fresh: /swarm "task" or /mission "task"
```
