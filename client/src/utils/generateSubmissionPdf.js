/**
 * generateSubmissionPdf.js
 * Generates a compact, registration-form-style PDF for a custom form submission.
 * Text fields are laid out in a dense two-column label/value table.
 * Image fields appear as a contained thumbnail section below the data table.
 */
import { jsPDF } from 'jspdf';

/** Fetch a remote image URL and return a base64 data-URL string, or null on failure. */
async function fetchImageAsBase64(url) {
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Read an image's natural width/height from a base64 data URL.
 * Returns { w, h } in pixels, or null on failure.
 */
function getImageDimensions(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

/**
 * Generates and downloads a PDF for a single form submission.
 *
 * @param {Object} submission  - Submission object { id, data, createdAt, status, adminNotes }
 * @param {Array}  fields      - Form field definitions [{ id, label, type }, …]
 * @param {string} formTitle   - Human-readable form title
 * @param {string} formId      - Form ID prefix (unused visually, kept for filename)
 */
export async function generateSubmissionPdf(submission, fields, formTitle, formId) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ── Constants ────────────────────────────────────────────────────────────
  const PW = 210;
  const PH = 297;
  const ML = 15;   // left margin
  const MR = 15;   // right margin
  const CW = PW - ML - MR;  // content width = 180 mm

  // Colours (RGB)
  const C_HEADER_BG  = [22, 30, 46];   // very dark navy
  const C_ACCENT     = [79, 70, 229];   // indigo-600
  const C_RULE       = [203, 213, 225]; // slate-300
  const C_LABEL_BG   = [241, 245, 249]; // slate-100
  const C_LABEL_TXT  = [71, 85, 105];   // slate-600
  const C_VALUE_TXT  = [15, 23, 42];    // slate-900
  const C_MUTED      = [100, 116, 139]; // slate-500
  const C_WHITE      = [255, 255, 255];
  const C_FOOTER_BG  = [22, 30, 46];

  // Table column widths for label|value rows
  const COL_LABEL = 55;   // mm – left column (label)
  const COL_VALUE = CW - COL_LABEL; // right column (value)
  const ROW_MIN   = 7;    // minimum row height mm
  const ROW_PAD   = 2;    // internal vertical padding mm

  let y = 0; // current Y cursor

  // ── Helpers ──────────────────────────────────────────────────────────────
  function newPage() {
    doc.addPage();
    y = ML;
  }

  function ensureSpace(needed) {
    if (y + needed > PH - 18) newPage();
  }

  // Draw a single label|value row
  function drawRow(label, valueLines, rowH, isAlt) {
    ensureSpace(rowH);

    // Label cell background
    doc.setFillColor(...C_LABEL_BG);
    doc.rect(ML, y, COL_LABEL, rowH, 'F');

    // Label text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...C_LABEL_TXT);
    const labelWrapped = doc.splitTextToSize(label, COL_LABEL - 4);
    doc.text(labelWrapped, ML + 3, y + ROW_PAD + 3.5);

    // Value cell background (alternating very light tint)
    if (isAlt) {
      doc.setFillColor(248, 250, 252);
      doc.rect(ML + COL_LABEL, y, COL_VALUE, rowH, 'F');
    }

    // Value text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...C_VALUE_TXT);
    doc.text(valueLines, ML + COL_LABEL + 3, y + ROW_PAD + 3.5);

    // Bottom border line
    doc.setDrawColor(...C_RULE);
    doc.setLineWidth(0.25);
    doc.line(ML, y + rowH, ML + CW, y + rowH);

    y += rowH;
  }

  // ── PAGE HEADER (drawn on current page) ──────────────────────────────────
  function drawPageHeader() {
    // Full-width dark header band
    doc.setFillColor(...C_HEADER_BG);
    doc.rect(0, 0, PW, 46, 'F');

    // Accent left stripe
    doc.setFillColor(...C_ACCENT);
    doc.rect(0, 0, 4, 46, 'F');

    // Organisation label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('KOMUNITAS KELUARGA FASIH', ML, 12);

    // Document type pill
    const statusText = submission.status || 'BARU';
    const statusColors = {
      BARU:     [59, 130, 246],
      DIPROSES: [245, 158, 11],
      SELESAI:  [16, 185, 129],
    };
    const [sr, sg, sb] = statusColors[statusText] || C_MUTED;
    doc.setFillColor(sr, sg, sb);
    const pill = doc.getTextWidth(statusText) + 6;
    doc.roundedRect(PW - MR - pill, 8, pill, 6, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...C_WHITE);
    doc.text(statusText, PW - MR - pill / 2, 12.3, { align: 'center' });

    // Form title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...C_WHITE);
    const titleLines = doc.splitTextToSize(formTitle || 'Formulir', CW - 20);
    doc.text(titleLines, ML, 22);
    const titleH = titleLines.length * 7;

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Dokumen Respon Formulir', ML, 22 + titleH);

    // Date top-right
    const createdDate = submission.createdAt
      ? new Date(submission.createdAt).toLocaleDateString('id-ID', {
          day: '2-digit', month: 'long', year: 'numeric',
        })
      : '-';
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Dikirim: ${createdDate}`, PW - MR, 12, { align: 'right' });

    y = 52;
  }

  // ── META STRIP (ID + border) ──────────────────────────────────────────────
  function drawMeta() {
    // Outer border for the whole table
    doc.setDrawColor(...C_RULE);
    doc.setLineWidth(0.4);
    // We'll draw the border after all rows; just mark start Y
    return y;
  }

  function drawMetaRow() {
    const metaH = 10;
    ensureSpace(metaH);

    // ID label cell
    doc.setFillColor(...C_ACCENT);
    doc.rect(ML, y, COL_LABEL, metaH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...C_WHITE);
    doc.text('ID PENDAFTARAN', ML + 3, y + 4);

    // ID value cell
    doc.setFillColor(236, 240, 255);
    doc.rect(ML + COL_LABEL, y, COL_VALUE, metaH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...C_ACCENT);
    doc.text(submission.id || '-', ML + COL_LABEL + 3, y + 6.5);

    doc.setDrawColor(...C_RULE);
    doc.setLineWidth(0.25);
    doc.line(ML, y + metaH, ML + CW, y + metaH);

    y += metaH;
  }

  // ── BUILD PDF ────────────────────────────────────────────────────────────

  // Header
  drawPageHeader();

  // Thin space
  y += 2;

  // Outer border left/right/top for the table
  const tableStartY = y;

  // Meta row (ID)
  drawMetaRow();

  // Section header row for data
  const secH = 6.5;
  ensureSpace(secH);
  doc.setFillColor(...C_HEADER_BG);
  doc.rect(ML, y, CW, secH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('DATA JAWABAN FORMULIR', ML + 3, y + 4.3);
  y += secH;

  // Separate image fields from text fields for deferred rendering
  const imageFieldEntries = [];
  let rowIndex = 0;

  for (const field of fields) {
    const val = submission.data?.[field.id];
    const isImage = field.type === 'image' || field.type === 'file';

    if (isImage) {
      // Collect for later rendering (after all text rows)
      imageFieldEntries.push({ field, val });
      continue;
    }

    // Build display value
    let displayVal = '-';
    if (Array.isArray(val)) {
      displayVal = val.length > 0 ? val.join(', ') : '-';
    } else if (val !== null && val !== undefined && val !== '') {
      displayVal = String(val);
    }

    // Calculate how many lines the value needs
    const valueLines = doc.splitTextToSize(displayVal, COL_VALUE - 6);
    // Row height: at least ROW_MIN, grows with text
    const rowH = Math.max(ROW_MIN, valueLines.length * 4.2 + ROW_PAD * 2 + 1);

    drawRow(field.label, valueLines, rowH, rowIndex % 2 === 1);
    rowIndex++;
  }

  // Right border of table
  const tableEndY = y;
  doc.setDrawColor(...C_RULE);
  doc.setLineWidth(0.4);
  doc.rect(ML, tableStartY, CW, tableEndY - tableStartY, 'S');

  // Vertical divider between label/value columns
  doc.setLineWidth(0.3);
  doc.line(ML + COL_LABEL, tableStartY, ML + COL_LABEL, tableEndY);

  // ── ADMIN NOTES ───────────────────────────────────────────────────────────
  if (submission.adminNotes) {
    y += 5;
    ensureSpace(20);

    doc.setFillColor(254, 252, 232); // yellow-50
    doc.setDrawColor(253, 224, 71);  // yellow-300
    doc.setLineWidth(0.4);
    const noteLines = doc.splitTextToSize(submission.adminNotes, CW - 10);
    const noteH = noteLines.length * 4.5 + 8;
    doc.roundedRect(ML, y, CW, noteH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(120, 100, 0);
    doc.text('CATATAN ADMIN', ML + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(92, 78, 0);
    doc.text(noteLines, ML + 4, y + 10);
    y += noteH + 4;
  }

  // ── IMAGE FIELDS ──────────────────────────────────────────────────────────
  if (imageFieldEntries.length > 0) {
    y += 5;
    ensureSpace(12);

    // Section header
    doc.setFillColor(...C_HEADER_BG);
    doc.rect(ML, y, CW, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('BERKAS / LAMPIRAN FOTO', ML + 3, y + 4.3);
    y += 6.5;

    // Render each image in a row: label + thumbnail side by side
    for (const { field, val } of imageFieldEntries) {
      if (!val) {
        // No file uploaded — show a small note row
        const noFileH = 9;
        ensureSpace(noFileH);
        doc.setFillColor(...C_LABEL_BG);
        doc.rect(ML, y, COL_LABEL, noFileH, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...C_LABEL_TXT);
        doc.text(doc.splitTextToSize(field.label, COL_LABEL - 4), ML + 3, y + 3.5);

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(...C_MUTED);
        doc.text('Tidak ada berkas diunggah', ML + COL_LABEL + 3, y + 3.5);

        doc.setDrawColor(...C_RULE);
        doc.setLineWidth(0.25);
        doc.line(ML, y + noFileH, ML + CW, y + noFileH);
        doc.setLineWidth(0.4);
        doc.rect(ML, y, CW, noFileH, 'S');
        doc.setLineWidth(0.3);
        doc.line(ML + COL_LABEL, y, ML + COL_LABEL, y + noFileH);
        y += noFileH;
        continue;
      }

      // Try to fetch the image
      const b64 = await fetchImageAsBase64(val);
      const dims = b64 ? await getImageDimensions(b64) : null;

      // Max image dimensions inside the cell (right column minus padding)
      const imgMaxW = COL_VALUE - 8; // leave padding
      const imgMaxH = 45; // cap height to keep rows compact

      let imgW = imgMaxW;
      let imgH = imgMaxH;

      if (dims && dims.w > 0 && dims.h > 0) {
        const aspectRatio = dims.w / dims.h;
        imgH = imgW / aspectRatio;
        if (imgH > imgMaxH) {
          imgH = imgMaxH;
          imgW = imgH * aspectRatio;
        }
      }

      const rowH = Math.max(imgH + 6, 20);
      ensureSpace(rowH + 2);

      // Label cell
      doc.setFillColor(...C_LABEL_BG);
      doc.rect(ML, y, COL_LABEL, rowH, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...C_LABEL_TXT);
      const labelWrapped = doc.splitTextToSize(field.label, COL_LABEL - 4);
      doc.text(labelWrapped, ML + 3, y + 4);

      // Value cell — render image
      if (b64) {
        try {
          const imgX = ML + COL_LABEL + 3;
          const imgY = y + 3;
          // Subtle image border
          doc.setDrawColor(...C_RULE);
          doc.setLineWidth(0.3);
          doc.rect(imgX - 0.5, imgY - 0.5, imgW + 1, imgH + 1, 'S');
          doc.addImage(b64, undefined, imgX, imgY, imgW, imgH, undefined, 'FAST');
        } catch {
          // fallback: URL text
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7.5);
          doc.setTextColor(180, 50, 50);
          doc.text('(Gagal memuat gambar)', ML + COL_LABEL + 3, y + 6);
        }
      } else {
        // Could not fetch — show URL
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(...C_MUTED);
        const urlLines = doc.splitTextToSize(`URL: ${val}`, COL_VALUE - 6);
        doc.text(urlLines, ML + COL_LABEL + 3, y + 4.5);
      }

      // Row borders
      doc.setDrawColor(...C_RULE);
      doc.setLineWidth(0.25);
      doc.line(ML, y + rowH, ML + CW, y + rowH);
      doc.setLineWidth(0.4);
      doc.rect(ML, y, CW, rowH, 'S');
      doc.setLineWidth(0.3);
      doc.line(ML + COL_LABEL, y, ML + COL_LABEL, y + rowH);

      y += rowH;
    }
  }

  // ── FOOTER on every page ──────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(...C_FOOTER_BG);
    doc.rect(0, PH - 12, PW, 12, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Dokumen digenerate otomatis dari CKF-Web  •  ${formTitle || 'Formulir'}`,
      ML, PH - 4.5,
    );
    doc.text(`Halaman ${p} / ${totalPages}`, PW - MR, PH - 4.5, { align: 'right' });
  }

  // ── SAVE ──────────────────────────────────────────────────────────────────
  const safeTitle = (formTitle || 'Formulir')
    .replace(/[^a-zA-Z0-9\s\-_]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 30);
  const filename = `Respon_${safeTitle}_${submission.id || 'unknown'}.pdf`;
  doc.save(filename);
}
