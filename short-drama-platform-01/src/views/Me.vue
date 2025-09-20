<template>
  <div class="me-page">
    <div class="container">
      <h2>我的</h2>

      <a-tabs>
        <a-tab-pane key="favorites" tab="收藏夹">
          <div class="toolbar">
            <a-input v-model:value="favSearch" placeholder="搜索收藏（标题）" allow-clear style="max-width: 280px" />
            <div class="toolbar-right">
              <span class="label">排序</span>
              <a-select v-model:value="favSort" style="width: 160px">
                <a-select-option value="title">按标题</a-select-option>
                <a-select-option value="genre">按类型</a-select-option>
              </a-select>
            </div>
          </div>
          <div v-if="favoritesDetails.length === 0" class="empty">
            暂无收藏
            <div style="margin-top:8px;">
              <a-button type="primary" @click="$router.push('/')">去首页看看</a-button>
            </div>
          </div>
          <transition-group name="list" tag="div" class="grid" v-else>
            <div v-for="item in filteredFavorites" :key="item.id" class="card" @click="$router.push(`/drama/${item.id}`)">
              <img class="thumb-img" :src="item.coverImage || item.cover || 'https://via.placeholder.com/100x100'" :alt="item.title" />
              <div class="meta">
                <div class="title">{{ item.title || ('短剧 #' + item.id) }}</div>
                <div class="desc">类型：{{ item.genre || '未知' }} · 评分：{{ item.rating ?? '-' }}</div>
                <a-button type="link" @click.stop="removeFavorite(item.id)">取消收藏</a-button>
              </div>
            </div>
          </transition-group>
        </a-tab-pane>
        <a-tab-pane key="history" tab="观看历史">
          <div class="toolbar">
            <a-input v-model:value="hisSearch" placeholder="搜索历史（标题）" allow-clear style="max-width: 280px" />
            <div class="toolbar-right">
              <span class="label">排序</span>
              <a-select v-model:value="hisSort" style="width: 200px">
                <a-select-option value="time">按时间（最近优先）</a-select-option>
                <a-select-option value="title">按标题</a-select-option>
              </a-select>
            </div>
          </div>
          <div v-if="historyDetails.length === 0" class="empty">
            暂无观看记录
            <div style="margin-top:8px;">
              <a-button type="primary" @click="$router.push('/')">去首页看看</a-button>
            </div>
          </div>
          <transition-group name="list" tag="div" class="grid" v-else>
            <div v-for="item in filteredHistory" :key="item.dramaId" class="card">
              <img class="thumb-img" :src="item.detail?.coverImage || item.detail?.cover || 'https://via.placeholder.com/100x100'" :alt="item.detail?.title || 'thumb'" />
              <div class="meta">
                <div class="title">{{ item.detail?.title || ('短剧 #' + item.dramaId) }}</div>
                <div class="desc">上次观看时间：{{ formatTime(item.savedAt) }}</div>
                <div class="actions">
                  <a-button type="primary" @click="$router.push(`/drama/${item.dramaId}`)">继续观看</a-button>
                  <a-button @click="removeHistory(item.dramaId)">移除</a-button>
                </div>
              </div>
            </div>
          </transition-group>
        </a-tab-pane>
        <a-tab-pane key="purchases" tab="已购记录">
          <div class="toolbar">
            <div class="toolbar-right">
              <a-segmented v-model:value="buyFilter" :options="[{label:'全部',value:'all'},{label:'单集',value:'episode'},{label:'整季',value:'season'}]" />
              <a-button @click="exportPurchasesCSV">导出CSV</a-button>
              <span class="label">排序</span>
              <a-select v-model:value="buySort" style="width: 200px">
                <a-select-option value="time">按时间（最近优先）</a-select-option>
                <a-select-option value="price">按金额</a-select-option>
              </a-select>
            </div>
          </div>
          <div v-if="purchases.length === 0" class="empty">暂无购买记录</div>
          <transition-group name="list" tag="div" class="grid" v-else>
            <div v-for="item in sortedPurchases" :key="item.time" class="card">
              <div class="meta">
                <div class="title">短剧 #{{ item.dramaId }} · {{ item.season ? '整季' : ('第' + item.ep + '集') }}</div>
                <div class="desc">金额：￥{{ item.price || 0 }} · 时间：{{ formatTime(item.time) }}</div>
                <div class="desc" v-if="item.txHash">交易：<a :href="`https://sepolia.etherscan.io/tx/${item.txHash}`" target="_blank">{{ item.txHash }}</a></div>
                <div class="actions">
                  <a-button type="primary" @click="$router.push(`/drama/${item.dramaId}`)">前往观看</a-button>
                </div>
              </div>
            </div>
          </transition-group>
        </a-tab-pane>
        <a-tab-pane key="nfts" tab="我的NFT">
          <div v-if="nfts.length === 0" class="empty">暂无NFT藏品</div>
          <transition-group name="list" tag="div" class="grid" v-else>
            <div v-for="item in nfts" :key="item.time + '-' + item.tokenId" class="card">
              <div class="meta">
                <div class="title">NFT #{{ item.tokenId }} · 短剧 #{{ item.dramaId }}</div>
                <div class="desc">备注：{{ item.note || '-' }} · 获得时间：{{ formatTime(item.time) }}</div>
                <div class="actions">
                  <a-button @click="$router.push(`/drama/${item.dramaId}`)">查看短剧</a-button>
                </div>
              </div>
            </div>
          </transition-group>
        </a-tab-pane>
        <a-tab-pane key="short" tab="短视频">
          <div class="toolbar">
            <div class="toolbar-right">
              <span class="label">排序</span>
              <a-select v-model:value="svSort" style="width: 200px">
                <a-select-option value="time">按时间（最近优先）</a-select-option>
                <a-select-option value="title">按标题</a-select-option>
              </a-select>
            </div>
          </div>
          <a-tabs type="card">
            <a-tab-pane key="sv-fav" tab="收藏">
              <div v-if="svFavorites.length === 0" class="empty">
                暂无收藏
                <div style="margin-top:8px;"><a-button type="primary" @click="$router.push('/short')">去短视频看看</a-button></div>
              </div>
              <transition-group name="list" tag="div" class="grid" v-else>
                <div v-for="item in sortedSvFavorites" :key="item.id" class="card" @click="gotoShort(item.id)">
                  <img class="thumb-img" :src="item.cover" :alt="item.title" />
                  <div class="meta">
                    <div class="title">{{ item.title }}</div>
                    <div class="desc">最近收藏：{{ formatTime(item.savedAt || Date.now()) }}</div>
                  </div>
                </div>
              </transition-group>
            </a-tab-pane>
            <a-tab-pane key="sv-his" tab="历史">
              <div v-if="svHistory.length === 0" class="empty">
                暂无观看记录
                <div style="margin-top:8px;"><a-button type="primary" @click="$router.push('/short')">去短视频看看</a-button></div>
              </div>
              <transition-group name="list" tag="div" class="grid" v-else>
                <div v-for="item in sortedSvHistory" :key="item.id" class="card" @click="gotoShort(item.id)">
                  <img class="thumb-img" :src="item.cover" :alt="item.title" />
                  <div class="meta">
                    <div class="title">{{ item.title }}</div>
                    <div class="desc">上次观看：{{ formatTime(item.savedAt) }} · 进度 {{ item.progress || 0 }}s</div>
                  </div>
                </div>
              </transition-group>
            </a-tab-pane>
          </a-tabs>
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useDramaStore } from '@/stores/drama'
import { MOCK_MODE } from '@/api/mock'
import { useRouter } from 'vue-router'

