import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth.store'
import LoginView from '../views/Auth/LoginView.vue'
import RegisterView from '../views/Auth/RegisterView.vue'
import ActivityListView from '../views/Home/ActivityListView.vue'
import ActivityDetailView from '../views/Activities/ActivityDetailView.vue'
import CreateActivityView from '../views/Activities/CreateActivityView.vue'
import EditActivityView from '../views/Activities/EditActivityView.vue'
import AddReviewView from '../views/Reviews/AddReviewView.vue'
import MyListsView from '../views/Lists/MyListsView.vue'
import ProfileView from '../views/Profile/ProfileView.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresAuth: false },
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView,
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    name: 'ActivityList',
    component: ActivityListView,
    meta: { requiresAuth: true },
  },
  {
    path: '/activities',
    redirect: '/',
  },
  {
    path: '/activities/:id',
    name: 'ActivityDetail',
    component: ActivityDetailView,
    meta: { requiresAuth: true },
  },
  {
    path: '/activities/create',
    name: 'CreateActivity',
    component: CreateActivityView,
    meta: { requiresAuth: true },
  },
  {
    path: '/activities/:id/edit',
    name: 'EditActivity',
    component: EditActivityView,
    meta: { requiresAuth: true },
  },
  {
    path: '/reviews/:activityId',
    name: 'AddReview',
    component: AddReviewView,
    meta: { requiresAuth: true },
  },
  {
    path: '/lists',
    name: 'MyLists',
    component: MyListsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfileView,
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Guard d'authentification
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth

  if (requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (!requiresAuth && authStore.isAuthenticated && (to.name === 'Login' || to.name === 'Register')) {
    next('/')
  } else {
    next()
  }
})

export default router
