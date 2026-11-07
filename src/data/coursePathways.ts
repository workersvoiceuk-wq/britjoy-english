import type { LevelDefinition } from '../types';

export type PathwayDomainId =
  | 'ingles'
  | 'espanol'
  | 'ia'
  | 'ciberseguridad'
  | 'electricidad'
  | 'life-uk'
  | 'conduccion-gb';

export interface BilingualText {
  es: string;
  en: string;
}

export interface OfficialSourceLink {
  label: string;
  url: string;
}

/** Country-situation catalogues: not one of the seven VUM courses and never presented as exam preparation. */
export type SituationCatalogId = 'vivir-uk';

export interface CoursePathway {
  domain: PathwayDomainId | SituationCatalogId;
  checked: '2026-11-07';
  title: BilingualText;
  whatYouLearn: BilingualText[];
  prerequisites: BilingualText;
  privateCertificate: BilingualText;
  externalNextStep: BilingualText;
  strictBoundary: BilingualText;
  sources: OfficialSourceLink[];
  guideDownloadPath: string;
}

export const VUM_PRIVATE_CERT_NOTICE: BilingualText = {
  es: 'Constancia privada local de práctica VUM: el nombre escrito libremente no acredita identidad civil ni equivale a títulos universitarios acreditados, exámenes supervisados ni licencias profesionales.',
  en: 'Private local VUM practice record: a freely typed learner name does not verify legal identity or replace accredited university qualifications, proctored exams, or professional licences.',
};

