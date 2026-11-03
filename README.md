# 인터랙티브 논문 리뷰

여러 논문이 원문 뷰어와 발표 레이아웃을 공유하는 React + TypeScript 프로젝트다. 현재 등록된 논문은 **AI and Memory Wall**이며, 논문 리뷰 23개 장면과 구조·데이터 이동을 합친 HBM 보충 장면 1개, 동향·메모리 중심 연산 보충 장면 3개로 구성한다 (총 27개).

## 실행과 빌드

Node.js 22.12 이상을 사용한다.

```sh
npm ci
npm run dev
npm run typecheck
npm run build
```

- 개발: Vite가 출력하는 로컬 주소에서 연다.
- 웹 배포: `dist/` 전체를 정적 서버에 올린다. `dist`는 생성 결과이므로 직접 수정하지 않는다.
- 오프라인 발표: 빌드 시 상위 폴더의 `AI_and_Memory_Wall_인터랙티브.html`도 다시 생성한다. 이 단일 파일은 인터넷 없이 `file://`로 실행된다.
- 특정 논문만 내보내기: `npm run export -- <paper-id>`
- 저장 위치 지정: `npm run export -- <paper-id> --out /절대/경로/발표.html`
- 기존 명령인 `python3 build_standalone.py`도 같은 내보내기를 호출한다. 최초 한 번은 `npm ci`가 필요하다.

개발 환경에는 Node.js와 의존성 설치가 필요하지만, 생성된 발표 HTML을 보는 사람은 설치가 필요 없다.

## GitHub Pages 배포

- 사이트: https://im-jongseok.github.io/ai-memory-wall-interactive/
- 저장소: https://github.com/Im-Jongseok/ai-memory-wall-interactive
- `main`에 push하면 `.github/workflows/pages.yml`이 의존성 설치, 모형 생성, 타입 검사, 빌드 후 `dist/`를 배포한다.
- GitHub의 Settings → Pages → Source는 **GitHub Actions**로 설정한다.
- 워크플로가 제공하는 `PAGES_BASE_PATH`를 Vite에 적용한다. 로컬 실행과 오프라인 HTML은 기존 방식으로 사용할 수 있다.
- `dist/`는 Git 추적 대상에서 제외하고 소스와 빌드 설정을 관리한다.

## 수정할 위치

```text
src/
  app/                       논문 목록, 해시 라우팅, 발표 상태·단축키
  components/layout/         공통 레이아웃, 설명 패널, 화살표, 탐색 대화상자
  features/paper/            원문 이미지·확대·블러·하이라이트·페이지 전환
  features/industry/         Cerebras·CXMT 동향 도해와 출처·계획 구분
  features/hbm/              선택적인 HBM 기능 (모델·연결선·설명 도해·생명주기 분리)
  papers/
    types.ts                 논문·페이지·장면의 TypeScript 계약
    registry.ts              */paper.ts 자동 등록
    ai-memory-wall/
      paper.ts               논문 정보, 페이지 목록, 별칭, 선택 기능
      scenes.ts              설명·발표 노트·ROI·노란 강조 영역
      generated/             Anatomy가 생성한 모델 데이터
    _template/               새 논문 작성 예시 (자동 등록되지 않음)
  styles/                    공통 화면·원문·설명·대화상자·반응형 스타일
public/papers/<paper-id>/     논문별 원문 이미지·썸네일·PDF
scripts/export-standalone.mjs 공통 앱을 단일 오프라인 HTML로 내보내기
```

레이아웃 변경은 `PresentationLayout.tsx`, 설명 구성 변경은 `ExplanationPanel.tsx`에서 한다. 논문의 문구나 확대 위치를 바꾸기 위해 공통 뷰어 코드를 수정하지 않는다. 원문 카메라와 Three.js의 프레임별 동작은 React 렌더링 루프 밖의 인스턴스 엔진으로 관리한다. 두 엔진은 기존 JS를 유지하되 TypeScript 인터페이스로 경계를 명시했다.

## 여러 논문 사용

