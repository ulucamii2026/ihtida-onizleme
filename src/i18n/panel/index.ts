import type { Dil } from '../diller';
import type { PanelSozluk } from './tipler';
import { panelTr } from './tr';
import { panelFr } from './fr';
import { panelNl } from './nl';
import { panelDe } from './de';
import { panelEn } from './en';

const PANEL_SOZLUKLERI: Record<Dil, PanelSozluk> = { tr: panelTr as PanelSozluk, fr: panelFr, nl: panelNl, de: panelDe, en: panelEn };

export function panelSozluk(dil: Dil): PanelSozluk {
  return PANEL_SOZLUKLERI[dil];
}

export type { PanelSozluk };
