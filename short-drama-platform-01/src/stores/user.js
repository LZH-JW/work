import { defineStore } from 'pinia'
import axios from 'axios'
import { mockAPI, MOCK_MODE } from '@/api/mock'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))
  
  const isAuthenticated = computed(() => !!token.value)
  
  const login = async (credentials) => {
    try {
      let response
      
      if (MOCK_MODE) {
        response = await mockAPI.login(credentials)
      } else {
        const apiResponse = await axios.post('/api/auth/login', credentials)
        response = apiResponse.data
      }
      
      if (response.success) {
        // 兼容真实后端与 mock 两种结构：
        // 后端: { success, message, token, user }
        // mock: { success, message, data: { token, user } }
        const authToken = response?.data?.token ?? response?.token
        const userData = response?.data?.user ?? response?.user
        
        token.value = authToken
        user.value = userData
        localStorage.setItem('token', authToken)
        localStorage.setItem('user', JSON.stringify(userData))
        
        // Set default authorization header
        if (!MOCK_MODE) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`
        }
        
        return { success: true }
      } else {
        return { success: false, message: response.message }
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '登录失败' }
    }
  }
  
  const register = async (userData) => {
    try {
      let response
      
      if (MOCK_MODE) {
        response = await mockAPI.register(userData)
      } else {
        const apiResponse = await axios.post('/api/auth/register', userData)
        response = apiResponse.data
      }
      
      if (response.success) {
        return { success: true, message: response.message }
      } else {
        return { success: false, message: response.message }
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '注册失败' }
    }
  }
  
  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    try { localStorage.removeItem('user') } catch {}
    delete axios.defaults.headers.common['Authorization']
  }
  
  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('/api/user/profile')
      user.value = response.data
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }
  
  // Initialize axios interceptor
  if (token.value) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    try {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        user.value = JSON.parse(storedUser)
      }
    } catch {}
  }
  
  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout,
    fetchUserProfile
  }
})
