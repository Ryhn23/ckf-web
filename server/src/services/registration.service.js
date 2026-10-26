import ExcelJS from 'exceljs';
import prisma from '../config/prisma.js';
import ApiError from '../utils/ApiError.js';
import { slugify } from '../utils/slugify.js';

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

function formatTimeOnly(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Helper to intelligently extract name, phone, email, institution from submission data & fields
 */
function extractAttendeeDataFromSubmission(submission) {
  const fields = Array.isArray(submission?.form?.fields) ? submission.form.fields : [];
  const data = submission?.data || {};

  let extractedName = '';
  let extractedPhone = '';
  let extractedEmail = '';
  let extractedInstitution = '';

  for (const field of fields) {
    const val = data[field.id];
    if (!val) continue;

    const labelLower = (field.label || '').toLowerCase();
    const idLower = (field.id || '').toLowerCase();
    const type = field.type || '';

    // Extract Name
    if (!extractedName && (labelLower.includes('nama') || labelLower.includes('name') || idLower.includes('nama'))) {
      extractedName = String(val).trim();
    }

    // Extract Phone
    if (
      !extractedPhone &&
      (type === 'phone' ||
        labelLower.includes('telepon') ||
        labelLower.includes('telp') ||
        labelLower.includes('phone') ||
        labelLower.includes('hp') ||
        labelLower.includes('wa') ||
        labelLower.includes('whatsapp'))
    ) {
      extractedPhone = String(val).trim();
    }

    // Extract Email
    if (!extractedEmail && (type === 'email' || labelLower.includes('email') || labelLower.includes('surel'))) {
      extractedEmail = String(val).trim();
    }

    // Extract Institution / Agency / Address
    if (
      !extractedInstitution &&
      (labelLower.includes('instansi') ||
        labelLower.includes('lembaga') ||
        labelLower.includes('institusi') ||
        labelLower.includes('organisasi') ||
        labelLower.includes('perusahaan') ||
        labelLower.includes('sekolah') ||
        labelLower.includes('universitas') ||
        labelLower.includes('kampus') ||
        labelLower.includes('domisili') ||
        labelLower.includes('asal'))
    ) {
      extractedInstitution = String(val).trim();
    }
  }

  // Fallback for name if not found by label: take first string field
  if (!extractedName) {
    for (const field of fields) {
      const val = data[field.id];
      if (val && typeof val === 'string' && val.trim().length > 1 && field.type !== 'image' && field.type !== 'file') {
        extractedName = val.trim();
        break;
      }
    }
  }

  return {
    extractedName: extractedName || `Peserta (${submission.id})`,
    extractedPhone,
    extractedEmail,
    extractedInstitution,
  };
}

export const registrationService = {
  /**
   * List events with pagination and attendance counts
   */
  async listEvents({ search = '', page = 1, limit = 10, isActive = null, sortBy = 'createdAt', order = 'desc' } = {}) {
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
        { location: { contains: search.trim(), mode: 'insensitive' } },
        { linkedForm: { title: { contains: search.trim(), mode: 'insensitive' } } },
        { linkedForm: { formCode: { contains: search.trim(), mode: 'insensitive' } } },
        { linkedForm: { slug: { contains: search.trim(), mode: 'insensitive' } } },
      ];
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true' || isActive === true;
    }

    const sortDir = order?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    let orderBy = { createdAt: sortDir };

    if (sortBy === 'title') {
      orderBy = { title: sortDir };
    } else if (sortBy === 'eventDate') {
      orderBy = { eventDate: sortDir };
    } else if (sortBy === 'createdAt') {
      orderBy = { createdAt: sortDir };
    } else if (sortBy === 'isActive') {
      orderBy = { isActive: sortDir };
    } else if (sortBy === 'attendances') {
      orderBy = { attendances: { _count: sortDir } };
    } else if (sortBy === 'linkedForm') {
      orderBy = { linkedForm: { title: sortDir } };
    }

    const [total, events, totalActive, totalAttendances, attendancesToday] = await Promise.all([
      prisma.registrationEvent.count({ where }),
      prisma.registrationEvent.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          linkedForm: {
            select: {
              id: true,
              title: true,
              slug: true,
              formCode: true,
            },
          },
          _count: {
            select: { attendances: true },
          },
        },
      }),
      prisma.registrationEvent.count({ where: { isActive: true } }),
      prisma.eventAttendance.count(),
      prisma.eventAttendance.count({
        where: {
          checkInTime: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return {
      events,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      stats: {
        totalEvents: total,
        activeEvents: totalActive,
        totalAttendances,
        attendancesToday,
      },
    };
  },

  /**
   * Get single event detail with linked form and stats
   */
  async getEventById(id) {
    const event = await prisma.registrationEvent.findUnique({
      where: { id },
      include: {
        linkedForm: {
          select: {
            id: true,
            title: true,
            slug: true,
            formCode: true,
            fields: true,
            _count: {
              select: { submissions: true },
            },
          },
        },
        _count: {
          select: { attendances: true },
        },
      },
    });

    if (!event) {
      throw ApiError.notFound('Acara / Event registrasi tidak ditemukan');
    }

    return event;
  },

  /**
   * Create new registration event
   */
  async createEvent({ title, description, eventDate, location, linkedFormId, isActive = true }) {
    if (!title || !title.trim()) {
      throw ApiError.badRequest('Nama atau judul acara wajib diisi');
    }

    let parsedDate = null;
    if (eventDate) {
      const d = new Date(eventDate);
      if (!isNaN(d.getTime())) {
        parsedDate = d;
      }
    }

    const newEvent = await prisma.registrationEvent.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        eventDate: parsedDate,
        location: location?.trim() || null,
        linkedFormId: linkedFormId?.trim() || null,
        isActive: Boolean(isActive),
      },
      include: {
        linkedForm: {
          select: {
            id: true,
            title: true,
            slug: true,
            formCode: true,
          },
        },
        _count: {
          select: { attendances: true },
        },
      },
    });

    return newEvent;
  },

  /**
   * Update existing event
   */
  async updateEvent(id, { title, description, eventDate, location, linkedFormId, isActive }) {
    const existing = await prisma.registrationEvent.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Acara / Event registrasi tidak ditemukan');
    }

    const updateData = {};
    if (title !== undefined) {
      if (!title.trim()) throw ApiError.badRequest('Nama acara tidak boleh kosong');
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (eventDate !== undefined) {
      if (eventDate) {
        const d = new Date(eventDate);
        updateData.eventDate = !isNaN(d.getTime()) ? d : null;
      } else {
        updateData.eventDate = null;
      }
    }

    if (location !== undefined) {
      updateData.location = location?.trim() || null;
    }

    if (linkedFormId !== undefined) {
      updateData.linkedFormId = linkedFormId?.trim() || null;
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    const updated = await prisma.registrationEvent.update({
      where: { id },
      data: updateData,
      include: {
        linkedForm: {
          select: {
            id: true,
            title: true,
            slug: true,
            formCode: true,
          },
        },
        _count: {
          select: { attendances: true },
        },
      },
    });

    return updated;
  },

  /**
   * Delete an event and all its attendance records
   */
  async deleteEvent(id) {
    const existing = await prisma.registrationEvent.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Acara / Event registrasi tidak ditemukan');
    }

    await prisma.registrationEvent.delete({ where: { id } });
    return { success: true, message: 'Acara registrasi berhasil dihapus' };
  },

  /**
   * List attendances for an event
   */
  async listAttendances(eventId, { search = '', method = '', page = 1, limit = 20, sortBy = 'checkInTime', order = 'desc' } = {}) {
    const event = await prisma.registrationEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw ApiError.notFound('Acara tidak ditemukan');
    }

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const where = { eventId };
    if (method && method.trim()) {
      where.checkInMethod = method.trim();
    }
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      const matched = await prisma.$queryRawUnsafe(
        `SELECT id FROM "EventAttendance" WHERE "eventId" = $1 AND (
          "registrationId" ILIKE $2 OR
          "name" ILIKE $2 OR
          "phone" ILIKE $2 OR
          "email" ILIKE $2 OR
          "institution" ILIKE $2 OR
          "notes" ILIKE $2 OR
          CAST("formData" AS text) ILIKE $2
        )`,
        eventId,
        term
      );
      const matchedIds = matched.map((r) => r.id);
      where.OR = [
        { id: { in: matchedIds } },
        { submission: { form: { title: { contains: search.trim(), mode: 'insensitive' } } } },
      ];
    }

    const sortDir = order?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    let orderBy = { checkInTime: sortDir };

    if (sortBy === 'checkInTime') {
      orderBy = { checkInTime: sortDir };
    } else if (sortBy === 'registrationId') {
      orderBy = { registrationId: sortDir };
    } else if (sortBy === 'name') {
      orderBy = { name: sortDir };
    } else if (sortBy === 'phone') {
      orderBy = { phone: sortDir };
    } else if (sortBy === 'institution') {
      orderBy = { institution: sortDir };
    } else if (sortBy === 'checkInMethod') {
      orderBy = { checkInMethod: sortDir };
    } else if (sortBy === 'notes') {
      orderBy = { notes: sortDir };
    }

    const [total, attendances, qrScanCount, manualCount] = await Promise.all([
      prisma.eventAttendance.count({ where }),
      prisma.eventAttendance.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          submission: {
            select: {
              id: true,
              form: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                },
              },
            },
          },
        },
      }),
      prisma.eventAttendance.count({ where: { eventId, checkInMethod: 'QR_SCAN' } }),
      prisma.eventAttendance.count({ where: { eventId, checkInMethod: 'MANUAL' } }),
    ]);

    return {
      event,
      attendances,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      stats: {
        total,
        qrScanCount,
        manualCount,
      },
    };
  },

  /**
   * Check in an attendee (QR Scan or Manual Input)
   * Automatically synchronizes participant data from custom form submission!
   */
  async checkInAttendee(eventId, { code, name, phone, email, institution, notes, method = 'QR_SCAN' } = {}) {
    const event = await prisma.registrationEvent.findUnique({
      where: { id: eventId },
      include: {
        linkedForm: true,
      },
    });

    if (!event) {
      throw ApiError.notFound('Acara tidak ditemukan');
    }

    const checkInMethod = method === 'MANUAL' ? 'MANUAL' : 'QR_SCAN';
    const trimmedCode = code ? String(code).trim() : '';

    // CASE 1: Check-in with ID Pendaftaran (from QR scan or manual ID typing)
    if (trimmedCode) {
      // 1. Check if already checked in to this event
      const existingAttendance = await prisma.eventAttendance.findUnique({
        where: {
          eventId_registrationId: {
            eventId,
            registrationId: trimmedCode,
          },
        },
      });

      if (existingAttendance) {
        throw ApiError.conflict(
          `Peserta "${existingAttendance.name}" (ID: ${trimmedCode}) SUDAH tercatat hadir sebelumnya pada pukul ${formatTimeOnly(
            existingAttendance.checkInTime
          )} WIB.`
        );
      }

      // 2. Look up in CustomFormSubmission database
      const submission = await prisma.customFormSubmission.findUnique({
        where: { id: trimmedCode },
        include: {
          form: true,
        },
      });

      if (submission) {
        // Automatically sync participant data from the form submission!
        const extracted = extractAttendeeDataFromSubmission(submission);

        const finalName = (name && name.trim()) || extracted.extractedName;
        const finalPhone = (phone && phone.trim()) || extracted.extractedPhone || null;
        const finalEmail = (email && email.trim()) || extracted.extractedEmail || null;
        const finalInstitution = (institution && institution.trim()) || extracted.extractedInstitution || null;
        const finalNotes = notes?.trim() || `Tersinkronisasi otomatis dari formulir: ${submission.form.title}`;

        const attendance = await prisma.eventAttendance.create({
          data: {
            eventId,
            registrationId: submission.id,
            name: finalName,
            phone: finalPhone,
            email: finalEmail,
            institution: finalInstitution,
            submissionId: submission.id,
            checkInMethod,
            notes: finalNotes,
            formData: submission.data,
          },
          include: {
            submission: {
              select: {
                id: true,
                form: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        });

        return {
          success: true,
          message: `Presensi berhasil! Data peserta "${attendance.name}" berhasil disinkronkan dari formulir "${submission.form.title}".`,
          isSynced: true,
          sourceForm: submission.form.title,
          attendance,
        };
      }

      // If submission not found in database:
      // If name was explicitly provided (manual input with specific ID), allow registering
      if (name && name.trim()) {
        const attendance = await prisma.eventAttendance.create({
          data: {
            eventId,
            registrationId: trimmedCode,
            name: name.trim(),
            phone: phone?.trim() || null,
            email: email?.trim() || null,
            institution: institution?.trim() || null,
            checkInMethod,
            notes: notes?.trim() || 'Input manual (ID kustom)',
          },
        });

        return {
          success: true,
          message: `Presensi peserta "${attendance.name}" berhasil dicatat.`,
          isSynced: false,
          attendance,
        };
      }

      // If pure QR scan and ID not recognized
      throw ApiError.notFound(
        `ID Pendaftaran "${trimmedCode}" tidak ditemukan di database respon formulir. Silakan periksa kembali QR Code atau gunakan formulir Input Kehadiran Manual.`
      );
    }

    // CASE 2: Pure Manual Input without pre-existing ID
    if (!name || !name.trim()) {
      throw ApiError.badRequest('Nama peserta wajib diisi');
    }

    // Generate unique registration ID for manual attendee
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const manualRegId = `MNL-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;

    const attendance = await prisma.eventAttendance.create({
      data: {
        eventId,
        registrationId: manualRegId,
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        institution: institution?.trim() || null,
        checkInMethod: 'MANUAL',
        notes: notes?.trim() || 'Input kehadiran manual',
      },
    });

    return {
      success: true,
      message: `Presensi peserta "${attendance.name}" berhasil dicatat secara manual.`,
      isSynced: false,
      attendance,
    };
  },

  /**
   * Delete attendance record
   */
  async deleteAttendance(eventId, attendanceId) {
    const existing = await prisma.eventAttendance.findFirst({
      where: { id: attendanceId, eventId },
    });

    if (!existing) {
      throw ApiError.notFound('Data presensi tidak ditemukan');
    }

    await prisma.eventAttendance.delete({
      where: { id: attendanceId },
    });

    return {
      success: true,
      message: `Data presensi "${existing.name}" berhasil dihapus`,
    };
  },

  /**
   * Export event attendance data to Excel (.xlsx) using ExcelJS
   */
  async exportAttendanceToExcel(eventId) {
    const event = await prisma.registrationEvent.findUnique({
      where: { id: eventId },
      include: {
        linkedForm: {
          select: {
            title: true,
          },
        },
        attendances: {
          orderBy: { checkInTime: 'asc' },
          include: {
            submission: {
              select: {
                form: {
                  select: {
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw ApiError.notFound('Acara registrasi tidak ditemukan');
    }

    const attendances = event.attendances || [];

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Yayasan Cinta Kasih Fatimah';
    workbook.lastModifiedBy = 'Admin CKF';
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheet = workbook.addWorksheet('Daftar Kehadiran', {
      views: [{ showGridLines: true }],
      properties: { tabColor: { argb: '0F172A' } },
    });

    // 1. Header Information Banner
    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `DAFTAR KEHADIRAN ACARA: ${event.title.toUpperCase()}`;
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0F172A' },
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    sheet.getRow(1).height = 36;

    sheet.mergeCells('A2:H2');
    const metaCell = sheet.getCell('A2');
    const eventDateText = event.eventDate ? formatDate(event.eventDate) : '-';
    const locText = event.location || 'Lokasi tidak dispesifikasikan';
    metaCell.value = `Tanggal Acara: ${eventDateText} | Lokasi: ${locText} | Total Hadir: ${attendances.length} Peserta | Diekspor: ${formatDate(new Date())}`;
    metaCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: '475569' } };
    metaCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F1F5F9' },
    };
    metaCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    sheet.getRow(2).height = 24;

    sheet.addRow([]); // Blank row 3

    // 2. Define Table Columns
    const columns = [
      { header: 'No', key: 'no', width: 8 },
      { header: 'Waktu Hadir (WIB)', key: 'checkInTime', width: 22 },
      { header: 'ID Pendaftaran / Tiket', key: 'registrationId', width: 24 },
      { header: 'Nama Peserta', key: 'name', width: 30 },
      { header: 'No. WhatsApp / HP', key: 'phone', width: 20 },
      { header: 'Asal Instansi / Domisili', key: 'institution', width: 26 },
      { header: 'Metode Presensi', key: 'method', width: 16 },
      { header: 'Sumber Formulir / Catatan', key: 'sourceOrNotes', width: 34 },
    ];

    sheet.getRow(4).values = columns.map((c) => c.header);
    sheet.getRow(4).height = 28;

    const headerRow = sheet.getRow(4);
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1E293B' },
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
    attendances.forEach((att, index) => {
      const rowNumber = index + 1;
      const sourceForm = att.submission?.form?.title || (att.submissionId ? 'Formulir Kustom' : 'Input Manual');
      const notes = att.notes ? ` (${att.notes})` : '';

      const rowValues = [
        rowNumber,
        formatDate(att.checkInTime),
        att.registrationId,
        att.name,
        att.phone || '-',
        att.institution || '-',
        att.checkInMethod === 'QR_SCAN' ? 'Scan QR Code' : 'Input Manual',
        `${sourceForm}${notes}`,
      ];

      const dataRow = sheet.addRow(rowValues);
      dataRow.height = 24;

      const isEven = index % 2 === 0;
      dataRow.eachCell((cell, colNumber) => {
        cell.font = { name: 'Calibri', size: 10 };
        cell.alignment = {
          vertical: 'middle',
          horizontal: colNumber === 1 || colNumber === 2 || colNumber === 7 ? 'center' : 'left',
          wrapText: true,
        };

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
      filename: `Kehadiran_${slugify(event.title)}_${new Date().toISOString().slice(0, 10)}.xlsx`,
      eventTitle: event.title,
    };
  },
};

export default registrationService;
