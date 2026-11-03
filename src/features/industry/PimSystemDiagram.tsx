import model from '../../papers/ai-memory-wall/generated/pim-anatomy.json';
const ART = <g dangerouslySetInnerHTML={{ __html: model.system.markup }} />;
/** Schematic task placement, not a commercial NeuPIMs device. */
export function PimSystemDiagram({ active }: { active: boolean }) {
  const { command, result, anchors } = model.system;
  return (
    <g className="pim-system-scene" aria-hidden={!active}>
      <text x="36" y="31" className="pim-heading">
        NPU + PIM
      </text>
      <text x="36" y="54" className="pim-subheading">
        NeuPIMs · 배치 LLM 추론의 역할 분담
      </text>
      <g transform="translate(0 -20)">
        {ART}
        <path d={command} className="pim-wire" />
        <path d={result} className="pim-wire" />
        <path d={command} className="pim-flow pim-flow-system" />
        <path d={result} className="pim-flow pim-flow-system" />
        <text
          x={anchors.host[0]}
          y={anchors.host[1] - 44}
          textAnchor="middle"
          className="pim-device-title"
        >
          NPU
        </text>
        <text
          x={anchors.memory[0]}
          y={anchors.memory[1] - 65}
          textAnchor="middle"
          className="pim-device-title"
        >
          PIM 메모리
        </text>
      </g>
      <text x="194" y="448" textAnchor="middle" className="pim-label">
        GEMM · QKV 생성 / FFN
      </text>
      <text x="194" y="472" textAnchor="middle" className="pim-caption">
        여러 요청이 가중치를 재사용
      </text>
      <text x="562" y="448" textAnchor="middle" className="pim-label">
        GEMV · 생성 단계 어텐션
      </text>
      <text x="562" y="472" textAnchor="middle" className="pim-caption">
        KV 데이터를 가까이에서 읽고 계산
      </text>
    </g>
  );
}
