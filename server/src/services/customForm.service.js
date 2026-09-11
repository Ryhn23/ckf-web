import fs from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';
import prisma from '../config/prisma.js';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import { slugify } from '../utils/slugify.js';
import { processMediaFile, removeUploadFile } from '../middlewares/upload.js';

const UPLOAD_DIR = path.resolve(process.cwd(), env.uploadDir);

/**
 * Generate unique slug for CustomForm
 */
async function generateUniqueSlug(baseText, excludeId = null) {
  let baseSlug = slugify(baseText || 'formulir-kustom');
  if (!baseSlug) baseSlug = `form-${Date.now()}`;

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.customForm.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || (excludeId && existing.id === excludeId)) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * Format date to readable string (WIB)
 */
function formatDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Generate unique submission ID based on custom formCode / prefix
 * e.g., if formCode is "CKF-SAFIR", returns "CKF-SAFIR-A1B2C3D4"
 */
async function generateSubmissionId(formCode) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const prefix = formCode && formCode.trim() ? formCode.trim().toUpperCase() : 'CKF';
  const separator = prefix.endsWith('-') || prefix.endsWith('_') ? '' : '-';

  for (let attempt = 0; attempt < 10; attempt++) {
    let random8 = '';
    for (let i = 0; i < 8; i++) {
      random8 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const candidateId = `${prefix}${separator}${random8}`;
    const existing = await prisma.customFormSubmission.findUnique({
      where: { id: candidateId },
      select: { id: true },
    });
    if (!existing) {
      return candidateId;
    }
  }

  // Fallback if collision persists
  const randFallback = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}${separator}${randFallback}`;
}

export const customFormService = {
  /**
   * List forms with pagination, search, and submission counts
   */
  async listForms({ search = '', page = 1, limit = 10, isActive = null } = {}) {
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { slug: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true' || isActive === true;
    }

    const [total, forms, totalActive, totalSubmissions, recentSubmissions] = await Promise.all([
      prisma.customForm.count({ where }),
      prisma.customForm.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          _count: {
            select: { submissions: true },
          },
        },
      }),
      prisma.customForm.count({ where: { isActive: true } }),
      prisma.customFormSubmission.count(),
      prisma.customFormSubmission.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return {
      forms,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      stats: {
        totalForms: total,
        activeForms: totalActive,
        totalSubmissions,
        submissionsToday: recentSubmissions,
      },
    };
  },

  /**
   * Get form by ID with submission stats
   */
  async getFormById(id) {
    const form = await prisma.customForm.findUnique({
      where: { id },
      include: {
        _count: {
          select: { submissions: true },
        },
      },
    });

    if (!form) {
      throw ApiError.notFound('Formulir kustom tidak ditemukan');
    }

    return form;
  },

  /**
   * Get public form by Slug (only accessible if active or preview mode)
   */
  async getPublicFormBySlug(slug) {
    const form = await prisma.customForm.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        coverImage: true,
        formCode: true,
        fields: true,
        isActive: true,
        successMessage: true,
        createdAt: true,
      },
    });

    if (!form) {
      throw ApiError.notFound('Formulir tidak ditemukan');
    }

    return form;
  },

  /**
   * Create a new custom form
   */
  async createForm({ title, slug, description, coverImage, formCode, fields = [], isActive = true, successMessage }) {
    if (!title || !title.trim()) {
      throw ApiError.badRequest('Judul formulir wajib diisi');
    }

    const finalSlug = await generateUniqueSlug(slug || title);

    // Normalize and validate fields array
    const normalizedFields = Array.isArray(fields)
      ? fields.map((f, idx) => ({
          id: f.id || `field_${idx + 1}_${Date.now()}`,
          label: f.label || `Field ${idx + 1}`,
          type: f.type || 'text',
          required: Boolean(f.required),
          placeholder: f.placeholder || '',
          helpText: f.helpText || '',
          options: Array.isArray(f.options)
            ? f.options
            : typeof f.options === 'string'
            ? f.options.split(',').map((s) => s.trim()).filter(Boolean)
            : [],
        }))
      : [];

    const newForm = await prisma.customForm.create({
      data: {
        title: title.trim(),
        slug: finalSlug,
        description: description?.trim() || null,
        coverImage: coverImage?.trim() || null,
        formCode: formCode?.trim().toUpperCase() || null,
        fields: normalizedFields,
        isActive: Boolean(isActive),
        successMessage: successMessage?.trim() || 'Terima kasih, formulir Anda telah berhasil dikirim.',
      },
      include: {
        _count: {
          select: { submissions: true },
        },
      },
    });

    return newForm;
  },

  /**
   * Update existing custom form
   */
  async updateForm(id, { title, slug, description, coverImage, formCode, fields, isActive, successMessage }) {
    const existing = await prisma.customForm.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Formulir kustom tidak ditemukan');
    }

    const updateData = {};

    if (title !== undefined) {
      if (!title.trim()) throw ApiError.badRequest('Judul formulir tidak boleh kosong');
      updateData.title = title.trim();
    }

    if (slug !== undefined) {
      updateData.slug = await generateUniqueSlug(slug || existing.title, id);
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (coverImage !== undefined) {
      updateData.coverImage = coverImage?.trim() || null;
    }

    if (formCode !== undefined) {
      updateData.formCode = formCode?.trim().toUpperCase() || null;
    }

    if (fields !== undefined && Array.isArray(fields)) {
      updateData.fields = fields.map((f, idx) => ({
        id: f.id || `field_${idx + 1}_${Date.now()}`,
        label: f.label || `Field ${idx + 1}`,
        type: f.type || 'text',
        required: Boolean(f.required),
        placeholder: f.placeholder || '',
        helpText: f.helpText || '',
        options: Array.isArray(f.options)
          ? f.options
          : typeof f.options === 'string'
          ? f.options.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      }));
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    if (successMessage !== undefined) {
      updateData.successMessage = successMessage?.trim() || 'Terima kasih, formulir Anda telah berhasil dikirim.';
    }

    const updated = await prisma.customForm.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { submissions: true },
        },
      },
    });

    return updated;
  },

  /**
   * Toggle form active status
   */
  async toggleFormStatus(id) {
    const existing = await prisma.customForm.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Formulir kustom tidak ditemukan');
    }

    const updated = await prisma.customForm.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    return updated;
  },

  /**
   * Delete form and cascade submissions
   */
  async deleteForm(id) {
    const existing = await prisma.customForm.findUnique({
      where: { id },
      include: { submissions: true },
    });

    if (!existing) {
      throw ApiError.notFound('Formulir kustom tidak ditemukan');
    }

    // Clean up uploaded files in submissions (best effort)
    try {
      for (const sub of existing.submissions) {
        if (sub.data && typeof sub.data === 'object') {
          for (const val of Object.values(sub.data)) {
            if (typeof val === 'string' && val.startsWith('/uploads/')) {
              removeUploadFile(val);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error cleaning up submission files:', err);
    }

    await prisma.customForm.delete({ where: { id } });
    return { success: true, message: 'Formulir berhasil dihapus' };
  },

  /**
   * Handle public submission with dynamic fields and file/image uploads
   */
  async submitPublicForm(slug, rawData = {}, files = []) {
    const form = await prisma.customForm.findUnique({
      where: { slug },
    });

    if (!form) {
      throw ApiError.notFound('Formulir tidak ditemukan');
    }

    if (!form.isActive) {
      throw ApiError.badRequest('Penerimaan formulir ini telah ditutup.');
    }

    const fields = Array.isArray(form.fields) ? form.fields : [];
    const submissionData = {};
    const uploadedFilesMap = {};

    // Map uploaded files by field name/id
    if (files && files.length > 0) {
      for (const file of files) {
        uploadedFilesMap[file.fieldname] = file;
      }
    }

    // Process each configured field
    for (const field of fields) {
      const fieldId = field.id;
      const isFileField = field.type === 'image' || field.type === 'file';

      if (isFileField) {
        const file = uploadedFilesMap[fieldId];
        if (file) {
          try {
            const { url } = await processMediaFile(file.path, file.mimetype);
            submissionData[fieldId] = url;
          } catch (err) {
            console.error('File process error:', err);
            throw ApiError.badRequest(`Gagal memproses berkas gambar pada ${field.label}`);
          }
        } else if (rawData[fieldId]) {
          // If already a URL or string
          submissionData[fieldId] = String(rawData[fieldId]).trim();
        } else {
          submissionData[fieldId] = null;
        }

        // Required check for file
        if (field.required && !submissionData[fieldId]) {
          throw ApiError.badRequest(`Berkas atau gambar "${field.label}" wajib diunggah`);
        }
      } else {
        // Normal text/select/checkbox field
        let val = rawData[fieldId];

        // Parse JSON if sent as stringified JSON (e.g. checkbox array in multipart form-data)
        if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
          try {
            val = JSON.parse(val);
          } catch {
            // keep as string
          }
        }

        if (Array.isArray(val)) {
          submissionData[fieldId] = val.map((v) => String(v).trim()).filter(Boolean);
        } else if (val !== undefined && val !== null) {
          submissionData[fieldId] = String(val).trim();
        } else {
          submissionData[fieldId] = '';
        }

        // Required check
        if (field.required) {
          const isEmpty =
            submissionData[fieldId] === '' ||
            submissionData[fieldId] === null ||
            (Array.isArray(submissionData[fieldId]) && submissionData[fieldId].length === 0);

          if (isEmpty) {
            throw ApiError.badRequest(`Kolom "${field.label}" wajib diisi`);
          }
        }
      }
    }

    // Generate custom submission ID based on formCode prefix (e.g. CKF-SAFIR-A1B2C3D4)
    const submissionId = await generateSubmissionId(form.formCode);

    // Save submission
    const submission = await prisma.customFormSubmission.create({
      data: {
        id: submissionId,
        formId: form.id,
        data: submissionData,
        status: 'BARU',
      },
    });

    return {
      success: true,
      message: form.successMessage || 'Terima kasih, formulir Anda telah berhasil dikirim.',
      submissionId: submission.id,
      submissionTime: submission.createdAt,
    };
  },

  /**
   * List submissions for a form
   */
  async listSubmissions(formId, { search = '', status = '', page = 1, limit = 20 } = {}) {
    const form = await prisma.customForm.findUnique({
      where: { id: formId },
    });

    if (!form) {
      throw ApiError.notFound('Formulir kustom tidak ditemukan');
    }

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const where = { formId };
    if (status && status.trim()) {
      where.status = status.trim();
    }
    if (search && search.trim()) {
      where.OR = [
        { id: { contains: search.trim(), mode: 'insensitive' } },
        { adminNotes: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [total, submissions, counts] = await Promise.all([
      prisma.customFormSubmission.count({ where }),
      prisma.customFormSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.customFormSubmission.groupBy({
        by: ['status'],
        where: { formId },
        _count: { id: true },
      }),
    ]);

    const statusCounts = {
      TOTAL: 0,
      BARU: 0,
      DIPROSES: 0,
      SELESAI: 0,
    };

    for (const c of counts) {
      statusCounts[c.status] = c._count.id;
      statusCounts.TOTAL += c._count.id;
    }

    return {
      form,
      submissions,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      statusCounts,
    };
  },

  /**
   * Get single submission detail
   */
  async getSubmissionById(submissionId) {
    const submission = await prisma.customFormSubmission.findUnique({
      where: { id: submissionId },
      include: {
        form: {
          select: {
            id: true,
            title: true,
            slug: true,
            fields: true,
          },
        },
      },
    });

    if (!submission) {
      throw ApiError.notFound('Data pengisian formulir tidak ditemukan');
    }

    return submission;
  },

  /**
   * Update submission status or admin notes
   */
  async updateSubmission(submissionId, { status, adminNotes }) {
    const existing = await prisma.customFormSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!existing) {
      throw ApiError.notFound('Data respon formulir tidak ditemukan');
    }

    const updateData = {};
    if (status !== undefined) {
      const validStatuses = ['BARU', 'DIPROSES', 'SELESAI'];
      if (!validStatuses.includes(status)) {
        throw ApiError.badRequest('Status pengajuan tidak valid (Pilihan: BARU, DIPROSES, SELESAI)');
      }
      updateData.status = status;
    }

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes?.trim() || null;
    }

    const updated = await prisma.customFormSubmission.update({
      where: { id: submissionId },
      data: updateData,
    });

    return updated;
  },

  /**
   * Delete single submission
   */
  async deleteSubmission(submissionId) {
    const existing = await prisma.customFormSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!existing) {
      throw ApiError.notFound('Data respon formulir tidak ditemukan');
    }

    // Clean up uploaded files (best effort)
    if (existing.data && typeof existing.data === 'object') {
      for (const val of Object.values(existing.data)) {
        if (typeof val === 'string' && val.startsWith('/uploads/')) {
          removeUploadFile(val);
        }
      }
    }

    await prisma.customFormSubmission.delete({
      where: { id: submissionId },
    });

    return { success: true, message: 'Data respon formulir berhasil dihapus' };
  },

  /**
   * Export all submissions to Excel (.xlsx) using ExcelJS
   */
  async exportSubmissionsToExcel(formId, baseUrl = '') {
    const form = await prisma.customForm.findUnique({
      where: { id: formId },
      include: {
        submissions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!form) {
      throw ApiError.notFound('Formulir kustom tidak ditemukan');
    }

    const fields = Array.isArray(form.fields) ? form.fields : [];
    const submissions = form.submissions || [];

    // Create Excel Workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Yayasan Cinta Kasih Fatimah';
    workbook.lastModifiedBy = 'Admin CKF';
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheet = workbook.addWorksheet('Data Respon', {
      views: [{ showGridLines: true }],
      properties: { tabColor: { argb: '0F172A' } },
    });

    // 1. Header Information (Title Banner)
    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `REKAPITULASI RESPON: ${form.title.toUpperCase()}`;
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0F172A' }, // Dark Slate 900
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    sheet.getRow(1).height = 36;

    sheet.mergeCells('A2:F2');
    const metaCell = sheet.getCell('A2');
    metaCell.value = `Tanggal Ekspor: ${formatDate(new Date())} | Total Respon: ${submissions.length} Data | URL Form: /form/${form.slug}`;
    metaCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: '475569' } };
    metaCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F1F5F9' }, // Slate 100
    };
    metaCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    sheet.getRow(2).height = 24;

    sheet.addRow([]); // Blank line on row 3

    // 2. Define Table Columns
    const columns = [
      { header: 'No', key: 'no', width: 8 },
      { header: 'ID Pendaftaran', key: 'id', width: 24 },
      { header: 'Waktu Pengiriman (WIB)', key: 'createdAt', width: 24 },
      { header: 'Status', key: 'status', width: 14 },
    ];

    // Dynamic field columns
    for (const field of fields) {
      columns.push({
        header: field.label,
        key: field.id,
        width: Math.max(field.label.length + 6, 20),
      });
    }

    // Admin notes column
    columns.push({ header: 'Catatan Admin', key: 'adminNotes', width: 24 });

    // Set columns on sheet (starting at row 4)
    sheet.getRow(4).values = columns.map((c) => c.header);
    sheet.getRow(4).height = 28;

    // Style Header Row (Row 4)
    const headerRow = sheet.getRow(4);
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1E293B' }, // Slate 800
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'CBD5E1' } },
        bottom: { style: 'medium', color: { argb: '0F172A' } },
        left: { style: 'thin', color: { argb: 'CBD5E1' } },
        right: { style: 'thin', color: { argb: 'CBD5E1' } },
      };
    });

    // 3. Add Data Rows
    submissions.forEach((sub, index) => {
      const rowNumber = index + 1;
      const subData = sub.data || {};

      const rowValues = [
        rowNumber,
        sub.id,
        formatDate(sub.createdAt),
        sub.status,
      ];

      // Populate dynamic field values
      fields.forEach((field) => {
        const val = subData[field.id];
        if (field.type === 'image' || field.type === 'file') {
          if (val && typeof val === 'string') {
            const fileUrl = val.startsWith('http') ? val : `${baseUrl}${val}`;
            rowValues.push({
              text: 'Lihat Berkas / Foto',
              hyperlink: fileUrl,
            });
          } else {
            rowValues.push('-');
          }
        } else if (Array.isArray(val)) {
          rowValues.push(val.join(', ') || '-');
        } else if (val !== undefined && val !== null && String(val).trim() !== '') {
          rowValues.push(String(val).trim());
        } else {
          rowValues.push('-');
        }
      });

      // Admin notes
      rowValues.push(sub.adminNotes || '-');

      const dataRow = sheet.addRow(rowValues);
      dataRow.height = 24;

      const isEven = index % 2 === 0;
      dataRow.eachCell((cell, colNumber) => {
        cell.font = { name: 'Calibri', size: 10 };
        cell.alignment = {
          vertical: 'middle',
          horizontal: colNumber <= 4 ? 'center' : 'left',
          wrapText: true,
        };

        // Zebra striping
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'FFFFFF' : 'F8FAFC' },
        };

        cell.border = {
          top: { style: 'thin', color: { argb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'E2E8F0' } },
          right: { style: 'thin', color: { argb: 'E2E8F0' } },
        };

        // Blue styling for hyperlinks
        if (cell.value && cell.value.hyperlink) {
          cell.font = { name: 'Calibri', size: 10, color: { argb: '2563EB' }, underline: true };
        }
      });
    });

    // Auto-fit column widths
    columns.forEach((col, idx) => {
      const sheetCol = sheet.getColumn(idx + 1);
      sheetCol.width = col.width;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return {
      buffer,
      filename: `Respon_${slugify(form.title)}_${new Date().toISOString().slice(0, 10)}.xlsx`,
      formTitle: form.title,
    };
  },
};

export default customFormService;
