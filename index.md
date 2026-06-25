---
layout: page
title: 프롬프트 엔지니어링
sidebar: false
aside: false
---

<div class="pe-landing">

<header class="pe-masthead">
  <p class="pe-kicker">Anthropic 공식 가이드 · 작업용 레퍼런스</p>
  <h1 class="pe-title">프롬프트<br><em>엔지니어링</em></h1>
  <p class="pe-lede">골격은 빌려오고, 빈칸은 내 맥락으로. 템플릿을 그대로 복붙하면 AI slop이 나온다 — 내 프로젝트의 성공 기준·제약·예시가 들어가야 결과가 산다.</p>
  <div class="pe-actions">
    <a class="pe-btn pe-btn-primary" href="./00_내프롬프트.html">⭐ 내 프롬프트 →</a>
    <a class="pe-btn" href="./01_핵심원칙.html">핵심 원칙</a>
    <a class="pe-btn" href="./templates/작업지시.html">템플릿 쓰기</a>
  </div>
</header>

<div class="pe-bento">
  <nav class="pe-bento-links" aria-label="섹션 바로가기" style="display: contents">
    <a class="pe-cell pe-cell-lead" href="./00_내프롬프트.html">
      <span class="pe-cell-no" aria-hidden="true">★</span>
      <h2>내 프롬프트</h2>
      <p>매일 손이 가는 12개만 모은 단축 페이지. 요약·코드리뷰·디버깅·PRD·번역·레드팀 — 복사 버튼으로 바로 가져다 쓴다.</p>
      <span class="pe-cell-tag">즐겨찾기 · 복붙용</span>
    </a>
    <a class="pe-cell" href="./01_핵심원칙.html">
      <span class="pe-cell-no" aria-hidden="true">01</span>
      <h2>핵심 원칙</h2>
      <p>전 모델 공통 핵심 기법 10가지. 명확한 지시·맥락·예시·XML 태그·자기검증을 한국어로 압축했다.</p>
      <span class="pe-cell-tag">10 기법 · 전 모델 공통</span>
    </a>
    <a class="pe-cell" href="./02_체크리스트.html">
      <span class="pe-cell-no" aria-hidden="true">02</span>
      <h2>체크리스트</h2>
      <p>작성 전·중·후 점검 + 결과가 어긋날 때 디버깅 순서.</p>
      <span class="pe-cell-tag">점검 · 디버깅</span>
    </a>
    <a class="pe-cell" href="./03_최신모델_주의점.html">
      <span class="pe-cell-no" aria-hidden="true">03</span>
      <h2>최신 모델 주의점</h2>
      <p>Opus 4.x · Fable 5의 과잉행동·adaptive thinking·prefill 폐지.</p>
      <span class="pe-cell-tag">Opus 4.x · Fable 5</span>
    </a>
    <a class="pe-cell" href="./templates/작업지시.html">
      <span class="pe-cell-no" aria-hidden="true">T</span>
      <h2>템플릿</h2>
      <p>빈칸만 채우는 재사용 골격 — 작업지시·문서분석·리서치·자기검증.</p>
      <span class="pe-cell-tag">빈칸 채우기</span>
    </a>
    <a class="pe-cell" href="./examples/주식차트_만들기.html">
      <span class="pe-cell-no" aria-hidden="true">E</span>
      <h2>예시</h2>
      <p>같은 골격을 실제 프로젝트 맥락으로 채운 실증.</p>
      <span class="pe-cell-tag">내 맥락 적용</span>
    </a>
  </nav>
  <blockquote class="pe-cell pe-cell-quote" role="note">
    <span class="pe-q-label" aria-hidden="true">황금률</span>
    <p>맥락 없는 동료에게 프롬프트를 보여주고 따라하게 했을 때 헷갈린다면, Claude도 헷갈린다.</p>
  </blockquote>
</div>

<div class="pe-prose vp-doc">

## 시작하기 전 — Anthropic 전제 3가지

프롬프트를 만지기 전에 이게 먼저다. 이게 없으면 프롬프트 튜닝은 헛돈다.

1. **성공 기준**을 명확히 정의했는가? ("이게 되면 성공이다")
2. 그 기준을 **경험적으로 테스트**할 방법이 있는가?
3. 개선할 **초안 프롬프트**가 있는가?

> 비용·지연시간 문제는 프롬프트가 아니라 **모델 교체**로 푸는 게 빠를 때가 많다.

## 쓰는 법

1. 새 작업이 생기면 → **템플릿**에서 맞는 골격을 복사
2. <code v-pre>{{빈칸}}</code>을 내 맥락(성공 기준, 제약, 예시)으로 채움
3. **체크리스트**로 빠진 것 점검
4. 결과가 어긋나면 → **핵심 원칙**에서 해당 기법 재확인

</div>
</div>
