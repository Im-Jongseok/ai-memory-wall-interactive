# 논문 추가

## 1. 원문 자료 보관

영문 소문자·숫자·하이픈으로 고유 ID를 정하고 `public/papers/<id>/`에 원문 PDF, 페이지 이미지, 썸네일을 넣는다. 원본 PDF는 별도 원문 폴더에도 보존한다. 이 앱은 PDF를 자동 분석하거나 이미지로 변환하는 도구가 아니다. 페이지 이미지와 리뷰 문구를 준비해 등록한다.

## 2. 설정 작성

`src/papers/_template/paper.example.ts`를 `src/papers/<id>/paper.ts`로 복사한다. `id`, 제목·저자·출처, PDF 경로, 내보내기 파일명을 실제 정보로 바꾼다. `registry.ts`는 `*/paper.ts`를 자동으로 찾으므로 목록 코드를 수정할 필요가 없다.

`pageSize`는 원문 페이지의 폭·높이다. 같은 논문의 페이지 비율이 동일한 경우를 지원한다. 페이지 크기가 섞인 PDF라면 먼저 동일한 캔버스 비율의 이미지로 정규화한다. `pages[].id`는 논문 내부 페이지 ID, `printedPage`는 화면에 표시할 실제 인쇄 페이지 번호다. 페이지 수나 첫 인쇄 번호가 7장·33쪽일 필요가 없다.

경로는 `public/`을 제외한 상대 경로로 작성한다. 예: `papers/example/page-1.webp`.

## 3. 장면 작성

장면이 많으면 `scenes.ts`로 분리해 `paper.ts`에서 import한다. `ReviewScene[]`에 `satisfies`를 사용하면 빠진 필드·잘못된 종류·4개 값이 아닌 ROI를 타입 검사로 찾을 수 있다.

```ts
import type { ReviewScene } from '../types';
export const scenes = [
  {
    id: 'fig1',
    kind: 'paper',
    page: 2,
    chapter: '실험 결과',
    label: 'FIGURE 1',
    title: '그림의 핵심 주장',
    stat: '',
    body: '원문에 근거한 한글 설명',
    note: '발표자 노트',
    roi: [0.1, 0.2, 0.9, 0.6],
    emphasis: [{ kind: 'box', rect: [0.2, 0.3, 0.5, 0.4] }],
  },
] satisfies ReviewScene[];
```

좌표는 원문 전체 기준 0–1의 `[왼쪽, 위, 오른쪽, 아래]`다. 본문·각주처럼 과도한 확대를 피하려면 `maxScale` 또는 `panTop`을 사용한다. 기존 별칭은 해당 논문의 `aliases`, 실험 조건은 `conditions`에 둔다. 논문에 맞는 새 장면 ID를 사용하고 다른 논문의 그림 번호나 수치를 복사하지 않는다.

HBM이 필요 없으면 `features`와 `kind: 'hbm'` 장면을 생략한다. 다른 종류의 인터랙티브 기능을 추가할 때는 `features/<기능>/`에 구현하고 장면 union을 확장한다. 논문 수만큼 공통 뷰어를 복사하지 않는다.

## 4. 확인과 내보내기

```sh
npm run typecheck
npm run dev
# 브라우저에서 #library → 추가한 논문 선택
npm run build
npm run export -- <id>
```

장면 이동·원문 탐색·강조 좌표·모바일 배치를 확인하고, 생성된 단일 HTML을 인터넷 없이 열어 원문 이미지와 PDF가 포함됐는지 확인한다. 장면 ID는 논문 안에서 중복되지 않아야 하며 `page`는 등록된 페이지를 가리켜야 한다.
