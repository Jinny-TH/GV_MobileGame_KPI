# GGT Launch KPI Portal v2.0

정식 버전 방향으로 재구성한 모바일게임 런칭 성과 비교 포탈입니다.

## v2.0 반영 내용
- 모든 금액 KPI 표시 기준을 USD로 통일
- Dashboard / Game Library / Game Detail / Comparison / Ranking / Retention / Admin 구조 재설계
- Retention을 핵심 메뉴로 승격
- Game Detail에 Lessons Learned 영역 추가
- GGT 사업부 내부 제품 느낌으로 UI 개선

## 데이터 기준
- Revenue / ARPU / ARPPU / UA Cost / CPI: USD
- DAU / DNU / PU: Count
- PUR / Retention: %
- Period: 1day, 10days, 15days, 30days, 60days

## 중요 메모
현재 원본 파일의 `1M Retention` 시트에는 D1/D3/D7/D14 헤더는 있으나 실제 값이 비어 있습니다. 정식 운영 전 리텐션 데이터를 추가 매핑해야 합니다.

현재 v2.0 프로토타입은 `ALL KPI 비교` 시트의 KRW 매출을 1 USD = 1,300 KRW 임시 기준으로 정규화했습니다. 다음 Sprint에서는 개별 게임 시트의 원천 USD 컬럼을 우선 매핑하는 방식으로 보강하는 것을 권장합니다.
