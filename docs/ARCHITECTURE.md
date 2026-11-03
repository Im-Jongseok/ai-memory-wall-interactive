# 구조와 기술 선택

## 결정

공통 화면과 논문별 자료를 분리하기 위해 **React + TypeScript/TSX + Vite**를 사용한다. Next.js는 도입하지 않는다. 서버 기능이 없는 현재의 정적 발표·오프라인 HTML 요구를 유지한다.

| 기술       | 판단 | 이 프로젝트에서의 역할                                                 |
| ---------- | ---- | ---------------------------------------------------------------------- |
| React      | 도입 | 레이아웃·설명·목록·대화상자를 컴포넌트로 재사용하고 논문별 상태를 분리 |
| TypeScript | 도입 | 페이지 번호·장면 종류·ROI·선택 기능의 형식을 검사                      |
| TSX        | 도입 | React 화면을 작성하는 TypeScript 구문. 별도의 프레임워크가 아님        |
| Vite       | 도입 | 로컬 개발·정적 배포 번들·동일 소스의 오프라인 내보내기                 |
| Next.js    | 보류 | 서버 렌더링·인증·서버 API·서버 데이터 관리가 필요한 시점에 재검토      |

Next.js도 정적 내보내기를 지원한다. 다만 현재 요구인 `file://` 단일 HTML 발표를 위해 필요한 기술은 아니므로, 여러 논문을 추가한다는 이유만으로 도입하지 않는다.

공식 근거: [React의 앱 구성 선택](https://react.dev/learn/creating-a-react-app), [Vite 가이드](https://vite.dev/guide/), [TypeScript의 JSX/TSX](https://www.typescriptlang.org/docs/handbook/jsx.html), [Next.js 정적 내보내기](https://nextjs.org/docs/app/guides/static-exports). 기술 선택 자체는 이 프로젝트의 요구를 바탕으로 한 판단이다.

## 책임과 데이터 흐름

```text
papers/*/paper.ts + scenes.ts + public/papers/*
                 ↓
registry.ts → App / 라우팅 → Presentation (발표 상태·키보드)
                                  ↓
                PresentationLayout (배치만 담당)
                 ├─ PaperStage → PaperEngine (카메라·원문 이미지·강조)
                 ├─ HbmPanel   → HbmEngine (선택 기능, 지연 로드)
                 ├─ ExplanationPanel (문구·노트·원문 링크)
                 └─ Controls / Dialogs
```

- 논문은 뷰어의 클래스·DOM·카메라를 직접 다루지 않는다. 자료와 기능 설정을 전달한다.
- React는 화면 구성·발표 상태를 담당한다. 카메라·WebGL의 프레임별 좌표는 React state에 넣지 않는다.
- 원문·HBM 엔진은 모듈 인스턴스로 생성한다. `window.REVIEW_SCENES`, `window.HBMModel`, 전체 문서에서 찾는 고정 모델 상태를 없앴다.
- 각 엔진의 이벤트·관찰자·애니메이션·GPU 리소스는 화면을 떠날 때 정리한다. 다른 논문으로 전환해도 이전 논문의 상태가 남지 않게 한다.
- `PaperDefinition`·장면 데이터·React 코드는 TypeScript로 검사한다. 기존 카메라·3D 엔진의 내부 JS는 동작 보존을 위해 유지하고 `.d.ts`로 호출 경계를 명시한다. 전체 코드가 TypeScript로 전환된 것은 아니다.
- Three.js는 HBM이 활성화될 때 동적으로 로드한다. HBM이 없는 논문은 해당 기능을 생성하지 않는다.
- HBM은 `model.js`(도형 조립), `label-layout.js`(라벨 선 배치), `explanation.js`(우측 단계·도해), `hbm-engine.js`(카메라·재생·생명주기)로 나눈다. 라벨 위치를 수정하기 위해 도형이나 애니메이션 코드를 수정할 필요가 없다.
- 논문 등록 시 중복 ID, 없는 페이지·별칭 목적지, 잘못된 강조 좌표, 빠진 선택 기능을 검사한다.
- CSS는 원문·설명·레이아웃·대화상자·반응형·HBM으로 나눈다. 기존 스타일 우선순위와 화면 배치를 유지했다.

## 두 가지 배포

`npm run build`는 웹용 `dist/`와 기존 단일 HTML을 함께 생성한다. 웹은 정적 서버에서 여러 논문을 선택하고, 오프라인 HTML은 선택한 논문의 이미지·PDF·필요 자산을 데이터 URL로 내장한다. 두 출력 모두 `src/`의 같은 컴포넌트와 엔진을 사용한다. `window.__PAPER_EXPORT__`는 내보내기 시 선택된 논문 ID와 내장 자산을 전달하는 읽기 전용 부트스트랩 설정이다.

## Next.js를 재검토할 조건

공개 검색에 맞춘 논문별 서버 렌더링, 사용자 계정과 개인별 노트 저장, 공유·접근 권한, 서버에서 PDF 업로드·처리 등이 제품 요구로 생길 때 재검토한다. 그때도 `papers/` 데이터 계약과 발표 기능 컴포넌트를 재사용할 수 있도록 화면·자료·렌더러를 분리해 둔다.