const FAVORITES_KEY = 'favorite_dramas'
const HISTORY_PREFIX = 'narrative_progress_'

const favorites = ref([])
const favoritesDetails = ref([])
const historyList = ref([]) // {dramaId, savedAt}
const historyDetails = ref([]) // {dramaId, savedAt, detail}
// 短视频
const svFavorites = ref([]) // [{id,title,cover,savedAt}]
const svHistory = ref([])   // [{id,title,cover,savedAt,progress}]
// 购买与NFT
const purchases = ref([])   // [{dramaId, ep|season, price, txHash, time}]
const nfts = ref([])        // [{dramaId, tokenId, note, time}]

// 搜索 / 排序
const favSearch = ref('')
const favSort = ref('title') // title | genre
const hisSearch = ref('')
const hisSort = ref('time') // time | title
const dramaStore = useDramaStore()
const router = useRouter()

const loadFavorites = () => {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    favorites.value = raw ? JSON.parse(raw) : []
  } catch { favorites.value = [] }
}

const loadHistory = () => {
  try {
    historyList.value = Object.keys(localStorage)
      .filter(k => k.startsWith(HISTORY_PREFIX))
      .map(k => {
        const data = JSON.parse(localStorage.getItem(k) || '{}')
        const dramaId = Number(k.replace(HISTORY_PREFIX, ''))
        return { dramaId, savedAt: data?.savedAt || Date.now() }
      })
      .sort((a, b) => b.savedAt - a.savedAt)
  } catch { historyList.value = [] }
}

// 购买记录筛选与排序
const buyFilter = ref('all') // all | episode | season
const buySort = ref('time')
const sortedPurchases = computed(() => {
  let list = [...purchases.value]
  if (buyFilter.value === 'episode') list = list.filter(i => !i.season)
  if (buyFilter.value === 'season') list = list.filter(i => !!i.season)
  if (buySort.value === 'time') list.sort((a, b) => (b.time || 0) - (a.time || 0))
  else if (buySort.value === 'price') list.sort((a, b) => (b.price || 0) - (a.price || 0))
  return list
})

