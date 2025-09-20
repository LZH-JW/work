<template>
  <div class="short-feed">
    <div class="feed-container" ref="feedRef">
      <div
        v-for="(item, idx) in videos"
        :key="item.id"
        class="feed-item"
        :class="{ active: idx === activeIndex }"
      >
        <video
          class="video"
          :src="item.videoUrl"
          :poster="item.cover"
          preload="metadata"
          playsinline
          webkit-playsinline
          muted
          loop
          ref="setVideoRef"
        />
        <div class="overlay">
          <div class="meta">
            <div class="title">{{ item.title }}</div>
            <div class="tags">#{{ item.tags }} · {{ item.duration }}s</div>
          </div>
          <div class="actions">
            <a-button shape="circle" @click="togglePlay(idx)">
              {{ playingIndex === idx ? '⏸' : '▶' }}
            </a-button>
            <a-button shape="circle" @click="toggleMute(idx)">
              {{ muted ? '🔇' : '🔊' }}
            </a-button>
            <a-button shape="circle" type="text" @click="like(idx)">
              <span :style="{ color: item.liked ? '#ff4d4f' : undefined }">❤</span>
              <span class="count">{{ item.likes }}</span>
            </a-button>
            <a-button shape="circle" type="text" @click="toggleFavorite(idx)">
              {{ isFavorited(item.id) ? '★' : '☆' }}
            </a-button>
            <a-button shape="circle" type="text" @click="share(item)">↗</a-button>
          </div>
          <!-- 进度条 -->
          <div class="progress" :style="{ '--buffer': bufferProgress }">
            <div class="bar" :style="{ width: (currentProgress * 100) + '%' }"></div>
          </div>
          <div v-if="videoLoading" class="loading-hint">缓冲中...</div>
        </div>
      </div>
      <div ref="loadMoreRef" class="load-more"></div>
      <div class="status" v-if="loadingMore">加载中...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useVideoStore } from '@/stores/video'
import { mockAPI, MOCK_MODE } from '@/api/mock'
import { message } from 'ant-design-vue'

const videos = ref([])
const page = ref(1)
const pageSize = ref(6)
const loadingMore = ref(false)
const muted = ref(true)
const activeIndex = ref(0)
const playingIndex = ref(-1)

const videoEls = []
const setVideoRef = (el) => { if (el) videoEls.push(el) }

// 进度条 / 缓冲
const currentProgress = ref(0) // 0~1
const bufferProgress = ref(0)  // 0~1
const currentDuration = ref(0)
const videoLoading = ref(false)
const retryMap = {}

const isFavorited = (id) => videoStore.isFavorited(id)
const upsertHistory = (item, progress = 0) => {
  videoStore.upsertHistory({ id: item.id, title: item.title, cover: item.cover, progress })
}

const fetchMore = async () => {
  if (loadingMore.value) return
  loadingMore.value = true
  try {
    if (MOCK_MODE) {
      const resp = await mockAPI.getShortVideos({ page: page.value, pageSize: pageSize.value })
      if (resp.success) {
        videos.value.push(...resp.data.videos)
        page.value += 1
      }
    } else {
      // TODO: 真实接口
    }
  } catch (e) {
    message.error('加载失败')
  } finally {
    loadingMore.value = false
  }
}

const like = async (idx) => {
  const item = videos.value[idx]
  try {
    const next = !item.liked
    if (MOCK_MODE) {
      const resp = await mockAPI.likeShortVideo(item.id, next, item.likes)
      if (resp.success) {
        item.liked = resp.data.liked
        item.likes = resp.data.likes
      }
    } else {
      item.liked = next
      item.likes += next ? 1 : -1
    }
  } catch { message.error('操作失败') }
}

const toggleFavorite = async (idx) => {
  const item = videos.value[idx]
  try {
    const exists = videoStore.isFavorited(item.id)
    if (MOCK_MODE) await mockAPI.toggleShortFavorite(item.id, !exists)
    videoStore.toggleFavorite(item.id)
    message.success(exists ? '已取消收藏' : '已收藏')
  } catch { message.error('操作失败') }
}

const share = (item) => {
  if (navigator.share) {
    navigator.share({ title: item.title, text: '快来看这个短视频！', url: window.location.href })
  } else {
    navigator.clipboard.writeText(window.location.href)
    message.success('链接已复制到剪贴板')
  }
}

const togglePlay = (idx) => {
  const el = videoEls[idx]
  if (!el) return
  if (playingIndex.value === idx) {
    el.pause()
    // 保存进度
    upsertHistory(videos.value[idx], Math.floor(el.currentTime || 0))
    playingIndex.value = -1
  } else {
    el.play().catch(() => {})
    playingIndex.value = idx
    // 开始播放时写入历史
    upsertHistory(videos.value[idx], Math.floor(el.currentTime || 0))
  }
}

