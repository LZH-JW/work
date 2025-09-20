<template>
  <div class="drama-detail">
    <div v-if="loading" class="loading-container">
      <a-spin size="large" />
    </div>

    <div v-else-if="drama" class="drama-content">
      <!-- Hero Section -->
      <div class="hero-section">
        <div class="hero-background">
          <img :src="drama.coverImage" :alt="drama.title" />
          <div class="hero-overlay"></div>
        </div>
        <div class="hero-content">
          <div class="drama-info">
            <h1>{{ drama.title }}</h1>
            <p class="description">{{ drama.description }}</p>
            <div class="meta-info">
              <a-tag color="blue">{{ drama.genre }}</a-tag>
              <span class="duration">{{ drama.duration }}分钟</span>
              <span class="rating">
                <StarFilled />
                {{ drama.rating }}
              </span>
            </div>
            <div class="stats">
              <span><EyeOutlined /> {{ formatNumber(drama.views) }}观看</span>
              <span><HeartOutlined /> {{ formatNumber(drama.likes) }}点赞</span>
            </div>
            <div class="actions">
              <a-button
                type="primary"
                size="large"
                @click="playFirstEpisode"
              >
                <PlayCircleOutlined />
                播放第1集
              </a-button>
              <a-button size="large" @click="likeDrama" :loading="liking">
                <HeartOutlined :style="{ color: liked ? '#ff4d4f' : undefined }" />
                {{ liked ? '已点赞' : '点赞' }}
              </a-button>
              <a-button size="large" @click="toggleFavorite" :type="favorited ? 'primary' : 'default'">
                {{ favorited ? '已收藏' : '收藏' }}
              </a-button>
              <a-button size="large" @click="shareDrama">
                <ShareAltOutlined />
                分享
              </a-button>
              <div class="inline-actions">
                <span class="rate-label">我的评分：</span>
                <a-rate v-model:value="userRating" allow-half />
                <a-button size="small" type="primary" :loading="ratingSubmitting" @click="submitRating" style="margin-left:8px;">提交评分</a-button>
                <a-button size="small" danger style="margin-left:12px;" @click="openReport">举报</a-button>
              </div>
            </div>
          </div>
        </div>
      </div>


      <!-- Drama Details -->
      <div class="details-section">
        <a-row :gutter="24">
          <a-col :span="16">
            <!-- Episode Player with Teaser -->
            <a-card title="分集播放" class="script-card">
              <div class="player">
                <video
                  ref="playerRef"
                  class="ep-video"
                  :src="playingSrc"
                  controls
                  playsinline
                  webkit-playsinline
                  @timeupdate="onTimeUpdate"
                  @loadedmetadata="onLoadedMeta"
                  @ended="playNextEpisode"
                />
                <div v-if="!currentEpAccessible && playingSrc" class="teaser-tip">
                  当前为试看模式（{{ teaserSeconds }}s），剩余 {{ remainingSeconds }}s，解锁后可完整观看。
                </div>
                <!-- 试看圆环倒计时 -->
                <div v-if="!currentEpAccessible && playingSrc" class="teaser-ring">
                  <div class="ring" :style="{ background: `conic-gradient(#1890ff ${Math.round(teaserPercent*360)}deg, rgba(255,255,255,0.2) 0deg)` }">
                    <span>{{ remainingSeconds }}s</span>
                  </div>
                </div>
                <!-- 倍速控制 -->
                <div class="speed-control">
                  <a-segmented v-model:value="playbackRate" :options="[0.75,1,1.25,1.5]" @change="applyPlaybackRate" />
                </div>
                <div class="next-ep" v-if="episodes && selectedEpisode && episodes.findIndex(e=>e.ep===selectedEpisode)<episodes.length-1">
                  <a-button size="small" @click="playNextEpisode">下一集 ▶</a-button>
                </div>
              </div>
            </a-card>
            <!-- Script Content -->
            <a-card :title="selectedEpisode ? `剧本内容 · 当前播放：第${selectedEpisode}集` : '剧本内容'" class="script-card">
              <div class="script-content">
                <pre>{{ drama.scriptContent }}</pre>
              </div>
            </a-card>

            <!-- Comments Section -->
            <a-card title="评论" class="comments-card">
              <div class="comment-toolbar">
                <span class="label">排序：</span>
                <a-select v-model:value="commentSort" style="width: 160px">
                  <a-select-option value="newest">最新</a-select-option>
                  <a-select-option value="top">最赞</a-select-option>
                </a-select>
              </div>
              <div class="comment-form">
                <a-textarea
                  v-model:value="newComment"
                  placeholder="写下你的评论..."
                  :rows="3"
                />
                <div class="comment-actions">
                  <a-button type="primary" @click="submitComment" :loading="submittingComment">
                    发表评论
                  </a-button>
                </div>
              </div>

              <div class="comments-list">
                <div v-for="comment in sortedComments" :key="comment.id" class="comment-item">
                  <a-avatar :src="comment.user.avatar">
                    {{ comment.user.username.charAt(0) }}
                  </a-avatar>
                  <div class="comment-content">
                    <div class="comment-header">
                      <span class="username">{{ comment.user.username }}</span>
                      <span class="time">{{ formatTime(comment.createdAt) }}</span>
                    </div>
                    <p>{{ comment.content }}</p>
                    <div class="comment-actions-inline">
                      <a-button size="small" type="text" @click="toggleCommentLike(comment)">
                        <HeartOutlined :style="{ color: comment.liked ? '#ff4d4f' : undefined }" />
                        {{ comment.likes || 0 }}
                      </a-button>
                      <a-button size="small" type="text" @click="openReply(comment)">回复</a-button>
                      <a-button size="small" type="text" danger @click="openCommentReport(comment)">举报</a-button>
                    </div>
                    <!-- 回复输入框 -->
                    <div v-if="replyTargetId === comment.id" class="reply-box">
                      <a-textarea
                        v-model:value="replyContent"
                        :maxlength="maxReplyLen"
                        show-count
                        :rows="3"
                        placeholder="回复内容（最多200字）"
                      />
                      <div class="reply-actions">
                        <a-button size="small" type="primary" :loading="replying" @click="submitReply(comment)">提交回复</a-button>
                        <a-button size="small" style="margin-left:8px;" @click="cancelReply">取消</a-button>
                      </div>
                    </div>
                    <!-- 子回复列表 -->
                    <div v-if="comment.replies && comment.replies.length" class="replies">
                      <div v-for="rep in comment.replies" :key="rep.id" class="reply-item">
                        <div class="reply-header">
                          <span class="username">{{ rep.user.username }}</span>
                          <span class="time">{{ formatTime(rep.createdAt) }}</span>
                        </div>
                        <p>{{ rep.content }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </a-card>

            <a-card v-if="lastTxHash || lastTokenId" title="最近交易回执" class="season-card" style="margin-top: 16px;">
              <div v-if="lastTxHash" class="tx-row">
                <span>分账交易：</span>
                <a :href="`https://sepolia.etherscan.io/tx/${lastTxHash}`" target="_blank">{{ lastTxHash }}</a>
              </div>
              <div v-if="lastTokenId" class="tx-row">
                <span>NFT 铸造 TokenID：</span>
                <b>#{{ lastTokenId }}</b>
              </div>
            </a-card>
          </a-col>
          <a-col :span="8">
            <!-- Creator Info -->
            <a-card title="创作者" class="creator-card">
              <div class="creator-info">
                <a-avatar :src="creator?.avatar">{{ creator?.username?.charAt(0) }}</a-avatar>
                <div class="creator-details">
                  <h4>{{ creator?.username }}</h4>
                  <p>作品数：{{ creator?.createdDramas }}</p>
                  <p>累计分成：{{ creator?.totalEarnings }} ETH</p>
                </div>
              </div>
            </a-card>

            <!-- Season & Monetization -->
            <a-card title="连载与付费" class="season-card" style="margin-top: 16px;">
              <div v-if="loadingSeason" style="text-align:center; padding:16px;"><a-spin /></div>
              <div v-else>
                <div class="season-header">
                  <div>整季价格：<b>{{ seasonPrice }}￥</b></div>
                  <div>
                    <a-tag v-if="seasonPurchased || membershipActive" color="green">整季已解锁</a-tag>
                    <a-button v-else type="primary" size="small" @click="buySeason" :loading="buyingSeason">购买整季</a-button>
                  </div>
                </div>
                <div class="membership">
                  <a-tag v-if="membershipActive" color="blue">会员有效</a-tag>
                  <a-button v-else size="small" @click="buyMembership" :loading="buyingMembership">开通会员</a-button>
                </div>
                <div class="episodes-list">
                  <div
                    v-for="ep in episodes"
                    :key="ep.ep"
                    class="episode-row"
                  >
                    <div class="ep-title">
                      <span>第{{ ep.ep }}集</span>
                      <small class="ep-name">{{ ep.title }}</small>
                      <a-tag v-if="ep.isFree" color="default">免费</a-tag>
                      <a-tag v-else-if="canAccessEpisode(ep.ep)" color="green">已解锁</a-tag>
                      <a-tag v-else color="red">锁</a-tag>
                    </div>
                    <div class="ep-actions">
                      <a-button size="small" type="primary" @click="playEpisode(ep)" :disabled="!canAccessEpisode(ep.ep)">播放</a-button>
                      <a-button size="small" @click="buyEpisode(ep)" v-if="!ep.isFree && !canAccessEpisode(ep.ep)" :loading="buyingEpisodeId===ep.ep">购买 ￥{{ ep.price }}</a-button>
                    </div>
                  </div>
                </div>
              </div>
            </a-card>
          </a-col>
        </a-row>
      </div>
      <!-- 支付引导弹窗 -->
      <a-modal v-model:open="payPromptVisible" title="解锁本集" :footer="null">
        <p>当前为试看，继续观看需要解锁。</p>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <a-button type="primary" :loading="buyingEpisodeId===selectedEpisode" @click="buyEpisode({ ep: selectedEpisode, price: 1.0 })">购买本集 ￥1.0</a-button>
          <a-button :loading="buyingSeason" @click="buySeason">购买整季 ￥{{ seasonPrice }}</a-button>
          <a-button :loading="buyingMembership" @click="buyMembership">开通会员</a-button>
        </div>
      </a-modal>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { useDramaStore } from '@/stores/drama'
import { useUserStore } from '@/stores/user'
import axios from 'axios'
import { mockAPI, MOCK_MODE } from '@/api/mock'
import {
  PlayCircleOutlined,
  HeartOutlined,
  ShareAltOutlined,
  EyeOutlined,
  StarFilled
} from '@ant-design/icons-vue'

const route = useRoute()
const dramaStore = useDramaStore()
const userStore = useUserStore()

const loading = ref(true)
const drama = ref(null)
const creator = ref(null)
const comments = ref([])
const relatedDramas = ref([])
const newComment = ref('')
const submittingComment = ref(false)
const liked = ref(false)
const liking = ref(false)
const favorited = ref(false)
// 评分与举报
const userRating = ref(0)
const ratingSubmitting = ref(false)
const reportVisible = ref(false)
const reportReason = ref('')
const reportDetail = ref('')
const reportSubmitting = ref(false)
const isFollowing = ref(false)
const following = ref(false)

// 评论回复
const replyTargetId = ref(null)
const replyContent = ref('')
const maxReplyLen = 200
const replying = ref(false)

// 已移除交互剧情相关逻辑

// Season & Monetization
const episodes = ref([])
const seasonPrice = ref(0)
const selectedEpisode = ref(null)
const purchasedEpisodes = ref([])
const seasonPurchased = ref(false)
const membershipActive = ref(false)
const loadingSeason = ref(true)
const buyingSeason = ref(false)
const buyingMembership = ref(false)
const buyingEpisodeId = ref(null)

const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

const formatTime = (time) => {
  return new Date(time).toLocaleString()
}

// Player state (teaser)
const playerRef = ref(null)
const teaserSeconds = 15
const playingSrc = ref('')
const currentEpAccessible = ref(true)
const payPromptVisible = ref(false)
const remainingSeconds = ref(15)
const lastTxHash = ref('')
const lastTokenId = ref(null)
const playbackRate = ref(1)
const teaserPercent = computed(() => {
  if (currentEpAccessible.value) return 1
  const used = teaserSeconds - (remainingSeconds.value || 0)
  return Math.max(0, Math.min(1, used / teaserSeconds))
})

// Purchase/NFT local records
const PURCHASE_HISTORY_KEY = 'purchase_history'
const NFT_COLLECTION_KEY = 'my_nfts'
const addPurchaseHistory = (rec) => {
  try {
    const raw = localStorage.getItem(PURCHASE_HISTORY_KEY)
    const list = raw ? JSON.parse(raw) : []
    list.unshift({ ...rec, time: Date.now() })
    localStorage.setItem(PURCHASE_HISTORY_KEY, JSON.stringify(list.slice(0, 500)))
  } catch {}
}
const addNFTCollection = (rec) => {
  try {
    const raw = localStorage.getItem(NFT_COLLECTION_KEY)
    const list = raw ? JSON.parse(raw) : []
    list.unshift({ ...rec, time: Date.now() })
    localStorage.setItem(NFT_COLLECTION_KEY, JSON.stringify(list.slice(0, 500)))
  } catch {}
}

const ensurePlay = () => {
  const el = playerRef.value
  if (!el) return
  el.playbackRate = playbackRate.value
  el.play().catch(() => {})
}

const onLoadedMeta = () => {
  // reset to start on new episode
  const el = playerRef.value
  if (!el) return
  el.currentTime = 0
  remainingSeconds.value = teaserSeconds
  if (playerRef.value) playerRef.value.playbackRate = playbackRate.value
  ensurePlay()
}

const onTimeUpdate = () => {
  const el = playerRef.value
  if (!el) return
  if (!currentEpAccessible.value) {
    const left = Math.max(0, Math.ceil(teaserSeconds - el.currentTime))
    remainingSeconds.value = left
  }
  if (!currentEpAccessible.value && el.currentTime >= teaserSeconds) {
    el.pause()
    payPromptVisible.value = true
  }
}

// 倍速切换
const applyPlaybackRate = () => {
  const el = playerRef.value
  if (el) el.playbackRate = Number(playbackRate.value) || 1
}

const likeDrama = async () => {
  liking.value = true
  try {
    if (MOCK_MODE) {
      const next = !liked.value
      const resp = await mockAPI.likeDrama(drama.value.id, next)
      if (resp.success) {
        liked.value = next
        drama.value.likes += liked.value ? 1 : -1
        message.success(liked.value ? '点赞成功' : '取消点赞')
      }
    } else {
      await axios.post(`/api/dramas/${drama.value.id}/like`)
      liked.value = !liked.value
      drama.value.likes += liked.value ? 1 : -1
      message.success(liked.value ? '点赞成功' : '取消点赞')
    }
  } catch (error) {
    // 降级为本地操作，保证观众端流程可用
    liked.value = !liked.value
    drama.value.likes += liked.value ? 1 : -1
    message.warning('网络异常，已为你本地更新点赞状态')
  } finally {
    liking.value = false
  }
}

const toggleFavorite = async () => {
  try {
    const next = !favorited.value
    if (MOCK_MODE) {
      const resp = await mockAPI.toggleFavorite(drama.value.id, next)
      if (!resp.success) return
    }
    favorited.value = next
    persistFavorite()
    message.success(favorited.value ? '已收藏' : '已取消收藏')
  } catch {
    message.error('操作失败')
  }
}

const FAVORITES_KEY = 'favorite_dramas'
const loadFavorites = () => {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}
const persistFavorite = () => {
  try {
    const list = loadFavorites()
    const id = Number(drama.value.id)
    const exists = list.includes(id)
    let next = list
    if (favorited.value && !exists) next = [...list, id]
    if (!favorited.value && exists) next = list.filter(x => x !== id)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
  } catch {}
}
const initFavorite = () => {
  const list = loadFavorites()
  favorited.value = list.includes(Number(drama.value?.id))
}

const shareDrama = () => {
  if (navigator.share) {
    navigator.share({
      title: drama.value.title,
      text: drama.value.description,
      url: window.location.href
    })
  } else {
    navigator.clipboard.writeText(window.location.href)
    message.success('链接已复制到剪贴板')
  }
}

const submitComment = async () => {
  if (!newComment.value.trim()) {
    message.warning('请输入评论内容')
    return
  }
  
  submittingComment.value = true
  try {
    // Mock comment submission
    const comment = {
      id: Date.now(),
      content: newComment.value,
      user: userStore.user,
      createdAt: new Date()
    }
    comments.value.unshift(comment)
    newComment.value = ''
    message.success('评论发表成功')
  } catch (error) {
    message.error('评论发表失败')
  } finally {
    submittingComment.value = false
  }
}

const followCreator = async () => {
  following.value = true
  try {
    // Mock follow action
    isFollowing.value = !isFollowing.value
    message.success(isFollowing.value ? '关注成功' : '取消关注')
  } catch (error) {
    message.error('操作失败')
  } finally {
    following.value = false
  }
}

const viewBlockchainDetails = () => {
  // Open blockchain explorer or show detailed modal
  window.open(`https://sepolia.etherscan.io/tx/${drama.value.blockchainHash}`, '_blank')
}

const canAccessEpisode = (episode) => {
  return purchasedEpisodes.value.includes(episode) || seasonPurchased.value || membershipActive.value
}

const playEpisode = (ep) => {
  selectedEpisode.value = ep.ep
  // 优先使用分集配置中的视频URL
  if (ep.videoUrl) {
    playingSrc.value = ep.videoUrl
  } else {
    // 回退至示例片源
    playingSrc.value = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
  }
  currentEpAccessible.value = canAccessEpisode(ep.ep)
  if (!currentEpAccessible.value) {
    message.info('已进入试看模式')
  } else {
    message.success(`正在播放第${ep.ep}集`)
  }
  // 自动播放
  setTimeout(() => ensurePlay(), 0)
}

// 自动连播
const playNextEpisode = () => {
  if (!episodes.value || !episodes.value.length) return
  const idx = episodes.value.findIndex(e => e.ep === selectedEpisode.value)
  if (idx >= 0 && idx < episodes.value.length - 1) {
    playEpisode(episodes.value[idx + 1])
  }
}

// 播放第1集（红果短剧风格 CTA）
const playFirstEpisode = () => {
  if (episodes.value && episodes.value.length) {
    const first = episodes.value.find(e => e.ep === 1) || episodes.value[0]
    playEpisode(first)
  } else {
    // 无连载信息则直接播放示例资源
    selectedEpisode.value = 1
    playingSrc.value = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
    currentEpAccessible.value = true
    setTimeout(() => ensurePlay(), 0)
  }
}

const buyEpisode = async (episode) => {
  try {
    buyingEpisodeId.value = episode.ep
    if (MOCK_MODE) {
      const resp = await mockAPI.purchaseEpisode(drama.value.id, episode.ep)
      if (resp.success) {
        if (!purchasedEpisodes.value.includes(episode.ep)) purchasedEpisodes.value.push(episode.ep)
        savePurchases(drama.value.id)
        message.success(`已解锁第${episode.ep}集`)
        // 模拟链上分账
        const settle = await mockAPI.settleRevenue(drama.value.id, episode.price || 1.0)
        if (settle.success) {
          lastTxHash.value = settle.data.txHash
          message.success(`分账上链成功：${settle.data.txHash}`)
        }
        addPurchaseHistory({ dramaId: Number(drama.value.id), ep: episode.ep, price: episode.price || 1.0, txHash: lastTxHash.value })
        currentEpAccessible.value = true
        payPromptVisible.value = false
        ensurePlay()
      }
    } else {
      // TODO: 接入真实支付
      if (!purchasedEpisodes.value.includes(episode.ep)) purchasedEpisodes.value.push(episode.ep)
      savePurchases(drama.value.id)
      message.success(`已解锁第${episode.ep}集`)
      currentEpAccessible.value = true
      payPromptVisible.value = false
      ensurePlay()
    }
  } catch (e) {
    message.error('购买失败')
  } finally {
    buyingEpisodeId.value = null
  }
}

const buySeason = async () => {
  buyingSeason.value = true
  try {
    if (MOCK_MODE) {
      const resp = await mockAPI.purchaseSeason(drama.value.id)
      if (resp.success) {
        seasonPurchased.value = true
        savePurchases(drama.value.id)
        message.success('整季已解锁')
        const settle = await mockAPI.settleRevenue(drama.value.id, seasonPrice.value || 0)
        if (settle.success) {
          lastTxHash.value = settle.data.txHash
          message.success(`分账上链成功：${settle.data.txHash}`)
        }
        // 可选：赠送季票NFT
        const nft = await mockAPI.mintEndingNFT(drama.value.id, 'season-pass')
        if (nft.success) {
          lastTokenId.value = nft.data.tokenId
          message.success(`已铸造季票NFT #${nft.data.tokenId}`)
          addNFTCollection({ dramaId: Number(drama.value.id), tokenId: lastTokenId.value, note: 'season-pass' })
        }
        addPurchaseHistory({ dramaId: Number(drama.value.id), season: true, price: seasonPrice.value || 0, txHash: lastTxHash.value })
        currentEpAccessible.value = true
        payPromptVisible.value = false
        ensurePlay()
      }
    } else {
      seasonPurchased.value = true
      savePurchases(drama.value.id)
      message.success('整季已解锁')
    }
  } catch (error) {
    message.error('购买失败')
  } finally {
    buyingSeason.value = false
  }
}

const buyMembership = async () => {
  buyingMembership.value = true
  try {
    if (MOCK_MODE) {
      const resp = await mockAPI.purchaseMembership('SEASON')
      if (resp.success) {
        membershipActive.value = true
        message.success('已开通会员')
        currentEpAccessible.value = true
        payPromptVisible.value = false
        ensurePlay()
      }
    } else {
      // TODO: 接入真实会员支付
      membershipActive.value = true
      message.success('已开通会员')
      currentEpAccessible.value = true
      payPromptVisible.value = false
      ensurePlay()
    }
  } catch (error) {
    message.error('购买失败')
  } finally {
    buyingMembership.value = false
  }
}

const loadPurchases = (dramaId) => {
  try {
    const raw = localStorage.getItem(`purchases_${dramaId}`)
    if (!raw) return
    const data = JSON.parse(raw)
    purchasedEpisodes.value = data.purchasedEpisodes
    seasonPurchased.value = data.seasonPurchased
  } catch {}
}

const savePurchases = (dramaId) => {
  try {
    const data = {
      purchasedEpisodes: purchasedEpisodes.value,
      seasonPurchased: seasonPurchased.value
    }
    localStorage.setItem(`purchases_${dramaId}`, JSON.stringify(data))
  } catch {}
}

onMounted(async () => {
  const dramaId = route.params.id
  try {
    drama.value = await dramaStore.fetchDramaById(dramaId)
    
    // Mock creator and related data
    creator.value = {
      username: 'CreatorUser',
      avatar: '',
      createdDramas: 5,
      totalEarnings: 2.5
    }
    
    comments.value = [
      {
        id: 1,
        content: '这个短剧太精彩了！',
        user: { username: 'User1', avatar: '' },
        createdAt: new Date(),
        likes: 3,
        liked: false,
        replies: []
      }
    ]
    
    if (MOCK_MODE) {
      // 连载信息与会员
      try {
        const s = await mockAPI.getSeason(dramaId)
        if (s.success) {
          episodes.value = s.data.episodes
          seasonPrice.value = s.data.seasonPrice
        }
        const ms = await mockAPI.getMembership()
        if (ms.success) membershipActive.value = !!ms.data.active
        loadPurchases(Number(dramaId))
      } finally {
        loadingSeason.value = false
      }
    } else {
      // fallback 静态示例
      relatedDramas.value = [
        { id: 2, title: '相关短剧1', coverImage: 'https://via.placeholder.com/100x60', views: 1000 }
      ]
    }
  } catch (error) {
    message.error('加载短剧失败')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.drama-detail {
  min-height: 100vh;
  background: #000;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.hero-section {
  position: relative;
  height: 60vh;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.hero-background img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%);
}

.hero-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 5%;
}

.drama-info {
  max-width: 600px;
  color: white;
}

.drama-info h1 {
  font-size: 48px;
  margin-bottom: 16px;
  color: white;
}

.description {
  font-size: 18px;
  margin-bottom: 16px;
  opacity: 0.9;
}

.meta-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.duration, .rating {
  color: white;
  opacity: 0.8;
}

.stats {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  color: white;
  opacity: 0.8;
}

.stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.actions {
  display: flex;
  gap: 12px;
}

.narrative-player {
  margin: 24px 5%;
}

.narrative-card {
  background: #1a1a1a;
  border: none;
}

.narrative-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.narrative-header h3 {
  color: white;
  margin: 0;
}

.narrative-controls {
  display: flex;
  gap: 8px;
}

.narrative-content {
  color: white;
}

.scene-content {
  background: #2a2a2a;
  padding: 24px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.scene-content p {
  font-size: 16px;
  line-height: 1.6;
  margin: 0;
}

.choices h4 {
  color: white;
  margin-bottom: 16px;
}

.choice-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.choice-button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: auto;
  padding: 16px;
  text-align: left;
  background: #333;
  border: 1px solid #555;
  color: white;
}

.choice-button:hover {
  background: #444;
  border-color: #1890ff;
}

.popularity-score {
  font-size: 12px;
  opacity: 0.7;
}

.narrative-progress {
  text-align: center;
  margin-top: 24px;
  color: #999;
}

.details-section {
  background: white;
  padding: 24px 5%;
}

.script-card, .comments-card, .creator-card, .blockchain-card, .season-card {
  margin-top: 16px;
}

/* Player styles */
.player { position: relative; }
.ep-video { width: 100%; border-radius: 8px; background: #000; }
.teaser-tip {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
}
.tx-row { display:flex; align-items:center; gap:6px; margin: 6px 0; }

.season-card .season-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.season-card .membership {
  margin-bottom: 12px;
}

.episodes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 360px;
  overflow: auto;
}

.episode-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.ep-title { display: flex; align-items: center; gap: 8px; }

.ep-title .ep-name { color: #666; }

.script-content pre {
  white-space: pre-wrap;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
}

.comment-form {
  margin-bottom: 24px;
}

.comment-actions {
  margin-top: 12px;
  text-align: right;
}

.comment-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.username {
  font-weight: 500;
}

.time {
  color: #999;
  font-size: 12px;
}

.creator-info {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.creator-details h4 {
  margin: 0 0 8px 0;
}

.creator-details p {
  margin: 4px 0;
  color: #666;
  font-size: 14px;
}

.blockchain-info {
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.label {
  font-weight: 500;
}

.related-item {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.related-item:hover {
  background: #f5f5f5;
}

.related-item img {
  width: 60px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}

.related-info h5 {
  margin: 0 0 4px 0;
  font-size: 14px;
}

.related-info p {
  margin: 0;
  font-size: 12px;
  color: #666;
}
</style>
