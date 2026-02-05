/**
 * AAML Parser v1.1.1
 * Extracts references, anchors, and structure from AAML content
 *
 * AAML v1.1.1 Reference Syntax:
 * - [[identifier]] or [[identifier|pinpoint]] — Document references (exhibits, authorities, etc.)
 * - [[#anchor]] or [[#anchor|context]] — Internal cross-references
 * - [[fig:id]] — Figure references
 * - [[tbl:id]] — Table references
 */

// Document reference pattern: [[identifier]] or [[identifier|pinpoint]]
// Identifier can be: filename (with extension), UID (alphanumeric), or alias (may contain spaces)
// Excludes # prefix (internal refs) and fig:/tbl: prefixes
const DOC_REFERENCE_REGEX = /\[\[(?!#)(?!fig:)(?!tbl:)([^\[\]|#]+?)(?:\|([^\[\]|\n]+))?\]\]/g;

// Internal reference pattern: [[#anchor]] or [[#anchor|context]]
const INTERNAL_REFERENCE_REGEX = /\[\[#([a-zA-Z0-9][a-zA-Z0-9_-]*)(?:\|([^\[\]|\n]+))?\]\]/g;

// Figure reference pattern: [[fig:id]]
const FIGURE_REFERENCE_REGEX = /\[\[fig:([a-zA-Z0-9][a-zA-Z0-9_-]*)(?:\|([^\[\]|\n]+))?\]\]/g;

// Table reference pattern: [[tbl:id]]
const TABLE_REFERENCE_REGEX = /\[\[tbl:([a-zA-Z0-9][a-zA-Z0-9_-]*)(?:\|([^\[\]|\n]+))?\]\]/g;

// Anchor definition pattern: {#anchor-name}
const ANCHOR_REGEX = /\{#([a-zA-Z0-9][a-zA-Z0-9_-]*)\}/g;

// Heading pattern (with optional anchor)
const HEADING_REGEX = /^(#{1,6})\s+(.+?)(?:\s*\{#([a-zA-Z0-9_-]+)\})?\s*$/gm;

// Markdown footnote patterns (should NOT appear in valid AAML)
const FOOTNOTE_MARKER_REGEX = /\[\^[^\]]+\]/g;
const FOOTNOTE_DEF_REGEX = /^\[\^[^\]]+\]:/gm;

// Production number patterns (should NOT appear in AAML source)
const PRODUCTION_NUMBER_REGEX = /\b(C-\d+|R-\d+|CL-\d+|RL-\d+|CWS-\d+|RWS-\d+|CER-\d+|RER-\d+)\b/g;

/**
 * Parse AAML content and extract all structured data
 */
function parseAAML(content) {
  const docReferences = extractDocReferences(content);
  const internalReferences = extractInternalReferences(content);
  const figureReferences = extractFigureReferences(content);
  const tableReferences = extractTableReferences(content);
  const anchors = extractAnchors(content);
  const headings = extractHeadings(content);
  const paragraphs = splitIntoParagraphs(content);
  const warnings = checkForProhibitedSyntax(content);

  // Combine all references for backwards compatibility
  const references = [
    ...docReferences,
    ...internalReferences,
    ...figureReferences,
    ...tableReferences
  ].sort((a, b) => a.position - b.position);

  return {
    content,
    references,
    docReferences,
    internalReferences,
    figureReferences,
    tableReferences,
    anchors,
    headings,
    paragraphs,
    warnings
  };
}

// Backwards compatibility alias
const parseArbML = parseAAML;

/**
 * Extract document references [[identifier]] or [[identifier|pinpoint]]
 */
function extractDocReferences(content) {
  const refs = [];
  let match;

  DOC_REFERENCE_REGEX.lastIndex = 0;

  while ((match = DOC_REFERENCE_REGEX.exec(content)) !== null) {
    const identifier = match[1].trim();
    refs.push({
      full: match[0],
      type: 'document',
      identifier: identifier,
      // For backwards compatibility with old code
      id: normalizeIdentifier(identifier),
      pinpoint: match[2] ? match[2].trim() : null,
      position: match.index
    });
  }

  return refs;
}

/**
 * Extract internal references [[#anchor]] or [[#anchor|context]]
 */
function extractInternalReferences(content) {
  const refs = [];
  let match;

  INTERNAL_REFERENCE_REGEX.lastIndex = 0;

  while ((match = INTERNAL_REFERENCE_REGEX.exec(content)) !== null) {
    refs.push({
      full: match[0],
      type: 'internal',
      identifier: match[1],
      id: match[1],
      pinpoint: match[2] ? match[2].trim() : null,
      position: match.index
    });
  }

  return refs;
}

/**
 * Extract figure references [[fig:id]]
 */
function extractFigureReferences(content) {
  const refs = [];
  let match;

  FIGURE_REFERENCE_REGEX.lastIndex = 0;

  while ((match = FIGURE_REFERENCE_REGEX.exec(content)) !== null) {
    refs.push({
      full: match[0],
      type: 'figure',
      identifier: match[1],
      id: match[1],
      pinpoint: match[2] ? match[2].trim() : null,
      position: match.index
    });
  }

  return refs;
}

/**
 * Extract table references [[tbl:id]]
 */
function extractTableReferences(content) {
  const refs = [];
  let match;

  TABLE_REFERENCE_REGEX.lastIndex = 0;

  while ((match = TABLE_REFERENCE_REGEX.exec(content)) !== null) {
    refs.push({
      full: match[0],
      type: 'table',
      identifier: match[1],
      id: match[1],
      pinpoint: match[2] ? match[2].trim() : null,
      position: match.index
    });
  }

  return refs;
}

/**
 * Extract all {#anchor-name} anchors
 */
function extractAnchors(content) {
  const anchors = [];
  let match;

  ANCHOR_REGEX.lastIndex = 0;

  while ((match = ANCHOR_REGEX.exec(content)) !== null) {
    anchors.push({
      full: match[0],
      id: match[1],
      position: match.index
    });
  }

  return anchors;
}

/**
 * Extract heading structure (including anchors in headings)
 */
function extractHeadings(content) {
  const headings = [];
  let match;

  HEADING_REGEX.lastIndex = 0;

  while ((match = HEADING_REGEX.exec(content)) !== null) {
    headings.push({
      level: match[1].length,
      text: match[2].trim(),
      anchor: match[3] || null,
      position: match.index
    });
  }

  return headings;
}

/**
 * Split content into paragraphs (for numbering)
 */
function splitIntoParagraphs(content) {
  const paragraphs = [];

  // Remove frontmatter first
  let cleanContent = content.replace(/^---[\s\S]*?---\n*/m, '');

  // Split by double newlines, but preserve headings as non-numbered
  const blocks = cleanContent.split(/\n\n+/);

  let paraNumber = 1;

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // Check if it's a heading (don't number headings)
    const isHeading = /^#{1,6}\s/.test(trimmed);

    // Check if it's a code block, table, or blockquote start
    const isCode = /^```/.test(trimmed);
    const isTable = /^\|/.test(trimmed);
    const isBlockquote = /^>/.test(trimmed);

    paragraphs.push({
      content: trimmed,
      isHeading,
      isCode,
      isTable,
      isBlockquote,
      number: (!isHeading && !isCode) ? paraNumber++ : null,
      // Extract anchors within this paragraph
      anchors: extractAnchors(trimmed)
    });
  }

  return paragraphs;
}

/**
 * Check for prohibited syntax in AAML
 */
function checkForProhibitedSyntax(content) {
  const warnings = [];

  FOOTNOTE_MARKER_REGEX.lastIndex = 0;
  FOOTNOTE_DEF_REGEX.lastIndex = 0;
  PRODUCTION_NUMBER_REGEX.lastIndex = 0;

  if (FOOTNOTE_MARKER_REGEX.test(content)) {
    warnings.push('AAML prohibits Markdown footnotes ([^...] syntax). References should use [[identifier]] format.');
  }

  if (FOOTNOTE_DEF_REGEX.test(content)) {
    warnings.push('AAML prohibits footnote definitions ([^...]: syntax).');
  }

  // Reset regex for second test
  PRODUCTION_NUMBER_REGEX.lastIndex = 0;
  const productionMatches = content.match(PRODUCTION_NUMBER_REGEX);
  if (productionMatches) {
    warnings.push(`AAML prohibits production numbers in source. Found: ${productionMatches.slice(0, 3).join(', ')}${productionMatches.length > 3 ? '...' : ''}`);
  }

  return warnings;
}

/**
 * Normalize an identifier for comparison
 * - Lowercase
 * - Remove file extension
 * - Trim whitespace
 */
function normalizeIdentifier(identifier) {
  return identifier
    .toLowerCase()
    .replace(/\.(pdf|doc|docx|md|txt)$/i, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Build reference registry with assigned numbers
 *
 * Resolution order (per AAML v1.1.1 spec):
 * 1. Exact filename match
 * 2. UID match
 * 3. Alias match
 */
function buildReferenceRegistry(references, notesRegistry) {
  const registry = {
    exhibits: new Map(),
    authorities: new Map(),
    witnesses: new Map(),
    experts: new Map(),
    procedural: new Map(),
    tables: new Map(),
    figures: new Map(),
    sections: new Map(),
    paragraphs: new Map()
  };

  // Counters for each type and party
  const counters = {
    claimant_exhibit: 0,
    respondent_exhibit: 0,
    claimant_authority: 0,
    respondent_authority: 0,
    claimant_witness: 0,
    respondent_witness: 0,
    claimant_expert: 0,
    respondent_expert: 0,
    procedural: 0,
    table: 0,
    figure: 0
  };

  // Track which documents have been registered
  const registered = new Set();

  // Process document references in order of appearance
  for (const ref of references) {
    if (ref.type === 'internal') continue;

    // Resolve the reference to a note
    const note = resolveIdentifierToNote(ref.identifier, notesRegistry);
    if (!note) continue;

    // Skip if already registered
    if (registered.has(note.id)) continue;
    registered.add(note.id);

    // Assign number based on type and party
    const party = note.party || 'claimant';
    const noteType = note.type || 'exhibit';

    switch (noteType) {
      case 'exhibit':
        if (party === 'claimant') {
          counters.claimant_exhibit++;
          registry.exhibits.set(note.id, {
            ...note,
            assignedNumber: `C-${counters.claimant_exhibit}`,
            party: 'claimant'
          });
        } else {
          counters.respondent_exhibit++;
          registry.exhibits.set(note.id, {
            ...note,
            assignedNumber: `R-${counters.respondent_exhibit}`,
            party: 'respondent'
          });
        }
        break;

      case 'authority':
        if (party === 'claimant') {
          counters.claimant_authority++;
          registry.authorities.set(note.id, {
            ...note,
            assignedNumber: `CL-${counters.claimant_authority}`,
            party: 'claimant'
          });
        } else {
          counters.respondent_authority++;
          registry.authorities.set(note.id, {
            ...note,
            assignedNumber: `RL-${counters.respondent_authority}`,
            party: 'respondent'
          });
        }
        break;

      case 'witness':
        if (party === 'claimant') {
          counters.claimant_witness++;
          registry.witnesses.set(note.id, {
            ...note,
            assignedNumber: `CWS-${counters.claimant_witness}`,
            party: 'claimant'
          });
        } else {
          counters.respondent_witness++;
          registry.witnesses.set(note.id, {
            ...note,
            assignedNumber: `RWS-${counters.respondent_witness}`,
            party: 'respondent'
          });
        }
        break;

      case 'expert':
        if (party === 'claimant') {
          counters.claimant_expert++;
          registry.experts.set(note.id, {
            ...note,
            assignedNumber: `CER-${counters.claimant_expert}`,
            party: 'claimant'
          });
        } else {
          counters.respondent_expert++;
          registry.experts.set(note.id, {
            ...note,
            assignedNumber: `RER-${counters.respondent_expert}`,
            party: 'respondent'
          });
        }
        break;

      case 'procedural':
        counters.procedural++;
        registry.procedural.set(note.id, {
          ...note,
          assignedNumber: `PO-${counters.procedural}`
        });
        break;

      case 'table':
        counters.table++;
        registry.tables.set(note.id, {
          ...note,
          assignedNumber: `Table ${counters.table}`
        });
        break;

      case 'figure':
        counters.figure++;
        registry.figures.set(note.id, {
          ...note,
          assignedNumber: `Figure ${counters.figure}`
        });
        break;

      case 'section':
        registry.sections.set(note.id, {
          ...note,
          assignedNumber: note.title || note.id
        });
        break;
    }
  }

  return registry;
}

/**
 * Resolve an identifier to a note using AAML v1.1.1 resolution order:
 * 1. Exact filename match (including extension)
 * 2. Filename without extension
 * 3. UID match
 * 4. Alias match (case-insensitive)
 */
function resolveIdentifierToNote(identifier, notesRegistry) {
  const normalizedId = identifier.toLowerCase().trim();

  // Search through all notes
  for (const [noteId, note] of Object.entries(notesRegistry)) {
    // 1. Exact filename match
    if (note.filename && note.filename.toLowerCase() === normalizedId) {
      return note;
    }

    // 2. Filename without extension
    if (note.filename) {
      const filenameNoExt = note.filename.replace(/\.[^/.]+$/, '').toLowerCase();
      if (filenameNoExt === normalizedId || filenameNoExt === normalizedId.replace(/\.[^/.]+$/, '')) {
        return note;
      }
    }

    // 3. UID match
    if (note.uid && typeof note.uid === 'string' && note.uid.toLowerCase() === normalizedId) {
      return note;
    }

    // Also check the note's id field
    if (noteId.toLowerCase() === normalizedId) {
      return note;
    }

    // 4. Alias match (case-insensitive)
    if (note.aliases && Array.isArray(note.aliases)) {
      for (const alias of note.aliases) {
        if (typeof alias === 'string' && alias.toLowerCase() === normalizedId) {
          return note;
        }
      }
    }
  }

  // Try normalized comparison as fallback
  const normalizedSearch = normalizeIdentifier(identifier);
  for (const [noteId, note] of Object.entries(notesRegistry)) {
    if (normalizeIdentifier(noteId) === normalizedSearch) {
      return note;
    }
    if (note.uid && typeof note.uid === 'string' && normalizeIdentifier(note.uid) === normalizedSearch) {
      return note;
    }
  }

  return null;
}

/**
 * Resolve a single reference to its display text
 */
function resolveReference(ref, registry, notesRegistry) {
  const pinpoint = ref.pinpoint ? `, ${ref.pinpoint}` : '';

  // Handle internal references
  if (ref.type === 'internal') {
    // Try to find the anchor and resolve to paragraph number
    return `paragraph ${ref.identifier}`;
  }

  // Handle figure references
  if (ref.type === 'figure') {
    const fig = registry.figures.get(ref.id);
    if (fig) {
      return `${fig.assignedNumber}${pinpoint}`;
    }
    return `[Unknown Figure: ${ref.identifier}]`;
  }

  // Handle table references
  if (ref.type === 'table') {
    const tbl = registry.tables.get(ref.id);
    if (tbl) {
      return `${tbl.assignedNumber}${pinpoint}`;
    }
    return `[Unknown Table: ${ref.identifier}]`;
  }

  // Handle document references
  const note = resolveIdentifierToNote(ref.identifier, notesRegistry);
  if (!note) {
    return `[Unknown: ${ref.identifier}]`;
  }

  const noteType = note.type || 'exhibit';

  // Find the note in the appropriate registry
  switch (noteType) {
    case 'exhibit': {
      const exhibit = registry.exhibits.get(note.id);
      if (exhibit) {
        return `Exhibit ${exhibit.assignedNumber}${pinpoint}`;
      }
      break;
    }

    case 'authority': {
      const auth = registry.authorities.get(note.id);
      if (auth) {
        // For authorities, use short_cite if available
        const shortCite = auth.short_cite || auth.citation || auth.title;
        return `${shortCite}${pinpoint}`;
      }
      break;
    }

    case 'witness': {
      const witness = registry.witnesses.get(note.id);
      if (witness) {
        return `${witness.assignedNumber}${pinpoint}`;
      }
      break;
    }

    case 'expert': {
      const expert = registry.experts.get(note.id);
      if (expert) {
        return `${expert.assignedNumber}${pinpoint}`;
      }
      break;
    }

    case 'procedural': {
      const proc = registry.procedural.get(note.id);
      if (proc) {
        return `${proc.assignedNumber}${pinpoint}`;
      }
      break;
    }

    case 'section': {
      const section = registry.sections.get(note.id);
      if (section) {
        return `Section ${section.assignedNumber}`;
      }
      break;
    }
  }

  return `[Unresolved: ${ref.identifier}]`;
}

module.exports = {
  parseAAML,
  parseArbML, // Backwards compatibility
  extractDocReferences,
  extractInternalReferences,
  extractFigureReferences,
  extractTableReferences,
  extractAnchors,
  extractHeadings,
  splitIntoParagraphs,
  buildReferenceRegistry,
  resolveIdentifierToNote,
  resolveReference,
  normalizeIdentifier,
  DOC_REFERENCE_REGEX,
  INTERNAL_REFERENCE_REGEX,
  ANCHOR_REGEX
};
