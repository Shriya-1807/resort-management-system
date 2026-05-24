import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 15000,
})

// Attach JWT on every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('gulmohar_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Unwrap error messages
api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Something went wrong'
    return Promise.reject(new Error(msg))
  }
)

export default api
