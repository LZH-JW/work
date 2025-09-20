<template>
  <div class="dashboard">
    <a-layout>
      <!-- Header -->
      <a-layout-header class="header">
        <div class="header-content">
          <div class="logo">
            <h2>短剧平台</h2>
          </div>
          <div class="user-info">
            <a-dropdown>
              <a-button type="text" class="user-button">
                <a-avatar :src="userStore.user?.avatar" :size="32">
                  {{ userStore.user?.username?.charAt(0) }}
                </a-avatar>
                <span class="username">{{ userStore.user?.username }}</span>
                <DownOutlined />
              </a-button>
              <template #overlay>
                <a-menu>
                  <a-menu-item key="profile">
                    <UserOutlined />
                    个人资料
                  </a-menu-item>
                  <a-menu-item key="wallet" @click="showWalletModal = true">
                    <WalletOutlined />
                    钱包管理
                  </a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="logout" @click="handleLogout">
                    <LogoutOutlined />
                    退出登录
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </div>
      </a-layout-header>

      <a-layout>
        <!-- Sidebar -->
        <a-layout-sider width="250" class="sidebar">
          <a-menu
            v-model:selectedKeys="selectedKeys"
            mode="inline"
            theme="light"
            @click="handleMenuClick"
          >
            <a-menu-item key="overview">
              <DashboardOutlined />
              <span>概览</span>
            </a-menu-item>
            <a-menu-item key="generator">
              <RobotOutlined />
              <span>生成中心</span>
            </a-menu-item>
            <a-menu-item key="my-dramas">
              <PlayCircleOutlined />
              <span>我的短剧</span>
            </a-menu-item>
            <a-menu-item key="create">
              <PlusOutlined />
              <span>创建短剧</span>
            </a-menu-item>
            <a-menu-item key="ai-assistant">
              <RobotOutlined />
              <span>AI助手</span>
            </a-menu-item>
            <a-menu-item key="blockchain">
              <LinkOutlined />
              <span>区块链</span>
            </a-menu-item>
            <a-menu-item key="analytics">
              <BarChartOutlined />
              <span>数据分析</span>
            </a-menu-item>
          </a-menu>
        </a-layout-sider>

        <!-- Content -->
        <a-layout-content class="content">
          <!-- Cloud Gen Quota Bar -->
          <div class="quota-bar" v-if="quota.dailyLimit">
            <a-alert type="info" show-icon>
              <template #message>
                云端生成配额：今日 {{ quota.usedToday }}/{{ quota.dailyLimit }}，重置于 {{ quota.resetAt ? new Date(quota.resetAt).toLocaleString() : '-' }}
              </template>
              <template #description>
                <a-progress :percent="quotaPercent" :show-info="false" />
              </template>
            </a-alert>
          </div>
          <!-- Overview Tab -->
          <div v-if="activeTab === 'overview'" class="tab-content">
            <div class="stats-cards">
              <a-row :gutter="16">
                <a-col :span="6">
                  <a-card class="stat-card">
                    <a-statistic
                      title="创作短剧"
                      :value="userStore.user?.createdDramas || 0"
                      :value-style="{ color: '#3f8600' }"
                    >
                      <template #prefix>
                        <PlayCircleOutlined />
                      </template>
                    </a-statistic>
                  </a-card>
                </a-col>
                <a-col :span="6">
                  <a-card class="stat-card">
                    <a-statistic
                      title="总收益 (ETH)"
                      :value="userStore.user?.totalEarnings || 0"
                      :precision="4"
                      :value-style="{ color: '#cf1322' }"
                    >
                      <template #prefix>
                        <DollarOutlined />
                      </template>
                    </a-statistic>
                  </a-card>
                </a-col>
                <a-col :span="6">
                  <a-card class="stat-card">
                    <a-statistic
                      title="总观看量"
                      :value="totalViews"
                      :value-style="{ color: '#1890ff' }"
                    >
                      <template #prefix>
                        <EyeOutlined />
                      </template>
                    </a-statistic>
                  </a-card>
                </a-col>
                <a-col :span="6">
                  <a-card class="stat-card">
                    <a-statistic
                      title="AI生成次数"
                      :value="aiGenerations"
                      :value-style="{ color: '#722ed1' }"
                    >
                      <template #prefix>
                        <RobotOutlined />
                      </template>
                    </a-statistic>
                  </a-card>
                </a-col>
              </a-row>
            </div>

            <div class="recent-activity">
              <a-card title="最近活动" class="activity-card">
                <a-timeline>
                  <a-timeline-item v-for="activity in recentActivities" :key="activity.id">
                    <template #dot>
                      <component :is="activity.icon" style="font-size: 16px;" />
                    </template>
                    <div class="activity-content">
                      <div class="activity-title">{{ activity.title }}</div>
                      <div class="activity-time">{{ activity.time }}</div>
                    </div>
                  </a-timeline-item>
                </a-timeline>
              </a-card>
            </div>
          </div>

          <!-- My Dramas Tab -->
          <div v-if="activeTab === 'my-dramas'" class="tab-content">
            <div class="dramas-header">
              <h3>我的短剧</h3>
              <a-button type="primary" @click="$router.push('/create')">
                <PlusOutlined />
                创建新短剧
              </a-button>
            </div>
            
            <div class="dramas-grid">
              <a-row :gutter="[16, 16]">
                <a-col v-for="drama in myDramas" :key="drama.id" :span="8">
                  <a-card hoverable class="drama-card">
                    <template #cover>
                      <img :src="drama.coverImage || 'https://via.placeholder.com/300x200'" />
                    </template>
                    <template #actions>
                      <EditOutlined @click="editDrama(drama)" />
                      <EyeOutlined @click="viewDrama(drama)" />
                      <MoreOutlined />
                    </template>
                    <a-card-meta :title="drama.title" :description="drama.description" />
                    <div class="drama-stats">
                      <span><EyeOutlined /> {{ drama.views }}</span>
                      <span><HeartOutlined /> {{ drama.likes }}</span>
                      <a-tag :color="getStatusColor(drama.status)">{{ drama.status }}</a-tag>
                    </div>
                  </a-card>
                </a-col>
              </a-row>
            </div>
          </div>

          <!-- Other tabs content would go here -->
          <div v-if="activeTab === 'create'" class="tab-content">
            <CreateDrama />
          </div>

          <div v-if="activeTab === 'ai-assistant'" class="tab-content">
            <AIAssistant />
          </div>

          <div v-if="activeTab === 'blockchain'" class="tab-content">
            <Blockchain />
          </div>

          <!-- Analytics Tab -->
          <div v-if="activeTab === 'analytics'" class="tab-content">
            <a-row :gutter="16">
              <a-col :span="6">
                <a-card>
                  <div class="kpi-title">到达第3集</div>
                  <a-progress :percent="Math.round((kpi.freeToEp3Rate||0)*100)" status="active" />
                </a-card>
              </a-col>
              <a-col :span="6">
                <a-card>
                  <div class="kpi-title">到达第5集</div>
                  <a-progress :percent="Math.round((kpi.toEp5Rate||0)*100)" status="active" />
                </a-card>
              </a-col>
              <a-col :span="6">
                <a-card>
                  <div class="kpi-title">完季率</div>
                  <a-progress :percent="Math.round((kpi.finishSeasonRate||0)*100)" type="circle" :width="80" />
                </a-card>
              </a-col>
              <a-col :span="6">
                <a-card>
                  <a-statistic title="ARPU (￥)" :value="kpi.arpu || 0" :precision="2" />
                  <div style="height:8px"></div>
                  <a-statistic title="复购率" :value="Math.round((kpi.repurchaseRate||0)*100)" suffix="%" />
                </a-card>
              </a-col>
            </a-row>

            <a-card title="最近购买趋势（Mock）" style="margin-top:16px;">
              <div class="bars">
                <div v-for="item in kpi.recentPurchases" :key="item.date" class="bar-row">
                  <div class="bar-label">{{ item.date }} · 第{{ item.ep }}集</div>
                  <div class="bar">
                    <div class="bar-inner" :style="{ width: (item.count / maxPurchase * 100) + '%' }"></div>
                    <span class="bar-value">{{ item.count }}</span>
                  </div>
                </div>
              </div>
            </a-card>

            <a-card title="分集漏斗与转化（Mock）" style="margin-top:16px;">
              <a-row :gutter="16">
                <a-col :span="8">
                  <a-statistic title="开播→试看完比" :value="Math.round((kpi.freeToEp3Rate||0)*100)" suffix="%" />
                  <div class="funnel-bar"><div class="inner" :style="{ width: Math.round((kpi.freeToEp3Rate||0)*100)+'%' }"></div></div>
                </a-col>
                <a-col :span="8">
                  <a-statistic title="试看完→付费比" :value="Math.round(((kpi.toEp5Rate||0) / (kpi.freeToEp3Rate||1))*100)" suffix="%" />
                  <div class="funnel-bar"><div class="inner" :style="{ width: Math.round(((kpi.toEp5Rate||0)/(kpi.freeToEp3Rate||1))*100)+'%' }"></div></div>
                </a-col>
                <a-col :span="8">
                  <a-statistic title="付费→完季比" :value="Math.round((kpi.finishSeasonRate||0)*100)" suffix="%" />
                  <div class="funnel-bar"><div class="inner" :style="{ width: Math.round((kpi.finishSeasonRate||0)*100)+'%' }"></div></div>
                </a-col>
              </a-row>
            </a-card>
          </div>

          <!-- Generator Center -->
          <div v-if="activeTab === 'generator'" class="tab-content">
            <div class="gen-header">
              <h3>生成中心（Mock）</h3>
              <a-button @click="refreshGenData">刷新</a-button>
            </div>
            <a-row :gutter="16">
              <a-col :span="8">
                <a-card title="今日配额">
                  <a-statistic title="限制" :value="quota.dailyLimit||0" />
                  <a-statistic title="已使用" :value="quota.usedToday||0" />
                  <a-progress :percent="quotaPercent" />
                </a-card>
              </a-col>
              <a-col :span="16">
                <a-card title="任务列表">
                  <a-table :columns="taskCols" :data-source="taskRows" row-key="taskId" size="small" :pagination="false" />
                </a-card>
              </a-col>
            </a-row>
          </div>
        </a-layout-content>
      </a-layout>
    </a-layout>

    <!-- Wallet Modal -->
    <a-modal
      v-model:open="showWalletModal"
      title="钱包管理"
      @ok="handleWalletConnect"
    >
      <div class="wallet-content">
        <div v-if="!blockchainStore.connected" class="wallet-connect">
          <p>连接您的钱包以启用区块链功能</p>
          <a-button type="primary" @click="connectWallet">
            连接MetaMask钱包
          </a-button>
        </div>
        <div v-else class="wallet-info">
          <p><strong>钱包地址:</strong> {{ blockchainStore.account }}</p>
          <p><strong>余额:</strong> {{ blockchainStore.balance }} ETH</p>
          <a-button @click="disconnectWallet">断开连接</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useUserStore } from '@/stores/user'
