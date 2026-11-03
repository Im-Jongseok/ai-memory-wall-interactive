export const assetUrl = (path: string): string =>
  window.__PAPER_EXPORT__?.assets[path] ?? `${import.meta.env.BASE_URL}${path}`;
