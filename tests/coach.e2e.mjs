// 프롬프트 코치 위젯 회귀 테스트 — 빌드된 dist를 실제 브라우저로 띄워 검증한다.
// 인라인 스크립트(prompt-coach.js → config.ts head)를 그대로 구동하므로
// 단위 테스트처럼 로직이 어긋날(drift) 일이 없다. 새 의존성 없음(node http + playwright).
//
// 사용법:
//   npm run build && npm test       (또는 npm run test:build)
// CI(ubuntu)에서는 npx playwright install chromium 후 실행.
import http from 'node:http';
import { readFile, stat, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// 웹(SPA) 빌드 출력. 기본 `npm run build`는 file:// 허브(dist/)라 HTTP 테스트엔 안 맞다.
// 테스트는 항상 VP_SPA=1 빌드(dist-web/)를 검증한다. → `npm run test:build`
const DIST = path.join(ROOT, '.vitepress', 'dist-web');
const PAGE = '07_메타프롬프트.html';
const PORT = 8788;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

// 정적 서버 — python 의존 없이 dist를 HTTP로 서빙(프로덕션과 동일한 보안 컨텍스트).
function serve() {
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      try {
        let p = decodeURIComponent(req.url.split('?')[0]);
        if (p === '/') p = '/index.html';
        const file = path.join(DIST, p);
        if (!file.startsWith(DIST)) { res.writeHead(403).end(); return; }
        const body = await readFile(file);
        res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
        res.end(body);
      } catch {
        res.writeHead(404).end('not found');
      }
    });
    server.listen(PORT, () => resolve(server));
  });
}

// 크로미움 실행 파일 자동 탐색 — 번들 기본값을 먼저 쓰고, 없으면 ms-playwright 캐시에서
// 설치된 chromium_headless_shell-* / chromium-* 중 아무거나 찾아 재사용한다.
async function resolveExecutable() {
  try {
    const def = chromium.executablePath();
    if (def && existsSync(def)) return undefined; // 기본 경로 사용
  } catch { /* ignore */ }
  const cache = path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright');
  const linux = path.join(os.homedir(), '.cache', 'ms-playwright');
  for (const base of [cache, linux]) {
    if (!existsSync(base)) continue;
    const dirs = (await readdir(base)).filter((d) => d.startsWith('chromium'));
    // headless shell 우선
    dirs.sort((a, b) => (b.includes('headless') ? 1 : 0) - (a.includes('headless') ? 1 : 0));
    for (const d of dirs) {
      for (const rel of [
        'chrome-headless-shell-mac-arm64/chrome-headless-shell',
        'chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium',
        'chrome-linux/chrome',
        'chrome-linux/headless_shell',
      ]) {
        const exe = path.join(base, d, rel);
        if (existsSync(exe)) return exe;
      }
    }
  }
  return undefined;
}

const results = [];
function check(name, cond) { results.push({ name, ok: !!cond }); }

async function main() {
  if (!existsSync(path.join(DIST, PAGE))) {
    console.error('❌ dist-web가 없습니다. `npm run build:web` 또는 `npm run test:build`를 실행하세요.');
    process.exit(2);
  }
  const server = await serve();
  const executablePath = await resolveExecutable();
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  const page = await browser.newPage({ viewport: { width: 900, height: 1400 } });
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message));

  await page.goto(`http://localhost:${PORT}/${PAGE}`, { waitUntil: 'networkidle' });

  // ── 도메인 감지 정확도 (UI를 통해 실제 inline 로직 검증) ──
  const detectCases = [
    ['마케팅 문구 써줘', '마케팅'],
    ['파이썬으로 자동화 스크립트 짜줘', '개발'],
    ['블로그 글 써줘', '글쓰기'],
    ['이 데이터 분석해줘', '분석'],
    ['영어로 번역해줘', '번역'],
    ['이 개념 쉽게 설명해줘', '학습'],
    ['마케팅 자동화 코드 짜줘', '개발'],
    ['이메일 자동 분류 프로그램', '개발'],   // 회귀: 부분문자열 중복 가산 버그
    ['한글 보고서 글자수 분석', '분석'],      // 회귀: '글' 과탐 + 동사 가중치
  ];
  for (const [input, expected] of detectCases) {
    await page.fill('#pc-input', input);
    await page.click('[data-pc-run]');
    await page.waitForSelector('.pc-detect-dom', { timeout: 3000 });
    const dom = (await page.textContent('.pc-detect-dom')).trim();
    check(`감지: "${input}" → ${expected} (실제 ${dom})`, dom === expected);
  }

  // ── 구조/기능 블록 ──
  await page.fill('#pc-input', '이메일 자동 분류 프로그램');
  await page.click('[data-pc-run]');
  await page.waitForSelector('.pc-final', { timeout: 3000 });

  check('Before→After 블록 렌더', await page.$('.pc-ba') !== null);
  check('원본 텍스트 표시', (await page.textContent('.pc-ba-orig')).includes('이메일 자동 분류'));
  check('after 채움 목록 존재', await page.$('.pc-ba-list li') !== null);
  check('감지 근거 칩 존재', await page.$('.pc-chip') !== null);
  const final1 = await page.inputValue('.pc-final');
  check('완성본에 개발 role 반영', final1.includes('시니어 엔지니어'));
  check('완성본 "감지한 분야: 개발"', final1.includes('감지한 분야: 개발'));

  // ── 분야 수동 변경 → 완성본 즉시 재생성 ──
  await page.selectOption('.pc-domain', '글쓰기');
  await page.waitForTimeout(150);
  const final2 = await page.inputValue('.pc-final');
  check('수동선택 후 배지=글쓰기', (await page.textContent('.pc-detect-dom')).trim() === '글쓰기');
  check('완성본 "선택한 분야: 글쓰기"', final2.includes('선택한 분야: 글쓰기'));
  check('완성본 role이 작가로 전환', final2.includes('전문 작가'));

  // ── 5요소 모두 갖춘 입력 → allok ──
  await page.fill('#pc-input', '너는 시니어 마케터다. 사회초년생 대상 인스타 광고 카피를 15자 이내 불릿 3개로, 3초 안에 이해되면 성공.');
  await page.click('[data-pc-run]');
  await page.waitForTimeout(150);
  check('탄탄한 입력 시 allok 메시지', (await page.textContent('.pc-ba-after')).includes('이미'));

  check('콘솔 에러 0', consoleErrors.length === 0);

  await browser.close();
  server.close();

  // ── 리포트 ──
  const pass = results.filter((r) => r.ok).length;
  for (const r of results) console.log((r.ok ? '✓' : '✗ FAIL') + ' ' + r.name);
  if (consoleErrors.length) console.log('\n콘솔 에러:', consoleErrors);
  console.log(`\n결과: ${pass}/${results.length} 통과`);
  process.exit(pass === results.length ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
