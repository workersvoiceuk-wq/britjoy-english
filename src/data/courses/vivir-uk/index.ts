/**
 * "Vivir en UK": practical survival course for newcomers (transport, GP,
 * Universal Credit, Council Tax, Life in the UK…). Always unlocked, and its
 * lessons can be taken in any order.
 *
 * New unit: add `<topic>.json` here, import it and append it to `units`.
 * Facts change: each unit carries `checked` (date verified against GOV.UK/NHS/TfL).
 */
import type { LevelDefinition, Unit } from '../../../types';

const unit = (data: unknown) => data as Unit;

export const LIFE_LEVEL: LevelDefinition = {
  id: 'UK',
  track: 'life',
  name: 'Vivir en UK',
  description: 'Transporte, médico, ayudas, impuestos y trámites del día a día.',
  accent: '#1D2D5C',
  accentDark: '#111B3A',
  accentLight: '#E3E8F5',
  instructionLanguage: 'es',
  units: [],
};

export { unit };
