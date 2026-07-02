# GGT Launch KPI Portal v6.0

React + TypeScript + Vite + Supabase 기반 정식 개발 구조입니다.

## v6.0 핵심 변경

- Supabase 연결 로직을 전면 재작성했습니다.
- Vercel 환경변수 읽기 실패 시 Settings에서 브라우저 연결 설정으로 임시 연결할 수 있습니다.
- `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_KEY`를 모두 인식합니다.
- Admin Excel Import 저장 로직이 동적으로 Supabase Client를 생성하도록 수정했습니다.
- Settings에서 Supabase 연결 테스트를 직접 실행할 수 있습니다.

## Vercel 환경변수

아래 2개를 등록합니다.

```text
VITE_SUPABASE_URL=https://zfuedujahlomkufaeuja.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

등록 후 반드시 Vercel에서 Redeploy 해야 합니다.

## Supabase SQL

처음 1회 실행:

```text
supabase/schema.sql
```

Excel Import 저장 권한이 필요할 경우 실행:

```text
supabase/import_policies.sql
```

## 배포 방법

1. 이 폴더 안의 파일 전체를 GitHub 저장소 루트에 업로드
2. Commit
3. Vercel 자동 배포 확인
4. Settings 메뉴에서 연결 상태 테스트
5. Admin 메뉴에서 Excel 업로드 후 Supabase DB 저장
