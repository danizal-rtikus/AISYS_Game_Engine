export interface ExtractorResult {
  displayText: string;
  code: string | null;
  isWritingCode: boolean;
  isComplete: boolean;
  lineCount: number;
}

/**
 * Parses raw AI response text to separate conversational text
 * from HTML single-file game code.
 */
export function extractHtmlFromStream(fullText: string): ExtractorResult {
  const codeStartMatch = fullText.match(/```(?:html|HTML)?\s*\n?/);

  if (!codeStartMatch || codeStartMatch.index === undefined) {
    // No code block detected yet
    return {
      displayText: fullText,
      code: null,
      isWritingCode: false,
      isComplete: false,
      lineCount: 0,
    };
  }

  const startIdx = codeStartMatch.index;
  const codeContentStart = startIdx + codeStartMatch[0].length;
  const beforeCode = fullText.substring(0, startIdx).trim();

  // Look for closing ```
  const remainingText = fullText.substring(codeContentStart);
  const closingIdx = remainingText.indexOf('```');

  if (closingIdx === -1) {
    // Still actively streaming code
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

  // Code block is finished!
  const completeCode = remainingText.substring(0, closingIdx);
  const afterCode = remainingText.substring(closingIdx + 3).trim();
  const lines = completeCode.split('\n').length;

  const combinedDisplayText = [beforeCode, afterCode].filter(Boolean).join('\n\n');

  return {
    displayText: combinedDisplayText,
    code: completeCode.trim(),
    isWritingCode: false,
    isComplete: true,
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
