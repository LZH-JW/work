import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import Antd, { message, notification } from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import { setupGlobalErrorHandler } from './utils/errorHandler'

// 立即设置全局错误处理，在任何其他代码之前
setupGlobalErrorHandler()

// 统一配置与拦截 UI 错误提示，避免展示 “Cannot read from private field”
message.config({ maxCount: 1, top: 64 })
const sanitizeContent = (content) => {
  if (typeof content === 'string') {
    if (content.includes('private field') ||
        content.includes('Cannot read from private field') ||
        content.includes('Cannot access private field') ||
        content.includes('could not coalesce error') ||
        content.includes('circuit breaker is open') ||
        content.includes('UNKNOWN_ERROR') ||
        content.length > 300) {
      return '操作失败，请稍后重试'
    }
  }
  return content
}
const __originalMessageError = message.error
message.error = (content, ...args) => __originalMessageError(sanitizeContent(content), ...args)
const __originalNotificationError = notification.error
notification.error = (config) => {
  const newConfig = { ...config }
  if (newConfig && typeof newConfig.message === 'string') {
    newConfig.message = sanitizeContent(newConfig.message)
  }
  if (newConfig && typeof newConfig.description === 'string') {
    newConfig.description = sanitizeContent(newConfig.description)
  }
  return __originalNotificationError(newConfig)
}

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(Antd)

// 添加 Vue 的错误处理
app.config.errorHandler = (err, instance, info) => {
  if (err.message && err.message.includes('private field')) {
    console.warn('Vue private field error handled:', err.message)
    return
  }
  console.error('Vue error:', err, info)
}

app.mount('#app')
