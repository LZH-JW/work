<template>
  <div class="mode-indicator">
    <a-tag :color="modeColor" class="mode-tag">
      <component :is="modeIcon" class="mode-icon" />
      {{ modeText }}
    </a-tag>
    <a-tooltip :title="modeDescription">
      <InfoCircleOutlined class="info-icon" />
    </a-tooltip>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { MOCK_MODE } from '@/api/mock'
import { 
  ExperimentOutlined, 
  ApiOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons-vue'

const modeColor = computed(() => {
  return MOCK_MODE ? 'orange' : 'green'
})

const modeIcon = computed(() => {
  return MOCK_MODE ? ExperimentOutlined : ApiOutlined
})

const modeText = computed(() => {
  return MOCK_MODE ? '演示模式' : 'API 模式'
})

const modeDescription = computed(() => {
  return MOCK_MODE 
    ? '当前使用模拟数据，所有操作都是演示效果'
    : '当前连接真实后端 API，操作会影响真实数据'
})
</script>

<style scoped>
.mode-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px 12px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.mode-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  font-weight: 500;
}

.mode-icon {
  font-size: 12px;
}

.info-icon {
  color: #666;
  cursor: help;
}

.info-icon:hover {
  color: #1890ff;
}
</style>
