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
      status: 'draft',
      durationSeconds: 34,
      locales: ['es', 'en'],
      video: {
        src: null,
        poster: null,
        captions: { es: null, en: null },
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
  ]),
});

// Existing UK-specific courses keep their remit when no explicit country is selected.
// The explanation language and the avatar do not select a jurisdiction.
const DEFAULT_CONTENT_COUNTRY = Object.freeze({conduccion: 'GB', britjoy: 'GB'});

function countryMatches(mappingCountry, conceptCountry, queryCountry, courseId = '') {
  const requiredCountry =
    (typeof mappingCountry === 'string' && mappingCountry.trim() ? mappingCountry.trim().toUpperCase() : null) ||
    (typeof conceptCountry === 'string' && conceptCountry.trim() ? conceptCountry.trim().toUpperCase() : null);
  const qCountry = (typeof queryCountry === 'string' && queryCountry.trim() ? queryCountry.trim().toUpperCase() : null)
    || DEFAULT_CONTENT_COUNTRY[courseId] || null;
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
    const questionIds = new Set();
    const lessonIds = new Set();
    for (const m of concept.mappings || []) {
      if (m.questionId) questionIds.add(m.questionId);
      if (m.lessonId) lessonIds.add(m.lessonId);
    }
    byCourse[concept.courseId] = {
      conceptId: concept.conceptId,
      status: concept.status,
      playable: isConceptPlayable(concept),
      avatarId: concept.avatarId,
      country: concept.country,
      questionIds: [...questionIds],
      lessonIds: [...lessonIds],
      totalMappings: (concept.mappings || []).length,
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
