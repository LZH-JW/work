<template>
  <div class="drama-card" @click="$emit('click', drama)">
    <div class="card-image">
      <img :src="drama.coverImage || 'https://via.placeholder.com/300x200'" :alt="drama.title" />
      <div class="card-overlay">
        <a-button type="primary" shape="circle" size="large">
          <PlayCircleOutlined />
        </a-button>
      </div>
    </div>
    <div class="card-content">
      <h3>{{ drama.title }}</h3>
      <p class="description">{{ drama.description }}</p>
      <div class="meta-info">
        <a-tag :color="getGenreColor(drama.genre)">{{ drama.genre }}</a-tag>
        <span class="duration">{{ drama.duration }}分钟</span>
      </div>
      <div class="stats">
        <span><EyeOutlined /> {{ formatNumber(drama.views) }}</span>
        <span><HeartOutlined /> {{ formatNumber(drama.likes) }}</span>
        <span><StarFilled /> {{ drama.rating }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { PlayCircleOutlined, EyeOutlined, HeartOutlined, StarFilled } from '@ant-design/icons-vue'

defineProps({
  drama: {
    type: Object,
    required: true
  }
})

defineEmits(['click'])

const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

const getGenreColor = (genre) => {
  const colors = {
    '爱情': 'pink',
    '喜剧': 'orange',
    '剧情': 'blue',
    '悬疑': 'purple',
    '奇幻': 'green'
  }
  return colors[genre] || 'default'
}
</script>

<style scoped>
.drama-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  background: white;
}

.drama-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.card-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.drama-card:hover .card-image img {
  transform: scale(1.05);
}

.card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.drama-card:hover .card-overlay {
  opacity: 1;
}

.card-content {
  padding: 16px;
}

.card-content h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}

.description {
  color: #666;
  font-size: 14px;
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.duration {
  color: #999;
  font-size: 12px;
}

.stats {
  display: flex;
  gap: 16px;
  color: #666;
  font-size: 12px;
}

.stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
