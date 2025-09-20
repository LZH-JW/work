<template>
  <div class="ai-assistant">
    <div class="assistant-header">
      <h2>AI创作助手</h2>
      <p>让AI帮助你创作更精彩的短剧内容</p>
    </div>

    <a-row :gutter="24">
      <a-col :span="16">
        <!-- Chat Interface -->
        <a-card title="AI对话" class="chat-card">
          <div class="chat-container">
            <div class="chat-messages" ref="messagesContainer">
              <div
                v-for="message in aiStore.chatHistory"
                :key="message.timestamp"
                :class="['message', message.role]"
              >
                <div class="message-content">
                  <div class="message-text">{{ message.content }}</div>
                  <div class="message-time">
                    {{ formatTime(message.timestamp) }}
                  </div>
                </div>
              </div>
              <div v-if="aiStore.loading" class="message assistant">
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
                v-model:value="chatMessage"
                placeholder="向AI助手提问关于剧本创作的任何问题..."
                @press-enter="sendMessage"
                :disabled="aiStore.loading"
                size="large"
              >
                <template #suffix>
                  <a-button
                    type="text"
                    @click="sendMessage"
                    :loading="aiStore.loading"
                    :disabled="!chatMessage.trim()"
                  >
                    <SendOutlined />
                  </a-button>
                </template>
              </a-input>
            </div>
          </div>
        </a-card>
      </a-col>

      <a-col :span="8">
        <!-- Quick Tools -->
        <a-card title="快速工具" class="tools-card">
          <div class="tool-grid">
            <div class="tool-item" @click="showScriptGenerator = true">
              <FileTextOutlined class="tool-icon" />
              <h4>剧本生成</h4>
              <p>AI生成完整剧本</p>
            </div>
            
            <div class="tool-item" @click="showCharacterGenerator = true">
              <UserOutlined class="tool-icon" />
              <h4>角色设计</h4>
              <p>创建丰富的角色</p>
            </div>
            
            <div class="tool-item" @click="showSceneGenerator = true">
              <EnvironmentOutlined class="tool-icon" />
              <h4>场景构建</h4>
              <p>设计精彩场景</p>
            </div>
            
            <div class="tool-item" @click="showDialogueGenerator = true">
              <CommentOutlined class="tool-icon" />
              <h4>对话优化</h4>
              <p>改进对话内容</p>
            </div>
          </div>
        </a-card>

        <!-- Generation History -->
        <a-card title="生成历史" class="history-card">
          <div class="history-list">
            <div
              v-for="generation in generationHistory"
              :key="generation.id"
              class="history-item"
              @click="viewGeneration(generation)"
            >
              <div class="history-header">
                <span class="generation-type">{{ getTypeLabel(generation.generationType) }}</span>
                <span class="generation-time">{{ formatTime(generation.createdAt) }}</span>
              </div>
              <div class="generation-preview">
                {{ generation.generatedContent.substring(0, 100) }}...
              </div>
              <div class="generation-actions">
                <a-rate
                  v-model:value="generation.userRating"
                  :count="5"
                  size="small"
                  @change="rateGeneration(generation.id, $event)"
                />
              </div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- Script Generator Modal -->
    <a-modal
      v-model:open="showScriptGenerator"
      title="AI剧本生成"
      width="800px"
      @ok="generateScript"
      :confirm-loading="generating"
    >
      <a-form layout="vertical">
        <a-form-item label="剧本主题">
          <a-input
            v-model:value="scriptForm.prompt"
            placeholder="描述你想要的剧本主题和情节"
          />
        </a-form-item>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="类型">
              <a-select v-model:value="scriptForm.genre" placeholder="选择类型">
                <a-select-option value="romance">爱情</a-select-option>
                <a-select-option value="comedy">喜剧</a-select-option>
                <a-select-option value="drama">剧情</a-select-option>
                <a-select-option value="thriller">悬疑</a-select-option>
                <a-select-option value="fantasy">奇幻</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="主要角色">
              <a-input
                v-model:value="scriptForm.characters"
                placeholder="描述主要角色"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <!-- Character Generator Modal -->
    <a-modal
      v-model:open="showCharacterGenerator"
      title="AI角色设计"
      width="600px"
      @ok="generateCharacter"
      :confirm-loading="generating"
    >
      <a-form layout="vertical">
        <a-form-item label="角色描述">
          <a-textarea
            v-model:value="characterForm.prompt"
            placeholder="描述角色的基本信息、性格特点等"
            :rows="4"
          />
        </a-form-item>
        
        <a-form-item label="性格特点">
          <a-input
            v-model:value="characterForm.personality"
            placeholder="例如：开朗、内向、勇敢、谨慎"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Scene Generator Modal -->
    <a-modal
      v-model:open="showSceneGenerator"
      title="AI场景构建"
      width="600px"
      @ok="generateScene"
      :confirm-loading="generating"
    >
      <a-form layout="vertical">
        <a-form-item label="场景描述">
          <a-textarea
            v-model:value="sceneForm.prompt"
            placeholder="描述场景的环境、氛围等"
            :rows="4"
          />
        </a-form-item>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="场景设定">
              <a-input
                v-model:value="sceneForm.setting"
                placeholder="例如：现代都市、古代宫廷"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="氛围">
              <a-input
                v-model:value="sceneForm.mood"
                placeholder="例如：紧张、浪漫、神秘"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <!-- Generation Result Modal -->
    <a-modal
      v-model:open="showResult"
      title="生成结果"
      width="800px"
      :footer="null"
    >
      <div class="result-content">
        <div class="result-header">
          <h3>{{ currentGeneration?.generationType }} 生成结果</h3>
          <div class="result-actions">
            <a-button @click="copyResult">
              <CopyOutlined />
              复制
            </a-button>
            <a-button type="primary" @click="useResult">
              <CheckOutlined />
              使用
            </a-button>
          </div>
        </div>
        <div class="result-text">
          <pre>{{ currentGeneration?.generatedContent }}</pre>
        </div>
        <div class="result-rating">
          <span>为这次生成评分：</span>
          <a-rate
            v-model:value="currentRating"
            @change="rateCurrentGeneration"
          />
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import { useAIStore } from '@/stores/ai'
import {
  SendOutlined,
  FileTextOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CommentOutlined,
  CopyOutlined,
  CheckOutlined
} from '@ant-design/icons-vue'

