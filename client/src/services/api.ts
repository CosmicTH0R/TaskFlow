import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// JWT interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  signup: (data: { email: string; name: string; password: string }) =>
    api.post('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  searchUsers: (search: string) => api.get('/auth/users', { params: { search } }),
};

// Boards
export const boardsAPI = {
  list: (params?: { page?: number; search?: string }) =>
    api.get('/boards', { params }),
  get: (id: string) => api.get(`/boards/${id}`),
  create: (data: { title: string; description?: string; color?: string }) =>
    api.post('/boards', data),
  update: (id: string, data: { title?: string; description?: string; color?: string }) =>
    api.put(`/boards/${id}`, data),
  delete: (id: string) => api.delete(`/boards/${id}`),
  addMember: (id: string, email: string) =>
    api.post(`/boards/${id}/members`, { email }),
  removeMember: (id: string, userId: string) =>
    api.delete(`/boards/${id}/members/${userId}`),
};

// Lists
export const listsAPI = {
  getByBoard: (boardId: string) => api.get(`/boards/${boardId}/lists`),
  create: (data: { title: string; boardId: string }) =>
    api.post('/lists', data),
  update: (id: string, data: { title: string }) =>
    api.put(`/lists/${id}`, data),
  delete: (id: string) => api.delete(`/lists/${id}`),
  reorder: (boardId: string, listIds: string[]) =>
    api.put('/lists/reorder', { boardId, listIds }),
};

// Tasks
export const tasksAPI = {
  list: (params: { boardId?: string; search?: string; page?: number }) =>
    api.get('/tasks', { params }),
  create: (data: { title: string; listId: string; boardId: string; description?: string; priority?: string }) =>
    api.post('/tasks', data),
  update: (id: string, data: { title?: string; description?: string; priority?: string; dueDate?: string | null }) =>
    api.put(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  move: (id: string, data: { listId: string; position: number }) =>
    api.put(`/tasks/${id}/move`, data),
  assign: (id: string, userId: string) =>
    api.post(`/tasks/${id}/assign`, { userId }),
  unassign: (id: string, userId: string) =>
    api.delete(`/tasks/${id}/assign/${userId}`),
};

// Activity
export const activityAPI = {
  getByBoard: (boardId: string, page?: number) =>
    api.get(`/activity/boards/${boardId}/activity`, { params: { page, limit: 20 } }),
};

export default api;
