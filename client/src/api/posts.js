import client from './client';

/** GET /api/posts → { data: Post[], meta } (Hanya mengembalikan artikel PUBLISHED untuk publik) */
export const getPosts = (params) => client.get('/posts', { params }).then((r) => r.data);

/** GET /api/posts?admin=true → { data: Post[], meta } (Khusus panel admin untuk melihat DRAFT & PUBLISHED) */
export const getAdminPosts = (params) =>
  client.get('/posts', { params: { ...params, admin: 'true' } }).then((r) => r.data);

/** GET /api/posts/featured → { data: Post[] } */
export const getFeaturedPosts = () => client.get('/posts/featured').then((r) => r.data);

/** GET /api/posts/:slug → { post, related } */
export const getPostBySlug = (slug) => client.get(`/posts/${slug}`).then((r) => r.data);

/** GET /api/posts/by-id/:id (admin) → { data: Post } */
export const getPostById = (id) => client.get(`/posts/by-id/${id}`).then((r) => r.data);

/** POST /api/posts (multipart FormData) → { data: Post } */
export const createPost = (form, onProgress) => {
  return client
    .post('/posts', form, onProgress ? { onUploadProgress: onProgress } : undefined)
    .then((r) => r.data);
};

/** PUT /api/posts/:id (multipart FormData) → { data: Post } */
export const updatePost = (id, form, onProgress) => {
  return client
    .put(`/posts/${id}`, form, onProgress ? { onUploadProgress: onProgress } : undefined)
    .then((r) => r.data);
};

/** DELETE /api/posts/:id → { message } */
export const deletePost = (id) => client.delete(`/posts/${id}`).then((r) => r.data);
