import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 30000,
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.detail?.message || err.response?.data?.detail || err.message
    return Promise.reject(new Error(typeof msg === 'string' ? msg : '请求失败'))
  }
)

export default api
