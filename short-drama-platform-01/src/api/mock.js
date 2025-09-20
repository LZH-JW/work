// In-memory mock database
const db = {
  dramas: [
    {
      id: 1,
      title: '都市情缘',
      description: '一个关于现代都市爱情的温馨短剧',
      genre: '爱情',
      duration: 15,
      rating: 4.8,
      views: 12500,
      likes: 890,
      coverImage: 'https://via.placeholder.com/300x200?text=都市情缘',
      scriptContent: '第一场：咖啡厅\n男主角走进咖啡厅，看到女主角正在看书...',
      creatorId: 1,
      seasonPrice: 8.0,
      episodes: []
    },
    {
      id: 2,
      title: '古风传奇',
      description: '穿越古代的奇幻冒险故事',
      genre: '奇幻',
      duration: 20,
      rating: 4.6,
      views: 8900,
      likes: 567,
      coverImage: 'https://via.placeholder.com/300x200?text=古风传奇',
      scriptContent: '第一场：皇宫大殿\n皇帝召见众臣，商议国事...',
      creatorId: 1,
      seasonPrice: 8.0,
      episodes: []
    }
  ],
  nextId: 1000
}

// In-memory video generation tasks
const genTasks = { nextId: 1, items: {} }
const genQuota = { dailyLimit: 20, usedToday: 0, resetAt: Date.now() + 24*3600*1000 }

