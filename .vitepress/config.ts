import { defineConfig } from 'vitepress'
import { readFileSync } from 'node:fs'

// 프롬프트 코치 위젯 스크립트를 빌드 시점에 읽어 head에 인라인한다.
// file://(mpa·무하이드레이션)에서도 외부 fetch 없이 실행되게 하기 위함.
const coachScript = readFileSync(
  new URL('./theme/prompt-coach.js', import.meta.url),
  'utf-8',
)

// VP_FILE=1 → 허브(file://)에서 더블클릭으로 열리는 빌드.
//   · base를 dist 절대경로로 박아 asset/링크를 루트절대경로로 만들고
//   · mpa로 SPA 라우터를 꺼서 로컬 fetch(CORS) 문제를 피하고
//   · cleanUrls를 꺼서 .html 링크가 그대로 파일로 열리게 한다.
// 기본(npm run dev/build)은 풀기능 SPA — 검색·다크토글 모두 동작.
const FILE = process.env.VP_FILE === '1'
const FILE_BASE =
  '/Users/harry/Desktop/Harry%20Projects/프롬프트-엔지니어링/.vitepress/dist/'

// GitHub Pages 프로젝트 사이트는 /<repo>/ 하위 경로로 서빙된다.
// 배포 워크플로에서 VP_BASE=/<repo>/ 를 주입하고, 로컬 dev/build는 '/'로 둔다.
const SITE_BASE = process.env.VP_BASE || '/'

// 공유 카드(Open Graph·Twitter)용 절대 URL. 스크레이퍼(카카오톡·트위터·링크드인)는
// 상대경로/SVG를 못 읽으므로 배포 도메인을 박아 og.png(1200×630)를 가리킨다.
const SITE_URL = 'https://harrykys.github.io/prompt-ref/'
const OG_TITLE = '프롬프트 엔지니어링 · 작업용 레퍼런스'
const OG_DESC =
  '골격은 빌려오고 빈칸은 내 맥락으로. Anthropic 공식 가이드를 복붙용으로 정리한 한국어 프롬프트 레퍼런스 — 갤러리 105선·메타 프롬프트 코치 포함.'

