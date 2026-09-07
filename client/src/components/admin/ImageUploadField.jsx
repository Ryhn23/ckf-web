import { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { uploadMedia } from '../../api/media';
import { errMsg } from '../../api/client';

export default function ImageUploadField({
  label,
  description,
  value,
  onChange,
  id,
  placeholder = 'https://... atau /uploads/...',
  aspectRatio = 'aspect-video',
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');
    try {
      const res = await uploadMedia(file);
      if (res?.data?.url) {
        onChange(res.data.url);
      }
    } catch (err) {
      setUploadError(errMsg(err, 'Gagal mengunggah berkas gambar.'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleRemove() {
    onChange('');
    setUploadError('');
  }

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="label !mb-0 text-sm font-semibold text-slate-800">
          {label}
        </label>
      )}
      {description && <p className="text-xs text-slate-400">{description}</p>}

      {value ? (
        <div className="space-y-2.5">
          <div className={`relative ${aspectRatio} w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-inner`}>
            <img
              src={value}
              alt="Pratinjau Berkas"
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-outline !px-3 !py-1.5 text-xs"
            >
              <FontAwesomeIcon icon={['fa-solid', 'fa-arrow-up-from-bracket']} />
              {uploading ? 'Mengunggah…' : 'Ganti Berkas'}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="btn-danger !px-3 !py-1.5 text-xs"
            >
              <FontAwesomeIcon icon={['fa-solid', 'fa-trash']} />
              Hapus Gambar
            </button>
            <span className="text-xs text-slate-400 truncate max-w-xs">{value}</span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              id={id}
              type="text"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="input flex-1 text-sm"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-outline shrink-0 text-xs font-semibold"
            >
              <FontAwesomeIcon icon={['fa-solid', 'fa-arrow-up-from-bracket']} />
              {uploading ? 'Mengunggah…' : 'Pilih Berkas'}
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {uploadError && (
        <p className="text-xs font-medium text-red-600">
          <FontAwesomeIcon icon={['fa-solid', 'fa-circle-exclamation']} className="mr-1" />
          {uploadError}
        </p>
      )}
    </div>
  );
}
