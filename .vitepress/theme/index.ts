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
} satisfies Theme
