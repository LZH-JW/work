import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { mockAPI, MOCK_MODE } from '@/api/mock'

export const useAIStore = defineStore('ai', () => {
  const aiSuggestions = ref([])
  const generatedContent = ref('')
  const loading = ref(false)
  const chatHistory = ref([])
  
  const generateScript = async (prompt, genre, characters) => {
    loading.value = true
    try {
      if (MOCK_MODE) {
        const resp = await mockAPI.generateScript(prompt, genre, characters)
        generatedContent.value = resp.data.script
        return { success: true, content: resp.data.script }
      } else {
        const response = await axios.post('/api/ai/generate-script', { prompt, genre, characters })
        generatedContent.value = response.data.content
        return { success: true, content: response.data.content }
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'AI生成失败' }
    } finally {
      loading.value = false
    }
  }
  
  const generateCharacter = async (description, personality) => {
    loading.value = true
    try {
      if (MOCK_MODE) {
        const resp = await mockAPI.generateCharacter(description, personality)
        return { success: true, character: resp.data.character }
      } else {
        const response = await axios.post('/api/ai/generate-character', { description, personality })
        return { success: true, character: response.data.character }
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '角色生成失败' }
    } finally {
      loading.value = false
    }
  }
  
  const generateScene = async (setting, mood, characters) => {
    loading.value = true
    try {
      if (MOCK_MODE) {
        const resp = await mockAPI.generateScene(setting, mood, characters)
        return { success: true, scene: resp.data.scene }
      } else {
        const response = await axios.post('/api/ai/generate-scene', { setting, mood, characters })
        return { success: true, scene: response.data.scene }
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '场景生成失败' }
    } finally {
      loading.value = false
    }
  }
  
  const chatWithAI = async (message) => {
    loading.value = true
    try {
      let replyText
      if (MOCK_MODE) {
        const resp = await mockAPI.chatWithAI(message, chatHistory.value)
        replyText = resp.data.response
      } else {
        const response = await axios.post('/api/ai/chat', { message, history: chatHistory.value })
        replyText = response.data.reply
      }
      const userMessage = { role: 'user', content: message, timestamp: new Date() }
      const aiMessage = { role: 'assistant', content: replyText, timestamp: new Date() }
      chatHistory.value.push(userMessage, aiMessage)
      return { success: true, reply: replyText }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'AI对话失败' }
    } finally {
      loading.value = false
    }
  }
  
  const getSuggestions = async (context) => {
    try {
      if (MOCK_MODE) {
        const resp = await mockAPI.getSuggestions(context)
        aiSuggestions.value = resp.data.suggestions
        return resp.data.suggestions
      } else {
        const response = await axios.post('/api/ai/suggestions', { context })
        aiSuggestions.value = response.data.suggestions
        return response.data.suggestions
      }
    } catch (error) {
      console.error('获取AI建议失败:', error)
      return []
    }
  }
  
  // Templates
  const generateOutline = async (topic, genre) => {
    try {
      if (MOCK_MODE) {
        const resp = await mockAPI.generateOutline(topic, genre)
        return { success: true, outline: resp.data.outline }
      } else {
        const response = await axios.post('/api/ai/generate-outline', { topic, genre })
        return { success: true, outline: response.data.outline }
      }
    } catch (error) {
      return { success: false, message: '大纲生成失败' }
    }
  }

  const generateShotlist = async (scenePrompt) => {
    try {
      if (MOCK_MODE) {
        const resp = await mockAPI.generateShotlist(scenePrompt)
        return { success: true, shotlist: resp.data.shotlist }
      } else {
        const response = await axios.post('/api/ai/generate-shotlist', { scenePrompt })
        return { success: true, shotlist: response.data.shotlist }
      }
    } catch (error) {
      return { success: false, message: '分镜生成失败' }
    }
  }

  const generateAudioHints = async (mood) => {
    try {
      if (MOCK_MODE) {
        const resp = await mockAPI.generateAudioHints(mood)
        return { success: true, hints: resp.data.hints }
      } else {
        const response = await axios.post('/api/ai/generate-audio-hints', { mood })
        return { success: true, hints: response.data.hints }
      }
    } catch (error) {
      return { success: false, message: '音画建议生成失败' }
    }
  }

  const generateCoverTitle = async (topic, genre) => {
    try {
      if (MOCK_MODE) {
        const resp = await mockAPI.generateCoverTitle(topic, genre)
        return { success: true, title: resp.data.title, coverPrompt: resp.data.coverPrompt }
      } else {
        const response = await axios.post('/api/ai/generate-cover-title', { topic, genre })
        return { success: true, title: response.data.title, coverPrompt: response.data.coverPrompt }
      }
    } catch (error) {
      return { success: false, message: '封面/标题生成失败' }
    }
  }
  
  const clearChatHistory = () => {
    chatHistory.value = []
  }
  
  return {
    aiSuggestions,
    generatedContent,
    loading,
    chatHistory,
    generateScript,
    generateCharacter,
    generateScene,
    chatWithAI,
    getSuggestions,
    clearChatHistory
    ,generateOutline
    ,generateShotlist
    ,generateAudioHints
    ,generateCoverTitle
  }
})
