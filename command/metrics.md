---
description: Enable/disable metrics tracking for all commands and agents
---

# /metrics

Controls metrics tracking globally.

## Usage

```
/metrics on      — enable metrics
/metrics off     — disable metrics
/metrics status  — show current state
/metrics report  — summary table of all sessions
/metrics detail  — full breakdown of the last session
/metrics clear   — delete metrics history
```

## task

$ARGUMENTS

---

## Instructions

No thinking required. Run the bash block that matches the argument and paste the output verbatim.

---

## on

```bash
echo "enabled" > ~/.config/opencode/.metrics
echo "✓ Metrics enabled. Commands will record time, tools, and agents used."
echo "  Reports saved to .tmp/metrics/"
```

## off

```bash
rm -f ~/.config/opencode/.metrics
echo "✓ Metrics disabled."
```

## status

```bash
STATUS=$(cat ~/.config/opencode/.metrics 2>/dev/null)
if [ "$STATUS" = "enabled" ]; then
  echo "● Metrics: ACTIVE"
  COUNT=$(find .tmp/metrics -name '*.md' 2>/dev/null | grep -v summary | wc -l | tr -d ' ')
  echo "  Recorded sessions: $COUNT"
  echo "  Location: .tmp/metrics/"
else
  echo "○ Metrics: INACTIVE"
fi
```

## report

```bash
cat .tmp/metrics/summary.md 2>/dev/null || echo "No metrics recorded yet. Run /metrics on to start."
```

## detail

```bash
find .tmp/metrics -name '*.md' ! -name 'summary.md' 2>/dev/null | sort -r | head -1 | xargs cat 2>/dev/null || echo "No session files found."
```

## clear

```bash
rm -rf .tmp/metrics/
echo "✓ Metrics history cleared."
```

---

## Note

Metrics are opt-in and local — not sent anywhere. Zero overhead when off.
