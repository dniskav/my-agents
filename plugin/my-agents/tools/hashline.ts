import { tool } from "@opencode-ai/plugin"
import {
  Patch,
  NodeFilesystem,
  Patcher,
  InMemorySnapshotStore,
  formatHashlineHeader,
  formatNumberedLines,
} from "@oh-my-pi/hashline"
import { readFileSync } from "fs"
import { resolve } from "path"

// Singleton state — shared across all hashline tool calls within the plugin instance.
const fsAdapter = new NodeFilesystem()
const snapshots = new InMemorySnapshotStore()
const patcher   = new Patcher({ fs: fsAdapter, snapshots })

export const hashlineRead = tool({
  description: `Read a file in Hashline format — returns content with a [path#TAG] header and
numbered lines. Always use this instead of the standard Read tool when you plan to edit the file
afterward, as the TAG anchors your edits and prevents "oldString not found" failures.

After reading, edit with hashline_edit using the patch format:
  [path#TAG]
  SWAP N.=M:       ← replace lines N through M (inclusive)
  +new line content

  DEL N.=M         ← delete lines N through M
  INS.POST N:      ← insert after line N
  +new line content
  INS.PRE N:       ← insert before line N
  +new line content

Rules:
- Re-read after every edit (each apply mints a fresh TAG)
- Touch only lines you intend to change — tight ranges only
- Body lines must start with + (+ alone = blank line)`,

  args: {
    path: tool.schema.string().describe("Absolute path to the file to read"),
  },

  async execute({ path: filePath }, ctx) {
    const absPath = resolve(filePath)
    let content: string
    try {
      content = readFileSync(absPath, "utf-8")
    } catch (e: any) {
      return { output: `ERROR: could not read file: ${e.message}` }
    }

    const tag     = snapshots.record(absPath, content)
    const header  = formatHashlineHeader(absPath, tag)
    const numbered = formatNumberedLines(content)

    return {
      output: `${header}\n${numbered}`,
      metadata: { path: absPath, tag, lines: content.split("\n").length },
    }
  },
})

export const hashlineEdit = tool({
  description: `Apply a Hashline patch to one or more files. The patch must start with a
[path#TAG] section header obtained from hashline_read. Supports multiple sections in one call.

Patch format:
  [/abs/path/to/file.ts#A1B2]
  SWAP 3.=5:
  +replacement line 1
  +replacement line 2
  DEL 10.=12
  INS.POST 20:
  +inserted line

Operations:
  SWAP N.=M:   replace lines N–M with body
  DEL N.=M     delete lines N–M (no body)
  INS.PRE N:   insert before line N
  INS.POST N:  insert after line N
  INS.HEAD:    prepend to file
  INS.TAIL:    append to file

After a successful edit, the tool returns the updated file in hashline format with a fresh TAG
ready for your next edit.`,

  args: {
    patch: tool.schema.string().describe(
      "Full hashline patch text including [path#TAG] header(s) and operations"
    ),
  },

  async execute({ patch }) {
    let parsedPatch: Patch
    try {
      parsedPatch = Patch.parse(patch)
    } catch (e: any) {
      return { output: `ERROR: could not parse patch: ${e.message}` }
    }

    if (parsedPatch.sections.length === 0) {
      return { output: "ERROR: patch has no sections. Include a [path#TAG] header." }
    }

    let result: Awaited<ReturnType<typeof patcher.apply>>
    try {
      result = await patcher.apply(parsedPatch)
    } catch (e: any) {
      return {
        output:
          `ERROR applying patch: ${e.message}\n\n` +
          `Re-read the file with hashline_read to get a fresh TAG and try again.`,
      }
    }

    // Return updated file(s) in hashline format so the agent can chain edits
    const outputs: string[] = []
    for (const section of result.sections) {
      if (section.after) {
        const tag     = snapshots.record(section.canonicalPath, section.after)
        const header  = formatHashlineHeader(section.canonicalPath, tag)
        const numbered = formatNumberedLines(section.after)
        outputs.push(`✓ ${section.path} (${section.op})\n\n${header}\n${numbered}`)
      }
    }

    return { output: outputs.join("\n\n---\n\n") }
  },
})