import { useDramaStore } from '@/stores/drama'
import { useBlockchainStore } from '@/stores/blockchain'
import { mockAPI, MOCK_MODE } from '@/api/mock'
import {
  DashboardOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  RobotOutlined,
  LinkOutlined,
  BarChartOutlined,
  UserOutlined,
  WalletOutlined,
  LogoutOutlined,
  DownOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  HeartOutlined,
  DollarOutlined
} from '@ant-design/icons-vue'
import CreateDrama from './CreateDrama.vue'
import AIAssistant from './AIAssistant.vue'
import Blockchain from './Blockchain.vue'

const router = useRouter()
const userStore = useUserStore()
const dramaStore = useDramaStore()
const blockchainStore = useBlockchainStore()
// Cloud generator quota and tasks
const quota = ref({ dailyLimit: 0, usedToday: 0, resetAt: 0 })
const quotaPercent = computed(() => quota.value.dailyLimit ? Math.min(100, Math.round((quota.value.usedToday / quota.value.dailyLimit) * 100)) : 0)
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
const refreshGenData = async () => {
  const q = await dramaStore.getVideoGenQuota()
  if (q.success) quota.value = q.data
  const t = await dramaStore.listVideoGenTasks({ page: 1, pageSize: 50 })
  if (t.success) taskRows.value = (t.data.tasks||[]).map(x => ({ ...x, startAt: x.startAt ? new Date(x.startAt).toLocaleString() : '-', endAt: x.endAt ? new Date(x.endAt).toLocaleString() : '-' }))
}

