import client from './client';

/** POST /api/media/upload (multipart) → { data: Media } (Aset umum: banner, logo, konten artikel) */
export const uploadMedia = (file, onProgress) => {
  const form = new FormData();
  form.append('file', file);
  return client
    .post('/media/upload', form, onProgress ? { onUploadProgress: onProgress } : undefined)
    .then((r) => r.data);
};

/** POST /api/media/upload (multipart) → { data: Media } (Khusus Foto Galeri) */
export const uploadGalleryMedia = (file, onProgress) => {
  const form = new FormData();
  form.append('file', file);
  form.append('isGallery', 'true');
  return client
    .post('/media/upload', form, onProgress ? { onUploadProgress: onProgress } : undefined)
    .then((r) => r.data);
};

/** GET /api/media/public → { data: Media[], meta } (Halaman Galeri Publik) */
export const getPublicGallery = (params) =>
  client.get('/media/public', { params }).then((r) => r.data);

/** GET /api/media → { data: Media[], meta } (Panel Admin Galeri Media) */
export const getMedia = (params) => client.get('/media', { params }).then((r) => r.data);

/** DELETE /api/media/:id → { message, fileRemoved } */
export const deleteMedia = (id) => client.delete(`/media/${id}`).then((r) => r.data);
