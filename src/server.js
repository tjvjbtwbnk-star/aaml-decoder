/**
 * AAML Decoder v2.0 - Consolidated
 * Combines Typst PDF rendering with web HTML export
 *
 * AAML (AI-Native Arbitration Markup Language) v1.1.1
 */

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { parseAAML, buildReferenceRegistry, resolveIdentifierToNote } = require('./parser');
const { renderTypstPDF, generateTypstSource, generateExhibitList } = require('./typst-renderer');
const { renderWeb } = require('./web-renderer');
const { loadAllNotes, loadAAMLSpecs } = require('./note-loader');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/exports', express.static(path.join(__dirname, '../Exports')));

// Store loaded notes in memory
let notesRegistry = {};
let aamlSpecs = [];

/**
 * Initialize: Load all notes and specs on startup
 */
async function initialize() {
  const notesPath = path.join(__dirname, '../Notes');
  const aamlPath = path.join(__dirname, '../AAML');

  try {
    notesRegistry = await loadAllNotes(notesPath);
    console.log(`Loaded ${Object.keys(notesRegistry).length} notes`);

    aamlSpecs = await loadAAMLSpecs(aamlPath);
    console.log(`Loaded ${aamlSpecs.length} AAML spec files`);
  } catch (err) {
    console.error('Error loading notes:', err);
  }
}

/**
 * GET / - Serve the main interface
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

/**
 * GET /api/notes - List all available notes
 */
app.get('/api/notes', (req, res) => {
  const notesList = Object.values(notesRegistry).map(note => ({
    id: note.id,
    uid: note.uid,
    type: note.type,
    title: note.title,
    party: note.party,
    filename: note.filename,
    aliases: note.aliases
  }));
  res.json(notesList);
});

/**
 * GET /api/specs - Get AAML specifications (for LLM context)
 */
app.get('/api/specs', (req, res) => {
  res.json(aamlSpecs);
});

/**
 * POST /api/render - Render AAML content
 * Body: { content: string, mode: 'pdf' | 'web', title?: string }
 */
app.post('/api/render', async (req, res) => {
  try {
    const { content, mode, title = 'AAML Document' } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'No content provided' });
    }

    if (!['pdf', 'web'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode. Use "pdf" or "web"' });
    }

    // Parse AAML content
    const parsed = parseAAML(content);

    // Build reference registry with actual note data
    const registry = buildReferenceRegistry(parsed.references, notesRegistry);

    // Validate references
    const validation = validateReferences(parsed.references, notesRegistry);
    if (validation.errors.length > 0) {
      console.warn('Reference validation warnings:', validation.errors);
    }

    // Generate timestamp for filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const safeTitle = title.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 50);

    if (mode === 'pdf') {
      const filename = `${safeTitle}_${timestamp}.pdf`;
      const outputPath = path.join(__dirname, '../Exports', filename);

      // Use Typst for PDF rendering
      await renderTypstPDF(parsed, registry, notesRegistry, {
        title,
        outputPath,
        includeExhibitList: true,
        exhibitListParty: 'claimant'
      });

      res.json({
        success: true,
        mode: 'pdf',
        filename,
        url: `/exports/${filename}`,
        warnings: validation.errors
      });

    } else {
      const filename = `${safeTitle}_${timestamp}.html`;
      const outputPath = path.join(__dirname, '../Exports', filename);

      // Use web renderer for HTML
      await renderWeb(parsed, registry, notesRegistry, {
        title,
        outputPath
      });

      res.json({
        success: true,
        mode: 'web',
        filename,
        url: `/exports/${filename}`,
        warnings: validation.errors
      });
    }

  } catch (err) {
    console.error('Render error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/validate - Validate AAML content without rendering
 */
app.post('/api/validate', (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'No content provided' });
    }

    const parsed = parseAAML(content);
    const validation = validateReferences(parsed.references, notesRegistry);

    res.json({
      valid: validation.errors.length === 0,
      references: parsed.references.length,
      anchors: parsed.anchors.length,
      paragraphs: parsed.paragraphs.length,
      errors: validation.errors,
      warnings: [...validation.warnings, ...parsed.warnings]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/reload - Reload notes from disk
 */
app.post('/api/reload', async (req, res) => {
  try {
    await initialize();
    res.json({
      success: true,
      notesCount: Object.keys(notesRegistry).length,
      specsCount: aamlSpecs.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Validate references against loaded notes
 * Uses AAML v1.1.1 resolution order: filename > UID > alias
 */
function validateReferences(references, notes) {
  const errors = [];
  const warnings = [];

  for (const ref of references) {
    // Skip internal references (anchors)
    if (ref.type === 'internal') {
      continue;
    }

    // Try to resolve the reference
    const note = resolveIdentifierToNote(ref.identifier, notes);

    if (!note) {
      errors.push(`Unknown reference: [[${ref.identifier}]]`);
      continue;
    }

    // Check for type mismatches (for fig: and tbl: prefixed refs)
    if (ref.type === 'figure' && note.type !== 'figure') {
      warnings.push(`Type mismatch: [[fig:${ref.identifier}]] but note type is "${note.type}"`);
    }
    if (ref.type === 'table' && note.type !== 'table') {
      warnings.push(`Type mismatch: [[tbl:${ref.identifier}]] but note type is "${note.type}"`);
    }
  }

  return { errors, warnings };
}

// Start server
app.listen(PORT, async () => {
  console.log(`\n========================================`);
  console.log(`  AAML Decoder v2.0`);
  console.log(`  Typst PDF + Web HTML Export`);
  console.log(`  Server running at http://localhost:${PORT}`);
  console.log(`========================================\n`);

  await initialize();

  console.log(`\nReady to process AAML documents.`);
  console.log(`- Place notes in: ./Notes/{exhibits,authorities,witness,experts}/`);
  console.log(`- Place specs in: ./AAML/`);
  console.log(`- Exports saved to: ./Exports/\n`);
});
