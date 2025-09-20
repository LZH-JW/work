<template>
  <div class="ai-chat">
    <div class="chat-messages" ref="messagesContainer">
      <div
        v-for="message in messages"
        :key="message.id"
        :class="['message', message.role]"
      >
        <div class="message-content">
          <div class="message-text">{{ message.content }}</div>
          <div class="message-time">{{ formatTime(message.timestamp) }}</div>
        </div>
      </div>
      <div v-if="loading" class="message assistant">
        <div class="message-content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="chat-input">
      <a-input
        v-model:value="inputMessage"
        placeholder="向AI助手提问..."
        @press-enter="sendMessage"
        :disabled="loading"
      >
        <template #suffix>
          <a-button
            type="text"
            @click="sendMessage"
            :loading="loading"
            :disabled="!inputMessage.trim()"
          >
            <SendOutlined />
          </a-button>
        </template>
      </a-input>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { SendOutlined } from '@ant-design/icons-vue'

const props = defineProps({
  messages: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['send-message'])

const inputMessage = ref('')
const messagesContainer = ref(null)

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString()
}

const sendMessage = () => {
  if (!inputMessage.value.trim()) return
  
  const message = inputMessage.value
  inputMessage.value = ''
  emit('send-message', message)
  
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}
</script>

<style scoped>
.ai-chat {
  display: flex;
  flex-direction: column;
  height: 400px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message {
  display: flex;
  margin-bottom: 16px;
}

.message.user {
  justify-content: flex-end;
}

.message.assistant {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
}

.message.user .message-content {
  background: #1890ff;
  color: white;
}

.message.assistant .message-content {
  background: #f0f0f0;
  color: #333;
}

.message-text {
  margin-bottom: 4px;
}

.message-time {
  font-size: 12px;
  opacity: 0.7;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  align-items: center;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #999;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.chat-input {
  border-top: 1px solid #f0f0f0;
  padding: 16px;
}
</style>
