import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { h } from 'vue'
import AppBar from './AppBar.vue'
import './custom.css'

// 기본 테마를 확장하고 ① 에디토리얼/Swiss 스타일 ② 허브 공용 상단 탭 바를
// layout-top 슬롯에 얹는다. (--vp-layout-top-height로 본문이 36px 내려감)
// 프롬프트 코치 위젯은 file://(mpa·무하이드레이션)에서도 돌아야 하므로
// Vue 컴포넌트가 아니라 config.ts head의 vanilla 스크립트(이벤트 위임)로 구현한다.
export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'layout-top': () => h(AppBar),
    })
  },
  // SPA(https)에서 예시별 연습 패널을 하이드레이션 이후에 주입한다.
  // head 스크립트(window.__pcInjectPractice)에 로직이 있고, 여기선 "언제" 부를지만 정한다.
  // 라우트가 바뀔 때마다 .vp-doc 내용이 교체되므로 그때마다 재주입한다.
  // (file://은 mpa라 이 테마 JS 자체가 없고, head 스크립트가 직접 구동한다.)
  enhanceApp({ router }) {
    if (typeof window === 'undefined') return
    const inject = () =>
      requestAnimationFrame(() => {
        const fn = (window as { __pcInjectPractice?: () => void }).__pcInjectPractice
        if (fn) fn()
      })
    const prev = router.onAfterRouteChanged
    router.onAfterRouteChanged = (to: string) => {
      if (prev) prev(to)
      inject()
    }
  },
} satisfies Theme
