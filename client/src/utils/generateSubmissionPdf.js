/**
 * generateSubmissionPdf.js
 * Generates a professional PDF for a custom form submission using jsPDF.
 * Handles text fields, array values, and image fields (via base64 fetch).
 */
import { jsPDF } from 'jspdf';

/**
 * Fetches an image URL and converts it to a base64 data URL.
 * Returns null if fetching fails.
 */
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
 * Wraps long text to fit within maxWidth and returns an array of lines.
 * Uses jsPDF's built-in splitTextToSize.
 */
function wrapText(doc, text, maxWidth) {
  return doc.splitTextToSize(String(text || '-'), maxWidth);
}

/**
 * Main function: generates and downloads a PDF for a single submission.
 *
 * @param {Object} submission  - The submission object (id, data, createdAt, status)
 * @param {Array}  fields      - The form's field definitions (id, label, type)
 * @param {string} formTitle   - Title of the parent form
 * @param {string} formId      - ID / prefix of the form (e.g. "CKF-SAFIR")
 */
export async function generateSubmissionPdf(submission, fields, formTitle, formId) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ─── Color palette ────────────────────────────────────────────────────────
  const COLOR_PRIMARY    = [30, 41, 59];   // slate-800
  const COLOR_ACCENT     = [99, 102, 241]; // indigo-500
  const COLOR_MUTED      = [100, 116, 139]; // slate-500
  const COLOR_LABEL      = [71, 85, 105];  // slate-600
  const COLOR_VALUE      = [15, 23, 42];   // slate-900
  const COLOR_DIVIDER    = [226, 232, 240]; // slate-200
  const COLOR_HEADER_BG  = [30, 41, 59];   // slate-800
  const COLOR_SECTION_BG = [248, 250, 252]; // slate-50

  const PAGE_W = 210;
  const PAGE_H = 297;
  const MARGIN = 18;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  let y = 0;

  // ─── Helper: ensure space, add new page if needed ─────────────────────────
  function ensureSpace(needed) {
    if (y + needed > PAGE_H - 20) {
      doc.addPage();
      y = MARGIN;
    }
  }

  // ─── HEADER BLOCK ──────────────────────────────────────────────────────────
  // Dark header background
  doc.setFillColor(...COLOR_HEADER_BG);
  doc.rect(0, 0, PAGE_W, 52, 'F');

  // Accent bar on left
  doc.setFillColor(...COLOR_ACCENT);
  doc.rect(0, 0, 5, 52, 'F');

  // Organization name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('KOMUNITAS KELUARGA FASIH', MARGIN, 16);

  // Form title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  const titleLines = doc.splitTextToSize(formTitle || 'Formulir', CONTENT_W);
  doc.text(titleLines, MARGIN, 26);
  const titleH = titleLines.length * 7;

  // Subtitle: Document type
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('Dokumen Respon Formulir', MARGIN, 26 + titleH);

  // Top-right: date
  const createdDate = submission.createdAt
    ? new Date(submission.createdAt).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : '-';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Dikirim: ${createdDate}`, PAGE_W - MARGIN, 16, { align: 'right' });

  y = 58;

  // ─── META INFO (ID Pendaftaran & Status) ───────────────────────────────────
  doc.setFillColor(...COLOR_SECTION_BG);
  doc.roundedRect(MARGIN, y, CONTENT_W, 22, 3, 3, 'F');
  doc.setDrawColor(...COLOR_DIVIDER);
  doc.roundedRect(MARGIN, y, CONTENT_W, 22, 3, 3, 'S');

  // ID Pendaftaran
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_MUTED);
  doc.text('ID PENDAFTARAN', MARGIN + 4, y + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLOR_VALUE);
  doc.text(submission.id || '-', MARGIN + 4, y + 15);

  // Status badge (right side)
  const statusText = submission.status || 'BARU';
  const statusColors = {
    BARU: [59, 130, 246],
    DIPROSES: [245, 158, 11],
    SELESAI: [16, 185, 129],
  };
  const [sr, sg, sb] = statusColors[statusText] || [100, 116, 139];
  doc.setFillColor(sr, sg, sb);
  const badgeW = 28;
  doc.roundedRect(PAGE_W - MARGIN - badgeW - 4, y + 6, badgeW, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(statusText, PAGE_W - MARGIN - badgeW / 2 - 4, y + 12.5, { align: 'center' });

  y += 28;

  // ─── SECTION TITLE: Data Jawaban ──────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR_ACCENT);
  doc.text('DATA JAWABAN FORMULIR', MARGIN, y);
  doc.setDrawColor(...COLOR_ACCENT);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y + 1.5, MARGIN + 60, y + 1.5);
  y += 7;

  // ─── FIELDS LOOP ──────────────────────────────────────────────────────────
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    const val = submission.data?.[field.id];
    const isImage = field.type === 'image' || field.type === 'file';

    if (isImage) {
      // ── IMAGE FIELD ───────────────────────────────────────────────────────
      const estimatedH = 12 + 65; // label + image block
      ensureSpace(estimatedH);

      // Label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_LABEL);
      doc.text(`${i + 1}. ${field.label}`, MARGIN, y);
      y += 5;

      if (val) {
        // Show image URL hint
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(...COLOR_MUTED);
        const urlLines = doc.splitTextToSize(`URL: ${val}`, CONTENT_W);
        doc.text(urlLines, MARGIN + 2, y);
        y += urlLines.length * 4 + 2;

        // Try to embed image
        const b64 = await fetchImageAsBase64(val);
        if (b64) {
          const imgMaxW = CONTENT_W * 0.55;
          const imgH = imgMaxW * 0.6; // approximate 3:5 aspect
          ensureSpace(imgH + 6);
          try {
            doc.addImage(b64, 'JPEG', MARGIN + 2, y, imgMaxW, imgH, undefined, 'FAST');
            y += imgH + 4;
          } catch {
            // If addImage fails, just show URL
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(7.5);
            doc.setTextColor(200, 50, 50);
            doc.text('(Gagal memuat gambar – silakan lihat URL di atas)', MARGIN + 2, y);
            y += 6;
          }
        } else {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7.5);
          doc.setTextColor(200, 50, 50);
          doc.text('(Gambar tidak dapat diunduh – lihat URL di atas)', MARGIN + 2, y);
          y += 6;
        }
      } else {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(...COLOR_MUTED);
        doc.text('Tidak ada berkas diunggah', MARGIN + 2, y);
        y += 5;
      }

      y += 4;
    } else {
      // ── TEXT / ARRAY FIELD ────────────────────────────────────────────────
      let displayVal = '-';
      if (Array.isArray(val)) {
        displayVal = val.length > 0 ? val.join(', ') : '-';
      } else if (val !== null && val !== undefined && val !== '') {
        displayVal = String(val);
      }

      const labelLine = `${i + 1}. ${field.label}`;
      const valueLines = wrapText(doc, displayVal, CONTENT_W - 4);
      const blockH = 7 + valueLines.length * 4.5 + 6;

      ensureSpace(blockH);

      // Light background
      doc.setFillColor(...COLOR_SECTION_BG);
      doc.roundedRect(MARGIN, y - 1, CONTENT_W, blockH - 2, 2, 2, 'F');

      // Label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_LABEL);
      doc.text(labelLine, MARGIN + 3, y + 5);
      y += 8;

      // Value
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(...COLOR_VALUE);
      doc.text(valueLines, MARGIN + 3, y);
      y += valueLines.length * 4.5 + 4;

      // Divider between fields
      doc.setDrawColor(...COLOR_DIVIDER);
      doc.setLineWidth(0.3);
      doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
      y += 4;
    }
  }

  // ─── ADMIN NOTES (if any) ─────────────────────────────────────────────────
  if (submission.adminNotes) {
    ensureSpace(30);
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR_ACCENT);
    doc.text('CATATAN ADMIN', MARGIN, y);
    doc.setDrawColor(...COLOR_ACCENT);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y + 1.5, MARGIN + 42, y + 1.5);
    y += 7;

    doc.setFillColor(254, 249, 195); // yellow-100
    const noteLines = wrapText(doc, submission.adminNotes, CONTENT_W - 8);
    const noteH = noteLines.length * 5 + 8;
    doc.roundedRect(MARGIN, y - 2, CONTENT_W, noteH, 3, 3, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(92, 78, 0); // amber-900
    doc.text(noteLines, MARGIN + 4, y + 4);
    y += noteH + 4;
  }

  // ─── FOOTER ───────────────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Footer bar
    doc.setFillColor(...COLOR_HEADER_BG);
    doc.rect(0, PAGE_H - 14, PAGE_W, 14, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Dokumen ini digenerate otomatis dari sistem CKF-Web • ${formTitle || 'Formulir'}`,
      MARGIN,
      PAGE_H - 6,
    );
    doc.text(`Halaman ${p} / ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 6, { align: 'right' });
  }

  // ─── SAVE PDF ─────────────────────────────────────────────────────────────
  const safeTitle = (formTitle || 'Formulir')
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 30);
  const filename = `Respon_${safeTitle}_${submission.id || 'unknown'}.pdf`;
  doc.save(filename);
}
