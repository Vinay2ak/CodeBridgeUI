import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

describe("Theme Guard Tests", () => {
  const srcDir = path.resolve(__dirname, "..");
  const allFiles = getAllFiles(srcDir);

  const targetFiles = allFiles.filter((filePath) => {
    const ext = path.extname(filePath);
    if (![".ts", ".tsx", ".css"].includes(ext)) {
      return false;
    }
    const normalized = filePath.replace(/\\/g, "/");
    if (
      normalized.endsWith("styles/tokens.css") ||
      normalized.endsWith("styles/derived.css") ||
      normalized.endsWith(".test.ts") ||
      normalized.endsWith(".test.tsx")
    ) {
      return false;
    }
    return true;
  });

  const colorLiteralRegex = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b|\b(?:rgb|rgba|hsl|hsla)\s*\(/;
  const tailwindPaletteRegex =
    /\b(?:bg|text|border|ring|fill|stroke|from|to|via|divide|outline|accent)-(?:white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d+)?\b/;

  it("found files to scan", () => {
    expect(targetFiles.length).toBeGreaterThan(0);
  });

  for (const file of targetFiles) {
    const relativePath = path.relative(srcDir, file).replace(/\\/g, "/");

    it(`no forbidden color literals or Tailwind palette classes in: ${relativePath}`, () => {
      const content = fs.readFileSync(file, "utf8");
      const lines = content.split(/\r?\n/);

      lines.forEach((line, index) => {
        const lineNum = index + 1;
        const colorMatch = line.match(colorLiteralRegex);
        if (colorMatch) {
          throw new Error(
            `Forbidden color literal "${colorMatch[0]}" at ${relativePath}:${lineNum} -> "${line.trim()}"`
          );
        }

        const twMatch = line.match(tailwindPaletteRegex);
        if (twMatch) {
          throw new Error(
            `Forbidden Tailwind palette class "${twMatch[0]}" at ${relativePath}:${lineNum} -> "${line.trim()}"`
          );
        }
      });
    });
  }
});

