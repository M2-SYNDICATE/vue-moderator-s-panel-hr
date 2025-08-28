import { createRouter, createWebHistory } from 'vue-router'
import ModeratorPanelView from '../views/ModeratorPanelView.vue'
import CandidateView from '../views/CandidateView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
