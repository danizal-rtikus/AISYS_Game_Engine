import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  // Split content by double newlines into blocks (paragraphs / lists / headings / rules)
  const blocks = content.split(/\n{2,}/);

  return (
    <div className="space-y-2 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // 1. Horizontal Rule (--- or ***)
        if (/^[-*_]{3,}$/.test(trimmed)) {
          return <hr key={bIdx} className="border-slate-200 dark:border-[#282B33] my-2" />;
        }

        const lines = block.split('\n');

        // 2. Heading 1 (# ...)
        if (lines.length === 1 && /^#\s+/.test(trimmed)) {
          const text = trimmed.replace(/^#\s+/, '');
          return (
            <h2 key={bIdx} className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mt-2 mb-1">
              {renderInline(text)}
            </h2>
          );
        }

        // 3. Heading 2 (## ...)
        if (lines.length === 1 && /^##\s+/.test(trimmed)) {
          const text = trimmed.replace(/^##\s+/, '');
          return (
            <h3 key={bIdx} className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mt-2 mb-1">
              {renderInline(text)}
            </h3>
          );
        }

        // 4. Heading 3 or 4 (### ... or #### ...)
        if (lines.length === 1 && /^#{3,4}\s+/.test(trimmed)) {
          const text = trimmed.replace(/^#{3,4}\s+/, '');
          return (
            <h4
              key={bIdx}
              className="text-xs font-bold text-[#F6821F] dark:text-[#F6821F] mt-2 mb-0.5 tracking-wide flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#F6821F] flex-shrink-0" />
              <span>{renderInline(text)}</span>
            </h4>
          );
        }

        // 5. Blockquote (> ...)
        if (lines.every((l) => /^>\s*/.test(l.trim()))) {
          const quoteText = lines.map((l) => l.trim().replace(/^>\s*/, '')).join('\n');
          return (
            <blockquote
              key={bIdx}
              className="pl-3 border-l-2 border-[#F6821F] text-slate-600 dark:text-slate-400 italic my-1.5"
            >
              {renderInline(quoteText)}
            </blockquote>
          );
        }

        // 6. Bullet List (- , * , • )
        const isBulletList = lines.length > 0 && lines.every((l) => /^[-*•]\s+/.test(l.trim()));
        if (isBulletList) {
          return (
            <ul key={bIdx} className="list-disc list-inside space-y-1 my-1 pl-1">
              {lines.map((l, lIdx) => (
                <li key={lIdx} className="leading-relaxed">
                  {renderInline(l.trim().replace(/^[-*•]\s+/, ''))}
                </li>
              ))}
            </ul>
          );
        }

        // 7. Numbered List (1. , 2. )
        const isNumberedList = lines.length > 0 && lines.every((l) => /^\d+\.\s+/.test(l.trim()));
        if (isNumberedList) {
          return (
            <ol key={bIdx} className="list-decimal list-inside space-y-1 my-1 pl-1">
              {lines.map((l, lIdx) => (
                <li key={lIdx} className="leading-relaxed">
                  {renderInline(l.trim().replace(/^\d+\.\s+/, ''))}
                </li>
              ))}
            </ol>
          );
        }

        // 8. Mixed block with embedded headings or lines
        // If a multi-line block contains lines starting with ### or ##, render each line appropriately
        const hasEmbeddedHeading = lines.some((l) => /^#{1,4}\s+/.test(l.trim()));
        if (hasEmbeddedHeading) {
          return (
            <div key={bIdx} className="space-y-1">
              {lines.map((line, lIdx) => {
                const lTrim = line.trim();
                if (/^#{3,4}\s+/.test(lTrim)) {
                  return (
                    <h4
                      key={lIdx}
                      className="text-xs font-bold text-[#F6821F] dark:text-[#F6821F] mt-2 mb-0.5 tracking-wide flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F6821F] flex-shrink-0" />
                      <span>{renderInline(lTrim.replace(/^#{3,4}\s+/, ''))}</span>
                    </h4>
                  );
                }
                if (/^##\s+/.test(lTrim)) {
                  return (
                    <h3 key={lIdx} className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mt-2 mb-1">
                      {renderInline(lTrim.replace(/^##\s+/, ''))}
                    </h3>
                  );
                }
                if (/^#\s+/.test(lTrim)) {
                  return (
                    <h2 key={lIdx} className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mt-2 mb-1">
                      {renderInline(lTrim.replace(/^#\s+/, ''))}
                    </h2>
                  );
                }
                if (/^[-*_]{3,}$/.test(lTrim)) {
                  return <hr key={lIdx} className="border-slate-200 dark:border-[#282B33] my-2" />;
                }
                if (/^[-*•]\s+/.test(lTrim)) {
                  return (
                    <div key={lIdx} className="flex items-start gap-1.5 pl-2 leading-relaxed">
                      <span className="text-[#F6821F] select-none">•</span>
                      <span>{renderInline(lTrim.replace(/^[-*•]\s+/, ''))}</span>
                    </div>
                  );
                }
                return (
                  <p key={lIdx} className="leading-relaxed">
                    {renderInline(line)}
                  </p>
                );
              })}
            </div>
          );
        }

        // 9. Regular paragraph with potential single line breaks
        return (
          <p key={bIdx} className="leading-relaxed">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {renderInline(line)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};

/**
 * Tokenizes and renders inline Markdown: **bold**, *italic*, `code`
 */
function renderInline(text: string): React.ReactNode {
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyCounter = 0;

  // Regex to match inline code (`...`), bold (**...**), or italic (*...*)
  const inlineRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/;

  while (remaining.length > 0) {
    const match = remaining.match(inlineRegex);

    if (!match || match.index === undefined) {
      parts.push(remaining);
      break;
    }

    // Text before the markdown token
    if (match.index > 0) {
      parts.push(remaining.substring(0, match.index));
    }

    const token = match[0];

    if (token.startsWith('`') && token.endsWith('`')) {
      // Inline code
      parts.push(
        <code
          key={keyCounter++}
          className="font-mono text-[11px] px-1 py-0.5 rounded bg-slate-100 dark:bg-[#1C1E24] text-[#F6821F] border border-slate-200 dark:border-[#282B33]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      // Bold text
      parts.push(
        <strong key={keyCounter++} className="font-bold text-slate-900 dark:text-slate-100">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      // Italic text
      parts.push(
        <em key={keyCounter++} className="italic text-slate-800 dark:text-slate-200">
          {token.slice(1, -1)}
        </em>
      );
    } else {
      parts.push(token);
    }

    remaining = remaining.substring(match.index + token.length);
  }

  return <>{parts}</>;
}
