import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/short',
    name: 'ShortFeed',
    component: () => import('@/views/ShortFeed.vue')
  },
  {
    path: '/me',
    name: 'Me',
    component: () => import('@/views/Me.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue')
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/create',
    name: 'CreateDrama',
    component: () => import('@/views/CreateDrama.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/drama/:id',
    name: 'DramaDetail',
    component: () => import('@/views/DramaDetail.vue')
  },
  {
    path: '/ai-assistant',
    name: 'AIAssistant',
    component: () => import('@/views/AIAssistant.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/blockchain',
    name: 'Blockchain',
    component: () => import('@/views/Blockchain.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

export default router
