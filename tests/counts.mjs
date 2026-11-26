// 문서에 적힌 프롬프트 개수가 실제 개수와 맞는지 검사한다.
//
// 왜 필요한가: 갤러리에 5개를 더했을 때 04와 nav는 고쳤는데 06은 "100선"으로 남고,
// 00에 프롬프트를 하나 더했는데 index.md 카드는 "12개"에 머물러 있었다(실측 2026-08-20).
// 같은 숫자가 여러 파일에 흩어져 있어 손으로는 반드시 어긋난다.
//
// 설계 원칙 두 가지:
//  1. **모든 출현을 본다.** 파일마다 첫 매치만 보면 config.ts처럼 같은 문구가
//     3번 나오는 곳에서 하나만 고쳐도 통과해 버린다(초기 버전이 실제로 그랬다).
//  2. **기대값을 손으로 적지 않는다.** 정답은 항상 실제 파일에서 센 값이거나
//     문서 자신의 목차 합계다. 상수로 박으면 정상적인 증가가 가짜 실패를 낸다.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const countIn = (text, re) => (text.match(re) || []).length;

const fails = [];
const check = (label, actual, expected, where) => {
  if (actual === expected) return console.log(`  ✓ ${label} — ${actual}`);
  fails.push(`${where}: "${label}" 표기 ${expected} ≠ 실제 ${actual}`);
  console.log(`  ✗ ${label} — 실제 ${actual} / 표기 ${expected}  (${where})`);
};

// ── 실측: 파일에서 직접 센 값이 유일한 정답 ────────────────────
const gallery = fs.readdirSync(path.join(ROOT, 'gallery'))
  .filter((f) => f.endsWith('.md'))
  .reduce((n, f) => n + countIn(read(path.join('gallery', f)), /^## \d+\./gm), 0);
const korean = countIn(read('05_한글프롬프트.md'), /^### \d+\./gm);
const mine = countIn(read('00_내프롬프트.md'), /^## \d+\./gm);

// 06은 원본이 사라진 색인이라 셀 항목이 없다 → 문서 자신의 목차 합계를 정답으로 삼는다.
const doc06 = read('06_Claude공식라이브러리.md');
const official = [...doc06.matchAll(/^- .+ \((\d+)\)$/gm)].reduce((n, m) => n + Number(m[1]), 0);

console.log('프롬프트 개수 정합성\n');

// 06 내부 정합: 목차 합계 == "총 N개"
check('06 "총 N개"', official, Number(doc06.match(/\*\*총 (\d+)개\*\*/)?.[1]),
      '06_Claude공식라이브러리.md');

// ── 표기 스캔: 아래 패턴이 나오는 곳은 전부, 몇 번 나오든 검사한다 ──
const SOURCES = [
  ...fs.readdirSync(ROOT).filter((f) => f.endsWith('.md')),
  '.vitepress/config.ts',
];
// 패턴은 **좁게** 잡는다. 넓게 잡으면 무관한 문장을 물어 가짜 실패를 내고,
// 가짜 실패가 몇 번 나면 사람이 이 테스트를 무시하기 시작한다 — 없느니만 못해진다.
// 실제로 초기 버전이 04의 "1,913개 중"(원본 코퍼스 크기)과
// "실무 15선"(카테고리 소제목)을 물었다. 둘 다 여기서 세는 숫자가 아니다.
const PATTERNS = [
  { re: /갤러리 (\d+)선/g,             actual: gallery, label: '갤러리 N선' },
  { re: /총 \*\*(\d+)개\*\*/g,         actual: gallery, label: '04 총 N개', only: '04_프롬프트갤러리.md' },
  { re: /한글 실무 (?:프롬프트 )?(\d+)선/g, actual: korean, label: '한글 실무 N선' },
  { re: /(\d+)개만 모은/g,             actual: mine,    label: '내프롬프트 N개' },
  // "N개 중"은 00 머리말의 전체 합계에만 해당한다(04엔 원본 코퍼스의 "1,913개 중"이 있다).
  { re: /(?<![\d,])(\d+)개 중/g, actual: gallery + korean + official,
    label: '전체 N개 중', only: '00_내프롬프트.md' },
];

let scanned = 0;
for (const file of SOURCES) {
  const text = read(file);
  for (const { re, actual, label, only } of PATTERNS) {
    if (only && only !== file) continue;
    for (const m of text.matchAll(re)) {
      check(`${label}`, actual, Number(m[1]), file);
      scanned += 1;
    }
  }
}

if (!scanned) {
  console.error('\n❌ 표기를 하나도 못 찾았다 — 정규식이 문서와 어긋났을 가능성이 크다.');
  process.exit(1);
}

if (fails.length) {
  console.error(`\n❌ ${fails.length}건 불일치:\n` + fails.map((f) => '  · ' + f).join('\n'));
  process.exit(1);
}
console.log(
  `\n✅ 표기 ${scanned}곳 전부 일치 ` +
  `(갤러리 ${gallery} · 한글 ${korean} · 내프롬프트 ${mine} · 공식 ${official} · 합 ${gallery + korean + official})`);
