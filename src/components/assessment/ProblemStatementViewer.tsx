import React, { useState, useMemo } from 'react';
import './ProblemStatementViewer.css';

export interface ProblemStatementViewerProps {
  content?: string | null;
  theme?: 'dark' | 'light';
  className?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  compact?: boolean;
}

// ==========================================
// SVG ICONS (Self-contained, zero-dependency)
// ==========================================
const FileTextIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

const TerminalIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

const ArrowRightCircleIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 16 16 12 12 8" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const SlidersIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);

const CheckCircleIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const InfoIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const CopyIcon: React.FC<{ size?: number }> = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const CheckSmallIcon: React.FC<{ size?: number }> = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ==========================================
// TYPES FOR PARSED SECTIONS
// ==========================================
type SectionCategory = 'problem' | 'input' | 'output' | 'constraints' | 'example' | 'notes' | 'general';

interface ParsedSection {
  id: string;
  category: SectionCategory;
  title: string;
  content: string;
}

interface ExampleBlock {
  input: string;
  output: string;
  explanation: string;
  rawPreamble?: string;
}

// ==========================================
// PARSING HELPERS
// ==========================================

/**
 * Categorize a section title into a known category for targeted styling & icons.
 */
function categorizeHeading(rawHeading: string): { category: SectionCategory; cleanTitle: string } {
  const clean = rawHeading
    .replace(/^#+\s*/, '')
    .replace(/\*+/g, '')
    .replace(/:$/, '')
    .trim();

  const lower = clean.toLowerCase();

  if (lower.includes('problem statement') || lower.includes('description') || lower.includes('task') || lower.includes('overview') || lower.includes('challenge')) {
    return { category: 'problem', cleanTitle: clean || 'Problem Statement' };
  }
  if (lower.includes('input format') || lower.includes('input specification') || lower === 'input') {
    return { category: 'input', cleanTitle: clean || 'Input Format' };
  }
  if (lower.includes('output format') || lower.includes('output specification') || lower === 'output') {
    return { category: 'output', cleanTitle: clean || 'Output Format' };
  }
  if (lower.includes('constraint') || lower.includes('limit') || lower.includes('assumptions')) {
    return { category: 'constraints', cleanTitle: clean || 'Constraints' };
  }
  if (lower.includes('example') || lower.includes('sample case') || lower.includes('walkthrough')) {
    return { category: 'example', cleanTitle: clean || 'Example' };
  }
  if (lower.includes('note') || lower.includes('hint') || lower.includes('tip') || lower.includes('caution')) {
    return { category: 'notes', cleanTitle: clean || 'Important Notes' };
  }

  return { category: 'general', cleanTitle: clean || 'Details' };
}

/**
 * Renders inline markdown text (bold, italic, inline code) safely into React nodes.
 */
export function renderInlineMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];

  // Match: `inline code`, **bold**, *italic*
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code key={idx} className="psv-inline-code">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={idx} className="psv-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={idx} className="psv-italic">
          {part.slice(1, -1)}
        </em>
      );
    }

    return <span key={idx}>{part}</span>;
  });
}

/**
 * Parses raw text of a section into code blocks, bullet lists, and paragraphs.
 */
