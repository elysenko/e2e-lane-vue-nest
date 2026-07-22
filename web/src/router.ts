// Route-verifiability contract (Colossus): every navigable UI state MUST be reachable
// from a URL alone (deep-linkable createWebHistory routes; nginx serves try_files fallback).
import { createRouter, createWebHistory } from 'vue-router';
import Home from './pages/Home.vue';
import About from './pages/About.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About },
  ],
});
