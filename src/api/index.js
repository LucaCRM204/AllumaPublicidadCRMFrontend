// src/api/index.js
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
})

// Inyectar token en cada request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('alma_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Si el token expiró, redirigir al login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('alma_token')
      localStorage.removeItem('alma_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
