---
description: Switch agent profiles between eco, smart, and optimal. Usage: /agents [eco|smart|optimal|status]
---

# /agents

Switch between agent cost profiles.

## task

$ARGUMENTS

---

## Instructions

No thinking required. Run the bash block that matches the argument and paste the output verbatim.

---

## status (default — no args or "status")

```bash
MODE=$(cat ~/.config/opencode/.agent-mode 2>/dev/null || echo "eco")
echo "● Agent mode: $MODE"
echo ""
if [ "$MODE" = "optimal" ]; then
  echo "  rimuru    → opencode-go/kimi-k2.6        [paid $$]"
  echo "  urahara   → opencode-go/deepseek-v4-pro   [paid $$]"
  echo "  senku     → opencode-go/deepseek-v4-pro   [paid $$]"
  echo "  norman    → opencode-go/qwen3.6-plus      [go]"
  echo "  gilgamesh → opencode-go/qwen3.6-plus      [go]"
  echo "  index     → opencode-go/qwen3.6-plus      [go]"
  echo "  jiraiya   → opencode-go/deepseek-v4-flash [go — fast]"
  echo "  killua    → opencode-go/deepseek-v4-flash [go — fast]"
  echo "  gojo      → opencode-go/mimo-v2.5         [go — vision]"
elif [ "$MODE" = "smart" ]; then
  echo "  rimuru    → opencode-go/kimi-k2.6         [paid $]"
  echo "  urahara   → opencode-go/kimi-k2.6         [paid $]"
  echo "  senku     → opencode-go/mimo-v2.5-pro     [paid $]"
  echo "  norman    → opencode-go/minimax-m2.7      [go — cheap]"
  echo "  gilgamesh → opencode-go/minimax-m2.7      [go — cheap]"
  echo "  index     → opencode-go/qwen3.6-plus      [go]"
  echo "  jiraiya   → opencode-go/deepseek-v4-flash [go — fast]"
  echo "  killua    → opencode-go/deepseek-v4-flash [go — fast]"
  echo "  gojo      → opencode-go/mimo-v2.5         [go — vision]"
else
  echo "  rimuru    → opencode-go/qwen3.6-plus      [go]"
  echo "  urahara   → opencode-go/qwen3.6-plus      [go]"
  echo "  senku     → opencode-go/deepseek-v4-flash [go — fast]"
  echo "  norman    → opencode-go/qwen3.6-plus      [go]"
  echo "  gilgamesh → opencode-go/qwen3.6-plus      [go]"
  echo "  index     → opencode-go/qwen3.6-plus      [go]"
  echo "  jiraiya   → opencode-go/deepseek-v4-flash [go — fast]"
  echo "  killua    → opencode-go/deepseek-v4-flash [go — fast]"
  echo "  gojo      → opencode-go/mimo-v2.5         [go — vision]"
fi
echo ""
echo "  Cost estimate per day (intensive use):"
echo "  eco     ~\$0.5-1   — Go limits apply, $30/week budget"
echo "  smart   ~\$3-6    — kimi+mimo-pro activos, Go para el resto"
echo "  optimal ~\$10-15  — kimi+v4-pro en rimuru/urahara/senku"
echo ""
echo "  To switch: /agents eco  |  /agents smart  |  /agents optimal"
```

---

## eco

```bash
cp ~/.config/opencode/my-agents.eco.json ~/.config/opencode/my-agents.json
echo "eco" > ~/.config/opencode/.agent-mode
echo "✓ Switched to ECO — all 9 agents on Go models (zero OpenRouter)"
echo "  jiraiya/senku/killua → deepseek-v4-flash  (158K req/month)"
echo "  rimuru/urahara/norman/gilgamesh/index → qwen3.6-plus (16K req/month)"
echo "  gojo → mimo-v2.5 (vision nativa)"
echo "⚠ Restart OpenCode to apply changes"
```

---

## smart

```bash
cp ~/.config/opencode/my-agents.smart.json ~/.config/opencode/my-agents.json
echo "smart" > ~/.config/opencode/.agent-mode
echo "✓ Switched to SMART — best quality/cost ratio"
echo "  rimuru/urahara → kimi-k2.6    (orquestación + análisis top)"
echo "  senku          → mimo-v2.5-pro (coding eficiente, -50% tokens)"
echo "  norman/gilga   → minimax-m2.7  (planificación barata)"
echo "  jiraiya/killua → deepseek-v4-flash (exploración ultrarápida)"
echo "  gojo           → mimo-v2.5    (vision nativa)"
echo "⚠ Restart OpenCode to apply changes"
```

---

## optimal

```bash
cp ~/.config/opencode/my-agents.optimal.json ~/.config/opencode/my-agents.json
echo "optimal" > ~/.config/opencode/.agent-mode
echo "✓ Switched to OPTIMAL — maximum capability"
echo "  rimuru         → kimi-k2.6      (mejor orchestrator open)"
echo "  urahara/senku  → deepseek-v4-pro (coding top, 80.6% SWE-bench)"
echo "  norman/gilga/index → qwen3.6-plus"
echo "  jiraiya/killua → deepseek-v4-flash"
echo "  gojo           → mimo-v2.5      (vision nativa)"
echo "⚠ Restart OpenCode to apply changes"
```