- 기존 `#start`, `#fig1` 등은 AI and Memory Wall의 기존 주소로 유지한다.
- `L` 또는 `#library`로 논문 목록을 연다. 목록에서 등록된 논문을 선택한다.
- 다른 논문은 `#papers/<paper-id>/<scene-id>` 주소로 접근한다.
- `src/papers/<paper-id>/paper.ts`를 추가하면 자동 등록된다. 원문 자료는 `public/papers/<paper-id>/`에 둔다.
- 각 논문의 페이지 수, 인쇄 페이지 번호, 종횡비, 장면, PDF 링크, 별칭, 실험 조건은 해당 `paper.ts`가 결정한다.
- HBM은 `features.hbm`을 지정한 논문에서만 활성화한다. 다른 논문에는 3D 모델을 추가할 필요가 없다.

자세한 추가 절차는 [docs/ADDING_PAPERS.md](docs/ADDING_PAPERS.md), 도입 판단과 확장 기준은 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)를 참고한다.

## 발표 조작

`←/→`, `↑/↓`, `Space`: 이동 · `O`: 전체 원문/확대 · `T`: 원문만 보기 · `N`: 노트 · `M`: 원문 페이지 · `L`: 논문 목록 · `F`: 전체 화면 · `H`: 도움말 · `0`: 현재 위치 맞춤. 휠·드래그는 원문 이동, Ctrl/Command+휠은 확대다.

기존 흰 배경, 원문 왼쪽·설명 오른쪽, 첫 페이지 설명 숨김, 원형 화살표와 전체 화면 버튼을 유지한다. 원문의 비강조 부분은 약한 블러를 적용하고 중요한 문장과 수식은 노란 밑줄·박스로 표시한다. 다른 페이지에서는 원문 폭까지 줌아웃한 뒤 다음 영역으로 이동한다.

HBM은 `hbm-data-path` 한 화면에서 구조 → 데이터 경로 → 통로 확대 → 신호 판별 → 전력·발열을 순서대로 보여 준다. `hbm-structure`도 같은 화면으로 연결된다. 이전 `hbm-bandwidth`, `hbm-limits`, `hbm-power` 링크도 같은 통합 화면으로 연결된다. 라벨 호버·포커스·터치로 상세 설명을 확인한다.

## 원문과 모델

원문은 제공된 IEEE Micro 44(3), 2024, pp.33–39, DOI 10.1109/MM.2024.3373763이다. 기존 페이지 이미지·PDF·장면의 좌표를 보존했다. 설명과 발표자 평가는 원문과 구분한다.

