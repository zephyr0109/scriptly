---
name: tailwind-v4-master
description: Tailwind CSS v4를 사용하여 현대적이고 고성능의 UI를 구축합니다. CSS-first 설정, v4 신기능 적용, CDN/NPM 셋업 및 Scriptly 디자인 시스템 테마 정의 시 사용합니다.
---

# Tailwind CSS v4 마스터 (Tailwind-v4-master)

## 개요
이 스킬은 Tailwind CSS v4의 새로운 아키텍처를 활용하여 빠르고 일관된 UI를 구축하기 위한 가이드를 제공합니다. v4는 JavaScript 설정 파일 대신 CSS 내에서 직접 테마를 정의하는 CSS-first 방식을 지향하며, 강력한 성능 최적화를 제공합니다.

## 퀵 스타트 (Quick Start)

### 1. 개발/테스트용 (CDN)
간단한 프로토타입이나 HTML 파일에서 즉시 사용 시:
```html
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
```

### 2. 프로젝트용 (NPM/Vite/Next.js)
```bash
npm install tailwindcss@next @tailwindcss/postcss@next
```
`globals.css` 상단에 다음과 같이 추가:
```css
@import "tailwindcss";
```

## 주요 기능 및 설정 가이드

### 1. CSS-first 테마 설정 (@theme)
v4에서는 `tailwind.config.js` 대신 CSS 파일 내의 `@theme` 블록에서 테마를 정의합니다.
```css
@theme {
  --color-primary: #3b82f6;
  --font-sans: "Pretendard", sans-serif;
  --spacing-13: 3.25rem;
}
```

### 2. v4 신규 기능 활용
- **Container Queries**: `@container` 클래스를 사용하여 부모 요소 크기에 반응하는 UI 구현.
- **Dynamic Gradients**: 보다 정교한 그라데이션 및 믹싱 지원.
- **Improved Performance**: 빌드 속도 및 런타임 성능 대폭 향상.

### 3. Scriptly 디자인 시스템 적용
- 프로젝트 전체의 일관성을 위해 `globals.css`에 Scriptly 전용 색상 및 간격 변수를 정의하세요.
- 상세한 변수 목록은 `references/theme_vars.md`를 참고하세요.

## 작업 원칙
- **Utility-First**: 가능한 기본 유틸리티 클래스를 우선 사용합니다.
- **Semantic Theme**: 색상이나 간격은 의미 있는 이름(예: `--color-brand-primary`)으로 변수화하여 관리합니다.
- **Keep it Simple**: v4의 Zero-config 철학에 따라 불필요한 복잡한 설정은 지양합니다.

## 문제 해결
- 스타일이 반영되지 않을 때: CSS 파일 내 `@import "tailwindcss";`가 최상단에 있는지 확인하세요.
- 상세한 마이그레이션 가이드는 `references/migration.md`를 참고하세요.