const toggleMute = (idx) => {
  muted.value = !muted.value
  const el = videoEls[idx]
  if (el) el.muted = muted.value
}

let feedObserver, activeObserver
const loadMoreRef = ref(null)
const feedRef = ref(null)
const route = useRoute()
const videoStore = useVideoStore()

onMounted(async () => {
  await fetchMore()
  await nextTick()
  // 如果通过 URL 提供了 id，则定位到对应视频
  const targetId = Number(route.query.id || 0)
  if (targetId) {
    const idx = videos.value.findIndex(v => v.id === targetId)
    if (idx >= 0 && feedRef.value) {
      feedRef.value.scrollTo({ top: idx * window.innerHeight, behavior: 'auto' })
      // 尝试自动播放
      const el = videoEls[idx]
      if (el) {
        el.muted = muted.value
        el.play().then(() => { playingIndex.value = idx }).catch(() => {})
      }
    }
  }
  // 观察触底加载
  feedObserver = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) fetchMore() })
  })
  if (loadMoreRef.value) feedObserver.observe(loadMoreRef.value)

  // 观察激活项，自动播放/暂停
  activeObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const el = entry.target
      const idx = videoEls.indexOf(el)
      if (idx === -1) return
      if (entry.isIntersecting) {
        activeIndex.value = idx
        el.muted = muted.value
        el.play().then(() => { playingIndex.value = idx }).catch(() => {})
        // 激活时记录历史
        upsertHistory(videos.value[idx], Math.floor(el.currentTime || 0))
        // 绑定缓冲与网络事件
        el.addEventListener('progress', () => {
          try {
            if (el.buffered && el.buffered.length) {
              const end = el.buffered.end(el.buffered.length - 1)
              bufferProgress.value = currentDuration.value ? Math.min(1, end / currentDuration.value) : 0
            }
          } catch {}
        })
        el.addEventListener('waiting', () => { if (videoEls.indexOf(el) === activeIndex.value) videoLoading.value = true })
        el.addEventListener('playing', () => { if (videoEls.indexOf(el) === activeIndex.value) videoLoading.value = false })
        el.addEventListener('error', () => {
          const vid = videos.value[idx]
          const key = vid?.id || idx
          retryMap[key] = (retryMap[key] || 0) + 1
          if (retryMap[key] <= 3) {
            // 尝试重载并播放
            const curTime = el.currentTime || 0
            el.load()
            el.currentTime = curTime
            el.play().catch(() => {})
            message.warning(`网络波动，重试第 ${retryMap[key]} 次`)
          } else {
            message.error('视频播放失败，请检查网络')
          }
        })
      } else {
        el.pause()
        if (playingIndex.value === idx) playingIndex.value = -1
        // 离开视口时记录进度
        upsertHistory(videos.value[idx], Math.floor(el.currentTime || 0))
      }
    })
  }, { threshold: 0.6 })

  // 绑定每个 video
  videoEls.forEach(v => {
    activeObserver.observe(v)
    v.addEventListener('timeupdate', () => {
      if (videoEls.indexOf(v) === activeIndex.value) {
        currentDuration.value = v.duration || 0
        currentProgress.value = currentDuration.value ? (v.currentTime / currentDuration.value) : 0
      }
    })
  })
})

onBeforeUnmount(() => {
  if (feedObserver && loadMoreRef.value) feedObserver.unobserve(loadMoreRef.value)
  if (activeObserver) videoEls.forEach(v => activeObserver.unobserve(v))
})
</script>

<style scoped>
.short-feed {
  background: #000;
  height: 100vh;
  overflow: hidden;
}
.feed-container {
  position: relative;
  height: 100vh;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
}
.feed-item {
  position: relative;
  height: 100vh;
  scroll-snap-align: start;
  display: flex;
  align-items: center;
  justify-content: center;
}
.video {
  width: 100vw;
  height: 100vh;
  object-fit: cover;
}
.overlay {
  position: absolute;
  bottom: 24px;
  left: 16px;
  right: 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  color: #fff;
}
.meta .title { font-size: 18px; font-weight: 600; margin-bottom: 6px; }
.meta .tags { opacity: .8; font-size: 12px; }
.actions { display: flex; gap: 8px; align-items: center; }
.actions .count { margin-left: 4px; }
.load-more { height: 1px; }
.status { position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); color: #999; }

/* 进度条样式增强 */
.progress {
  position: absolute;
  bottom: -6px;
  left: 16px;
  right: 16px;
  height: 4px;
  background: rgba(255,255,255,0.2);
  border-radius: 4px;
  overflow: hidden;
}
.progress::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: calc(var(--buffer, 0) * 100%);
  background: rgba(255,255,255,0.35);
}
.bar {
  position: absolute;
  top: 0; left: 0; height: 100%;
  background: linear-gradient(90deg, #1890ff, #722ed1);
  border-radius: 4px;
  transition: width .1s linear;
}
</style>
