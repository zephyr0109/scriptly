---
name: pydantic-ts-bridge
description: FastAPI의 Pydantic 모델과 Next.js의 TypeScript 인터페이스 간의 타입 일관성을 유지하고 불일치를 탐지합니다.
---

# Pydantic-TS 브릿지 (Pydantic-TS Bridge)

## 개요
이 스킬은 백엔드(Python)와 프론트엔드(TypeScript) 간의 데이터 스키마 불일치로 인한 런타임 에러를 방지합니다. Pydantic 모델 변경 시 관련 TypeScript 타입을 업데이트하거나 검증하는 역할을 합니다.

## 주요 작업 가이드

### 1. 타입 동기화
- **스키마 매핑**: `app/domain/schemas.py`의 모델이 `scriptly-web/src/lib/api.ts` 또는 관련 타입 정의 파일에 정확히 반영되었는지 확인합니다.
- **필드 불일치**: 필드 이름, 선택적 필드(`Optional`), 열거형(`Enum`) 값의 일치 여부를 대조합니다.

### 2. API 연동 검증
- BFF(Next.js API Routes)에서 데이터 변환 시 타입 안전성이 유지되는지 확인합니다.

## 작업 원칙
- **Single Source of Truth**: 가능한 한 백엔드 모델을 기준으로 프론트엔드 타입을 정의합니다.
- **자동화 제안**: 타입 정의가 반복될 경우 자동 생성 도구 도입을 검토하거나 가이드를 제공합니다.
