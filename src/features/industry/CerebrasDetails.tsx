import { useCerebrasMode } from './cerebras-context';
export function CerebrasDetails() {
  const { mode } = useCerebrasMode();
  if (mode === 'core')
    return (
      <div className="industry-details wse-sram-details">
        <table className="wse-sram-comparison">
          <caption>SRAM을 무엇으로, 어떻게 쓰는가?</caption>
          <thead>
            <tr>
              <th scope="col">일반 CPU·GPU 캐시</th>
              <th scope="col">Cerebras 로컬 SRAM</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>주 메모리 데이터 중 일부를 가까이에 보관</td>
              <td>각 코어가 쓸 가중치·데이터를 가까이에 배치</td>
            </tr>
            <tr>
              <td>
                하드웨어가 자동 적재·교체
                <br />
                <small>없으면 캐시 미스</small>
              </td>
              <td>
                컴파일러·프로그램이 배치·전송을 관리
                <br />
                <small>스크래치패드 방식</small>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  return (
    <div className="industry-details">
      <ol className="industry-updates">
        <li>
          <div>
            <time>2026.08.25</time>
            <span className="industry-status">CS-6 계획 공개</span>
          </div>
          <p>연산·SRAM 웨이퍼와 3D 적층 DRAM을 고대역폭 연결로 결합하는 방향을 제시했다.</p>
        </li>
      </ol>
    </div>
  );
}