const selectedKeys = ref(['overview'])
const activeTab = ref('overview')
const showWalletModal = ref(false)
const myDramas = ref([])
const totalViews = ref(0)
const aiGenerations = ref(0)

// KPI state
const kpi = ref({
  freeToEp3Rate: 0,
  toEp5Rate: 0,
  toEp10Rate: 0,
  finishSeasonRate: 0,
  arpu: 0,
  repurchaseRate: 0,
  recentPurchases: []
})
const maxPurchase = computed(() => {
  const arr = kpi.value.recentPurchases || []
  return arr.length ? Math.max(...arr.map(i => i.count)) : 1
})

const recentActivities = ref([
  {
    id: 1,
    title: '创建了新短剧《都市情缘》',
    time: '2小时前',
    icon: 'PlayCircleOutlined'
  },
  {
    id: 2,
    title: 'AI生成了角色设定',
    time: '1天前',
    icon: 'RobotOutlined'
  },
  {
    id: 3,
    title: '注册了版权保护',
    time: '2天前',
    icon: 'LinkOutlined'
  }
])

const handleMenuClick = ({ key }) => {
  selectedKeys.value = [key]
  activeTab.value = key
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

const connectWallet = async () => {
  const result = await blockchainStore.connectWallet()
  if (result.success) {
    message.success('钱包连接成功')
    showWalletModal.value = false
  } else {
    message.error(result.message)
  }
}

const disconnectWallet = () => {
  blockchainStore.disconnectWallet()
  message.success('钱包已断开连接')
  showWalletModal.value = false
}

const handleWalletConnect = () => {
  if (!blockchainStore.connected) {
    connectWallet()
  } else {
    showWalletModal.value = false
  }
}

const editDrama = (drama) => {
  router.push(`/create?id=${drama.id}`)
}

const viewDrama = (drama) => {
  router.push(`/drama/${drama.id}`)
}

const getStatusColor = (status) => {
  const colors = {
    'DRAFT': 'orange',
    'PUBLISHED': 'green',
    'REVIEWING': 'blue'
  }
  return colors[status] || 'default'
}

onMounted(async () => {
  // Fetch user's dramas and statistics
  try {
    await dramaStore.fetchDramas()
    // This would normally fetch user-specific dramas
    myDramas.value = dramaStore.dramas.slice(0, 6) // Mock data
    totalViews.value = myDramas.value.reduce((sum, drama) => sum + drama.views, 0)
    aiGenerations.value = 25 // Mock data
    // Fetch KPI
    if (MOCK_MODE) {
      const resp = await mockAPI.getSeriesKPI()
      if (resp.success) kpi.value = resp.data
    }
    await refreshGenData()
  } catch (error) {
    message.error('获取数据失败')
  }
})
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
}

