import model from '../../papers/ai-memory-wall/generated/pim-anatomy.json';
const ART = <g dangerouslySetInnerHTML={{ __html: model.core.markup }} />;
export function PimCoreModel() {
  const { anchors, command, result, read } = model.core;
  return (
    <g className="pim-overview">
      {ART}
      <path d={command} className="pim-wire" />
      <path d={command} className="pim-flow pim-flow-command" />
      <path d={result} className="pim-wire" />
      <path d={result} className="pim-flow pim-flow-result" />
      <path d={read} className="pim-flow pim-flow-read" />
      <path d={`M${anchors.pcu[0]} ${anchors.pcu[1]}H480V117`} className="pim-model-leader" />
      <circle cx={anchors.pcu[0]} cy={anchors.pcu[1]} r="3" className="pim-terminal" />
      <text x="480" y="95" textAnchor="middle" className="pim-detail-title">
        PCU
      </text>
      <text x="480" y="114" textAnchor="middle" className="pim-small">
        16-lane FP16 SIMD
      </text>
      <text
        x={anchors.memory[0] - 30}
        y={anchors.memory[1] - 70}
        textAnchor="middle"
        className="pim-device-title"
      >
        HBM 메모리 코어
      </text>
      <text
        x={anchors.memory[0] - 30}
        y={anchors.memory[1] - 50}
        textAnchor="middle"
        className="pim-caption"
      >
        DRAM 뱅크 + PCU
      </text>
      <text
        x={anchors.host[0] + 25}
        y={anchors.host[1] - 65}
        textAnchor="middle"
        className="pim-device-title"
      >
        CPU / GPU
      </text>
      <text
        x={anchors.host[0] + 25}
        y={anchors.host[1] - 45}
        textAnchor="middle"
        className="pim-caption"
      >
        명령·입력 전달 / 결과 사용
      </text>
    </g>
  );
}
