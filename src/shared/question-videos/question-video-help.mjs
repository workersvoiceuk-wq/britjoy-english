// Reusable audiovisual & visual-example question help system for all 7 courses.
// Pedagogical structure inspired by Busuu micro-lessons (context -> visual example ->
// practice tip -> feedback focus), authored 100% with original BritJoy / VUM copy,
// diagrams, transcripts, and verified technical/official sources.
//
// Editorial states: 'draft' | 'review' | 'ready'.
// Only concepts with status === 'ready' AND a valid relative video path are playable.
// When status is 'draft' or 'review' (or offline / media error), the component keeps
// the textual explanation, visual example, and transcript without simulating a video.

export const QUESTION_VIDEO_SCHEMA_VERSION = '1.0.0';
export const QUESTION_VIDEO_UPDATED_AT = '2026-11-06';
export const EDITORIAL_STATES = Object.freeze(['draft', 'review', 'ready']);

// Preserves the 7 existing owner-approved course avatars (portrait-files.mjs).
export const COURSE_AVATAR_ART = Object.freeze({
  britjoy: 'britjoy-english/course/britjoy-lifeuk.webp',
  ingles: 'britjoy-english/course/britjoy-ingles.webp',
  espanol: 'britjoy-english/course/britjoy-espanol.webp',
  ia: 'britjoy-english/course/britjoy-ia.webp',
  conduccion: 'britjoy-english/course/britjoy-conduccion.webp',
  ciberseguridad: 'britjoy-english/course/britjoy-ciberseguridad.webp',
  electricidad: 'britjoy-english/course/britjoy-electricidad.webp',
});

export const PEDAGOGICAL_REFERENCE = Object.freeze({
  title: 'Busuu Help Centre — What is Busuu? (micro-lesson pedagogy reference)',
  url: 'https://help.busuu.com/hc/en-gb/articles/15936615354641-What-is-Busuu',
  kind: 'pedagogical',
});

const UI_TEXT = Object.freeze({
  openExplain: {
    es: 'Ver explicación',
    en: 'See explanation',
    pl: 'Zobacz wyjaśnienie',
    ro: 'Vezi explicația',
    pt: 'Ver explicação',
    ar: 'عرض الشرح',
    ur: 'وضاحت دیکھیں',
    'pa-Guru': 'ਵਿਆਖਿਆ ਵੇਖੋ',
    fr: 'Voir l’explication',
    it: 'Vedi spiegazione',
  },
  openExample: {
    es: 'Ver ejemplo',
    en: 'See example',
    pl: 'Zobacz przykład',
    ro: 'Vezi exemplul',
    pt: 'Ver exemplo',
    ar: 'عرض المثال',
    ur: 'مثال دیکھیں',
    'pa-Guru': 'ਉਦਾਹਰਨ ਵੇਖੋ',
    fr: 'Voir l’exemple',
    it: 'Vedi esempio',
  },
  closePanel: {
    es: 'Cerrar',
    en: 'Close',
    pl: 'Zamknij',
    ro: 'Închide',
    pt: 'Fechar',
    ar: 'إغلاق',
    ur: 'بند کریں',
    'pa-Guru': 'ਬੰਦ ਕਰੋ',
    fr: 'Fermer',
    it: 'Chiudi',
  },
  playVideo: {
    es: 'Reproducir vídeo',
    en: 'Play video',
    pl: 'Odtwórz wideo',
    ro: 'Redă videoclipul',
    pt: 'Reproduzir vídeo',
    ar: 'تشغيل الفيديو',
    ur: 'ویڈیو چلائیں',
    'pa-Guru': 'ਵੀਡੀਓ ਚਲਾਓ',
    fr: 'Lire la vidéo',
    it: 'Riproduci video',
  },
  pauseVideo: {
    es: 'Pausar vídeo',
    en: 'Pause video',
    pl: 'Wstrzymaj wideo',
    ro: 'Pauză video',
    pt: 'Pausar vídeo',
    ar: 'إيقاف الفيديو مؤقتاً',
    ur: 'ویڈیو روکیں',
    'pa-Guru': 'ਵੀਡੀਓ ਰੋਕੋ',
    fr: 'Mettre en pause',
    it: 'Metti in pausa',
  },
  badgeMicro: {
    es: 'Microlección BritJoy · Guía paso a paso',
    en: 'BritJoy Micro-lesson · Step-by-step guide',
    pl: 'Mikrolekcja BritJoy · Przewodnik krok po kroku',
    ro: 'Microlecție BritJoy · Ghid pas cu pas',
    pt: 'Microlicão BritJoy · Guia passo a passo',
    ar: 'درس مصغر من BritJoy · دليل خطوة بخطوة',
    ur: 'برٹ جوائے مائیکرو سبق · مرحلہ وار گائیڈ',
    'pa-Guru': 'BritJoy ਮਾਈਕ੍ਰੋ-ਪਾਠ · ਕਦਮ-ਦਰ-ਕਦਮ ਗਾਈਡ',
    fr: 'Micro-leçon BritJoy · Guide pas à pas',
    it: 'Micro-lezione BritJoy · Guida passo passo',
  },
  // Learner-facing: no internal workflow words («editorial», «ready»). Non-ES/EN wording needs native review.
  statusPendingNote: {
    es: 'Vídeo en preparación. Mientras tanto, tienes la explicación escrita y el ejemplo visual.',
    en: 'Video in preparation. Meanwhile, here are the written explanation and the visual example.',
    pl: 'Wideo jest w przygotowaniu. Tymczasem masz wyjaśnienie tekstowe i przykład wizualny.',
    ro: 'Videoclipul este în pregătire. Între timp, ai explicația textuală și exemplul vizual.',
    pt: 'Vídeo em preparação. Entretanto, tens a explicação escrita e o exemplo visual.',
    ar: 'الفيديو قيد الإعداد. في الأثناء، يتوفر لك الشرح النصي والمثال المرئي.',
    ur: 'ویڈیو تیاری میں ہے۔ اس دوران متنی وضاحت اور بصری مثال دستیاب ہیں۔',
    'pa-Guru': 'ਵੀਡੀਓ ਤਿਆਰ ਕੀਤੀ ਜਾ ਰਹੀ ਹੈ। ਇਸ ਦੌਰਾਨ ਲਿਖਤੀ ਵਿਆਖਿਆ ਅਤੇ ਵਿਜ਼ੂਅਲ ਉਦਾਹਰਨ ਉਪਲਬਧ ਹਨ।',
    fr: 'Vidéo en préparation. En attendant, voici l’explication écrite et l’exemple visuel.',
    it: 'Video in preparazione. Nel frattempo, hai la spiegazione scritta e l’esempio visivo.',
  },
  videoFallbackNote: {
    es: 'El archivo de vídeo no está disponible sin conexión o no pudo cargarse. Conservamos la explicación textual, el ejemplo visual y la transcripción completa.',
    en: 'The video file is unavailable offline or could not be loaded. The text explanation, visual example, and full transcript remain available below.',
    pl: 'Plik wideo jest niedostępny offline lub nie mógł zostać załadowany. Poniżej dostępne są wyjaśnienie tekstowe, przykład wizualny i transkrypcja.',
    ro: 'Fișierul video nu este disponibil offline sau nu s-a putut încărca. Explicația textuală, exemplul vizual și transcrierea rămân disponibile.',
    pt: 'O ficheiro de vídeo não está disponível offline ou falhou ao carregar. Mantemos a explicação textual, o exemplo visual e a transcrição.',
    ar: 'ملف الفيديو غير متاح بدون اتصال أو تعذر تحميله. يظل الشرح النصي والمثال المرئي والنص الكامل متاحين أدناه.',
    ur: 'ویڈیو فائل آف لائن دستیاب نہیں ہے یا لوڈ نہیں ہو سکی۔ متنی وضاحت، بصری مثال اور مکمل ٹرانسکرپٹ نیچے موجود ہیں۔',
    'pa-Guru': 'ਵੀਡੀਓ ਫਾਈਲ ਆਫਲਾਈਨ ਉਪਲਬਧ ਨਹੀਂ ਹੈ ਜਾਂ ਲੋਡ ਨਹੀਂ ਹੋ ਸਕੀ। ਲਿਖਤੀ ਵਿਆਖਿਆ, ਵਿਜ਼ੂਅਲ ਉਦਾਹਰਨ ਅਤੇ ਟ੍ਰਾਂਸਕ੍ਰਿਪਟ ਹੇਠਾਂ ਉਪਲਬਧ ਹਨ।',
    fr: 'Le fichier vidéo est indisponible hors ligne ou n’a pas pu être chargé. L’explication textuelle, l’exemple visuel et la transcription restent disponibles.',
    it: 'Il file video non è disponibile offline o non può essere caricato. Spiegazione testuale, esempio visivo e trascrizione restano disponibili.',
  },
  contextHeading: {
    es: '1. Contexto en situación real',
    en: '1. Real-life context',
    pl: '1. Kontekst w realnej sytuacji',
    ro: '1. Context în situație reală',
    pt: '1. Contexto em situação real',
    ar: '1. السياق في موقف حقيقي',
    ur: '1. حقیقی صورتحال کا سیاق و سباق',
    'pa-Guru': '1. ਅਸਲ ਜੀਵਨ ਦਾ ਸੰਦਰਭ',
    fr: '1. Contexte en situation réelle',
    it: '1. Contesto in situazione reale',
  },
  visualHeading: {
    es: '2. Ejemplo visual guiado',
    en: '2. Guided visual example',
    pl: '2. Wizualny przykład z przewodnikiem',
    ro: '2. Exemplu vizual ghidat',
    pt: '2. Exemplo visual guiado',
    ar: '2. مثال مرئي موجه',
    ur: '2. رہنمائی شدہ بصری مثال',
    'pa-Guru': '2. ਗਾਈਡਡ ਵਿਜ਼ੂਅਲ ਉਦਾਹਰਨ',
    fr: '2. Exemple visuel guidé',
    it: '2. Esempio visivo guidato',
  },
  practiceHeading: {
    es: '3. Práctica rápida',
    en: '3. Quick practice check',
    pl: '3. Szybka praktyka',
    ro: '3. Practică rapidă',
    pt: '3. Prática rápida',
    ar: '3. تدريب سريع',
    ur: '3. فوری مشق',
    'pa-Guru': '3. ਤੇਜ਼ ਅਭਿਆਸ',
    fr: '3. Pratique rapide',
    it: '3. Pratica rapida',
  },
  feedbackHeading: {
    es: '4. Clave para responder',
    en: '4. Key to answering',
    pl: '4. Klucz do odpowiedzi',
    ro: '4. Cheia răspunsului',
    pt: '4. Chave para responder',
    ar: '4. مفتاح الإجابة',
    ur: '4. جواب دینے کی کلید',
    'pa-Guru': '4. ਜਵਾਬ ਦੇਣ ਦੀ ਕੁੰਜੀ',
    fr: '4. Clé pour répondre',
    it: '4. Chiave per rispondere',
  },
  transcriptHeading: {
    es: 'Transcripción del guion didáctico',
    en: 'Didactic script transcript',
    pl: 'Transkrypcja scenariusza dydaktycznego',
    ro: 'Transcrierea scenariului didactic',
    pt: 'Transcrição do guião didático',
    ar: 'نص السيناريو التعليمي',
    ur: 'تدریسی اسکرپٹ کا ٹرانسکرپٹ',
    'pa-Guru': 'ਸਿੱਖਿਆਦਾਇਕ ਸਕ੍ਰਿਪਟ ਟ੍ਰਾਂਸਕ੍ਰਿਪਟ',
    fr: 'Transcription du script pédagogique',
    it: 'Trascrizione dello script didattico',
  },
  sourcesHeading: {
    es: 'Fuentes verificadas',
    en: 'Verified sources',
    pl: 'Zweryfikowane źródła',
    ro: 'Surse verificate',
    pt: 'Fontes verificadas',
    ar: 'المصادر الموثقة',
    ur: 'تصدیق شدہ ذرائع',
    'pa-Guru': 'ਪ੍ਰਮਾਣਿਤ ਸਰੋਤ',
    fr: 'Sources vérifiées',
    it: 'Fonti verificate',
  },
  noScoreNotice: {
    es: 'Consultar esta explicación es opcional: no cambia tu respuesta ni otorga XP automáticamente.',
    en: 'Viewing this explanation is optional: it does not change your answer or grant XP automatically.',
    pl: 'Wyświetlenie tego wyjaśnienia jest opcjonalne: nie zmienia odpowiedzi ani nie przyznaje punktów XP.',
    ro: 'Consultarea acestei explicații este opțională: nu schimbă răspunsul și nu acordă XP automat.',
    pt: 'Consultar esta explicação é opcional: não altera a sua resposta nem atribui XP automaticamente.',
    ar: 'الاطلاع على هذا الشرح اختياري: لا يغير إجابتك ولا يمنح نقاط خبرة تلقائياً.',
    ur: 'یہ وضاحت دیکھنا اختیاری ہے: اس سے آپ کا جواب تبدیل نہیں ہوتا اور نہ ہی خودکار XP ملتا ہے۔',
    'pa-Guru': 'ਇਹ ਵਿਆਖਿਆ ਵੇਖਣਾ ਵਿਕਲਪਿਕ ਹੈ: ਇਹ ਤੁਹਾਡਾ ਜਵਾਬ ਨਹੀਂ ਬਦਲਦਾ ਅਤੇ ਨਾ ਹੀ ਆਪਣੇ ਆਪ XP ਦਿੰਦਾ ਹੈ।',
    fr: 'Consulter cette explication est facultatif : cela ne modifie pas votre réponse et n’accorde pas d’XP automatiquement.',
    it: 'Consultare questa spiegazione è facoltativo: non modifica la risposta e non assegna XP automaticamente.',
  },
});

export function localizePair(locale, pairOrString) {
  if (typeof pairOrString === 'string') return pairOrString;
  if (!Array.isArray(pairOrString)) return '';
  const lang = String(locale || 'es').toLowerCase();
  if (lang === 'es' || lang.startsWith('es-')) return pairOrString[0] ?? pairOrString[1] ?? '';
  return pairOrString[1] ?? pairOrString[0] ?? '';
}

export function uiCopy(locale, key) {
  const table = UI_TEXT[key];
  if (!table) return key;
  const raw = String(locale || 'es');
  if (table[raw]) return table[raw];
  const short = raw.split('-')[0].toLowerCase();
  return table[short] || table.en || table.es || key;
}

const ALLOWED_MEDIA_EXTENSIONS = /\.(mp4|webm|webp|png|jpg|jpeg|svg|vtt)$/i;

