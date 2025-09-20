<template>
  <div class="create-drama">
    <div class="create-header">
      <h2>{{ isEdit ? '编辑短剧' : '创建短剧' }}</h2>
      <div class="header-actions">
        <a-button @click="saveDraft" :loading="saving">保存草稿</a-button>
        <a-button type="primary" @click="publishDrama" :loading="publishing">
          {{ isEdit ? '更新' : '发布' }}
        </a-button>
      </div>
    </div>

    <a-form
      :model="dramaForm"
      :rules="rules"
      layout="vertical"
      @finish="handleSubmit"
    >
      <a-row :gutter="24">
        <a-col :span="16">
          <!-- Basic Information -->
          <a-card title="基本信息" class="form-card">
            <a-form-item label="标题" name="title">
              <a-input
                v-model:value="dramaForm.title"
                placeholder="请输入短剧标题"
                size="large"
              />
            </a-form-item>

            <a-form-item label="描述" name="description">
              <a-textarea
                v-model:value="dramaForm.description"
                placeholder="请输入短剧描述"
                :rows="4"
              />
            </a-form-item>

            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="类型" name="genre">
                  <a-select
                    v-model:value="dramaForm.genre"
                    placeholder="选择类型"
                    size="large"
                  >
                    <a-select-option value="romance">爱情</a-select-option>
                    <a-select-option value="comedy">喜剧</a-select-option>
                    <a-select-option value="drama">剧情</a-select-option>
                    <a-select-option value="thriller">悬疑</a-select-option>
                    <a-select-option value="fantasy">奇幻</a-select-option>
                    <a-select-option value="historical">古装</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="时长 (分钟)" name="duration">
                  <a-input-number
                    v-model:value="dramaForm.duration"
                    placeholder="预计时长"
                    :min="1"
                    :max="60"
                    size="large"
                    style="width: 100%"
                  />
                </a-form-item>
              </a-col>
            </a-row>

            <a-form-item label="封面图片">
              <a-upload
                v-model:file-list="coverFileList"
                name="cover"
                list-type="picture-card"
                class="cover-uploader"
                :show-upload-list="false"
                :before-upload="beforeUpload"
                @change="handleCoverChange"
              >
                <div v-if="dramaForm.coverImage">
                  <img :src="dramaForm.coverImage" alt="cover" style="width: 100%" />
                </div>
                <div v-else>
                  <PlusOutlined />
                  <div style="margin-top: 8px">上传封面</div>
                </div>
              </a-upload>
            </a-form-item>
          </a-card>

          <!-- Script Content -->
          <a-card title="剧本内容" class="form-card">
            <div class="script-toolbar">
              <a-button-group>
                <a-button @click="showAIAssistant = true">
                  <RobotOutlined />
                  AI助手
                </a-button>
                <a-button @click="generateScript">
                  <ThunderboltOutlined />
                  AI生成剧本
                </a-button>
              </a-button-group>
            </div>

            <a-form-item name="scriptContent">
              <a-textarea
                v-model:value="dramaForm.scriptContent"
                placeholder="请输入剧本内容，或使用AI助手生成..."
                :rows="20"
                class="script-editor"
              />
            </a-form-item>
          </a-card>

          <!-- Episodes Configuration -->
          <a-card title="分集配置" class="form-card">
            <div class="episodes-toolbar">
              <a-space>
                <a-button type="dashed" @click="addEpisode">
                  <PlusOutlined /> 新增一集
                </a-button>
                <a-button @click="openBatchImport">批量导入URL</a-button>
                <span class="season-price">
                  整季价格（￥）：
                  <a-input-number v-model:value="dramaForm.seasonPrice" :min="0" :precision="2" style="width: 140px;" />
                </span>
              </a-space>
            </div>
            <div class="episodes-container" v-if="episodes.length > 0">
              <div v-for="(ep, index) in episodes" :key="index" class="episode-item">
                <div class="episode-header">
                  <h4>第 {{ ep.ep }} 集</h4>
                  <div class="episode-actions">
                    <a-button type="text" @click="moveEpisodeUp(index)" :disabled="index===0"><UpOutlined /></a-button>
                    <a-button type="text" @click="moveEpisodeDown(index)" :disabled="index===episodes.length-1"><DownOutlined /></a-button>
                    <a-button type="text" danger @click="removeEpisode(index)"><DeleteOutlined /></a-button>
                  </div>
                </div>
                <a-row :gutter="12">
                  <a-col :span="10">
                    <a-input v-model:value="ep.title" placeholder="本集标题" />
                  </a-col>
                  <a-col :span="4">
                    <a-input-number v-model:value="ep.duration" :min="30" :max="3600" :step="10" style="width: 100%" placeholder="时长(s)" />
                  </a-col>
                  <a-col :span="4">
                    <a-checkbox v-model:checked="ep.isFree">免费</a-checkbox>
                  </a-col>
                  <a-col :span="6">
                    <a-input-number v-model:value="ep.price" :min="0" :precision="2" style="width: 100%" placeholder="单集价格(￥)" />
                  </a-col>
                </a-row>
                <!-- 视频上传/生成 -->
                <div class="episode-video">
                  <a-row :gutter="12" align="middle">
                    <a-col :span="12">
                      <div class="cloudgen-params">
                        <a-select v-model:value="ep.style" placeholder="风格" style="width: 120px;">
                          <a-select-option value="都市">都市</a-select-option>
                          <a-select-option value="古风">古风</a-select-option>
                          <a-select-option value="悬疑">悬疑</a-select-option>
                        </a-select>
                        <a-select v-model:value="ep.voice" placeholder="音色" style="width: 120px; margin-left:8px;">
                          <a-select-option value="female">女声</a-select-option>
                          <a-select-option value="male">男声</a-select-option>
                        </a-select>
                        <a-input-number v-model:value="ep.genDuration" :min="30" :max="600" :step="10" style="width: 120px; margin-left:8px;" placeholder="时长(s)" />
                      </div>
                      <a-upload
                        :before-upload="() => false"
                        :max-count="1"
                        @change="(info) => handleEpisodeUploadChange(info, ep)"
                      >
                        <a-button>上传视频文件</a-button>
                      </a-upload>
                      <div class="video-url">
                        <a-input
                          v-model:value="ep.videoUrl"
                          placeholder="或直接粘贴视频URL"
                          @change="debouncedUpdateVideoUrl(ep)"
                        />
                        <div class="url-tools">
                          <a-tag v-if="ep.urlValid===true" color="green">可用</a-tag>
                          <a-tag v-else-if="ep.urlValid===false" color="red">不可用</a-tag>
                          <a-tag v-else>未校验</a-tag>
                          <a-button size="small" @click="validateEpisodeUrl(ep)" :loading="ep.validating">校验</a-button>
                        </div>
                        <div v-if="ep.task" class="task-row">
                          <a-tag :color="ep.task.status==='DONE' ? 'green' : ep.task.status==='FAILED' ? 'red' : 'blue'">{{ ep.task.status }}</a-tag>
                          <a-progress :percent="ep.task.progress||0" style="width:200px" size="small" />
                          <a-button v-if="ep.task.status==='FAILED' && !ep.generating" size="small" @click="retryTask(ep)">重试</a-button>
                        </div>
                      </div>
                    </a-col>
                    <a-col :span="12" style="text-align:right;">
                      <a-space>
                        <a-button @click="requestCloudGen(ep)" :loading="ep.generating">云端一键生成</a-button>
                        <a-button @click="mockGenerateVideo(ep)" :loading="ep.generating">生成示例</a-button>
                        <a-button @click="requestTranscode(ep)" :loading="ep.transcoding">请求转码/水印</a-button>
                        <a-button type="primary" @click="saveEpisodeVideo(ep)" :loading="ep.saving">保存</a-button>
                      </a-space>
                    </a-col>
                  </a-row>
                </div>
              </div>
            </div>
            <div v-else style="color:#999">暂未添加分集，点击“新增一集”开始配置。</div>
          </a-card>
        </a-col>

        <a-col :span="8">
          <!-- AI Assistant Panel -->
          <a-card title="AI创作助手" class="assistant-card">
            <div class="ai-tools">
              <a-button
                block
                @click="generateCharacter"
                :loading="aiStore.loading"
                class="ai-tool-btn"
              >
                <UserOutlined />
                生成角色
              </a-button>
              <a-button
                block
                @click="generateScene"
                :loading="aiStore.loading"
                class="ai-tool-btn"
              >
                <EnvironmentOutlined />
                生成场景
              </a-button>
              <a-button
                block
                @click="getSuggestions"
                :loading="aiStore.loading"
                class="ai-tool-btn"
              >
                <BulbOutlined />
                获取建议
              </a-button>
              <a-button block @click="openTemplates" class="ai-tool-btn">模板中心（大纲/分镜/音画/封面标题）</a-button>
              <a-button block @click="openQuota" class="ai-tool-btn">云端生成配额/任务</a-button>
            </div>

            <div v-if="aiSuggestions.length > 0" class="suggestions">
              <h4>AI建议</h4>
              <div
                v-for="(suggestion, index) in aiSuggestions"
                :key="index"
                class="suggestion-item"
              >
                <p>{{ suggestion }}</p>
                <a-button size="small" @click="applySuggestion(suggestion)">
                  采用
                </a-button>
              </div>
            </div>
          </a-card>

          <!-- Preview -->
          <a-card title="预览" class="preview-card">
            <div class="drama-preview">
              <div class="preview-cover">
                <img
                  :src="dramaForm.coverImage || 'https://via.placeholder.com/300x200'"
                  alt="预览"
                />
              </div>
              <h3>{{ dramaForm.title || '未命名短剧' }}</h3>
              <p>{{ dramaForm.description || '暂无描述' }}</p>
              <div class="preview-meta">
                <a-tag v-if="dramaForm.genre">{{ dramaForm.genre }}</a-tag>
                <span v-if="dramaForm.duration">{{ dramaForm.duration }}分钟</span>
              </div>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </a-form>

    <!-- AI Assistant Modal -->
    <a-modal
      v-model:open="showAIAssistant"
      title="AI创作助手"
      width="800px"
      :footer="null"
    >
      <AIChat @apply-content="applyAIContent" />
    </a-modal>

    <!-- 批量导入URL -->
    <a-modal v-model:open="batchImportOpen" title="批量导入分集URL" @ok="applyBatchImport">
      <p>每行一个URL，按顺序套用到第1集开始的分集（不足自动追加分集）。支持 http/https。</p>
      <a-textarea v-model:value="batchText" :rows="8" placeholder="https://...\nhttps://...\n..." />
    </a-modal>

    <!-- 模板中心 -->
    <a-modal v-model:open="templatesOpen" title="AI模板中心" :footer="null" width="720px">
      <a-tabs>
        <a-tab-pane key="outline" tab="分集大纲">
          <a-space direction="vertical" style="width:100%">
            <a-input v-model:value="tpl.topic" placeholder="主题/题材" />
            <a-select v-model:value="tpl.genre" placeholder="类型">
              <a-select-option value="爱情">爱情</a-select-option>
              <a-select-option value="喜剧">喜剧</a-select-option>
              <a-select-option value="剧情">剧情</a-select-option>
              <a-select-option value="悬疑">悬疑</a-select-option>
              <a-select-option value="奇幻">奇幻</a-select-option>
            </a-select>
            <a-button type="primary" @click="genOutline" :loading="tplLoading">生成大纲</a-button>
            <a-textarea :rows="6" :value="tpl.outline" readonly />
            <a-button @click="applyOutline" :disabled="!tpl.outline">应用到剧本</a-button>
          </a-space>
        </a-tab-pane>
        <a-tab-pane key="shot" tab="分镜建议">
          <a-space direction="vertical" style="width:100%">
            <a-input v-model:value="tpl.scenePrompt" placeholder="场景描述" />
            <a-button type="primary" @click="genShotlist" :loading="tplLoading">生成分镜</a-button>
            <a-textarea :rows="6" :value="tpl.shotlist" readonly />
            <a-button @click="insertToScript(tpl.shotlist)" :disabled="!tpl.shotlist">插入到剧本</a-button>
          </a-space>
        </a-tab-pane>
        <a-tab-pane key="audio" tab="配乐/音效/字幕">
          <a-space direction="vertical" style="width:100%">
            <a-input v-model:value="tpl.mood" placeholder="氛围/情绪（如：温暖/紧张）" />
            <a-button type="primary" @click="genAudioHints" :loading="tplLoading">生成建议</a-button>
            <a-textarea :rows="6" :value="tpl.hints" readonly />
            <a-button @click="insertToScript(tpl.hints)" :disabled="!tpl.hints">插入到剧本</a-button>
          </a-space>
        </a-tab-pane>
        <a-tab-pane key="cover" tab="封面与标题">
          <a-space direction="vertical" style="width:100%">
            <a-input v-model:value="tpl.topic2" placeholder="主题/关键词" />
            <a-select v-model:value="tpl.genre2" placeholder="类型">
              <a-select-option value="都市">都市</a-select-option>
              <a-select-option value="古风">古风</a-select-option>
              <a-select-option value="悬疑">悬疑</a-select-option>
            </a-select>
            <a-button type="primary" @click="genCoverTitle" :loading="tplLoading">生成封面标题</a-button>
            <a-input :value="tpl.title" readonly />
            <a-textarea :rows="4" :value="tpl.coverPrompt" readonly />
            <a-space>
              <a-button @click="applyTitle" :disabled="!tpl.title">应用标题</a-button>
              <a-button @click="insertToScript(tpl.coverPrompt)" :disabled="!tpl.coverPrompt">插入封面提示</a-button>
            </a-space>
          </a-space>
        </a-tab-pane>
      </a-tabs>
    </a-modal>
    <!-- 云端配额与任务列表 -->
    <a-modal v-model:open="quotaOpen" title="云端生成配额与任务（Mock）" :footer="null" width="800px" @open="loadQuotaAndTasks">
      <div class="quota-row">
        <a-statistic title="今日配额" :value="quota.dailyLimit || 0" />
        <a-statistic title="已使用" :value="quota.usedToday || 0" />
        <a-statistic title="重置时间" :value="quota.resetAt ? new Date(quota.resetAt).toLocaleString() : '-'" />
        <a-progress :percent="quotaPercent" style="width:200px" />
      </div>
      <a-table :columns="taskCols" :data-source="taskRows" row-key="taskId" size="small" :pagination="false" />
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useDramaStore } from '@/stores/drama'
import { useAIStore } from '@/stores/ai'
import {
  PlusOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  DeleteOutlined,
  UpOutlined,
  DownOutlined,
  UserOutlined,
  EnvironmentOutlined,
  BulbOutlined
} from '@ant-design/icons-vue'
import AIChat from '@/components/AIChat.vue'

