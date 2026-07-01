# GGT Launch KPI Portal v5.1

React + TypeScript + Vite + Supabase 기반의 GGT 모바일게임 런칭 성과 비교 포탈입니다.

## v5.1 핵심 추가

- Admin → Excel Import 기능 추가
- GGT KPI 엑셀의 `ALL KPI 비교`, `사전예약`, `1M Retention` 시트 자동 분석
- 분석 결과 미리보기 후 Supabase DB 저장
- 기존 데이터는 `game code + period` 기준으로 업데이트
- 모든 금액 KPI는 USD 기준으로 저장/표시
- 기본 환산 기준: `1 USD = 1,300 KRW`

## Vercel 환경변수

Vercel Project → Settings → Environment Variables에 아래 2개를 등록합니다.

```env
VITE_SUPABASE_URL=https://zfuedujahlomkufaeuja.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_여기에_입력
```

등록 후 반드시 Redeploy 하세요.

## Supabase 준비

이미 테이블을 만들었다면, Excel Import 저장을 위해 SQL Editor에서 아래 파일 내용만 한 번 실행하세요.

```text
supabase/import_policies.sql
```

처음부터 새로 만드는 경우에는 아래 순서로 실행합니다.

1. `supabase/schema.sql`
2. Vercel 배포 후 Admin → Excel Import에서 엑셀 업로드

## 사용 방법

1. Vercel 배포 완료
2. 좌측 메뉴 `Admin` 클릭
3. KPI Excel 파일 선택
4. 분석 결과 미리보기 확인
5. `Supabase DB 저장` 클릭
6. Dashboard로 돌아가면 Supabase DB 데이터가 표시됩니다.

## 로컬 실행

```bash
npm install
npm run dev
```

## 배포 방법

GitHub에 파일 업로드/커밋하면 Vercel이 자동으로 배포합니다.