.header {
  background: #fff;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.logo h2 {
  margin: 0;
  color: #1890ff;
}

.user-button {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 12px;
}

.username {
  margin-left: 8px;
}

.sidebar {
  background: #fff;
  box-shadow: 2px 0 8px rgba(0,0,0,0.1);
}

.content {
  padding: 24px;
  background: #f5f5f5;
  min-height: calc(100vh - 64px);
}
.quota-bar { margin-bottom: 16px; }
.gen-header { display:flex; justify-content: space-between; align-items:center; margin-bottom: 12px; }

.tab-content {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
}

.stats-cards {
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
}

.activity-card {
  margin-top: 24px;
}

.kpi-title { font-weight: 500; margin-bottom: 8px; }
.bars { display: flex; flex-direction: column; gap: 8px; }
.bar-row { display: flex; align-items: center; gap: 12px; }
.bar-label { width: 160px; color: #666; }
.bar { position: relative; flex: 1; height: 12px; background: #f0f0f0; border-radius: 6px; overflow: hidden; }
.bar-inner { height: 100%; background: linear-gradient(90deg, #1890ff, #52c41a); }
.bar-value { position: absolute; right: 8px; top: -2px; font-size: 12px; color: #333; }

.funnel-bar { height: 10px; background:#f0f0f0; border-radius:6px; overflow:hidden; margin-top:8px; }
.funnel-bar .inner { height:100%; background: linear-gradient(90deg, #91d5ff, #1890ff); }

.activity-content {
  display: flex;
  flex-direction: column;
}

.activity-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.activity-time {
  color: #999;
  font-size: 12px;
}

.dramas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.dramas-header h3 {
  margin: 0;
}

.drama-card {
  margin-bottom: 16px;
}

.drama-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  font-size: 14px;
  color: #666;
}

.drama-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.wallet-content {
  text-align: center;
  padding: 20px 0;
}

.wallet-connect p {
  margin-bottom: 20px;
  color: #666;
}

.wallet-info {
  text-align: left;
}

.wallet-info p {
  margin-bottom: 12px;
}
</style>
