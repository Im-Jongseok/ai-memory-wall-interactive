# 구조

## 화면과 데이터

```text
papers/<id>/paper.ts + scenes.ts + public/papers/<id>/
                         ↓
                    registry.ts
                         ↓
               App → Presentation
                         ↓
          Layout · Viewer · Explanation · Controls
```

- `app/`: 라우팅, 현재 장면·단계, 키보드 조작을 관리한다.
- `components/layout/`: 공통 화면 배치와 설명·버튼·대화상자를 구성한다.
- `features/paper/`: 원문 카메라, 확대·이동, 블러와 강조를 처리한다.
- `features/hbm/`: Three.js 모형과 카메라·라벨·데이터 이동을 처리한다.
- `features/industry/`: 공통 진입점과 Cerebras·PIM·CXMT별 폴더를 둔다. 각 폴더에 화면, 설명, 상태, 스타일을 함께 보관한다.
- `papers/`: 논문 정보, 원문 좌표, 발표 문구와 생성된 모형 데이터를 보관한다.

React는 발표 상태와 화면 구성을 관리한다. 프레임별 원문·모형 애니메이션은 별도 엔진에서 처리한다. 기존 JS 엔진은 `.d.ts`로 호출 경계를 명시하며 내부 JS 전체가 타입 검사되는 것은 아니다.

## 생성·배포

- `scripts/models/`: Anatomy로 모형 데이터를 생성하고 기하를 검사한다. 실행 위치와 무관하게 프로젝트 경로를 기준으로 파일을 읽고 쓴다.
- `scripts/vendor/anatomy/`: 외부 도구 원본과 MIT 라이선스를 보관한다. 원본 커밋은 `1482e8469b0a9e0d8cc18ea2740a01423d29ae80`이다.
- `npm run build`: 모형 생성, 타입 검사, Vite 빌드, 단일 HTML 내보내기를 실행한다.
- `dist/`: GitHub Pages에 배포하는 웹 빌드다. Git에서 추적하지 않는다.
- `scripts/export-standalone.mjs`: 같은 앱과 선택한 논문의 이미지·PDF를 하나의 오프라인 HTML로 묶는다.

서버 기능이 없는 정적 발표 앱이므로 React + TypeScript + Vite를 사용한다. 인증·서버 API가 필요한 시점에 서버 프레임워크 도입을 검토한다.
