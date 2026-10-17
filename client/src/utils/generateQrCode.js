import QRCode from 'qrcode';

/**
 * Generate QR code as Data URL (base64 image)
 * @param {string} text - Content to encode into QR code (e.g. registration ID)
 * @param {object} options - QRCode options
 * @returns {Promise<string>} Data URL
 */
export async function generateQrCodeDataUrl(text, options = {}) {
  if (!text) return '';
  try {
    return await QRCode.toDataURL(String(text), {
      width: options.width || 300,
      margin: options.margin !== undefined ? options.margin : 2,
      color: {
        dark: options.darkColor || '#0f172a', // Slate 900
        light: options.lightColor || '#ffffff',
      },
      errorCorrectionLevel: options.errorCorrectionLevel || 'M',
    });
  } catch (err) {
    console.error('Failed to generate QR Code:', err);
    return '';
  }
}

/**
 * Download QR code as a PNG file, with optional ID label printed under the QR
 * @param {string} text - Registration ID or code to encode
 * @param {string} [filename] - Custom file name
 * @param {string} [label] - Optional text label under the QR (defaults to text)
 */
export async function downloadQrCodeImage(text, filename = null, label = null) {
  if (!text) return;

  try {
    const qrDataUrl = await generateQrCodeDataUrl(text, { width: 400, margin: 2 });
    if (!qrDataUrl) return;

    const displayLabel = label !== null ? label : text;

    // Create a temporary canvas to produce a high quality branded card
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';

    await new Promise((resolve, reject) => {
      qrImg.onload = resolve;
      qrImg.onerror = reject;
      qrImg.src = qrDataUrl;
    });

    const qrSize = 400;
    const padding = 32;
    const footerHeight = displayLabel ? 64 : 0;

    canvas.width = qrSize + padding * 2;
    canvas.height = qrSize + padding * 2 + footerHeight;

    // Background white rounded rect
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle border
    ctx.strokeStyle = '#e2e8f0'; // slate-200
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

    // Draw QR Code
    ctx.drawImage(qrImg, padding, padding, qrSize, qrSize);

    // Draw label below QR code
    if (displayLabel) {
      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.font = 'bold 22px monospace, Courier New, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(displayLabel, canvas.width / 2, padding + qrSize + 28);

      ctx.fillStyle = '#64748b'; // slate-500
      ctx.font = '12px sans-serif';
      ctx.fillText('ID PENDAFTARAN RESMI CKF', canvas.width / 2, padding + qrSize + 50);
    }

    // Convert canvas to download link
    const link = document.createElement('a');
    link.download = filename || `QR_${String(text).replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Error downloading QR code:', err);
    // Fallback: direct simple data URL download
    try {
      const simpleDataUrl = await generateQrCodeDataUrl(text, { width: 350 });
      const link = document.createElement('a');
      link.download = filename || `QR_${text}.png`;
      link.href = simpleDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (fallbackErr) {
      alert('Gagal mengunduh QR Code: ' + (err.message || err));
    }
  }
}
