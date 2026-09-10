import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';
import { getPublicCustomForm, submitPublicCustomForm } from '../api/customForms';
import { errMsg } from '../api/client';
import { useSettings } from '../context/SettingsContext';
import Spinner from '../components/ui/Spinner';

export default function CustomFormView() {
  const { slug } = useParams();
  const { settings } = useSettings();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form values state: { [fieldId]: string | string[] }
  const [values, setValues] = useState({});
  // File uploads state: { [fieldId]: { file, previewUrl, name, size } }
  const [fileMap, setFileMap] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  useEffect(() => {
    async function loadForm() {
      setLoading(true);
      setError(null);
      try {
        const res = await getPublicCustomForm(slug);
        setForm(res.data);

        // Initialize default empty values
        const initialValues = {};
        if (Array.isArray(res.data?.fields)) {
          res.data.fields.forEach((f) => {
            if (f.type === 'checkbox') {
              initialValues[f.id] = [];
            } else {
              initialValues[f.id] = '';
            }
          });
        }
        setValues(initialValues);
      } catch (err) {
        setError(errMsg(err, 'Formulir tidak ditemukan atau belum dipublikasikan'));
      } finally {
        setLoading(false);
      }
    }
    loadForm();
  }, [slug]);

  // Handle Text/Select/Radio input change
  function handleInputChange(fieldId, val) {
    setValues((prev) => ({ ...prev, [fieldId]: val }));
    if (fieldErrors[fieldId]) {
      setFieldErrors((prev) => ({ ...prev, [fieldId]: null }));
    }
  }

  // Handle Checkbox toggle
  function handleCheckboxToggle(fieldId, option) {
    setValues((prev) => {
      const current = Array.isArray(prev[fieldId]) ? [...prev[fieldId]] : [];
      const index = current.indexOf(option);
      if (index > -1) {
        current.splice(index, 1);
      } else {
        current.push(option);
      }
      return { ...prev, [fieldId]: current };
    });
    if (fieldErrors[fieldId]) {
      setFieldErrors((prev) => ({ ...prev, [fieldId]: null }));
    }
  }

  // Handle File/Image selection
  function handleFileSelect(fieldId, e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran berkas melebihi batas maksimal 10MB.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setFileMap((prev) => ({
      ...prev,
      [fieldId]: {
        file,
        previewUrl,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2),
      },
    }));

    if (fieldErrors[fieldId]) {
      setFieldErrors((prev) => ({ ...prev, [fieldId]: null }));
    }
  }

  // Remove File/Image selection
  function handleRemoveFile(fieldId) {
    setFileMap((prev) => {
      const next = { ...prev };
      if (next[fieldId]?.previewUrl) {
        URL.revokeObjectURL(next[fieldId].previewUrl);
      }
      delete next[fieldId];
      return next;
    });
  }

  // Submit form
  async function handleSubmit(e) {
    e.preventDefault();
    if (!form || !form.isActive) return;

    const fields = Array.isArray(form.fields) ? form.fields : [];
    const errors = {};

    // Validate required fields
    fields.forEach((field) => {
      if (field.required) {
        if (field.type === 'image' || field.type === 'file') {
          if (!fileMap[field.id]) {
            errors[field.id] = `Berkas "${field.label}" wajib diunggah`;
          }
        } else if (field.type === 'checkbox') {
          if (!values[field.id] || values[field.id].length === 0) {
            errors[field.id] = `Pilih minimal satu opsi untuk "${field.label}"`;
          }
        } else {
          const val = values[field.id];
          if (!val || String(val).trim() === '') {
            errors[field.id] = `Kolom "${field.label}" wajib diisi`;
          }
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Scroll to first error
      const firstKey = Object.keys(errors)[0];
      const el = document.getElementById(`field-wrapper-${firstKey}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();

      // Append text values
      Object.entries(values).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          formData.append(k, JSON.stringify(v));
        } else if (v !== undefined && v !== null) {
          formData.append(k, v);
        }
      });

      // Append files
      Object.entries(fileMap).forEach(([k, fileObj]) => {
        if (fileObj?.file) {
          formData.append(k, fileObj.file);
        }
      });

      const res = await submitPublicCustomForm(slug, formData);
      setSubmissionResult(res);
      setSubmitSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      alert(errMsg(err, 'Gagal mengirimkan formulir. Silakan periksa kembali data Anda.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Spinner label="Memuat formulir…" />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center space-y-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto text-xl">
            <FontAwesomeIcon icon={['fa-solid', 'fa-triangle-exclamation']} />
          </div>
          <h1 className="font-heading text-xl font-bold text-slate-900">Formulir Tidak Ditemukan</h1>
          <p className="text-xs text-slate-500">{error || 'Tautan formulir yang Anda tuju tidak valid.'}</p>
          <Link to="/" className="inline-block admin-btn-primary text-xs px-5 py-2.5">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const fields = Array.isArray(form.fields) ? form.fields : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100/90 via-slate-50 to-white text-slate-800 py-8 px-4 sm:px-6">
      <Helmet>
        <title>{form.title} — {settings.site_name || 'Yayasan Cinta Kasih Fatimah'}</title>
        <meta name="description" content={form.description || `Formulir resmi ${form.title}`} />
      </Helmet>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-3">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={settings.site_logo || '/logo-ckf.png'}
              alt="Logo"
              className="h-11 w-auto object-contain transition-transform group-hover:scale-105"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="flex flex-col justify-center leading-none select-none text-slate-900 text-left">
              <span className="font-heading text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
                CINTA KASIH
              </span>
              <span className="font-heading text-[15px] font-black uppercase tracking-wide mt-0.5 text-black">
                FATIMAH
              </span>
              <span className="font-sans text-[8px] font-bold uppercase tracking-[0.2em] mt-0.5 text-slate-600">
                FOUNDATION
              </span>
            </div>
          </Link>
        </div>

        {/* Inactive Banner */}
        {!form.isActive && !submitSuccess && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-start gap-3.5 shadow-2xs text-slate-800">
            <FontAwesomeIcon icon={['fa-solid', 'fa-circle-info']} className="text-slate-500 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Penerimaan Formulir Ditutup</h3>
              <p className="text-xs mt-0.5 text-slate-600">
                Mohon maaf, pengisian untuk formulir ini saat ini telah ditutup oleh administrator.
              </p>
            </div>
          </div>
        )}

        {/* SUCCESS CONFIRMATION SCREEN */}
        {submitSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 text-center space-y-6"
          >
            <div className="w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center mx-auto text-2xl shadow-sm">
              <FontAwesomeIcon icon={['fa-solid', 'fa-check']} />
            </div>

            <div className="space-y-2">
              <h2 className="font-heading text-2xl font-bold text-slate-900">
                Pengiriman Berhasil!
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                {form.successMessage || 'Terima kasih, data formulir Anda telah berhasil kami terima.'}
              </p>
            </div>

            {submissionResult?.submissionId && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl max-w-xs mx-auto text-xs text-slate-500 font-mono">
                Kode Referensi: <span className="font-bold text-slate-800">{submissionResult.submissionId}</span>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSubmitSuccess(false);
                  setValues({});
                  setFileMap({});
                  setFieldErrors({});
                }}
                className="admin-btn-secondary text-xs px-4 py-2"
              >
                Kirim Tanggapan Lain
              </button>
              <Link to="/" className="admin-btn-primary text-xs px-5 py-2">
                Kembali ke Beranda
              </Link>
            </div>
          </motion.div>
        ) : (
          /* MAIN FORM CARD */
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80 overflow-hidden">
            {/* Banner Cover if provided */}
            {form.coverImage && (
              <div className="w-full h-44 sm:h-56 overflow-hidden bg-slate-900">
                <img
                  src={form.coverImage}
                  alt={form.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Title & Description Header */}
            <div className="p-6 sm:p-8 border-b border-slate-100 bg-white space-y-2.5">
              <h1 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                {form.title}
              </h1>
              {form.description && (
                <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                  {form.description}
                </p>
              )}
              <div className="pt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="text-rose-500 font-bold">*</span>
                <span>Menunjukkan pertanyaan yang wajib diisi</span>
              </div>
            </div>

            {/* Dynamic Fields Form */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 bg-white">
              {fields.map((field, idx) => {
                const isError = Boolean(fieldErrors[field.id]);
                const isFile = field.type === 'image' || field.type === 'file';
                const fileSelected = fileMap[field.id];

                return (
                  <div
                    key={field.id}
                    id={`field-wrapper-${field.id}`}
                    className={`space-y-2 transition-all p-3 -mx-3 rounded-2xl ${
                      isError ? 'bg-rose-50/50 border border-rose-200' : ''
                    }`}
                  >
                    {/* Field Label */}
                    <label className="block text-xs sm:text-sm font-semibold text-slate-900">
                      <span>{field.label}</span>
                      {field.required && <span className="text-rose-500 ml-1 font-bold">*</span>}
                    </label>

                    {/* Field Description / Help Text */}
                    {field.helpText && (
                      <p className="text-[11px] text-slate-400 leading-tight">
                        {field.helpText}
                      </p>
                    )}

                    {/* Field Input Based on Type */}
                    {field.type === 'text' && (
                      <input
                        type="text"
                        value={values[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder || 'Tuliskan jawaban Anda'}
                        disabled={!form.isActive}
                        className={`admin-input w-full text-xs sm:text-sm ${
                          isError ? 'border-rose-400 focus:border-rose-500' : ''
                        }`}
                      />
                    )}

                    {field.type === 'textarea' && (
                      <textarea
                        rows={3}
                        value={values[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder || 'Tuliskan jawaban lengkap Anda di sini…'}
                        disabled={!form.isActive}
                        className={`admin-input w-full text-xs sm:text-sm ${
                          isError ? 'border-rose-400 focus:border-rose-500' : ''
                        }`}
                      />
                    )}

                    {field.type === 'number' && (
                      <input
                        type="number"
                        value={values[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder || 'Contoh: 10'}
                        disabled={!form.isActive}
                        className={`admin-input w-full text-xs sm:text-sm ${
                          isError ? 'border-rose-400 focus:border-rose-500' : ''
                        }`}
                      />
                    )}

                    {field.type === 'email' && (
                      <input
                        type="email"
                        value={values[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder || 'nama@email.com'}
                        disabled={!form.isActive}
                        className={`admin-input w-full text-xs sm:text-sm ${
                          isError ? 'border-rose-400 focus:border-rose-500' : ''
                        }`}
                      />
                    )}

                    {field.type === 'phone' && (
                      <div className="relative">
                        <input
                          type="tel"
                          value={values[field.id] || ''}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          placeholder={field.placeholder || '0812-3456-7890'}
                          disabled={!form.isActive}
                          className={`admin-input w-full pl-9 text-xs sm:text-sm ${
                            isError ? 'border-rose-400 focus:border-rose-500' : ''
                          }`}
                        />
                        <FontAwesomeIcon
                          icon={['fa-solid', 'fa-phone']}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
                        />
                      </div>
                    )}

                    {field.type === 'date' && (
                      <input
                        type="date"
                        value={values[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        disabled={!form.isActive}
                        className={`admin-input w-full text-xs sm:text-sm ${
                          isError ? 'border-rose-400 focus:border-rose-500' : ''
                        }`}
                      />
                    )}

                    {field.type === 'select' && (
                      <select
                        value={values[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        disabled={!form.isActive}
                        className={`admin-select w-full text-xs sm:text-sm ${
                          isError ? 'border-rose-400 focus:border-rose-500' : ''
                        }`}
                      >
                        <option value="">-- Pilih salah satu --</option>
                        {(Array.isArray(field.options) ? field.options : []).map((opt, oIdx) => (
                          <option key={oIdx} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}

                    {field.type === 'radio' && (
                      <div className="space-y-2 pt-1">
                        {(Array.isArray(field.options) ? field.options : []).map((opt, oIdx) => (
                          <label
                            key={oIdx}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                              values[field.id] === opt
                                ? 'bg-slate-50 border-slate-900 ring-1 ring-slate-900'
                                : 'border-slate-200 hover:bg-slate-50/60'
                            }`}
                          >
                            <input
                              type="radio"
                              name={field.id}
                              value={opt}
                              checked={values[field.id] === opt}
                              onChange={() => handleInputChange(field.id, opt)}
                              disabled={!form.isActive}
                              className="text-slate-900 focus:ring-slate-900"
                            />
                            <span className="text-xs sm:text-sm text-slate-700">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {field.type === 'checkbox' && (
                      <div className="space-y-2 pt-1">
                        {(Array.isArray(field.options) ? field.options : []).map((opt, oIdx) => {
                          const isChecked = Array.isArray(values[field.id]) && values[field.id].includes(opt);
                          return (
                            <label
                              key={oIdx}
                              className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                isChecked
                                  ? 'bg-slate-50 border-slate-900 ring-1 ring-slate-900'
                                  : 'border-slate-200 hover:bg-slate-50/60'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleCheckboxToggle(field.id, opt)}
                                disabled={!form.isActive}
                                className="rounded text-slate-900 focus:ring-slate-900"
                              />
                              <span className="text-xs sm:text-sm text-slate-700">{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* Upload Image / Berkas */}
                    {isFile && (
                      <div>
                        {fileSelected ? (
                          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            {fileSelected.previewUrl && (
                              <img
                                src={fileSelected.previewUrl}
                                alt="Preview"
                                className="w-14 h-14 object-cover rounded-lg border border-slate-300"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-900 truncate">
                                {fileSelected.name}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {fileSelected.size} MB • Terkompresi otomatis WebP
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(field.id)}
                              className="text-rose-500 hover:text-rose-700 text-xs px-2 py-1 rounded hover:bg-rose-50"
                            >
                              Hapus
                            </button>
                          </div>
                        ) : (
                          <label
                            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                              isError
                                ? 'border-rose-300 bg-rose-50/30'
                                : 'border-slate-300 hover:border-slate-500 bg-slate-50/50 hover:bg-slate-100/60'
                            }`}
                          >
                            <FontAwesomeIcon icon={['fa-solid', 'fa-cloud-arrow-up']} className="text-2xl text-slate-400 mb-2" />
                            <span className="text-xs font-semibold text-slate-700">
                              Klik untuk memilih atau unggah berkas foto
                            </span>
                            <span className="text-[11px] text-slate-400 mt-0.5">
                              Mendukung JPG, PNG, WebP (Maksimal 10MB)
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileSelect(field.id, e)}
                              disabled={!form.isActive}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    )}

                    {/* Error Message */}
                    {isError && (
                      <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                        <FontAwesomeIcon icon={['fa-solid', 'fa-circle-exclamation']} className="text-[10px]" />
                        <span>{fieldErrors[field.id]}</span>
                      </p>
                    )}
                  </div>
                );
              })}

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={submitting || !form.isActive}
                  className="w-full py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-black text-white text-sm font-bold shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon
                    icon={['fa-solid', submitting ? 'fa-spinner' : 'fa-paper-plane']}
                    className={submitting ? 'fa-spin' : ''}
                  />
                  <span>{submitting ? 'Mengirimkan Tanggapan…' : 'Kirim Formulir'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer Note */}
        <div className="text-center text-[11px] text-slate-400 pb-8 space-y-1">
          <p>
            Yayasan Cinta Kasih Fatimah — Formulir Resmi Terverifikasi
          </p>
          <p>
            Data Anda dilindungi dan hanya digunakan untuk keperluan program yayasan.
          </p>
        </div>
      </div>
    </div>
  );
}
