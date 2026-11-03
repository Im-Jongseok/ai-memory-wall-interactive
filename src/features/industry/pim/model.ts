/** Scalar dot-product walkthrough, not a cycle-accurate PCU simulation.
 * Samsung Aquabolt-XL uses 16-lane FP16 SIMD; three scalar terms explain MAC here.
 */
export const PIM_MODEL = { weights: [2, 1, 0], input: [1, 2, 3] } as const;
export const PIM_PRODUCTS = PIM_MODEL.weights.map((weight, i) => weight * PIM_MODEL.input[i]);
export const PIM_PARTIALS = PIM_PRODUCTS.map((_, i) =>
  PIM_PRODUCTS.slice(0, i + 1).reduce((sum, product) => sum + product, 0),
);
export const PIM_RESULT = PIM_PARTIALS.at(-1)!;
export const PIM_GROUPS = [
  { start: 0, end: 1 }, // Command → bank read; remain on the structure explanation.
  { start: 2, end: 5 }, // Three MAC terms → result; remain on the PCU explanation.
  { start: 6, end: 6 }, // NPU-PIM task placement, manually selected.
] as const;
export const PIM_STEPS = [
  { phase: 'command', hold: 2600, label: '01 · CPU/GPU가 명령과 입력을 전달', term: -1 },
  { phase: 'read', hold: 0, label: '02 · 뱅크의 가중치를 가까운 PCU로 읽기', term: -1 },
  { phase: 'compute', hold: 1700, label: '03 · PCU에서 곱셈 후 누산', term: 0 },
  { phase: 'compute', hold: 1700, label: '03 · PCU에서 곱셈 후 누산', term: 1 },
  { phase: 'compute', hold: 1700, label: '03 · PCU에서 곱셈 후 누산', term: 2 },
  { phase: 'result', hold: 0, label: '04 · 지원 연산을 마친 뒤 결과 반환', term: 2 },
  { phase: 'system', hold: 0, label: 'NPU와 PIM이 잘하는 연산을 나누어 처리', term: -1 },
] as const;

export const PIM_EXPLANATION = {
  structure: {
    label: 'HBM-PIM · AQUABOLT-XL',
    title: '데이터를 옮기는 대신,\n메모리 안에서 계산한다.',
    stat: 'DRAM 뱅크 곁의 PCU',
    body: 'HBM-PIM은 메모리 코어 다이에 연산기를 넣는다. CPU·GPU가 명령과 입력을 보내면, PCU가 가까운 뱅크의 가중치를 읽어 계산한다. 지원 연산에서 가중치를 외부로 반복 전송하는 부담을 줄인다.',
  },
  compute: {
    label: 'HBM-PIM · PCU 내부',
    title: '읽은 값을 곱하고,\n중간 결과에 더한다.',
    stat: '명령 하나로 여러 값 처리',
    body: 'PCU는 명령 제어기·레지스터·연산 회로로 구성된다. 삼성 Aquabolt-XL은 16-lane FP16 SIMD로 여러 값을 병렬 처리한다. 왼쪽은 그중 한 lane의 곱누산을 세 항으로 단순화한 예다.',
  },
  system: {
    label: 'LLM 적용 · NEUPIMS / ASPLOS 2024',
    title: '계산이 많은 연산과\n이동이 많은 연산을 나눈다.',
    stat: 'NPU + PIM',
    body: '여러 요청을 묶은 LLM 추론에서는 연산마다 특성이 다르다. NeuPIMs는 가중치 재사용이 많은 행렬–행렬 연산을 NPU에, 요청별 KV 캐시를 읽는 어텐션의 행렬–벡터 연산을 PIM에 맡긴다.',
  },
};
export function pimMode(index: number) {
  const phase = PIM_STEPS[index].phase;
  return phase === 'system'
    ? 'system'
    : phase === 'command' || phase === 'read'
      ? 'structure'
      : 'compute';
}
