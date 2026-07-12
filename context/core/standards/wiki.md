# Wiki Standards (Shikamaru / project wikis)

Conventions for the per-project wiki maintained by Shikamaru at `docs/wiki/` in each repo.

## Directory layout

```
docs/wiki/
  index.md          # Catalog: every page with a one-line summary, grouped by category. Read FIRST.
  log.md            # Append-only chronological record: ingests, queries answered, lint passes.
  architecture/     # One page per module / service / layer (what it does, key files, data flow)
  concepts/         # Cross-cutting concepts (auth model, error handling strategy, domain terms)
  guides/           # Distilled skills: setup, workflows, conventions — written so an AI agent
                    # (or a new dev) can load one file and act correctly in this repo
  decisions/       # Lightweight ADRs: context → decision → consequences
```

## Page format

Every page starts with frontmatter:

```markdown
---
title: <Page title>
updated: <YYYY-MM-DD>
sources:
  - src/path/to/relevant/file.ts
  - src/other/file.py
status: current | needs-review | stale
---
```

Body rules:
- Cite code as `path/to/file.ts:123` so claims are verifiable against the source layer.
- End every page with a `## Related` section linking sibling pages by relative path.
- Never paste large code blocks; summarize behavior and cite the location.
- Facts must come from the code/repo, never from memory of "how projects usually work".

## Maintenance rules (the three operations)

- **Ingest/Update**: read `index.md` first. Integrate new knowledge into EXISTING pages when they
  cover the topic; create new pages only for genuinely new topics. Update `index.md` and append
  to `log.md` on every run. One change may touch several pages — follow the cross-references.
- **Query**: answer from the wiki; if the wiki lacks the answer, research the code, answer, and
  persist the finding as a page or page-update (compounding knowledge).
- **Lint**: check for contradictions between pages, `sources:` entries pointing to deleted files,
  pages not listed in `index.md` (orphans), `## Related` links to missing pages, and pages whose
  source files changed long after `updated:`. Mark suspect pages `status: needs-review`.

## Bootstrapping a new wiki (persistence choice)

Before creating `docs/wiki/` in a repo that doesn't have one yet, decide how it will be persisted:

- **Versioned in git** (default): the wiki ships with the repo, shared with the team. This is the
  standing project default — used whenever the choice can't be asked (e.g. Shikamaru running as a
  delegated subagent, mid-task).
- **Local only**: the wiki stays out of git via a `docs/wiki/` entry in `.gitignore` — useful when
  the knowledge is personal/exploratory and shouldn't be shared yet.

When Shikamaru is invoked directly by the user (primary), it asks once via the `question` tool
before bootstrapping. When delegated to (subagent), it doesn't block the caller — it defaults to
versioned and flags the alternative in its report.

Either way, the `.gitignore` edit itself is out of scope for Shikamaru: it only ever writes `.md`
files under `docs/wiki/`. If "local only" was chosen, Shikamaru reports the one line the caller (or
the user) needs to add to `.gitignore` — it never edits that file itself.

## Boundaries

- The wiki layer is the ONLY writable layer. Code, configs, and non-wiki docs are read-only sources.
- If `docs/wiki/` already contains human-written content, integrate — never overwrite. Preserve the
  human text and fold it into the structure above.
