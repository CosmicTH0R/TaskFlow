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
  addMember: (id: string, email: string, role?: string) =>
    api.post(`/boards/${id}/members`, { email, role }),
  updateMemberRole: (id: string, userId: string, role: string) =>
    api.patch(`/boards/${id}/members/${userId}`, { role }),
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
  getDetails: (id: string) => api.get(`/tasks/${id}/details`),
};

// Subtasks
export const subtasksAPI = {
  create: (taskId: string, title: string) =>
    api.post(`/tasks/${taskId}/subtasks`, { title }),
  update: (taskId: string, subId: string, data: { title?: string; completed?: boolean }) =>
    api.patch(`/tasks/${taskId}/subtasks/${subId}`, data),
  delete: (taskId: string, subId: string) =>
    api.delete(`/tasks/${taskId}/subtasks/${subId}`),
};

// Dependencies
export const dependenciesAPI = {
  add: (taskId: string, dependsOnTaskId: string) =>
    api.post(`/tasks/${taskId}/dependencies`, { dependsOnTaskId }),
  remove: (taskId: string, depId: string) =>
    api.delete(`/tasks/${taskId}/dependencies/${depId}`),
};

// Activity
export const activityAPI = {
  getByBoard: (boardId: string, page?: number) =>
    api.get(`/activity/boards/${boardId}/activity`, { params: { page, limit: 20 } }),
};

// Comments
export const commentsAPI = {
  list: (taskId: string, page?: number) =>
    api.get(`/tasks/${taskId}/comments`, { params: { page } }),
  create: (taskId: string, content: string) =>
    api.post(`/tasks/${taskId}/comments`, { content }),
  delete: (id: string) => api.delete(`/comments/${id}`),
};

// Labels
export const labelsAPI = {
  list: (boardId: string) => api.get(`/boards/${boardId}/labels`),
  create: (boardId: string, data: { name: string; color?: string }) =>
    api.post(`/boards/${boardId}/labels`, data),
  delete: (id: string) => api.delete(`/labels/${id}`),
  addToTask: (taskId: string, labelId: string) =>
    api.post(`/tasks/${taskId}/labels`, { labelId }),
  removeFromTask: (taskId: string, labelId: string) =>
    api.delete(`/tasks/${taskId}/labels/${labelId}`),
};

// Profile
export const profileAPI = {
  update: (data: { name?: string; email?: string }) => api.put('/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/profile/password', data),
};

// Notes
export const notesAPI = {
  list: (params?: { search?: string; page?: number; boardId?: string }) =>
    api.get('/notes', { params }),
  get: (id: string) => api.get(`/notes/${id}`),
  create: (data: { title: string; content?: string; emoji?: string; boardId?: string; parentId?: string }) =>
    api.post('/notes', data),
  update: (id: string, data: { title?: string; content?: string; emoji?: string }) =>
    api.put(`/notes/${id}`, data),
  delete: (id: string) => api.delete(`/notes/${id}`),
};

export default api;
