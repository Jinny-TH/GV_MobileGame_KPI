# GGT Launch KPI Portal v4.0

React + Vite + Supabase 정식 구조입니다.  
기존 `supabase/config.js` 방식은 제거했고, Vercel Environment Variables를 사용합니다.

## 1. 설치

```bash
npm install
npm run dev
```

## 2. 로컬 환경변수

`.env.example`을 복사해서 `.env.local`을 만듭니다.

```bash
cp .env.example .env.local
```

`.env.local` 내용:

```env
VITE_SUPABASE_URL=https://zfuedujahlomkufaeuja.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_여기에_입력
```

## 3. Vercel 환경변수

Vercel Project → Settings → Environment Variables에서 아래 2개를 등록하세요.

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Secret key는 절대 넣지 않습니다.

## 4. Supabase SQL

`supabase/schema.sql` 실행 후 `supabase/seed_from_excel.sql`을 실행하면 초기 데이터가 들어갑니다.

## 5. 동작 방식

- 환경변수가 정상이고 DB 데이터가 있으면 Supabase 데이터를 표시합니다.
- 환경변수가 없거나 DB가 비어 있으면 내장 샘플 데이터로 자동 표시합니다.
- 모든 금액 KPI는 USD 기준입니다.
