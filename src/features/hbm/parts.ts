/** Shared component names and teaching descriptions; geometry anchors live in the paper model. */
export const HBM_PARTS = {
  dram: {
    name: 'HBM을 구성하는 DRAM 다이',
    short: 'DRAM 다이',
    color: 0x30a6a5,

    description:
      '왼쪽 적층 전체가 HBM이고, 각 메모리층은 DRAM 다이다. 모형의 앞쪽은 내부 TSV와 접점을 볼 수 있도록 절개한 단면이다.',
  },
  tsv: {
    name: 'TSV · 수직 연결',
    short: 'TSV',
    color: 0xf0af4b,

    description: '실리콘 다이를 관통하는 금속 연결이다. 위아래 DRAM층 사이에서 신호를 전달한다.',
  },
  bumps: {
    name: '마이크로범프 · 미세 접점',
    short: '미세 접점',
    color: 0xe3a34a,

    description:
      '다이와 다이, 칩과 인터포저를 전기적으로 잇는 미세 금속 접점이다. 모형에서는 얇은 금속 패드로 표시했다.',
  },
  base: {
    name: '베이스 다이',
    short: '베이스',
    color: 0x247f92,

    description:
      'DRAM 적층 아래의 기반 다이다. 적층 메모리와 인터포저 사이에서 신호를 연결·분배한다.',
  },
  interposer: {
    name: '인터포저 · 가로 연결',
    short: '인터포저',
    color: 0x9fbac7,

    description:
      'HBM과 GPU 아래에 공통으로 놓이는 미세 배선용 실리콘 층이다. 내부의 짧고 촘촘한 배선이 두 칩을 연결한다.',
  },
  phy: {
    name: '메모리 컨트롤러 · PHY',
    short: '컨트롤러·PHY',
    color: 0xe8a044,

    description: '컨트롤러가 읽기·쓰기 요청을 관리하고, PHY가 데이터를 전기 신호로 보내고 받는다.',
  },
  gpu: {
    name: 'GPU · 연산 장치',
    short: 'GPU',
    color: 0x2f5976,

    description:
      '메모리에서 공급받은 데이터로 계산한다. 데이터가 제때 오지 않으면 연산 유닛의 활용도가 낮아진다.',
  },
  substrate: {
    name: '패키지 기판',
    short: '패키지 기판',
    color: 0x526b7c,

    description: '인터포저와 칩을 지지하고 외부 보드에 연결한다. 전원과 신호를 전달하는 기반이다.',
  },
} as const;
