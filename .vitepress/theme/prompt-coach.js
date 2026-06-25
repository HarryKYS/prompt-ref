// 프롬프트 코치 위젯 — 무료·오프라인(file://·mpa 무하이드레이션)에서도 동작.
// config.ts head에 인라인으로 박혀 모든 페이지에서 1회 실행되며,
// 이벤트 위임으로 .pc 위젯의 버튼을 처리한다. (Vue 하이드레이션 불필요)
(function () {
  function has(t, arr) {
    var l = t.toLowerCase();
    return arr.some(function (k) {
      return l.indexOf(k.toLowerCase()) >= 0;
    });
  }

  function buildCoach(body) {
    body = body && body.trim() ? body.trim() : '[여기에 거칠게 적기]';
    return [
      '너는 깐깐한 프롬프트 코치다. 내가 거칠게 쓴 프롬프트를 받아서,',
      '먼저 가르치고(첨삭), 맨 마지막에 완성본을 준다. 이 순서를 지켜라.',
      '',
      '1. 진단 — 원본의 치명적 약점 3가지: "무엇이 / 왜 약한지" + 고치는 법 한 줄',
      '2. 빠진 정보 — 채워야 할 빈칸 목록 (기본값은 [가정]으로 먼저 채워서)',
      '3. 한 줄 코칭 — "다음엔 이것만 기억해라" 핵심 1가지',
      '4. 완성 프롬프트 (★맨 마지막) — 7블록으로 다시 쓴 최종본:',
      '   <role> <context> <task> <requirements> <constraints> <success_criteria> <verify>',
      '',
      '규칙: AI 상투어 금지. 모호함은 구체값으로. 가정은 [가정] 표시.',
      '내 원본 프롬프트: "' + body + '"',
    ].join('\n');
  }

  // 도메인별 기본값 — 거친 한 줄에서 분야를 감지해 7블록 빈칸을 [가정]으로 채운다.
  // 전부 규칙 기반(키워드 매칭)이라 API·과금 없이 오프라인에서 동작한다.
  var DOMAINS = [
    { id: '마케팅', k: ['마케팅', '카피', '광고', '문구', '홍보', '세일즈', '전환', '캠페인', '인스타', 'sns', '상세페이지', '브랜드', '슬로건'],
      role: '전환율로 검증받는 퍼포먼스 카피라이터',
      ctx: '[가정: 사회초년생 대상 인스타 광고]. 스크롤을 멈추게 해 행동을 유도한다.',
      req: ['타깃의 불편을 한 줄로 짚고 → 해결 → CTA 순서', '[가정: 장당 15자 이내], 친근한 톤', '같은 톤의 대안 버전 1세트 추가'],
      cons: '과장·근거 없는 수치 금지.',
      succ: '첫 문장만 봐도 누구를 위한 것인지 [가정: 3초] 내 이해되면 성공.' },
    { id: '개발', k: ['코드', '함수', '버그', '구현', '리팩', 'api', '컴포넌트', '프로그램', '앱', '파이썬', '자바', '리액트', 'sql', '자동화', '스크립트', '알고리즘'],
      role: '프로덕션 코드를 책임지는 시니어 엔지니어',
      ctx: '[가정: 개인 프로젝트]에서 쓸 기능. 유지보수와 가독성이 중요하다.',
      req: ['[가정: 언어/스택을 한 줄로 명시]', '입력 검증과 에러 처리 포함', '실행 가능한 완결된 코드 + 사용 예시'],
      cons: '오버엔지니어링 금지. 외부 유료 API 금지.',
      succ: '복사해서 바로 실행되고 [가정: 핵심 케이스]를 통과하면 성공.' },
    { id: '글쓰기', k: ['글', '에세이', '블로그', '기사', '대본', '소개', '자기소개', '보고서', '후기', '리뷰', '편지', '이메일', '메일'],
      role: '독자를 끝까지 읽게 만드는 전문 작가',
      ctx: '[가정: 일반 독자] 대상, [가정: 블로그] 게시용.',
      req: ['[가정: 800자 내외] 분량', '도입–전개–마무리 구조', '구체적 예시 1개 이상'],
      cons: 'AI 상투어(~의 세계, 혁신적인) 금지. 빈말 금지.',
      succ: '끝까지 읽히고 핵심 메시지가 한 줄로 남으면 성공.' },
    { id: '분석', k: ['분석', '리서치', '조사', '비교', '요약', '정리', '평가', '검토', '데이터', '시장', '인사이트'],
      role: '근거로 말하는 리서치 분석가',
      ctx: '[가정: 의사결정 참고]용. 결론이 행동으로 이어져야 한다.',
      req: ['출처/근거 명시', '표 또는 불릿으로 구조화', '마지막에 핵심 결론 3줄'],
      cons: '추측을 사실처럼 쓰지 말 것. 불확실하면 [불확실] 표기.',
      succ: '읽고 바로 다음 행동을 정할 수 있으면 성공.' },
    { id: '번역', k: ['번역', 'translate', '영어로', '한글로', '일본어', '중국어', '통역'],
      role: '맥락과 뉘앙스를 살리는 전문 번역가',
      ctx: '[가정: 실무] 맥락. 직역이 아니라 자연스러운 번역이 필요하다.',
      req: ['원문 의미 보존 + 자연스러운 표현', '[가정: 격식체] 톤 유지', '애매한 부분은 대안 번역 병기'],
      cons: '기계적 직역 금지.',
      succ: '원어민이 읽어도 어색하지 않으면 성공.' },
    { id: '학습', k: ['설명', '가르쳐', '알려줘', '이해', '개념', '정리해', '강의', '튜토리얼', '쉽게'],
      role: '어려운 걸 쉽게 풀어주는 교사',
      ctx: '[가정: 입문자] 대상. 비유와 예시로 직관을 잡아준다.',
      req: ['핵심 개념 → 비유 → 예시 순서', '[가정: 5분 분량]', '마지막에 한 줄 요약'],
      cons: '전문용어 남발 금지. 모르면 모른다고 할 것.',
      succ: '입문자가 한 번 읽고 핵심을 남에게 설명할 수 있으면 성공.' },
  ];

  var FALLBACK = {
    id: '일반', role: '해당 분야 전문가',
    ctx: '[가정: 실무에서 바로 쓸 결과물]이 필요하다.',
    req: ['[가정: 출력 형식 — 표/불릿/글 중 택1]', '구체적이고 실행 가능하게', '예시 1개 포함'],
    cons: 'AI 상투어 금지. 모호함은 구체값으로.',
    succ: '그대로 복사해 바로 쓸 수 있으면 성공.',
  };

  // 가중치 점수제 — 키워드 매칭 "개수"가 가장 많은 도메인을 고른다.
  // (이전엔 첫 매칭만 골라 "마케팅 코드 짜줘"가 무조건 마케팅이 됐다.)
  // 동점이면 DOMAINS 앞 순서를 유지(strict > 비교)해 결정론적으로 동작한다.
  function detect(t) {
    var l = (t || '').toLowerCase();
    var best = null, bestScore = 0;
    for (var i = 0; i < DOMAINS.length; i++) {
      var score = DOMAINS[i].k.reduce(function (n, k) {
        return n + (l.indexOf(k.toLowerCase()) >= 0 ? 1 : 0);
      }, 0);
      if (score > bestScore) { bestScore = score; best = DOMAINS[i]; }
    }
    return best || FALLBACK;
  }

  // 규칙 기반 자동 완성 — 7블록 골격에 도메인 기본값과 [가정]을 채워 바로 쓸 형태로.
  function buildFinal(body) {
    body = body && body.trim() ? body.trim() : '[여기에 무엇을 원하는지 한 줄]';
    var d = detect(body);
    var lines = [];
    lines.push('<role> 너는 ' + d.role + '다.');
    lines.push('<context> ' + d.ctx);
    lines.push('<task> ' + body + ' — 위 맥락에 맞게 끝까지 완성한다.');
    lines.push('<requirements>');
    d.req.forEach(function (r, i) { lines.push('  ' + (i + 1) + '. ' + r); });
    lines.push('<constraints> ' + d.cons + ' 오버엔지니어링 금지.');
    lines.push('<success_criteria> ' + d.succ);
    lines.push('<verify> 끝내기 전 success_criteria에 비춰 자기검증 후 완료를 선언한다.');
    lines.push('');
    lines.push('※ 감지한 분야: ' + d.id + ' · [가정]으로 채운 칸은 네 상황에 맞게 고쳐 써라.');
    return lines.join('\n');
  }

  function run(widget) {
    var ta = widget.querySelector('.pc-input');
    var t = ((ta && ta.value) || '').trim();
    var words = t ? t.split(/\s+/).filter(Boolean).length : 0;
    var checks = [
      { k: '역할', ok: has(t, ['너는', '당신은', '역할', '전문가', 'act as', 'you are', 'assistant']), tip: '역할을 지정하면 톤·전문성이 잡힌다. 예: "너는 시니어 마케터다."' },
      { k: '맥락·이유', ok: has(t, ['왜', '때문', '위해', '목적', '용도', '어디', '대상', '독자', '상황', 'context', 'because']), tip: '왜/어디에 쓰는지 주면 모델이 일반화한다. 예: "사회초년생 대상 인스타 광고용."' },
      { k: '성공 기준', ok: has(t, ['성공', '기준', '되면', '조건', '검증', '목표', '평가', '이내', '개수', '글자', '단어']), tip: '"이게 되면 성공"을 검증 가능하게. 예: "3초 안에 이해되면 성공 / 15자 이내."' },
      { k: '출력 형식', ok: has(t, ['형식', '표', 'json', '불릿', '목록', '리스트', '줄', '단계', '코드', 'format', 'markdown']), tip: '원하는 형식을 지정. 예: "표로 / 불릿 5개 / JSON으로."' },
      { k: '구체성', ok: words >= 6 && t.length >= 15, tip: '너무 짧고 모호하다. 무엇을·어떻게·어떤 제약인지 한 문장이라도 더.' },
    ];
    var score = checks.filter(function (c) { return c.ok; }).length;
    var grade = score >= 5 ? { l: '탄탄함', t: 'good' } : score >= 3 ? { l: '보통 — 보강 추천', t: 'mid' } : { l: '약함 — 코치 필수', t: 'bad' };

    var html = '<div class="pc-score pc-' + grade.t + '"><strong>' + score + '/5</strong> · ' + grade.l + '</div><ul class="pc-checks">';
    checks.forEach(function (c) {
      html += '<li class="' + (c.ok ? 'pc-ok' : 'pc-miss') + '"><span class="pc-mark">' + (c.ok ? '✓' : '✗') + '</span><span class="pc-key">' + c.k + '</span>' + (c.ok ? '' : '<span class="pc-tip">' + c.tip + '</span>') + '</li>';
    });
    html += '</ul>';
    html += '<div class="pc-divider">완성 프롬프트 미리보기 · 규칙 기반 자동 채움</div>';
    html += '<p class="pc-lead">빈칸을 <code>[가정]</code>으로 채워 바로 쓸 수 있게 만들었습니다. 상황에 맞게 고쳐 그대로 복사해 쓰세요.</p>';
    html += '<textarea class="pc-final" rows="11" readonly></textarea>';
    html += '<div class="pc-final-actions"><button type="button" class="pc-btn pc-btn-copy" data-pc-copy="pc-final">완성 프롬프트 복사</button><button type="button" class="pc-btn pc-btn-copy" data-pc-save>⭐ 즐겨찾기 저장</button></div>';
    html += '<div class="pc-divider">더 깊은 첨삭이 필요하면</div>';
    html += '<p class="pc-lead">아래를 Claude/ChatGPT에 붙여넣으면 약점 진단부터 다시 해줍니다.</p>';
    html += '<textarea class="pc-output" rows="8" readonly></textarea><button type="button" class="pc-btn pc-btn-copy" data-pc-copy="pc-output">코치 프롬프트 복사</button>';

    var res = widget.querySelector('.pc-result');
    res.innerHTML = html;
    // 사용자 입력은 innerHTML이 아니라 .value로만 주입 (XSS 방지)
    res.querySelector('.pc-final').value = buildFinal(t);
    res.querySelector('.pc-output').value = buildCoach(t);
    res.style.display = 'block';
  }

  // 버튼 라벨을 잠깐 "✓ 복사됨"으로 바꿔 복원. textarea(out)의 .value를 복사.
  function copyText(btn, out) {
    if (!out) return;
    var orig = btn.getAttribute('data-label');
    if (!orig) { orig = btn.textContent; btn.setAttribute('data-label', orig); }
    var done = function () {
      btn.textContent = '✓ 복사됨';
      setTimeout(function () { btn.textContent = orig; }, 2000);
    };
    var fallback = function () {
      out.removeAttribute('readonly');
      out.focus();
      out.select();
      try { document.execCommand('copy'); } catch (e) {}
      out.setAttribute('readonly', 'true');
      done();
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(out.value).then(done, fallback);
        return;
      }
    } catch (e) {}
    fallback();
  }

  function copy(btn) {
    var widget = btn.closest('.pc');
    if (!widget) return;
    var sel = btn.getAttribute('data-pc-copy') || 'pc-output';
    copyText(btn, widget.querySelector('.' + sel));
  }

  // ── 즐겨찾기(localStorage) — 코치가 만든 완성 프롬프트를 저장/불러오기 ──
  // file://에서 localStorage가 막힌 브라우저도 있어 전부 try/catch로 감싼다.
  var STORE_KEY = 'pc-saved-v1';
  var STORE_CAP = 50;

  function loadSaved() {
    try {
      var v = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
      return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
  }
  function writeSaved(arr) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(arr)); return true; }
    catch (e) { return false; }
  }

  function saveCurrent(widget) {
    if (!widget) return;
    var fin = widget.querySelector('.pc-final');
    var inp = widget.querySelector('.pc-input');
    var btn = widget.querySelector('[data-pc-save]');
    if (!fin || !fin.value.trim()) return;
    var dm = '';
    var m = fin.value.match(/감지한 분야:\s*([^\s·]+)/);
    if (m) dm = m[1];
    var arr = loadSaved();
    arr.push({
      ts: Date.now(),
      domain: dm,
      input: ((inp && inp.value) || '').trim().slice(0, 80),
      prompt: fin.value,
    });
    if (arr.length > STORE_CAP) arr = arr.slice(arr.length - STORE_CAP);
    var ok = writeSaved(arr);
    if (btn) {
      var o = btn.getAttribute('data-label') || btn.textContent;
      btn.setAttribute('data-label', o);
      btn.textContent = ok ? '✓ 저장됨' : '저장 불가(브라우저)';
      setTimeout(function () { btn.textContent = o; }, 2000);
    }
    renderSavedAll();
  }

  function removeSaved(ts) {
    var arr = loadSaved().filter(function (x) { return String(x.ts) !== String(ts); });
    writeSaved(arr);
    renderSavedAll();
  }

  // 저장 목록을 [data-pc-saved] 컨테이너(00_내프롬프트 페이지)에 렌더.
  // data-pc-sig로 같은 데이터면 다시 안 그려 MutationObserver 루프를 막는다.
  function renderSavedInto(box) {
    var items = loadSaved();
    var sig = items.length + ':' + items.map(function (x) { return x.ts; }).join(',');
    if (box.getAttribute('data-pc-sig') === sig) return;
    box.setAttribute('data-pc-sig', sig);

    if (!items.length) {
      box.innerHTML =
        '<p class="pc-saved-empty">아직 저장한 프롬프트가 없습니다. ' +
        '<strong>메타 프롬프트(코치형)</strong> 페이지에서 ⭐ 버튼으로 저장하면 여기 모입니다.</p>';
      return;
    }

    box.innerHTML = '';
    items.slice().reverse().forEach(function (it) {
      var card = document.createElement('div');
      card.className = 'pc-saved-card';

      var head = document.createElement('div');
      head.className = 'pc-saved-head';
      var title = document.createElement('span');
      title.className = 'pc-saved-title';
      // 사용자 값은 textContent로만 (XSS 방지)
      title.textContent = (it.domain ? '[' + it.domain + '] ' : '') + (it.input || '(제목 없음)');
      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'pc-btn pc-btn-copy pc-saved-del';
      del.setAttribute('data-pc-del', String(it.ts));
      del.textContent = '삭제';
      head.appendChild(title);
      head.appendChild(del);

      var ta = document.createElement('textarea');
      ta.className = 'pc-final pc-saved-ta';
      ta.rows = 9;
      ta.readOnly = true;
      ta.value = it.prompt; // .value 주입 (XSS 방지)

      var copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'pc-btn pc-btn-copy';
      copyBtn.setAttribute('data-pc-copy-near', '1');
      copyBtn.textContent = '복사';

      card.appendChild(head);
      card.appendChild(ta);
      card.appendChild(copyBtn);
      box.appendChild(card);
    });
  }

  function renderSavedAll() {
    var boxes = document.querySelectorAll('[data-pc-saved]');
    for (var i = 0; i < boxes.length; i++) renderSavedInto(boxes[i]);
  }

  document.addEventListener('click', function (e) {
    if (!e.target || !e.target.closest) return;
    var r = e.target.closest('[data-pc-run]');
    if (r) { var w = r.closest('.pc'); if (w) run(w); return; }
    var sv = e.target.closest('[data-pc-save]');
    if (sv) { saveCurrent(sv.closest('.pc')); return; }
    var del = e.target.closest('[data-pc-del]');
    if (del) { removeSaved(del.getAttribute('data-pc-del')); return; }
    var cn = e.target.closest('[data-pc-copy-near]');
    if (cn) {
      var card = cn.closest('.pc-saved-card');
      copyText(cn, card && card.querySelector('textarea'));
      return;
    }
    var c = e.target.closest('[data-pc-copy]');
    if (c) { copy(c); }
  });

  // 초기 렌더 + SPA 라우트 변경 대응(MutationObserver). mpa(file://)는 매 페이지
  // 로드라 DOMContentLoaded로 충분하고, SPA는 새 컨테이너가 붙을 때 다시 그린다.
  function init() {
    renderSavedAll();
    try {
      new MutationObserver(function () { renderSavedAll(); })
        .observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
