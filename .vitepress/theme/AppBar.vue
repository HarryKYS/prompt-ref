<script setup lang="ts">
// 허브 생태계 공용 상단 탭 바. 프롬프트 사이트 어느 페이지(깊이)에서도
// 동작하도록 루트 절대경로(file:// 기준 = 파일시스템 루트)를 쓴다.
// ⚠️ 탭 순서·ping 은 루트 sync-appbar.py 의 NAV 와 항상 동일하게 유지할 것.
import { onMounted } from 'vue'

const ROOT = '/Users/harry/Desktop/Harry Projects'
const links = [
  { href: `${ROOT}/projects-dashboard.html`, label: '🏠 허브' },
  { href: `${ROOT}/projects-progress.html`, label: '📊 진행현황' },
  { href: `${ROOT}/class101-study/index.html`, label: '🎧 학습노트' },
  { href: `${ROOT}/부동산-대시보드/index.html`, label: '🏘️ 부동산' },
  { href: 'https://claude.ai/code/artifact/c63ec5d5-8b34-4b52-b324-9a5ff7f9d843', label: '🔑 대출계산', external: true },
  { href: `${ROOT}/auto-trader/docs/chart-mvp-demo/index.html`, label: '📈 차트(데모)' },
  { sep: true },
  { href: `${ROOT}/HNP/my-video/web/index.html`, label: '📺 HNP' },
  { href: `${ROOT}/HNP/my-video/web/thumbnails.html`, label: '🖼️ 썸네일' },
  { href: `${ROOT}/HNP/my-video/web/billing.html`, label: '💰 HNP빌링' },
  { sep: true },
  { href: `${ROOT}/Music/prompt-app/index.html`, label: '🎵 Suno' },
  { href: `${ROOT}/Music/prompt-app/youtube-meta.html`, label: '📊 YT메타', ping: 'http://localhost:3333/health' },
  { href: `${ROOT}/Music/prompt-app/billing.html`, label: '💳 뮤직빌링' },
  { href: `${ROOT}/Music/video-maker/index.html`, label: '🎬 비디오메이커' },
  { sep: true },
  { href: 'http://localhost:4870/#/', label: '🏆 랭킹스튜디오', external: true, ping: 'http://localhost:4870/' },
  { href: `${ROOT}/프롬프트-엔지니어링/.vitepress/dist/index.html`, label: '📝 프롬프트', active: true },
]

// 서버 상태 점 — no-cors 핑으로 up/down 만 판별(루트 sync-appbar.py DOT_SCRIPT 와 동일 로직).
onMounted(() => {
  const poll = () => {
    document.querySelectorAll<HTMLElement>('.ab-dot[data-ping]').forEach((dot) => {
      const url = dot.getAttribute('data-ping')!
      fetch(url, { mode: 'no-cors', signal: AbortSignal.timeout(2000) })
        .then(() => { dot.style.background = '#10b981'; dot.style.boxShadow = '0 0 5px rgba(16,185,129,0.7)'; dot.title = '서버 실행 중' })
        .catch(() => { dot.style.background = '#ef4444'; dot.style.boxShadow = 'none'; dot.title = '서버 꺼짐' })
    })
  }
  poll()
  setInterval(poll, 5000)
})
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
        ><span
          v-if="l.ping"
          class="ab-dot"
          :data-ping="l.ping"
          style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#555;margin-right:5px;vertical-align:middle;flex-shrink:0;transition:background .25s,box-shadow .25s;"
        ></span>{{ l.label }}</a
      >
    </template>
  </nav>
</template>
