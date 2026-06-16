#!/bin/bash
# Profile switcher — run directly from terminal, no LLM needed.
# Usage: ./switch.sh [free|eco|smart|optimal|status]

DIR="$(cd "$(dirname "$0")" && pwd)"
MODE="${1:-status}"

case "$MODE" in
  free)
    cp "$DIR/my-agents.free.json" "$DIR/my-agents.json"
    echo "free" > "$DIR/.agent-mode"
    echo "✓ Switched to FREE — zero cost (opencode zen models)"
    echo "  Rimuru/urahara/norman/kakashi → nemotron-3-ultra-free"
    echo "  Senku/rock-lee/gilgamesh      → big-pickle"
    echo "  Jiraiya/neji/gaara            → deepseek-v4-flash-free"
    echo "  Gojo                          → mimo-v2.5-free"
    echo "⚠ Restart OpenCode to apply changes"
    ;;
  eco)
    cp "$DIR/my-agents.eco.json" "$DIR/my-agents.json"
    echo "eco" > "$DIR/.agent-mode"
    echo "✓ Switched to ECO — minimum cost (Go models)"
    echo "⚠ Restart OpenCode to apply changes"
    ;;
  smart)
    cp "$DIR/my-agents.smart.json" "$DIR/my-agents.json"
    echo "smart" > "$DIR/.agent-mode"
    echo "✓ Switched to SMART — best quality/cost ratio"
    echo "⚠ Restart OpenCode to apply changes"
    ;;
  optimal)
    cp "$DIR/my-agents.optimal.json" "$DIR/my-agents.json"
    echo "optimal" > "$DIR/.agent-mode"
    echo "✓ Switched to OPTIMAL — maximum capability"
    echo "⚠ Restart OpenCode to apply changes"
    ;;
  status|*)
    CURRENT=$(cat "$DIR/.agent-mode" 2>/dev/null || echo "unknown")
    echo "● Agent mode: $CURRENT"
    echo ""
    echo "  Available profiles: free | eco | smart | optimal"
    echo "  Usage: $0 <profile>"
    ;;
esac