export const PATHWAYS_BY_DOMAIN: Record<PathwayDomainId, CoursePathway> = {
  ingles: {
    domain: 'ingles',
    checked: '2026-11-07',
    title: {
      es: 'Ruta de Inglés: funcional, laboral y académico (A1 → C2)',
      en: 'English Pathway: Functional, Workplace & Academic (A1 → C2)',
    },
    whatYouLearn: [
      {
        es: 'A1–B1: escucha, lectura, pronunciación, conversaciones cotidianas, salud, transporte, entrevistas y trámites.',
        en: 'A1–B1: listening, reading, pronunciation, everyday conversation, healthcare, transport, interviews and admin.',
      },
      {
        es: 'B2–C2 (profundización académica y profesional inspirada en Oxford CACE): matización (hedging), estructura de textos, argumentación con fuentes y presentaciones.',
        en: 'B2–C2 (academic & professional deepening inspired by Oxford CACE): hedging/stance, paragraph structure, source-backed argument and presentations.',
      },
    ],
    prerequisites: {
      es: 'Ninguno para A1; test de nivel opcional para ubicarte. Curso práctico de lengua (no equivale a un grado en literatura inglesa).',
      en: 'None for A1; optional placement quiz. Practical language course (not a degree in English literature).',
    },
    privateCertificate: VUM_PRIVATE_CERT_NOTICE,
    externalNextStep: {
      es: 'Certificación oficial externa opcional: IELTS, Cambridge English Qualifications o Trinity ISE (UKVI SELT cuando lo exija un visado).',
      en: 'Optional external official certification: IELTS, Cambridge English Qualifications, or Trinity ISE (UKVI SELT when required for visas).',
    },
    strictBoundary: {
      es: 'Inspiración metodológica verificada; University of Oxford y los organismos examinadores no avalan a VUM.',
      en: 'Verified methodological reference only; the University of Oxford and exam boards do not endorse VUM.',
    },
    sources: [
      { label: 'Oxford Language Centre — CACE', url: 'https://www.lang.ox.ac.uk/cace' },
      { label: 'Council of Europe — CEFR Global Scale', url: 'https://www.coe.int/en/web/common-european-framework-reference-languages/table-1-cefr-3.3-common-reference-levels-global-scale' },
    ],
    guideDownloadPath: 'resources/guia-7-cursos-vum-es-en.md',
  },
  espanol: {
    domain: 'espanol',
    checked: '2026-11-07',
    title: {
      es: 'Ruta de Español: progresión MCER y pragmática España / Colombia',
      en: 'Spanish Pathway: CEFR Progression & Spain / Colombia Pragmatics',
    },
    whatYouLearn: [
      {
        es: 'A1–B1: escucha, lectura, conversación, pronunciación y trámites reales en España y Colombia.',
        en: 'A1–B1: listening, reading, conversation, pronunciation, and real civic procedures in Spain and Colombia.',
      },
      {
        es: 'B1–B2 (expansión gradual MCER): diferencias pragmáticas y léxicas España vs Colombia (tú/vosotros vs usted/ustedes), conectores argumentativos y subjuntivo aplicado.',
        en: 'B1–B2 (gradual CEFR expansion): respectful Spain vs Colombia pragmatic/lexical contrasts, argumentative connectors, and applied subjunctive.',
      },
    ],
    prerequisites: {
      es: 'Desde cero en A1; B1 recomendado para el módulo de pragmática y argumentación B1–B2 (C1–C2 completo se incorpora por fases sin prometerlo antes de cubrirlo).',
      en: 'No prior Spanish needed for A1; B1 recommended for the B1–B2 pragmatics & argumentation track (full C1–C2 rolls out progressively without overclaiming).',
    },
    privateCertificate: VUM_PRIVATE_CERT_NOTICE,
    externalNextStep: {
      es: 'Certificación externa oficial opcional: diplomas DELE o examen SIELE del Instituto Cervantes.',
      en: 'Optional official external certification: Instituto Cervantes DELE diplomas or SIELE exam.',
    },
    strictBoundary: {
      es: 'Alineado con descriptores públicos del PCIC y progresión universitaria; ni el Instituto Cervantes ni Oxford avalan a VUM.',
      en: 'Aligned with public PCIC descriptors and university progression; neither Instituto Cervantes nor Oxford endorses VUM.',
    },
    sources: [
      { label: 'Plan Curricular del Instituto Cervantes (PCIC)', url: 'https://cvc.cervantes.es/ensenanza/biblioteca_ele/plan_curricular/' },
      { label: 'University of Oxford — Spanish Courses', url: 'https://www.lang.ox.ac.uk/spanish' },
      { label: 'Exámenes DELE / SIELE', url: 'https://examenes.cervantes.es/' },
    ],
    guideDownloadPath: 'resources/guia-7-cursos-vum-es-en.md',
  },
  ia: {
    domain: 'ia',
    checked: '2026-11-07',
    title: {
      es: 'Ruta de IA: 5 bloques prácticos + profundización algorítmica',
      en: 'AI Pathway: 5 Practical Blocks + Algorithmic Deepening',
    },
    whatYouLearn: [
      {
        es: 'Ruta práctica (5 bloques): fundamentos, productividad con humano al mando, prompts eficaces, privacidad/verificación por país y evaluación de herramientas.',
        en: 'Practical 5-block path: foundations, human-in-the-loop productivity, effective prompting, country-verified privacy/fact-checking, and tool evaluation.',
      },
      {
        es: 'Profundización técnica (inspirada en Harvard CS50 AI): búsqueda, conocimiento lógico, incertidumbre/probabilidad, optimización, ML (clasificación, regresión, sobreajuste), redes neuronales y LLMs.',
        en: 'Technical deepening (inspired by Harvard CS50 AI): search, logical knowledge, uncertainty/probability, optimization, ML (classification, regression, overfitting), neural networks, and LLMs.',
      },
    ],
    prerequisites: {
      es: 'Ruta de 5 bloques: sin programación. Profundización técnica (IA-PRO): álgebra básica, probabilidad elemental y lectura inicial de lógica/Python.',
      en: '5-block practical path: no coding needed. Technical track (IA-PRO): basic algebra, elementary probability, and introductory Python/logic reading.',
    },
    privateCertificate: VUM_PRIVATE_CERT_NOTICE,
    externalNextStep: {
      es: 'Siguiente paso técnico externo: proyectos prácticos en Python y cursos evaluados con código real.',
      en: 'External technical next step: hands-on Python projects and graded programming courses.',
    },
    strictBoundary: {
      es: 'Contenido 100 % original de VUM; ni Google ni Harvard avalan este curso ni otorgan su certificación aquí.',
      en: '100% original VUM material; neither Google nor Harvard endorses this course or issues its certificate here.',
    },
    sources: [
      { label: 'Harvard CS50’s Introduction to AI with Python', url: 'https://cs50.harvard.edu/ai/' },
      { label: 'NIST AI Risk Management Framework', url: 'https://www.nist.gov/aisi/ai-risk-management-framework' },
      { label: 'Reglamento Europeo de IA (UE) 2024/1689', url: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj' },
    ],
    guideDownloadPath: 'resources/guia-7-cursos-vum-es-en.md',
  },
  ciberseguridad: {
    domain: 'ciberseguridad',
    checked: '2026-11-07',
    title: {
      es: 'Ruta de Ciberseguridad: defensa cotidiana y laboratorios aislados',
      en: 'Cybersecurity Pathway: Everyday Defence & Isolated Labs',
    },
    whatYouLearn: [
      {
        es: 'Protección de cuentas (gestor, MFA, passkeys), cifrado y copias 3-2-1, redes/sistemas seguros, software/phishing y privacidad (inspirado en Harvard CS50 Cybersecurity).',
        en: 'Account protection (password managers, MFA, passkeys), encryption & 3-2-1 backups, system/network hygiene, software/phishing defence, and privacy (inspired by Harvard CS50 Cybersecurity).',
      },
      {
        es: 'Respuesta ante incidentes por país: Reino Unido (NCSC / Action Fraud), España (INCIBE 017) y Colombia (CAI Virtual).',
        en: 'Country-specific incident response: UK (NCSC / Action Fraud), Spain (INCIBE 017), and Colombia (CAI Virtual).',
      },
    ],
    prerequisites: {
      es: 'Uso cotidiano de móvil o navegador. Toda práctica es 100 % defensiva en entorno simulado aislado (nunca contra terceros).',
      en: 'Basic phone or browser familiarity. All exercises are 100% defensive inside isolated local simulations (never against third parties).',
    },
    privateCertificate: VUM_PRIVATE_CERT_NOTICE,
    externalNextStep: {
      es: 'Siguiente certificación profesional externa opcional: ISC2 Certified in Cybersecurity (CC) o CompTIA Security+.',
      en: 'Optional external professional certification: ISC2 Certified in Cybersecurity (CC) or CompTIA Security+.',
    },
    strictBoundary: {
      es: 'Formación defensiva ciudadana y conceptual; Harvard, NCSC, INCIBE y CAI Virtual no avalan a VUM.',
      en: 'Defensive civic & conceptual training; Harvard, NCSC, INCIBE, and CAI Virtual do not endorse VUM.',
    },
    sources: [
      { label: 'Harvard CS50 Cybersecurity', url: 'https://cs50.harvard.edu/cybersecurity/weeks/' },
      { label: 'UK National Cyber Security Centre (NCSC)', url: 'https://www.ncsc.gov.uk/' },
      { label: 'España INCIBE (017)', url: 'https://www.incibe.es/ciudadania' },
      { label: 'Colombia CAI Virtual', url: 'https://caivirtual.policia.gov.co/' },
    ],
    guideDownloadPath: 'resources/guia-7-cursos-vum-es-en.md',
  },
  electricidad: {
    domain: 'electricidad',
    checked: '2026-11-07',
    title: {
      es: 'Ruta de Electricidad: teoría en simulador vs habilitación legal por país',
      en: 'Electricity Pathway: Simulator Circuit Theory vs National Licensing',
    },
    whatYouLearn: [
      {
        es: 'Teoría de circuitos en simulador virtual (inspirada en MIT OCW 6.002): elementos concentrados, V/I/R/potencia, Ohm, Kirchhoff (LVK/LCK), serie/paralelo, RC/CA RMS y MOSFET.',
        en: 'Virtual-simulator circuit theory (inspired by MIT OCW 6.002): lumped abstraction, V/I/R/power, Ohm, Kirchhoff (KVL/KCL), series/parallel, RC/AC RMS, and MOSFET switching.',
      },
      {
        es: 'Seguridad doméstica básica (diferencial RCD, magnetotérmico MCB) separada estrictamente de la instalación profesional regulada.',
        en: 'Household electrical safety (RCD, MCB) strictly separated from regulated professional installation work.',
      },
    ],
    prerequisites: {
      es: 'Aritmética para seguridad doméstica; álgebra y física elemental para el bloque de análisis de circuitos.',
      en: 'Arithmetic for household safety; basic algebra and physics for the circuit analysis module.',
    },
    privateCertificate: VUM_PRIVATE_CERT_NOTICE,
    externalNextStep: {
      es: 'Habilitación legal obligatoria por país antes de tocar instalaciones reales: GB (BS 7671 / Part P / NVQ3 + AM2 / ECS), ES (REBT / instalador autorizado), CO (RETIE / matrícula CONTE).',
      en: 'Mandatory national licensing before touching real wiring: UK (BS 7671 / Part P / NVQ3 + AM2 / ECS), ES (REBT / licensed installer), CO (RETIE / CONTE licence).',
    },
    strictBoundary: {
      es: 'ADVERTENCIA DE SEGURIDAD: Este curso es solo conceptual y en simulador sin tensión; NO habilita para abrir cuadros ni manipular cables reales.',
      en: 'SAFETY WARNING: Conceptual & zero-voltage simulator learning only; NEVER authorises opening consumer units or touching live mains.',
    },
    sources: [
      { label: 'MIT OCW 6.002 Circuits & Electronics (CC BY-NC-SA 4.0)', url: 'https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/' },
      { label: 'Electrical Safety First (UK)', url: 'https://www.electricalsafetyfirst.org.uk/' },
      { label: 'BOE — REBT (España)', url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2002-18099' },
    ],
    guideDownloadPath: 'resources/guia-7-cursos-vum-es-en.md',
  },
  'life-uk': {
    domain: 'life-uk',
    checked: '2026-11-07',
    title: {
      es: 'Ruta Reino Unido: examen oficial Life in the UK separado de historia y política',
      en: 'UK Pathway: Official Life in the UK Test Separated from History & Politics',
    },
    whatYouLearn: [
      {
        es: 'Preparación cívica práctica para el examen oficial Life in the UK (24 preguntas, 45 min) y trámites verificados en GOV.UK / NHS.',
        en: 'Practical civic preparation for the official Life in the UK Test (24 questions, 45 min) and verified GOV.UK / NHS procedures.',
      },
      {
        es: 'Bloque cultural separado (UK-HIST, inspirado en Oxford History & Politics): evolución constitucional, Parlamento y devolución comparada.',
        en: 'Separate cultural deepening block (UK-HIST, inspired by Oxford History & Politics): constitutional evolution, Parliament, and comparative devolution.',
      },
    ],
    prerequisites: {
      es: 'Lectura básica en inglés o español; el examen oficial real se realiza en inglés (o galés/gaélico escocés según derecho legal).',
      en: 'Basic English or Spanish reading; the real official test is taken in English (or Welsh/Scottish Gaelic where legally applicable).',
    },
    privateCertificate: VUM_PRIVATE_CERT_NOTICE,
    externalNextStep: {
      es: 'Examen oficial supervisado: reserva única y exclusivamente en GOV.UK (https://www.gov.uk/life-in-the-uk-test) sin intermediarios con sobreprecio.',
      en: 'Official proctored test: book exclusively on GOV.UK (https://www.gov.uk/life-in-the-uk-test) without mark-up middlemen.',
    },
    strictBoundary: {
      es: 'El bloque de profundización histórica es cultura constitucional opcional y está separado del temario estricto del examen oficial.',
      en: 'The historical/political deepening module is optional cultural context and strictly separated from the official test syllabus.',
    },
    sources: [
      { label: 'GOV.UK — Life in the UK Test', url: 'https://www.gov.uk/life-in-the-uk-test' },
      { label: 'University of Oxford — History and Politics', url: 'https://www.ox.ac.uk/admissions/undergraduate/courses/course-listing/history-and-politics' },
    ],
    guideDownloadPath: 'resources/guia-7-cursos-vum-es-en.md',
  },
  'conduccion-gb': {
    domain: 'conduccion-gb',
    checked: '2026-11-07',
    title: {
      es: 'Ruta Conducción GB: Highway Code oficial separado de movilidad sostenible',
      en: 'GB Driving Pathway: Official Highway Code Separated from Sustainable Mobility',
    },
    whatYouLearn: [
      {
        es: 'Normativa oficial de Gran Bretaña (The Highway Code): Jerarquía de Usuarios Viales (Reglas H1–H3), prioridades, autopistas (red X), distancias de frenado, DVLA y MOT.',
        en: 'Official Great Britain rules (The Highway Code): Hierarchy of Road Users (Rules H1–H3), priority, smart motorways (red X), stopping distances, DVLA, and MOT.',
      },
      {
        es: 'Bloque separado de movilidad sostenible y análisis del transporte (inspirado en UCL Transport): Vision Zero, riesgo sistémico y movilidad activa.',
        en: 'Separate sustainable mobility & transport analysis module (inspired by UCL Transport): Vision Zero, systemic safety, and active travel.',
      },
    ],
    prerequisites: {
      es: 'Comprobar edad mínima y requisitos de permiso provisional en GOV.UK / DVLA (Irlanda del Norte usa DVA).',
      en: 'Check minimum age and provisional licence rules on GOV.UK / DVLA (Northern Ireland uses DVA).',
    },
    privateCertificate: VUM_PRIVATE_CERT_NOTICE,
    externalNextStep: {
      es: 'Habilitación legal para conducir: permiso provisional DVLA + DVSA Theory & Hazard Perception Test + clases prácticas (ADI) + examen práctico DVSA.',
      en: 'Legal driving entitlement: DVLA provisional licence + DVSA Theory & Hazard Perception Test + practical training (ADI) + DVSA practical driving test.',
    },
    strictBoundary: {
      es: 'Estudio teórico y cívico; nunca sustituye la formación práctica en vehículo ni los exámenes oficiales de la DVSA.',
      en: 'Theoretical & civic study only; never replaces in-car instruction or official DVSA driving examinations.',
    },
    sources: [
      { label: 'GOV.UK — The Official Highway Code', url: 'https://www.gov.uk/guidance/the-highway-code' },
      { label: 'GOV.UK — Driving Theory Test (DVSA)', url: 'https://www.gov.uk/theory-test' },
      { label: 'UCL Centre for Transport Studies', url: 'https://www.ucl.ac.uk/transport/study' },
    ],
    guideDownloadPath: 'resources/guia-7-cursos-vum-es-en.md',
  },
};

/**
 * «Vivir en UK» and its country situations (council, ciudades, migrar, consulados) are practical procedures, kept apart
 * from the Life in the UK exam course: no exam syllabus, no test claims, official sources only.
 */
export const SITUATION_PATHWAY: CoursePathway = {
  domain: 'vivir-uk',
  checked: '2026-11-07',
  title: {
    es: 'Vivir en el Reino Unido: situaciones y trámites reales (no es el curso de examen Life in the UK)',
    en: 'Living in the UK: real situations and procedures (not the Life in the UK test course)',
  },
  whatYouLearn: [
    {
      es: 'Situaciones prácticas con el inglés que necesitas: GP y 111, alquiler, council tax, banco, trabajo, colegios, transporte y tu barrio.',
      en: 'Practical situations with the English you need: GP and 111, renting, council tax, banking, work, schools, transport and your area.',
    },
    {
      es: 'Trámites según tu país y tu ciudad (migrar, council, consulados), contrastados con GOV.UK y NHS.',
      en: 'Procedures by country and city (moving to the UK, your council, consulates), checked against GOV.UK and NHS.',
    },
  ],
  prerequisites: {
    es: 'Ninguno. Las normas cambian: confirma siempre tu caso en GOV.UK, NHS o tu council.',
    en: 'None. Rules change: always confirm your own case on GOV.UK, NHS or your council.',
  },
  privateCertificate: VUM_PRIVATE_CERT_NOTICE,
  externalNextStep: {
    es: 'Si preparas el examen oficial, usa el curso Life in the UK y reserva solo en GOV.UK (https://www.gov.uk/life-in-the-uk-test).',
    en: 'If you are preparing for the official test, use the Life in the UK course and book only on GOV.UK (https://www.gov.uk/life-in-the-uk-test).',
  },
  strictBoundary: {
    es: 'Orientación práctica, no asesoría legal ni migratoria, y separada del temario del examen Life in the UK.',
    en: 'Practical guidance, not legal or immigration advice, and separate from the Life in the UK test syllabus.',
  },
  sources: [
    { label: 'GOV.UK', url: 'https://www.gov.uk/' },
    { label: 'NHS — Health A to Z and services', url: 'https://www.nhs.uk/' },
    { label: 'GOV.UK — Find your local council', url: 'https://www.gov.uk/find-local-council' },
  ],
  guideDownloadPath: 'resources/guia-7-cursos-vum-es-en.md',
};

const SITUATION_TRACKS = new Set(['life', 'migrar-uk', 'ciudades', 'consulados']);
const SITUATION_CATALOG_COURSES = new Set(['vivir-en-uk', 'tu-council', 'migrar-uk', 'consulados-londres']);

export function pathwayForLevel(level: Pick<LevelDefinition, 'id' | 'track' | 'targetLanguage'>): CoursePathway {
  const id = level.id.toUpperCase();
  if (id === 'CIBER') return PATHWAYS_BY_DOMAIN.ciberseguridad;
  if (id === 'ELEC') return PATHWAYS_BY_DOMAIN.electricidad;
  if (id === 'COND-GB') return PATHWAYS_BY_DOMAIN['conduccion-gb'];
  if (id === 'IA' || id === 'IA-PRO' || level.track === 'ai') return PATHWAYS_BY_DOMAIN.ia;
  if (id === 'ES-MCER' || level.targetLanguage === 'es') return PATHWAYS_BY_DOMAIN.espanol;
  if (id === 'UK-HIST') return PATHWAYS_BY_DOMAIN['life-uk'];
  if (SITUATION_TRACKS.has(level.track)) return SITUATION_PATHWAY;
  return PATHWAYS_BY_DOMAIN.ingles;
}

export function pathwayForCatalogCourseId(courseId: string, levels: LevelDefinition[]): CoursePathway {
  // Whole-word prefixes only: «colombia», «historia» and «dia-a-dia» contain «ia» but are not the AI course.
  if (courseId.startsWith('ciber')) return PATHWAYS_BY_DOMAIN.ciberseguridad;
  if (courseId.startsWith('electricidad')) return PATHWAYS_BY_DOMAIN.electricidad;
  if (courseId.startsWith('conduccion')) return PATHWAYS_BY_DOMAIN['conduccion-gb'];
  if (courseId === 'ia' || courseId.startsWith('ia-')) return PATHWAYS_BY_DOMAIN.ia;
  if (courseId.startsWith('espanol') || courseId.endsWith('-espanol')) return PATHWAYS_BY_DOMAIN.espanol;
  if (courseId === 'uk-historia-instituciones') return PATHWAYS_BY_DOMAIN['life-uk'];
  if (SITUATION_CATALOG_COURSES.has(courseId)) return SITUATION_PATHWAY;
  if (levels[0]) return pathwayForLevel(levels[0]);
  return PATHWAYS_BY_DOMAIN.ingles;
}