const route = useRoute()
const router = useRouter()
const dramaStore = useDramaStore()
const aiStore = useAIStore()

const isEdit = ref(false)
const saving = ref(false)
const publishing = ref(false)
const showAIAssistant = ref(false)
const coverFileList = ref([])
const episodes = ref([])
const batchImportOpen = ref(false)
const batchText = ref('')
const aiSuggestions = ref([])
const templatesOpen = ref(false)
const tplLoading = ref(false)
const tpl = reactive({ topic:'', genre:'', outline:'', scenePrompt:'', shotlist:'', mood:'', hints:'', topic2:'', genre2:'', title:'', coverPrompt:'' })
const quotaOpen = ref(false)
const quota = reactive({ dailyLimit: 0, usedToday: 0, resetAt: 0 })
const taskRows = ref([])
const taskCols = [
  { title: '任务ID', dataIndex: 'taskId', key: 'taskId' },
  { title: '剧ID', dataIndex: 'dramaId', key: 'dramaId' },
  { title: '集', dataIndex: 'ep', key: 'ep' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '进度', dataIndex: 'progress', key: 'progress' },
  { title: '开始', dataIndex: 'startAt', key: 'startAt' },
  { title: '结束', dataIndex: 'endAt', key: 'endAt' }
]
const quotaPercent = computed(() => {
  if (!quota.dailyLimit) return 0
  return Math.min(100, Math.round((quota.usedToday / quota.dailyLimit) * 100))
})

