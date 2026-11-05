/**
 * "Vivir en UK": practical survival course for newcomers (transport, GP,
 * Universal Credit, Council Tax, Life in the UK…). Always unlocked, and its
 * lessons can be taken in any order.
 *
 * New unit: add `<topic>.json` here, import it and append it to `units`.
 * Facts change: each unit carries `checked` (date verified against GOV.UK/NHS/TfL).
 */
import type { LevelDefinition, Unit } from '../../../types';

import transporte from './transporte.json';
import salud from './salud.json';
import universalCredit from './universal-credit.json';
import councilTax from './council-tax.json';
import vidaUk from './vida-uk.json';
import espana from './espana.json';
import alquiler from './alquiler.json';
import trabajo from './trabajo.json';
import colegios from './colegios.json';
import consumo from './consumo.json';
import banco from './banco.json';
import facturas from './facturas.json';
import impuestos from './impuestos.json';
import familia from './familia.json';
import emergencias from './emergencias.json';
import conducir from './conducir.json';
import dentista from './dentista.json';
import barrio from './barrio.json';

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
  units: [
    unit(transporte), unit(salud), unit(emergencias), unit(dentista), unit(universalCredit), unit(councilTax),
    unit(alquiler), unit(facturas), unit(banco), unit(trabajo), unit(impuestos), unit(familia), unit(colegios),
    unit(consumo), unit(conducir), unit(barrio), unit(vidaUk), unit(espana),
  ],
};

