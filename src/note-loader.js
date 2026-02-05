/**
 * AAML Note Loader v1.1.1
 * Loads notes and AAML specs from disk
 *
 * Supports AAML v1.1.1 YAML header format:
 * - uid: Unique identifier (4 characters recommended)
 * - title: Display title
 * - type: exhibit, authority, witness, expert, procedural, figure, table
 * - party: claimant or respondent
 * - date: Document date (YYYY-MM-DD)
 * - citation: Full legal citation (for authorities)
 * - aliases: List of alternative identifiers
 */

const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');

/**
 * Load all notes from the Notes directory
 */
async function loadAllNotes(notesPath) {
  const registry = {};

  // Subdirectories to scan (per AAML v1.1.1 spec)
  const subdirs = [
    'exhibits',
    'authorities',
    'witness',
    'experts',
    'procedural',
    'sections',
    'tables',
    'figures',
    'notes'
  ];

  for (const subdir of subdirs) {
    const dirPath = path.join(notesPath, subdir);

    try {
      const files = await fs.readdir(dirPath);

      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const filePath = path.join(dirPath, file);
        const note = await loadNote(filePath, subdir);

        if (note && note.id) {
          registry[note.id] = note;
        }
      }
    } catch (err) {
      // Directory might not exist, that's OK
      if (err.code !== 'ENOENT') {
        console.warn(`Warning: Could not read ${dirPath}:`, err.message);
      }
    }
  }

  // Also check root Notes directory
  try {
    const rootFiles = await fs.readdir(notesPath);

    for (const file of rootFiles) {
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(notesPath, file);
      const stat = await fs.stat(filePath);

      if (stat.isFile()) {
        const note = await loadNote(filePath, 'note');
        if (note && note.id) {
          registry[note.id] = note;
        }
      }
    }
  } catch (err) {
    console.warn(`Warning: Could not read root notes:`, err.message);
  }

  return registry;
}

/**
 * Load a single note file
 */
async function loadNote(filePath, inferredType) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { data: frontmatter, content: body } = matter(content);

    // Get filename for reference resolution
    const filename = path.basename(filePath);
    const filenameNoExt = path.basename(filePath, '.md');

    // Determine ID priority: uid > id > filename
    const id = frontmatter.uid || frontmatter.id || toValidId(filenameNoExt);

    // Determine type from frontmatter or infer from directory
    const typeMap = {
      'exhibits': 'exhibit',
      'authorities': 'authority',
      'witness': 'witness',
      'experts': 'expert',
      'procedural': 'procedural',
      'sections': 'section',
      'tables': 'table',
      'figures': 'figure',
      'notes': 'note'
    };
    const type = frontmatter.type || typeMap[inferredType] || 'exhibit';

    // Parse aliases (ensure it's an array)
    let aliases = [];
    if (frontmatter.aliases) {
      if (Array.isArray(frontmatter.aliases)) {
        aliases = frontmatter.aliases;
      } else if (typeof frontmatter.aliases === 'string') {
        aliases = [frontmatter.aliases];
      }
    }

    // Add the filename (without extension) as an automatic alias
    if (!aliases.includes(filenameNoExt.toLowerCase())) {
      aliases.push(filenameNoExt);
    }

    return {
      // Core identifiers (per AAML v1.1.1)
      id,
      uid: frontmatter.uid || null,
      filename,
      aliases,

      // Document metadata
      type,
      title: frontmatter.title || filenameNoExt,
      party: frontmatter.party || 'claimant',
      date: frontmatter.date || null,

      // Authority-specific fields
      citation: frontmatter.citation || null,
      short_cite: frontmatter.short_cite || null,
      jurisdiction: frontmatter.jurisdiction || null,

      // Optional fields
      tags: frontmatter.tags || [],
      file: frontmatter.file || null,
      asset: frontmatter.asset || null,
      caption: frontmatter.caption || null,
      source: frontmatter.source || null,

      // Content
      content: body.trim(),
      filePath,
      frontmatter
    };

  } catch (err) {
    console.warn(`Warning: Could not load ${filePath}:`, err.message);
    return null;
  }
}

/**
 * Convert a filename to a valid AAML ID
 */
function toValidId(filename) {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Load AAML specification files
 */
async function loadAAMLSpecs(aamlPath) {
  const specs = [];

  try {
    const files = await fs.readdir(aamlPath);

    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(aamlPath, file);
      const content = await fs.readFile(filePath, 'utf-8');

      specs.push({
        filename: file,
        content
      });
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn(`Warning: Could not read AAML specs:`, err.message);
    }
  }

  return specs;
}

// Backwards compatibility alias
const loadArbMLSpecs = loadAAMLSpecs;

/**
 * Watch for changes in notes directory (optional, for dev)
 */
async function watchNotes(notesPath, callback) {
  const chokidar = require('chokidar');

  const watcher = chokidar.watch(notesPath, {
    ignored: /^\./,
    persistent: true
  });

  watcher.on('change', callback);
  watcher.on('add', callback);
  watcher.on('unlink', callback);

  return watcher;
}

module.exports = {
  loadAllNotes,
  loadNote,
  loadAAMLSpecs,
  loadArbMLSpecs, // Backwards compatibility
  toValidId,
  watchNotes
};
