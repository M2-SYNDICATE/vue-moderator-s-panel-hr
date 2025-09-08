import { createRouter, createWebHistory } from 'vue-router'
import ModeratorPanelView from '../views/ModeratorPanelView.vue'
import CandidateView from '../views/CandidateView.vue'
import LoginView from '../views/LoginView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import DevelopersView from '../views/DevelopersView.vue'
import { authService } from '@/services/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/',
      name: 'moderator-panel',
      component: ModeratorPanelView,
      meta: { requiresAuth: true },
    },
    {
      path: '/candidate/:id',
      name: 'candidate',
      component: CandidateView,
      meta: { requiresAuth: true },
    },
    {
      path: '/developers',
      name: 'developers',
      component: DevelopersView,
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const isAuthenticated = authService.isAuthenticated()

  if (requiresAuth && !isAuthenticated) {
    // Пытаемся обновить токен перед редиректом
    const refreshSuccess = await authService.refreshToken()
    if (!refreshSuccess) {
      return next({ name: 'login' })
    }
  }

  if (to.name === 'login' && isAuthenticated) {
    return next({ name: 'moderator-panel' })
  }

  next()
})

export default router
