---
description: Switch the active agent model profile (free | eco | smart | optimal) by copying its config over my-agents.json
---

# Switch model profile

Activate one of the model profiles for the agent squad. The active config is always `~/.config/opencode/my-agents.json`; each profile is a sibling file copied over it.

## requested profile

$ARGUMENTS

## Instructions

Let `CFG="$HOME/.config/opencode"`. The valid profiles are: **free**, **eco**, **smart**, **optimal**.

### 1. Detect the currently active profile (always do this first)

```bash
CFG="$HOME/.config/opencode"
for p in free eco smart optimal; do
  if diff -q "$CFG/my-agents.json" "$CFG/my-agents.$p.json" >/dev/null 2>&1; then
    echo "active: $p"; found=1; break
  fi
done
[ -z "$found" ] && echo "active: custom (my-agents.json matches no profile file)"
```

### 2a. No argument (or invalid) → show status and options, then STOP

List the active profile and the menu, then wait for the user to pick one:

```
Active profile: {active}

Pick a profile:
- free     → opencode zen, zero cost (nemotron-3-ultra, big-pickle, mimo-v2.5-free for vision)
- eco      → cheapest paid (deepseek-v4-flash, mimo-v2.5)
- smart    → balanced (minimax-m2.7 / kimi-k2.6, kimi-k2.7-code)
- optimal  → max capability (minimax-m3 / deepseek-v4-pro, kimi-k2.7-code, qwen3.7-plus)

Run /profile <name> to switch.
```

Do NOT pick for them. STOP and wait.

### 2b. Valid argument → switch

```bash
CFG="$HOME/.config/opencode"
PROFILE="<the requested profile>"
cp "$CFG/my-agents.$PROFILE.json" "$CFG/my-agents.json" && echo "switched to $PROFILE"
```

Validate first: if `$ARGUMENTS` is not one of free/eco/smart/optimal, treat it as case 2a (show menu) instead of copying.

If the requested profile already equals the active one, say so and skip the copy.

### 3. Confirm + remind to restart

After a successful switch, report the new profile and its key model assignments (rimuru, the coders, gojo), then:

```
✅ Profile → {profile}. Restart opencode for the plugin to reload the new models.
```

## Notes
- `free` uses the `opencode/` provider (zen); the paid profiles use `opencode-go/`. If a free model id 404s, the list may have rotated — see https://opencode.ai/zen/v1/models
- This only swaps models. Agent prompts, tools, the guard, and delegation logging are the same across profiles.
