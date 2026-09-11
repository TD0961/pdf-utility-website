/**
 * iLikePDF — Markdown Builder
 * Transforms structured document layout into GitHub Flavored Markdown.
 * Preserves headings, bold/italic styles, bullet/numbered lists, and page breaks.
 */

import { ConversionDocumentLayout, TextBlock } from '../conversion/types';

export interface MarkdownBuilderOptions {
  includePageBreaks?: boolean;
  pageBreakStyle?: '---' | '<!-- pagebreak -->';
  preserveLists?: boolean;
}

/**
 * Formats a TextBlock into markdown text with headings and inline emphasis.
 */
function formatBlockToMarkdown(block: TextBlock, preserveLists = true): string {
  let text = block.text.trim();
  if (!text) return '';

  // Check if text is a list item
  if (preserveLists) {
    const bulletMatch = text.match(/^([•\-\*]|\u2022)\s+(.*)/);
    if (bulletMatch) {
      return `- ${bulletMatch[2]}`;
    }

    const numberMatch = text.match(/^(\d+[\.\)])\s+(.*)/);
    if (numberMatch) {
      return `${numberMatch[1]} ${numberMatch[2]}`;
    }
  }

  // Apply bold/italic styles if the entire block is styled and not a heading
  const isHeading = block.type === 'heading1' || block.type === 'heading2' || block.type === 'heading3';
  if (!isHeading) {
    if (block.isBold && block.isItalic) {
      text = `***${text}***`;
    } else if (block.isBold) {
      text = `**${text}**`;
    } else if (block.isItalic) {
      text = `*${text}*`;
    }
  }

  // Heading formatting
  if (block.type === 'heading1') {
    return `# ${text}`;
  }
  if (block.type === 'heading2') {
    return `## ${text}`;
  }
  if (block.type === 'heading3') {
    return `### ${text}`;
  }

  return text;
}

/**
 * Builds full markdown string from ConversionDocumentLayout.
 */
export function buildMarkdownFromLayout(
  layout: ConversionDocumentLayout,
  options: MarkdownBuilderOptions = {}
): string {
  const includePageBreaks = options.includePageBreaks !== false;
  const breakTag = options.pageBreakStyle || '---';
  const preserveLists = options.preserveLists !== false;

  const markdownParts: string[] = [];

  for (let pIdx = 0; pIdx < layout.pages.length; pIdx++) {
    const page = layout.pages[pIdx];
    const pageNumber = pIdx + 1;

    if (pIdx > 0 && includePageBreaks) {
      markdownParts.push(`\n${breakTag}\n`);
    }

    const pageBlocks: string[] = [];

    for (const block of page.blocks) {
      const formatted = formatBlockToMarkdown(block, preserveLists);
      if (formatted) {
        pageBlocks.push(formatted);
      }
    }

    if (pageBlocks.length > 0) {
      markdownParts.push(pageBlocks.join('\n\n'));
    } else {
      markdownParts.push(`*Page ${pageNumber} (No digital text found)*`);
    }
  }

  return markdownParts.join('\n\n').trim() + '\n';
}