// 에디토리얼/Swiss 톤의 프롬프트 엔지니어링 레퍼런스 사이트 설정.
// 기존 9개 마크다운을 그대로 페이지로 재사용한다.
export default defineConfig({
  lang: 'ko-KR',
  title: '프롬프트 엔지니어링',
  description: 'Anthropic 공식 가이드를 내 맥락으로 채운 작업용 레퍼런스',
  lastUpdated: true,
  base: FILE ? FILE_BASE : SITE_BASE,
  mpa: FILE,
  cleanUrls: !FILE,

  // README는 GitHub용으로만 두고 사이트 빌드에서 제외 (index.md가 홈)
  srcExclude: ['README.md', '**/node_modules/**'],

  // GFM 태스크리스트(`- [ ]`)를 체크박스로. VitePress 기본 미지원이라
  // 외부 의존성 대신 결정론적 인라인 markdown-it 규칙으로 처리한다.
  markdown: {
    config(md) {
      md.core.ruler.after('inline', 'pe-task-lists', (state) => {
        const tokens = state.tokens
        for (let i = 2; i < tokens.length; i++) {
          const inline = tokens[i]
          if (
            inline.type !== 'inline' ||
            tokens[i - 1].type !== 'paragraph_open' ||
            tokens[i - 2].type !== 'list_item_open' ||
            !/^\[[ xX]\]\s/.test(inline.content)
          ) {
            continue
          }
          const checked = /^\[[xX]\]/.test(inline.content)
          inline.content = inline.content.replace(/^\[[ xX]\]\s/, '')
          const first = inline.children?.[0]
          if (first && first.type === 'text') {
            first.content = first.content.replace(/^\[[ xX]\]\s/, '')
          }
          const box = new state.Token('html_inline', '', 0)
          box.content = `<input class="pe-task" type="checkbox" disabled${
            checked ? ' checked' : ''
          }> `
          inline.children?.unshift(box)
          tokens[i - 2].attrJoin('class', 'pe-task-item')
        }
      })
    },
  },

  head: [
    ['link', { rel: 'preconnect', href: 'https://cdn.jsdelivr.net' }],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css',
      },
    ],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap',
      },
    ],
    // 프롬프트 코치 위젯 로직 (file://에서도 동작하는 인라인 vanilla JS)
    ['script', {}, coachScript],

    // 공유 카드 — Open Graph (카카오톡·페이스북·링크드인)
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: '프롬프트 엔지니어링' }],
    ['meta', { property: 'og:title', content: OG_TITLE }],
    ['meta', { property: 'og:description', content: OG_DESC }],
    ['meta', { property: 'og:url', content: SITE_URL }],
    ['meta', { property: 'og:image', content: SITE_URL + 'og.png' }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { property: 'og:locale', content: 'ko_KR' }],
    // 공유 카드 — Twitter/X (큰 이미지 카드)
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: OG_TITLE }],
    ['meta', { name: 'twitter:description', content: OG_DESC }],
    ['meta', { name: 'twitter:image', content: SITE_URL + 'og.png' }],
  ],

  themeConfig: {
    // 좌상단 사이트 라벨
    siteTitle: 'PROMPT · ENG',

    nav: [
      { text: '⭐ 내 프롬프트', link: '/00_내프롬프트' },
      {
        text: '레퍼런스',
        items: [
          { text: '핵심 원칙', link: '/01_핵심원칙' },
          { text: '체크리스트', link: '/02_체크리스트' },
          { text: '최신 모델 주의점', link: '/03_최신모델_주의점' },
        ],
      },
      {
        text: '프롬프트 모음',
        items: [
          { text: '갤러리 105선', link: '/04_프롬프트갤러리' },
          { text: '한글 실무 24선', link: '/05_한글프롬프트' },
          { text: 'Claude 공식 라이브러리', link: '/06_Claude공식라이브러리' },
          { text: '메타 프롬프트 (코치형)', link: '/07_메타프롬프트' },
        ],
      },
      { text: '템플릿', link: '/templates/작업지시' },
      { text: '예시', link: '/examples/주식차트_만들기' },
    ],

    sidebar: [
      {
        text: '⭐ 즐겨찾기',
        items: [
          { text: '내 프롬프트 (자주 쓰는 12개)', link: '/00_내프롬프트' },
        ],
      },
      {
        text: '레퍼런스',
        items: [
          { text: '01 — 핵심 원칙', link: '/01_핵심원칙' },
          { text: '02 — 체크리스트', link: '/02_체크리스트' },
          { text: '03 — 최신 모델 주의점', link: '/03_최신모델_주의점' },
        ],
      },
      {
        text: '04 — 프롬프트 갤러리 105선',
        collapsed: false,
        items: [
          { text: '전체 카테고리', link: '/04_프롬프트갤러리' },
          { text: '개발 · 코딩', link: '/gallery/1_개발코딩' },
          { text: '글쓰기 · 번역 · 교정', link: '/gallery/2_글쓰기번역' },
          { text: '학습 · 교육', link: '/gallery/3_학습교육' },
          { text: '비즈니스 · 마케팅 · 생산성', link: '/gallery/4_비즈니스마케팅' },
          { text: '건강 · 라이프 · 코칭', link: '/gallery/5_건강라이프' },
          { text: '창작 · 디자인 · 이미지', link: '/gallery/6_창작디자인' },
          { text: '전문 · 분석 · 도구', link: '/gallery/7_전문분석' },
        ],
      },
      {
        text: '프롬프트 모음',
        items: [
          { text: '05 — 한글 실무 프롬프트 24선', link: '/05_한글프롬프트' },
          { text: '06 — Claude 공식 라이브러리', link: '/06_Claude공식라이브러리' },
          { text: '07 — 메타 프롬프트 (코치형)', link: '/07_메타프롬프트' },
        ],
      },
      {
        text: '템플릿 (빈칸 채우기)',
        items: [
          { text: '작업 지시', link: '/templates/작업지시' },
          { text: '문서 분석', link: '/templates/문서분석' },
          { text: '리서치 · 자기검증', link: '/templates/리서치_자기검증' },
        ],
      },
      {
        text: '예시 (내 맥락으로 채움)',
        items: [
          { text: '주식 차트 만들기', link: '/examples/주식차트_만들기' },
          { text: '내 맥락으로 채운 예시', link: '/examples/내맥락으로_채운예시' },
        ],
      },
    ],

    outline: { level: [2, 3], label: '이 페이지' },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '검색', buttonAriaLabel: '검색' },
          modal: {
            noResultsText: '결과 없음',
            resetButtonTitle: '초기화',
            footer: { selectText: '선택', navigateText: '이동', closeText: '닫기' },
          },
        },
      },
    },

    docFooter: { prev: '이전', next: '다음' },
    darkModeSwitchLabel: '테마',
    returnToTopLabel: '맨 위로',
    lastUpdatedText: '최종 수정',

    socialLinks: [
      { icon: 'github', link: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices' },
    ],
  },
})
