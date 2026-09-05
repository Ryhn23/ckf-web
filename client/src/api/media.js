import client from './client';

/** POST /api/media/upload (multipart) → { data: Media } */
export const uploadMedia = (file, onProgress) => {
  const form = new FormData();
  form.append('file', file);
  return client
    .post('/media/upload', form, onProgress ? { onUploadProgress: onProgress } : undefined)
    .then((r) => r.data);
};

/** GET /api/media → { data: Media[], meta } */
export const getMedia = (params) => client.get('/media', { params }).then((r) => r.data);

/** DELETE /api/media/:id → { message, fileRemoved } */
export const deleteMedia = (id) => client.delete(`/media/${id}`).then((r) => r.data);
