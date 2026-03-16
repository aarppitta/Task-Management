import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({ baseURL: BASE });

export const getTasks = (date) =>
  api.get(`/tasks${date ? `?date=${date}` : ''}`).then((r) => r.data.data);

export const createTask = (data) =>
  api.post('/tasks', data).then((r) => r.data.data);

export const updateTask = (id, data) =>
  api.put(`/tasks/${id}`, data).then((r) => r.data.data);

export const deleteTask = (id) => api.delete(`/tasks/${id}`);

export const getArchivedTasks = (date) =>
  api.get(`/tasks/archived?date=${date}`).then((r) => r.data.data);

export const getSummary = (date) =>
  api.get(`/summaries/${date}`).then((r) => r.data.data);

export const triggerEOD = (date) =>
  api.post('/eod/trigger', date ? { date } : {}).then((r) => r.data);
