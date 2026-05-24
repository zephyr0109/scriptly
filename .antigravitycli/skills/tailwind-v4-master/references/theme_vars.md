# Tailwind v4 테마 변수 가이드

v4에서는 CSS 변수를 사용하여 테마를 커스텀합니다.

## 기본 테마 오버라이드 (@theme)
```css
@theme {
  /* 색상 정의 */
  --color-brand-50: #f0f9ff;
  --color-brand-500: #0ea5e9;
  --color-brand-900: #0c4a6e;

  /* 글꼴 정의 */
  --font-heading: "Montserrat", sans-serif;
  --font-body: "Pretendard", system-ui;

  /* 간격 및 제약 조건 */
  --spacing-18: 4.5rem;
  --breakpoint-3xl: 1920px;
}
```

## CSS 변수 직접 사용
Tailwind 클래스로 생성된 모든 테마 값은 표준 CSS 변수로도 사용 가능합니다.
- `bg-brand-500` -> `var(--color-brand-500)`

## Scriptly 전용 추천 변수
| 변수명 | 용도 | 추천 값 |
| :--- | :--- | :--- |
| `--color-script-primary` | 메인 브랜드 컬러 | `#1A1A1A` |
| `--color-script-accent` | 강조 컬러 | `#FF3B30` |
| `--font-script-drama` | 시나리오/대본용 폰트 | `"Courier Prime", serif` |
