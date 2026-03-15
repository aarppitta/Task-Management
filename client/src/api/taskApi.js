import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

export async function getTodayTasks() {
  try {
    const response = await api.get('/tasks/today')
    return response.data.data
  } catch (error) {
    throw error.response?.data?.message || error.message
  }
}

export async function createTask(title, description, status) {
  try {
    const response = await api.post('/tasks', { title, description, status })
    return response.data.data
  } catch (error) {
    throw error.response?.data?.message || error.message
  }
}

export async function updateTask(id, fields) {
  try {
    const response = await api.put(`/tasks/${id}`, fields)
    return response.data.data
  } catch (error) {
    throw error.response?.data?.message || error.message
  }
}

export async function deleteTask(id) {
  try {
    const response = await api.delete(`/tasks/${id}`)
    return response.data
  } catch (error) {
    throw error.response?.data?.message || error.message
  }
}

export async function getHistory(date) {
  try {
    const response = await api.get(`/tasks/history?date=${date}`)
    return response.data.data
  } catch (error) {
    throw error.response?.data?.message || error.message
  }
}

export async function getDailySummary(date) {
  try {
    const response = await api.get(`/tasks/summary?date=${date}`)
    return response.data.data
  } catch (error) {
    throw error.response?.data?.message || error.message
  }
}

export async function triggerEODJob() {
  try {
    const response = await api.post('/tasks/dev/run-eod')
    return response.data
  } catch (error) {
    throw error.response?.data?.message || error.message
  }
}
