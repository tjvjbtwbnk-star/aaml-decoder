/**
 * AAML Web Renderer
 * Generates interactive HTML output with clickable references
 *
 * AAML (AI-Native Arbitration Markup Language) v1.1.1
 */

const fs = require('fs').promises;
const { marked } = require('marked');
const { resolveIdentifierToNote, ANCHOR_REGEX } = require('./parser');

// Combined regex for all reference types
const ALL_REFS_REGEX = /\[\[(?!#)(?!fig:)(?!tbl:)([^\[\]|#]+?)(?:\|([^\[\]|\n]+))?\]\]|\[\[#([a-zA-Z0-9][a-zA-Z0-9_-]*)(?:\|([^\[\]|\n]+))?\]\]|\[\[(fig|tbl):([a-zA-Z0-9][a-zA-Z0-9_-]*)(?:\|([^\[\]|\n]+))?\]\]/g;

// Month names for date formatting
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Convert number to Roman numeral
 */
function toRoman(num) {
  const romanNumerals = [
    ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
    ['C', 100], ['XC', 90], ['L', 50], ['XL', 40],
    ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]
  ];
  let result = '';
  for (const [letter, value] of romanNumerals) {
    while (num >= value) {
      result += letter;
      num -= value;
    }
  }
  return result;
}

/**
 * Convert number to capital letter (1=A, 2=B, etc.)
 */
function toCapitalLetter(num) {
  return String.fromCharCode(64 + num);
}

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
 * Render to interactive web HTML
 */
async function renderWeb(parsed, registry, notesRegistry, options) {
  const { title, outputPath } = options;

  const html = generateWebHTML(parsed, registry, notesRegistry, title);
  await fs.writeFile(outputPath, html, 'utf-8');
  console.log(`Web HTML saved to: ${outputPath}`);
}

/**
 * Generate interactive web HTML with popup references
 */
function generateWebHTML(parsed, registry, notesRegistry, title) {
  const references = [];
  let refCounter = 0;

  // Process content
  let processedContent = parsed.content;

  // Remove frontmatter
  processedContent = processedContent.replace(/^---[\s\S]*?---\n*/m, '');

  // Replace all references with interactive markers
  processedContent = processedContent.replace(ALL_REFS_REGEX, (match, docId, docPinpoint, internalId, internalContext, prefixType, prefixId, prefixPinpoint) => {

    // Internal reference [[#anchor]]
    if (internalId) {
      return `<span class="ref-inline">paragraph ${internalId}</span>`;
    }

    // Figure or table reference [[fig:id]] or [[tbl:id]]
    if (prefixType) {
      const refType = prefixType === 'fig' ? 'figure' : 'table';
      const refRegistry = prefixType === 'fig' ? registry.figures : registry.tables;
      const item = refRegistry.get(prefixId);

      if (item) {
        const pinpoint = prefixPinpoint ? `, ${prefixPinpoint}` : '';
        return `<span class="ref-inline">${item.assignedNumber}${pinpoint}</span>`;
      }
      return `<span class="ref-unknown">[Unknown ${refType}: ${prefixId}]</span>`;
    }

    // Document reference [[identifier]] or [[identifier|pinpoint]]
    if (docId) {
      const identifier = docId.trim();
      const pinpoint = docPinpoint ? docPinpoint.trim() : null;

      // Resolve the identifier to a note
      const note = resolveIdentifierToNote(identifier, notesRegistry);

      if (!note) {
        return `<span class="ref-unknown">[Unknown: ${identifier}]</span>`;
      }

      refCounter++;
      const refNum = refCounter;

      // Build resolved text
      let resolved = '';
      const noteType = note.type || 'exhibit';

      switch (noteType) {
        case 'exhibit': {
          const exhibit = registry.exhibits.get(note.id);
          if (exhibit) {
            resolved = `Exhibit ${exhibit.assignedNumber}`;
            if (pinpoint) resolved += `, ${pinpoint}`;
          }
          break;
        }
        case 'authority': {
          const auth = registry.authorities.get(note.id);
          if (auth) {
            resolved = auth.short_cite || auth.title || note.id;
            if (pinpoint) resolved += `, ${pinpoint}`;
          }
          break;
        }
        case 'witness': {
          const witness = registry.witnesses.get(note.id);
          if (witness) {
            resolved = witness.assignedNumber;
            if (pinpoint) resolved += `, ${pinpoint}`;
          }
          break;
        }
        case 'expert': {
          const expert = registry.experts.get(note.id);
          if (expert) {
            resolved = expert.assignedNumber;
            if (pinpoint) resolved += `, ${pinpoint}`;
          }
          break;
        }
        default:
          resolved = note.title || identifier;
          if (pinpoint) resolved += `, ${pinpoint}`;
      }

      // Format title with date
      let formattedTitle = note.title || identifier;
      if (note.date) {
        formattedTitle = formattedTitle.replace(/dated\s+\d{4}-\d{2}-\d{2}/i, formatDate(note.date));
        if (!formattedTitle.toLowerCase().includes('dated')) {
          formattedTitle += `, ${formatDate(note.date)}`;
        }
      }

      // Store reference data for popup
      references.push({
        number: refNum,
        resolved,
        noteId: note.id,
        note: note,
        pinpoint,
        formattedTitle
      });

      return `<sup class="ref-marker" data-ref="${refNum}">${refNum}</sup>`;
    }

    return match;
  });

  // Remove anchors
  processedContent = processedContent.replace(ANCHOR_REGEX, '');

  // Convert to HTML
  const bodyHTML = marked(processedContent);
  const numberedBody = addHierarchicalNumberingWeb(bodyHTML);

  // Generate reference data JSON
  const refDataJSON = JSON.stringify(references.map(r => ({
    number: r.number,
    resolved: r.resolved,
    noteId: r.noteId,
    title: r.formattedTitle || r.note?.title || r.noteId,
    content: r.note?.content || 'No content available',
    pinpoint: r.pinpoint
  })));

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    :root {
      --primary: #1a365d;
      --primary-light: #2c5282;
      --accent: #ed8936;
      --bg: #fafafa;
      --text: #2d3748;
      --text-light: #718096;
      --border: #e2e8f0;
    }

    * {
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }

    body {
      font-family: 'Charter', 'Georgia', serif;
      font-size: 18px;
      line-height: 1.7;
      color: var(--text);
      background: var(--bg);
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }

    .container {
      max-width: 720px;
      margin: 0 auto;
      padding: 40px 24px 100px;
    }

    header {
      margin-bottom: 48px;
      padding-bottom: 24px;
      border-bottom: 2px solid var(--primary);
    }

    h1 {
      font-size: 26px;
      font-weight: 700;
      color: var(--primary);
      margin: 32px 0 12px 0;
      line-height: 1.3;
      text-transform: uppercase;
    }

    .doc-title {
      font-size: 28px;
      font-weight: 700;
      color: var(--primary);
      margin: 0 0 8px 0;
    }

    .subtitle {
      font-size: 14px;
      color: var(--text-light);
    }

    h2 {
      font-size: 20px;
      font-weight: 700;
      color: var(--primary);
      margin: 28px 0 10px 0;
    }

    h3 {
      font-size: 18px;
      font-weight: 700;
      color: var(--primary-light);
      margin: 22px 0 8px 0;
    }

    h4, h5, h6 {
      font-size: 16px;
      font-weight: 700;
      color: var(--primary-light);
      margin: 18px 0 6px 0;
    }

    .para-numbered {
      display: flex;
      margin-bottom: 16px;
      padding: 8px 0;
    }

    .para-number {
      min-width: 42px;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-light);
      padding-top: 4px;
      flex-shrink: 0;
    }

    .para-content {
      flex: 1;
    }

    ul, ol {
      margin: 8px 0 16px 42px;
      padding: 0;
    }

    li {
      margin-bottom: 6px;
    }

    .section-divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #cbd5e1, transparent);
      margin: 32px 0;
    }

    .ref-marker {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      font-size: 11px;
      font-weight: 600;
      color: white;
      background: var(--accent);
      border-radius: 10px;
      cursor: pointer;
      transition: transform 0.15s ease, background 0.15s ease;
      vertical-align: super;
      margin: 0 2px;
      padding: 0 6px;
    }

    .ref-marker:hover {
      background: var(--primary);
      transform: scale(1.1);
    }

    .ref-marker:active {
      transform: scale(0.95);
    }

    .ref-inline {
      font-style: italic;
      color: var(--primary-light);
    }

    .ref-unknown {
      color: #cc0000;
      font-style: italic;
    }

    blockquote {
      margin: 20px 0 20px 42px;
      padding: 14px 18px;
      background: white;
      border-left: 4px solid var(--accent);
      border-radius: 0 8px 8px 0;
      font-style: italic;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 15px;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    th, td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }

    th {
      background: var(--primary);
      color: white;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    tr:last-child td {
      border-bottom: none;
    }

    strong {
      font-weight: 700;
    }

    em {
      font-style: italic;
    }

    /* Popup overlay */
    .popup-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .popup-overlay.active {
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 1;
    }

    .popup {
      background: white;
      border-radius: 16px;
      max-width: 90%;
      max-height: 80vh;
      width: 500px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      transform: translateY(20px);
      transition: transform 0.2s ease;
    }

    .popup-overlay.active .popup {
      transform: translateY(0);
    }

    .popup-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: var(--primary);
      color: white;
    }

    .popup-title {
      font-size: 14px;
      font-weight: 600;
    }

    .popup-ref-num {
      background: var(--accent);
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .popup-close {
      width: 32px;
      height: 32px;
      border: none;
      background: rgba(255,255,255,0.2);
      color: white;
      border-radius: 8px;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s ease;
    }

    .popup-close:hover {
      background: rgba(255,255,255,0.3);
    }

    .popup-body {
      padding: 20px;
      max-height: 60vh;
      overflow-y: auto;
    }

    .popup-resolved {
      font-size: 16px;
      font-weight: 600;
      color: var(--primary);
      margin-bottom: 12px;
    }

    .popup-note-title {
      font-size: 14px;
      color: var(--text);
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border);
    }

    .popup-content {
      font-size: 14px;
      line-height: 1.6;
      color: var(--text-light);
      white-space: pre-wrap;
    }

    .popup-pinpoint {
      margin-top: 12px;
      padding: 8px 12px;
      background: #fef3c7;
      border-radius: 6px;
      font-size: 13px;
      color: #92400e;
    }

    @media (max-width: 768px) {
      body {
        font-size: 17px;
      }

      .container {
        padding: 24px 16px 80px;
      }

      h1 {
        font-size: 22px;
      }

      .popup {
        width: 95%;
        max-height: 85vh;
      }

      .ref-marker {
        min-width: 24px;
        height: 24px;
        font-size: 12px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1 class="doc-title">${title}</h1>
      <div class="subtitle">AAML Web Export • ${new Date().toLocaleDateString()}</div>
    </header>

    <main>
      ${numberedBody}
    </main>
  </div>

  <!-- Reference popup -->
  <div class="popup-overlay" id="popupOverlay">
    <div class="popup">
      <div class="popup-header">
        <div class="popup-title">Reference</div>
        <span class="popup-ref-num" id="popupRefNum"></span>
        <button class="popup-close" id="popupClose">&times;</button>
      </div>
      <div class="popup-body">
        <div class="popup-resolved" id="popupResolved"></div>
        <div class="popup-note-title" id="popupNoteTitle"></div>
        <div class="popup-content" id="popupContent"></div>
        <div class="popup-pinpoint" id="popupPinpoint" style="display:none"></div>
      </div>
    </div>
  </div>

  <script>
    const refData = ${refDataJSON};

    const overlay = document.getElementById('popupOverlay');
    const closeBtn = document.getElementById('popupClose');

    function closePopup() {
      overlay.classList.remove('active');
    }

    function openPopup(refNum) {
      const ref = refData.find(r => r.number === refNum);
      if (!ref) return;

      document.getElementById('popupRefNum').textContent = '#' + ref.number;
      document.getElementById('popupResolved').textContent = ref.resolved;
      document.getElementById('popupNoteTitle').textContent = ref.title;
      document.getElementById('popupContent').textContent = ref.content.substring(0, 500) + (ref.content.length > 500 ? '...' : '');

      const pinpointEl = document.getElementById('popupPinpoint');
      if (ref.pinpoint) {
        pinpointEl.textContent = 'Pinpoint: ' + ref.pinpoint;
        pinpointEl.style.display = 'block';
      } else {
        pinpointEl.style.display = 'none';
      }

      overlay.classList.add('active');
    }

    closeBtn.addEventListener('click', closePopup);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closePopup();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closePopup();
    });

    document.querySelectorAll('.ref-marker').forEach(marker => {
      marker.addEventListener('click', () => {
        const refNum = parseInt(marker.dataset.ref, 10);
        openPopup(refNum);
      });
    });
  </script>
</body>
</html>`;
}

/**
 * Add hierarchical heading numbers and paragraph numbers for web view
 */
function addHierarchicalNumberingWeb(html) {
  let h1Counter = 0;
  let h2Counter = 0;
  let h3Counter = 0;
  let paraNumber = 1;

  // Split by H1 to add section dividers
  const h1Pattern = /(<h1>[\s\S]*?<\/h1>)/gi;
  const parts = html.split(h1Pattern);

  const processedParts = parts.map((part, index) => {
    let processed = part;

    // Number H1 headings with Roman numerals
    if (processed.match(/^<h1>/i)) {
      h1Counter++;
      h2Counter = 0;
      h3Counter = 0;
      const roman = toRoman(h1Counter);
      processed = processed.replace(/<h1>([\s\S]*?)<\/h1>/i, `<h1>${roman}.<span style="display:inline-block;width:0.8em"></span>$1</h1>`);

      // Add section divider before H1 (except the first one)
      if (h1Counter > 1) {
        processed = `<div class="section-divider"></div>` + processed;
      }
      return processed;
    }

    // Number H2 headings with capital letters
    processed = processed.replace(/<h2>([\s\S]*?)<\/h2>/gi, (match, content) => {
      h2Counter++;
      h3Counter = 0;
      const letter = toCapitalLetter(h2Counter);
      return `<h2>${letter}.<span style="display:inline-block;width:0.8em"></span>${content}</h2>`;
    });

    // Number H3 headings with Arabic numerals
    processed = processed.replace(/<h3>([\s\S]*?)<\/h3>/gi, (match, content) => {
      h3Counter++;
      return `<h3>${h3Counter}.<span style="display:inline-block;width:0.8em"></span>${content}</h3>`;
    });

    // Number paragraphs, excluding those inside lists and blockquotes
    const excludePattern = /(<(?:ul|ol|blockquote)[\s\S]*?<\/(?:ul|ol|blockquote)>)/gi;
    const contentParts = processed.split(excludePattern);

    processed = contentParts.map(contentPart => {
      if (contentPart.match(/^<(?:ul|ol|blockquote)/i)) {
        return contentPart;
      }

      return contentPart.replace(/<p>([\s\S]*?)<\/p>/g, (match, content) => {
        const trimmed = content.trim();
        if (!trimmed) return match;

        const num = paraNumber++;
        return `<div class="para-numbered">
      <span class="para-number">${num}.</span>
      <div class="para-content">${content}</div>
    </div>`;
      });
    }).join('');

    return processed;
  });

  return processedParts.join('');
}

module.exports = {
  renderWeb,
  generateWebHTML,
  formatDate,
  toRoman,
  toCapitalLetter
};
