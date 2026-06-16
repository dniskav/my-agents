---
description: Show current squad status — all agents, roles, and active models.
---

# /squad

```bash
DIR=~/.config/opencode
MODE=$(cat "$DIR/.agent-mode" 2>/dev/null || echo "unknown")

echo "● Squad — profile: $MODE"
echo ""
echo "  PRIMARY AGENTS"
printf "  %-12s %-22s %s\n" "Agent" "Role" "Model"
printf "  %-12s %-22s %s\n" "─────────────" "──────────────────────" "───────────────────────────────"

extract() {
  python3 -c "
import json, sys
data = json.load(open('$DIR/my-agents.json'))
agents = data.get('agents', {})
for name, cfg in agents.items():
    short = name.split(' - ')[0]
    role  = name.split('(')[-1].rstrip(')')  if '(' in name else ''
    model = cfg.get('model','?').split('/')[-1]
    print(f'  {short:<12} {role:<22} {model}')
"
}

extract

echo ""
echo "  To switch profile: /agents [free|eco|smart|optimal]"
echo "  No tokens? Run: ~/.config/opencode/switch.sh <profile>"
```
