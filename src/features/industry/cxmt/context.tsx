import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
export type CxmtMode = 'baseline' | 'compact' | 'array' | 'density';
const Context = createContext<{ mode: CxmtMode }>({ mode: 'baseline' });
export function CxmtModeProvider({ mode, children }: { mode: CxmtMode; children: ReactNode }) {
  return <Context.Provider value={{ mode }}>{children}</Context.Provider>;
}
export const useCxmtMode = () => useContext(Context);
