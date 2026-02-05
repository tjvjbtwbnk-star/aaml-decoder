/**
 * AAML Typst Renderer
 * Converts parsed AAML content to Typst markup for professional PDF generation
 *
 * Typst provides native page-aware footnotes, solving the pagination issues
 * we had with wkhtmltopdf.
 */

const fs = require('fs').promises;
const { execSync } = require('child_process');
const path = require('path');
const os = require('os');
const { resolveIdentifierToNote, DOC_REFERENCE_REGEX, INTERNAL_REFERENCE_REGEX, ANCHOR_REGEX } = require('./parser');

// Month names for date formatting
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Format date from YYYY-MM-DD to "dated DD Month YYYY"
 */
function formatDate(dateStr) {
  if (!dateStr) return '';

  if (dateStr instanceof Date) {
    const day = dateStr.getDate();
    const month = MONTH_NAMES[dateStr.getMonth()];
    const year = dateStr.getFullYear();
    return `dated ${day} ${month} ${year}`;
  }

  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = match[1];
    const month = MONTH_NAMES[parseInt(match[2], 10) - 1];
    const day = parseInt(match[3], 10);
    return `dated ${day} ${month} ${year}`;
  }

  return dateStr;
}

/**
 * Escape special Typst characters
 */
function escapeTypst(text) {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/#/g, '\\#')
    .replace(/\$/g, '\\$')
    .replace(/@/g, '\\@')
    .replace(/</g, '\\<')
    .replace(/>/g, '\\>')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\_/g, '\\_')
    .replace(/\*/g, '\\*');
}

/**
 * Convert markdown to Typst markup
 */