const aiStore = useAIStore()

const chatMessage = ref('')
const messagesContainer = ref(null)
const generating = ref(false)
const generationHistory = ref([])

// Modal states
const showScriptGenerator = ref(false)
const showCharacterGenerator = ref(false)
const showSceneGenerator = ref(false)
const showDialogueGenerator = ref(false)
const showResult = ref(false)

// Forms
const scriptForm = reactive({
  prompt: '',
  genre: '',
  characters: ''
})

const characterForm = reactive({
  prompt: '',
  personality: ''
})

const sceneForm = reactive({
  prompt: '',
  setting: '',
  mood: ''
})

const currentGeneration = ref(null)
const currentRating = ref(0)

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString()
}

const getTypeLabel = (type) => {
  const labels = {
    'SCRIPT': '剧本',
    'CHARACTER': '角色',
    'SCENE': '场景',
    'DIALOGUE': '对话'
  }
  return labels[type] || type
}

const sendMessage = async () => {
  if (!chatMessage.value.trim()) return
  
  const message = chatMessage.value
  chatMessage.value = ''
  
  try {
    const result = await aiStore.chatWithAI(message, aiStore.chatHistory)
    if (result.success) {
      // Messages are automatically added to store
      scrollToBottom()
    } else {
      message.error(result.message)
    }
  } catch (error) {
    message.error('发送消息失败')
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const generateScript = async () => {
  if (!scriptForm.prompt) {
    message.warning('请输入剧本主题')
    return
  }
  
  generating.value = true
  try {
    const result = await aiStore.generateScript(
      scriptForm.prompt,
      scriptForm.genre,
      scriptForm.characters
    )
    
    if (result.success) {
      currentGeneration.value = {
        generationType: 'SCRIPT',
        generatedContent: result.content
      }
      showScriptGenerator.value = false
      showResult.value = true
      message.success('剧本生成成功')
    }
  } catch (error) {
    message.error('剧本生成失败')
  } finally {
    generating.value = false
  }
}

const generateCharacter = async () => {
  if (!characterForm.prompt) {
    message.warning('请输入角色描述')
    return
  }
  
  generating.value = true
  try {
    const result = await aiStore.generateCharacter(
      characterForm.prompt,
      characterForm.personality
    )
    
    if (result.success) {
      currentGeneration.value = {
        generationType: 'CHARACTER',
        generatedContent: result.character
      }
      showCharacterGenerator.value = false
      showResult.value = true
      message.success('角色生成成功')
    }
  } catch (error) {
    message.error('角色生成失败')
  } finally {
    generating.value = false
  }
}

const generateScene = async () => {
  if (!sceneForm.prompt) {
    message.warning('请输入场景描述')
    return
  }
  
  generating.value = true
  try {
    const result = await aiStore.generateScene(
      sceneForm.prompt,
      sceneForm.setting,
      sceneForm.mood,
      []
    )
    
    if (result.success) {
      currentGeneration.value = {
        generationType: 'SCENE',
        generatedContent: result.scene
      }
      showSceneGenerator.value = false
      showResult.value = true
      message.success('场景生成成功')
    }
  } catch (error) {
    message.error('场景生成失败')
  } finally {
    generating.value = false
  }
}

const copyResult = () => {
  navigator.clipboard.writeText(currentGeneration.value.generatedContent)
  message.success('内容已复制到剪贴板')
}

const useResult = () => {
  // This would typically pass the result back to the parent component
  // or save it to the user's workspace
  message.success('内容已应用')
  showResult.value = false
}

const viewGeneration = (generation) => {
  currentGeneration.value = generation
  currentRating.value = generation.userRating || 0
  showResult.value = true
}

const rateGeneration = async (id, rating) => {
  try {
    // API call to rate generation
    message.success('评分已保存')
  } catch (error) {
    message.error('评分失败')
  }
}

const rateCurrentGeneration = (rating) => {
  currentRating.value = rating
  // Save rating
  message.success('评分已保存')
}

onMounted(() => {
  // Load generation history
  generationHistory.value = [
    {
      id: 1,
      generationType: 'SCRIPT',
      generatedContent: '这是一个关于现代都市爱情的短剧剧本...',
      createdAt: new Date(),
      userRating: 4
    },
    {
      id: 2,
      generationType: 'CHARACTER',
      generatedContent: '李小雨，25岁，性格开朗活泼的都市白领...',
      createdAt: new Date(),
      userRating: 5
    }
  ]
})
</script>

<style scoped>
.ai-assistant {
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
}

.assistant-header {
  text-align: center;
  margin-bottom: 32px;
}

.assistant-header h2 {
  margin-bottom: 8px;
}

.assistant-header p {
  color: #666;
  font-size: 16px;
}

.chat-card {
  height: 600px;
  display: flex;
  flex-direction: column;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
  max-height: 480px;
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
  position: relative;
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
  line-height: 1.5;
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
  padding-top: 16px;
}

.tools-card {
  margin-bottom: 24px;
}

.tool-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.tool-item {
  text-align: center;
  padding: 20px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.tool-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.tool-icon {
  font-size: 32px;
  color: #1890ff;
  margin-bottom: 12px;
}

.tool-item h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
}

.tool-item p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.history-card {
  max-height: 400px;
  overflow-y: auto;
}

.history-item {
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.history-item:hover {
  border-color: #1890ff;
  background: #f9f9f9;
}

.history-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.generation-type {
  font-weight: 500;
  color: #1890ff;
}

.generation-time {
  font-size: 12px;
  color: #999;
}

.generation-preview {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  line-height: 1.4;
}

.generation-actions {
  text-align: right;
}

.result-content {
  max-height: 500px;
  overflow-y: auto;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.result-header h3 {
  margin: 0;
}

.result-actions {
  display: flex;
  gap: 8px;
}

.result-text {
  background: #f9f9f9;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  max-height: 300px;
  overflow-y: auto;
}

.result-text pre {
  margin: 0;
  white-space: pre-wrap;
  font-family: inherit;
  line-height: 1.6;
}

.result-rating {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
}
</style>
