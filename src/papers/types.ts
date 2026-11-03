export type Region = readonly [number, number, number, number];
export type HbmMode = 'structure' | 'path' | 'wiring' | 'signal' | 'power' | 'sequence';
export interface Emphasis {
  kind: 'box' | 'underline';
  rect: Region;
  label?: string;
}
export interface DemoStep {
  number: string;
  title: string;
  body: string;
  visual?: string;
  mode: Exclude<HbmMode, 'sequence'>;
}
interface SceneText {
  id: string;
  chapter: string;
  label: string;
  title: string;
  stat: string;
  body: string;
  note?: string;
  source?: string;
  takeaway?: string;
}
export interface PaperScene extends SceneText {
  kind: 'paper';
  page: number;
  roi?: Region | null;
  highlight?: Region | null;
  emphasis?: Emphasis[];
  opening?: boolean;
  focus?: boolean;
  panTop?: number;
  maxScale?: number;
}
export interface HbmScene extends SceneText {
  kind: 'hbm';
  mode: HbmMode;
  problems?: DemoStep[];
}
export interface IndustryScene extends SceneText {
  kind: 'industry';
  topic: 'cerebras' | 'cxmt' | 'pim';
  updates: { date: string; status: string; text: string }[];
  connection: string;
  qualification: string;
  links: { label: string; url: string }[];
}
export type ReviewScene = PaperScene | HbmScene | IndustryScene;
export interface PaperPage {
  id: number;
  printedPage: string;
  title: string;
  image: string;
  thumbnail: string;
}
export interface PaperDefinition {
  id: string;
  title: string;
  authors: string;
  citation: string;
  sourceUrl: string;
  pdf: string;
  exportFilename: string;
  /** The original page width / height used to normalize all ROI coordinates. */
  pageSize: { width: number; height: number };
  pages: PaperPage[];
  scenes: ReviewScene[];
  aliases?: Record<string, string>;
  conditions?: Record<string, string>;
  features?: { hbm?: { geometry: unknown; fallback: string } };
}
export interface PaperExportConfig {
  paperId: string;
  assets: Record<string, string>;
}
declare global {
  interface Window {
    __PAPER_EXPORT__?: PaperExportConfig;
  }
}
