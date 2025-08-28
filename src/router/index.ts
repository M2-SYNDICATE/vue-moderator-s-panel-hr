import { createRouter, createWebHistory } from 'vue-router'
import ModeratorPanelView from '../views/ModeratorPanelView.vue'
import CandidateView from '../views/CandidateView.vue'
import LoginView from '../views/LoginView.vue'

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
  ],
})

export default router
