<template>
  <div class="home">
    <!-- Header -->
    <header class="header">
      <div class="container">
        <div class="nav">
          <div class="logo">
            <h1>短剧平台</h1>
            <span>AI智能创作 · 区块链确权</span>
          </div>
          <div class="nav-menu">
            <a-button type="text" @click="$router.push('/dashboard')">创作者平台</a-button>
            <a-button type="text" @click="$router.push('/me')">我的</a-button>
            <a-button type="text" @click="$router.push('/login')">登录</a-button>
            <a-button type="primary" @click="$router.push('/register')">注册</a-button>
          </div>
        </div>
      </div>
    </header>

    <!-- Popular Dramas (moved up) -->
    <section class="popular-dramas">
      <div class="container">
        <h3>热门短剧</h3>
        <div class="toolbar">
          <div class="mode-toggle">
            <a-segmented :options="[ { label: '短剧', value: 'drama' }, { label: '短视频', value: 'short' }]" v-model:value="mode" @change="onModeChange" />
          </div>
          <a-input
            v-model:value="searchQuery"
            placeholder="搜索标题或简介"
            allow-clear
            style="max-width: 300px"
          />
          <div class="toolbar-right">
            <span class="toolbar-label">类型</span>
            <a-select v-model:value="genreFilter" style="width: 140px">
              <a-select-option value="all">全部</a-select-option>
              <a-select-option v-for="g in availableGenres" :key="g" :value="g">{{ g }}</a-select-option>
            </a-select>
            <span class="toolbar-label">评分下限</span>
            <a-select v-model:value="minRating" style="width: 120px">
              <a-select-option :value="0">不限</a-select-option>
              <a-select-option :value="6">6 分+</a-select-option>
              <a-select-option :value="7">7 分+</a-select-option>
              <a-select-option :value="8">8 分+</a-select-option>
              <a-select-option :value="9">9 分+</a-select-option>
            </a-select>
            <span class="toolbar-label">排序</span>
            <a-select v-model:value="sortKey" style="width: 160px">
              <a-select-option value="hot">按热度（播放）</a-select-option>
              <a-select-option value="rating">按评分</a-select-option>
              <a-select-option value="title">按标题</a-select-option>
            </a-select>
            <span class="toolbar-label">每页</span>
            <a-select v-model:value="pageSize" style="width: 100px">
              <a-select-option :value="6">6</a-select-option>
              <a-select-option :value="12">12</a-select-option>
              <a-select-option :value="24">24</a-select-option>
            </a-select>
          </div>
        </div>
        <div v-if="dramaStore.loading && baseDramas.length === 0" class="dramas-grid">
          <div v-for="i in 6" :key="i" class="drama-card">
            <div class="drama-cover">
              <a-skeleton-image style="width: 100%; height: 200px;" />
            </div>
            <div class="drama-info">
              <a-skeleton active :title="true" :paragraph="{ rows: 2 }" />
            </div>
          </div>
        </div>
        <div v-else class="dramas-grid">
          <div v-for="drama in visibleDramas" :key="drama.id" class="drama-card" @click="$router.push(`/drama/${drama.id}`)" style="cursor: pointer;">
            <div class="drama-cover">
              <span class="genre-badge">{{ drama.genre }}</span>
              <img :src="drama.cover" :alt="drama.title" />
            </div>
            <div class="drama-info">
              <h4>{{ drama.title }}</h4>
              <p>{{ drama.description }}</p>
              <div class="drama-stats">
                <span>{{ drama.views }}万播放</span>
                <span>{{ drama.rating }}分</span>
              </div>
            </div>
          </div>
        </div>
        <div v-if="!dramaStore.loading" ref="loadMoreTrigger" style="height: 1px;"></div>
        <div v-if="!dramaStore.loading" style="text-align:center; color:#999; margin-top:12px;">
          <span v-if="loadingMore">加载中...</span>
          <span v-else-if="visibleDramas.length >= displayedDramas.length">已全部加载</span>
        </div>
      </div>
    </section>



    <!-- Features Section -->
    <section class="features" ref="featuresRef">
      <div class="container">
        <h3>核心功能</h3>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🤖</div>
            <h4>AI智能创作</h4>
            <p>智能剧本生成、角色设计、场景构建，大幅提升创作效率</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🔗</div>
            <h4>区块链确权</h4>
            <p>内容上链确权，智能合约自动分配收益，保护创作者权益</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🎭</div>
            <h4>动态叙事</h4>
            <p>实时剧情分支，用户交互影响故事走向，沉浸式体验</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">💰</div>
            <h4>创作者经济</h4>
            <p>透明化收益分配，NFT数字藏品，多元化变现渠道</p>
          </div>
        </div>
      </div>
    </section>


    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <h4>短剧平台</h4>
            <p>AI + 区块链驱动的短剧创作平台</p>
          </div>
          <div class="footer-section">
            <h4>产品</h4>
            <a href="#">AI创作助手</a>
            <a href="#">区块链确权</a>
            <a href="#">动态叙事</a>
          </div>
          <div class="footer-section">
            <h4>支持</h4>
            <a href="#">帮助中心</a>
            <a href="#">开发者文档</a>
            <a href="#">联系我们</a>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2024 短剧平台. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import { useDramaStore } from '@/stores/drama'

const featuresRef = ref(null)
const dramaStore = useDramaStore()
const mode = ref('drama')
const onModeChange = (v) => { if (v === 'short') window.location.href = '/short' }

