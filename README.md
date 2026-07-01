# GGT Launch KPI Portal v5.0

정식 운영을 위한 React + TypeScript + Supabase 기반 구조입니다.

## 핵심 변경

- 기존 HTML/CSS/JS 단일 파일 구조 종료
- React + Vite + TypeScript 프로젝트로 전환
- Vercel Environment Variables 기반 Supabase 연결
- `config.js` 방식 완전 제거
- Supabase DB 연결 성공 시 DB 데이터 표시
- DB 연결 실패 또는 데이터 없음 시 샘플 데이터 자동 표시
- 모든 금액 KPI는 USD 기준

## Vercel 환경변수

Vercel Project → Settings → Environment Variables에 아래 2개를 등록합니다.

```env
VITE_SUPABASE_URL=https://zfuedujahlomkufaeuja.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_여기에_입력
```

등록 후 반드시 Redeploy 하세요.

## Supabase 초기화

Supabase SQL Editor에서 아래 순서대로 실행합니다.

1. `supabase/schema.sql`
2. `supabase/seed_from_excel.sql`

## 로컬 실행

```bash
npm install
npm run dev
```

## 배포 방법

GitHub 저장소의 기존 HTML 파일을 이 프로젝트 파일로 교체한 뒤 push하면 Vercel이 자동 배포합니다.

## 다음 Sprint

- Game Detail DB 조인 완성
- Comparison 차트 완성
- Retention 데이터 입력/관리
- Admin Excel Upload
- Login / Role 권한관리
