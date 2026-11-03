import type { CxmtMode } from './cxmt-context';
/** Educational section, based on BCAT / vertical-channel references.
 * The U is a current path, not a flat transistor; vertical capacitors exist in 6F² too.
 * The two gate faces in the VSG section represent one gate surrounding an insulated channel.
 * Not the detailed process / physical dimensions of a specific CXMT product.
 */
function Capacitor({ x, y }: { x: number; y: number }) {
  return (
    <g className="cxmt-capacitor" transform={`translate(${x} ${y})`}>
      <rect x="-23" width="46" height="80" rx="5" className="cxmt-cap-outer" />
      <path d="M-16 6V70H16V6" className="cxmt-cap-dielectric" />
      <path d="M-9 4V62H9V4" className="cxmt-cap-inner" />
      <path d="M0 62V95" className="cxmt-storage-contact" />
    </g>
  );
}
function Leader({ d, x, y }: { d: string; x: number; y: number }) {
  return (
    <g>
      <path d={d} className="cxmt-cell-leader" />
      <circle cx={x} cy={y} r="2.5" className="cxmt-cell-terminal" />
    </g>
  );
}
function BuriedCell() {
  return (
    <g className="cxmt-device cxmt-device-buried">
      <text x="178" y="42" textAnchor="middle" className="cxmt-device-title">
        6F² · 매립 게이트
      </text>
      <text x="178" y="68" textAnchor="middle" className="cxmt-device-subtitle">
        BCAT · 대표 구조
      </text>
      <path d="M54 241H302V365H54Z" className="cxmt-substrate" />
      <path d="M58 365H302V373H58Z" className="cxmt-substrate-edge" />
      <path
        d="M126 241V309Q126 331 150 331H201Q225 331 225 309V241"
        className="cxmt-channel-insulator"
      />
      <path
        d="M126 238V309Q126 331 150 331H201Q225 331 225 309V238"
        className="cxmt-cell-channel"
      />
      <rect x="150" y="235" width="51" height="74" rx="3" className="cxmt-cell-gate" />
      <path d="M154 240H196M154 245H196" className="cxmt-gate-detail" />
      <path d="M126 238V205H59" className="cxmt-bitline" />
      <rect x="116" y="223" width="20" height="18" rx="2" className="cxmt-contact-pad" />
      <Capacitor x={225} y={143} />
      <rect x="215" y="230" width="20" height="13" rx="2" className="cxmt-contact-pad" />
      <text x="59" y="177" className="cxmt-cell-label">
        비트라인
      </text>
      <text x="225" y="122" textAnchor="middle" className="cxmt-cell-label">
        커패시터 · 저장
      </text>
      <Leader d="M281 279H201" x={201} y={279} />
      <text x="285" y="274" className="cxmt-cell-label">
        게이트
      </text>
      <text x="285" y="293" className="cxmt-cell-small">
        WL · 선택
      </text>
      <Leader d="M92 310H126" x={126} y={310} />
      <text x="65" y="299" className="cxmt-cell-label">
        채널
      </text>
      <path d="M70 396V404H285V396M70 400H285" className="cxmt-footprint-rule" />
      <text x="178" y="432" textAnchor="middle" className="cxmt-footprint-value">
        셀 배치 3F × 2F = 6F²
      </text>
      <text x="178" y="462" textAnchor="middle" className="cxmt-device-caption">
        접점과 채널을 배치할 가로 공간
      </text>
    </g>
  );
}
function VerticalCell() {
  return (
    <g className="cxmt-device cxmt-device-vertical" transform="translate(390 0)">
      <text x="178" y="42" textAnchor="middle" className="cxmt-device-title">
        4F² · 수직 채널
      </text>
      <text x="178" y="68" textAnchor="middle" className="cxmt-device-subtitle">
        VSG · 채널을 둘러싼 게이트
      </text>
      <path d="M107 344H249V365H107Z" className="cxmt-substrate" />
      <path d="M111 365H249V373H111Z" className="cxmt-substrate-edge" />
      <path d="M178 239V341" className="cxmt-channel-insulator" />
      <rect x="155" y="250" width="46" height="74" rx="4" className="cxmt-cell-gate" />
      <rect x="168" y="246" width="20" height="82" rx="2" className="cxmt-gate-oxide" />
      <path d="M178 239V341" className="cxmt-cell-channel" />
      <Capacitor x={178} y={143} />
      <path d="M178 341H69" className="cxmt-bitline" />
      <rect x="168" y="331" width="20" height="14" rx="2" className="cxmt-contact-pad" />
      <rect x="168" y="231" width="20" height="12" rx="2" className="cxmt-contact-pad" />
      <text x="178" y="122" textAnchor="middle" className="cxmt-cell-label">
        커패시터 · 저장
      </text>
      <text x="65" y="319" className="cxmt-cell-label">
        비트라인
      </text>
      <Leader d="M273 272H201" x={201} y={272} />
      <text x="278" y="268" className="cxmt-cell-label">
        게이트
      </text>
      <text x="278" y="287" className="cxmt-cell-small">
        WL · 선택
      </text>
      <Leader d="M273 309H178" x={178} y={309} />
      <text x="278" y="315" className="cxmt-cell-label">
        수직 채널
      </text>
      <path d="M107 396V404H249V396M107 400H249" className="cxmt-footprint-rule" />
      <text x="178" y="432" textAnchor="middle" className="cxmt-footprint-value">
        셀 배치 2F × 2F = 4F²
      </text>
      <text x="178" y="462" textAnchor="middle" className="cxmt-device-caption">
        채널 길이를 높이 방향으로 확보
      </text>
    </g>
  );
}
export function CxmtCellStructure({ mode }: { mode: CxmtMode }) {
  return (
    <svg
      viewBox="0 0 780 530"
      className="cxmt-cell-structure"
      role="img"
      aria-label="6F² 매립 게이트와 4F² 수직 채널의 개념 단면. 6F²는 접점과 U자 채널이 가로 공간을 차지한다. 4F²는 전류가 수직 채널을 통과하고 게이트가 절연막을 사이에 두고 이를 둘러싸 바닥 면적을 줄인다."
    >
      <title>
        {mode === 'baseline'
          ? '왜 기존 셀은 6F²였는가?'
          : '수직 채널과 둘레 게이트는 어떻게 4F²를 가능하게 하는가?'}
      </title>
      <text x="390" y="96" textAnchor="middle" className="cxmt-section-kind">
        원리 비교 · 개념 단면
      </text>
      <BuriedCell />
      <VerticalCell />
      <path d="M374 117V458" className="cxmt-comparison-divider" />
      <g className="cxmt-cell-legend">
        <rect x="122" y="501" width="15" height="4" rx="2" className="cxmt-channel-key" />
        <text x="145" y="507">
          전류가 흐르는 채널
        </text>
        <rect x="380" y="495" width="14" height="14" rx="2" className="cxmt-cell-gate" />
        <text x="403" y="507">
          게이트 · 채널의 전류 제어
        </text>
      </g>
    </svg>
  );
}
