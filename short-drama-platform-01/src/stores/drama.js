import { defineStore } from 'pinia'
import axios from 'axios'
import { mockAPI, MOCK_MODE } from '@/api/mock'
import { ref } from 'vue'

export const useDramaStore = defineStore('drama', () => {
  const dramas = ref([])
  const currentDrama = ref(null)
  const loading = ref(false)
  
  const fetchDramas = async () => {
    loading.value = true
    try {
      let response
      
      if (MOCK_MODE) {
        response = await mockAPI.getDramas()
        dramas.value = response.data.dramas
      } else {
        const apiResponse = await axios.get('/api/dramas')
        dramas.value = apiResponse.data
      }
    } catch (error) {
      console.error('获取短剧列表失败:', error)
    } finally {
      loading.value = false
    }
  }
  
  const fetchDramaById = async (id) => {
    loading.value = true
    try {
      let response
      
      if (MOCK_MODE) {
        response = await mockAPI.getDramaById(id)
        currentDrama.value = response.data
        return response.data
      } else {
        const apiResponse = await axios.get(`/api/dramas/${id}`)
        currentDrama.value = apiResponse.data
        return apiResponse.data
      }
    } catch (error) {
      console.error('获取短剧详情失败:', error)
      return null
    } finally {
      loading.value = false
    }
  }
  
  const createDrama = async (dramaData) => {
    try {
      let response
      
      if (MOCK_MODE) {
        response = await mockAPI.createDrama(dramaData)
        if (response.success) {
          dramas.value.unshift(response.data)
        }
        return response
      } else {
        const apiResponse = await axios.post('/api/dramas', dramaData)
        dramas.value.unshift(apiResponse.data)
        return { success: true, data: apiResponse.data }
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '创建失败' }
    }
  }
  
  const updateDrama = async (id, dramaData) => {
    try {
      if (MOCK_MODE) {
        const response = await mockAPI.updateDrama(id, dramaData)
        const index = dramas.value.findIndex(d => d.id === id)
        if (index !== -1) {
          dramas.value[index] = { ...dramas.value[index], ...response.data }
        }
        return response
      } else {
        const response = await axios.put(`/api/dramas/${id}`, dramaData)
        const index = dramas.value.findIndex(d => d.id === id)
        if (index !== -1) {
          dramas.value[index] = response.data
        }
        return { success: true, data: response.data }
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '更新失败' }
    }
  }
  
  const deleteDrama = async (id) => {
    try {
      if (MOCK_MODE) {
        const response = await mockAPI.deleteDrama(id)
        dramas.value = dramas.value.filter(d => d.id !== id)
        return response
      } else {
        await axios.delete(`/api/dramas/${id}`)
        dramas.value = dramas.value.filter(d => d.id !== id)
        return { success: true }
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '删除失败' }
    }
  }
  
  // Episode video operations
  const uploadEpisodeVideo = async (dramaId, ep, file) => {
    try {
      if (MOCK_MODE) {
        const resp = await mockAPI.uploadEpisodeVideo(dramaId, ep, file)
        return resp
      } else {
        // 预留后端/对象存储对接：表单上传，返回视频URL
        const form = new FormData()
        form.append('file', file)
        form.append('ep', ep)
        const apiResp = await axios.post(`/api/dramas/${dramaId}/episodes/${ep}/upload`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
        return { success: true, data: apiResp.data }
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '上传失败' }
    }
  }

  const updateEpisodeVideoUrl = async (dramaId, ep, videoUrl) => {
    try {
      if (MOCK_MODE) {
        const resp = await mockAPI.updateEpisodeVideoUrl(dramaId, ep, videoUrl)
        return resp
      } else {
        const apiResp = await axios.put(`/api/dramas/${dramaId}/episodes/${ep}/video-url`, { videoUrl })
        return { success: true, data: apiResp.data }
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '更新失败' }
    }
  }

  // Video generation pipeline
  const createVideoGenTask = async ({ dramaId, ep, style, duration, voice }) => {
    try {
      if (MOCK_MODE) {
        const resp = await mockAPI.createVideoGenTask({ dramaId, ep, style, duration, voice })
        return resp
      } else {
        const resp = await axios.post(`/api/video-gen/tasks`, { dramaId, ep, style, duration, voice })
        return { success: true, data: resp.data }
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '创建任务失败' }
    }
  }

  const getVideoGenTask = async (taskId) => {
    try {
      if (MOCK_MODE) {
        return await mockAPI.getVideoGenTask(taskId)
      } else {
        const resp = await axios.get(`/api/video-gen/tasks/${taskId}`)
        return { success: true, data: resp.data }
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '查询任务失败' }
    }
  }

  const retryVideoGenTask = async (taskId) => {
    try {
      if (MOCK_MODE) {
        return await mockAPI.retryVideoGenTask(taskId)
      } else {
        await axios.post(`/api/video-gen/tasks/${taskId}/retry`)
        return { success: true }
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '重试失败' }
    }
  }

  const getVideoGenQuota = async () => {
    try {
      if (MOCK_MODE) {
        return await mockAPI.getVideoGenQuota()
      } else {
        const resp = await axios.get('/api/video-gen/quota')
        return { success: true, data: resp.data }
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '获取配额失败' }
    }
  }

  const listVideoGenTasks = async ({ page = 1, pageSize = 10 } = {}) => {
    try {
      if (MOCK_MODE) {
        return await mockAPI.listVideoGenTasks({ page, pageSize })
      } else {
        const resp = await axios.get('/api/video-gen/tasks', { params: { page, pageSize } })
        return { success: true, data: resp.data }
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '获取任务列表失败' }
    }
  }
  
  const requestTranscode = async ({ dramaId, ep, videoUrl, watermark = false }) => {
    try {
      if (MOCK_MODE) return await mockAPI.requestTranscode({ dramaId, ep, videoUrl, watermark })
      const resp = await axios.post('/api/storage/transcode', { dramaId, ep, videoUrl, watermark })
      return { success: true, data: resp.data }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '请求转码失败' }
    }
  }
  
  return {
    dramas,
    currentDrama,
    loading,
    fetchDramas,
    fetchDramaById,
    createDrama,
    updateDrama,
    deleteDrama,
    uploadEpisodeVideo,
    updateEpisodeVideoUrl,
    createVideoGenTask,
    getVideoGenTask,
    retryVideoGenTask
    ,getVideoGenQuota
    ,listVideoGenTasks
    ,requestTranscode
  }
})
