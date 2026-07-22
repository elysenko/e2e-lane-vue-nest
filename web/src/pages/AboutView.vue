<script setup lang="ts"></script>

<template>
  <section data-testid="about-view">
    <div class="page-head">
      <div>
        <h1 class="page-title" data-testid="about-title">About Bookmarks</h1>
        <p class="page-sub">A tiny, fully-public reading list.</p>
      </div>
    </div>

    <div class="card auth-card" style="max-width: none;">
      <p style="line-height: 1.7; color: var(--text-muted); font-size: 15px;">
        Bookmarks is a minimal open web app for saving and sharing links. Anyone can view the
        list and add a new bookmark — no account required. Each bookmark stores a title and a
        web address, and only safe <code>http://</code> and <code>https://</code> links are
        accepted.
      </p>
      <ul style="line-height: 1.9; color: var(--text-muted); font-size: 15px; padding-left: 20px; margin-top: 14px;">
        <li>Browse the shared list of bookmarks.</li>
        <li>Add your own link with a title and URL.</li>
        <li>Bad or unsafe links are politely rejected.</li>
        <li>The app stays friendly even if the service is temporarily down.</li>
      </ul>
      <div style="margin-top: 22px;">
        <RouterLink to="/bookmarks/new" class="btn btn-primary">Add a bookmark</RouterLink>
      </div>
    </div>
  </section>
</template>
