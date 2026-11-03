import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
export type CerebrasMode = 'wafer' | 'core' | 'stack';
const Context = createContext<{ mode: CerebrasMode }>({ mode: 'wafer' });
export function CerebrasModeProvider({
  mode,
  children,
}: {
  mode: CerebrasMode;
  children: ReactNode;
}) {
  return <Context.Provider value={{ mode }}>{children}</Context.Provider>;
}
export const useCerebrasMode = () => useContext(Context);
