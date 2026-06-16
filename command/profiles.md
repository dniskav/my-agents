---
description: Switch agent cost profiles (free, eco, smart, optimal). Usage: /profiles [free|eco|smart|optimal|status]
---

# /profiles

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
  echo "  Aizen     → opencode-go/qwen3.7-plus      [go — vision]"
  echo "  Rimuru    → opencode-go/kimi-k2.6        [paid $$]"
  echo "  Urahara   → opencode-go/deepseek-v4-pro   [paid $$]"
  echo "  Senku     → opencode-go/deepseek-v4-pro   [paid $$]"
  echo "  Norman    → opencode-go/qwen3.6-plus      [go]"
  echo "  Gilgamesh → opencode-go/qwen3.6-plus      [go]"
  echo "  Neji      → opencode-go/deepseek-v4-flash [go — fast]"
  echo "  Jiraiya   → opencode-go/deepseek-v4-flash [go — fast]"
  echo "  Gaara     → opencode-go/deepseek-v4-flash [go — fast]"
  echo "  Gojo      → opencode-go/mimo-v2.5         [go — vision]"
elif [ "$MODE" = "smart" ]; then
  echo "  Aizen     → opencode-go/qwen3.7-plus      [go — vision]"
  echo "  Rimuru    → opencode-go/kimi-k2.6         [paid $]"
  echo "  Urahara   → opencode-go/kimi-k2.6         [paid $]"
  echo "  Senku     → opencode-go/mimo-v2.5-pro     [paid $]"
  echo "  Norman    → opencode-go/minimax-m2.7      [go — cheap]"
  echo "  Gilgamesh → opencode-go/minimax-m2.7      [go — cheap]"
  echo "  Neji      → opencode-go/deepseek-v4-flash [go — fast]"
  echo "  Jiraiya   → opencode-go/deepseek-v4-flash [go — fast]"
  echo "  Gaara     → opencode-go/deepseek-v4-flash [go — fast]"
  echo "  Gojo      → opencode-go/mimo-v2.5         [go — vision]"
else
  echo "  Aizen     → opencode-go/qwen3.7-plus      [go — vision]"
  echo "  Rimuru    → opencode-go/qwen3.6-plus      [go]"
  echo "  Urahara   → opencode-go/qwen3.6-plus      [go]"
  echo "  Senku     → opencode-go/deepseek-v4-flash [go — fast]"
  echo "  Norman    → opencode-go/qwen3.6-plus      [go]"
  echo "  Gilgamesh → opencode-go/qwen3.6-plus      [go]"
  echo "  Neji      → opencode-go/deepseek-v4-flash [go — fast]"
  echo "  Jiraiya   → opencode-go/deepseek-v4-flash [go — fast]"
  echo "  Gaara     → opencode-go/deepseek-v4-flash [go — fast]"
  echo "  Gojo      → opencode-go/mimo-v2.5         [go — vision]"
fi
echo ""
echo "  Cost estimate per day (intensive use):"
echo "  eco     ~\$0.5-1   — Go limits apply, $30/week budget"
echo "  smart   ~\$3-6    — kimi+mimo-pro activos, Go para el resto"
echo "  optimal ~\$10-15  — kimi+v4-pro en Rimuru/urahara/senku"
echo ""
echo "  To switch: /profiles eco  |  /profiles smart  |  /profiles optimal  |  /profiles free"
```

---

## free

```bash
cp ~/.config/opencode/my-agents.free.json ~/.config/opencode/my-agents.json
echo "free" > ~/.config/opencode/.agent-mode
echo "✓ Switched to FREE — zero cost (opencode zen models)"
echo "  Rimuru/urahara/norman/kakashi → nemotron-3-ultra-free"
echo "  Senku/rock-lee/gilgamesh      → big-pickle"
echo "  Jiraiya/neji/gaara            → deepseek-v4-flash-free"
echo "  Gojo                          → mimo-v2.5-free"
echo "⚠ Restart OpenCode to apply changes"
```

---

## eco

```bash
cp ~/.config/opencode/my-agents.eco.json ~/.config/opencode/my-agents.json
echo "eco" > ~/.config/opencode/.agent-mode
echo "✓ Switched to ECO — all 9 agents on Go models (zero OpenRouter)"
echo "  Jiraiya/senku/neji/gaara → deepseek-v4-flash  (158K req/month)"
echo "  Rimuru/urahara/norman/gilgamesh → qwen3.6-plus (16K req/month)"
echo "  Gojo → mimo-v2.5 (vision nativa)"
echo "⚠ Restart OpenCode to apply changes"
```

---

## smart

```bash
cp ~/.config/opencode/my-agents.smart.json ~/.config/opencode/my-agents.json
echo "smart" > ~/.config/opencode/.agent-mode
echo "✓ Switched to SMART — best quality/cost ratio"
echo "  Rimuru/urahara → kimi-k2.6    (orquestación + análisis top)"
echo "  Senku          → mimo-v2.5-pro (coding eficiente, -50% tokens)"
echo "  Norman/gilga   → minimax-m2.7  (planificación barata)"
echo "  Jiraiya/neji/gaara → deepseek-v4-flash (exploración ultrarápida)"
echo "  Gojo           → mimo-v2.5    (vision nativa)"
echo "⚠ Restart OpenCode to apply changes"
```

---

## optimal

```bash
cp ~/.config/opencode/my-agents.optimal.json ~/.config/opencode/my-agents.json
echo "optimal" > ~/.config/opencode/.agent-mode
echo "✓ Switched to OPTIMAL — maximum capability"
echo "  Rimuru         → kimi-k2.6      (mejor orchestrator open)"
echo "  Urahara/senku  → deepseek-v4-pro (coding top, 80.6% SWE-bench)"
echo "  Norman/gilga → qwen3.6-plus"
echo "  Jiraiya/neji/gaara → deepseek-v4-flash"
echo "  Gojo           → mimo-v2.5      (vision nativa)"
echo "⚠ Restart OpenCode to apply changes"
```