const dramaForm = reactive({
  title: '',
  description: '',
  genre: '',
  duration: null,
  coverImage: '',
  scriptContent: '',
  aiGenerated: false
})

const rules = {
  title: [
    { required: true, message: '请输入标题' },
    { max: 100, message: '标题不能超过100个字符' }
  ],
  description: [
    { max: 500, message: '描述不能超过500个字符' }
  ],
  genre: [
    { required: true, message: '请选择类型' }
  ]
}

const beforeUpload = (file) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
  if (!isJpgOrPng) {
    message.error('只能上传 JPG/PNG 格式的图片!')
  }
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    message.error('图片大小不能超过 2MB!')
  }
  return isJpgOrPng && isLt2M
}

const handleCoverChange = (info) => {
  if (info.file.status === 'done') {
    // Mock upload success
    dramaForm.coverImage = URL.createObjectURL(info.file.originFileObj)
  }
}

const generateScript = async () => {
  if (!dramaForm.title || !dramaForm.genre) {
    message.warning('请先填写标题和类型')
    return
  }

  try {
    const result = await aiStore.generateScript(
      `创作一个${dramaForm.genre}类型的短剧：${dramaForm.title}`,
      dramaForm.genre,
      ''
    )
    
    if (result.success) {
      dramaForm.scriptContent = result.content
      dramaForm.aiGenerated = true
      message.success('剧本生成成功')
    }
  } catch (error) {
    message.error('剧本生成失败')
  }
}

