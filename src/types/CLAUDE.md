# 타입 모듈 / Types Module

## 역할 / Role
애플리케이션 전반에 걸쳐 공유되는 TypeScript 타입 정의.
(TypeScript type definitions shared across the application.)

## 규칙 / Rules
- 가능한 경우 타입을 해당 도메인과 함께 배치
  (Keep types co-located with their domain when possible)
- 여러 모듈에 걸쳐 사용되는 공유 타입은 이 디렉토리에 배치
  (Shared types that span multiple modules belong here)
- 객체 형태에는 interface, 유니온/기본 타입에는 type alias 사용
  (Use interfaces for object shapes, type aliases for unions/primitives)
