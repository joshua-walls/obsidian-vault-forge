// src/commands/shape-lint.ts
// Shape heading validation — part of the standard lint pass.
//
// Rules:
//   shape_heading_missing  — a heading required by the template is absent from the note
//   shape_heading_order    — template headings are present but in the wrong order
//   shape_heading_extra    — a heading exists in the note that is not in the template
//                            H1 extra = error (non-strict) / error (strict)
//                            H2+ extra = info (non-strict) / warning (strict)
//   shape_section_empty    — a heading required by the template has no content
//                            non-strict = warning, strict = error
//
// Matching: the note's type target field value (e.g. type: capability) is used
// to resolve the template filename (e.g. Template, Capability.md).
// Notes with no matching template are skipped silently.

import { App, TFile, TFolder } from "obsidian";
import type { ForgeSettings } from "../settings";
import type { LintResult, LintSeverity } from "../lint-engine";
import { readNote } from "../utils/frontmatter";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ParsedHeading {
  level: number;   // 1–6
  text: string;    // heading text without the # prefix
  lineIndex: number;
}

// ── Template cache ────────────────────────────────────────────────────────────

/**
 * Builds a map of shape name → template headings for all templates
 * in the configured templates folder. Called once per lint run.
 */
export async function buildShapeHeadingCache(
  app: App,
  settings: ForgeSettings
): Promise<Map<string, ParsedHeading[]>> {
  const cache = new Map<string, ParsedHeading[]>();

  // Walk the templates folder for Template, *.md files
  const templateFiles: TFile[] = [];
  const walk = (node: import("obsidian").TAbstractFile) => {
    if (node instanceof TFile && node.extension === "md") {
      templateFiles.push(node);
    } else if (node instanceof TFolder) {
      node.children.forEach(walk);
    }
  };

  const abstractFolder = app.vault.getAbstractFileByPath(settings.shapeTemplatesFolder);
  if (!(abstractFolder instanceof TFolder)) return cache;
  abstractFolder.children.forEach(walk);

  for (const file of templateFiles) {
    // Only process "Template, *.md" files
    if (!file.name.startsWith("Template, ")) continue;

    const shapeName = templateFileToShapeName(file.basename);
    const content = await app.vault.read(file);
    const headings = extractHeadings(content);
    cache.set(shapeName.toLowerCase(), headings);
  }

  return cache;
}

// ── Per-note shape lint ───────────────────────────────────────────────────────

/**
 * Validates a note's heading structure against its matching template.
 * Returns an empty array if no matching template exists.
 */
