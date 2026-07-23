// Route-verifiability contract: every navigable UI state MUST be reachable from a URL alone
// (deep-linkable createWebHistory routes; the backend serves index.html for known SPA paths).
// Router base is derived from Vite's base (import.meta.env.BASE_URL === '/e2e-lane-vue-nest/').
// Public bookmark/about routes carry NO guards. Each route carries a meta.flow node.
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/bookmarks' },
    {
      path: '/bookmarks',
      name: 'bookmarks',
      component: () => import('./pages/BookmarksView.vue'),
      meta: { flow: 'bookmarks.list', title: 'My Bookmark List' },
    },
    {
      path: '/bookmarks/new',
      name: 'bookmark-new',
      component: () => import('./pages/BookmarkNewView.vue'),
      meta: { flow: 'bookmarks.create', title: 'Add Bookmark' },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('./pages/AboutView.vue'),
      meta: { flow: 'about', title: 'About Bookmarks' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('./pages/LoginView.vue'),
      meta: { flow: 'auth.login', title: 'Log in' },
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('./pages/SignupView.vue'),
      meta: { flow: 'auth.signup', title: 'Sign up' },
    },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('./pages/AdminLoginView.vue'),
      meta: { flow: 'admin.login', title: 'Admin Login' },
    },
    {
      path: '/admin/settings',
      name: 'admin-settings',
      component: () => import('./pages/AdminSettingsView.vue'),
      meta: { flow: 'admin.settings', title: 'Admin Settings' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('./pages/NotFoundView.vue'),
      meta: { flow: 'not-found', title: 'Not Found' },
    },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

router.afterEach((to) => {
  const t = (to.meta.title as string) || 'Bookmarks';
  document.title = to.name === 'bookmarks' ? 'Bookmarks' : `${t} · Bookmarks`;
});

export { router };
