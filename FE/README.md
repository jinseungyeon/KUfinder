# KU Finder Frontend Starter

KU-finder 프론트 프로토타입입니다.

## 실행

```bash
npm install
npm run dev
```

기본 주소는 Vite가 출력하는 로컬 주소(보통 `http://localhost:5173`)입니다.

## 포함된 화면

- `/` 메인
- `/map` 습득 위치 지도(현재는 mock map)
- `/found/register` 습득물 등록
- `/lost/register` 분실물 찾기 등록
- `/matching` AI 매칭 진행 화면
- `/matches/demo` 매칭 후보 확인
- `/matches/demo/confirm` 실제 사진 확인
- `/complete` 연락/보관 장소 확인

## 백엔드 연결

현재 API 함수는 `src/api/items.ts`, `src/api/matching.ts`에 기본 형태만 만들어 두었습니다.
Mock 모드로 바로 실행되며, 백엔드가 준비되면 `VITE_API_BASE_URL`을 지정하고 해당 함수의 fetch 부분을 사용하면 됩니다.

## 지도 연결

현재 `src/components/CampusMap.tsx`는 디자인/동작 확인용 mock 지도입니다.
실제 서비스에서는 Kakao Maps SDK 또는 다른 지도 SDK로 교체하고, `FoundItem.foundLocation`의 위도/경도를 마커에 연결하면 됩니다.

## 수정하기 좋은 위치

- 브랜드/색상: `tailwind.config.js`, `src/index.css`
- 카테고리: `src/types/item.ts`
- mock 데이터: `src/mock/items.ts`
- 화면: `src/pages/*`
- 공통 UI: `src/components/*`