HBM은 사용자 제공 그림과 [Anatomy](https://github.com/wheresryan22/anatomy)로 재구성한 교육용 절개 단면이다. DRAM 4층과 베이스·TSV·접점·인터포저·GPU를 단순화했으며, 실제 제품의 치수·배선 수·내부 회로 배치가 아니다. 전력 배수는 비트당 에너지가 같다는 가정 아래 전송 회로의 상대값이며 GPU 전체 소비 전력이나 실측 온도가 아니다.

`npm run model`은 `build_hbm_anatomy.mjs`로 생성 데이터를 갱신하고 TSV·접점 접촉면을 확인한다. Anatomy 원본은 `tools/anatomy/`에 MIT 라이선스와 커밋 `1482e8469b0a9e0d8cc18ea2740a01423d29ae80`을 보관한다. Three.js는 0.180.0을 사용한다. WebGL이 없으면 정적 Anatomy SVG를 표시한다. 자체 SVG/3D 전체 기하 감사 도구를 통과했다는 의미는 아니다.

선택 라벨·우측 활성 단계·도해의 강조색은 원문 강조와 같은 노란색을 사용한다. 파란색은 섹션 제목·안내에 사용하며 발열 표현은 따뜻한 색을 유지한다. TSV 라벨은 모델 아래에 두고, 라벨 연결선은 직선 또는 한 번 꺾이는 수평·수직 선분으로 제한한다.

HBM·GPU는 각각 모델 위의 독립 제목으로 표시한다. 기본 구조·경로는 중립적인 안내 영역이며, 세 대역폭 제약은 카드 전체가 재생 버튼이다. 직접 선택한 단계는 자동으로 다음 단계로 넘어가지 않고 같은 카드를 다시 누르면 처음부터 재생한다. 인터포저는 하나의 공통 실리콘 판과 그 위에 평평하게 놓인 배선층으로 구성한다.

문제 선택 시 배경색과 제목·본문은 그대로 두고 왼쪽 테두리와 인덱스 번호만 강조한다. 기본 구조 버튼과 별도 안내 제목은 제거하고 데이터 이동 경로를 크게 표시한다.

## 2026년 보충 동향

HBM 다음에 `#cerebras` → `#pim` → `#cxmt-4f2`를 한 장씩 배치한다. Cerebras는 현재 가중치 지역성과 CS-6 DRAM 적층 계획을 전환하고, CXMT는 같은 면적의 6F²·4F² 셀 배치를 비교한다. 발표 날짜와 향후 계획을 구분하고, 논문과의 연결을 우측 본문에 통합한다. 출처 링크와 기술적 한계는 발표 노트·장면 메타데이터에 보관한다. 2024년 논문 본문이나 원문 참고문헌에 해당하는 내용은 아니다.

Cerebras 외형은 첨부한 초기 WSE 이미지와 [공식 칩 페이지](https://www.cerebras.ai/chip)를 참고해 Anatomy로 모델링했다. `build_cerebras_anatomy.mjs`가 정면·입체·타일 확대·CS-6 개념 분해도의 기하와 SVG를 생성한다. 타일 구역 수는 실제 코어 수가 아니며, GPU 면적 비교는 첨부 이미지의 과거 세대 값이다. `npm run model`로 HBM·Cerebras를 함께 갱신하고, `npm run audit:cerebras`로 형상·지지·깊이 순서를 검사한다. 런타임과 스타일은 `src/features/industry/CerebrasModel.tsx`, `cerebras-model.css`에 분리했으며 Cerebras 모형은 해당 페이지에서 지연 로드한다.

Cerebras는 기존 이전·다음 버튼, 방향키·PageUp/PageDown·스페이스로 웨이퍼 → 타일·SRAM → CS-6 적층 계획을 넘긴다. 시간이 지나도 설명 단계는 바뀌지 않는다. `src/app/scene-steps.ts`가 단계 수를 정의하고 `Presentation.tsx`가 현재 단계를 소유한다. 각 context는 그림과 우측 설명에 같은 단계를 전달하고 `useCerebrasMotion.ts`는 선택한 단계의 카메라 모션만 관리한다. SRAM 설명·캐시 비교는 `cerebras-explanation.ts`, `CerebrasDetails.tsx`에 분리한다.

Cerebras 공식 프레스킷의 원본 로고는 `src/features/industry/assets/`에 출처와 함께 보관한다. Vite `?inline` 가져오기로 오프라인 HTML에도 포함한다. 연산 칩 설명은 CS-4의 WSE-3 Turbo 3개 구성, 웨이퍼당 AI 연산 코어 90만 개·SRAM 44GB를 기준으로 한다. 모형 옆 GPU는 첨부 이미지의 크기 비교 대상이다.

Cerebras 단계 전환 모션은 약 0.9–1.1초다. SRAM 단계 본문에 논문의 데이터 재사용·계층 설계와의 연결을 통합하고, CS-6 요약은 우측 핵심 문구로 표시한다. Cerebras의 하단 보충 문구·출처 링크는 발표 화면에서 숨기며, 출처 데이터와 발표 노트는 유지한다.

CXMT의 `#cxmt-4f2`는 6F² 매립 게이트·배치 이유 → 수직 채널·VSG와 제조 난제 → 확보한 공간에 셀 추가를 수동으로 넘긴다. 전환 모션은 1.1초이며 다음 입력까지 화면을 유지한다. 어레이 경계와 F를 고정한 채 12셀의 점유 면적을 줄이고, 여섯 셀을 노란색으로 추가한다. 숨겨진 동안은 모션을 멈추며 동작 줄이기 환경에서는 확대·이동 없이 선택 단계를 표시한다.

`build_cxmt_anatomy.mjs`는 Anatomy로 43개 솔리드와 보간 가능한 셀 경로를 생성한다. `npm run model`로 HBM·Cerebras·CXMT를 함께 생성하고 `npm run audit:cxmt`로 기준·축소·추가 상태 및 축소 중간 형상의 지지·간섭·깊이 순서를 검사한다. `CxmtModel.tsx`가 그림을, `cxmt-explanation.ts`·`CxmtDetails.tsx`가 설명을, `cxmt-context.tsx`·`src/app/scene-steps.ts`가 단계와 시간을 관리한다. 프레임별 모션은 SVG 경로에 직접 적용하며 React를 매 프레임 렌더링하지 않는다.

CXMT의 셀 블록과 F² 격자는 **점유 면적의 기하 모형**이며 실제 VSG·커패시터의 물리 배치가 아니다. 6F²→4F²에서 셀 면적은 ⅔, 같은 F·같은 어레이 면적의 셀 수는 1.5배다. 주변 회로·수율을 포함한 칩 전체의 실측 용량이나 대역폭 증가율로 해석하지 않는다. VSG 설명·2026년 말 DDR5 RDIMM 공개 계획은 [Yicai의 10월 10일 학회 현장 취재](https://www.yicai.com/news/103388707.html)에 근거하며 이미 출시된 제품으로 표시하지 않는다.

`CxmtCellStructure.tsx`는 초기 두 단계에서 BCAT 매립 게이트의 U자 채널과 VSG 수직 채널을 비교한다. 접점·채널·절연 간격을 배치하는 이유, 수직 방향으로 채널 길이를 확보하는 원리, 둘레 게이트의 누설 제어, 깊은 접점과 균일한 절연막 제조·간섭 억제의 어려움을 설명한다. 3F×2F와 2F×2F는 대표적인 셀 배치 면적이며 단면의 실제 치수 비율이 아니다. 커패시터는 기존 6F²에서도 수직이며 4F² 전환을 HBM 다이 적층과 혼동하지 않는다. 근거는 Applied Materials의 [구조 비교 p.24·30](https://ir.appliedmaterials.com/static-files/120c72b8-d5bf-427e-86bc-de1e2654af06), [기술 설명 pp.17–19](https://ir.appliedmaterials.com/static-files/e8307fb9-c40b-4fee-abf9-3209c76ab08d), DRAMScope Fig.2와 SK hynix의 4F² VG 연구다. 제조사별 공정 차이는 발표 노트에 구분한다.

`#pim`은 Cerebras 다음, CXMT 4F² 앞의 PIM 보충 페이지다. 기존 `#pim-cim` 링크는 같은 페이지로 연결한다. `PimDiagram.tsx`는 HBM 뱅크 쌍·PCU·외부 CPU/GPU의 관계와 PCU 내부의 명령 제어·레지스터·곱셈·덧셈·누산을 보여 준다. `PimDetails.tsx`가 PCU와 SIMD, 외부 데이터 이동 감소를 설명한다. `pim-model.ts`에서 입력·곱셈값·누산값과 수동 화면 경계·자동 세부 흐름을 정의한다. 구조 → 곱누산 → NPU·PIM 협업을 버튼·방향키로 넘기며, 구조와 곱누산 화면 안의 흐름은 자동으로 진행한다. 동작 줄이기 설정에서는 흐름 모션을 생략한다.

도식은 삼성 Aquabolt-XL HBM2-PIM과 PCU를 설명하는 개념도다. 원문은 [삼성 PCU 기술 설명](https://semiconductor.samsung.com/news-events/tech-blog/the-industrys-first-hbm-pim/)과 [Hot Chips 33 발표 pp.8–9](https://www.hc33.hotchips.org/assets/program/conference/day1/20210813_HC33_Aquabolt-XL_PIM_Jin_Kim_slide.pdf)이다. 실제 16-lane FP16 SIMD를 세 항의 스칼라 내적으로 단순화했으며 물리 배치·실측 성능을 재현하지 않는다. CIM 설명은 발표 범위에 맞춰 본 화면에서 제외했다. CIM의 최근 연구와 용어 범위는 장면 발표 노트에 남긴다.

### PIM 보충 설명 (2026-11-04)

`#pim`은 HBM-PIM 구조 → 한 lane의 곱누산 → NeuPIMs의 배치 LLM 역할 분담을 수동으로 넘긴다. `pim-model.ts`가 단계와 설명을 정의하고, `pim-context.tsx`가 좌우 화면의 단계를 동기화한다. 구조 도해와 NeuPIMs 도해는 각각 `PimDiagram.tsx`, `PimSystemDiagram.tsx`, 우측 설명은 `PimDetails.tsx`, 스타일은 `pim.css`에 분리했다.

Aquabolt-XL의 8.9×/3.5×는 서로 다른 작업에 대한 논문 보고치이고, NeuPIMs는 별도의 시뮬레이터 기반 연구다. DOI·원문·평가 조건은 장면 데이터와 발표자 노트에 보존한다. 다음 페이지로 넘어갔다가 이전을 누르면 직전 페이지의 마지막 설명 단계로 돌아온다. 직접 주소로 이동하면 해당 페이지의 첫 단계가 열린다. 동작 줄이기 설정에서는 전환 모션을 생략한다.

HBM·Cerebras·PIM·CXMT의 설명 화면 전환은 수동이다. PIM 화면 안의 명령·계산 세부 흐름만 자동으로 이어진다. 각 단계에 들어갈 때의 확대·형상 변화와 데이터 흐름 모션은 유지한다. 마지막 단계에서 다음을 누르면 다음 페이지, 첫 단계에서 이전을 누르면 앞 페이지의 마지막 단계로 이동한다. HBM 우측 항목을 직접 클릭해 선택한 상태도 이전·다음과 동기화한다. 마지막 CXMT 페이지의 다음 버튼은 최종 밀도 설명까지 사용한 후 비활성화된다.

PIM의 `build_pim_anatomy.mjs`는 Cerebras와 동일한 Anatomy 기하·명암·시점으로 각 모형의 65개 고체 부품을 생성하고 형상·지지·깊이 감사를 수행한다. `PimCoreModel.tsx`가 DRAM 뱅크·16개 연산 lane·외부 연산 칩을, `PimSystemDiagram.tsx`가 NPU-PIM 역할 분담을 표시한다. 물리 치수와 실제 제품의 배치도는 아니다. `npm run audit:pim`으로 다시 생성·검사한다.

`#source` → `#hbm-data-path`에서는 View Transition으로 원문 화면을 캡처해 유지하고, HBM의 첫 렌더 또는 정적 대체 화면 준비가 끝나면 약 0.7초에 걸쳐 교차 전환한다. `usePaperToModelTransition.ts`가 전환·취소를 관리하며, HBM 엔진은 첫 프레임을 동기 렌더해 View Transition의 렌더 대기와 교착하지 않는다. 바로 뒤로 가기·페이지 이탈은 대기 중 전환을 취소한다. 동작 줄이기 또는 미지원 브라우저에서는 기본 전환을 사용한다.

PIM은 세 설명 화면 사이를 수동으로 넘기되, 화면 안의 계산 흐름은 자동 재생한다. 구조 화면에서는 명령 전달(2.6초) → 뱅크 읽기에서 정지하고, 다음을 누르면 세 곱누산 항(각 1.7초) → 결과 반환에서 정지한다. 다음을 한 번 더 누르면 NPU-PIM 역할 분담으로 이동한다. `PIM_GROUPS`가 수동 경계, `PIM_STEPS`가 자동 재생 시간·값을 정의한다. 이전을 눌러 화면에 돌아오면 해당 흐름을 처음부터 재생하며, 숨긴 탭·화면 밖에서는 남은 시간을 보존한다. 다른 보충 페이지는 수동 전환을 유지한다.

방향키·PageUp/PageDown·스페이스는 키를 누른 채 생기는 반복 입력으로 단계를 넘기지 않는다. 각 단계 이동은 새 키 누름으로 실행한다. 직접 주소 변경·원문 탐색 후 재진입은 첫 설명 단계로 시작하고, 이전 버튼으로 페이지 경계를 되돌아가는 경우는 앞 페이지의 마지막 단계를 유지한다. 따라서 `#cxmt-4f2` 진입 시 6F² 설명이 다음 입력까지 유지된다.

CXMT는 단면 비교 뒤에 미압축 6F²·12셀 배열을 표시하는 독립 단계를 둔다. 최종 순서는 6F² 단면 → 4F² 원리 → 6F² 기준 배열(유지) → 4F²·18셀 밀도 효과다. 배열을 감춘 상태에서는 압축하지 않는다. 최종 전환은 약 1.7초이며 처음 60% 구간에 셀 면적을 줄인 다음 나머지 구간에서 여섯 셀을 채운다. 역방향은 추가 셀을 먼저 없앤 다음 6F² 크기로 복원한다.
