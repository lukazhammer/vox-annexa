import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOTS = ['src/pages', 'src/components'];
const EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);
const FORBIDDEN_WORDS = /\b(generate|generated|generation|generating)\b/i;
const SPARKLES_PATTERN = /\bSparkles?\b/;

function collectFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...collectFiles(fullPath));
      continue;
    }
    if (EXTENSIONS.has(extname(fullPath))) {
      files.push(fullPath);
    }
  }
  return files;
}

function getLineNumber(content, index) {
  return content.slice(0, index).split('\n').length;
}

function checkFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const violations = [];

  if (SPARKLES_PATTERN.test(content)) {
    const idx = content.search(SPARKLES_PATTERN);
    violations.push({
      type: 'icon',
      line: getLineNumber(content, idx),
      message: 'Sparkles icon usage is not allowed. Use Lightbulb.',
    });
  }

  const stringLiteralPattern = /(["'])(?:\\.|(?!\1)[^\n\\])*\1/g;
  let match;
  while ((match = stringLiteralPattern.exec(content)) !== null) {
    const rawLiteral = match[0];
    const literal = rawLiteral.slice(1, -1);
    const looksTechnical =
      /^[a-z0-9_.:/-]+$/i.test(literal) ||
      /[{}<>]/.test(literal) ||
      literal.includes('className=') ||
      literal.includes('disabled=');
    if (looksTechnical) continue;
    if (!FORBIDDEN_WORDS.test(literal)) continue;

    violations.push({
      type: 'copy',
      line: getLineNumber(content, match.index),
      message: `Forbidden copy in string literal: ${rawLiteral.slice(0, 80)}`,
    });
  }

  return violations;
}

const allFiles = ROOTS.flatMap((root) => collectFiles(root));
const allViolations = [];

for (const filePath of allFiles) {
  const violations = checkFile(filePath);
  violations.forEach((violation) => {
    allViolations.push({ filePath, ...violation });
  });
}

if (allViolations.length > 0) {
  console.error('Copy guardrails failed:');
  allViolations.forEach((violation) => {
    console.error(`- ${violation.filePath}:${violation.line} [${violation.type}] ${violation.message}`);
  });
  process.exit(1);
}

console.log('Copy guardrails passed.');
