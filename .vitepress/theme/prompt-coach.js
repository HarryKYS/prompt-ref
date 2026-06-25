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

  function detect(t) {
    var l = (t || '').toLowerCase();
    for (var i = 0; i < DOMAINS.length; i++) {
      if (DOMAINS[i].k.some(function (k) { return l.indexOf(k.toLowerCase()) >= 0; })) return DOMAINS[i];
    }
    return FALLBACK;
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
    html += '<textarea class="pc-final" rows="11" readonly></textarea><button type="button" class="pc-btn pc-btn-copy" data-pc-copy="pc-final">완성 프롬프트 복사</button>';
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

  function copy(btn) {
    var widget = btn.closest('.pc');
    if (!widget) return;
    var sel = btn.getAttribute('data-pc-copy') || 'pc-output';
    var out = widget.querySelector('.' + sel);
    if (!out) return;
    // 버튼별 원래 라벨을 기억해 복원 (완성/코치 두 버튼이 서로 안 섞이게)
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

  document.addEventListener('click', function (e) {
    if (!e.target || !e.target.closest) return;
    var r = e.target.closest('[data-pc-run]');
    if (r) { var w = r.closest('.pc'); if (w) run(w); return; }
    var c = e.target.closest('[data-pc-copy]');
    if (c) { copy(c); }
  });
})();