// 以 store.dramas 为基础，构建前端用于首页展示的数据结构（兼容 mock/后端字段差异）
const baseDramas = computed(() => {
  return (dramaStore.dramas || []).map(d => ({
    id: d.id,
    title: d.title || d.name || `短剧#${d.id}`,
    description: d.description || d.desc || '',
    cover: d.coverImage || d.cover || 'https://via.placeholder.com/300x200',
    views: d.views || d.playCount || 0,
    rating: d.rating || d.score || 0,
    genre: d.genre || '未知'
  }))
})

// 搜索 / 筛选 / 排序
const searchQuery = ref('')
const minRating = ref(0)
const sortKey = ref('hot') // hot | rating | title
const availableGenres = computed(() => Array.from(new Set(baseDramas.value.map(d => d.genre))).sort())
const genreFilter = ref('all')
const pageSize = ref(6)
const visibleCount = ref(pageSize.value)
const loadingMore = ref(false)
const loadMoreTrigger = ref(null)
let observer = null

const displayedDramas = computed(() => {
  let list = [...baseDramas.value]
  // 搜索
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(d =>
      d.title.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q)
    )
  }
  // 评分下限
  if (minRating.value > 0) {
    list = list.filter(d => (d.rating || 0) >= minRating.value)
  }
  // 类型过滤
  if (genreFilter.value !== 'all') {
    list = list.filter(d => d.genre === genreFilter.value)
  }
  // 排序
  if (sortKey.value === 'hot') {
    list.sort((a, b) => (b.views || 0) - (a.views || 0))
  } else if (sortKey.value === 'rating') {
    list.sort((a, b) => (b.rating || 0) - (a.rating || 0))
  } else if (sortKey.value === 'title') {
    list.sort((a, b) => a.title.localeCompare(b.title, 'zh'))
  }
  return list
})

const visibleDramas = computed(() => {
  return displayedDramas.value.slice(0, visibleCount.value)
})

const loadMore = () => {
  if (loadingMore.value) return
  if (visibleCount.value >= displayedDramas.value.length) return
  loadingMore.value = true
  setTimeout(() => {
    visibleCount.value = Math.min(visibleCount.value + pageSize.value, displayedDramas.value.length)
    loadingMore.value = false
  }, 300)
}

const resetVisible = () => {
  visibleCount.value = pageSize.value
}

watch([searchQuery, minRating, sortKey, genreFilter], () => {
  resetVisible()
})

onMounted(() => {
  // 首次加载短剧列表（mock 与真实接口均由 store 内部适配）
  dramaStore.fetchDramas()
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        loadMore()
      }
    })
  })
  if (loadMoreTrigger.value) observer.observe(loadMoreTrigger.value)
})

onBeforeUnmount(() => {
  if (observer && loadMoreTrigger.value) observer.unobserve(loadMoreTrigger.value)
  observer = null
})


const scrollToFeatures = () => {
  featuresRef.value?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<style scoped>
.home {
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Header */
.header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
}

.logo h1 {
  margin: 0;
  color: #1890ff;
  font-size: 24px;
}

.logo span {
  color: #666;
  font-size: 14px;
}

.nav-menu {
  display: flex;
  gap: 12px;
}

/* Hero Section */
.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 80px 0;
}

.hero-content {
  text-align: center;
  margin-bottom: 60px;
}

.hero-content h2 {
  font-size: 48px;
  margin-bottom: 24px;
  font-weight: bold;
}

.hero-content p {
  font-size: 20px;
  margin-bottom: 12px;
  opacity: 0.9;
}

.hero-actions {
  margin-top: 40px;
  display: flex;
  gap: 16px;
  justify-content: center;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 40px;
  text-align: center;
}

.stat-item {
  background: rgba(255,255,255,0.1);
  padding: 24px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.stat-number {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 16px;
  opacity: 0.8;
}

/* Features Section */
.features {
  padding: 80px 0;
  background: #f8f9fa;
}

.features h3 {
  text-align: center;
  font-size: 36px;
  margin-bottom: 60px;
  color: #333;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 32px;
}

.feature-card {
  background: white;
  padding: 40px 24px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-8px);
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 24px;
}

.feature-card h4 {
  font-size: 24px;
  margin-bottom: 16px;
  color: #333;
}

.feature-card p {
  color: #666;
  line-height: 1.6;
}

/* Popular Dramas */
.popular-dramas {
  padding: 80px 0;
}

.popular-dramas h3 {
  text-align: center;
  font-size: 36px;
  margin-bottom: 60px;
  color: #333;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}
.mode-toggle { display: flex; align-items: center; }

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-label {
  color: #666;
}

.dramas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
}

.drama-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
}

.drama-card:hover {
  transform: translateY(-4px);
}

.drama-cover img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.drama-cover {
  position: relative;
}
.genre-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(24, 144, 255, 0.9);
  color: #fff;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  z-index: 1;
}

.drama-info {
  padding: 24px;
}

.drama-info h4 {
  font-size: 20px;
  margin-bottom: 12px;
  color: #333;
}

.drama-info p {
  color: #666;
  margin-bottom: 16px;
  line-height: 1.5;
}

.drama-stats {
  display: flex;
  justify-content: space-between;
  color: #999;
  font-size: 14px;
}

/* Footer */
.footer {
  background: #333;
  color: white;
  padding: 60px 0 20px;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
  margin-bottom: 40px;
}

.footer-section h4 {
  margin-bottom: 20px;
  font-size: 18px;
}

.footer-section a {
  display: block;
  color: #ccc;
  text-decoration: none;
  margin-bottom: 8px;
  transition: color 0.3s ease;
}

.footer-section a:hover {
  color: #1890ff;
}

.footer-bottom {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #555;
  color: #999;
}

@media (max-width: 768px) {
  .hero-content h2 {
    font-size: 32px;
  }
  
  .hero-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
}
</style>
