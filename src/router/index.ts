import { createRouter, createWebHistory } from 'vue-router'
import ModeratorPanelView from '../views/ModeratorPanelView.vue'
import CandidateView from '../views/CandidateView.vue'
import LoginView from '../views/LoginView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import DevelopersView from '../views/DevelopersView.vue'
import { isAuthenticated } from '@/utils/auth'

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
    },
    {
      path: '/candidate/:id',
      name: 'candidate',
      component: CandidateView,
    },
    {
      path: '/developers',
      name: 'developers',
      component: DevelopersView,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
    },
  ],
})

router.beforeEach((to, from, next) => {
  const isUserAuthenticated = isAuthenticated()

  if (to.name !== 'login') {
    if (!isUserAuthenticated) {
      return next({ name: 'login' })
    }
    next()
  } else if (to.name === 'login') {
    if (isUserAuthenticated) {
      return next({ name: 'moderator-panel' })
    }
    next()
  }
})

export default router
