import { chromium } from 'playwright'

const DIST = 'file:///Users/harry/Desktop/Harry%20Projects/프롬프트-엔지니어링/.vitepress/dist'
const HOME = `${DIST}/index.html`

const browser = await chromium.launch({ channel: 'chrome' })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })

// 샌드박스라 외부 CDN 폰트는 못 받는다 → abort시켜 폴백 + 스크린샷 hang 방지.
// (실제 사용 환경에선 네트워크로 정상 로드됨)
await ctx.route('**/*', (route) => {
  const u = route.request().url()
  if (u.startsWith('file://')) return route.continue()
  return route.abort()
})

const page = await ctx.newPage()
const failed = []
page.on('requestfailed', (r) => {
  const u = r.url()
  if (u.startsWith('file://')) failed.push(`FAIL ${r.failure()?.errorText} ${u}`)
})

await page.goto(HOME, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(500)

const bar = await page.$('.app-bar-global')
const barBox = bar ? await bar.boundingBox() : null
const promptTabActive = await page.$('.app-bar-global a.ab-active')
const promptTabText = promptTabActive ? await promptTabActive.innerText() : null
const navTop = await page
  .$eval('.VPNav', (el) => Math.round(el.getBoundingClientRect().top))
  .catch(() => null)
const h1Font = await page
  .$eval('.VPHero .name', (el) => getComputedStyle(el).fontFamily)
  .catch(() => null)
// 앱바 첫 링크(허브)가 올바른 절대경로인가
const hubHref = await page
  .$eval('.app-bar-global a', (el) => el.getAttribute('href'))
  .catch(() => null)

await page.screenshot({ path: '/tmp/pe_home_1440.png', fullPage: true })

// 내부 페이지 이동 검증
await page.goto(`${DIST}/01_핵심원칙.html`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(400)
const h1Text = await page.$eval('.vp-doc h1', (el) => el.innerText).catch(() => null)
const cssLoaded = await page
  .$eval('.vp-doc h2', (el) => getComputedStyle(el).borderTopWidth)
  .catch(() => null) // custom.css가 h2에 border-top 줬으니 0px 아니면 CSS 적용됨
await page.screenshot({ path: '/tmp/pe_principles_1440.png', fullPage: true })

// 모바일
const m = await ctx.newPage()
await m.setViewportSize({ width: 390, height: 844 })
await m.goto(HOME, { waitUntil: 'domcontentloaded' })
await m.waitForTimeout(400)
await m.screenshot({ path: '/tmp/pe_home_390.png', fullPage: true })

console.log(JSON.stringify({
  appBarPresent: !!bar,
  appBarBox: barBox,
  promptTabActiveText: promptTabText,
  hubLinkHref: hubHref,
  vpNavTop_shouldBe36: navTop,
  heroFontFamily: h1Font,
  principlesH1: h1Text,
  h2BorderTop_cssCheck: cssLoaded,
  localAssetFailures: failed,
}, null, 2))

await browser.close()
