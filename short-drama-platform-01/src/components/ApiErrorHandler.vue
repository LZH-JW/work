<template>
  <div class="api-error-handler" v-if="showError">
    <a-alert
      message="后端服务连接失败"
      description="检测到后端 API 服务器未运行，已自动切换到演示模式"
      type="warning"
      show-icon
      closable
      @close="showError = false"
    >
      <template #action>
        <a-space>
          <a-button size="small" @click="enableMockMode">
            启用演示模式
          </a-button>
          <a-button size="small" type="primary" @click="retryConnection">
            重试连接
          </a-button>
        </a-space>
      </template>
    </a-alert>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'

const showError = ref(false)

const props = defineProps({
  error: {
    type: [Error, String],
    default: null
  }
})

const emit = defineEmits(['retry', 'enableMock'])

const enableMockMode = () => {
  emit('enableMock')
  message.success('已切换到演示模式')
  showError.value = false
}

const retryConnection = () => {
  emit('retry')
  message.info('正在重试连接...')
}

onMounted(() => {
  if (props.error) {
    showError.value = true
  }
})
</script>

<style scoped>
.api-error-handler {
  margin-bottom: 16px;
}
</style>
