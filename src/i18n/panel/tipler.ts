import type { Genislet } from '../tipler';
import type { panelTr } from './tr';

/** Panel/uygulama sözlük tipi — Türkçe kaynaktan türetilir; diğer diller `satisfies PanelSozluk`. */
export type PanelSozluk = Genislet<typeof panelTr>;