const generateCharacter = async () => {
  try {
    const result = await aiStore.generateCharacter(
      `为${dramaForm.genre}类型短剧创建角色`,
      '主角性格'
    )
    
    if (result.success) {
      // Insert character into script
      const characterText = `\n\n【角色设定】\n${result.character}\n\n`
      dramaForm.scriptContent += characterText
      message.success('角色生成成功')
    }
  } catch (error) {
    message.error('角色生成失败')
  }
}

const generateScene = async () => {
  try {
    const result = await aiStore.generateScene(
      `为${dramaForm.genre}类型短剧设计场景`,
      '现代都市',
      ['主角']
    )
    
    if (result.success) {
      const sceneText = `\n\n【场景设定】\n${result.scene}\n\n`
      dramaForm.scriptContent += sceneText
      message.success('场景生成成功')
    }
  } catch (error) {
    message.error('场景生成失败')
  }
}

const getSuggestions = async () => {
  try {
    const suggestions = await aiStore.getSuggestions(dramaForm.scriptContent)
    aiSuggestions.value = suggestions
    message.success('获取建议成功')
  } catch (error) {
    message.error('获取建议失败')
  }
}

const openTemplates = () => { templatesOpen.value = true }
const genOutline = async () => { tplLoading.value = true; try { const r = await aiStore.generateOutline(tpl.topic, tpl.genre); if (r.success) tpl.outline = r.outline } finally { tplLoading.value = false } }
const genShotlist = async () => { tplLoading.value = true; try { const r = await aiStore.generateShotlist(tpl.scenePrompt); if (r.success) tpl.shotlist = r.shotlist } finally { tplLoading.value = false } }
const genAudioHints = async () => { tplLoading.value = true; try { const r = await aiStore.generateAudioHints(tpl.mood); if (r.success) tpl.hints = r.hints } finally { tplLoading.value = false } }
const genCoverTitle = async () => { tplLoading.value = true; try { const r = await aiStore.generateCoverTitle(tpl.topic2, tpl.genre2); if (r.success) { tpl.title = r.title; tpl.coverPrompt = r.coverPrompt } } finally { tplLoading.value = false } }
const applyOutline = () => { if (tpl.outline) { dramaForm.scriptContent += `\n\n${tpl.outline}`; message.success('已应用大纲') } }
const insertToScript = (text) => { if (text) { dramaForm.scriptContent += `\n\n${text}`; message.success('已插入到剧本') } }
const applyTitle = () => { if (tpl.title) { dramaForm.title = tpl.title; message.success('已应用标题') } }
const openQuota = () => { quotaOpen.value = true; loadQuotaAndTasks() }
const loadQuotaAndTasks = async () => {
  const q = await dramaStore.getVideoGenQuota()
  if (q.success) Object.assign(quota, q.data)
  const t = await dramaStore.listVideoGenTasks({ page: 1, pageSize: 50 })
  if (t.success) {
    taskRows.value = (t.data.tasks || []).map(x => ({ ...x, startAt: x.startAt ? new Date(x.startAt).toLocaleString() : '-', endAt: x.endAt ? new Date(x.endAt).toLocaleString() : '-' }))
  }
}

