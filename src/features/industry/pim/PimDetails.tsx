import { usePimStep } from './context';
import { pimMode } from './model';
export function PimDetails() {
  const { index } = usePimStep();
  const mode = pimMode(index);
  return (
    <div className="industry-details pim-details">
      {mode === 'structure' ? (
        <>
          <p className="pim-definition">
            <strong>PCU · Programmable Computing Unit</strong>
            <span>명령을 해석해 뱅크에서 읽은 값을 계산하는 연산기다.</span>
          </p>
          <ol className="industry-updates">
            <li>
              <div>
                <time>IEEE Micro · 2022</time>
                <span className="industry-status">Aquabolt-XL</span>
              </div>
              <p>
                논문의 GPU 시스템 평가에서 GEMV 마이크로커널은 8.9배, 음성 인식은 3.5배 성능 향상을
                보고했다.
              </p>
            </li>
          </ol>
        </>
      ) : mode === 'compute' ? (
        <ol className="industry-updates pim-components">
          <li>
            <div>
              <span className="industry-status">01 · 명령 제어</span>
            </div>
            <p>준비된 명령을 해석하고 실행 순서를 제어한다.</p>
          </li>
          <li>
            <div>
              <span className="industry-status">02 · 레지스터</span>
            </div>
            <p>입력과 중간 결과를 연산기 가까이에 보관한다.</p>
          </li>
          <li>
            <div>
              <span className="industry-status">03 · SIMD 연산</span>
            </div>
            <p>한 명령을 여러 데이터에 적용해 곱셈·덧셈을 수행한다.</p>
          </li>
        </ol>
      ) : (
        <table className="wse-sram-comparison pim-role-table">
          <caption>배치 추론에서의 역할 분담</caption>
          <thead>
            <tr>
              <th scope="col">NPU · 행렬 × 행렬</th>
              <th scope="col">PIM · 행렬 × 벡터</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                QKV 생성·FFN
                <br />
                가중치 재사용
              </td>
              <td>
                생성 단계 어텐션
                <br />
                KV 캐시 읽기
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                이중 행 버퍼와 요청 묶음의 교차 실행으로 두 연산기의 대기를 줄인다.
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