function markdownToTypst(content, registry, notesRegistry) {
  let result = content;

  // Remove YAML frontmatter
  result = result.replace(/^---[\s\S]*?---\n*/m, '');

  // Remove anchor definitions
  result = result.replace(ANCHOR_REGEX, '');

  // Convert markdown formatting BEFORE processing references
  // This ensures footnote content (which uses Typst-native syntax) isn't affected

  // Convert markdown headings to Typst
  result = result.replace(/^### (.+)$/gm, '=== $1');
  result = result.replace(/^## (.+)$/gm, '== $1');
  result = result.replace(/^# (.+)$/gm, '= $1');

  // Convert bold and italic (markdown → Typst)
  // IMPORTANT: Convert italic FIRST while ** markers are still intact
  // Otherwise **bold** → *bold* → _bold_ (wrong!)
  result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '_$1_');  // Italic: *text* → _text_
  result = result.replace(/\*\*(.+?)\*\*/g, '*$1*');  // Bold: **text** → *text*

  // Convert blockquotes
  result = result.replace(/^> (.+)$/gm, '#quote[$1]');

  // Convert bullet lists
  result = result.replace(/^- (.+)$/gm, '- $1');

  // Convert numbered lists
  result = result.replace(/^\d+\. (.+)$/gm, '+ $1');

  // NOW process AAML references - convert to Typst footnotes
  // (after markdown conversions, so footnote content won't be affected)
  const ALL_REFS_REGEX = /\[\[(?!#)(?!fig:)(?!tbl:)([^\[\]|#]+?)(?:\|([^\[\]|\n]+))?\]\]|\[\[#([a-zA-Z0-9][a-zA-Z0-9_-]*)(?:\|([^\[\]|\n]+))?\]\]|\[\[(fig|tbl):([a-zA-Z0-9][a-zA-Z0-9_-]*)(?:\|([^\[\]|\n]+))?\]\]/g;

  result = result.replace(ALL_REFS_REGEX, (match, docId, docPinpoint, internalId, internalContext, prefixType, prefixId, prefixPinpoint) => {
    // Internal reference [[#anchor]]
    if (internalId) {
      return `_paragraph ${escapeTypst(internalId)}_`;
    }

    // Figure or table reference
    if (prefixType) {
      const refType = prefixType === 'fig' ? 'figure' : 'table';
      const refRegistry = prefixType === 'fig' ? registry.figures : registry.tables;
      const item = refRegistry.get(prefixId);

      if (item) {
        const pinpoint = prefixPinpoint ? `, ${escapeTypst(prefixPinpoint)}` : '';
        return `_${escapeTypst(item.assignedNumber)}${pinpoint}_`;
      }
      return `_[Unknown ${refType}: ${escapeTypst(prefixId)}]_`;
    }

    // Document reference [[identifier]] or [[identifier|pinpoint]]
    if (docId) {
      const identifier = docId.trim();
      const pinpoint = docPinpoint ? docPinpoint.trim() : null;

      const note = resolveIdentifierToNote(identifier, notesRegistry);

      if (!note) {
        return `_[Unknown: ${escapeTypst(identifier)}]_`;
      }

      // Build footnote content
      let fnContent = '';
      const noteType = note.type || 'exhibit';

      switch (noteType) {
        case 'exhibit': {
          const exhibit = registry.exhibits.get(note.id);
          if (exhibit) {
            fnContent = `*Exhibit ${exhibit.assignedNumber}*`;
            if (note.title) {
              let titleText = note.title;
              if (note.date) {
                titleText = titleText.replace(/dated\s+\d{4}-\d{2}-\d{2}/i, formatDate(note.date));
                if (!titleText.toLowerCase().includes('dated')) {
                  titleText += `, ${formatDate(note.date)}`;
                }
              }
              fnContent += `: ${escapeTypst(titleText)}`;
            } else if (note.date) {
              fnContent += `, ${formatDate(note.date)}`;
            }
            if (pinpoint) fnContent += `, ${escapeTypst(pinpoint)}`;
            fnContent += '.';
          }
          break;
        }
        case 'authority': {
          const auth = registry.authorities.get(note.id);
          if (auth) {
            const shortCite = auth.short_cite || auth.title || note.id;
            fnContent = `*${escapeTypst(shortCite)}*`;
            if (pinpoint) fnContent += `, ${escapeTypst(pinpoint)}`;
            fnContent += '.';
          }
          break;
        }
        case 'witness': {
          const witness = registry.witnesses.get(note.id);
          if (witness) {
            fnContent = `*${witness.assignedNumber}*`;
            if (note.title) fnContent += `: ${escapeTypst(note.title)}`;
            if (pinpoint) fnContent += `, ${escapeTypst(pinpoint)}`;
            fnContent += '.';
          }
          break;
        }
        case 'expert': {
          const expert = registry.experts.get(note.id);
          if (expert) {
            fnContent = `*${expert.assignedNumber}*`;
            if (note.title) fnContent += `: ${escapeTypst(note.title)}`;
            if (pinpoint) fnContent += `, ${escapeTypst(pinpoint)}`;
            fnContent += '.';
          }
          break;
        }
        default:
          fnContent = escapeTypst(note.title || identifier);
          if (pinpoint) fnContent += `, ${escapeTypst(pinpoint)}`;
          fnContent += '.';
      }

      // Return Typst footnote syntax
      return `#footnote[${fnContent}]`;
    }

    return match;
  });

  // Remove space before footnotes
  result = result.replace(/\s+(#footnote\[)/g, '$1');

  // Convert tables
  result = convertTables(result);

  // Convert paragraphs to numbered paragraphs
  result = convertParagraphs(result);

  return result;
}

/**
 * Convert markdown tables to Typst tables
 */
function convertTables(content) {
  const tableRegex = /\|(.+)\|\n\|[-:|]+\|\n((?:\|.+\|\n?)+)/g;

  return content.replace(tableRegex, (match, headerRow, bodyRows) => {
    const headers = headerRow.split('|').filter(cell => cell.trim());
    const rows = bodyRows.trim().split('\n').map(row =>
      row.split('|').filter(cell => cell.trim())
    );

    const numCols = headers.length;

    let typstTable = `#table(\n  columns: ${numCols},\n`;

    // Add headers
    headers.forEach(header => {
      typstTable += `  [${escapeTypst(header.trim())}],\n`;
    });

    // Add body rows
    rows.forEach(row => {
      row.forEach(cell => {
        typstTable += `  [${escapeTypst(cell.trim())}],\n`;
      });
    });

    typstTable += ')\n';
    return typstTable;
  });
}

/**
 * Convert paragraphs to numbered paragraphs
 * Skip headings, lists, tables, blockquotes
 */
function convertParagraphs(content) {
  const lines = content.split('\n');
  const result = [];
  let inCodeBlock = false;
  let inTable = false;
  let paragraphBuffer = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      const paraText = paragraphBuffer.join(' ').trim();
      if (paraText) {
        result.push(`#para[${paraText}]`);
      }
      paragraphBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines - don't add extra spacing
    if (!trimmed) {
      flushParagraph();
      // Don't add empty lines - the para function handles spacing
      continue;
    }

    // Code blocks
    if (trimmed.startsWith('```')) {
      flushParagraph();
      inCodeBlock = !inCodeBlock;
      result.push(line);
      continue;
    }

    if (inCodeBlock) {
      result.push(line);
      continue;
    }

    // Headings (=, ==, ===)
    if (trimmed.match(/^=+ /)) {
      flushParagraph();
      result.push(line);
      continue;
    }

    // Lists (-, +)
    if (trimmed.match(/^[-+] /)) {
      flushParagraph();
      result.push(line);
      continue;
    }

    // Tables
    if (trimmed.startsWith('#table(')) {
      flushParagraph();
      inTable = true;
      result.push(line);
      continue;
    }

    if (inTable) {
      result.push(line);
      if (trimmed === ')') {
        inTable = false;
      }
      continue;
    }

    // Blockquotes
    if (trimmed.startsWith('#quote[')) {
      flushParagraph();
      result.push(line);
      continue;
    }

    // Regular text - add to paragraph buffer
    paragraphBuffer.push(trimmed);
  }

  flushParagraph();
  return result.join('\n');
}

/**
 * Render to PDF using Typst
 */
async function renderTypstPDF(parsed, registry, notesRegistry, options) {
  const { title, outputPath, includeExhibitList = true, exhibitListParty = 'claimant' } = options;

  // Convert to Typst markup
  const typstContent = markdownToTypst(parsed.content, registry, notesRegistry);

  // Generate exhibit list if requested
  const exhibitList = includeExhibitList ? generateExhibitList(registry, exhibitListParty) : '';

  // Get template path
  const templatePath = path.join(__dirname, '..', 'templates', 'legal-submission.typ');
  const templateContent = await fs.readFile(templatePath, 'utf-8');

  // Build complete Typst document
  const fullDocument = `${templateContent}

#show: legal-submission.with(
  title: "${escapeTypst(title)}",
)

${typstContent}
${exhibitList}
`;

  // Write to temp file
  const tempDir = os.tmpdir();
  const tempTyp = path.join(tempDir, `aaml-${Date.now()}.typ`);

  try {
    await fs.writeFile(tempTyp, fullDocument, 'utf-8');

    // Compile with Typst
    const cmd = `typst compile "${tempTyp}" "${outputPath}"`;

    console.log('Generating PDF with Typst...');
    execSync(cmd, { stdio: 'pipe' });
    console.log(`PDF saved to: ${outputPath}`);

    return { success: true, outputPath };

  } catch (error) {
    console.error('Typst compilation error:', error.message);
    throw error;
  } finally {
    // Clean up temp file
    try {
      await fs.unlink(tempTyp);
    } catch {}
  }
}

/**
 * Generate Typst source (for debugging/preview)
 */
async function generateTypstSource(parsed, registry, notesRegistry, options) {
  const { title, includeExhibitList = true, exhibitListParty = 'claimant' } = options;

  const typstContent = markdownToTypst(parsed.content, registry, notesRegistry);
  const exhibitList = includeExhibitList ? generateExhibitList(registry, exhibitListParty) : '';
  const templatePath = path.join(__dirname, '..', 'templates', 'legal-submission.typ');
  const templateContent = await fs.readFile(templatePath, 'utf-8');

  return `${templateContent}

#show: legal-submission.with(
  title: "${escapeTypst(title)}",
)

${typstContent}
${exhibitList}
`;
}

/**
 * Generate exhibit list table for end of document
 * @param {Object} registry - The reference registry containing exhibits
 * @param {string} party - Filter by party: 'claimant', 'respondent', or 'all'
 */
function generateExhibitList(registry, party = 'claimant') {
  // Get exhibits from registry and filter by party
  const exhibits = Array.from(registry.exhibits.values())
    .filter(ex => party === 'all' || ex.party === party)
    .sort((a, b) => {
      // Sort by assigned number (C-1, C-2, etc.)
      const numA = parseInt(a.assignedNumber.replace(/\D/g, ''), 10);
      const numB = parseInt(b.assignedNumber.replace(/\D/g, ''), 10);
      return numA - numB;
    });

  if (exhibits.length === 0) {
    return '';
  }

  // Format date for exhibit list (without "dated" prefix)
  const formatExhibitDate = (dateStr) => {
    if (!dateStr) return '';

    if (dateStr instanceof Date) {
      const day = dateStr.getDate();
      const month = MONTH_NAMES[dateStr.getMonth()];
      const year = dateStr.getFullYear();
      return `${day} ${month} ${year}`;
    }

    const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = match[1];
      const month = MONTH_NAMES[parseInt(match[2], 10) - 1];
      const day = parseInt(match[3], 10);
      return `${day} ${month} ${year}`;
    }

    return dateStr;
  };

  // Build Typst table
  const partyLabel = party === 'claimant' ? "Claimant's" : party === 'respondent' ? "Respondent's" : "";
  let typst = `
#pagebreak()

= List of ${partyLabel} Exhibits

#table(
  columns: (auto, 1fr, auto),
  stroke: 0.5pt + black,
  inset: 8pt,
  align: (left, left, left),
  fill: (x, y) => if y == 0 { luma(230) } else { none },
  [*Exhibit*], [*Title*], [*Date*],
`;

  for (const exhibit of exhibits) {
    const num = escapeTypst(exhibit.assignedNumber);
    const title = escapeTypst(exhibit.title || '');
    const date = escapeTypst(formatExhibitDate(exhibit.date));
    typst += `  [${num}], [${title}], [${date}],\n`;
  }

  typst += `)`;

  return typst;
}

module.exports = {
  renderTypstPDF,
  generateTypstSource,
  markdownToTypst,
  generateExhibitList,
  formatDate,
  escapeTypst
};