function parseSectionContent(rawContent: string) {
  const blocks: Array<{ type: 'paragraph' | 'code' | 'list'; language?: string; text?: string; items?: string[] }> = [];

  // Split by code fences first
  const codeFenceRegex = /```([a-zA-Z0-9_-]*)\s*([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeFenceRegex.exec(rawContent)) !== null) {
    const textBefore = rawContent.slice(lastIndex, match.index).trim();
    if (textBefore) {
      blocks.push(...parseParagraphsAndLists(textBefore));
    }

    const language = match[1]?.trim() || '';
    const code = match[2]?.trim() || '';
    blocks.push({ type: 'code', language, text: code });

    lastIndex = match.index + match[0].length;
  }

  const remainingText = rawContent.slice(lastIndex).trim();
  if (remainingText) {
    blocks.push(...parseParagraphsAndLists(remainingText));
  }

  return blocks;
}

/**
 * Splits text into paragraphs and bullet lists.
 */
function parseParagraphsAndLists(text: string) {
  const result: Array<{ type: 'paragraph' | 'list'; text?: string; items?: string[] }> = [];
  const lines = text.split('\n');

  let currentParagraph: string[] = [];
  let currentList: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      result.push({ type: 'paragraph', text: currentParagraph.join(' ').trim() });
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (currentList.length > 0) {
      result.push({ type: 'list', items: [...currentList] });
      currentList = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    // Check for list item (- or * or 1.)
    const listMatch = trimmed.match(/^([-*•]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      flushParagraph();
      currentList.push(listMatch[2]);
    } else {
      flushList();
      currentParagraph.push(trimmed);
    }
  }

  flushParagraph();
  flushList();

  return result;
}

/**
 * Extracts structured Example (Input, Output, Explanation) from an Example section.
 */
function parseExampleBlock(content: string): ExampleBlock | null {
  const hasInput = /(?:\*\*Input\*\*|Input:)/i.test(content);
  const hasOutput = /(?:\*\*Output\*\*|Output:)/i.test(content);

  if (!hasInput && !hasOutput) {
    return null;
  }

  let input = '';
  let output = '';
  let explanation = '';
  let rawPreamble = '';

  // Extract preamble before **Input**
  const inputPos = content.search(/(?:\*\*Input\*\*|Input:)/i);
  if (inputPos > 0) {
    rawPreamble = content.slice(0, inputPos).trim();
  }

  // Extract Input
  const inputMatch = content.match(/(?:\*\*Input\*\*|Input:)\s*(?:```[a-z0-9_-]*\s*([\s\S]*?)```|`([^`]+)`|([^\n*#]+(?:\n[^\n*#]+)*))/i);
  if (inputMatch) {
    input = (inputMatch[1] || inputMatch[2] || inputMatch[3] || '').trim();
  }

  // Extract Output
  const outputMatch = content.match(/(?:\*\*Output\*\*|Output:)\s*(?:```[a-z0-9_-]*\s*([\s\S]*?)```|`([^`]+)`|([^\n*#]+(?:\n[^\n*#]+)*))/i);
  if (outputMatch) {
    output = (outputMatch[1] || outputMatch[2] || outputMatch[3] || '').trim();
  }

  // Extract Explanation
  const explanationMatch = content.match(/(?:\*\*Explanation\*\*|Explanation:)\s*([\s\S]*?)(?=(?:\n###|\n\*\*|$))/i);
  if (explanationMatch) {
    explanation = explanationMatch[1].trim();
  }

  return { input, output, explanation, rawPreamble };
}

// ==========================================
// SUBCOMPONENTS
// ==========================================

const CodeSnippetBlock: React.FC<{ code: string; language?: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="psv-code-block">
      <div className="psv-code-header">
        <span className="psv-code-lang">{language || 'Code'}</span>
        <button
          type="button"
          className="psv-copy-btn"
          onClick={handleCopy}
          title="Copy snippet to clipboard"
        >
          {copied ? <CheckSmallIcon /> : <CopyIcon />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="psv-code-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export const ProblemStatementViewer: React.FC<ProblemStatementViewerProps> = ({
  content,
  theme = 'dark',
  className = '',
  collapsible = false,
  defaultExpanded = true,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Parse raw markdown string into distinct structured sections
  const sections: ParsedSection[] = useMemo(() => {
    if (!content || !content.trim()) return [];

    const raw = content.trim();
    const lines = raw.split('\n');

    const parsed: ParsedSection[] = [];
    let currentCategory: SectionCategory = 'problem';
    let currentTitle = 'Problem Statement';
    let currentLines: string[] = [];

    const flushSection = () => {
      const sectionText = currentLines.join('\n').trim();
      if (sectionText) {
        parsed.push({
          id: `sec_${parsed.length}_${currentCategory}`,
          category: currentCategory,
          title: currentTitle,
          content: sectionText,
        });
      }
      currentLines = [];
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Heading regex: matches "### Heading", "## Heading", "# Heading"
      const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);

      // Also match bold headers on their own line: "**Input Format**" or "**Constraints:**"
      const boldHeaderMatch = !headingMatch && trimmed.match(/^\*\*([A-Za-z0-9\s/&_-]+)\*\*:?$/);

      if (headingMatch || boldHeaderMatch) {
        const rawTitle = headingMatch ? headingMatch[2] : (boldHeaderMatch ? boldHeaderMatch[1] : '');
        const { category, cleanTitle } = categorizeHeading(rawTitle);

        // If we already accumulated lines, flush them under previous section
        flushSection();

        currentCategory = category;
        currentTitle = cleanTitle;
      } else {
        currentLines.push(line);
      }
    }

    flushSection();

    // If no explicit heading was found, wrap everything into a single problem statement section
    if (parsed.length === 0 && raw) {
      parsed.push({
        id: 'sec_single_problem',
        category: 'problem',
        title: 'Problem Statement',
        content: raw,
      });
    }

    return parsed;
  }, [content]);

  if (!content || !content.trim()) {
    return (
      <div className={`psv-container psv-${theme}-theme ${className}`}>
        <p className="psv-empty-notice">No problem statement provided for this question.</p>
      </div>
    );
  }

  // Get icon for category
  const renderCategoryIcon = (category: SectionCategory) => {
    switch (category) {
      case 'problem':
        return <FileTextIcon size={15} />;
      case 'input':
        return <TerminalIcon size={15} />;
      case 'output':
        return <ArrowRightCircleIcon size={15} />;
      case 'constraints':
        return <SlidersIcon size={15} />;
      case 'example':
        return <CheckCircleIcon size={15} />;
      case 'notes':
        return <InfoIcon size={15} />;
      default:
        return <FileTextIcon size={15} />;
    }
  };

  return (
    <div className={`psv-container psv-${theme}-theme ${compact ? 'psv-compact' : ''} ${className}`}>
      {collapsible && (
        <div className="psv-collapsible-bar" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="psv-collapsible-left">
            <FileTextIcon size={16} />
            <span className="psv-collapsible-title">Problem Statement & Requirements</span>
          </div>
          <button type="button" className="psv-collapsible-toggle">
            {isExpanded ? 'Hide Specs' : 'View Full Specs'}
          </button>
        </div>
      )}

      {(!collapsible || isExpanded) && (
        <div className="psv-sections-wrap">
          {sections.map((sec, idx) => {
            const isExample = sec.category === 'example';
            const exampleData = isExample ? parseExampleBlock(sec.content) : null;
            const contentBlocks = parseSectionContent(sec.content);

            return (
              <section key={sec.id || idx} className={`psv-section psv-section-${sec.category}`}>
                {/* Clean, Modern Section Header (No # symbols!) */}
                <div className="psv-section-header">
                  <div className="psv-section-icon-badge">
                    {renderCategoryIcon(sec.category)}
                  </div>
                  <h3 className="psv-section-title">{sec.title}</h3>
                </div>

                {/* Section Content Body */}
                <div className="psv-section-body">
                  {/* If this is an Example Section and has structured I/O */}
                  {isExample && exampleData ? (
                    <div className="psv-example-card">
                      {exampleData.rawPreamble && (
                        <p className="psv-example-preamble">
                          {renderInlineMarkdown(exampleData.rawPreamble)}
                        </p>
                      )}

                      <div className="psv-example-io-grid">
                        {exampleData.input && (
                          <div className="psv-example-io-cell input-cell">
                            <div className="psv-io-cell-label">
                              <span className="psv-io-dot input-dot" />
                              <span>Sample Input</span>
                            </div>
                            <pre className="psv-io-code-snippet">
                              <code>{exampleData.input}</code>
                            </pre>
                          </div>
                        )}

                        {exampleData.output && (
                          <div className="psv-example-io-cell output-cell">
                            <div className="psv-io-cell-label">
                              <span className="psv-io-dot output-dot" />
                              <span>Expected Output</span>
                            </div>
                            <pre className="psv-io-code-snippet">
                              <code>{exampleData.output}</code>
                            </pre>
                          </div>
                        )}
                      </div>

                      {exampleData.explanation && (
                        <div className="psv-example-explanation-box">
                          <div className="psv-explanation-title">Explanation:</div>
                          <div className="psv-explanation-body">
                            {renderInlineMarkdown(exampleData.explanation)}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Normal Section Content Blocks */
                    contentBlocks.map((block, bIdx) => {
                      if (block.type === 'code') {
                        return (
                          <CodeSnippetBlock
                            key={bIdx}
                            code={block.text || ''}
                            language={block.language}
                          />
                        );
                      }

                      if (block.type === 'list') {
                        return (
                          <ul key={bIdx} className="psv-list">
                            {block.items?.map((item, iIdx) => (
                              <li key={iIdx} className="psv-list-item">
                                <span className="psv-list-bullet" />
                                <span className="psv-list-text">{renderInlineMarkdown(item)}</span>
                              </li>
                            ))}
                          </ul>
                        );
                      }

                      return (
                        <p key={bIdx} className="psv-paragraph">
                          {renderInlineMarkdown(block.text || '')}
                        </p>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProblemStatementViewer;