export function isValidRelativeMediaPath(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^[a-z][a-z\d+.-]*:/i.test(trimmed) || /[?#%\x00-\x20]/.test(trimmed)) return false;
  if (/^(https?:|data:|blob:|file:|javascript:|\/\/|\/)/i.test(trimmed)) return false;
  if (trimmed.includes('..') || trimmed.includes('\\')) return false;
  return ALLOWED_MEDIA_EXTENSIONS.test(trimmed);
}

export function resolveRelativeMediaUrl(relativePath, baseUrl = './') {
  if (!isValidRelativeMediaPath(relativePath)) return null;
  const cleanRel = relativePath.trim().replace(/^\.\//, '');
  const rawBase = typeof baseUrl === 'string' && baseUrl.trim() ? baseUrl.trim() : './';
  const normalizedBase = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
  return `${normalizedBase}${cleanRel}`;
}

export function isConceptPlayable(concept) {
  if (!concept || typeof concept !== 'object') return false;
  if (concept.status !== 'ready') return false;
  return isValidRelativeMediaPath(concept.video?.src) && /\.(mp4|webm)$/i.test(concept.video.src.trim());
}

export function inferCourseIdFromLesson({ courseId, lessonId, track, targetLanguage } = {}) {
  const validCourses = new Set(['ingles', 'espanol', 'britjoy', 'ia', 'conduccion', 'ciberseguridad', 'electricidad']);
  if (typeof courseId === 'string' && validCourses.has(courseId)) return courseId;
  const lid = typeof lessonId === 'string' ? lessonId : '';
  if (lid.startsWith('uk-conducir')) return 'conduccion';
  if (lid === 'uk-banco-l2' || lid.startsWith('ciberseguridad')) return 'ciberseguridad';
  if (lid === 'uk-facturas-l1' || lid.startsWith('electricidad')) return 'electricidad';
  if (lid.startsWith('ia-') || track === 'ai') return 'ia';
  if (lid.startsWith('uk-vida') || track === 'life' || track === 'migrar-uk' || track === 'ciudades') return 'britjoy';
  // A known target language wins over ID/track prefixes: BritJoy «dia-…» lessons teach ENGLISH to
  // Spanish speakers and must not be treated as the Spanish course.
  if (
    targetLanguage === 'es' ||
    (targetLanguage !== 'en' &&
      (track === 'spain' ||
        track === 'colombia' ||
        track === 'consulados' ||
        lid.startsWith('dia-') ||
        lid.startsWith('es-')))
  ) {
    return 'espanol';
  }
  return 'ingles';
}

// Versioned manifest for the 7 courses.
// All 7 initial concepts are marked 'draft' with video.src = null until final MP4 files
// pass editorial review. No URLs are invented and no unreceived media is marked 'ready'.
export const QUESTION_VIDEO_MANIFEST = Object.freeze({
  schemaVersion: QUESTION_VIDEO_SCHEMA_VERSION,
  updatedAt: QUESTION_VIDEO_UPDATED_AT,
  editorialStates: EDITORIAL_STATES,
  pedagogicalReference: PEDAGOGICAL_REFERENCE,
  concepts: Object.freeze([
    {
      conceptId: 'ingles-morning-greeting',
      courseId: 'ingles',
      avatarId: 'ingles',
      avatarArt: COURSE_AVATAR_ART.ingles,
      country: null,
      status: 'draft',
      durationSeconds: 30,
      locales: ['es', 'en'],
      video: {
        src: null,
        poster: null,
        captions: { es: null, en: null },
      },
      title: [
        'Saludo por la mañana y presentación natural',
        'Morning greeting and natural introduction',
      ],
      context: [
        'En el Reino Unido, al llegar por la mañana a recepción, al trabajo o a una cita, "Good morning" abre la conversación con cortesía antes de decir tu nombre ("my name is...").',
        'In the UK, when arriving in the morning at reception, work, or an appointment, "Good morning" politely opens the interaction before sharing your name ("my name is...").',
      ],
      visualExample: {
        kind: 'morning-greeting',
        badge: ['08:30 · Recepción / Trabajo', '08:30 · Reception / Work'],
        heading: ['Estructura en dos pasos: saludo + nombre', 'Two-step pattern: greeting + name'],
        primary: [
          'Good morning, my name is Ana. → Buenos días, me llamo Ana.',
          'Good morning, my name is Ana. → Polite morning opener + full introduction.',
        ],
        secondary: [
          'Contraste horario: 08:30 Good morning · 15:00 Good afternoon · 22:30 Good night (al despedirse).',
          'Time contrast: 08:30 Good morning · 15:00 Good afternoon · 22:30 Good night (when leaving/going to sleep).',
        ],
        callout: [
          'Pista visual: observa el reloj de la mañana; "Good night" no se usa para saludar al llegar.',
          'Visual cue: check the morning clock; "Good night" is a parting phrase, not an arrival greeting.',
        ],
        steps: [
          ['1. Saludo según la hora', '1. Time-appropriate greeting', 'Good morning'],
          ['2. Presentación clara', '2. Clear introduction', 'my name is Ana'],
          ['3. Cierre cortés', '3. Polite follow-up', 'Nice to meet you'],
        ],
      },
      practice: {
        prompt: [
          'Comprueba: si entras a tu turno a las 9:00 y quieres presentarte, ¿qué parte va primero?',
          'Quick check: if you start your shift at 9:00 am and want to introduce yourself, which part comes first?',
        ],
        takeaway: [
          'Primero "Good morning" (momento del día) y después "my name is..." o "I am...".',
          'Start with "Good morning" (time of day) followed by "my name is..." or "I am...".',
        ],
      },
      feedback: [
        'Al elegir entre opciones con horas del día, descarta "Good night" al llegar y diferencia saludo inicial de despedida.',
        'When choosing between time-of-day options, rule out "Good night" on arrival and distinguish a greeting from a farewell.',
      ],
      transcript: [
        {
          at: '00:00',
          speaker: 'BritJoy',
          text: [
            'Imagina que llegas a las ocho y media de la mañana a una oficina o centro de salud en el Reino Unido.',
            'Imagine arriving at 8:30 in the morning at an office or health centre in the UK.',
          ],
        },
        {
          at: '00:08',
          speaker: 'BritJoy',
          text: [
            'Para sonar natural y educado, combina dos piezas: "Good morning" para saludar por la mañana y "my name is Ana" para decir quién eres.',
            'To sound natural and polite, combine two building blocks: "Good morning" to greet in the morning and "my name is Ana" to say who you are.',
          ],
        },
        {
          at: '00:18',
          speaker: 'BritJoy',
          text: [
            'Recuerda el cambio de tramo: después del mediodía usamos "Good afternoon", mientras que "Good night" se reserva para despedirse por la noche.',
            'Remember the time shift: after noon we use "Good afternoon", while "Good night" is reserved for saying goodbye at night.',
          ],
        },
      ],
      captions: [
        { start: 0, end: 8, text: ['08:30 AM: llega y saluda con cortesía.', '08:30 AM: arrive and greet politely.'] },
        { start: 8, end: 18, text: ['"Good morning, my name is Ana."', '"Good morning, my name is Ana."'] },
        { start: 18, end: 30, text: ['Mañana: Good morning · Tarde: Good afternoon.', 'Morning: Good morning · Afternoon: Good afternoon.'] },
      ],
      sources: [
        PEDAGOGICAL_REFERENCE,
        {
          title: 'Council of Europe — CEFR A1 Oral Interaction (Greetings and introductions)',
          url: 'https://www.coe.int/en/web/common-european-framework-reference-languages/table-1-cefr-3.3-common-reference-levels-global-scale',
          kind: 'official',
        },
      ],
      mappings: [
        {
          courseId: 'ingles',
          lessonId: 'hello',
          questionId: 'hello',
          note: 'Primary mapping: ingles/hello (Empieza el día con un saludo natural / Good morning, my name is Ana).',
        },
        {
          courseId: 'ingles',
          lessonId: 'a1-u1-l1',
          questionId: 'a1-u1-l1:4',
          note: 'BritJoy English A1 Unit 1 Lesson 1 multiple choice (Good morning).',
        },
        {
          courseId: 'ingles',
          lessonId: 'a1-u1-l1',
          questionId: 'a1-u1-l1:5',
          note: 'BritJoy English A1 Unit 1 Lesson 1 listening (Good morning).',
        },
      ],
    },
    {
      conceptId: 'espanol-ser-presentacion',
      courseId: 'espanol',
      avatarId: 'espanol',
      avatarArt: COURSE_AVATAR_ART.espanol,
      country: null,
      status: 'draft',
      durationSeconds: 32,
      locales: ['es', 'en'],
      video: {
        src: null,
        poster: null,
        captions: { es: null, en: null },
      },
      title: [
        'Presentarse con el verbo «ser»: Yo soy, tú eres, él/ella es',
        'Introducing yourself with "ser": Yo soy, tú eres, él/ella es',
      ],
      context: [
        'En español usamos el verbo «ser» para identificar quién eres, tu origen y tu profesión. Cada pronombre personal lleva su propia forma en presente.',
        'In Spanish we use the verb "ser" to state who you are, where you are from, and your profession. Each subject pronoun has its own present-tense form.',
      ],
      visualExample: {
        kind: 'ser-pronouns',
        badge: ['Gramática en contexto · Verbo SER', 'Grammar in context · Verb SER'],
        heading: ['Concordancia entre sujeto y verbo «ser»', 'Subject–verb agreement with "ser"'],
        primary: [
          'Yo soy Ana. · Tú eres de Londres. · Mi madre es profesora.',
          'Yo soy Ana. (I am Ana) · Tú eres de Londres. (You are from London) · Mi madre es profesora. (My mother is a teacher).',
        ],
        secondary: [
          'No confundas: «soy» (1.ª persona: yo), «eres» (2.ª persona: tú), «es» (3.ª persona: él/ella/usted).',
          'Do not mix up: "soy" (1st person: yo), "eres" (2nd person: tú), "es" (3rd person: él/ella/usted).',
        ],
        callout: [
          'Fíjate siempre en el sujeto antes del hueco: si empieza por «Yo», la única forma correcta de «ser» en presente es «soy».',
          'Always check the subject before the blank: when it starts with "Yo", the only matching present form of "ser" is "soy".',
        ],
        steps: [
          ['Yo → soy', 'Yo (I) → soy', 'Yo soy Ana'],
          ['Tú → eres', 'Tú (You) → eres', 'Tú eres de Londres'],
          ['Él / Ella → es', 'Él / Ella (He/She) → es', 'Mi madre es profesora'],
        ],
      },
      practice: {
        prompt: [
          'Observa el sujeto antes del espacio en blanco: «Yo ___ Ana». ¿Qué persona gramatical habla?',
          'Look at the subject before the blank: "Yo ___ Ana". Which grammatical person is speaking?',
        ],
        takeaway: [
          'Habla la primera persona del singular («Yo»), que concuerda exclusivamente con «soy».',
          'It is the first-person singular ("Yo"), which agrees exclusively with "soy".',
        ],
      },
      feedback: [
        'Identifica primero quién realiza la acción (Yo / Tú / Él o Ella) y enlázalo con su terminación: soy / eres / es.',
        'Identify who the subject is first (Yo / Tú / Él or Ella) and match it to soy / eres / es.',
      ],
      transcript: [
        {
          at: '00:00',
          speaker: 'BritJoy',
          text: [
            'Cuando te presentas en español en una oficina, en el médico o ante nuevos vecinos, el verbo clave es «ser».',
            'When you introduce yourself in Spanish at an office, a clinic, or to new neighbours, the key verb is "ser".',
          ],
        },
        {
          at: '00:10',
          speaker: 'BritJoy',
          text: [
            'Mira cómo cambia la forma según la persona: con «Yo» decimos «Yo soy Ana»; con «Tú» decimos «Tú eres de Londres».',
            'Notice how the form changes with the person: with "Yo" we say "Yo soy Ana"; with "Tú" we say "Tú eres de Londres".',
          ],
        },
        {
          at: '00:21',
          speaker: 'BritJoy',
          text: [
            'Y si hablamos de otra persona, como «mi madre» o «él», usamos «es»: «Mi madre es profesora». Mira siempre el sujeto antes de elegir.',
            'And when speaking about someone else, like "mi madre" or "él", we use "es": "Mi madre es profesora". Always check the subject before choosing.',
          ],
        },
      ],
      captions: [
        { start: 0, end: 10, text: ['Verbo SER para nombre, origen y profesión.', 'Verb SER for name, origin, and profession.'] },
        { start: 10, end: 21, text: ['Yo soy Ana · Tú eres de Londres.', 'Yo soy Ana · Tú eres de Londres.'] },
        { start: 21, end: 32, text: ['Él / Ella es → Mi madre es profesora.', 'Él / Ella es → Mi madre es profesora.'] },
      ],
      sources: [
        PEDAGOGICAL_REFERENCE,
        {
          title: 'Instituto Cervantes — Plan curricular del Instituto Cervantes (Nivel A1: Presentaciones y verbo ser)',
          url: 'https://cvc.cervantes.es/ensenanza/biblioteca_ele/plan_curricular/',
          kind: 'official',
        },
      ],
      mappings: [
        {
          courseId: 'espanol',
          questionId: 'vum-espanol-001',
          note: 'Primary mapping: espanol/vum-espanol-001 (Completa: Yo ___ Ana -> soy).',
        },
        {
          courseId: 'espanol',
          questionId: 'vum-espanol-002',
          note: 'Related mapping on same SER paradigm: Tú ___ de Londres -> eres.',
        },
        {
          courseId: 'espanol',
          questionId: 'vum-espanol-010',
          note: 'Related mapping on same SER paradigm: Mi madre ___ profesora -> es.',
        },
        {
          courseId: 'espanol',
          lessonId: 'origin',
          questionId: 'origin',
          note: 'Guided lesson mapping: espanol/origin (Cuenta de dónde eres / Soy de...).',
        },
      ],
    },
    {
      conceptId: 'britjoy-individual-liberty',
      courseId: 'britjoy',
      avatarId: 'britjoy',
      avatarArt: COURSE_AVATAR_ART.britjoy,
      country: 'GB',
      status: 'review',
      durationSeconds: 32,
      locales: ['es', 'en'],
      video: {
        src: 'publicaciones/piloto-explicativo-londres/britjoy-uk-values-piloto-review.mp4',
        poster: 'publicaciones/piloto-explicativo-londres/britjoy-uk-values-piloto-review.poster.webp',
        captions: {
          es: 'publicaciones/piloto-explicativo-londres/britjoy-uk-values-piloto-review.es.vtt',
          en: 'publicaciones/piloto-explicativo-londres/britjoy-uk-values-piloto-review.en.vtt',
        },
      },
      title: [
        'Valores fundamentales del Reino Unido: libertad individual (Individual liberty)',
        'Fundamental principles of British life: Individual liberty',
      ],
      context: [
        'En el examen oficial Life in the UK, los principios fundamentales incluyen la democracia, el Estado de derecho, la libertad individual, la tolerancia hacia distintas creencias y la participación en la comunidad.',
        'In the official Life in the UK test, the fundamental principles include democracy, the rule of law, individual liberty, tolerance of those with different faiths and beliefs, and participation in community life.',
      ],
      visualExample: {
        kind: 'uk-values-liberty',
        badge: ['Life in the UK · Valores cívicos (GB)', 'Life in the UK · Civic values (GB)'],
        heading: ['¿Qué protege «Individual liberty» dentro de la ley?', 'What does "Individual liberty" protect within the law?'],
        primary: [
          'Individual liberty → Libertad para elegir tus propias creencias, opiniones y decisiones personales respetando la ley.',
          'Individual liberty → Freedom to choose your own beliefs, opinions, and personal path within the law.',
        ],
        secondary: [
          'Distínguelo de: Democracy (elegir representantes) y Rule of law (nadie está por encima de la ley).',
          'Distinguish it from: Democracy (choosing representatives) and Rule of law (no one is above the law).',
        ],
        callout: [
          'Clave oficial: la libertad individual siempre va acompañada del respeto a la ley y a los derechos de los demás.',
          'Official key: individual liberty always operates within the law and alongside respect for the rights of others.',
        ],
        steps: [
          ['Individual liberty', 'Individual liberty', 'Elegir creencias y expresar opiniones dentro de la ley / Choose beliefs within the law'],
          ['Rule of law', 'Rule of law', 'Leyes iguales para todos / Laws apply equally to everyone'],
          ['Tolerance', 'Tolerance', 'Respeto a distintas fes o a ninguna / Respect for different faiths or none'],
        ],
      },
      practice: {
        prompt: [
          'Si la pregunta menciona elegir tus creencias o decisiones personales dentro del marco legal («within the law»), ¿a qué principio se refiere?',
          'If a question asks which principle lets people choose their beliefs or personal path within the law, which principle is it?',
        ],
        takeaway: [
          'Se refiere a «Individual liberty» (libertad individual), nunca a censura ni a religión obligatoria.',
          'It refers to "Individual liberty", never censorship or compulsory state religion.',
        ],
      },
      feedback: [
        'Relaciona «choose their beliefs within the law» con «Individual liberty», y «nobody is above the law» con «The rule of law».',
        'Match "choose their beliefs within the law" to "Individual liberty", and "nobody is above the law" to "The rule of law".',
      ],
      transcript: [
        {
          at: '00:00',
          speaker: 'BritJoy',
          text: [
            'En la preparación para Life in the UK, es esencial distinguir con precisión cada uno de los valores fundamentales de la vida británica.',
            'When preparing for the Life in the UK test, it is essential to clearly distinguish each fundamental principle of British life.',
          ],
        },
        {
          at: '00:11',
          speaker: 'BritJoy',
          text: [
            '«Individual liberty» —la libertad individual— significa que cada persona puede elegir sus creencias, expresar sus ideas y tomar sus propias decisiones dentro de la ley.',
            '"Individual liberty" means that every person is free to choose their beliefs, express their views, and make personal choices within the law.',
          ],
        },
        {
          at: '00:23',
          speaker: 'BritJoy',
          text: [
            'No la confundas con «The rule of law», que establece que la ley se aplica por igual a todas las personas y autoridades.',
            'Do not confuse it with "The rule of law", which establishes that the law applies equally to all people and public authorities.',
          ],
        },
      ],
      captions: [
        { start: 0, end: 11, text: ['Principios fundamentales de Life in the UK.', 'Fundamental principles of Life in the UK.'] },
        { start: 11, end: 23, text: ['Individual liberty: elegir creencias dentro de la ley.', 'Individual liberty: choose beliefs within the law.'] },
        { start: 23, end: 34, text: ['Rule of law: nadie está por encima de la ley.', 'Rule of law: no one is above the law.'] },
      ],
      sources: [
        PEDAGOGICAL_REFERENCE,
        {
          title: 'GOV.UK — Life in the UK Test: Fundamental principles of British life',
          url: 'https://www.gov.uk/life-in-the-uk-test',
          kind: 'official',
        },
      ],
      mappings: [
        {
          courseId: 'britjoy',
          questionId: 'own-values-01',
          country: 'GB',
          note: 'Primary mapping: britjoy/own-values-01 (Which principle lets people choose their beliefs within the law? -> Individual liberty).',
        },
        {
          courseId: 'britjoy',
          questionId: 'own-values-06',
          country: 'GB',
          note: 'Related values question on freedom of speech and respecting rights within the law.',
        },
        {
          courseId: 'britjoy',
          questionId: 'own-values-08',
          country: 'GB',
          note: 'Related values question on how the rule of law applies.',
        },
        {
          courseId: 'britjoy',
          lessonId: 'values-01',
          questionId: 'values-01',
          country: 'GB',
          note: 'Guided lesson mapping: britjoy/values-01 (Libertad y convivencia / Individual liberty).',
        },
        {
          courseId: 'britjoy',
          lessonId: 'values-05',
          questionId: 'values-05',
          country: 'GB',
          note: 'Guided lesson mapping: britjoy/values-05 (Aplicar los valores).',
        },
      ],
    },
    {
      conceptId: 'ia-prompt-fundamentals',
      courseId: 'ia',
      avatarId: 'ia',
      avatarArt: COURSE_AVATAR_ART.ia,
      country: null,
      status: 'draft',
      durationSeconds: 30,
      locales: ['es', 'en'],
      video: {
        src: null,
        poster: null,
        captions: { es: null, en: null },
      },
      title: [
        '¿Qué es un prompt y cómo guía a un modelo de IA?',
        'What is a prompt and how does it guide an AI model?',
      ],
      context: [
        'Cuando usas una herramienta de inteligencia artificial generativa, el modelo no adivina tu intención: trabaja a partir del «prompt», que es la instrucción, pregunta o contexto de entrada que le entregas.',
        'When you use a generative artificial intelligence tool, the model does not guess your intent: it works from the "prompt", which is the instruction, question, or input context you provide.',
      ],
      visualExample: {
        kind: 'prompt-anatomy',
        badge: ['IA práctica · Entrada → Modelo → Salida', 'Practical AI · Input → Model → Output'],
        heading: ['Anatomía de un buen prompt (Entrada al modelo)', 'Anatomy of an effective prompt (Model input)'],
        primary: [
          'Prompt = Tarea («Resume este correo») + Contexto («para un turno de almacén») + Formato («en 3 puntos breves»).',
          'Prompt = Task ("Summarise this email") + Context ("for a warehouse shift") + Format ("in 3 short bullet points").',
        ],
        secondary: [
          'Un prompt NO es una pieza física del ordenador (ventilador, batería o cable de red), sino la instrucción de entrada.',
          'A prompt is NOT a hardware component (cooling fan, battery, or network cable); it is the input instruction.',
        ],
        callout: [
          'Regla de seguridad: no incluyas datos personales sensibles en el prompt y verifica siempre los datos críticos de la respuesta.',
          'Safety rule: avoid putting sensitive personal data in a prompt and always verify critical facts in the output.',
        ],
        steps: [
          ['1. Objetivo / Tarea', '1. Goal / Task', '¿Qué debe hacer el modelo? / What should the model do?'],
          ['2. Contexto y límites', '2. Context & constraints', '¿Con qué datos y qué límites? / With what source text and limits?'],
          ['3. Formato esperado', '3. Expected format', 'Lista, tabla o borrador / List, table, or draft'],
        ],
      },
      practice: {
        prompt: [
          'Si una pregunta te pide definir «prompt» o identificar cómo pedir un resumen claro al modelo, ¿qué debes buscar?',
          'If a question asks you to define a "prompt" or identify how to request a clear summary from a model, what should you look for?',
        ],
        takeaway: [
          'Busca siempre la instrucción o entrada («input») con objetivo, contexto y formato claro para el modelo.',
          'Always look for the instruction or input to the model with a clear goal, context, and output format.',
        ],
      },
      feedback: [
        'Descarta componentes de hardware (ventiladores, cables, baterías) y elige la opción que describe la instrucción o entrada para el modelo.',
        'Rule out hardware parts (fans, cables, batteries) and choose the option describing the instruction or input to the model.',
      ],
      transcript: [
        {
          at: '00:00',
          speaker: 'BritJoy',
          text: [
            '¿Qué es exactamente un «prompt» en inteligencia artificial? Es la instrucción, pregunta o texto de entrada que le das al modelo para indicarle qué tarea realizar.',
            'What exactly is a "prompt" in artificial intelligence? It is the instruction, question, or input text you give the model to tell it what task to perform.',
          ],
        },
        {
          at: '00:11',
          speaker: 'BritJoy',
          text: [
            'Un prompt útil combina tres elementos: qué tarea necesitas, qué contexto o texto base debe usar y en qué formato quieres la respuesta.',
            'A useful prompt combines three elements: what task you need, what context or source text it should use, and what format you want the answer in.',
          ],
        },
        {
          at: '00:21',
          speaker: 'BritJoy',
          text: [
            'Recuerda: el modelo genera una continuación probable a partir de tu entrada, por lo que una instrucción clara reduce errores y ambigüedades.',
            'Remember: the model generates a probable continuation from your input, so a clear instruction reduces errors and ambiguity.',
          ],
        },
      ],
      captions: [
        { start: 0, end: 11, text: ['Prompt = instrucción o entrada para el modelo.', 'Prompt = instruction or input to the model.'] },
        { start: 11, end: 21, text: ['Incluye: tarea + contexto + formato esperado.', 'Include: task + context + expected format.'] },
        { start: 21, end: 30, text: ['Verifica siempre los datos importantes.', 'Always verify critical facts.'] },
      ],
      sources: [
        PEDAGOGICAL_REFERENCE,
        {
          title: 'NIST — Artificial Intelligence Risk Management Framework: Generative AI Profile (NIST AI 600-1)',
          url: 'https://www.nist.gov/aisi/ai-risk-management-framework',
          kind: 'technical',
        },
      ],
      mappings: [
        {
          courseId: 'ia',
          questionId: 'vum-ia-001',
          note: 'Primary mapping: ia/vum-ia-001 (¿Qué es un prompt? -> Una instrucción o entrada para el modelo).',
        },
        {
          courseId: 'ia',
          questionId: 'vum-ia-002',
          note: 'Related prompt formulation question: ¿Qué mejora una solicitud de resumen?',
        },
        {
          courseId: 'ia',
          questionId: 'vum-ia-008',
          note: 'Related instruction design question: ¿Qué conviene definir al pedir una tarea a un agente?',
        },
      ],
    },
    {
      conceptId: 'conduccion-gb-red-light',
      courseId: 'conduccion',
      avatarId: 'conduccion',
      avatarArt: COURSE_AVATAR_ART.conduccion,
      country: 'GB',
      status: 'draft',
      durationSeconds: 31,
      locales: ['es', 'en'],
      video: {
        src: null,
        poster: null,
        captions: { es: null, en: null },
      },
      title: [
        'Semáforo en rojo en Gran Bretaña: línea de detención (Highway Code)',
        'Red traffic light in Great Britain: stop line (Highway Code)',
      ],
      context: [
        'Según The Highway Code en Gran Bretaña, la luz roja fija significa «STOP»: debes detenerte detrás de la línea blanca de detención ("stop line") en el cruce y esperar hasta que la señal cambie a verde y el paso esté despejado.',
        'Under The Highway Code in Great Britain, a steady red light means "STOP": you must stop behind the white stop line at the junction and wait until the signal turns green and the way is clear.',
      ],
      visualExample: {
        kind: 'gb-traffic-light',
        badge: ['The Highway Code · Gran Bretaña (GB)', 'The Highway Code · Great Britain (GB)'],
        heading: ['Secuencia y obligación ante luz roja en GB', 'Red light rule and sequence in GB'],
        primary: [
          'Luz ROJA = Detenerse detrás de la línea de parada antes de invadir el cruce o paso peatonal.',
          'RED light = Stop behind the white stop line before entering the junction or pedestrian crossing.',
        ],
        secondary: [
          'ROJO + ÁMBAR juntos = Prepárate, pero NO avances todavía hasta que se encienda la luz VERDE y sea seguro.',
          'RED + AMBER together = Prepare to go, but do NOT move past the stop line until GREEN shows and the way is clear.',
        ],
        callout: [
          'En Gran Bretaña no está permitido girar con el semáforo en rojo salvo que una flecha verde específica de filtro lo autorice.',
          'In Great Britain you must not turn on a red light unless a dedicated green filter arrow specifically authorises that movement.',
        ],
        steps: [
          ['ROJO (Red)', 'RED', 'Detenerse detrás de la línea blanca / Stop behind the white stop line'],
          ['ROJO + ÁMBAR (Red + Amber)', 'RED + AMBER', 'Seguir detenido; no cruzar aún / Remain stopped; do not cross yet'],
          ['VERDE (Green)', 'GREEN', 'Avanzar solo si el cruce está libre / Proceed only if the junction is clear'],
        ],
      },
      practice: {
        prompt: [
          'Ante un semáforo en rojo que regula tu carril en Gran Bretaña, ¿dónde debe quedar tu vehículo?',
          'At a red traffic light controlling your lane in Great Britain, where must your vehicle stop?',
        ],
        takeaway: [
          'Detenido por completo antes de la línea de detención («stop line»), sin invadir el cruce.',
          'Completely stopped behind the stop line, without encroaching into the junction.',
        ],
      },
      feedback: [
        'En el código británico (Highway Code), la luz roja es una orden obligatoria («MUST stop behind the stop line»), nunca una sugerencia.',
        'In the British Highway Code, a red light is a mandatory rule ("MUST stop behind the stop line"), never advisory.',
      ],
      transcript: [
        {
          at: '00:00',
          speaker: 'BritJoy',
          text: [
            'En Gran Bretaña, las señales luminosas de tráfico siguen las reglas obligatorias de The Highway Code.',
            'In Great Britain, traffic light signals follow the mandatory rules of The Highway Code.',
          ],
        },
        {
          at: '00:09',
          speaker: 'BritJoy',
          text: [
            'Cuando el semáforo que regula tu paso está en rojo, debes detenerte por completo antes de la línea blanca de detención y nunca invadir el cruce.',
            'When the traffic light controlling your lane is red, you must come to a complete stop behind the white stop line and never enter the junction.',
          ],
        },
        {
          at: '00:20',
          speaker: 'BritJoy',
          text: [
            'Incluso cuando aparecen rojo y ámbar juntos, debes permanecer detenido hasta que se ilumine el verde y compruebes que no hay peatones ni vehículos cruzando.',
            'Even when red and amber show together, you must remain stopped until green lights up and you check that no pedestrians or vehicles are crossing.',
          ],
        },
      ],
      captions: [
        { start: 0, end: 9, text: ['Highway Code (GB): señales luminosas de tráfico.', 'Highway Code (GB): traffic light signals.'] },
        { start: 9, end: 20, text: ['Luz roja: detenerse antes de la línea e intersección.', 'Red light: stop behind the line before the junction.'] },
        { start: 20, end: 31, text: ['Avanza solo en verde con vía despejada.', 'Proceed only on green when the way is clear.'] },
      ],
      sources: [
        PEDAGOGICAL_REFERENCE,
        {
          title: 'GOV.UK — The Highway Code: Light signals controlling traffic',
          url: 'https://www.gov.uk/guidance/the-highway-code/light-signals-controlling-traffic',
          kind: 'technical',
        },
      ],
      mappings: [
        {
          courseId: 'conduccion',
          questionId: 'vum-conduccion-001',
          country: 'GB',
          note: 'Primary mapping: conduccion/vum-conduccion-001 (En Gran Bretaña, ¿qué haces ante un semáforo rojo que regula tu paso? -> Detenerte antes de invadir el cruce).',
        },
      ],
    },
    {
      conceptId: 'ciberseguridad-confidentiality',
      courseId: 'ciberseguridad',
      avatarId: 'ciberseguridad',
      avatarArt: COURSE_AVATAR_ART.ciberseguridad,
      country: null,
      status: 'draft',
      durationSeconds: 33,
      locales: ['es', 'en'],
      video: {
        src: null,
        poster: null,
        captions: { es: null, en: null },
      },
      title: [
        'Confidencialidad de la información (NIST CSRC)',
        'Information Confidentiality (NIST CSRC)',
      ],
      context: [
        'En seguridad de la información (tríada CIA: Confidencialidad, Integridad y Disponibilidad), la confidencialidad consiste en preservar las restricciones autorizadas de acceso y divulgación para proteger la privacidad y los datos sensibles.',
        'In information security (the CIA triad: Confidentiality, Integrity, and Availability), confidentiality means preserving authorized restrictions on information access and disclosure, including means for protecting personal privacy and proprietary information.',
      ],
      visualExample: {
        kind: 'cia-confidentiality',
        badge: ['Seguridad de la información · NIST CSRC', 'Information Security · NIST CSRC'],
        heading: ['Tríada CIA: qué protege exactamente la Confidencialidad', 'CIA Triad: what Confidentiality specifically protects'],
        primary: [
          'Confidencialidad (Confidentiality) = Solo las personas o sistemas autorizados pueden acceder a la información.',
          'Confidentiality = Only authorized people or systems can access or read the information.',
        ],
        secondary: [
          'Contraste: Integridad = que el dato no se altere sin permiso · Disponibilidad = acceso a tiempo cuando se necesita.',
          'Contrast: Integrity = data is not improperly modified · Availability = timely and reliable access when needed.',
        ],
        callout: [
          'Controles habituales de confidencialidad: cifrado, autenticación fuerte (MFA) y principio de mínimo privilegio.',
          'Common confidentiality controls: encryption, strong authentication (MFA), and least-privilege permissions.',
        ],
        steps: [
          ['Confidencialidad', 'Confidentiality', 'Acceso exclusivo para quien está autorizado / Authorized access only'],
          ['Integridad', 'Integrity', 'Datos exactos y sin modificaciones no autorizadas / Guarding against improper modification'],
          ['Disponibilidad', 'Availability', 'Servicio accesible cuando se requiere / Timely and reliable access to use'],
        ],
      },
      practice: {
        prompt: [
          'Si un control impide que terceros sin permiso lean historiales médicos o nóminas, ¿qué propiedad de seguridad está protegiendo?',
          'If a control prevents unauthorized third parties from reading medical records or payslips, which security property is it protecting?',
        ],
        takeaway: [
          'Protege la confidencialidad: garantizar que solo acceda quien tiene autorización.',
          'It protects confidentiality: ensuring only authorized access and preventing unauthorized disclosure.',
        ],
      },
      feedback: [
        'No confundas confidencialidad con parámetros físicos (temperatura, brillo de pantalla o peso de equipos): se refiere siempre al acceso autorizado a la información.',
        'Do not confuse confidentiality with physical device metrics (temperature, screen brightness, or hardware weight): it always protects authorized access to information.',
      ],
      transcript: [
        {
          at: '00:00',
          speaker: 'BritJoy',
          text: [
            'Según el glosario técnico de NIST CSRC, la confidencialidad es la propiedad que preserva las restricciones autorizadas sobre el acceso y la divulgación de la información.',
            'According to the NIST CSRC technical glossary, confidentiality is preserving authorized restrictions on information access and disclosure.',
          ],
        },
        {
          at: '00:12',
          speaker: 'BritJoy',
          text: [
            'En la práctica diaria, aplicar confidencialidad significa que una nómina, contraseña o expediente solo puede ser visto por las personas autorizadas.',
            'In everyday practice, applying confidentiality means a payslip, password, or record can only be viewed by authorized individuals.',
          ],
        },
        {
          at: '00:23',
          speaker: 'BritJoy',
          text: [
            'Herramientas como el cifrado de datos y los permisos de mínimo privilegio ayudan a mantener esa confidencialidad frente a accesos no autorizados.',
            'Tools such as data encryption and least-privilege permissions help uphold confidentiality against unauthorized access.',
          ],
        },
      ],
      captions: [
        { start: 0, end: 12, text: ['NIST CSRC: Confidencialidad = restricciones de acceso autorizado.', 'NIST CSRC: Confidentiality = authorized access restrictions.'] },
        { start: 12, end: 23, text: ['Evita que personas sin permiso lean datos sensibles.', 'Prevents unauthorized users from reading sensitive data.'] },
        { start: 23, end: 33, text: ['Se apoya en cifrado, autenticación y permisos mínimos.', 'Supported by encryption, authentication, and least privilege.'] },
      ],
      sources: [
        PEDAGOGICAL_REFERENCE,
        {
          title: 'NIST Computer Security Resource Center (CSRC) — Glossary: Confidentiality',
          url: 'https://csrc.nist.gov/glossary/term/confidentiality',
          kind: 'technical',
        },
      ],
      mappings: [
        {
          courseId: 'ciberseguridad',
          questionId: 'vum-ciberseguridad-001',
          note: 'Primary mapping: ciberseguridad/vum-ciberseguridad-001 (¿Qué protege la confidencialidad? -> El acceso autorizado a información).',
        },
        {
          courseId: 'ciberseguridad',
          lessonId: 'permissions',
          questionId: 'permissions',
          note: 'Guided lesson mapping: ciberseguridad/permissions (Comparte solo lo necesario).',
        },
      ],
    },
    {
      conceptId: 'electricidad-si-ampere',
      courseId: 'electricidad',
      avatarId: 'electricidad',
      avatarArt: COURSE_AVATAR_ART.electricidad,
      country: null,
      status: 'draft',
      durationSeconds: 32,
      locales: ['es', 'en'],
      video: {
        src: null,
        poster: null,
        captions: { es: null, en: null },
      },
      title: [
        'El amperio (A): unidad SI de corriente eléctrica (BIPM)',
        'The ampere (A): SI base unit of electric current (BIPM)',
      ],
      context: [
        'En el Sistema Internacional de Unidades (SI, definido por el BIPM), la corriente eléctrica (I) mide el flujo de carga eléctrica por segundo y su unidad base es el amperio (símbolo A).',
        'In the International System of Units (SI, defined by the BIPM), electric current (I) measures the flow of electric charge per second and its base unit is the ampere (symbol A).',
      ],
      visualExample: {
        kind: 'ampere-flow',
        badge: ['Unidades SI · BIPM · Ley de Ohm', 'SI Base Units · BIPM · Ohm’s Law'],
        heading: ['Distingue las tres magnitudes eléctricas fundamentales', 'Distinguish the three core electrical quantities'],
        primary: [
          'Corriente eléctrica (I) → Amperio (A) · Ejemplo: I = V / R = 12 V / 6 Ω = 2 A.',
          'Electric current (I) → Ampere (A) · Example: I = V / R = 12 V / 6 Ω = 2 A.',
        ],
        secondary: [
          'Tensión / Voltaje (V) → Voltio (V) · Resistencia (R) → Ohmio (Ω) · Potencia (P) → Vatio (W).',
          'Voltage (V) → Volt (V) · Resistance (R) → Ohm (Ω) · Power (P) → Watt (W).',
        ],
        callout: [
          'Conversión frecuente en cuadros y medidas: 1 A = 1000 mA (por tanto, 0,05 A equivale a 50 mA).',
          'Common meter conversion: 1 A = 1000 mA (so 0.05 A equals 50 mA).',
        ],
        steps: [
          ['Corriente (I)', 'Current (I)', 'Amperio (A) — caudal de carga eléctrica / charge flow rate'],
          ['Tensión (V)', 'Voltage (V)', 'Voltio (V) — diferencia de potencial / potential difference'],
          ['Resistencia (R)', 'Resistance (R)', 'Ohmio (Ω) — oposición al paso de corriente / opposition to current'],
        ],
      },
      practice: {
        prompt: [
          'Si una pregunta pide la unidad del Sistema Internacional para la corriente eléctrica (o calcular I con 12 V y 6 Ω), ¿qué unidad corresponde?',
          'If a question asks for the SI unit of electric current (or to calculate I with 12 V and 6 Ω), which unit applies?',
        ],
        takeaway: [
          'Corresponde el amperio (A). Las unidades como metro, litro o segundo miden longitud, volumen y tiempo.',
          'The ampere (A) applies. Units like metre, litre, or second measure length, volume, and time.',
        ],
      },
      feedback: [
        'Asocia siempre Corriente (I) con Amperio (A), Tensión (V) con Voltio (V) y Resistencia (R) con Ohmio (Ω).',
        'Always pair Current (I) with Ampere (A), Voltage (V) with Volt (V), and Resistance (R) with Ohm (Ω).',
      ],
      transcript: [
        {
          at: '00:00',
          speaker: 'BritJoy',
          text: [
            'De acuerdo con la Oficina Internacional de Pesas y Medidas (BIPM), el amperio —con símbolo A— es la unidad base del Sistema Internacional para la corriente eléctrica.',
            'According to the International Bureau of Weights and Measures (BIPM), the ampere—symbol A—is the SI base unit of electric current.',
          ],
        },
        {
          at: '00:11',
          speaker: 'BritJoy',
          text: [
            'Mientras el voltio mide la tensión que impulsa las cargas y el ohmio mide la oposición del circuito, el amperio indica cuánta corriente circula realmente.',
            'While the volt measures the voltage pushing charges and the ohm measures circuit opposition, the ampere tells you how much current is actually flowing.',
          ],
        },
        {
          at: '00:22',
          speaker: 'BritJoy',
          text: [
            'Con la ley de Ohm (V = I por R), si aplicas doce voltios a una resistencia de seis ohmios, circulan dos amperios (2 A).',
            'Using Ohm’s law (V = I times R), if you apply 12 volts across a 6-ohm resistance, 2 amperes (2 A) of current flow.',
          ],
        },
      ],
      captions: [
        { start: 0, end: 11, text: ['BIPM SI: Amperio (A) = unidad de corriente eléctrica.', 'BIPM SI: Ampere (A) = unit of electric current.'] },
        { start: 11, end: 22, text: ['Voltio (V) = tensión · Ohmio (Ω) = resistencia.', 'Volt (V) = voltage · Ohm (Ω) = resistance.'] },
        { start: 22, end: 32, text: ['Ley de Ohm: 12 V / 6 Ω = 2 A (y 0,05 A = 50 mA).', 'Ohm’s law: 12 V / 6 Ω = 2 A (and 0.05 A = 50 mA).'] },
      ],
      sources: [
        PEDAGOGICAL_REFERENCE,
        {
          title: 'BIPM — SI Base Unit: The Ampere (A)',
          url: 'https://www.bipm.org/en/si-base-units/ampere',
          kind: 'technical',
        },
      ],
      mappings: [
        {
          courseId: 'electricidad',
          questionId: 'vum-electricidad-001',
          note: 'Primary mapping: electricidad/vum-electricidad-001 (¿Qué unidad se usa para corriente eléctrica? -> Amperio).',
        },
        {
          courseId: 'electricidad',
          lessonId: 'units',
          questionId: 'units',
          note: 'Guided lesson mapping: electricidad/units (Distingue las unidades: 0,05 A = 50 mA).',
        },
      ],
    },
    // ---------- Lote 1 · Ampliación verificada por tema en los 7 cursos (14 conceptos adicionales = 21 en total) ----------
    {
      conceptId: 'ingles-gp-appointment-time',
      courseId: 'ingles',
      avatarId: 'ingles',
      avatarArt: COURSE_AVATAR_ART.ingles,
      country: null,
      status: 'draft',
      durationSeconds: 30,
      locales: ['es', 'en'],
      video: { src: null, poster: null, captions: { es: null, en: null } },
      title: [
        'Cita médica (GP): entender «half past two in the afternoon» (14:30)',
        'GP appointment: understanding "half past two in the afternoon" (14:30)',
      ],
      context: [
        'En centros de salud británicos (GP surgery), la recepción suele dar la hora en formato hablado («half past two in the afternoon») mientras que el mensaje de confirmación la muestra en reloj de 24 horas (14:30).',
        'At a UK GP surgery, reception often states appointment times in spoken 12-hour form ("half past two in the afternoon") while confirmation messages use 24-hour time (14:30).',
      ],
      visualExample: {
        kind: 'gp-appointment-clock',
        badge: ['Centro de salud UK · GP Surgery', 'UK Health Centre · GP Surgery'],
        heading: ['De hora hablada a reloj de 24 horas', 'From spoken time to 24-hour clock'],
        primary: [
          'Half past two in the afternoon = 2:30 pm = 14:30 (jueves por la tarde).',
          'Half past two in the afternoon = 2:30 pm = 14:30 (Thursday afternoon).',
        ],
        secondary: [
          'No confundas: «two o’clock in the morning» (02:00) ni «Thursday morning» (antes de las 12:00).',
          'Do not mix up: "two o’clock in the morning" (02:00) or "Thursday morning" (before 12:00).',
        ],
        callout: [
          'Si tienes dudas en recepción, pide confirmación con: «Could you repeat the time, please?».',
          'If unsure at reception, ask politely: "Could you repeat the time, please?".',
        ],
        steps: [
          ['Half past two', 'Half past two', 'Las dos y media (2:30) / 30 minutes past 2'],
          ['in the afternoon', 'in the afternoon', 'Tramo de tarde (+12 h → 14:30) / Afternoon (+12h → 14:30)'],
          ['Confirmación cortés', 'Polite check', 'So that is Thursday at 14:30, thank you'],
        ],
      },
      practice: {
        prompt: [
          'Si recepción te dice «Thursday at half past two in the afternoon», ¿qué hora debes anotar en formato 24 h?',
          'If reception tells you "Thursday at half past two in the afternoon", what 24-hour time should you write down?',
        ],
        takeaway: [
          'Debes anotar 14:30 («half past» = :30 y «in the afternoon» suma 12 horas a las 2).',
          'Write down 14:30 ("half past" = :30 and "in the afternoon" adds 12 hours to 2).',
        ],
      },
      feedback: [
        'Suma siempre dos pistas: «half past two» (2:30) + «in the afternoon» (14:30), descartando 02:00 y la mañana.',
        'Combine both cues: "half past two" (2:30) + "in the afternoon" (14:30), ruling out 02:00 and morning.',
      ],
      transcript: [
        {
          at: '00:00',
          speaker: 'BritJoy',
          text: [
            'Cuando pides cita en tu médico de cabecera en el Reino Unido, escucha con atención tanto los minutos como el tramo del día.',
            'When booking a GP appointment in the UK, listen carefully for both the minutes and the part of the day.',
          ],
        },
        {
          at: '00:10',
          speaker: 'BritJoy',
          text: [
            '«Half past two» significa las dos y media, y «in the afternoon» indica la tarde: en reloj de veinticuatro horas, las 14:30.',
            '"Half past two" means 2:30, and "in the afternoon" places it after noon: 14:30 on the 24-hour clock.',
          ],
        },
        {
          at: '00:21',
          speaker: 'BritJoy',
          text: [
            'Si algo no queda claro, pide con naturalidad que te repitan el dato antes de colgar o salir del mostrador.',
            'If any detail is unclear, politely ask reception to repeat it before hanging up or leaving the desk.',
          ],
        },
      ],
      captions: [
        { start: 0, end: 10, text: ['Cita médica en UK: escucha hora y tramo del día.', 'UK GP appointment: check time and part of day.'] },
        { start: 10, end: 21, text: ['Half past two in the afternoon = 14:30.', 'Half past two in the afternoon = 14:30.'] },
        { start: 21, end: 30, text: ['Confirma siempre si tienes dudas en recepción.', 'Always ask reception to repeat if unsure.'] },
      ],
      sources: [
        PEDAGOGICAL_REFERENCE,
        {
          title: 'Council of Europe — CEFR A1–A2 Oral Comprehension (Announcements and appointments)',
          url: 'https://www.coe.int/en/web/common-european-framework-reference-languages',
          kind: 'official',
        },
      ],
      mappings: [
        {
          courseId: 'ingles',
          questionId: 'story-a1-gp',
          note: 'Bank mapping: ingles/story-a1-gp (What time is the practice appointment? -> 14:30).',
        },
      ],
    },
    {
      conceptId: 'ingles-phone-reference-readback',
      courseId: 'ingles',
      avatarId: 'ingles',
      avatarArt: COURSE_AVATAR_ART.ingles,
      country: null,
      status: 'draft',
      durationSeconds: 28,
      locales: ['es', 'en'],
      video: { src: null, poster: null, captions: { es: null, en: null } },
      title: [
        'Confirmar un código de referencia por teléfono («read back»)',
        'Reading back a booking or delivery reference by phone',
      ],
      context: [
        'En llamadas de entregas, bancos o servicios públicos en el Reino Unido, te pedirán «read the reference back to me» para comprobar letra por letra y cifra por cifra que anotaste el código exacto.',
        'On UK delivery, banking, or public-service calls, agents ask you to "read the reference back to me" so you verify every letter and digit in exact order.',
      ],
      visualExample: {
        kind: 'phone-reference-check',
        badge: ['Atención telefónica · Read-back', 'Phone call · Exact read-back'],
        heading: ['Orden exacto de letras y dígitos: BJ-482', 'Exact letter and digit order: BJ-482'],
        primary: [
          'Your reference is BJ-482 → B - J - four - eight - two (4-8-2, sin invertir cifras).',
          'Your reference is BJ-482 → B - J - four - eight - two (4-8-2, without transposing digits).',
        ],
        secondary: [
          'Error habitual: invertir cifras parecidas como BJ-428 o BJ-842 al tomar nota rápido.',
          'Common mistake: transposing digits into BJ-428 or BJ-842 when writing quickly.',
        ],
        callout: [
          'Frase útil: «Let me read that back to you: B-J, four-eight-two».',
          'Useful phrase: "Let me read that back to you: B-J, four-eight-two".',
        ],
        steps: [
          ['1. Letras iniciales', '1. Prefix letters', 'B - J'],
          ['2. Cifras en orden', '2. Digits in order', '4 - 8 - 2 (four, eight, two)'],
          ['3. Verificación («read back»)', '3. Read-back check', 'BJ-482 confirmado / confirmed'],
        ],
      },
      practice: {
        prompt: [
          'Si el operador dice «Your reference is BJ-482. Please read the reference back to me», ¿qué código debes repetir?',
          'If the agent says "Your reference is BJ-482. Please read the reference back to me", which code do you repeat?',
        ],
        takeaway: [
          'Repites exactamente BJ-482, comprobando la posición del 4, el 8 y el 2.',
          'Repeat BJ-482 in exact sequence, checking the position of 4, 8, and 2.',
        ],
      },
      feedback: [
        'Compara dígito por dígito con el aviso original (4-8-2) para no caer en inversiones de números (428 u 842).',
        'Compare digit by digit against the original notice (4-8-2) to avoid transposed distractors (428 or 842).',
      ],
      transcript: [
        {
          at: '00:00',
          speaker: 'BritJoy',
          text: [
            'Por teléfono en inglés, la expresión «read it back to me» significa repetir en voz alta el código exacto que acabas de escuchar.',
            'On the phone in English, "read it back to me" means repeating aloud the exact code you have just heard.',
          ],
        },
        {
          at: '00:09',
          speaker: 'BritJoy',
          text: [
            'En el ejemplo «BJ-482», separa las letras B-J y lee cifra por cifra: four, eight, two, evitando invertir el cuatro y el ocho.',
            'In the example "BJ-482", separate the letters B-J and read digit by digit: four, eight, two, avoiding swapping 4 and 8.',
          ],
        },
        {
          at: '00:19',
          speaker: 'BritJoy',
          text: [
            'Así confirmas tu entrega o trámite a la primera sin malentendidos.',
            'That way you confirm your delivery or appointment right the first time.',
          ],
        },
      ],
      captions: [
        { start: 0, end: 9, text: ['Read back = repetir el código exacto para confirmar.', 'Read back = repeat the exact code to confirm.'] },
        { start: 9, end: 19, text: ['BJ-482: revisa el orden 4 - 8 - 2.', 'BJ-482: check the exact 4 - 8 - 2 order.'] },
        { start: 19, end: 28, text: ['Evita inversiones como BJ-428 o BJ-842.', 'Avoid transpositions like BJ-428 or BJ-842.'] },
      ],
      sources: [
        PEDAGOGICAL_REFERENCE,
        {
          title: 'Council of Europe — CEFR A1–A2 Spoken Interaction (Confirming information and numbers)',
          url: 'https://www.coe.int/en/web/common-european-framework-reference-languages',
          kind: 'official',
        },
      ],
      mappings: [
        {
          courseId: 'ingles',
          questionId: 'story-a1-phone',
          note: 'Bank mapping: ingles/story-a1-phone (Which reference should you read back? -> BJ-482).',
        },
      ],
    },
    {
      conceptId: 'espanol-tener-que-infinitivo',
      courseId: 'espanol',
      avatarId: 'espanol',
      avatarArt: COURSE_AVATAR_ART.espanol,
      country: null,
      status: 'draft',
      durationSeconds: 30,
      locales: ['es', 'en'],
      video: { src: null, poster: null, captions: { es: null, en: null } },
      title: [
        'Expresar obligación cotidiana: «tener que + infinitivo»',
        'Expressing everyday obligation: "tener que + infinitive"',
      ],
      context: [
        'Cuando explicas una gestión o cita necesaria en español («tengo que ir al médico»), el verbo «tener» se conjuga con la persona y el segundo verbo va siempre en infinitivo (-ar, -er, -ir).',
        'When stating a necessary task or appointment in Spanish ("tengo que ir al médico"), "tener" is conjugated for the subject while the second verb always stays in the infinitive (-ar, -er, -ir).',
      ],
      visualExample: {
        kind: 'tener-que-infinitive',
        badge: ['Gramática práctica A2 · Obligación', 'Practical A2 Grammar · Obligation'],
        heading: ['Fórmula fija: TENER (conjugado) + QUE + INFINITIVO', 'Fixed pattern: TENER (conjugated) + QUE + INFINITIVE'],
        primary: [
          'Esta tarde tengo que ir al médico. (Correcto: «ir» en infinitivo).',
          'Esta tarde tengo que ir al médico. → I have to go to the doctor this afternoon ("ir" = infinitive).',
        ],
        secondary: [
          'Incorrecto: «tengo que voy» o «tengo que fui» (nunca pongas dos verbos conjugados tras «tener que»).',
          'Incorrect: "tengo que voy" or "tengo que fui" (never place a second conjugated verb after "tener que").',
        ],
        callout: [
          'Los infinitivos en español terminan siempre en -ar (trabajar), -er (hacer) o -ir (ir, salir).',
          'Spanish infinitives always end in -ar (trabajar), -er (hacer), or -ir (ir, salir).',
        ],
        steps: [
          ['1. Verbo tener', '1. Conjugated tener', 'Yo tengo / Tú tienes / Ella tiene'],
          ['2. Enlace fijo', '2. Fixed link', 'que'],
          ['3. Infinitivo (-ar/-er/-ir)', '3. Infinitive (-ar/-er/-ir)', 'ir al médico / pedir cita'],
        ],
      },
      practice: {
        prompt: [
          'En la frase «Esta tarde tengo que ___ al médico», ¿qué forma de «ir» completa la estructura?',
          'In "Esta tarde tengo que ___ al médico", which form of "ir" completes the structure?',
        ],
        takeaway: [
          'La única opción gramatical es el infinitivo «ir» (nunca «voy» ni «fui»).',
          'The only grammatical choice is the infinitive "ir" (never "voy" or "fui").',
        ],
      },
      feedback: [
        'Después de «tengo que / tienes que / tiene que», elige siempre el verbo terminado en -ar, -er o -ir.',
        'Right after "tengo que / tienes que / tiene que", always select the infinitive ending in -ar, -er, or -ir.',
      ],
      transcript: [
        {
          at: '00:00',
          speaker: 'BritJoy',
          text: [
            'Para contar una obligación diaria en español, como acudir a una consulta médica, usamos la perífrasis «tener que» más infinitivo.',
            'To express an everyday obligation in Spanish, such as going to a medical appointment, we use "tener que" plus an infinitive.',
          ],
        },
        {
          at: '00:10',
          speaker: 'BritJoy',
          text: [
            'El primer verbo ya marca la persona —«yo tengo»—, así que después de «que» el segundo verbo queda sin conjugar: «tengo que ir».',
            'The first verb already marks the person—"yo tengo"—so after "que" the second verb stays unconjugated: "tengo que ir".',
          ],
        },
        {
          at: '00:21',
          speaker: 'BritJoy',
          text: [
            'Por eso descartamos «voy» y «fui»: tras «tengo que», busca siempre el infinitivo.',
            'That is why we rule out "voy" and "fui": after "tengo que", always pick the infinitive.',
          ],
        },
      ],
      captions: [
        { start: 0, end: 10, text: ['Obligación en español: tener que + infinitivo.', 'Obligation in Spanish: tener que + infinitive.'] },
        { start: 10, end: 21, text: ['«Esta tarde tengo que ir al médico.»', '"Esta tarde tengo que ir al médico."'] },
        { start: 21, end: 30, text: ['Descarta formas conjugadas como «voy» o «fui».', 'Rule out conjugated forms like "voy" or "fui".'] },
      ],
      sources: [
        PEDAGOGICAL_REFERENCE,
        {
          title: 'Instituto Cervantes — Plan curricular (Perífrasis verbales de infinitivo: tener que + infinitivo)',
          url: 'https://cervantes.org/es/sobre-nosotros/publicaciones/plan-curricular-instituto-cervantes-niveles-referencia-espanol',
          kind: 'official',
        },
      ],
      mappings: [
        {
          courseId: 'espanol',
          questionId: 'vum-espanol-039',
          note: 'Bank mapping: espanol/vum-espanol-039 (Esta tarde tengo que ___ al médico -> ir).',
        },
      ],
    },
    {
      conceptId: 'espanol-hora-salida-a-las',
      courseId: 'espanol',
      avatarId: 'espanol',
      avatarArt: COURSE_AVATAR_ART.espanol,
      country: null,
      status: 'draft',
      durationSeconds: 28,
      locales: ['es', 'en'],
      video: { src: null, poster: null, captions: { es: null, en: null } },
      title: [
        'Horarios de transporte y citas: preposición «a» ante la hora',
        'Transport timetables and appointments: preposition "a" with clock times',
      ],
      context: [
        'En español, para preguntar qué hora es decimos «Son las ocho», pero para indicar a qué hora ocurre un viaje, turno o cita usamos siempre la preposición «a»: «El tren sale a las ocho».',
        'In Spanish, to state the current time we say "Son las ocho", but to state when a train, shift, or appointment takes place we always use "a": "El tren sale a las ocho" (at eight).',
      ],
      visualExample: {
        kind: 'spanish-time-preposition',
        badge: ['Transporte y horarios · Preposición A', 'Timetables · Preposition A'],
        heading: ['¿Cuándo ocurre? → «a la una» / «a las + hora»', 'When does it happen? → "a la una" / "a las + hour"'],
        primary: [
          'El tren sale a las ocho. · La consulta empieza a la una.',
          'El tren sale a las ocho. (The train leaves at eight) · La consulta empieza a la una. (Starts at one).',
        ],
        secondary: [
          'No traslades el inglés «in/on» diciendo «en las ocho»: para horas exactas nunca se usa «en».',
          'Never use "en" before clock hours ("en las ocho" is ungrammatical in Spanish).',
        ],
        callout: [
          'Contraste clave: «Son las ocho» (hora actual) frente a «Sale a las ocho» (hora de salida).',
          'Key contrast: "Son las ocho" (it is 8:00) vs "Sale a las ocho" (it departs at 8:00).',
        ],
        steps: [
          ['Acción o evento', 'Action / event', 'El tren sale / Mi turno empieza'],
          ['Preposición de hora', 'Time preposition', 'a'],
          ['Artículo + hora', 'Article + hour', 'las ocho (8:00) / la una (1:00)'],
        ],
      },
      practice: {
        prompt: [
          'Completa el panel de estación: «El tren sale ___ las ocho». ¿Qué preposición introduce la hora?',
          'Complete the station notice: "El tren sale ___ las ocho". Which preposition introduces the clock time?',
        ],
        takeaway: [
          'Se introduce con «a» («a las ocho»), equivalente al inglés «at eight o’clock».',
          'Use "a" ("a las ocho"), corresponding to English "at eight o’clock".',
        ],
      },
      feedback: [
        'Ante «la una» o «las dos / las ocho» para indicar el momento de un evento, elige siempre la preposición «a».',
        'Before "la una" or "las dos / las ocho" when stating when something happens, always select "a".',
      ],
      transcript: [
        {
          at: '00:00',
          speaker: 'BritJoy',
          text: [
            'En una estación de tren o autobús en España o Latinoamérica, los horarios de salida siempre se introducen con la preposición «a».',
            'At a train or bus station in Spain or Latin America, departure times are always introduced with the preposition "a".',
          ],
        },
        {
          at: '00:10',
          speaker: 'BritJoy',
          text: [
            'Decimos «El tren sale a las ocho» o «a la una», nunca «en las ocho».',
            'We say "El tren sale a las ocho" or "a la una", never "en las ocho".',
          ],
        },
        {
          at: '00:19',
          speaker: 'BritJoy',
          text: [
            'Recuerda esta pareja: «Son las ocho» para mirar el reloj y «a las ocho» para decir cuándo sale tu transporte.',
            'Remember the pair: "Son las ocho" for the current time and "a las ocho" for when something happens.',
          ],
        },
      ],
      captions: [
        { start: 0, end: 10, text: ['Horarios en español: verbo + A + las + hora.', 'Spanish schedules: verb + A + las + hour.'] },
        { start: 10, end: 19, text: ['«El tren sale a las ocho.»', '"El tren sale a las ocho." (leaves at eight).'] },
        { start: 19, end: 28, text: ['Nunca uses «en» delante de la hora.', 'Never use "en" in front of clock hours.'] },
      ],
      sources: [
        PEDAGOGICAL_REFERENCE,
        {
          title: 'Instituto Cervantes — Plan curricular (Expresión de la hora y localización temporal)',
          url: 'https://cervantes.org/es/sobre-nosotros/publicaciones/plan-curricular-instituto-cervantes-niveles-referencia-espanol',
          kind: 'official',
        },
      ],
      mappings: [
        {
          courseId: 'espanol',
          questionId: 'vum-espanol-027',
          note: 'Bank mapping: espanol/vum-espanol-027 (El tren sale ___ las ocho -> a).',
        },
        {
          courseId: 'espanol',
          lessonId: 'time',
          questionId: 'time',
          note: 'Guided lesson mapping: espanol/time (Decir la hora y horarios de transporte).',
        },
      ],
    },
    {
      conceptId: 'britjoy-rule-of-law',
      courseId: 'britjoy',
      avatarId: 'britjoy',
      avatarArt: COURSE_AVATAR_ART.britjoy,
      country: 'GB',
      status: 'draft',
      durationSeconds: 31,
      locales: ['es', 'en'],
      video: { src: null, poster: null, captions: { es: null, en: null } },
      title: [
        'Estado de derecho en el Reino Unido (The rule of law)',
        'The rule of law in the United Kingdom',
      ],
      context: [
        'En el Reino Unido, «The rule of law» (Estado de derecho) significa que ninguna persona, empresa ni autoridad pública está por encima de la ley: tanto la ciudadanía como el Gobierno deben cumplirla.',
        'In the United Kingdom, "The rule of law" means no individual, organisation, or public authority is above the law: both citizens and public officials must obey it.',
      ],
      visualExample: {
        kind: 'uk-rule-of-law',
        badge: ['Life in the UK · Rule of law (GB)', 'Life in the UK · Rule of law (GB)'],
        heading: ['Igualdad ante la ley: personas y autoridades públicas', 'Equality before the law: individuals and public authorities'],
        primary: [
          'The rule of law → People and public authorities must follow the law.',
          'The rule of law → People and public authorities must follow the law.',
        ],
        secondary: [
          'Descarta opciones falsas como que la riqueza cambie tus deberes legales o que los cargos públicos puedan ignorar la ley.',
          'Reject distractors claiming wealth alters legal duties or that officials may ignore the law.',
        ],
        callout: [
          'Tribunales independientes aplican la ley de forma imparcial a particulares y administraciones.',
          'Independent courts apply the law fairly to private citizens and public bodies alike.',
        ],
        steps: [
          ['Ciudadanía', 'Individuals', 'Mismos derechos y deberes legales / Equal legal rights and duties'],
          ['Autoridades públicas', 'Public authorities', 'Actúan solo dentro de la ley / Must act within the law'],
          ['Justicia independiente', 'Independent courts', 'Resuelve disputas con imparcialidad / Fair and impartial courts'],
        ],
      },
      practice: {
        prompt: [
          '¿Qué enunciado expresa mejor «the rule of law» en el examen Life in the UK?',
          'Which statement best expresses "the rule of law" in the Life in the UK test?',
        ],
        takeaway: [
          '«People and public authorities must follow the law» (personas y autoridades públicas deben cumplir la ley).',
          '"People and public authorities must follow the law".',
        ],
      },
      feedback: [
        'Busca siempre la igualdad de obligación legal para ciudadanía y autoridades («people and public authorities»).',
        'Always look for equal legal obligation binding both individuals and public authorities.',
      ],
      transcript: [
        {
          at: '00:00',
          speaker: 'BritJoy',
          text: [
            'Uno de los pilares constitucionales del Reino Unido es «The rule of law», el Estado de derecho.',
            'One of the constitutional pillars of the United Kingdom is "The rule of law".',
          ],
        },
        {
          at: '00:10',
          speaker: 'BritJoy',
          text: [
            'Significa que tanto los ciudadanos como la policía, los ministros y las autoridades públicas están sujetos a las mismas leyes.',
            'It means ordinary citizens, police, ministers, and public authorities are all bound by the law.',
          ],
        },
        {
          at: '00:21',
          speaker: 'BritJoy',
          text: [
            'Por eso la respuesta correcta es «People and public authorities must follow the law».',
            'That is why the correct answer is "People and public authorities must follow the law".',
          ],
        },
      ],
      captions: [
        { start: 0, end: 10, text: ['The rule of law = Estado de derecho en Reino Unido.', 'The rule of law = fundamental UK principle.'] },
        { start: 10, end: 21, text: ['Nadie está por encima de la ley.', 'No one is above the law.'] },
        { start: 21, end: 31, text: ['Personas y autoridades públicas cumplen la ley.', 'People and public authorities must follow the law.'] },
      ],
      sources: [
        PEDAGOGICAL_REFERENCE,
        {
          title: 'GOV.UK — Fundamental British values: The rule of law',
          url: 'https://www.gov.uk/government/publications/political-impartiality-in-schools/political-impartiality-in-schools',
          kind: 'official',
        },
      ],
      mappings: [
        {
          courseId: 'britjoy',
          questionId: 'own-values-04',
          country: 'GB',
          note: 'Bank mapping: britjoy/own-values-04 (Which statement best expresses the rule of law?).',
        },
        {
          courseId: 'britjoy',
          lessonId: 'values-04',
          questionId: 'values-04',
          country: 'GB',
          note: 'Guided lesson mapping: britjoy/values-04 (Estado de derecho / Rule of law).',
        },
      ],
    },
    {
      conceptId: 'britjoy-uk-parliament-role',
      courseId: 'britjoy',
      avatarId: 'britjoy',
      avatarArt: COURSE_AVATAR_ART.britjoy,
      country: 'GB',
      status: 'draft',
      durationSeconds: 32,
      locales: ['es', 'en'],
      video: { src: null, poster: null, captions: { es: null, en: null } },
      title: [
        'Funciones del Parlamento británico: hacer leyes y controlar al Gobierno',
        'Role of the UK Parliament: making laws and checking the Government',
      ],
      context: [
        'En Westminster (Londres), el Parlamento del Reino Unido («Parliament») tiene dos misiones centrales que aparecen una y otra vez en el examen: debatir y aprobar las leyes del país, y supervisar («check / scrutinise») el trabajo del Gobierno.',
        'At Westminster in London, the UK Parliament has two core constitutional duties tested repeatedly: debating and passing UK laws, and checking (scrutinising) the work of the Government.',
      ],
      visualExample: {
        kind: 'uk-parliament-scrutiny',
        badge: ['Westminster · UK Parliament (GB)', 'Westminster · UK Parliament (GB)'],
        heading: ['¿Qué institución legisla y supervisa al Gobierno?', 'Which institution makes laws and checks the Government?'],
        primary: [
          'Parliament (Parlamento en Westminster) = Examina al Gobierno + debate y aprueba leyes (Acts of Parliament).',
          'Parliament = Checks and challenges the Government + debates and passes UK laws.',
        ],
        secondary: [
          'No lo confundas con el Banco de Inglaterra (política monetaria) ni con entidades culturales o deportivas.',
          'Do not confuse Parliament with the Bank of England (monetary policy) or cultural/sporting bodies.',
        ],
        callout: [
          'Distinción clave: el Gobierno dirige el ejecutivo diario; el Parlamento representa a la ciudadanía y lo controla.',
          'Key distinction: the Government runs the executive; Parliament represents the public and holds it to account.',
        ],
        steps: [
          ['Legislar (Legislation)', 'Make UK laws', 'Debatir y aprobar proyectos de ley / Debate and pass bills'],
          ['Controlar (Scrutiny)', 'Check Government', 'Preguntas parlamentarias y comités / Questions and committees'],
          ['Representar', 'Representation', 'MPs elegidos por circunscripciones / Elected MPs represent constituencies'],
        ],
      },
      practice: {
        prompt: [
          'Si la pregunta dice «Which institution checks the Government and makes UK laws?», ¿cuál es la única institución competente?',
          'When asked "Which institution checks the Government and makes UK laws?", which institution is it?',
        ],
        takeaway: [
          '«Parliament» (el Parlamento del Reino Unido).',
          '"Parliament" (the UK Parliament at Westminster).',
        ],
      },
      feedback: [
        'Asocia siempre el par de verbos «checks the Government» + «makes UK laws» con «Parliament».',
        'Always link the pair of duties "checks the Government" + "makes UK laws" directly to "Parliament".',
      ],
      transcript: [
        {
          at: '00:00',
          speaker: 'BritJoy',
          text: [
            'En el sistema constitucional británico, el Gobierno y el Parlamento no son lo mismo.',
            'In the British constitutional system, the Government and Parliament are not the same thing.',
          ],
        },
        {
          at: '00:10',
          speaker: 'BritJoy',
          text: [
            'El Parlamento en Westminster aprueba las leyes del Reino Unido y examina las decisiones y el gasto del Gobierno.',
            'Parliament at Westminster makes UK laws and checks and challenges the decisions and spending of the Government.',
          ],
        },
        {
          at: '00:22',
          speaker: 'BritJoy',
          text: [
            'Ante «checks the Government and makes UK laws», marca sin dudar «Parliament».',
            'Whenever you see "checks the Government and makes UK laws", select "Parliament".',
          ],
        },
      ],
      captions: [
        { start: 0, end: 10, text: ['Westminster: diferencia Gobierno y Parlamento.', 'Westminster: distinguish Government from Parliament.'] },
        { start: 10, end: 22, text: ['Parliament = hace las leyes y controla al Gobierno.', 'Parliament = makes UK laws and checks the Government.'] },
        { start: 22, end: 32, text: ['Fuente verificada: parliament.uk.', 'Verified source: parliament.uk.'] },
      ],
      sources: [
        PEDAGOGICAL_REFERENCE,
        {
          title: 'UK Parliament — What is the role of Parliament?',
          url: 'https://www.parliament.uk/about/how/role/',
          kind: 'official',
        },
      ],
      mappings: [
        {
          courseId: 'britjoy',
          questionId: 'own-government-01',
          country: 'GB',
          note: 'Bank mapping: britjoy/own-government-01 (Which institution checks the Government and makes UK laws? -> Parliament).',
        },
        {
          courseId: 'britjoy',
          lessonId: 'government-01',
          questionId: 'government-01',
          country: 'GB',
          note: 'Guided lesson mapping: britjoy/government-01 (El Parlamento y el Gobierno).',
        },
      ],
    },
    {
      conceptId: 'ia-model-hallucination',
      courseId: 'ia',
      avatarId: 'ia',
      avatarArt: COURSE_AVATAR_ART.ia,
      country: null,
      status: 'draft',
      durationSeconds: 31,
      locales: ['es', 'en'],
      video: { src: null, poster: null, captions: { es: null, en: null } },
      title: [
        '¿Qué es una alucinación en IA generativa y cómo detectarla?',
        'What is a generative AI hallucination and how to spot it?',
      ],
      context: [
        'Los modelos generativos predicen palabras probables, no consultan automáticamente la realidad. Cuando inventan una fecha, ley o cita con tono muy seguro pero sin base real, eso se denomina «alucinación» (confabulation / hallucination).',
        'Generative models predict likely token sequences rather than automatically verifying facts. When a model produces a confident-sounding date, rule, or citation that is false or unsupported, it is called a "hallucination" (or confabulation).',
      ],
      visualExample: {
        kind: 'ai-hallucination-check',
        badge: ['Verificación en IA · NIST GenAI', 'AI Verification · NIST GenAI'],
        heading: ['Fluidez lingüística ≠ Verdad comprobada', 'Fluent wording ≠ Verified fact'],
        primary: [
          'Alucinación = Una respuesta plausible y bien redactada, pero falsa o no sustentada en fuentes reales.',
          'Hallucination = A plausible, well-written response that is false or unsupported by real evidence.',
        ],
        secondary: [
          'No es un archivo cifrado ni una fuente garantizada: cuanto más crítica sea la decisión, más obligatoria es la verificación externa.',
          'It is neither an encrypted file nor an authentic source: critical facts always require primary-source verification.',
        ],
        callout: [
          'Hábito seguro: comprueba nombres de leyes, teléfonos oficiales, precios y plazos en la web oficial correspondiente.',
          'Safe habit: cross-check laws, official phone numbers, deadlines, and figures on the official primary website.',
        ],
        steps: [
          ['1. Salida fluida', '1. Fluent output', 'Suena convincente pero puede inventar datos / Sounds confident'],
          ['2. Contraste externo', '2. Primary check', 'Comprobar cita, número o norma en fuente oficial / Check official source'],
          ['3. Decisión informada', '3. Safe use', 'Corregir o descartar lo no sustentado / Correct unsupported claims'],
        ],
      },
      practice: {
        prompt: [
          '¿Cómo define la ingeniería de IA una «alucinación» de un modelo generativo?',
          'How is a generative AI model "hallucination" defined?',
        ],
        takeaway: [
          'Como una respuesta plausible en apariencia, pero no sustentada en hechos o fuentes verificables.',
          'As a plausible-sounding but unsupported or fabricated response.',
        ],
      },
      feedback: [
        'Recuerda el principio de NIST AI 600-1: la fluidez del texto nunca demuestra por sí sola que una afirmación sea cierta.',
        'Remember NIST AI 600-1: fluent text never proves on its own that a statement is factual.',
      ],
      transcript: [
        {
          at: '00:00',
          speaker: 'BritJoy',
          text: [
            'Un modelo de lenguaje puede escribir con una seguridad impecable y aun así inventar un artículo legal o un enlace que no existe.',
            'A language model can write with polished confidence and still invent a legal clause or a web link that does not exist.',
          ],
        },
        {
          at: '00:11',
          speaker: 'BritJoy',
          text: [
            'En inteligencia artificial llamamos «alucinación» a esa respuesta plausible pero no sustentada en datos reales.',
            'In artificial intelligence, we call that plausible-sounding but unsupported output a "hallucination".',
          ],
        },
        {
          at: '00:21',
          speaker: 'BritJoy',
          text: [
            'Por eso en el trabajo o en trámites oficiales siempre contrastamos los datos clave en la fuente primaria.',
            'That is why at work or in official paperwork we always verify key facts against primary sources.',
          ],
        },
      ],
      captions: [
        { start: 0, end: 11, text: ['Un texto fluido de IA puede contener datos inventados.', 'Fluent AI text can still contain fabricated facts.'] },
        { start: 11, end: 21, text: ['Alucinación = respuesta plausible pero no sustentada.', 'Hallucination = plausible but unsupported response.'] },
        { start: 21, end: 31, text: ['Verifica leyes, cifras y citas en fuentes oficiales.', 'Verify laws, figures, and citations in official sources.'] },
      ],
      sources: [
        PEDAGOGICAL_REFERENCE,
        {
          title: 'NIST — AI Risk Management Framework: Generative Artificial Intelligence Profile (NIST AI 600-1)',
          url: 'https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence',
          kind: 'technical',
        },
      ],
      mappings: [
        {
          courseId: 'ia',
          questionId: 'vum-ia-013',
          note: 'Bank mapping: ia/vum-ia-013 (¿Qué es una alucinación de un modelo? -> Una respuesta plausible pero no sustentada).',
        },
      ],
    },
    {
      conceptId: 'ia-safe-practice-data',
      courseId: 'ia',
      avatarId: 'ia',
      avatarArt: COURSE_AVATAR_ART.ia,
      country: null,
      status: 'draft',
      durationSeconds: 29,
      locales: ['es', 'en'],
      video: { src: null, poster: null, captions: { es: null, en: null } },
      title: [
        'Privacidad al practicar con IA: usar datos ficticios o autorizados',
        'Privacy when practising with AI: using fictional or authorised data',
      ],
      context: [
        'Al ensayar prompts para redactar correos, resumir informes o analizar tablas, nunca debes pegar contraseñas reales, documentos de identidad ni historias clínicas ajenas: emplea ejemplos sintéticos o datos expresamente autorizados.',
        'When testing prompts to draft emails, summarise reports, or analyse tables, never paste real passwords, ID numbers, or confidential medical records: use synthetic examples or explicitly authorised data.',
      ],
      visualExample: {
        kind: 'ai-data-minimisation',
        badge: ['Privacidad y datos · Minimización', 'Data Privacy · Minimisation'],
        heading: ['Qué introducir y qué excluir en un prompt de prueba', 'What to include vs exclude in a practice prompt'],
        primary: [
          'Seguro: «Cliente Ejemplo S.L., pedido #0001» (datos ficticios o autorizados para la tarea).',
          'Safe: "Sample Client Ltd, order #0001" (fictional or explicitly authorised data).',
        ],
        secondary: [
          'Prohibido: contraseñas de clientes, números bancarios reales o historias clínicas sin permiso.',
          'Never paste: customer passwords, live bank details, or private medical records without permission.',
        ],
        callout: [
          'Principio de minimización: comparte solo la estructura necesaria y sustituye nombres reales por marcadores.',
          'Data minimisation: share only the structure needed and replace real identifiers with placeholders.',
        ],
        steps: [
          ['1. Revisa el texto', '1. Inspect input', '¿Contiene nombres, claves o salud de terceros? / Any secrets or PII?'],
          ['2. Anonimiza / Finge', '2. Use placeholders', 'Cambia por «[CLIENTE_A]» o cifras ficticias / Swap in fictional values'],
          ['3. Envía con control', '3. Prompt safely', 'Obtén la plantilla sin exponer información real / Zero data leakage'],
        ],
      },
      practice: {
        prompt: [
          'Si estás practicando cómo redactar o resumir casos con una herramienta de IA, ¿qué datos conviene utilizar?',
          'When practising how to draft or summarise cases with an AI tool, which data are appropriate to use?',
        ],
        takeaway: [
          'Datos ficticios o expresamente autorizados, aplicando minimización de datos.',
          'Fictional or explicitly authorised data, applying data minimisation.',
        ],
      },
      feedback: [
        'Descarta cualquier opción con credenciales reales o expedientes médicos privados: elige siempre «datos ficticios o autorizados».',
        'Reject options involving real credentials or private medical records: always select "fictional or authorised data".',
      ],
      transcript: [
        {
          at: '00:00',
          speaker: 'BritJoy',
          text: [
            'Antes de pegar cualquier texto en un chat de inteligencia artificial, haz una pausa de tres segundos y revisa qué datos contiene.',
            'Before pasting any text into an AI chat, pause for three seconds and check what data it contains.',
          ],
        },
        {
          at: '00:10',
          speaker: 'BritJoy',
          text: [
            'Para aprender y ensayar plantillas no necesitas exponer contraseñas de clientes ni historiales médicos reales.',
            'To learn and test templates, you never need to expose customer passwords or real medical records.',
          ],
        },
        {
          at: '00:20',
          speaker: 'BritJoy',
          text: [
            'Usa siempre datos ficticios o autorizados: proteges a las personas y cumples las normas de seguridad.',
            'Always use fictional or authorised data: you protect people and uphold data-protection rules.',
          ],
        },
      ],
      captions: [
        { start: 0, end: 10, text: ['Revisa siempre qué pegas en una herramienta de IA.', 'Always check what you paste into an AI tool.'] },
        { start: 10, end: 20, text: ['Nunca subas contraseñas ni datos médicos ajenos.', 'Never upload passwords or private medical records.'] },
        { start: 20, end: 29, text: ['Practica con datos ficticios o autorizados.', 'Practise with fictional or authorised data.'] },
      ],
      sources: [
        PEDAGOGICAL_REFERENCE,
        {
          title: 'NIST — Generative AI Profile: Data Privacy and Minimisation Controls',
          url: 'https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence',
          kind: 'technical',
        },
      ],
      mappings: [
        {
          courseId: 'ia',
          questionId: 'vum-ia-015',
          note: 'Bank mapping: ia/vum-ia-015 (¿Qué datos conviene usar al practicar? -> Datos ficticios o autorizados).',
        },
      ],
    },
    {
      conceptId: 'conduccion-gb-roundabout-priority',
      courseId: 'conduccion',
      avatarId: 'conduccion',
      avatarArt: COURSE_AVATAR_ART.conduccion,
      country: 'GB',
      status: 'draft',
      durationSeconds: 31,
      locales: ['es', 'en'],
      video: { src: null, poster: null, captions: { es: null, en: null } },
      title: [
        'Rotondas en Gran Bretaña: ceder el paso a la derecha (Highway Code)',
        'Roundabouts in Great Britain: give priority to the right (Highway Code)',
      ],
      context: [
        'En Gran Bretaña se circula por la izquierda y en las rotondas («roundabouts») se gira en sentido horario. Al llegar a la línea discontinua de entrada, salvo señalización o semáforos que indiquen otra cosa, debes ceder el paso al tráfico que se aproxima por tu derecha.',
        'In Great Britain traffic drives on the left and flows clockwise around roundabouts. On approaching a normal roundabout, unless road markings or traffic signals indicate otherwise, you give priority to traffic approaching from your right.',
      ],
      visualExample: {
        kind: 'gb-roundabout-right',
        badge: ['The Highway Code · Rule 185 (GB)', 'The Highway Code · Rule 185 (GB)'],
        heading: ['Sentido horario en GB: mira y cede a tu DERECHA', 'Clockwise flow in GB: look and give way to your RIGHT'],
        primary: [
          'Al entrar a una rotonda normal en GB → Cede prioridad al tráfico que viene por la derecha.',
          'Entering a normal British roundabout → Give priority to traffic approaching from the right.',
        ],
        secondary: [
          'Si conduces habitualmente en España o Colombia (donde se cede a la izquierda), presta doble atención al cambio de lado.',
          'If you are used to right-hand traffic countries (giving way to the left), pay extra attention to looking right first.',
        ],
        callout: [
          'Comprueba también ciclistas, motociclistas y marcas viales de carril antes de incorporarte.',
          'Also watch carefully for cyclists, motorcyclists, and lane arrows before emerging.',
        ],
        steps: [
          ['1. Aproximación', '1. Approach', 'Elige carril y modera velocidad / Choose lane and slow down'],
          ['2. Prioridad (GB)', '2. Priority (GB)', 'Cede al tráfico por la DERECHA / Give way to traffic from the RIGHT'],
          ['3. Incorporación', '3. Emerge safely', 'Avanza en sentido horario cuando haya hueco seguro / Join clockwise when clear'],
        ],
      },
      practice: {
        prompt: [
          'En una rotonda británica normal sin semáforos especiales, ¿a qué vehículos cedes el paso al entrar?',
          'At a normal British roundabout without special signals, who has priority when you enter?',
        ],
        takeaway: [
          'Al tráfico que se aproxima por la derecha («traffic approaching from the right»).',
          'Traffic approaching from the right.',
        ],
      },
      feedback: [
        'Circulando por la izquierda en GB, los vehículos dentro de la glorieta vienen hacia ti desde tu derecha (Highway Code Rule 185).',
        'Because GB drives on the left, traffic already circulating on the roundabout approaches from your right (Rule 185).',
      ],
      transcript: [
        {
          at: '00:00',
          speaker: 'BritJoy',
          text: [
            'Uno de los cambios más importantes al conducir en Gran Bretaña es cómo entrar con seguridad en una rotonda.',
            'One of the biggest adjustments when driving in Great Britain is entering a roundabout safely.',
          ],
        },
        {
          at: '00:10',
          speaker: 'BritJoy',
          text: [
            'Como se circula por la izquierda en sentido horario, los vehículos que ya están en la rotonda se acercan por tu derecha.',
            'Because traffic keeps left and moves clockwise, vehicles already on the roundabout approach from your right.',
          ],
        },
        {
          at: '00:21',
          speaker: 'BritJoy',
          text: [
            'Según la regla 185 de The Highway Code, salvo señales contrarias, debes ceder prioridad al tráfico que viene por la derecha.',
            'Under Rule 185 of The Highway Code, unless signs say otherwise, give priority to traffic approaching from your right.',
          ],
        },
      ],
      captions: [
        { start: 0, end: 10, text: ['Rotondas en GB: circulación en sentido horario.', 'GB roundabouts: traffic flows clockwise.'] },
        { start: 10, end: 21, text: ['Mira a tu derecha antes de la línea de entrada.', 'Look to your right at the give-way line.'] },
        { start: 21, end: 31, text: ['Highway Code Rule 185: cede al tráfico por la derecha.', 'Highway Code Rule 185: give priority to the right.'] },
      ],
      sources: [
        PEDAGOGICAL_REFERENCE,
        {
          title: 'GOV.UK — The Highway Code: Roundabouts (Rules 184 to 190)',
          url: 'https://www.gov.uk/guidance/the-highway-code',
          kind: 'technical',
        },
      ],
      mappings: [
        {
          courseId: 'conduccion',
          questionId: 'vum-conduccion-028',
          country: 'GB',
          note: 'Bank mapping: conduccion/vum-conduccion-028 (Rotonda británica normal -> Tráfico que se aproxima por la derecha).',
        },
      ],
    },
    {
      conceptId: 'conduccion-co-rain-margins',
      courseId: 'conduccion',
      avatarId: 'conduccion',
      avatarArt: COURSE_AVATAR_ART.conduccion,
      country: 'CO',
      status: 'draft',
      durationSeconds: 30,
      locales: ['es', 'en'],
      video: { src: null, poster: null, captions: { es: null, en: null } },
      title: [
        'Conducción bajo lluvia en Colombia: velocidad y margen de frenado',
        'Driving in rain in Colombia: speed and stopping margin',
      ],
      context: [
        'Cuando llueve, la película de agua sobre el asfalto disminuye la adherencia de las llantas y alarga la distancia necesaria para detener el vehículo. La conducción preventiva exige bajar la velocidad y ampliar la separación frontal.',
        'When it rains, water on the road surface lowers tyre grip and lengthens braking distance. Defensive driving requires reducing speed and increasing your following distance.',
      ],
      visualExample: {
        kind: 'co-rain-stopping-margin',
        badge: ['Seguridad vial · Lluvia y márgenes (CO)', 'Road safety · Rain & margins (CO)'],
        heading: ['Menos adherencia = más distancia para detenerse', 'Less tyre grip = longer stopping distance'],
        primary: [
          'Con asfalto mojado → Reducir velocidad con suavidad y aumentar el margen con el vehículo delantero.',
          'On wet roads → Smoothly reduce speed and increase the gap to the vehicle ahead.',
        ],
        secondary: [
          'Nunca te pegues al vehículo de delante ni des frenazos bruscos «de prueba» que puedan bloquear o hacer patinar las ruedas.',
          'Never tailgate or slam on the brakes to "test grip", which risks skidding or rear-end collisions.',
        ],
        callout: [
          'Las primeras gotas de lluvia mezclan agua con polvo y grasa en la calzada, haciendo el piso especialmente deslizante.',
          'The first minutes of rain mix water with road dust and oil, making the surface extra slippery.',
        ],
        steps: [
          ['1. Velocidad', '1. Speed', 'Moderar de forma progresiva / Ease off the accelerator smoothly'],
          ['2. Distancia', '2. Following gap', 'Ampliar margen de seguridad frontal / Increase your following distance'],
          ['3. Maniobras', '3. Controls', 'Evitar frenazos y giros bruscos / Avoid sharp braking or steering'],
        ],
      },
      practice: {
        prompt: [
          'En Colombia, cuando la lluvia reduce el agarre de la vía, ¿qué decisión es prudente y segura?',
          'In Colombia, when rain reduces road grip, which driving decision is prudent?',
        ],
        takeaway: [
          'Reducir la velocidad y aumentar el margen de distancia respecto al vehículo de adelante.',
          'Reduce speed and increase space behind the vehicle ahead.',
        ],
      },
      feedback: [
        'A menor fricción neumático-asfalto, mayor distancia de frenado: compensa siempre con menos velocidad y más espacio.',
        'Lower tyre-to-road friction means longer braking distance: always compensate with lower speed and extra space.',
      ],
      transcript: [
        {
          at: '00:00',
          speaker: 'BritJoy',
          text: [
            'Con lluvia intensa en carretera o ciudad en Colombia, el agarre entre las llantas y el pavimento disminuye de inmediato.',
            'During heavy rain on city streets or highways in Colombia, grip between your tyres and the road drops immediately.',
          ],
        },
        {
          at: '00:10',
          speaker: 'BritJoy',
          text: [
            'Eso significa que tu vehículo necesita más metros para detenerse aunque frenes a tiempo.',
            'That means your vehicle needs more metres to come to a stop even when you react promptly.',
          ],
        },
        {
          at: '00:20',
          speaker: 'BritJoy',
          text: [
            'La decisión prudente es reducir la velocidad y aumentar el margen de distancia, evitando frenazos bruscos.',
            'The prudent decision is to reduce speed and increase your following margin, avoiding harsh braking.',
          ],
        },
      ],
      captions: [
        { start: 0, end: 10, text: ['Con lluvia disminuye el agarre de las llantas.', 'Rain reduces tyre grip on the road.'] },
        { start: 10, end: 20, text: ['Necesitas más distancia para detener el vehículo.', 'You need a longer distance to stop safely.'] },
        { start: 20, end: 30, text: ['Reduce velocidad y aumenta el margen frontal.', 'Reduce speed and increase following space.'] },
      ],
      sources: [
        PEDAGOGICAL_REFERENCE,
        {
          title: 'Colombia — Ley 769 de 2002 (Código Nacional de Tránsito Terrestre: límites, distancias y precaución)',
          url: 'https://www.cancilleria.gov.co/normograma/compilacion/docs/ley_0769_2002.htm',
          kind: 'official',
        },
      ],
      mappings: [
        {
          courseId: 'conduccion',
          questionId: 'vum-conduccion-018',
          country: 'CO',
          note: 'Bank mapping: conduccion/vum-conduccion-018 (Lluvia reduce agarre en Colombia -> Reducir velocidad y aumentar margen).',
        },
        {
          courseId: 'conduccion',
          lessonId: 'margins',
          questionId: 'margins',
          note: 'Guided lesson mapping: conduccion/margins (Márgenes de seguridad y distancia de detención).',
        },
      ],
    },
    {
      conceptId: 'ciberseguridad-mfa-factors',
      courseId: 'ciberseguridad',
      avatarId: 'ciberseguridad',
      avatarArt: COURSE_AVATAR_ART.ciberseguridad,
      country: null,
      status: 'draft',
      durationSeconds: 31,
      locales: ['es', 'en'],
      video: { src: null, poster: null, captions: { es: null, en: null } },
      title: [
        'Autenticación multifactor (MFA): combinar factores de categorías distintas',
        'Multi-factor authentication (MFA): combining distinct factor categories',
      ],
      context: [
        'Según NIST CSRC, la autenticación multifactor (MFA) protege tus cuentas exigiendo dos o más factores de categorías diferentes: algo que sabes (contraseña), algo que tienes (llave física o app autenticadora) o algo que eres (biometría).',
        'Under NIST CSRC standards, multi-factor authentication (MFA) protects accounts by requiring two or more factors from different categories: something you know (password), something you have (hardware key or authenticator app), or something you are (biometrics).',
      ],
      visualExample: {
        kind: 'mfa-three-categories',
        badge: ['Identidad y acceso · NIST MFA', 'Identity & Access · NIST MFA'],
        heading: ['Dos contraseñas NO son MFA: deben ser categorías distintas', 'Two passwords are NOT MFA: categories must differ'],
        primary: [
          'MFA real = Algo que sabes (contraseña) + Algo que tienes (llave de seguridad / código de app).',
          'True MFA = Something you know (password) + Something you have (security key / authenticator app).',
        ],
        secondary: [
          'Escribir dos contraseñas memorizadas o repetir el mismo PIN usa una sola categoría («algo que sabes»).',
          'Entering two memorised passwords or repeating a PIN uses only one category ("something you know").',
        ],
        callout: [
          'Si un atacante roba tu contraseña en un phishing, el segundo factor físico o de app frena el acceso.',
          'If an attacker steals your password via phishing, the separate possession or biometric factor blocks entry.',
        ],
        steps: [
          ['Algo que sabes', 'Something you know', 'Contraseña o frase de paso / Password or passphrase'],
          ['Algo que tienes', 'Something you have', 'Llave FIDO2 o app autenticadora / Security key or authenticator'],
          ['Algo que eres', 'Something you are', 'Huella o reconocimiento biométrico / Biometric trait'],
        ],
      },
      practice: {
        prompt: [
          '¿Cómo se llama el mecanismo que exige combinar factores de autenticación de categorías distintas?',
          'What combines authentication factors from different categories?',
        ],
        takeaway: [
          'Autenticación multifactor (MFA / Multi-factor authentication).',
          'Multi-factor authentication (MFA).',
        ],
      },
      feedback: [
        'Descarta «dos contraseñas memorizadas» o «repetir el mismo PIN»: para que exista MFA deben cambiar las categorías del factor.',
        'Rule out "two memorised passwords" or "repeating the same PIN": MFA requires distinct factor categories.',
      ],
      transcript: [
        {
          at: '00:00',
          speaker: 'BritJoy',
          text: [
            'Poner dos contraseñas seguidas parece más seguro, pero ambas pertenecen al mismo tipo de factor: algo que memorizas.',
            'Typing two passwords in a row may feel safer, but both belong to the exact same factor type: something you memorise.',
          ],
        },
        {
          at: '00:11',
          speaker: 'BritJoy',
          text: [
            'La verdadera autenticación multifactor —MFA— combina categorías distintas: por ejemplo, tu contraseña más una app autenticadora o llave física.',
            'True multi-factor authentication—MFA—combines distinct categories: for instance, your password plus an authenticator app or security key.',
          ],
        },
        {
          at: '00:22',
          speaker: 'BritJoy',
          text: [
            'Así, aunque alguien filtre tu clave, no podrá entrar sin el segundo factor independiente.',
            'That way, even if someone steals your password, they cannot sign in without the independent second factor.',
          ],
        },
      ],
      captions: [
        { start: 0, end: 11, text: ['Dos contraseñas = una sola categoría de factor.', 'Two passwords = still a single factor category.'] },
        { start: 11, end: 22, text: ['MFA combina categorías distintas (sabes + tienes + eres).', 'MFA combines distinct categories (know + have + are).'] },
        { start: 22, end: 31, text: ['Frena accesos aunque una clave se filtre.', 'Blocks attackers even if a password leaks.'] },
      ],
      sources: [
        PEDAGOGICAL_REFERENCE,
        {
          title: 'NIST CSRC — Cybersecurity Glossary: Multi-Factor Authentication (MFA)',
          url: 'https://csrc.nist.gov/glossary',
          kind: 'technical',
        },
      ],
      mappings: [
        {
          courseId: 'ciberseguridad',
          questionId: 'vum-ciberseguridad-020',
          note: 'Bank mapping: ciberseguridad/vum-ciberseguridad-020 (¿Qué combina factores distintos? -> Autenticación multifactor).',
        },
      ],
    },
    {
      conceptId: 'ciberseguridad-password-policy-control',
      courseId: 'ciberseguridad',
      avatarId: 'ciberseguridad',
      avatarArt: COURSE_AVATAR_ART.ciberseguridad,
      country: null,
      status: 'draft',
      durationSeconds: 29,
      locales: ['es', 'en'],
      video: { src: null, poster: null, captions: { es: null, en: null } },
      title: [
        'Tipos de controles de seguridad: por qué una política es un control administrativo',
        'Security control types: why a password policy is an administrative control',
      ],
      context: [
        'En gestión de seguridad distinguimos controles administrativos (normas, políticas y formación), controles técnicos/lógicos (cifrado, cortafuegos, MFA en el sistema) y controles físicos (cerraduras, tarjetas de acceso a salas).',
        'In security governance we distinguish administrative controls (policies, rules, and training), technical/logical controls (encryption, firewalls, system enforcement), and physical controls (locks, server-room badges).',
      ],
      visualExample: {
        kind: 'security-control-types',
        badge: ['Gobernanza · Tipos de control (NIST)', 'Governance · Control Types (NIST)'],
        heading: ['Administrativo vs Técnico vs Físico', 'Administrative vs Technical vs Physical'],
        primary: [
          'Política de contraseñas (documento de reglas organizativas) → Control ADMINISTRATIVO.',
          'Password policy (written organisational rules and standards) → ADMINISTRATIVE control.',
        ],
        secondary: [
          'El validador del software que aplica esa regla es técnico; una cerradura en el cuarto de servidores es físico.',
          'The login code enforcing length is technical; a keypad lock on the server-room door is physical.',
        ],
        callout: [
          'Truco rápido: si define normas, responsabilidades o procedimientos para las personas, es administrativo.',
          'Quick cue: if it defines organisational rules, procedures, or staff duties, it is administrative.',
        ],
        steps: [
          ['Administrativo', 'Administrative', 'Políticas, normas y capacitación / Policies, rules, training'],
          ['Técnico / Lógico', 'Technical', 'Cifrado, MFA, firewall / Encryption, MFA, firewalls'],
          ['Físico', 'Physical', 'Cerraduras, cámaras y control de puertas / Locks, CCTV, doors'],
        ],
      },
      practice: {
        prompt: [
          '¿Qué tipo de control de seguridad es una política corporativa de contraseñas?',
          'What type of security control is an organisational password policy?',
        ],
        takeaway: [
          'Es un control administrativo, porque establece reglas y directrices organizativas.',
          'It is an administrative control because it establishes organisational rules and directives.',
        ],
      },
      feedback: [
        'Toda política, norma o procedimiento escrito pertenece a la familia de controles administrativos (organizativos).',
        'Every written security policy, standard, or procedure belongs to administrative (managerial) controls.',
      ],
      transcript: [
        {
          at: '00:00',
          speaker: 'BritJoy',
          text: [
            'En ciberseguridad no todos los controles son programas informáticos o cerraduras.',
            'In cybersecurity, not every security control is software code or a physical lock.',
          ],
        },
        {
          at: '00:09',
          speaker: 'BritJoy',
          text: [
            'Cuando una empresa aprueba una política de contraseñas que define longitud mínima, prohibición de compartir claves y uso de gestores, está creando una regla organizativa.',
            'When an organisation adopts a password policy defining minimum length, no password sharing, and password-manager rules, it sets an organisational rule.',
          ],
        },
        {
          at: '00:20',
          speaker: 'BritJoy',
          text: [
            'Por eso una política de contraseñas se clasifica como un control administrativo.',
            'That is why a password policy is classified as an administrative control.',
          ],
        },
      ],
      captions: [
        { start: 0, end: 9, text: ['Tres familias: controles administrativos, técnicos y físicos.', 'Three families: administrative, technical, and physical controls.'] },
        { start: 9, end: 20, text: ['Una política establece reglas organizativas.', 'A security policy sets organisational rules.'] },
        { start: 20, end: 29, text: ['Política de contraseñas = control administrativo.', 'Password policy = administrative control.'] },
      ],
      sources: [
        PEDAGOGICAL_REFERENCE,
        {
          title: 'NIST CSRC — Cybersecurity Glossary: Security Controls (Administrative / Managerial)',
          url: 'https://csrc.nist.gov/glossary',
          kind: 'technical',
        },
      ],
      mappings: [
        {
          courseId: 'ciberseguridad',
          questionId: 'vum-ciberseguridad-006',
          note: 'Bank mapping: ciberseguridad/vum-ciberseguridad-006 (¿Qué control es una política de contraseñas? -> Administrativo).',
        },
      ],
    },
    {
      conceptId: 'electricidad-gb-bs7671-competence',
      courseId: 'electricidad',
      avatarId: 'electricidad',
      avatarArt: COURSE_AVATAR_ART.electricidad,
      country: 'GB',
      status: 'draft',
      durationSeconds: 31,
      locales: ['es', 'en'],
      video: { src: null, poster: null, captions: { es: null, en: null } },
      title: [
        'BS 7671 en el Reino Unido: conocer la norma frente a competencia práctica',
        'BS 7671 in the UK: reading the Wiring Regulations vs practical competence',
      ],
      context: [
        'En el Reino Unido, BS 7671 (IET Wiring Regulations) es la norma técnica de referencia para instalaciones eléctricas. Sin embargo, leer el libro por sí solo NO acredita competencia profesional para intervenir en cuadros o circuitos con seguridad.',
        'In the United Kingdom, BS 7671 (IET Wiring Regulations) is the national standard for electrical installations. However, reading the standard alone does NOT establish practical competence to carry out live or installation work safely.',
      ],
      visualExample: {
        kind: 'gb-bs7671-competence',
        badge: ['Instalaciones UK · IET BS 7671 (GB)', 'UK Electrical Safety · IET BS 7671 (GB)'],
        heading: ['Norma técnica + Formación + Experiencia supervisada + Pruebas', 'Standard + Training + Supervised practice + Testing'],
        primary: [
          '¿Basta con leer BS 7671? → No: se requiere formación pertinente, habilidad práctica, equipos de medida e inspección.',
          'Does reading BS 7671 alone prove competence? → No: relevant training, practical skill, safe isolation, and testing are required.',
        ],
        secondary: [
          'En viviendas de Inglaterra y Gales, ciertos trabajos eléctricos además están sujetos a notificación (Part P).',
          'In domestic properties in England and Wales, notifiable work must also comply with Building Regulations Part P.',
        ],
        callout: [
          'Seguridad ante todo: nunca manipules un cuadro eléctrico sin competencia acreditada y aislamiento seguro verificado.',
          'Safety first: never work on distribution boards without verified competence and proven safe isolation.',
        ],
        steps: [
          ['Conocimiento (BS 7671)', 'Knowledge (BS 7671)', 'Comprender requisitos de la edición vigente / Know current regulations'],
          ['Formación y práctica', 'Training & skill', 'Cualificación práctica e instrumentos / Practical qualification & tools'],
          ['Verificación segura', 'Inspection & testing', 'Aislamiento seguro y certificación / Safe isolation and certification'],
        ],
      },
      practice: {
        prompt: [
          '¿Leer la norma británica BS 7671 demuestra por sí solo competencia práctica para realizar trabajos eléctricos?',
          'Does reading BS 7671 alone demonstrate practical competence for electrical work?',
        ],
        takeaway: [
          'No; además del conocimiento normativo se requiere formación práctica y competencia pertinente.',
          'No; relevant practical training, experience, and competence are also required.',
        ],
      },
      feedback: [
        'Distingue siempre entre conocer un texto técnico y poseer la competencia práctica y habilitación para ejecutar instalaciones seguras.',
        'Always distinguish between reading a technical document and holding verified practical competence to work safely.',
      ],
      transcript: [
        {
          at: '00:00',
          speaker: 'BritJoy',
          text: [
            'En el Reino Unido, la norma BS 7671 —conocida como IET Wiring Regulations— fija los requisitos de las instalaciones eléctricas.',
            'In the UK, BS 7671—the IET Wiring Regulations—sets the standard for electrical installations.',
          ],
        },
        {
          at: '00:11',
          speaker: 'BritJoy',
          text: [
            'Pero atención: haber leído la norma nunca equivale por sí solo a tener competencia práctica para instalar o modificar circuitos.',
            'However, reading the regulations book never by itself proves practical competence to install or modify circuits.',
          ],
        },
        {
          at: '00:21',
          speaker: 'BritJoy',
          text: [
            'La seguridad eléctrica exige formación acreditada, práctica supervisada y verificación instrumental rigurosa.',
            'Electrical safety requires accredited training, supervised practical skill, and proper inspection and testing.',
          ],
        },
      ],
      captions: [
        { start: 0, end: 11, text: ['BS 7671 = norma de instalaciones eléctricas en Reino Unido.', 'BS 7671 = UK Wiring Regulations standard.'] },
        { start: 11, end: 21, text: ['Leer el texto NO demuestra competencia práctica por sí solo.', 'Reading the text alone does NOT prove practical competence.'] },
        { start: 21, end: 31, text: ['Se requiere formación, experiencia y pruebas seguras.', 'Relevant training, skill, and testing are required.'] },
      ],
      sources: [
        PEDAGOGICAL_REFERENCE,
        {
          title: 'IET — BS 7671: 18th Edition IET Wiring Regulations Guidance',
          url: 'https://electrical.theiet.org/bs-7671-18th-edition-wiring-regulations/ensure-you-are-up-to-date-with-bs-7671/',
          kind: 'technical',
        },
      ],
      mappings: [
        {
          courseId: 'electricidad',
          questionId: 'vum-electricidad-016',
          country: 'GB',
          note: 'Bank mapping: electricidad/vum-electricidad-016 (¿Leer BS 7671 demuestra por sí solo competencia práctica? -> No).',
        },
      ],
    },
    {
      conceptId: 'electricidad-co-retie-safety',
      courseId: 'electricidad',
      avatarId: 'electricidad',
      avatarArt: COURSE_AVATAR_ART.electricidad,
      country: 'CO',
      status: 'draft',
      durationSeconds: 30,
      locales: ['es', 'en'],
      video: { src: null, poster: null, captions: { es: null, en: null } },
      title: [
        '¿Qué es el RETIE en Colombia y qué protege?',
        'What is RETIE in Colombia and what does it protect?',
      ],
      context: [
        'En Colombia, el Ministerio de Minas y Energía expide el RETIE («Reglamento Técnico de Instalaciones Eléctricas»), de cumplimiento obligatorio para proteger la vida humana, la salud y el entorno frente a riesgos de origen eléctrico.',
        'In Colombia, the Ministry of Mines and Energy issues RETIE ("Reglamento Técnico de Instalaciones Eléctricas"), the mandatory technical regulation protecting human life, health, and property against electrical hazards.',
      ],
      visualExample: {
        kind: 'co-retie-overview',
        badge: ['Normativa Colombia · MinEnergía RETIE (CO)', 'Colombian Standard · MinEnergía RETIE (CO)'],
        heading: ['Sigla oficial: Reglamento Técnico de Instalaciones Eléctricas', 'Official acronym: Technical Regulations for Electrical Installations'],
        primary: [
          'RETIE = Reglamento Técnico de Instalaciones Eléctricas (seguridad eléctrica obligatoria en Colombia).',
          'RETIE = Reglamento Técnico de Instalaciones Eléctricas (mandatory electrical safety regulation in Colombia).',
        ],
        secondary: [
          'No tiene relación con registros de turismo ni con reglamentos de idiomas: regula materiales, diseño y conformidad eléctrica.',
          'Unrelated to tourism or language rules: it governs certified electrical products, safe design, and inspection.',
        ],
        callout: [
          'Exige productos certificados y dictamen de inspección cuando el tipo de instalación así lo establece.',
          'Requires certified components and conformity inspection where mandated by the regulation.',
        ],
        steps: [
          ['R · E · T', 'R · E · T', 'Reglamento Técnico / Technical Regulation'],
          ['I · E', 'I · E', 'de Instalaciones Eléctricas / for Electrical Installations'],
          ['Objetivo central', 'Core goal', 'Proteger la vida y prevenir riesgos eléctricos / Protect life and safety'],
        ],
      },
      practice: {
        prompt: [
          'En el contexto eléctrico de Colombia, ¿qué significan exactamente las siglas RETIE?',
          'In Colombia’s electrical safety framework, what does RETIE stand for?',
        ],
        takeaway: [
          'Reglamento Técnico de Instalaciones Eléctricas.',
          'Reglamento Técnico de Instalaciones Eléctricas (Technical Regulations for Electrical Installations).',
        ],
      },
      feedback: [
        'Relaciona siempre RETIE con el Reglamento Técnico de Instalaciones Eléctricas del Ministerio de Minas y Energía de Colombia.',
        'Always link RETIE to Colombia’s Technical Regulations for Electrical Installations issued by MinEnergía.',
      ],
      transcript: [
        {
          at: '00:00',
          speaker: 'BritJoy',
          text: [
            'Si trabajas o contratas una instalación eléctrica en Colombia, escucharás constantemente la sigla RETIE.',
            'If you work on or commission an electrical installation in Colombia, you will constantly hear the acronym RETIE.',
          ],
        },
        {
          at: '00:10',
          speaker: 'BritJoy',
          text: [
            'RETIE significa «Reglamento Técnico de Instalaciones Eléctricas», expedido por el Ministerio de Minas y Energía.',
            'RETIE stands for "Reglamento Técnico de Instalaciones Eléctricas", issued by the Ministry of Mines and Energy.',
          ],
        },
        {
          at: '00:20',
          speaker: 'BritJoy',
          text: [
            'Su propósito es garantizar que cables, tableros, puestas a tierra y montajes protejan la vida de las personas.',
            'Its purpose is ensuring wiring, panels, earthing, and installations protect human life.',
          ],
        },
      ],
      captions: [
        { start: 0, end: 10, text: ['Colombia: normativa obligatoria de seguridad eléctrica.', 'Colombia: mandatory electrical safety regulation.'] },
        { start: 10, end: 20, text: ['RETIE = Reglamento Técnico de Instalaciones Eléctricas.', 'RETIE = Reglamento Técnico de Instalaciones Eléctricas.'] },
        { start: 20, end: 30, text: ['Fuente oficial: Ministerio de Minas y Energía (CO).', 'Official source: MinEnergía Colombia.'] },
      ],
      sources: [
        PEDAGOGICAL_REFERENCE,
        {
          title: 'Ministerio de Minas y Energía de Colombia — Reglamento Técnico de Instalaciones Eléctricas (RETIE)',
          url: 'https://minenergia.gov.co/es/misional/energia-electrica-2/reglamentos-tecnicos/reglamento-t%C3%A9cnico-de-instalaciones-el%C3%A9ctricas-retie/',
          kind: 'official',
        },
      ],
      mappings: [
        {
          courseId: 'electricidad',
          questionId: 'vum-electricidad-029',
          country: 'CO',
          note: 'Bank mapping: electricidad/vum-electricidad-029 (¿Qué significa RETIE? -> Reglamento Técnico de Instalaciones Eléctricas).',
        },
      ],
    },
    // =========================================================================
    // BATCH 2 (Lote 2): 7 additional question-specific draft concepts (1 per course)
    // Every mapped ID is verified against real guided units and bank questions.
    // =========================================================================
    {
      conceptId: 'ingles-station-underground-route',
      courseId: 'ingles',
      avatarId: 'ingles',
      avatarArt: COURSE_AVATAR_ART.ingles,
      country: null,
      status: 'draft',
      durationSeconds: 30,
      locales: ['es', 'en'],
      video: { src: null, poster: null, captions: { es: null, en: null } },
      title: [
        'Preguntar por la estación y entender transbordos en el metro («change at…»)',
        'Asking for the station and understanding Underground interchanges ("change at…")',
      ],
      context: [
        'Al desplazarte en tren o metro en el Reino Unido necesitarás dos habilidades unidas: abrir la pregunta con cortesía en la calle («Excuse me, where is the station?») y captar en los avisos de andén en qué estación debes hacer transbordo («change at Central») y por qué dejar margen extra cuando hay cambio de línea.',
        'When travelling by rail or Underground in the UK, you combine two practical skills: opening a street question politely ("Excuse me, where is the station?") and catching platform announcements about where to interchange ("change at Central") and why an interchange route needs extra time.',
      ],
      visualExample: {
        kind: 'station-underground-route',
        badge: ['Transporte UK · Estación y transbordo (A1–B2)', 'UK Travel · Station & Interchange (A1–B2)'],
        heading: ['De la pregunta en la calle al aviso del andén', 'From polite street directions to platform notices'],
        primary: [
          '1) «Excuse me, where is the station?» · 2) «Use Platform 2 and change at Central.»',
          '1) "Excuse me, where is the station?" · 2) "Use Platform 2 and change at Central."',
        ],
        secondary: [
          'Si el tren directo no circula y la ruta alternativa exige transbordo («a change on the alternative route»), prevé tiempo adicional.',
          'If the direct train is not running and the alternative route includes a change, allow extra time for the connection.',
        ],
        callout: [
          'Pista clave: «Excuse me» abre la consulta cortés; «change at [Station]» indica exactamente dónde cambias de tren.',
          'Key cue: "Excuse me" opens polite questions to strangers; "change at [Station]" names the exact interchange stop.',
        ],
        steps: [
          ['En la calle', 'Street question', '«Excuse me, where is the station?»'],
          ['Andén y enlace', 'Platform & change', '«Platform 2 → change at Central»'],
          ['Margen de tiempo', 'Allow extra time', 'Ruta alternativa con transbordo requiere margen extra'],
        ],
      },
      practice: {
        prompt: [
          'Si el aviso indica «For River Square, use Platform 2 and change at Central» porque no hay tren directo, ¿dónde haces transbordo y por qué dejas margen extra?',
          'If the notice says "For River Square, use Platform 2 and change at Central" because the direct train is off, where do you change and why allow extra time?',
        ],
        takeaway: [
          'Cambias en Central («At Central») y dejas tiempo extra porque hay un transbordo en la ruta alternativa.',
          'You change at Central ("At Central") and allow extra time because there is a change on the alternative route.',
        ],
      },
      feedback: [
        'Usa «Excuse me, where is…?» para preguntar por la estación y localiza siempre el verbo «change at…» en los avisos de viaje.',
        'Use "Excuse me, where is…?" to ask for the station, and listen for "change at…" in rail announcements.',
      ],
      transcript: [
        {
          at: '00:00',
          speaker: 'BritJoy',
          text: [
            'Cuando buscas una estación en el Reino Unido, empieza con «Excuse me» antes de preguntar: «Excuse me, where is the station?».',
            'When looking for a station in the UK, start with "Excuse me" before asking: "Excuse me, where is the station?".',
          ],
        },
        {
          at: '00:10',
          speaker: 'BritJoy',
          text: [
            'Ya dentro del metro o tren, escucha dos datos esenciales del aviso: el andén, por ejemplo «Platform 2», y la estación de enlace tras «change at», como «change at Central».',
            'Once inside the station, listen for two key details: the platform—"Platform 2"—and the interchange stop after "change at", such as "change at Central".',
          ],
        },
        {
          at: '00:21',
          speaker: 'BritJoy',
          text: [
            'Y si el tren directo no circula, recuerda dejar tiempo extra porque la ruta alternativa incluye un transbordo.',
            'And when the direct train is not running, allow extra time because there is a change on the alternative route.',
          ],
        },
      ],
      captions: [
        { start: 0, end: 10, text: ['Cortesía al preguntar: «Excuse me, where is the station?».', 'Polite opener: "Excuse me, where is the station?".'] },
        { start: 10, end: 21, text: ['«Change at Central» = estación exacta del transbordo.', '"Change at Central" = exact interchange station.'] },
        { start: 21, end: 30, text: ['Con transbordo en ruta alternativa, deja tiempo extra.', 'Allow extra time when an alternative route has a change.'] },
      ],
      sources: [
        PEDAGOGICAL_REFERENCE,
        {
          title: 'Transport for London — Tube, Overground and Elizabeth line travel guidance',
          url: 'https://tfl.gov.uk/modes/tube/',
          kind: 'official',
        },
      ],
      mappings: [
        {
          courseId: 'ingles',
          lessonId: 'directions',
          questionId: 'directions',
          note: 'Guided lesson mapping: ingles/directions (¿Cómo preguntas dónde está? -> Excuse me, where is the station?).',
        },
        {
          courseId: 'ingles',
          questionId: 'story-a1-underground',
          note: 'Bank mapping: ingles/story-a1-underground (Where do you change on this practice journey? -> At Central).',
        },
        {
          courseId: 'ingles',
          questionId: 'story-b1-underground',
          note: 'Bank mapping: ingles/story-b1-underground (Why should you allow extra time? -> There is a change on the alternative route).',
        },
      ],
    },
    {
      conceptId: 'espanol-ubicacion-donde-estar',
      courseId: 'espanol',
      avatarId: 'espanol',
      avatarArt: COURSE_AVATAR_ART.espanol,
      country: null,
      status: 'draft',
      durationSeconds: 29,
      locales: ['es', 'en'],
      video: { src: null, poster: null, captions: { es: null, en: null } },
      title: [
        'Preguntar y expresar ubicación en español: «¿Dónde…?» y el verbo «estar»',
        'Asking and stating location in Spanish: "¿Dónde…?" and the verb "estar"',
      ],
      context: [
        'Para orientarte en la ciudad o situar a personas y lugares en español combinamos el interrogativo con tilde «¿Dónde…?» («¿Dónde está la estación?», «¿Dónde vives?») y el verbo «estar» para expresar ubicación («está en casa», «está a la derecha»).',
        'To find your way around town or state where people and places are in Spanish, pair the accented question word "¿Dónde…?" ("¿Dónde está la estación?", "¿Dónde vives?") with "estar" for location ("está en casa", "está a la derecha").',
      ],
      visualExample: {
        kind: 'espanol-donde-estar',
        badge: ['Orientación y lugar · Español A1', 'Places & Location · Spanish A1'],
        heading: ['«¿Dónde…?» pregunta el lugar · «estar» sitúa en el mapa', '"¿Dónde…?" asks the place · "estar" locates people & buildings'],
        primary: [
          '«¿Dónde está la estación?» · «¿Dónde vives? — En Madrid.» · «Mi hermana está en casa.»',
          '"¿Dónde está la estación?" · "¿Dónde vives? — En Madrid." · "Mi hermana está en casa."',
        ],
        secondary: [
          'No uses «ser» para ubicar personas u objetos físicos («es en casa» ✗ → «está en casa» ✓); recuerda la tilde en «Dónde» interrogativo.',
          'Do not use "ser" to locate people or buildings ("es en casa" ✗ → "está en casa" ✓); keep the written accent on interrogative "Dónde".',
        ],
        callout: [
          'Regla directa: lugar en pregunta = «¿Dónde…?»; ubicación de persona o edificio = verbo «estar».',
          'Direct rule: asking about a place = "¿Dónde…?"; location of a person or building = "estar".',
        ],
        steps: [
          ['Buscar un edificio', 'Find a place', '«¿Dónde está la estación?» (a la izquierda / a la derecha)'],
          ['Preguntar residencia', 'Ask where someone lives', '«¿Dónde vives? — En Madrid.»'],
          ['Situar a una persona', 'Locate a person', '«Ahora mi hermana está en casa.»'],
        ],
      },
      practice: {
        prompt: [
          'Completa las dos frases de lugar: 1) «¿___ vives? — En Madrid.» · 2) «Ahora mi hermana ___ en casa.»',
          'Complete both location sentences: 1) "¿___ vives? — En Madrid." · 2) "Ahora mi hermana ___ en casa."',
        ],
        takeaway: [
          '1) «Dónde» (pregunta por un lugar) y 2) «está» (el verbo «estar» expresa ubicación).',
          '1) "Dónde" (asks about a place) and 2) "está" ("estar" expresses location).',
        ],
      },
      feedback: [
        'Asocia siempre preguntas de lugar con «¿Dónde…?» y la posición de personas o lugares con «estar».',
        'Always pair place questions with "¿Dónde…?" and the location of people or places with "estar".',
      ],
      transcript: [
        {
          at: '00:00',
          speaker: 'BritJoy',
          text: [
            'Cuando necesitas saber un lugar en español, la palabra clave es «¿Dónde…?» con tilde: «¿Dónde está la estación?» o «¿Dónde vives? — En Madrid».',
            'When you need to ask about a place in Spanish, the key word is "¿Dónde…?" with an accent mark: "¿Dónde está la estación?" or "¿Dónde vives? — En Madrid".',
          ],
        },
        {
          at: '00:11',
          speaker: 'BritJoy',
          text: [
            'Y para indicar dónde se encuentra una persona o un edificio usamos siempre «estar», nunca «ser»: «La estación está a la izquierda» o «Ahora mi hermana está en casa».',
            'And to state where a person or a building is located, Spanish always uses "estar", never "ser": "La estación está a la izquierda" or "Ahora mi hermana está en casa".',
          ],
        },
        {
          at: '00:21',
          speaker: 'BritJoy',
          text: [
            'Recuerda este par inseparable para orientarte: «¿Dónde?» pregunta el lugar y «está» indica la ubicación.',
            'Remember this inseparable pair for directions: "¿Dónde?" asks the place and "está" states the location.',
          ],
        },
      ],
      captions: [
        { start: 0, end: 11, text: ['«¿Dónde…?» con tilde pregunta siempre por un lugar.', '"¿Dónde…?" with an accent asks about a place.'] },
        { start: 11, end: 21, text: ['«Estar» expresa ubicación: «está la estación», «está en casa».', '"Estar" expresses location: "está la estación", "está en casa".'] },
        { start: 21, end: 29, text: ['«¿Dónde vives?» + «Mi hermana está en casa».', '"¿Dónde vives?" + "Mi hermana está en casa".'] },
      ],
      sources: [
        PEDAGOGICAL_REFERENCE,
        {
          title: 'Real Academia Española — Nueva gramática: interrogativo «dónde» y verbo locativo «estar»',
          url: 'https://www.rae.es/dpd/estar',
          kind: 'linguistic',
        },
      ],
      mappings: [
        {
          courseId: 'espanol',
          lessonId: 'directions',
          questionId: 'directions',
          note: 'Guided lesson mapping: espanol/directions (¿Qué pregunta sirve para buscar la estación? -> ¿Dónde está la estación?).',
        },
        {
          courseId: 'espanol',
          questionId: 'vum-espanol-009',
          note: 'Bank mapping: espanol/vum-espanol-009 (Completa: ¿___ vives? — En Madrid. -> Dónde).',
        },
        {
          courseId: 'espanol',
          questionId: 'vum-espanol-011',
          note: 'Bank mapping: espanol/vum-espanol-011 (Completa: Ahora mi hermana ___ en casa. -> está).',
        },
      ],
    },
    {
      conceptId: 'britjoy-uk-four-nations-capitals',
      courseId: 'britjoy',
      avatarId: 'britjoy',
      avatarArt: COURSE_AVATAR_ART.britjoy,
      country: 'GB',
      status: 'draft',
      durationSeconds: 33,
      locales: ['es', 'en'],
      video: { src: null, poster: null, captions: { es: null, en: null } },
      title: [
        'Las cuatro naciones del Reino Unido, sus capitales y la diferencia con Gran Bretaña',
        'The four nations of the UK, their capitals, and how the UK differs from Great Britain',
      ],
      context: [
        'Una pregunta clásica de Life in the UK distingue entre «Great Britain» (Inglaterra, Escocia y Gales) y el nombre oficial «United Kingdom of Great Britain and Northern Ireland», que suma Irlanda del Norte, además de asociar cada nación con su capital exacta.',
        'A classic Life in the UK topic distinguishes "Great Britain" (England, Scotland, and Wales) from the full "United Kingdom of Great Britain and Northern Ireland"—which adds Northern Ireland—and pairs each nation with its capital city.',
      ],
      visualExample: {
        kind: 'uk-nations-capitals-map',
        badge: ['Geografía oficial · Life in the UK (GB)', 'Official Geography · Life in the UK (GB)'],
        heading: ['Gran Bretaña (3 naciones) + Irlanda del Norte = Reino Unido (4 naciones)', 'Great Britain (3 nations) + Northern Ireland = United Kingdom (4 nations)'],
        primary: [
          'Inglaterra → Londres (también capital del Reino Unido) · Escocia → Edimburgo · Gales → Cardiff · Irlanda del Norte → Belfast.',
          'England → London (also capital of the UK) · Scotland → Edinburgh · Wales → Cardiff · Northern Ireland → Belfast.',
        ],
        secondary: [
          'La República de Irlanda es un Estado independiente y NO forma parte del Reino Unido.',
          'The Republic of Ireland is an independent country and is NOT part of the United Kingdom.',
        ],
        callout: [
          'Fórmula exacta del examen: Great Britain = England + Scotland + Wales; United Kingdom añade Northern Ireland.',
          'Exact exam formula: Great Britain = England + Scotland + Wales; the United Kingdom adds Northern Ireland.',
        ],
        steps: [
          ['Inglaterra y UK', 'England & UK', 'Londres (London) — capital de Inglaterra y del Reino Unido'],
          ['Escocia y Gales', 'Scotland & Wales', 'Edimburgo (Edinburgh) y Cardiff — junto a Inglaterra forman Gran Bretaña'],
          ['Irlanda del Norte', 'Northern Ireland', 'Belfast — completa el United Kingdom of Great Britain and Northern Ireland'],
        ],
      },
      practice: {
        prompt: [
          '¿Qué nación añade el Reino Unido a Gran Bretaña y cuáles son las cuatro parejas nación—capital?',
          'Which nation does the United Kingdom add to Great Britain, and what are the four nation–capital pairs?',
        ],
        takeaway: [
          'Añade Irlanda del Norte (capital Belfast), junto a Inglaterra—Londres, Escocia—Edimburgo y Gales—Cardiff.',
          'It adds Northern Ireland (capital Belfast), alongside England–London, Scotland–Edinburgh, and Wales–Cardiff.',
        ],
      },
      feedback: [
        'Comprueba siempre si la pregunta dice «Great Britain» (3 naciones) o «United Kingdom» (las 4 naciones incluyendo Irlanda del Norte) y verifica cada capital.',
        'Always check whether the question says "Great Britain" (3 nations) or "United Kingdom" (all 4 nations including Northern Ireland) and match each capital.',
      ],
      transcript: [
        {
          at: '00:00',
          speaker: 'BritJoy',
          text: [
            'El nombre oficial del país te da la clave geográfica completa: «United Kingdom of Great Britain and Northern Ireland».',
            'The country’s official name gives you the full geographical rule: "United Kingdom of Great Britain and Northern Ireland".',
          ],
        },
        {
          at: '00:11',
          speaker: 'BritJoy',
          text: [
            'Gran Bretaña comprende tres naciones en la isla principal: Inglaterra con Londres —también capital del Reino Unido—, Escocia con Edimburgo y Gales con Cardiff.',
            'Great Britain covers three nations on the main island: England with London—also the UK capital—Scotland with Edinburgh, and Wales with Cardiff.',
          ],
        },
        {
          at: '00:23',
          speaker: 'BritJoy',
          text: [
            'Al sumar Irlanda del Norte, cuya capital es Belfast, se completan las cuatro naciones del Reino Unido.',
            'Adding Northern Ireland, whose capital is Belfast, completes the four nations of the United Kingdom.',
          ],
        },
      ],
      captions: [
        { start: 0, end: 11, text: ['Nombre oficial: United Kingdom of Great Britain and Northern Ireland.', 'Official name: United Kingdom of Great Britain and Northern Ireland.'] },
        { start: 11, end: 23, text: ['Gran Bretaña: Inglaterra (Londres), Escocia (Edimburgo), Gales (Cardiff).', 'Great Britain: England (London), Scotland (Edinburgh), Wales (Cardiff).'] },
        { start: 23, end: 33, text: ['+ Irlanda del Norte (Belfast) = las 4 naciones del Reino Unido.', '+ Northern Ireland (Belfast) = all 4 nations of the UK.'] },
      ],
      sources: [
        PEDAGOGICAL_REFERENCE,
        {
          title: 'GOV.UK / Office for National Statistics — Countries within a country: United Kingdom and Great Britain',
          url: 'https://www.gov.uk/Life-in-the-UK-test',
          kind: 'official',
        },
      ],
      mappings: [
        { courseId: 'britjoy', lessonId: 'geography-01', questionId: 'geography-01', country: 'GB', note: 'Guided unit: Las cuatro naciones del Reino Unido.' },
        { courseId: 'britjoy', lessonId: 'geography-02', questionId: 'geography-02', country: 'GB', note: 'Guided unit: Capitales de las cuatro naciones (Cardiff / Gales).' },
        { courseId: 'britjoy', lessonId: 'geography-03', questionId: 'geography-03', country: 'GB', note: 'Guided unit: Diferencia entre Gran Bretaña y Reino Unido (+ Irlanda del Norte).' },
        { courseId: 'britjoy', lessonId: 'geography-04', questionId: 'geography-04', country: 'GB', note: 'Guided unit: Belfast en Irlanda del Norte.' },
        { courseId: 'britjoy', lessonId: 'geography-05', questionId: 'geography-05', country: 'GB', note: 'Guided unit: Parejas nación—capital (Escocia — Edimburgo).' },
        { courseId: 'britjoy', questionId: 'own-geography-01', country: 'GB', note: 'Bank mapping: Scottish capital -> Edinburgh.' },
        { courseId: 'britjoy', questionId: 'own-geography-02', country: 'GB', note: 'Bank mapping: Capital of Wales -> Cardiff.' },
        { courseId: 'britjoy', questionId: 'own-geography-03', country: 'GB', note: 'Bank mapping: Belfast -> Northern Ireland.' },
        { courseId: 'britjoy', questionId: 'own-geography-04', country: 'GB', note: 'Bank mapping: Capital of both England and the UK -> London.' },
        { courseId: 'britjoy', questionId: 'own-geography-05', country: 'GB', note: 'Bank mapping: Four nations of the UK.' },
        { courseId: 'britjoy', questionId: 'own-geography-06', country: 'GB', note: 'Bank mapping: United Kingdom of Great Britain and Northern Ireland.' },
      ],
    },
    {
      conceptId: 'ia-training-vs-inference',
      courseId: 'ia',
      avatarId: 'ia',
      avatarArt: COURSE_AVATAR_ART.ia,
      country: null,
      status: 'draft',
      durationSeconds: 30,
      locales: ['es', 'en'],
      video: { src: null, poster: null, captions: { es: null, en: null } },
      title: [
        'Entrenar frente a inferir: cuándo cambian los pesos de un modelo de IA',
        'Training vs inference: when an AI model’s weights actually change',
      ],
      context: [
        'En aprendizaje automático existen dos fases muy distintas: durante el entrenamiento («training») el sistema ajusta sus pesos o parámetros internos para reducir el error sobre ejemplos etiquetados; durante la inferencia («inference») usamos el modelo ya entrenado para producir una salida ante datos nuevos sin reentrenar sus pesos.',
        'In machine learning there are two distinct phases: during training, the algorithm adjusts internal weights/parameters to reduce error across labelled examples; during inference, we run the trained model on new inputs to produce an output without retraining its weights.',
      ],
      visualExample: {
        kind: 'ia-train-vs-infer',
        badge: [' Ciclo del modelo · Entrenamiento vs Inferencia', 'Model Lifecycle · Training vs Inference'],
        heading: ['Entrenar ajusta los pesos · Inferir produce una salida', 'Training adjusts weights · Inference produces an output'],
        primary: [
          'Entrenamiento (Training): actualiza los pesos internos para reducir el error · Inferencia (Inference): calcula una predicción o respuesta sin reentrenar.',
          'Training: updates internal weights to reduce error · Inference: computes a prediction or reply without retraining.',
        ],
        secondary: [
          'Enviar una consulta cotidiana a un modelo desplegado ejecuta inferencia; no modifica automáticamente los pesos base del modelo.',
          'Sending an everyday query to a deployed model runs inference; it does not automatically update the model’s base weights.',
        ],
        callout: [
          'Idea clave: usar un modelo en producción (inferir) no equivale a volver a entrenarlo.',
          'Key takeaway: using a model to generate an answer (inference) is not the same as retraining it.',
        ],
        steps: [
          ['1. Entrenar (Train)', '1. Training', 'Ejemplos + etiquetas → ajusta pesos internos para reducir el error'],
          ['2. Pesos fijados', '2. Frozen weights', 'Los parámetros aprendidos quedan guardados en la versión del modelo'],
          ['3. Inferir (Infer)', '3. Inference', 'Entrada nueva → aplica los pesos y produce una salida'],
        ],
      },
      practice: {
        prompt: [
          '¿Qué cambia dentro del modelo al entrenarlo y qué diferencia hay entre entrenar e inferir?',
          'What changes inside a model during training, and what distinguishes training from inference?',
        ],
        takeaway: [
          'Entrenar ajusta los pesos internos del modelo para reducir el error; inferir usa el modelo para producir una salida.',
          'Training adjusts the model’s internal weights to reduce error; inference uses the model to produce an output.',
        ],
      },
      feedback: [
        'Distingue siempre el ajuste de pesos para reducir el error (entrenamiento) de la generación de respuestas con el modelo ya entrenado (inferencia).',
        'Always separate updating weights to minimise error (training) from generating outputs with a trained model (inference).',
      ],
      transcript: [
        {
          at: '00:00',
          speaker: 'BritJoy',
          text: [
            '¿Cambian los números internos de un modelo cada vez que le haces una pregunta? Para responder, separamos entrenar de inferir.',
            'Do a model’s internal numbers change every time you ask it a question? To answer, separate training from inference.',
          ],
        },
        {
          at: '00:10',
          speaker: 'BritJoy',
          text: [
            'Al entrenar, el sistema compara sus predicciones con los ejemplos de aprendizaje y ajusta sus pesos internos para reducir el error.',
            'During training, the system compares predictions against learning examples and adjusts its internal weights to reduce error.',
          ],
        },
        {
          at: '00:21',
          speaker: 'BritJoy',
          text: [
            'En cambio, inferir significa aplicar ese modelo ya entrenado a un dato nuevo para producir una salida, sin volver a entrenarlo.',
            'Inference, by contrast, applies that trained model to a new input to produce an output, without retraining it.',
          ],
        },
      ],
      captions: [
        { start: 0, end: 10, text: ['Dos fases distintas: entrenamiento (train) e inferencia (infer).', 'Two distinct phases: training and inference.'] },
        { start: 10, end: 21, text: ['Entrenar ajusta los pesos internos para reducir el error.', 'Training adjusts internal weights to reduce error.'] },
        { start: 21, end: 30, text: ['Inferir usa el modelo entrenado para producir una salida.', 'Inference runs the trained model to produce an output.'] },
      ],
      sources: [
        PEDAGOGICAL_REFERENCE,
        {
          title: 'NIST AI 100-1 — Artificial Intelligence Risk Management Framework (Training vs Deployment/Inference)',
          url: 'https://www.nist.gov/itl/ai-risk-management-framework',
          kind: 'technical',
        },
      ],
      mappings: [
        {
          courseId: 'ia',
          lessonId: 'train',
          questionId: 'train',
          note: 'Guided lesson mapping: ia/train (Al entrenar el modelo del laboratorio cambian… -> Sus pesos para reducir el error).',
        },
        {
          courseId: 'ia',
          questionId: 'vum-ia-003',
          note: 'Bank mapping: ia/vum-ia-003 (¿Qué diferencia entrenar e inferir? -> Entrenar ajusta el modelo; inferir produce una salida).',
        },
      ],
    },
    {
      conceptId: 'conduccion-driver-fatigue-safe-stop',
      courseId: 'conduccion',
      avatarId: 'conduccion',
      avatarArt: COURSE_AVATAR_ART.conduccion,
      country: null,
      status: 'draft',
      durationSeconds: 30,
      locales: ['es', 'en'],
      video: { src: null, poster: null, captions: { es: null, en: null } },
      title: [
        'Fatiga y somnolencia al volante: buscar un lugar seguro para parar y descansar',
        'Driver fatigue and sleepiness: finding a safe place to stop and rest',
      ],
      context: [
        'El sueño y la fatiga reducen drásticamente la atención y multiplican el tiempo de reacción. Según The Highway Code (regla 91) y las normas viales seguras, abrir la ventanilla o subir la radio no corrige el sueño: debes buscar cuanto antes un lugar seguro y legal para detenerte y descansar (nunca el arcén de una autopista salvo emergencia).',
        'Sleepiness and fatigue sharply reduce attention and lengthen reaction time. Under The Highway Code (Rule 91) and safe driving standards, opening a window or turning up music will not cure tiredness: find a safe, legal place to stop and rest as soon as possible (never on a motorway hard shoulder except in an emergency).',
      ],
      visualExample: {
        kind: 'driver-fatigue-safe-stop',
        badge: ['Seguridad vial · Atención y descanso (Regla 91)', 'Road Safety · Alertness & Rest (Rule 91)'],
        heading: ['Ante síntomas de sueño → Parar en lugar seguro y descansar', 'When sleepy at the wheel → Stop somewhere safe and rest'],
        primary: [
          'Síntoma de somnolencia al conducir → Busca un área de servicio o lugar seguro para detenerte y descansar.',
          'Feeling sleepy while driving → Find a service area or safe place to stop and rest.',
        ],
        secondary: [
          'Acelerar para «llegar antes» o confiar solo en aire frío mantiene el riesgo de microsueño; tampoco pares en el arcén de autopista.',
          'Speeding up to "arrive sooner" or relying on cold air risks microsleeps; never park on a motorway hard shoulder to rest.',
        ],
        callout: [
          'Planifica pausas periódicas en viajes largos y detente en lugar seguro al primer signo de fatiga.',
          'Plan regular breaks on long journeys and stop in a safe place at the earliest sign of fatigue.',
        ],
        steps: [
          ['Antes de salir', 'Before setting off', 'Descansa bien y planifica paradas en la ruta'],
          ['Señal de alerta', 'Warning sign', 'Bostezos, pesadez de ojos o pérdida de concentración'],
          ['Acción segura', 'Safe decision', 'Salir a un lugar seguro para parar y descansar'],
        ],
      },
      practice: {
        prompt: [
          'Empiezas a sentir sueño mientras conduces. ¿Cuál es la decisión segura?',
          'You start feeling sleepy while driving. What is the safe decision?',
        ],
        takeaway: [
          'Buscar un lugar seguro para detenerte y descansar antes de continuar.',
          'Find a safe place to stop and rest before continuing your journey.',
        ],
      },
      feedback: [
        'El cansancio reduce la atención y la capacidad de reacción: ante el sueño, para siempre en un lugar seguro para descansar.',
        'Fatigue degrades attention and reaction time: whenever sleepy, stop somewhere safe to rest.',
      ],
      transcript: [
        {
          at: '00:00',
          speaker: 'BritJoy',
          text: [
            'Sentir sueño al volante es una alerta crítica: el cansancio reduce tu atención y alarga el tiempo que tardas en reaccionar.',
            'Feeling sleepy at the wheel is a critical warning: fatigue lowers your attention and slows your reaction time.',
          ],
        },
        {
          at: '00:10',
          speaker: 'BritJoy',
          text: [
            'Ni acelerar para llegar antes ni abrir la ventanilla evitan un microsueño.',
            'Neither speeding up to get there sooner nor opening a window prevents a microsleep.',
          ],
        },
        {
          at: '00:19',
          speaker: 'BritJoy',
          text: [
            'La decisión correcta —recogida en la regla 91 del Highway Code— es buscar un lugar seguro y permitido para parar y descansar.',
            'The safe decision—set out in Highway Code Rule 91—is to find a safe, legal place to stop and rest.',
          ],
        },
      ],
      captions: [
        { start: 0, end: 10, text: ['El sueño reduce la atención y frena tu capacidad de reacción.', 'Sleepiness reduces attention and slows reaction time.'] },
        { start: 10, end: 19, text: ['Acelerar o abrir la ventanilla no elimina la fatiga.', 'Speeding up or cold air will not cure driver fatigue.'] },
        { start: 19, end: 30, text: ['Busca un lugar seguro para detenerte y descansar.', 'Find a safe place to stop and rest.'] },
      ],
      sources: [
        PEDAGOGICAL_REFERENCE,
        {
          title: 'GOV.UK — The Highway Code: Fitness to drive and Rule 91 ( tiredness / rest stops )',
          url: 'https://www.gov.uk/guidance/the-highway-code/rules-for-drivers-and-motorcyclists-89-to-102',
          kind: 'official',
        },
      ],
      mappings: [
        {
          courseId: 'conduccion',
          lessonId: 'alertness',
          questionId: 'alertness',
          note: 'Guided lesson mapping: conduccion/alertness (Empiezas a sentir sueño conduciendo -> Buscar un lugar seguro para detenerme y descansar).',
        },
        {
          courseId: 'conduccion',
          questionId: 'vum-conduccion-003',
          country: 'GB',
          note: 'Bank mapping: conduccion/vum-conduccion-003 (GB: sueño al conducir -> Parar en un lugar seguro para descansar).',
        },
      ],
    },
    {
      conceptId: 'ciberseguridad-recoverable-backups',
      courseId: 'ciberseguridad',
      avatarId: 'ciberseguridad',
      avatarArt: COURSE_AVATAR_ART.ciberseguridad,
      country: null,
      status: 'draft',
      durationSeconds: 31,
      locales: ['es', 'en'],
      video: { src: null, poster: null, captions: { es: null, en: null } },
      title: [
        'Copias de seguridad recuperables, pruebas de restauración y recuperación ante desastres',
        'Recoverable backups, restoration testing, and disaster recovery',
      ],
      context: [
        'Guardar archivos en un único portátil te deja expuesto ante averías, robo o ransomware. La resiliencia real exige crear copias de seguridad independientes, verificar periódicamente que funcionan mediante una prueba de restauración y contar con planes de recuperación ante desastres («disaster recovery») para restablecer los sistemas tras una interrupción.',
        'Keeping files on a single laptop leaves you exposed to hardware failure, theft, or ransomware. Real resilience requires independent backups, verifying them with regular restoration tests, and maintaining disaster recovery plans to restore technology systems after a disruption.',
      ],
      visualExample: {
        kind: 'recoverable-backups-dr',
        badge: ['Resiliencia · Copias y Recuperación (NIST)', 'Resilience · Backups & Disaster Recovery (NIST)'],
        heading: ['Copia independiente + Prueba de restauración + Recuperación ante desastres', 'Independent copy + Restoration test + Disaster recovery'],
        primary: [
          'Una copia nunca probada puede fallar al necesitarla → Realiza pruebas de restauración («restoration test»).',
          'An untested backup can fail in an emergency → Perform a restoration test to verify recovery.',
        ],
        secondary: [
          'En gobernanza tecnológica, la «recuperación ante desastres» («disaster recovery») se centra en restaurar sistemas y capacidades tras una interrupción.',
          'In IT governance, "disaster recovery" focuses on restoring affected systems and capabilities after a disruption.',
        ],
        callout: [
          'Regla de oro: copia separada del equipo principal + acceso protegido + restauración comprobada.',
          'Golden rule: separate backup copy + protected access + tested restoration.',
        ],
        steps: [
          ['1. Copia independiente', '1. Independent backup', 'Fuera del único dispositivo expuesto y con acceso protegido'],
          ['2. Prueba de restauración', '2. Restoration test', 'Restaurar comprueba que los datos son realmente recuperables'],
          ['3. Recuperación (DR)', '3. Disaster recovery', 'Restablece sistemas y servicios tecnológicos tras una caída'],
        ],
      },
      practice: {
        prompt: [
          '¿Qué evita confiar a ciegas en una copia de seguridad nunca probada y qué disciplina restaura sistemas tras una interrupción?',
          'What prevents blind trust in an untested backup, and what discipline restores systems after a disruption?',
        ],
        takeaway: [
          'Realizar una prueba de restauración valida la copia; la recuperación ante desastres restaura los sistemas afectados.',
          'Performing a restoration test validates the backup; disaster recovery restores affected systems.',
        ],
      },
      feedback: [
        'Crea copias independientes, valida su integridad con pruebas de restauración y asocia la restauración de sistemas tras incidentes con la recuperación ante desastres.',
        'Keep independent backups, validate them with restoration tests, and link post-outage system restoration to disaster recovery.',
      ],
      transcript: [
        {
          at: '00:00',
          speaker: 'BritJoy',
          text: [
            'Si tu único archivo vive en un portátil y el disco falla o sufre un ataque, sin copia independiente lo pierdes todo.',
            'If your only copy of a file lives on one laptop and the drive fails or is attacked, without an independent backup it is gone.',
          ],
        },
        {
          at: '00:10',
          speaker: 'BritJoy',
          text: [
            'Pero hacer copia no basta: solo realizar una prueba de restauración demuestra que los datos pueden recuperarse de verdad cuando hagan falta.',
            'Yet copying files is not enough: only performing a restoration test proves the data can genuinely be recovered when needed.',
          ],
        },
        {
          at: '00:21',
          speaker: 'BritJoy',
          text: [
            'A escala organizativa, esta capacidad de restaurar sistemas tras una interrupción se denomina recuperación ante desastres.',
            'At an organisational level, restoring technology systems after a disruption is the focus of disaster recovery.',
          ],
        },
      ],
      captions: [
        { start: 0, end: 10, text: ['Evita depender de un solo dispositivo: crea copia independiente.', 'Avoid single-device risk: create an independent backup.'] },
        { start: 10, end: 21, text: ['Prueba de restauración = verifica que los datos se recuperan.', 'Restoration test = proves backup data can actually be recovered.'] },
        { start: 21, end: 31, text: ['Recuperación ante desastres = restaurar sistemas tras interrupción.', 'Disaster recovery = restoring systems after a disruption.'] },
      ],
      sources: [
        PEDAGOGICAL_REFERENCE,
        {
          title: 'UK NCSC & NIST CSRC — Offline backups, restoration testing, and contingency / disaster recovery',
          url: 'https://www.ncsc.gov.uk/collection/small-business-guide/backing-your-data',
          kind: 'official',
        },
      ],
      mappings: [
        {
          courseId: 'ciberseguridad',
          lessonId: 'backup',
          questionId: 'backup',
          note: 'Guided lesson mapping: ciberseguridad/backup (Crear una copia independiente y probar la restauración).',
        },
        {
          courseId: 'ciberseguridad',
          questionId: 'vum-ciberseguridad-039',
          note: 'Bank mapping: ciberseguridad/vum-ciberseguridad-039 (¿Qué evita confiar en una copia nunca probada? -> Realizar una prueba de restauración).',
        },
        {
          courseId: 'ciberseguridad',
          questionId: 'vum-ciberseguridad-012',
          note: 'Bank mapping: ciberseguridad/vum-ciberseguridad-012 (¿Qué se centra en restaurar sistemas tras una interrupción? -> Recuperación ante desastres).',
        },
      ],
    },
    {
      conceptId: 'electricidad-series-resistance-sum',
      courseId: 'electricidad',
      avatarId: 'electricidad',
      avatarArt: COURSE_AVATAR_ART.electricidad,
      country: null,
      status: 'draft',
      durationSeconds: 29,
      locales: ['es', 'en'],
      video: { src: null, poster: null, captions: { es: null, en: null } },
      title: [
        'Resistencias en serie: un solo camino y suma directa (R_total = R1 + R2)',
        'Resistors in series: a single current path and direct sum (R_total = R1 + R2)',
      ],
      context: [
        'Cuando dos o más resistencias se conectan una detrás de otra en un único camino sin ramificaciones intermedias, están en serie: la misma corriente atraviesa cada componente y la oposición total al paso de corriente es la suma directa de sus resistencias.',
        'When two or more resistors are connected end-to-end along a single unbranched path, they are in series: the exact same current flows through each component, and total resistance equals the direct sum of the individual resistances.',
      ],
      visualExample: {
        kind: 'series-resistors-sum',
        badge: ['Circuitos CC · Asociación en serie', 'DC Circuits · Series Connection'],
        heading: ['Un solo camino → R_total = R1 + R2', 'Single current path → R_total = R1 + R2'],
        primary: [
          'En serie las resistencias se suman: si R1 = 2 Ω y R2 = 3 Ω → R_total = 2 Ω + 3 Ω = 5 Ω.',
          'In series, resistances add directly: if R1 = 2 Ω and R2 = 3 Ω → R_total = 2 Ω + 3 Ω = 5 Ω.',
        ],
        secondary: [
          'La corriente (I) es idéntica en ambas resistencias porque solo existe un recorrido entre los extremos.',
          'The current (I) is identical through both resistors because there is only one path from start to finish.',
        ],
        callout: [
          'Comprobación rápida: en serie, la resistencia equivalente siempre es mayor que cualquiera de las resistencias individuales.',
          'Quick check: in a series circuit, total resistance is always greater than the largest individual resistor.',
        ],
        steps: [
          ['Conexión en serie', 'Series path', 'Un único camino continuo: la misma corriente pasa por R1 y R2'],
          ['Fórmula directa', 'Direct formula', 'R_total = R1 + R2 (las resistencias se suman)'],
          ['Ejemplo numérico', 'Worked example', '2 Ω + 3 Ω = 5 Ω'],
        ],
      },
      practice: {
        prompt: [
          'Si conectas dos resistencias ideales de 2 Ω y 3 Ω en serie, ¿qué ocurre con sus valores y cuál es la resistencia total?',
          'If you connect two ideal 2 Ω and 3 Ω resistors in series, how do they combine and what is the total resistance?',
        ],
        takeaway: [
          'En serie las resistencias se suman: 2 Ω + 3 Ω = 5 Ω.',
          'Series resistances add together: 2 Ω + 3 Ω = 5 Ω.',
        ],
      },
      feedback: [
        'Siempre que dos resistencias estén en serie (un único camino), suma sus valores en ohmios: R_total = R1 + R2.',
        'Whenever resistors are connected in series along a single path, add their ohm values directly: R_total = R1 + R2.',
      ],
      transcript: [
        {
          at: '00:00',
          speaker: 'BritJoy',
          text: [
            'En un circuito en serie solo existe un camino para los electrones, así que la misma corriente atraviesa una resistencia tras otra.',
            'In a series circuit there is only one path for charge, so the exact same current flows through one resistor after another.',
          ],
        },
        {
          at: '00:10',
          speaker: 'BritJoy',
          text: [
            'Como el paso se dificulta en cada tramo consecutivo, las resistencias en serie se suman directamente: R total es igual a R1 más R2.',
            'Because each consecutive resistor adds opposition along that single path, series resistances add directly: R total equals R1 plus R2.',
          ],
        },
        {
          at: '00:20',
          speaker: 'BritJoy',
          text: [
            'Por ejemplo, con una resistencia de 2 ohmios y otra de 3 ohmios en serie, la resistencia equivalente total es 5 ohmios.',
            'For example, with a 2-ohm resistor and a 3-ohm resistor in series, the total equivalent resistance is 5 ohms.',
          ],
        },
      ],
      captions: [
        { start: 0, end: 10, text: ['En serie hay un único camino: pasa la misma corriente.', 'In series there is a single path: the same current flows through all.'] },
        { start: 10, end: 20, text: ['Las resistencias en serie se suman: R_total = R1 + R2.', 'Series resistances add together: R_total = R1 + R2.'] },
        { start: 20, end: 29, text: ['Ejemplo exacto: 2 Ω + 3 Ω = 5 Ω.', 'Exact example: 2 Ω + 3 Ω = 5 Ω.'] },
      ],
      sources: [
        PEDAGOGICAL_REFERENCE,
        {
          title: 'IEC 60050 (Electropedia) — Series connection & equivalent resistance of two-terminal elements',
          url: 'https://www.electropedia.org/',
          kind: 'technical',
        },
      ],
      mappings: [
        {
          courseId: 'electricidad',
          lessonId: 'series',
          questionId: 'series',
          note: 'Guided lesson mapping: electricidad/series (En nuestro modelo, dos resistencias en serie… -> Se suman).',
        },
        {
          courseId: 'electricidad',
          questionId: 'vum-electricidad-008',
          note: 'Bank mapping: electricidad/vum-electricidad-008 (Dos resistencias ideales de 2 Ω y 3 Ω están en serie. ¿Total? -> 5 Ω).',
        },
      ],
    },
  ]),
});

// Courses whose units are written for one jurisdiction. When the caller gives no country (a guided
// lesson does not), national content from ANOTHER country is not offered by default: a Colombian
// rain-margins video must not appear in a British driving unit. An explicit country (e.g. a bank question
// tagged CO) still selects that country's content, and content without a country is unaffected.
export const COURSE_DEFAULT_COUNTRY = Object.freeze({ conduccion: 'GB', britjoy: 'GB' });

function countryMatches(mappingCountry, conceptCountry, queryCountry, courseId = '') {
  const requiredCountry =
    (typeof mappingCountry === 'string' && mappingCountry.trim() ? mappingCountry.trim().toUpperCase() : null) ||
    (typeof conceptCountry === 'string' && conceptCountry.trim() ? conceptCountry.trim().toUpperCase() : null);
  const qCountry =
    (typeof queryCountry === 'string' && queryCountry.trim() ? queryCountry.trim().toUpperCase() : null) ||
    COURSE_DEFAULT_COUNTRY[courseId] ||
    null;
  if (requiredCountry && qCountry) return requiredCountry === qCountry;
  return true;
}

export function resolveQuestionVideoHelp(query = {}, manifest = QUESTION_VIDEO_MANIFEST) {
  if (!query || typeof query !== 'object' || !manifest?.concepts) return null;
  const effectiveCourseId = inferCourseIdFromLesson(query);
  const qId = typeof query.questionId === 'string' && query.questionId.trim() ? query.questionId.trim() : null;
  const lId = typeof query.lessonId === 'string' && query.lessonId.trim() ? query.lessonId.trim() : null;
  if (!qId && !lId) return null;

  const locale = query.locale || 'es';
  const baseUrl = query.baseUrl || './';

  let matchedConcept = null;
  let matchedMapping = null;
  let matchedBy = null;

  // First pass: exact questionId match within the course.
  if (qId) {
    for (const concept of manifest.concepts) {
      if (concept.courseId !== effectiveCourseId) continue;
      for (const mapping of concept.mappings || []) {
        if (
          mapping.courseId === effectiveCourseId &&
          mapping.questionId === qId &&
          countryMatches(mapping.country, concept.country, query.country, effectiveCourseId)
        ) {
          matchedConcept = concept;
          matchedMapping = mapping;
          matchedBy = 'questionId';
          break;
        }
      }
      if (matchedConcept) break;
    }
  }

  // Second pass: explicit lessonId match when no questionId matched.
  if (!matchedConcept && lId && !qId) {
    for (const concept of manifest.concepts) {
      if (concept.courseId !== effectiveCourseId) continue;
      for (const mapping of concept.mappings || []) {
        if (
          mapping.courseId === effectiveCourseId &&
          mapping.lessonId === lId &&
          countryMatches(mapping.country, concept.country, query.country, effectiveCourseId)
        ) {
          matchedConcept = concept;
          matchedMapping = mapping;
          matchedBy = 'lessonId';
          break;
        }
      }
      if (matchedConcept) break;
    }
  }

  if (!matchedConcept) return null;

  const playable = isConceptPlayable(matchedConcept);
  const rawCaptions = matchedConcept.video?.captions || {};
  const captionPath = rawCaptions[String(locale).split('-')[0]] || rawCaptions.es || rawCaptions.en || null;

  return {
    schemaVersion: manifest.schemaVersion,
    conceptId: matchedConcept.conceptId,
    courseId: matchedConcept.courseId,
    avatarId: matchedConcept.avatarId,
    avatarArt: matchedConcept.avatarArt,
    avatarUrl: resolveRelativeMediaUrl(matchedConcept.avatarArt, baseUrl),
    country: matchedConcept.country || matchedMapping?.country || null,
    status: matchedConcept.status,
    playable,
    durationSeconds: matchedConcept.durationSeconds,
    matchedBy,
    mapping: matchedMapping,
    title: localizePair(locale, matchedConcept.title),
    context: localizePair(locale, matchedConcept.context),
    visualExample: {
      kind: matchedConcept.visualExample.kind,
      badge: localizePair(locale, matchedConcept.visualExample.badge),
      heading: localizePair(locale, matchedConcept.visualExample.heading),
      primary: localizePair(locale, matchedConcept.visualExample.primary),
      secondary: localizePair(locale, matchedConcept.visualExample.secondary),
      callout: localizePair(locale, matchedConcept.visualExample.callout),
      steps: (matchedConcept.visualExample.steps || []).map(([esStep, enStep, detail]) => ({
        label: localizePair(locale, [esStep, enStep]),
        detail,
      })),
    },
    practice: {
      prompt: localizePair(locale, matchedConcept.practice.prompt),
      takeaway: localizePair(locale, matchedConcept.practice.takeaway),
    },
    feedback: localizePair(locale, matchedConcept.feedback),
    transcript: (matchedConcept.transcript || []).map((line) => ({
      at: line.at,
      speaker: line.speaker,
      text: localizePair(locale, line.text),
    })),
    captions: (matchedConcept.captions || []).map((cue) => ({
      start: cue.start,
      end: cue.end,
      text: localizePair(locale, cue.text),
    })),
    sources: (matchedConcept.sources || []).map((src) => ({ ...src })),
    video: playable
      ? {
          src: resolveRelativeMediaUrl(matchedConcept.video.src, baseUrl),
          poster: isValidRelativeMediaPath(matchedConcept.video?.poster)
            ? resolveRelativeMediaUrl(matchedConcept.video.poster, baseUrl)
            : null,
          captionsUrl: isValidRelativeMediaPath(captionPath)
            ? resolveRelativeMediaUrl(captionPath, baseUrl)
            : null,
        }
      : null,
  };
}

export function getManifestCoverage(manifest = QUESTION_VIDEO_MANIFEST) {
  const byStatus = { draft: 0, review: 0, ready: 0 };
  const byCourse = {};
  for (const concept of manifest?.concepts || []) {
    if (concept.status in byStatus) byStatus[concept.status] += 1;
    const prev = byCourse[concept.courseId];
    const questionIds = new Set(prev?.questionIds || []);
    const lessonIds = new Set(prev?.lessonIds || []);
    for (const m of concept.mappings || []) {
      if (m.questionId) questionIds.add(m.questionId);
      if (m.lessonId) lessonIds.add(m.lessonId);
    }
    const conceptIds = [...(prev?.conceptIds || []), concept.conceptId];
    byCourse[concept.courseId] = {
      conceptId: prev?.conceptId || concept.conceptId,
      conceptIds,
      totalConcepts: conceptIds.length,
      status: prev?.status === 'ready' || concept.status === 'ready'
        ? 'ready'
        : prev?.status === 'review' || concept.status === 'review'
          ? 'review'
          : concept.status,
      playable: Boolean(prev?.playable || isConceptPlayable(concept)),
      avatarId: concept.avatarId,
      country: prev?.country ?? concept.country,
      questionIds: [...questionIds],
      lessonIds: [...lessonIds],
      totalMappings: (prev?.totalMappings || 0) + (concept.mappings || []).length,
    };
  }
  return {
    schemaVersion: manifest?.schemaVersion || QUESTION_VIDEO_SCHEMA_VERSION,
    updatedAt: manifest?.updatedAt || QUESTION_VIDEO_UPDATED_AT,
    totalConcepts: (manifest?.concepts || []).length,
    playableConcepts: (manifest?.concepts || []).filter(isConceptPlayable).length,
    byStatus,
    byCourse,
  };
}

let instanceCounter = 0;

// Framework-agnostic DOM builder compatible with real browsers, Capacitor webviews,
// React container refs, and Node minimal DOM test doubles (Element / FakeElement).
export function mountQuestionVideoHelp({
  el: customEl,
  button: customButton,
  courseId = '',
  questionId = '',
  lessonId = '',
  country = '',
  locale = 'es',
  baseUrl = './',
  track = '',
  targetLanguage = '',
  triggerMode = 'explanation',
  manifest = QUESTION_VIDEO_MANIFEST,
  onStopAudio = null,
} = {}) {
  const makeEl =
    customEl ||
    ((tag, cls, text) => {
      const node = document.createElement(tag);
      if (cls) node.className = cls;
      if (text !== undefined) node.textContent = text;
      return node;
    });
  const makeButton =
    customButton ||
    ((text, cls, fn) => {
      const btn = makeEl('button', cls, text);
      btn.type = 'button';
      btn.addEventListener('click', fn);
      return btn;
    });

  instanceCounter += 1;
  const panelId = `qvh-panel-${instanceCounter}`;
  const titleId = `qvh-title-${instanceCounter}`;

  const root = makeEl('section', 'qvh-root');
  const triggerBar = makeEl('div', 'qvh-trigger-bar');
  const triggerBtn = makeButton('', 'journey-chip qvh-trigger', () => {
    if (state.isOpen) close({ restoreFocus: true });
    else open();
  });
  triggerBtn.setAttribute('aria-expanded', 'false');
  triggerBtn.setAttribute('aria-controls', panelId);

  const panel = makeEl('div', 'qvh-panel');
  panel.id = panelId;
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-labelledby', titleId);
  panel.hidden = true;

  triggerBar.append(triggerBtn);
  root.append(triggerBar, panel);

  let state = {
    courseId,
    questionId,
    lessonId,
    country,
    locale,
    baseUrl,
    track,
    targetLanguage,
    triggerMode,
    isOpen: false,
    isPlaying: false,
    videoFailed: false,
    resolved: null,
  };

  let activeVideoEl = null;
  let activePlayBtn = null;
  let activeCaptionBox = null;

  function syncPlayButton() {
    if (!activePlayBtn) return;
    const playing = Boolean(state.isPlaying);
    activePlayBtn.textContent = (playing ? '❚❚ ' : '▶ ') + uiCopy(state.locale, playing ? 'pauseVideo' : 'playVideo');
    activePlayBtn.setAttribute('aria-pressed', String(playing));
  }

  function stop() {
    state.isPlaying = false;
    if (activeVideoEl) {
      try {
        activeVideoEl.pause?.();
      } catch {}
      try {
        activeVideoEl.currentTime = 0;
      } catch {}
    }
    syncPlayButton();
  }

  function close({ restoreFocus = false } = {}) {
    stop();
    if (!state.isOpen && panel.hidden) return;
    state.isOpen = false;
    panel.hidden = true;
    triggerBtn.setAttribute('aria-expanded', 'false');
    if (restoreFocus) {
      try {
        triggerBtn.focus?.({ preventScroll: true });
      } catch {}
    }
  }

  function open() {
    if (!state.resolved) return;
    try {
      onStopAudio?.();
    } catch {}
    state.isOpen = true;
    panel.hidden = false;
    triggerBtn.setAttribute('aria-expanded', 'true');
    renderPanelContent();
  }

  function renderVisualDiagram(visualExample) {
    const box = makeEl('div', `qvh-diagram qvh-diagram-${visualExample.kind}`);
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', visualExample.heading);

    const badge = makeEl('span', 'qvh-diagram-badge', visualExample.badge);
    const stepsWrap = makeEl('div', 'qvh-diagram-steps');
    for (const step of visualExample.steps || []) {
      const stepCard = makeEl('div', 'qvh-diagram-step');
      stepCard.append(
        makeEl('strong', 'qvh-diagram-step-label', step.label),
        makeEl('span', 'qvh-diagram-step-detail', step.detail)
      );
      stepsWrap.append(stepCard);
    }
    box.append(badge, stepsWrap);
    return box;
  }

  function renderPanelContent() {
    // Pause the old node before replacing it, including a refresh of the same question.
    stop();
    activeVideoEl = null;
    activePlayBtn = null;
    activeCaptionBox = null;

    const resolved = state.resolved;
    if (!resolved) {
      panel.replaceChildren();
      return;
    }

    const header = makeEl('div', 'qvh-header');
    const titleWrap = makeEl('div', 'qvh-header-copy');
    const badge = makeEl('span', 'qvh-badge', uiCopy(state.locale, 'badgeMicro'));
    const heading = makeEl('h4', 'qvh-title', resolved.title);
    heading.id = titleId;
    titleWrap.append(badge, heading);

    const closeBtn = makeButton('✕ ' + uiCopy(state.locale, 'closePanel'), 'journey-chip qvh-close', () => {
      close({ restoreFocus: true });
    });
    header.append(titleWrap, closeBtn);

    const nodes = [header];

    const isOffline = Boolean(globalThis.navigator && globalThis.navigator.onLine === false);
    const canShowVideo = resolved.playable && resolved.video?.src && !state.videoFailed && !isOffline;

    if (canShowVideo) {
      const playerBox = makeEl('div', 'qvh-player');
      const video = makeEl('video', 'qvh-video');
      video.src = resolved.video.src;
      video.preload = 'metadata';
      video.controls = true;
      video.playsInline = true;
      video.autoplay = false;
      video.setAttribute('preload', 'metadata');
      video.setAttribute('playsinline', '');
      video.setAttribute('aria-label', resolved.title);
      if (resolved.video.poster) {
        video.poster = resolved.video.poster;
        video.setAttribute('poster', resolved.video.poster);
      }
      if (resolved.video.captionsUrl) {
        const trackNode = makeEl('track');
        trackNode.setAttribute('kind', 'captions');
        trackNode.setAttribute('src', resolved.video.captionsUrl);
        trackNode.setAttribute('srclang', String(state.locale || 'es').split('-')[0]);
        trackNode.setAttribute('default', '');
        video.append(trackNode);
      }

      const captionLive = makeEl('p', 'qvh-caption-live', resolved.captions?.[0]?.text || '');
      captionLive.setAttribute('aria-live', 'polite');

      const playToggle = makeButton('', 'journey-secondary qvh-play-toggle', () => {
        if (!activeVideoEl) return;
        if (state.isPlaying) {
          stop();
        } else {
          try {
            onStopAudio?.();
          } catch {}
          state.isPlaying = true;
          syncPlayButton();
          try {
            const maybePromise = activeVideoEl.play?.();
            if (maybePromise && typeof maybePromise.catch === 'function') {
              maybePromise.catch(() => {
                state.isPlaying = false;
                state.videoFailed = true;
                renderPanelContent();
              });
            }
          } catch {
            state.isPlaying = false;
            state.videoFailed = true;
            renderPanelContent();
          }
        }
      });

      video.addEventListener('play', () => {
        try {
          onStopAudio?.();
        } catch {}
        state.isPlaying = true;
        syncPlayButton();
      });
      video.addEventListener('pause', () => {
        state.isPlaying = false;
        syncPlayButton();
      });
      video.addEventListener('ended', () => {
        state.isPlaying = false;
        syncPlayButton();
      });
      video.addEventListener('timeupdate', () => {
        const t = Number(video.currentTime || 0);
        const cue = (resolved.captions || []).find((c) => t >= c.start && t <= c.end);
        if (cue && activeCaptionBox) activeCaptionBox.textContent = cue.text;
      });
      video.addEventListener('error', () => {
        stop();
        state.videoFailed = true;
        renderPanelContent();
      });

      activeVideoEl = video;
      activePlayBtn = playToggle;
      activeCaptionBox = captionLive;
      syncPlayButton();

      const controlsBar = makeEl('div', 'qvh-player-controls');
      controlsBar.append(playToggle);
      playerBox.append(video, controlsBar, captionLive);
      nodes.push(playerBox);
    } else if (resolved.playable && (state.videoFailed || isOffline)) {
      const fallbackNote = makeEl('p', 'qvh-fallback-note', uiCopy(state.locale, 'videoFallbackNote'));
      fallbackNote.setAttribute('role', 'status');
      nodes.push(fallbackNote);
    } else {
      const pendingNote = makeEl('p', 'qvh-editorial-note', uiCopy(state.locale, 'statusPendingNote'));
      pendingNote.setAttribute(' data-qvh-editorial-state'.trim(), resolved.status);
      nodes.push(pendingNote);
    }

    // 1. Context
    const contextSection = makeEl('div', 'qvh-block qvh-context');
    contextSection.append(
      makeEl('h5', 'qvh-block-title', uiCopy(state.locale, 'contextHeading')),
      makeEl('p', 'qvh-context-text', resolved.context)
    );
    nodes.push(contextSection);

    // 2. Visual Example
    const visualSection = makeEl('div', 'qvh-block qvh-visual-card');
    visualSection.append(
      makeEl('h5', 'qvh-block-title', uiCopy(state.locale, 'visualHeading')),
      renderVisualDiagram(resolved.visualExample),
      makeEl('p', 'qvh-visual-primary', resolved.visualExample.primary),
      makeEl('p', 'qvh-visual-secondary', resolved.visualExample.secondary),
      makeEl('p', 'qvh-visual-callout', resolved.visualExample.callout)
    );
    nodes.push(visualSection);

    // 3. Practice & 4. Feedback
    const practiceSection = makeEl('div', 'qvh-block qvh-practice');
    practiceSection.append(
      makeEl('h5', 'qvh-block-title', uiCopy(state.locale, 'practiceHeading')),
      makeEl('p', 'qvh-practice-prompt', resolved.practice.prompt),
      makeEl('p', 'qvh-practice-takeaway', resolved.practice.takeaway),
      makeEl('h5', 'qvh-block-title', uiCopy(state.locale, 'feedbackHeading')),
      makeEl('p', 'qvh-feedback-text', resolved.feedback)
    );
    nodes.push(practiceSection);

    // 5. Transcript
    const transcriptDetails = makeEl('details', 'qvh-transcript');
    transcriptDetails.open = true;
    const transcriptSummary = makeEl('summary', 'qvh-transcript-summary', uiCopy(state.locale, 'transcriptHeading'));
    const transcriptList = makeEl('ol', 'qvh-transcript-list');
    for (const entry of resolved.transcript || []) {
      const item = makeEl('li', 'qvh-transcript-line');
      item.append(
        makeEl('span', 'qvh-transcript-time', `[${entry.at}] `),
        makeEl('strong', 'qvh-transcript-speaker', `${entry.speaker}: `),
        makeEl('span', 'qvh-transcript-text', entry.text)
      );
      transcriptList.append(item);
    }
    transcriptDetails.append(transcriptSummary, transcriptList);
    nodes.push(transcriptDetails);

    // 6. Verified Sources
    if (resolved.sources?.length) {
      const sourcesBox = makeEl('div', 'qvh-sources');
      sourcesBox.append(makeEl('h5', 'qvh-block-title', uiCopy(state.locale, 'sourcesHeading')));
      const sourcesList = makeEl('ul', 'qvh-sources-list');
      for (const src of resolved.sources) {
        const li = makeEl('li', 'qvh-source-item');
        const link = makeEl('a', 'qvh-source-link', `${src.title} ↗`);
        link.href = src.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        li.append(link);
        sourcesList.append(li);
      }
      sourcesBox.append(sourcesList);
      nodes.push(sourcesBox);
    }

    const footerNote = makeEl('p', 'qvh-no-score-note', uiCopy(state.locale, 'noScoreNotice'));
    nodes.push(footerNote);

    panel.replaceChildren(...nodes);
  }

  function syncResolved() {
    const resolved = resolveQuestionVideoHelp(
      {
        courseId: state.courseId,
        questionId: state.questionId,
        lessonId: state.lessonId,
        country: state.country,
        locale: state.locale,
        baseUrl: state.baseUrl,
        track: state.track,
        targetLanguage: state.targetLanguage,
      },
      manifest
    );
    state.resolved = resolved;

    if (!resolved) {
      close();
      root.hidden = true;
      root.setAttribute('data-qvh-course', '');
      root.setAttribute('data-qvh-concept', '');
      root.setAttribute('data-qvh-status', '');
      return;
    }

    root.hidden = false;
    root.setAttribute('data-qvh-course', resolved.courseId);
    root.setAttribute('data-qvh-concept', resolved.conceptId);
    root.setAttribute('data-qvh-status', resolved.status);
    root.setAttribute('data-qvh-playable', String(resolved.playable));

    const labelKey = state.triggerMode === 'example' ? 'openExample' : 'openExplain';
    triggerBtn.textContent = '🎬 ' + uiCopy(state.locale, labelKey);
    if (state.isOpen) renderPanelContent();
  }

  function update(next = {}) {
    const identityChanged =
      (next.courseId !== undefined && next.courseId !== state.courseId) ||
      (next.questionId !== undefined && next.questionId !== state.questionId) ||
      (next.lessonId !== undefined && next.lessonId !== state.lessonId) ||
      (next.country !== undefined && next.country !== state.country) ||
      (next.locale !== undefined && next.locale !== state.locale);

    if (identityChanged) {
      close();
      state.videoFailed = false;
    }

    state = {
      ...state,
      ...next,
    };
    syncResolved();
  }

  panel.addEventListener?.('keydown', (event) => {
    if (event?.key === 'Escape') {
      event.stopPropagation?.();
      close({ restoreFocus: true });
    }
  });

  const onVisibilityChange = () => {
    if (globalThis.document?.visibilityState === 'hidden') {
      stop();
    }
  };
  const onPageHide = () => {
    stop();
  };

  globalThis.document?.addEventListener?.('visibilitychange', onVisibilityChange);
  globalThis.window?.addEventListener?.('pagehide', onPageHide);

  function destroy() {
    close();
    globalThis.document?.removeEventListener?.('visibilitychange', onVisibilityChange);
    globalThis.window?.removeEventListener?.('pagehide', onPageHide);
  }

  syncResolved();

  return {
    element: root,
    triggerButton: triggerBtn,
    panelElement: panel,
    open,
    close,
    stop,
    update,
    destroy,
    getState: () => ({ ...state, isPlaying: Boolean(state.isPlaying), isOpen: Boolean(state.isOpen) }),
  };
}
