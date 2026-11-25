export interface ExtractorResult {
  displayText: string;
  code: string | null;
  isWritingCode: boolean;
  isComplete: boolean;
  lineCount: number;
}

/**
 * Checks whether game code is complete and playable.
 * Supports both:
 * 1. AISYS Declarative Manifest (AISYS.defineGame({ ... }))
 * 2. Legacy Full-HTML Single-File (<!DOCTYPE html> ... </html>)
 */
export function isGameCodePlayable(code: string | null | undefined): boolean {
  if (!code || code.trim().length < 80) return false;

  const trimmed = code.trim();

  // Mode 1: AISYS Declarative Manifest
  if (trimmed.includes('AISYS.defineGame')) {
    const hasEndMarker = trimmed.includes('// END_OF_MANIFEST') || trimmed.includes('/* END_OF_MANIFEST */');
    const hasKit = trimmed.includes('kit:') || trimmed.includes('"kit"');
    if (!hasEndMarker || !hasKit) return false;

    // Validate JS syntax without executing to ensure the manifest is completely closed
    try {
      new Function(trimmed);
      return true;
    } catch {
      return false; // SyntaxError: unclosed bracket or truncated code
    }
  }

  // Mode 2: Legacy Single-File HTML
  const startsWithHtml = /^(?:<!DOCTYPE\s+html|<html)/i.test(trimmed);
  if (!startsWithHtml) return false;

  const hasHtmlClose = /<\/html\s*>/i.test(trimmed) || /<!--\s*END_OF_GAME\s*-->/i.test(trimmed);
  const hasScript = /<script[^>]*>/i.test(trimmed) && /<\/script\s*>/i.test(trimmed);
  if (!hasHtmlClose || !hasScript) return false;

  const lines = trimmed.split('\n');
  if (lines.length < 50) return false;

  const scriptMatch = trimmed.match(/<script[^>]*>([\s\S]*?)<\/script\s*>/i);
  if (scriptMatch && scriptMatch[1]) {
    const scriptContent = scriptMatch[1].trim();
    if (scriptContent.length < 150) return false;
    const hasLoneEllipsis = /^\s*(\.{3,}|\/\/\s*\.{3,}|\/\*\s*\.{3,}\s*\*\/)\s*$/m.test(scriptContent);
    if (hasLoneEllipsis) return false;
    if (scriptContent.endsWith('function') || scriptContent.endsWith('const') || scriptContent.endsWith('let')) {
      return false;
    }
  }

  return true;
}

/**
 * Parses raw AI response text to separate conversational text
 * from game code (supporting both AISYS Declarative Manifest and Full Single-File HTML).
 */
export function extractHtmlFromStream(fullText: string): ExtractorResult {
  // Check for AISYS Manifest block first, then Full HTML block
  const manifestMatch = fullText.match(/```(?:js|javascript)?\s*\n\s*AISYS\.defineGame/i);
  const htmlMatch = fullText.match(/```(?:html|HTML)?\s*\n\s*(?:<!DOCTYPE\s+html|<html)/i);

  let activeMatch = null;

  if (manifestMatch && manifestMatch.index !== undefined) {
    if (!htmlMatch || htmlMatch.index === undefined || manifestMatch.index < htmlMatch.index) {
      activeMatch = manifestMatch;
    } else {
      activeMatch = htmlMatch;
    }
  } else if (htmlMatch && htmlMatch.index !== undefined) {
    activeMatch = htmlMatch;
  }

  if (!activeMatch || activeMatch.index === undefined) {
    // No valid game code block detected yet
    const cleanDisplayText = fullText
      .replace(/```(?:js|javascript)?\s*\n[\s\S]*?```/gi, '')
      .replace(/(?:Wait\s*—|Wait:|Hmm|Actually simpler|Let me write|Now build|Upgrade:|Modernize:|Sell:)[\s\S]*?(?=\n\n|\n[A-Z]|$)/gi, '')
      .trim();

    return {
      displayText: cleanDisplayText || fullText,
      code: null,
      isWritingCode: false,
      isComplete: false,
      lineCount: 0,
    };
  }

  const startIdx = activeMatch.index;
  const beforeCode = fullText.substring(0, startIdx).trim();

  // Find where the code content begins
  const headerMatch = fullText.substring(startIdx).match(/^```(?:html|HTML|js|javascript)?\s*\n?/i);
  const codeContentStart = startIdx + (headerMatch ? headerMatch[0].length : 0);
  const remainingText = fullText.substring(codeContentStart);

  // Look for closing ```
  const closingIdx = remainingText.indexOf('```');

  if (closingIdx === -1) {
    // Still actively streaming!
    const rawCode = remainingText;
    const lines = rawCode.split('\n').length;
    return {
      displayText: beforeCode,
      code: rawCode,
      isWritingCode: true,
      isComplete: false,
      lineCount: lines,
    };
  }

  const completeCode = remainingText.substring(0, closingIdx).trim();
  const afterCode = remainingText.substring(closingIdx + 3).trim();

  // Clean conversational text after code
  const cleanAfterCode = afterCode
    .replace(/```(?:html|js|javascript)?\s*\n[\s\S]*?```/gi, '')
    .trim();

  const combinedDisplayText = [beforeCode, cleanAfterCode].filter(Boolean).join('\n\n');
  const lines = completeCode.split('\n').length;
  const isPlayable = isGameCodePlayable(completeCode);

  return {
    displayText: combinedDisplayText,
    code: completeCode,
    isWritingCode: false,
    isComplete: isPlayable,
    lineCount: lines,
  };
}

/**
 * Extracts a friendly title for the game from the Manifest or HTML code
 */
export function extractGameTitle(code: string, fallback: string = 'AISYS Game'): string {
  try {
    // Check Manifest title
    const manifestTitleMatch = code.match(/title\s*:\s*["']([^"']+)["']/i);
    if (manifestTitleMatch && manifestTitleMatch[1]?.trim()) {
      return manifestTitleMatch[1].trim();
    }
    // Check HTML <title>
    const titleMatch = code.match(/<title[^>]*>(.*?)<\/title>/i);
    if (titleMatch && titleMatch[1]?.trim()) {
      return titleMatch[1].trim();
    }
    const h1Match = code.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Match && h1Match[1]?.trim()) {
      return h1Match[1].replace(/<[^>]+>/g, '').trim();
    }
  } catch {
    // fallback
  }
  return fallback;
}