const applySuggestion = (suggestion) => {
  dramaForm.scriptContent += `\n\n【建议】${suggestion}\n\n`
  message.success('建议已应用')
}

const renumberEpisodes = () => {
  episodes.value = episodes.value.map((e, i) => ({ ...e, ep: i + 1 }))
}

const addEpisode = () => {
  episodes.value.push({ ep: episodes.value.length + 1, title: '', duration: 120, isFree: episodes.value.length < 3, price: 1.0 })
}

const removeEpisode = (index) => {
  episodes.value.splice(index, 1)
  renumberEpisodes()
}

const moveEpisodeUp = (index) => {
  if (index <= 0) return
  const tmp = episodes.value[index - 1]
  episodes.value[index - 1] = episodes.value[index]
  episodes.value[index] = tmp
  renumberEpisodes()
}

const moveEpisodeDown = (index) => {
  if (index >= episodes.value.length - 1) return
  const tmp = episodes.value[index + 1]
  episodes.value[index + 1] = episodes.value[index]
  episodes.value[index] = tmp
  renumberEpisodes()
}

const openBatchImport = () => {
  batchText.value = ''
  batchImportOpen.value = true
}

const applyBatchImport = () => {
  const urls = (batchText.value || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean)
  if (!urls.length) { message.warning('没有有效URL'); return }
  // 补充分集数量
  while (episodes.value.length < urls.length) addEpisode()
  urls.forEach((u, i) => { episodes.value[i].videoUrl = u })
  batchImportOpen.value = false
  message.success(`已导入 ${urls.length} 条URL`)
}

