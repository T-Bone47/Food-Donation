# Google AntiGravity Compatibility & Discovery Architecture

**Document Version:** 1.0.0  
**Target Environment:** Google AntiGravity (AGY) / AntiGravity IDE / Gemini CLI  
**App Data Directory:** `C:\Users\dream\.gemini\antigravity`  
**Workspace Directory:** `c:\Users\dream\Downloads\Food-Donation-main (1)`  
**Project Repository:** `c:\Users\dream\Downloads\Food-Donation-main (1)\Food-Donation-main`  

---

## 1. Overview of AntiGravity Customization Architecture

Google AntiGravity (AGY) uses a modular, directory-driven customization discovery engine. Customizations are discovered dynamically by traversing the filesystem hierarchy upwards from the current working directory to the repository root.

AntiGravity recognizes three primary customization models:
1. **Skills (`skills/<skill_name>/SKILL.md`):** Modular procedural workflows injected via progressive disclosure.
2. **Rules (`.agent/rules/*.md` or `GEMINI.md`):** Contextual constraints and coding standards automatically applied based on directory context or trigger mode (`always_on`).
3. **Hooks (`hooks.json`):** Lifecycle event scripts executed before or after specific agent actions.

---

## 2. Discovery Root Hierarchy & Resolution Order

AntiGravity discovers and resolves customizations in the following precedence order (from highest to lowest priority):

```
1. Workspace Directory (.agents / .agent in current working directory)
      │
2. Parent Workspace Root (.agents / .agent in parent repo folder)
      │
3. Declared Workspace Configs (skills.json / plugins.json)
      │
4. User Global Customizations (~/.gemini/config/ & ~/.gemini/antigravity/)
      │
5. Built-in Agent Skills (~/.gemini/antigravity/builtin/skills/)
```

### Multi-Scope Workspace Alignment
Because the user's workspace is structured with an outer root:
`c:\Users\dream\Downloads\Food-Donation-main (1)`
and an inner Git repository:
`c:\Users\dream\Downloads\Food-Donation-main (1)\Food-Donation-main`

All design skills and rules have been deployed symmetrically to **both** locations:
- `Food-Donation-main\.agents\skills\`
- `Food-Donation-main\.gemini\skills\`
- `Food-Donation-main\.agent\rules\`
- `.agents\skills\`
- `.agent\rules\`

This guarantees that whether a subagent, terminal process, or AntiGravity IDE session is focused at the outer workspace or inside the inner repository, all three design skills and the design rule are discovered without path resolution errors.

---

## 3. Skill Manifest Structure & Progressive Disclosure

In AntiGravity, skills must adhere strictly to the `skills/<skill_name>/SKILL.md` folder contract. Loose `SKILL.md` files placed directly in `skills/` without a subdirectory violate the discovery parser and fail to load.

### Frontmatter Compliance
Each installed skill provides a standardized YAML frontmatter block:

```yaml
---
name: <unique-hyphenated-name>
description: >-
  Third-person actionable description explaining WHAT the skill does
  and WHEN the agent should activate it.
---
```

### Progressive Disclosure Benefits
1. **Low Baseline Token Cost:** At session start, AntiGravity injects only the `name` and `description` of available skills into the model's system prompt (consuming <200 tokens).
2. **On-Demand Activation:** When a design task begins (e.g. "Generate design system", "Audit contrast"), AntiGravity loads the specific skill's body into context.
3. **External Reference Isolation:** Bulky design dictionaries (such as the 247-site curated database in Taste Skill or the 192 product palettes in UI UX Pro Max) are housed in `references/` or `data/` and read via targeted scripts, saving context window capacity.

---

## 4. Hook Compatibility

`impeccable install` generated hook manifests in `.agents/hooks.json` and `.gemini/hooks.json`.

AntiGravity executes these hooks during tool invocations:
- **`pre-tool-enforce-clean-code`:** Runs static verification before file modifications.
- **`impeccable-detect-hook`:** Can run automated UI anti-pattern checks upon modifying frontend files.

---

## 5. Prevention of Installation Conflicts & Nesting Errors

During the audit, a legacy nesting defect was detected at `.agents\skills\SKILL.md` where a previous installation unpacked a skill directly into the parent folder. This was corrected:
1. Nested files were consolidated into `.agents\skills\banner-design\`.
2. All three new skills are housed in distinct, non-overlapping directory trees:
   - `.agents\skills\ui-ux-pro-max\`
   - `.agents\skills\design-taste-frontend\`
   - `.agents\skills\impeccable\`
3. No dependencies were injected into the application's production `package.json`, preserving frontend stability.

---

## 6. Restart & Session Reload Instructions

If running within the AntiGravity IDE or a persistent CLI session:
1. **IDE Customization Reload:** Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) and run `Developer: Reload Window`, or simply send a new prompt in chat. AntiGravity automatically rescans `.agents/` and `.agent/rules/` on each conversational turn.
2. **CLI Session:** No restart required for background commands. All scripts (`search.py`, `draw.mjs`, `impeccable.exe`) execute standalone via Node.js and Python.