// Mock API responses for testing without backend
export const mockAPI = {
  // User authentication
  login: async (credentials) => {
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate network delay
    
    if (credentials.email === 'admin@drama.com' && credentials.password === '123456') {
      return {
        success: true,
        data: {
          token: 'mock-jwt-token-' + Date.now(),
          user: {
            id: 1,
            username: 'admin',
            email: 'admin@drama.com',
            avatar: '',
            role: 'ADMIN',
            earnings: 2.5
          }
        },
        message: '登录成功'
      }
    }
    
    return {
      success: false,
      message: '用户名或密码错误'
    }
  },

  register: async (userData) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return {
      success: true,
      data: {
        token: 'mock-jwt-token-' + Date.now(),
        user: {
          id: Date.now(),
          username: userData.username,
          email: userData.email,
          avatar: '',
          role: 'USER',
          earnings: 0
        }
      },
      message: '注册成功'
    }
  },

  // Drama management
  getDramas: async (params = {}) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    const list = db.dramas.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    return {
      success: true,
      data: {
        dramas: list,
        total: list.length,
        page: params.page || 1,
        pageSize: params.pageSize || 10
      }
    }
  },

  updateDrama: async (id, dramaData) => {
    await new Promise(resolve => setTimeout(resolve, 600))
    return {
      success: true,
      data: {
        id,
        ...dramaData,
      },
      message: '短剧更新成功'
    }
  },

  deleteDrama: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 400))
    return {
      success: true,
      message: '删除成功'
    }
  },

  getDramaById: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const drama = db.dramas.find(d => d.id === Number(id))
    if (!drama) {
      return { success: false, message: 'Not found' }
    }
    return { success: true, data: drama }
  },

  createDrama: async (dramaData) => {
    await new Promise(resolve => setTimeout(resolve, 600))
    const id = db.nextId++
    let episodes = []
    try { episodes = dramaData.episodes ? JSON.parse(dramaData.episodes) : [] } catch {}
    const rec = {
      id,
      title: dramaData.title,
      description: dramaData.description,
      genre: dramaData.genre,
      duration: dramaData.duration || 10,
      coverImage: dramaData.coverImage || 'https://via.placeholder.com/300x200?text=DRAMA',
      scriptContent: dramaData.scriptContent || '',
      aiGenerated: !!dramaData.aiGenerated,
      seasonPrice: typeof dramaData.seasonPrice === 'number' ? dramaData.seasonPrice : 8.0,
      episodes,
      views: 0,
      likes: 0,
      rating: 0,
      creatorId: 999,
      createdAt: new Date().toISOString()
    }
    db.dramas.unshift(rec)
    return { success: true, data: rec, message: '短剧创建成功' }
  },

  // AI services
  generateOutline: async (topic, genre) => {
    await new Promise(r => setTimeout(r, 600))
    return { success: true, data: { outline: `【分集大纲·${genre||'通用'}】\n1. 开端：设定与冲突引入\n2. 发展：关系推进与阻碍\n3. 反转：关键事件与抉择\n4. 高潮：冲突爆发与转机\n5. 结局：人物弧光与主题回应` } }
  },
  generateShotlist: async (scenePrompt) => {
    await new Promise(r => setTimeout(r, 700))
    return { success: true, data: { shotlist: `【分镜建议】\n- 远景：交代环境、氛围\n- 中景：人物互动、走位\n- 特写：情绪/关键道具\n- 运动镜头：跟拍/推拉\n- 转场：淡入淡出/定格` } }
  },
  generateAudioHints: async (mood) => {
    await new Promise(r => setTimeout(r, 500))
    return { success: true, data: { hints: `【配乐/音效/字幕】\n- 配乐：${mood||'温暖'} 流行器乐，BPM 90\n- 音效：环境底噪+脚步+翻书\n- 字幕：2行以内，24px，描边` } }
  },
  generateCoverTitle: async (topic, genre) => {
    await new Promise(r => setTimeout(r, 500))
    return { success: true, data: { title: `${topic||'心动瞬间'}`.slice(0,14), coverPrompt: `【封面建议·${genre||'都市'}】高对比主色、人物特写、情绪点元素、清晰大字标题` } }
  },
  generateCharacter: async (description, personality) => {
    await new Promise(resolve => setTimeout(resolve, 1500))
    return {
      success: true,
      data: {
        character: {
          name: 'AI角色',
          description,
          personality,
          background: '来自AI生成的背景设定，富有层次且具备成长空间。'
        }
      }
    }
  },

  generateScene: async (setting, mood, characters) => {
    await new Promise(resolve => setTimeout(resolve, 1500))
    return {
      success: true,
      data: {
        scene: `场景设定：${setting}。\n氛围：${mood}。\n角色：${characters}。\n剧情：在这样的氛围中，角色之间逐渐产生了微妙的变化……`
      }
    }
  },

  chatWithAI: async (message, history = []) => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const responses = [
      '这是一个很有趣的想法！让我帮你进一步完善这个剧情。',
      '根据你的描述，我建议可以在这里增加一些情感冲突，让故事更加引人入胜。',
      '这个角色设定很棒！你可以考虑给他/她添加一些独特的背景故事。',
      '从剧情发展的角度来看，这里可以设置一个转折点，让观众产生更多期待。',
      '你的创意很棒！让我们一起来完善这个故事的细节吧。'
    ]
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)]
    
    return {
      success: true,
      data: {
        response: randomResponse,
        timestamp: Date.now()
      }
    }
  },

  getSuggestions: async (context) => {
    await new Promise(resolve => setTimeout(resolve, 800))
    const suggestions = [
      '尝试加入一个小反转提升悬念',
      '强化主角动机以增强代入感',
      '适当增加配角线让剧情更立体',
      '在高潮前埋下关键伏笔'
    ]
    return {
      success: true,
      data: { suggestions }
    }
  },

  generateScript: async (prompt, genre, characters) => {
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    return {
      success: true,
      data: {
        script: `基于您的要求生成的剧本：

主题：${prompt}
类型：${genre}
主要角色：${characters}

第一场：开场
${characters}出现在一个${genre === '爱情' ? '浪漫的' : '神秘的'}场景中...

第二场：冲突
故事发生了意想不到的转折...

第三场：高潮
${characters}面临着重要的选择...

第四场：结局
故事以一个${genre === '爱情' ? '温馨' : '出人意料'}的结局收尾。

（这是AI生成的示例剧本，实际应用中会根据具体需求生成更详细的内容）`,
        metadata: {
          wordCount: 150,
          estimatedDuration: 12,
          generatedAt: new Date().toISOString()
        }
      }
    }
  },


  // Dashboard data
  getDashboardStats: async () => {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      success: true,
      data: {
        totalDramas: 5,
        totalViews: 25600,
        totalEarnings: 2.5,
        totalLikes: 1890,
        recentDramas: [
          {
            id: 1,
            title: '都市情缘',
            views: 12500,
            createdAt: '2024-01-15'
          },
          {
            id: 2,
            title: '古风传奇',
            views: 8900,
            createdAt: '2024-01-10'
          }
        ],
        viewsChart: [
          { date: '2024-01-01', views: 1200 },
          { date: '2024-01-02', views: 1500 },
          { date: '2024-01-03', views: 1800 },
          { date: '2024-01-04', views: 2100 },
          { date: '2024-01-05', views: 1900 },
          { date: '2024-01-06', views: 2300 },
          { date: '2024-01-07', views: 2600 }
        ]
      }
    }
  }
  ,

  // Narrative (interactive storytelling)
  startNarrative: async (dramaId) => {
    await new Promise(resolve => setTimeout(resolve, 600))
    const sessionId = 'sess-' + Date.now()
    const rootBranchId = 1
    const state = {
      sessionId,
      dramaId: Number(dramaId),
      currentBranchId: rootBranchId,
      currentSceneContent: '开场：主角来到咖啡馆，故事即将开始……',
      isEnding: false,
      totalChoicesMade: 0,
      availableChoices: [
        { branchId: 2, choiceText: '与神秘人搭话', popularityScore: 72.5 },
        { branchId: 3, choiceText: '安静观察周围', popularityScore: 27.5 }
      ]
    }
    return { success: true, data: state }
  },

  makeNarrativeChoice: async ({ sessionId, dramaId, branchId, choiceIndex }) => {
    await new Promise(resolve => setTimeout(resolve, 600))
    // 简单分支逻辑：第一步后进入第二步，第二步后结束
    if (branchId === 1) {
      const nextBranchId = choiceIndex === 0 ? 2 : 3
      const state = {
        sessionId,
        dramaId,
        currentBranchId: nextBranchId,
        currentSceneContent: nextBranchId === 2
          ? '你与神秘人交谈，他似乎知道一些秘密……'
          : '你选择默默观察，注意到角落里可疑的身影……',
        isEnding: false,
        totalChoicesMade: 1,
        availableChoices: [
          { branchId: 4, choiceText: '追随可疑身影', popularityScore: 60.2 },
          { branchId: 5, choiceText: '返回座位继续等待', popularityScore: 39.8 }
        ]
      }
      return { success: true, data: state }
    }
    // 第二步后结束
    const endState = {
      sessionId,
      dramaId,
      currentBranchId: choiceIndex === 0 ? 4 : 5,
      currentSceneContent: choiceIndex === 0
        ? '你追随而去，揭开了事件的真相，故事在紧张中落幕。'
        : '你选择等待，错过了关键线索，但也收获了片刻宁静。',
      isEnding: true,
      totalChoicesMade: 2,
      availableChoices: []
    }
    return { success: true, data: endState }
  },

  resetNarrative: async (sessionId) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { success: true }
  },

  // Audience interactions
  likeDrama: async (dramaId, liked) => {
    await new Promise(resolve => setTimeout(resolve, 200))
    return { success: true, data: { dramaId, liked } }
  },
  toggleFavorite: async (dramaId, favorite) => {
    await new Promise(resolve => setTimeout(resolve, 200))
    return { success: true, data: { dramaId, favorite } }
  },

  // Rating
  rateDrama: async (dramaId, score) => {
    await new Promise(resolve => setTimeout(resolve, 200))
    // 简单模拟：返回新的平均分（随机轻微波动围绕score）与评分人数
    const avg = Math.max(0, Math.min(10, (Number(score) + 8 + Math.random()) / 2))
    const count = Math.floor(100 + Math.random() * 900)
    return { success: true, data: { dramaId, average: Number(avg.toFixed(1)), count } }
  },

  // Report
  reportDrama: async (dramaId, reason, detail) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    // 仅返回成功
    return { success: true }
  },

  // Recommendations
  getRecommendations: async (dramaId) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    // 返回少量推荐（示例）
    const pool = [
      { id: 21, title: '城市夜色', coverImage: 'https://via.placeholder.com/100x60', views: 3200 },
      { id: 22, title: '江湖旧梦', coverImage: 'https://via.placeholder.com/100x60', views: 2100 },
      { id: 23, title: '星际迷航记', coverImage: 'https://via.placeholder.com/100x60', views: 5400 }
    ]
    return { success: true, data: pool }
  },

  // Comment interactions
  likeComment: async (commentId, liked, currentLikes = 0) => {
    await new Promise(resolve => setTimeout(resolve, 150))
    const likes = Math.max(0, currentLikes + (liked ? 1 : -1))
    return { success: true, data: { commentId, liked, likes } }
  },
  reportComment: async (commentId, reason, detail) => {
    await new Promise(resolve => setTimeout(resolve, 200))
    return { success: true }
  },

  // Short video feed
  getShortVideos: async (params = {}) => {
    await new Promise(resolve => setTimeout(resolve, 400))
    const list = Array.from({ length: 12 }).map((_, i) => {
      const id = 100 + i + ((params.page || 1) - 1) * (params.pageSize || 12)
      return {
        id,
        title: `短视频 #${id}`,
        cover: `https://via.placeholder.com/400x700?text=Video+${id}`,
        videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        likes: Math.floor(Math.random() * 5000),
        liked: false,
        tags: ['都市', '情感', '热播'][i % 3],
        duration: Math.floor(30 + Math.random() * 60)
      }
    })
    return { success: true, data: { videos: list, page: params.page || 1, pageSize: params.pageSize || 12 } }
  },
  likeShortVideo: async (videoId, liked, currentLikes = 0) => {
    await new Promise(resolve => setTimeout(resolve, 150))
    const likes = Math.max(0, currentLikes + (liked ? 1 : -1))
    return { success: true, data: { videoId, liked, likes } }
  },
  toggleShortFavorite: async (videoId, favorite) => {
    await new Promise(resolve => setTimeout(resolve, 150))
    return { success: true, data: { videoId, favorite } }
  },

  // Serialized drama monetization (Mock)
  getSeason: async (dramaId) => {
    await new Promise(r => setTimeout(r, 300))
    const drama = db.dramas.find(d => d.id === Number(dramaId))
    if (drama && drama.episodes && drama.episodes.length) {
      return { success: true, data: { dramaId: Number(dramaId), episodes: drama.episodes, seasonPrice: drama.seasonPrice || 8.0 } }
    }
    // fallback：生成示例
    const episodes = Array.from({ length: 12 }).map((_, i) => ({ ep: i + 1, title: `第${i + 1}集·剧情发展`, duration: 120 + Math.floor(Math.random() * 120), isFree: i < 3, price: 1.0 }))
    const seasonPrice = 8.0
    return { success: true, data: { dramaId: Number(dramaId), episodes, seasonPrice } }
  },
  
  // Episode video upload/update (Mock)
  uploadEpisodeVideo: async (dramaId, ep, file) => {
    await new Promise(r => setTimeout(r, 600))
    // 模拟上传并返回可访问的视频URL（此处返回公共示例视频）
    const url = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
    return { success: true, data: { dramaId: Number(dramaId), ep: Number(ep), videoUrl: url } }
  },
  updateEpisodeVideoUrl: async (dramaId, ep, videoUrl) => {
    await new Promise(r => setTimeout(r, 200))
    return { success: true, data: { dramaId: Number(dramaId), ep: Number(ep), videoUrl } }
  },

  // Video generation pipeline (Mock)
  createVideoGenTask: async ({ dramaId, ep, style = 'urban', duration = 60, voice = 'female' }) => {
    await new Promise(r => setTimeout(r, 200))
    if (genQuota.usedToday >= genQuota.dailyLimit) {
      return { success: false, message: '今日生成配额已用尽' }
    }
    const id = genTasks.nextId++
    const taskId = `task_${id}`
    const startAt = Date.now()
    genTasks.items[taskId] = { taskId, dramaId, ep, status: 'PENDING', style, duration, voice, startAt, progress: 0 }
    // Simulate async progress
    setTimeout(() => { const t = genTasks.items[taskId]; if (t) { t.status = 'RUNNING'; t.progress = 10 } }, 400)
    setTimeout(() => { const t = genTasks.items[taskId]; if (t) { t.progress = 55 } }, 2000)
    setTimeout(() => { const t = genTasks.items[taskId]; if (t) { t.progress = 85 } }, 4000)
    setTimeout(() => {
      const t = genTasks.items[taskId]
      if (!t) return
      // 10% fail chance
      if (Math.random() < 0.1) {
        t.status = 'FAILED'
        t.error = '生成失败，请重试'
      } else {
        t.status = 'DONE'
        t.progress = 100
        t.videoUrl = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
        genQuota.usedToday = Math.min(genQuota.dailyLimit, genQuota.usedToday + 1)
        // 回填到db（若存在）
        const drama = db.dramas.find(d => d.id === Number(t.dramaId))
        if (drama) {
          if (!Array.isArray(drama.episodes)) drama.episodes = []
          const idx = drama.episodes.findIndex(e => e.ep === Number(t.ep))
          if (idx >= 0) drama.episodes[idx].videoUrl = t.videoUrl
        }
      }
      t.endAt = Date.now()
    }, 6500)
    return { success: true, data: { taskId } }
  },
  getVideoGenTask: async (taskId) => {
    await new Promise(r => setTimeout(r, 200))
    const t = genTasks.items[taskId]
    if (!t) return { success: false, message: '任务不存在' }
    return { success: true, data: t }
  },
  retryVideoGenTask: async (taskId) => {
    await new Promise(r => setTimeout(r, 200))
    const t = genTasks.items[taskId]
    if (!t) return { success: false, message: '任务不存在' }
    if (t.status !== 'FAILED') return { success: false, message: '仅失败任务可重试' }
    t.status = 'PENDING'; t.progress = 0; delete t.error; delete t.videoUrl
    setTimeout(() => { const x = genTasks.items[taskId]; if (x) { x.status = 'RUNNING'; x.progress = 10 } }, 400)
    setTimeout(() => { const x = genTasks.items[taskId]; if (x) { x.progress = 60 } }, 2000)
    setTimeout(() => { const x = genTasks.items[taskId]; if (x) { x.status = 'DONE'; x.progress = 100; x.videoUrl = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'; x.endAt = Date.now() } }, 5000)
    return { success: true }
  },
  getVideoGenQuota: async () => {
    await new Promise(r => setTimeout(r, 150))
    return { success: true, data: { dailyLimit: genQuota.dailyLimit, usedToday: genQuota.usedToday, resetAt: genQuota.resetAt } }
  },
  listVideoGenTasks: async ({ page = 1, pageSize = 10 } = {}) => {
    await new Promise(r => setTimeout(r, 150))
    const all = Object.values(genTasks.items).sort((a,b)=> (b.startAt||0)-(a.startAt||0))
    const start = (page - 1) * pageSize
    const slice = all.slice(start, start + pageSize)
    return { success: true, data: { tasks: slice, total: all.length, page, pageSize } }
  },


  // Object storage / CDN placeholders
  requestUploadToken: async (filename, mime) => {
    await new Promise(r => setTimeout(r, 100))
    return { success: true, data: { uploadUrl: 'https://example-cdn/upload', token: 'mock-upload-token', cdnBase: 'https://cdn.example.com' } }
  },
  requestTranscode: async ({ dramaId, ep, videoUrl, watermark = false }) => {
    await new Promise(r => setTimeout(r, 200))
    // simulate transcode then replace url with cdn one
    setTimeout(()=>{
      const drama = db.dramas.find(d => d.id === Number(dramaId))
      if (drama) {
        const i = drama.episodes.findIndex(e => e.ep === Number(ep))
        if (i>=0) drama.episodes[i].videoUrl = (videoUrl || 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4').replace('https://','https://cdn.')
      }
    }, 2000)
    return { success: true, data: { taskId: 'trans_'+Date.now() } }
  },
  purchaseEpisode: async (dramaId, ep) => {
    await new Promise(r => setTimeout(r, 400))
    return { success: true, data: { dramaId: Number(dramaId), ep } }
  },
  purchaseSeason: async (dramaId) => {
    await new Promise(r => setTimeout(r, 600))
    return { success: true, data: { dramaId: Number(dramaId) } }
  },
  getMembership: async () => {
    await new Promise(r => setTimeout(r, 200))
    // 获取会员状态（从本地存储）
    const raw = localStorage.getItem('membership_active')
    const membershipData = raw ? JSON.parse(raw) : { active: false, plan: null, type: 'BASIC' }
    return { 
      success: true, 
      data: { 
        active: membershipData.active, 
        plan: membershipData.plan,
        type: membershipData.type || 'BASIC',
        expiresAt: membershipData.expiresAt,
        features: membershipData.features || []
      } 
    }
  },
  purchaseMembership: async (plan = 'SEASON') => {
    await new Promise(r => setTimeout(r, 500))
    const membershipData = {
      active: true,
      plan,
      type: 'PRO',
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30天
      features: [
        'unlimited_access',
        'ad_free',
        'hd_quality',
        'early_access',
        'exclusive_content',
        'priority_support',
        'advanced_ai_features',
        'blockchain_benefits'
      ]
    }
    localStorage.setItem('membership_active', JSON.stringify(membershipData))
    return { success: true, data: membershipData }
  },
  getProFeatures: async () => {
    await new Promise(r => setTimeout(r, 200))
    return {
      success: true,
      data: {
        features: [
          {
            id: 'unlimited_access',
            name: '无限观看',
            description: '解锁所有付费内容，无限制观看',
            icon: 'PlayCircleOutlined'
          },
          {
            id: 'ad_free',
            name: '无广告体验',
            description: '享受纯净的观看体验，无任何广告干扰',
            icon: 'StopOutlined'
          },
          {
            id: 'hd_quality',
            name: '高清画质',
            description: '支持4K超高清画质，带来极致视觉体验',
            icon: 'VideoCameraOutlined'
          },
          {
            id: 'early_access',
            name: '抢先观看',
            description: '新剧集提前24小时观看，做第一个观众',
            icon: 'ClockCircleOutlined'
          },
          {
            id: 'exclusive_content',
            name: '独家内容',
            description: '专享Pro用户独家的幕后花絮和特别内容',
            icon: 'StarOutlined'
          },
          {
            id: 'priority_support',
            name: '优先客服',
            description: '7x24小时优先客服支持，问题快速解决',
            icon: 'CustomerServiceOutlined'
          },
          {
            id: 'advanced_ai_features',
            name: 'AI增强功能',
            description: '使用高级AI功能，智能推荐和个性化体验',
            icon: 'RobotOutlined'
          },
          {
            id: 'blockchain_benefits',
            name: '区块链特权',
            description: '享受区块链版权保护和收益分成特权',
            icon: 'BlockOutlined'
          }
        ],
        pricing: {
          monthly: { price: 29, originalPrice: 39, discount: 25 },
          yearly: { price: 299, originalPrice: 468, discount: 36 },
          lifetime: { price: 999, originalPrice: 1999, discount: 50 }
        }
      }
    }
  },


  // Dashboard KPI (Mock)
  getSeriesKPI: async () => {
    await new Promise(r => setTimeout(r, 300))
    return {
      success: true,
      data: {
        freeToEp3Rate: 0.62,
        toEp5Rate: 0.41,
        toEp10Rate: 0.23,
        finishSeasonRate: 0.12,
        arpu: 12.6,
        repurchaseRate: 0.18,
        recentPurchases: [
          { date: '2025-09-01', ep: 4, count: 120 },
          { date: '2025-09-02', ep: 5, count: 150 },
          { date: '2025-09-03', ep: 6, count: 180 },
          { date: '2025-09-04', ep: 4, count: 160 },
          { date: '2025-09-05', ep: 7, count: 190 },
        ]
      }
    }
  }
}

// Enable mock mode - can be controlled by environment variable
export const MOCK_MODE = import.meta.env.VITE_MOCK_MODE !== 'false'
