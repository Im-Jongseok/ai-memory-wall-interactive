import { useCallback, useEffect, useState } from 'react';
import { readRoute, sceneHash } from './routing';
import { availablePapers } from '../papers/registry';
import type { PaperDefinition } from '../papers/types';
import { Presentation } from './Presentation';
import { PaperLibrary } from './PaperLibrary';
export function App() {
  const [route, setRoute] = useState(readRoute);
  useEffect(() => {
    const listener = () => {
      const next = readRoute();
      if (next.kind === 'paper')
        history.replaceState(null, '', sceneHash(next.paper, next.sceneId));
      setRoute(next);
    };
    listener();
    window.addEventListener('hashchange', listener);
    return () => window.removeEventListener('hashchange', listener);
  }, []);
  useEffect(() => {
    document.title =
      route.kind === 'paper' ? `${route.paper.title} — 원문으로 읽는 논문 리뷰` : '논문 리뷰 목록';
  }, [route]);
  const navigate = useCallback((paper: PaperDefinition, sceneId: string) => {
    history.replaceState(null, '', sceneHash(paper, sceneId));
    setRoute({ kind: 'paper', paper, sceneId });
  }, []);
  const library = useCallback(() => {
    history.replaceState(null, '', '#library');
    setRoute({ kind: 'library' });
  }, []);
  return route.kind === 'library' ? (
    <PaperLibrary
      papers={availablePapers()}
      onSelect={(paper) => navigate(paper, paper.scenes[0].id)}
    />
  ) : (
    <Presentation
      key={route.paper.id}
      paper={route.paper}
      sceneId={route.sceneId}
      onNavigate={navigate}
      onLibrary={library}
    />
  );
}
