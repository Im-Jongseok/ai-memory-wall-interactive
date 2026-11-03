import type { CerebrasMode } from './cerebras-context';
export const CEREBRAS_EXPLANATION = {
  core: {
    label: 'CEREBRAS · SRAM 이해',
    title: 'SRAM은 저장 기술,\n캐시는 메모리의 역할이다.',
    stat: '같은 SRAM, 다른 관리 방식',
    body: 'SRAM은 전원이 켜진 동안 리프레시 없이 값을 유지하는 빠른 메모리이며, 전원을 끄면 내용이 사라진다.\n\nCerebras는 이 SRAM을 연산 가까이에 두고 가중치를 반복해서 읽어 원거리 전송을 줄인다. 이는 논문이 강조한 데이터 재사용·메모리 계층 설계와 연결된다.',
  },
  stack: {
    label: 'CEREBRAS · CS-6 로드맵의 설계 방향',
    title: 'SRAM의 속도에\nDRAM의 용량을 더한다.',
    stat: '용량 확장 + 데이터 지역성',
    body: 'SRAM은 빠르지만 용량을 늘리려면 넓은 면적이 필요하다. CS-6는 SRAM에 DRAM을 수직으로 연결해 빠른 접근과 큰 저장 용량을 함께 확보하려는 계획이다. 이는 메모리의 속도·용량·이동 거리·데이터 재사용을 함께 고려하는 논문의 계층 설계 방향과 연결된다.',
  },
} satisfies Partial<
  Record<CerebrasMode, { label: string; title: string; stat: string; body: string }>
>;