// Episode video helpers
const handleEpisodeUploadChange = async (info, ep) => {
  const file = info?.file?.originFileObj
  if (!file) return
  ep.saving = true
  try {
    const resp = await dramaStore.uploadEpisodeVideo(dramaForm.id || 0, ep.ep, file)
    if (resp.success) {
      ep.videoUrl = resp.data.videoUrl
      message.success('视频上传成功')
    } else {
      message.error(resp.message || '上传失败')
    }
  } finally {
    ep.saving = false
  }
}

const mockGenerateVideo = async (ep) => {
  ep.generating = true
  try {
    // 直接复用上传接口返回示例URL
    const resp = await dramaStore.uploadEpisodeVideo(dramaForm.id || 0, ep.ep, new File([new Blob()], 'mock.mp4'))
    if (resp.success) {
      ep.videoUrl = resp.data.videoUrl
      message.success('已生成示例视频链接')
    }
  } finally {
    ep.generating = false
  }
}

// 云端一键生成（Mock 任务流）
const requestCloudGen = async (ep) => {
  ep.generating = true
  ep.task = { status: 'PENDING', progress: 0 }
  try {
    const resp = await dramaStore.createVideoGenTask({ dramaId: dramaForm.id || 0, ep: ep.ep, style: ep.style || '都市', duration: ep.genDuration || ep.duration || 60, voice: ep.voice || 'female' })
    if (!resp.success) { message.error(resp.message || '任务创建失败'); ep.generating = false; return }
    const taskId = resp.data.taskId
    ep.task.taskId = taskId
    pollTask(ep)
  } catch (e) {
    ep.generating = false
  }
}

const pollTask = async (ep) => {
  if (!ep?.task?.taskId) return
  const res = await dramaStore.getVideoGenTask(ep.task.taskId)
  if (!res.success) { message.error(res.message || '查询失败'); return }
  const t = res.data
  ep.task.status = t.status
  ep.task.progress = t.progress
  if (t.status === 'DONE') {
    ep.videoUrl = t.videoUrl
    ep.generating = false
    message.success('云端生成完成')
    return
  }
  if (t.status === 'FAILED') {
    ep.generating = false
    message.error(t.error || '云端生成失败')
    return
  }
  setTimeout(() => pollTask(ep), 1200)
}

const requestTranscode = async (ep) => {
  if (!ep.videoUrl) { message.warning('请先上传或生成视频'); return }
  ep.transcoding = true
  try {
    const r = await dramaStore.requestTranscode({ dramaId: dramaForm.id || 0, ep: ep.ep, videoUrl: ep.videoUrl, watermark: true })
    if (r.success) {
      message.success('已提交转码/水印请求')
      // 简单轮询：2.5s后刷新详情（Mock中2s完成回填）
      setTimeout(async ()=>{
        const d = await dramaStore.fetchDramaById(dramaForm.id || 0)
        const updated = (d?.episodes||[]).find(e=>e.ep===ep.ep)
        if (updated?.videoUrl) ep.videoUrl = updated.videoUrl
        ep.transcoding = false
      }, 2500)
    }
  } catch { ep.transcoding = false }
}

const retryTask = async (ep) => {
  if (!ep?.task?.taskId) return
  ep.generating = true
  try {
    const r = await dramaStore.retryVideoGenTask(ep.task.taskId)
    if (!r.success) { message.error(r.message || '重试失败'); ep.generating = false; return }
    pollTask(ep)
  } finally {
    // 状态交由轮询结束设置
  }
}

