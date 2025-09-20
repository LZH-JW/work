import { defineStore } from 'pinia'
import { ref } from 'vue'

const FAVORITES_KEY = 'video_favorites'
const HISTORY_KEY = 'video_watch_history'

export const useVideoStore = defineStore('video', () => {
  const favorites = ref([]) // [id]
  const history = ref([])   // [{ id, title, cover, savedAt, progress }]

  const load = () => {
    try {
      const fav = localStorage.getItem(FAVORITES_KEY)
      favorites.value = fav ? JSON.parse(fav) : []
    } catch { favorites.value = [] }
    try {
      const his = localStorage.getItem(HISTORY_KEY)
      history.value = his ? JSON.parse(his) : []
    } catch { history.value = [] }
  }

  const saveFavorites = () => localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites.value))
  const saveHistory = () => localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value))

  const isFavorited = (id) => favorites.value.includes(id)
  const toggleFavorite = (id) => {
    const idx = favorites.value.indexOf(id)
    if (idx >= 0) favorites.value.splice(idx, 1)
    else favorites.value.unshift(id)
    saveFavorites()
  }

  const upsertHistory = (rec) => {
    const idx = history.value.findIndex(x => x.id === rec.id)
    const merged = { ...rec, savedAt: Date.now() }
    if (idx >= 0) history.value[idx] = merged
    else history.value.unshift(merged)
    // 限制长度
    history.value = history.value.slice(0, 200)
    saveHistory()
  }

  // 初始化
  load()

  return {
    favorites,
    history,
    load,
    isFavorited,
    toggleFavorite,
    upsertHistory,
  }
})
