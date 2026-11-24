export interface ExtractorResult {
  displayText: string;
  code: string | null;
  isWritingCode: boolean;
  isComplete: boolean;
  lineCount: number;
}

/**
 * Checks whether code is complete, valid, and safe enough to execute in the iframe
 * without syntax truncation or unfulfilled placeholders.
 */
export function isGameCodePlayable(code: string | null | undefined): boolean {
  if (!code || code.trim().length < 350) return false;

  const trimmed = code.trim();

  // 1. Must start with <!DOCTYPE html> or <html
  const startsWithHtml = /^(?:<!DOCTYPE\s+html|<html)/i.test(trimmed);
  if (!startsWithHtml) return false;

  // 2. Must have closing tag </html> or END_OF_GAME marker
  const hasHtmlClose = /<\/html\s*>/i.test(trimmed) || /<!--\s*END_OF_GAME\s*-->/i.test(trimmed);
  const hasScript = /<script[^>]*>/i.test(trimmed) && /<\/script\s*>/i.test(trimmed);
  if (!hasHtmlClose || !hasScript) return false;

  // 3. Must have at least 50 lines of code for a real interactive game
  const lines = trimmed.split('\n');
  if (lines.length < 50) return false;

  // 4. Inspect script content for forbidden placeholder syntax errors
  const scriptMatch = trimmed.match(/<script[^>]*>([\s\S]*?)<\/script\s*>/i);
  if (scriptMatch && scriptMatch[1]) {
    const scriptContent = scriptMatch[1].trim();

    // If script is too short (< 150 chars), it's just a stub/skeleton
    if (scriptContent.length < 150) return false;

    // Check for lone placeholder tokens like '...', '// ...', or '/* ... */' on a line
    const hasLoneEllipsis = /^\s*(\.{3,}|\/\/\s*\.{3,}|\/\*\s*\.{3,}\s*\*\/)\s*$/m.test(scriptContent);
    if (hasLoneEllipsis) return false;

    // Check for obvious unfinished string or unfinished function at the very end
    if (scriptContent.endsWith('function') || scriptContent.endsWith('const') || scriptContent.endsWith('let')) {
      return false;
    }
  }

  return true;
}

/**
 * Parses raw AI response text to separate conversational text
 * from HTML single-file game code.
 *
 * STRICT RULE: Only code blocks starting with <!DOCTYPE html or <html are accepted as game code.
 * Draft snippets like `const PATH = [...]` or `function updatePhysics()` written in
 * chain-of-thought are strictly ignored and NOT extracted as game code.
 */
export function extractHtmlFromStream(fullText: string): ExtractorResult {
  // Search for code block containing <!DOCTYPE html or <html
  const streamingHtmlStart = fullText.match(/```(?:html|HTML)?\s*\n\s*(?:<!DOCTYPE\s+html|<html)/i);

  if (!streamingHtmlStart || streamingHtmlStart.index === undefined) {
    // No valid HTML document block detected yet!
    // Filter out draft code snippets and monologue residue from displayText
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

  const startIdx = streamingHtmlStart.index;
  const beforeCode = fullText.substring(0, startIdx).trim();

  // Find where the code content begins (right after ```html\n)
  const headerMatch = fullText.substring(startIdx).match(/^```(?:html|HTML)?\s*\n?/i);
  const codeContentStart = startIdx + (headerMatch ? headerMatch[0].length : 0);
  const remainingText = fullText.substring(codeContentStart);

  // Look for closing ``` of this HTML block
  const closingIdx = remainingText.indexOf('```');

  if (closingIdx === -1) {
    // Still actively streaming the HTML code block!
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

  // HTML code block has closed
  let completeCode = remainingText.substring(0, closingIdx).trim();
  let afterCode = remainingText.substring(closingIdx + 3).trim();

  // Multi-Block Stitching:
  // If the initial HTML block has placeholders (e.g., '...') or a very short <script>,
  // check if the model provided subsequent ```js or ```javascript blocks in afterCode.
  const scriptMatch = completeCode.match(/<script[^>]*>([\s\S]*?)<\/script\s*>/i);
  const isScriptPlaceholder =
    !scriptMatch ||
    scriptMatch[1].trim().length < 120 ||
    /^\s*(\.{3,}|\/\/\s*\.{3,}|\/\*\s*\.{3,}\s*\*\/)\s*$/m.test(scriptMatch[1]);

  if (isScriptPlaceholder && afterCode) {
    const jsBlocks: string[] = [];
    const jsRegex = /```(?:js|javascript)?\s*\n([\s\S]*?)```/gi;
    let jsMatch;
    while ((jsMatch = jsRegex.exec(afterCode)) !== null) {
      if (jsMatch[1]?.trim()) {
        jsBlocks.push(jsMatch[1].trim());
      }
    }

    if (jsBlocks.length > 0) {
      const unifiedJs = jsBlocks.join('\n\n');
      if (completeCode.includes('</script>')) {
        completeCode = completeCode.replace(
          /<script[^>]*>[\s\S]*?<\/script\s*>/i,
          `<script>\n'use strict';\n\n${unifiedJs}\n</script>`
        );
      } else if (completeCode.includes('</body>')) {
        completeCode = completeCode.replace(
          /<\/body\s*>/i,
          `<script>\n'use strict';\n\n${unifiedJs}\n</script>\n</body>`
        );
      }
    }
  }

  // Anti-Code-Leak: Remove any standalone code blocks or chain-of-thought dumps from afterCode
  // so the chat bubble only displays clean conversational text
  const cleanAfterCode = afterCode
    .replace(/```(?:html|js|javascript)?\s*\n[\s\S]*?```/gi, '')
    .replace(/(?:Now the JS|Touch buttons|Audio|Draw|Let me write it|Key: avoid|Now, another check|Check reachability|Now let me double check|Wait\s*—|Wait:)[\s\S]*?(?=\n\n|\n[A-Z]|$)/gi, '')
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
 * Extracts a friendly title for the game from the HTML code or prompt
 */
export function extractGameTitle(code: string, fallback: string = 'AISYS Game'): string {
  try {
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
