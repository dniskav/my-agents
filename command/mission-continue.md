---
description: Resume an interrupted mission from its last saved state
---

You are resuming an interrupted mission. Read the session state and continue from exactly where it left off.

---

## Step 1: Find the active session

```bash
ls -lt .tmp/sessions/ 2>/dev/null | grep "mission" | head -10
```

If no sessions found:
```
No mission sessions found in .tmp/sessions/.
Start a new mission with /mission "description"
```

If multiple sessions found, list them and ask the user to pick. STOP and wait.

---

## Step 2: Load session state

Read `.tmp/sessions/{id}/manifest.json` and all session files that exist:
- `intake.md`, `interview.md`, `plan.md`
- `execution-report.md` (if exists)
- `verification-report.md` (if exists)

---

## Step 3: Orient the user

```
## Resuming Mission: {task}
Session: {id} | Last activity: {time ago}

Progress:
✅/⬜ Intake
✅/⬜ Interview
✅/⬜ Plan approved
⏸️/⬜ Execution (step X of Y if partial)
⬜ Verification
⬜ Closing report

Resuming from {phase}...
```

---

## Step 4: Continue from the right phase

| Last completed phase | Resume at |
|---|---|
| `intake_complete` only | Phase 1 (interview) |
| `interview_complete` | Phase 2 (planning) |
| `planning_complete` | Phase 3 (approval gate) — re-show plan |
| `plan_approved` | Phase 4 (execution) — check execution-report for completed steps |
| `execution_complete` | Phase 5 (verification) |
| `verification_complete` | Phase 6 (report to user) |

### Resuming execution

Read `execution-report.md` to find which tasks were completed.
Read `plan.md` to find which tasks remain.
Resume `delegate_task` calls for the pending tasks, skipping what's already done.

### Resuming after context prune (DCP)

If DCP notified you of a context prune:
1. Stop immediately
2. Read `.tmp/sessions/{id}/manifest.json`
3. Read relevant phase files
4. Announce: "Context was compacted. Reloaded mission state. Continuing..."
5. Resume from current phase

---

## Step 5: Continue the mission

Follow the `/mission` workflow from the resumed phase onward.

**Notes:**
- If `plan.md` doesn't exist yet, go back to planning
- If session is >24h old, warn: "This session is over 24 hours old. Context may be stale. Proceed? (y/n)"