const doUpdateVideoUrl = async (ep) => {
  if (!ep.videoUrl) return
  ep.saving = true
  try {
    const resp = await dramaStore.updateEpisodeVideoUrl(dramaForm.id || 0, ep.ep, ep.videoUrl)
    if (resp.success) message.success('视频链接已更新')
  } finally {
    ep.saving = false
  }
}

// 简易防抖：按集编号去重
const videoUrlUpdateTimers = new Map()
const debouncedUpdateVideoUrl = (ep) => {
  const key = ep.ep
  const prev = videoUrlUpdateTimers.get(key)
  if (prev) clearTimeout(prev)
  const id = setTimeout(() => doUpdateVideoUrl(ep), 600)
  videoUrlUpdateTimers.set(key, id)
}

const saveEpisodeVideo = async (ep) => {
  await doUpdateVideoUrl(ep)
}

const validateEpisodeUrl = async (ep) => {
  const url = (ep.videoUrl || '').trim()
  if (!/^https?:\/\//i.test(url)) { ep.urlValid = false; message.error('URL必须以http/https开头'); return }
  ep.validating = true
  try {
    const tester = document.createElement('video')
    const timer = setTimeout(() => { tester.src = ''; ep.urlValid = false; ep.validating = false; message.error('校验超时'); }, 8000)
    tester.preload = 'metadata'
    tester.onloadedmetadata = () => { clearTimeout(timer); tester.src = ''; ep.urlValid = true; ep.validating = false; message.success('URL可用') }
    tester.onerror = () => { clearTimeout(timer); tester.src = ''; ep.urlValid = false; ep.validating = false; message.error('URL不可播放') }
    tester.src = url
  } catch {
    ep.urlValid = false
    ep.validating = false
  }
}

const applyAIContent = (content) => {
  dramaForm.scriptContent += `\n\n${content}`
  showAIAssistant.value = false
  message.success('AI内容已应用')
}

const saveDraft = async () => {
  saving.value = true
  try {
    const result = await dramaStore.createDrama({
      ...dramaForm,
      episodes: JSON.stringify(episodes.value)
    })
    
    if (result.success) {
      message.success('草稿保存成功')
    }
  } catch (error) {
    message.error('保存失败')
  } finally {
    saving.value = false
  }
}

const publishDrama = async () => {
  publishing.value = true
  try {
    const result = await dramaStore.createDrama({
      ...dramaForm,
      episodes: JSON.stringify(episodes.value)
    })
    
    if (result.success) {
      message.success('短剧发布成功')
      router.push('/dashboard')
    }
  } catch (error) {
    message.error('发布失败')
  } finally {
    publishing.value = false
  }
}

const handleSubmit = () => {
  publishDrama()
}

onMounted(() => {
  // Check if editing existing drama
  const dramaId = route.query.id
  if (dramaId) {
    isEdit.value = true
    // Load existing drama data
    // This would fetch from the API
  }
})
</script>

<style scoped>
.create-drama {
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
}

.create-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 0 24px;
  background: #fff;
  border-radius: 8px;
  height: 64px;
}

.create-header h2 {
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.form-card {
  margin-bottom: 24px;
}

.cover-uploader {
  width: 120px;
  height: 120px;
}

.script-toolbar {
  margin-bottom: 16px;
}

.script-editor {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
}

.branches-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.branch-item {
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
}

.branch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.branch-header h4 {
  margin: 0;
}

.branch-input {
  margin-bottom: 12px;
}

.branch-textarea {
  margin-bottom: 12px;
}

.assistant-card {
  margin-bottom: 24px;
}

.ai-tools {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.ai-tool-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
}

.suggestions {
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
}

.suggestions h4 {
  margin-bottom: 12px;
}

.suggestion-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 8px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  margin-bottom: 8px;
}

.suggestion-item p {
  margin: 0;
  flex: 1;
  font-size: 12px;
}

.preview-card {
  position: sticky;
  top: 24px;
}

.drama-preview {
  text-align: center;
}

.preview-cover {
  margin-bottom: 16px;
}

.preview-cover img {
  width: 100%;
  border-radius: 8px;
}

.preview-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  font-size: 14px;
  color: #666;
}

.episode-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.episode-actions { display:flex; gap:4px; }
.video-url { margin-top: 8px; }
.url-tools { margin-top: 6px; display:flex; align-items:center; gap:6px; }
.cloudgen-params { margin-bottom: 8px; }
.task-row { display:flex; align-items:center; gap:8px; margin-top:8px; }
</style>
