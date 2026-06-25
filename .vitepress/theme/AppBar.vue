<script setup lang="ts">
// 허브 생태계 공용 상단 탭 바. 프롬프트 사이트 어느 페이지(깊이)에서도
// 동작하도록 루트 절대경로(file:// 기준 = 파일시스템 루트)를 쓴다.
// ⚠️ 탭 순서는 루트 sync-appbar.py 의 NAV 와 항상 동일하게 유지할 것.
const ROOT = '/Users/harry/Desktop/Harry Projects'
const links = [
  { href: `${ROOT}/projects-dashboard.html`, label: '🏠 허브' },
  { href: `${ROOT}/projects-progress.html`, label: '📊 진행현황' },
  { sep: true },
  { href: `${ROOT}/HNP/my-video/web/index.html`, label: '📺 HNP' },
  { href: `${ROOT}/HNP/my-video/web/thumbnails.html`, label: '🖼️ 썸네일' },
  { href: `${ROOT}/HNP/my-video/web/billing.html`, label: '💰 HNP빌링' },
  { sep: true },
  { href: `${ROOT}/Music/prompt-app/index.html`, label: '🎵 Suno' },
  { href: `${ROOT}/Music/prompt-app/youtube-meta.html`, label: '📊 YT메타' },
  { href: `${ROOT}/Music/prompt-app/billing.html`, label: '💳 뮤직빌링' },
  { href: `${ROOT}/Music/video-maker/index.html`, label: '🎬 비디오메이커' },
  { sep: true },
  { href: `${ROOT}/프롬프트-엔지니어링/.vitepress/dist/index.html`, label: '📝 프롬프트', active: true },
]
</script>

<template>
  <nav class="app-bar-global" aria-label="허브 생태계">
    <span class="ab-brand">Harry</span>
    <div class="ab-sep" aria-hidden="true"></div>
    <template v-for="(l, i) in links" :key="i">
      <div v-if="l.sep" class="ab-sep" aria-hidden="true"></div>
      <a
        v-else
        :href="l.href"
        :class="{ 'ab-active': l.active }"
        :aria-current="l.active ? 'page' : undefined"
        :target="l.external ? '_blank' : undefined"
        :rel="l.external ? 'noopener' : undefined"
        >{{ l.label }}</a
      >
    </template>
  </nav>
</template>