export async function lintShapeHeadings(
  app: App,
  file: TFile,
  content: string,
  settings: ForgeSettings,
  headingCache: Map<string, ParsedHeading[]>
): Promise<LintResult[]> {
  const results: LintResult[] = [];
  const strict = settings.lintStrictMode;

  // Read frontmatter to get the type target field value
  const note = await readNote(app, file);
  if (!note || !note.hasFrontmatter) return results;

  const typeValue = note.frontmatter[settings.shapeTypeTargetField];
  if (!typeValue || typeof typeValue !== "string") return results;

  const shapeName = typeValue.trim().toLowerCase();
  const templateHeadings = headingCache.get(shapeName);
  if (!templateHeadings || templateHeadings.length === 0) return results;

  const noteHeadings = extractHeadings(content);

  // ── Check for missing and extra headings ──────────────────────────────────

  const templateTexts = templateHeadings.map((h) => h.text.toLowerCase());
  const noteTexts = noteHeadings.map((h) => h.text.toLowerCase());

  // Missing: in template but not in note
  for (const th of templateHeadings) {
    if (!noteTexts.includes(th.text.toLowerCase())) {
      const sev: LintSeverity = strict ? "error" : "warning";
      results.push(newResult(
        file.path, sev, "shape_heading_missing",
        `Missing heading: '${th.text}' (required by shape '${typeValue}')`
      ));
    }
  }

  // Extra: in note but not in template
  for (const nh of noteHeadings) {
    if (!templateTexts.includes(nh.text.toLowerCase())) {
      const sev: LintSeverity = nh.level === 1
        ? "error"
        : strict ? "warning" : "info";
      results.push(newResult(
        file.path, sev, "shape_heading_extra",
        `Extra heading: '${nh.text}' (not in shape '${typeValue}' template)`
      ));
    }
  }

  // ── Check heading order ───────────────────────────────────────────────────
  // Filter note headings to only those that appear in the template,
  // then verify their relative order matches the template order.

  const noteTemplateSubset = noteHeadings
    .filter((h) => templateTexts.includes(h.text.toLowerCase()))
    .map((h) => h.text.toLowerCase());

  const expectedOrder = templateHeadings
    .map((h) => h.text.toLowerCase())
    .filter((t) => noteTexts.includes(t));

  if (!arraysEqualOrder(noteTemplateSubset, expectedOrder)) {
    results.push(newResult(
      file.path, "error", "shape_heading_order",
      `Headings are out of order for shape '${typeValue}'. ` +
      `Expected: ${expectedOrder.map((t) => `'${t}'`).join(" → ")}`
    ));
  }

  // ── Check for empty sections ──────────────────────────────────────────────

  const lines = content.split("\n");

  for (const th of templateHeadings) {
    const noteIdx = noteHeadings.findIndex(
      (h) => h.text.toLowerCase() === th.text.toLowerCase()
    );
    if (noteIdx === -1) continue; // already reported as missing

    const heading = noteHeadings[noteIdx];
    const sectionContent = getSectionContent(lines, heading, noteHeadings, noteIdx);

    if (sectionContent.trim().length === 0) {
      const sev: LintSeverity = strict ? "error" : "warning";
      results.push(newResult(
        file.path, sev, "shape_section_empty",
        `Section '${heading.text}' is empty (required by shape '${typeValue}')`
      ));
    }
  }

  return results;
}

// ── Heading extraction ────────────────────────────────────────────────────────

/**
 * Extracts all ATX headings from markdown content, skipping frontmatter.
 */
export function extractHeadings(content: string): ParsedHeading[] {
  const lines = content.split("\n");
  const headings: ParsedHeading[] = [];
  let inFrontmatter = false;
  let frontmatterDone = false;
  let lineIndex = 0;

  for (const line of lines) {
    if (!frontmatterDone) {
      if (lineIndex === 0 && line.trim() === "---") {
        inFrontmatter = true;
        lineIndex++;
        continue;
      }
      if (inFrontmatter && line.trim() === "---") {
        inFrontmatter = false;
        frontmatterDone = true;
        lineIndex++;
        continue;
      }
      if (inFrontmatter) {
        lineIndex++;
        continue;
      }
      frontmatterDone = true;
    }

    const m = line.match(/^(#{1,6})\s+(.+)$/);
    if (m) {
      headings.push({
        level: m[1].length,
        text: m[2].trim(),
        lineIndex,
      });
    }

    lineIndex++;
  }

  return headings;
}

// ── Section content extraction ────────────────────────────────────────────────

/**
 * Returns the text content of a section — everything between its heading
 * and the next heading of equal or lesser depth (or end of file).
 */
function getSectionContent(
  lines: string[],
  heading: ParsedHeading,
  allHeadings: ParsedHeading[],
  headingIdx: number
): string {
  const startLine = heading.lineIndex + 1;

  // Find the next heading of equal or lesser depth
  let endLine = lines.length;
  for (let i = headingIdx + 1; i < allHeadings.length; i++) {
    if (allHeadings[i].level <= heading.level) {
      endLine = allHeadings[i].lineIndex;
      break;
    }
  }

  return lines.slice(startLine, endLine).join("\n");
}

// ── Utilities ─────────────────────────────────────────────────────────────────

/**
 * Converts a template file basename to a shape name.
 * "Template, Capability" → "capability"
 * "Template, Api Spec" → "api spec"
 */
function templateFileToShapeName(basename: string): string {
  return basename.replace(/^Template,\s*/i, "").trim().toLowerCase();
}

/**
 * Returns true if two string arrays have identical order.
 */
function arraysEqualOrder(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

function newResult(
  file: string,
  severity: LintSeverity,
  rule: string,
  message: string
): LintResult {
  return { file, severity, rule, message };
}