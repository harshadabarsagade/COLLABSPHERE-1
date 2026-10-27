const BASE = '/api';

export const getToken = () => localStorage.getItem('cs_token');

async function request(path, { method = 'GET', body, isForm = false, raw = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  if (raw) {
    if (!res.ok) throw new Error('Failed to load file');
    return res.blob();
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) {
      localStorage.removeItem('cs_token');
      localStorage.removeItem('cs_user');
    }
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
}

export const api = {
  // auth
  register: (b) => request('/auth/register', { method: 'POST', body: b }),
  login: (b) => request('/auth/login', { method: 'POST', body: b }),

  // projects
  getProjects: () => request('/projects'),
  createProject: (b) => request('/projects', { method: 'POST', body: b }),
  getProject: (id) => request(`/projects/${id}`),
  updateProject: (id, b) => request(`/projects/${id}`, { method: 'PUT', body: b }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
  addMember: (id, email) => request(`/projects/${id}/members`, { method: 'POST', body: { email } }),
  removeMember: (id, userId) => request(`/projects/${id}/members/${userId}`, { method: 'DELETE' }),
  getAnalytics: (id) => request(`/projects/${id}/analytics`),
  toggleShare: (id) => request(`/projects/${id}/share`, { method: 'POST' }),
  getPublicProject: (publicId) => request(`/projects/public/${publicId}`),

  // notes
  getNotes: (id) => request(`/projects/${id}/notes`),
  createNote: (id, b) => request(`/projects/${id}/notes`, { method: 'POST', body: b }),
  updateNote: (id, noteId, b) => request(`/projects/${id}/notes/${noteId}`, { method: 'PUT', body: b }),
  deleteNote: (id, noteId) => request(`/projects/${id}/notes/${noteId}`, { method: 'DELETE' }),

  // files
  getFiles: (id) => request(`/projects/${id}/files`),
  uploadFile: (id, formData) => request(`/projects/${id}/files`, { method: 'POST', body: formData, isForm: true }),
  deleteFile: (id, fileId) => request(`/projects/${id}/files/${fileId}`, { method: 'DELETE' }),
  getFileText: (id, fileId) => request(`/projects/${id}/files/${fileId}/text`),
  getFileBlob: (id, fileId) => request(`/projects/${id}/files/${fileId}/raw`, { raw: true }),

  // gemini
  explain: (text, mode) => request('/gemini/explain', { method: 'POST', body: { text, mode } }),
  docs: (text) => request('/gemini/docs', { method: 'POST', body: { text } }),
  readme: (text) => request('/gemini/readme', { method: 'POST', body: { text } }),
};