const exportPurchasesCSV = () => {
  try {
    const rows = [['dramaId','type','ep','price','txHash','time']]
    sortedPurchases.value.forEach(i => {
      rows.push([
        i.dramaId,
        i.season ? 'season' : 'episode',
        i.season ? '' : (i.ep || ''),
        i.price || 0,
        i.txHash || '',
        new Date(i.time).toISOString()
      ])
    })
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'purchases.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch {}
}

const loadFavoriteDetails = async () => {
  favoritesDetails.value = []
  for (const id of favorites.value) {
    try {
      const detail = await dramaStore.fetchDramaById(id)
      favoritesDetails.value.push(detail)
    } catch {
      favoritesDetails.value.push({ id })
    }
  }
}

const loadHistoryDetails = async () => {
  historyDetails.value = []
  for (const item of historyList.value) {
    try {
      const detail = await dramaStore.fetchDramaById(item.dramaId)
      historyDetails.value.push({ ...item, detail })
    } catch {
      historyDetails.value.push({ ...item, detail: { id: item.dramaId } })
    }
  }
}

const removeFavorite = (id) => {
  try {
    const list = favorites.value.filter(x => x !== id)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list))
    favorites.value = list
    favoritesDetails.value = favoritesDetails.value.filter(x => (x.id || x?.detail?.id) !== id)
  } catch {}
}

const removeHistory = (dramaId) => {
  try {
    localStorage.removeItem(HISTORY_PREFIX + dramaId)
    historyList.value = historyList.value.filter(x => x.dramaId !== dramaId)
    historyDetails.value = historyDetails.value.filter(x => x.dramaId !== dramaId)
  } catch {}
}

const formatTime = (ts) => new Date(ts).toLocaleString()
const gotoShort = (id) => { router.push({ path: '/short', query: { id } }) }

onMounted(() => {
  loadFavorites()
  loadHistory()
  // 异步加载详情
  loadFavoriteDetails()
  loadHistoryDetails()
  // 短视频本地数据
  try {
    const favRaw = localStorage.getItem('video_favorites')
    const favIds = favRaw ? JSON.parse(favRaw) : []
    svFavorites.value = favIds.map(id => ({ id, title: `短视频 #${id}`, cover: `https://via.placeholder.com/400x700?text=Video+${id}`, savedAt: Date.now() }))
  } catch { svFavorites.value = [] }
  try {
    const hisRaw = localStorage.getItem('video_watch_history')
    svHistory.value = hisRaw ? JSON.parse(hisRaw) : []
  } catch { svHistory.value = [] }

  // 读取购买记录与NFT
  try {
    const buyRaw = localStorage.getItem('purchase_history')
    purchases.value = buyRaw ? JSON.parse(buyRaw) : []
  } catch { purchases.value = [] }
  try {
    const nftRaw = localStorage.getItem('my_nfts')
    nfts.value = nftRaw ? JSON.parse(nftRaw) : []
  } catch { nfts.value = [] }
})

// 计算属性：过滤/排序
const filteredFavorites = computed(() => {
  let list = [...favoritesDetails.value]
  const q = favSearch.value.trim().toLowerCase()
  if (q) list = list.filter(i => (i.title || '').toLowerCase().includes(q))
  if (favSort.value === 'title') list.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'zh'))
  else if (favSort.value === 'genre') list.sort((a, b) => (a.genre || '').localeCompare(b.genre || '', 'zh'))
  return list
})

const filteredHistory = computed(() => {
  let list = [...historyDetails.value]
  const q = hisSearch.value.trim().toLowerCase()
  if (q) list = list.filter(i => (i.detail?.title || '').toLowerCase().includes(q))
  if (hisSort.value === 'time') list.sort((a, b) => b.savedAt - a.savedAt)
  else if (hisSort.value === 'title') list.sort((a, b) => (a.detail?.title || '').localeCompare(b.detail?.title || '', 'zh'))
  return list
})

// 短视频排序
const svSort = ref('time')
const sortedSvFavorites = computed(() => {
  let list = [...svFavorites.value]
  if (svSort.value === 'time') list.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0))
  else if (svSort.value === 'title') list.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'zh'))
  return list
})
const sortedSvHistory = computed(() => {
  let list = [...svHistory.value]
  if (svSort.value === 'time') list.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0))
  else if (svSort.value === 'title') list.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'zh'))
  return list
})
</script>

<style scoped>
.me-page {
  min-height: 100vh;
  background: #f5f6f8;
}
.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.toolbar-right { display: flex; align-items: center; gap: 10px; }
.label { color: #666; }
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}
.card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  padding: 16px;
  display: flex;
  gap: 12px;
}
.thumb-img { width: 96px; height: 96px; object-fit: cover; border-radius: 8px; }
.meta {
  flex: 1;
}
.title {
  font-weight: 600;
  margin-bottom: 8px;
}
.desc {
  color: #888;
  font-size: 12px;
  margin-bottom: 8px;
}
.actions {
  display: flex;
  gap: 8px;
}
.empty {
  color: #999;
}
</style>
