# AI and Memory Wall · 논문 리뷰

논문 원문을 확대·강조하며 설명하는 인터랙티브 발표 자료. React · TypeScript · Vite · Three.js를 사용한다.

[발표 자료 열기](https://im-jongseok.github.io/ai-memory-wall-interactive/)

## 실행

Node.js 24 권장.

```sh
npm ci
npm run dev
```

## 빌드

```sh
npm run build     # 모형 생성 → 타입 검사 → 웹 빌드 → 오프라인 HTML
npm run preview   # 웹 빌드 확인
```

웹 배포물은 `dist/`, 오프라인 HTML은 프로젝트 상위 폴더에 생성된다.

## 구조

```text
src/
  app/                  라우팅·발표 상태·키보드 조작
  components/layout/    공통 레이아웃·설명 패널·이동 버튼
  features/
    paper/              원문 뷰어·확대·하이라이트
    hbm/                HBM 3D 모형
    industry/
      cerebras/         Cerebras 모형·설명·상태
      pim/              PIM 모형·설명·상태
      cxmt/             6F²·4F² 모형·설명·상태
  papers/               논문별 설정·장면·생성 데이터
  styles/               공통 스타일
public/papers/          원문 PDF·페이지 이미지·썸네일
scripts/
  models/               모형 생성·기하 검사
  vendor/anatomy/       외부 모형 도구·라이선스
  export-standalone.mjs  오프라인 HTML 내보내기
docs/                   논문 추가 방법·구조 설명
```

- 발표 문구·확대 위치: `src/papers/ai-memory-wall/scenes.ts`
- 새 논문 추가: [docs/ADDING_PAPERS.md](docs/ADDING_PAPERS.md)
- 구조 설명: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## 조작·배포

`←` / `→`: 이전·다음 · `F`: 전체 화면 · `N`: 발표 노트 · `H`: 단축키 안내.

`main`에 push하면 GitHub Actions가 빌드 후 GitHub Pages에 자동 배포한다.

원문: IEEE Micro 44(3), 2024, pp.33–39, [DOI: 10.1109/MM.2024.3373763](https://doi.org/10.1109/MM.2024.3373763). 보충 모형은 교육용 개념도이며, 기술 출처는 발표 노트와 장면 데이터에 보관한다.
