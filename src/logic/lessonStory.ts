import type { Exercise, Lesson } from '../types';

export interface LessonStory {
  scene: string;
  prediction: string;
  transfer: string;
}

/** Original mini-scenes. The humour introduces a problem; the lesson supplies the evidence. */
const pilots: Record<string, LessonStory> = {
  'a1-u1-l1': {
    scene: 'Jorge entra en la cafetería y saluda: «Goodbye!». Britjoy mira su café: «Acabas de llegar y ya te vas. Ese sí que es un turno corto».',
    prediction: '¿Qué crees que ha salido mal en el saludo de Jorge?',
    transfer: 'Imagina que llegas mañana a una tienda. ¿Cómo saludarías y cómo te despedirías al salir?',
  },
  'ia-01-patterns': {
    scene: 'Una flor entra en el laboratorio: «¿Me vais a clasificar o a leer el horóscopo?». Britjoy cierra la revista: «Vale. Empecemos por las medidas».',
    prediction: '¿Qué información crees que ayudaría a distinguir dos especies de flores?',
    transfer: 'Piensa en una flor que aún no has visto. ¿Qué medirías y cómo comprobarías tu clasificación?',
  },
  'ia-02-train': {
    scene: 'Parlanchín gira dos ruedas al azar: «¡Ya aprendí!». Britjoy señala la tabla de errores: «Has acertado menos que una moneda. Toca ajustar con ejemplos».',
    prediction: '¿Qué cambia dentro de un modelo pequeño cuando entrena con ejemplos etiquetados?',
    transfer: 'Si tu clasificador falla siempre con los casos grandes, ¿qué revisarías antes de darlo por bueno?',
  },
  'ia-03-neuron': {
    scene: 'Parlanchín presume: «Tengo intuición cósmica». Britjoy levanta la tapa: «Tienes dos multiplicaciones y una suma. Y aun así te has llevado una coma».',
    prediction: '¿Cómo puede una regla numérica sencilla combinar varias medidas para tomar una decisión?',
    transfer: 'Imagina valorar un piso por distancia al metro y precio. ¿Qué peso te importaría más y por qué?',
  },
  'ia-04-validation': {
    scene: 'El modelo saca un diez repitiendo las mismas cinco preguntas de ayer. Britjoy cambia una cifra: «Sorpresa: examen con datos nuevos».',
    prediction: '¿Por qué memorizar los ejemplos de práctica no demuestra que un sistema funcione fuera del aula?',
    transfer: 'Antes de fiarte de una herramienta en casos reales, ¿cómo reservarías ejemplos nuevos para ponerla a prueba?',
  },
  'ia-05-bias': {
    scene: 'El clasificador jura que los gatos naranjas no existen porque nunca vio uno en su carpeta. Britjoy suspira: «Tu mundo cabe en tres fotos mal elegidas».',
    prediction: '¿Qué ocurre cuando un grupo real apenas aparece en los datos de entrenamiento?',
    transfer: 'Si una app de voz entiende peor tu acento que otro, ¿qué fallo de datos sospecharías y cómo lo comprobarías?',
  },
  'ia-06-language': {
    scene: 'El generador entrega una frase impecable. Britjoy pregunta por la fuente. «Tengo una coma preciosa», contesta. Britjoy: «La coma no cuenta como testigo».',
    prediction: '¿Una frase que suena convincente basta para saber que es cierta? Explica tu primera intuición.',
    transfer: 'Una IA te da un horario con mucha seguridad. ¿Qué comprobarías antes de hacer el viaje?',
  },
  'ia-07-modo-ia': {
    scene: 'Parlanchín se pone corbata: «Pregúntame de médicos, visados o hipotecas: hoy digo que sí a todo». Britjoy le quita el micrófono: «Tú eres para practicar inglés, no el boletín oficial».',
    prediction: '¿Para qué sirve un tutor conversacional y qué consultas nunca deberías dejar en sus manos?',
    transfer: 'Vas a practicar una entrevista en el Modo IA. ¿Qué harías allí y qué dato comprobarías fuera en la web oficial?',
  },
  'ia-08-tareas': {
    scene: 'Jorge pide: «Hazme el currículum entero, que tengo prisa». Parlanchín teclea feliz: «Te puse tres años de astronauta logístico». Britjoy frena el ratón: «El inglés lo pule la máquina; tu vida laboral la pones tú».',
    prediction: 'Al preparar un documento importante, ¿qué parte puede acelerar la IA y qué parte solo puedes aportar tú?',
    transfer: 'Piensa en una tarea repetitiva de tu semana. ¿Qué borrador encargarías y qué decisión conservarías tú?',
  },
  'ia-09-supervision': {
    scene: 'Parlanchín apunta al botón Enviar: «¡Ni lo leas, quedó finísimo! Dice que dirigiste cuarenta almacenes». Britjoy tapa la pantalla: «Me van a devolver al Excel dice él; pero a la entrevista vas tú».',
    prediction: '¿Qué riesgos corres cuando envías un texto generado sin revisión humana («human in the loop»)?',
    transfer: 'Escribe tu propia lista de tres comprobaciones rápidas antes de mandar un correo o CV asistido por IA.',
  },
  'ia-10-estructura': {
    scene: 'Alguien escribe «arréglame esto» sin más datos. Parlanchín rellena los huecos con fantasía pura. Britjoy saca la libreta: «Si dejas el pedido vacío, la estadística inventa el menú».',
    prediction: '¿Qué piezas necesita una instrucción clara para que el modelo no rellene huecos inventando?',
    transfer: 'Reformula un pedido vago («escríbeme una queja») añadiendo contexto real, formato y una restricción explícita.',
  },
  'ia-11-iteracion': {
    scene: 'El primer borrador ocupa dos páginas y suena a conde del siglo XIX. Britjoy no se rinde: «No cambies de herramienta; dile cuántas líneas quieres y enséñale un ejemplo decente».',
    prediction: 'Si el primer borrador sale largo o acartonado, ¿cómo lograrías afinarlo en una segunda instrucción?',
    transfer: '¿Qué ejemplo breve de estilo propio guardarías a mano para reutilizar cuando pidas resúmenes o correos?',
  },
  'ia-12-privacidad': {
    scene: 'Un vecino va a pegar su carta médica con nombre, dirección y documento en un chat público. Britjoy salta sobre el teclado: «¡Quita los datos primero, alma bendita, que para resumir un párrafo no hace falta tu pasaporte!».',
    prediction: '¿Qué información deberías sustituir por marcadores antes de pegar un documento real en una IA externa?',
    transfer: 'Tienes que resumir un contrato o una carta administrativa de tu país. ¿Qué tres datos borrarías siempre antes de copiar?',
  },
  'ia-13-verificacion': {
    scene: 'Parlanchín recita solemne: «Para trabajar en Manchester pide cita en la EPS y lleva el padrón municipal». Britjoy parpadea: «Acabas de cruzar tres fronteras en media línea sin despeinarte».',
    prediction: '¿Por qué un modelo generativo puede mezclar leyes e instituciones de distintos países con tanta seguridad?',
    transfer: 'Si una respuesta sobre trámites o derechos suena impecable, ¿en qué fuente primaria de tu país la contrastarías?',
  },
  'ia-14-evaluar-herramientas': {
    scene: 'Un anuncio promete «la app definitiva que contesta a tus clientes mientras duermes». Parlanchín ya quiere meter la tarjeta. Britjoy pregunta: «¿Y qué hace con los datos cuando despiertas?».',
    prediction: 'Antes de adoptar una herramienta de IA de moda, ¿qué cuatro cosas comprobarías en pequeño?',
    transfer: 'Elige una herramienta nueva que hayas oído nombrar: ¿con qué cinco casos conocidos la pondrías a prueba primero?',
  },
  'ia-15-mantenerse-al-dia': {
    scene: 'Cada lunes sale «la revolución definitiva» y cada martes cambia de nombre. Britjoy toma té tranquila: «Las marcas pasan; leer la letra pequeña y pedir confirmación antes de pagar no pasa de moda».',
    prediction: 'Cuando una herramienta ofrece ejecutar pagos o envíos por su cuenta, ¿qué límite humano debe mantenerse siempre?',
    transfer: '¿Qué hábito sencillo usarás este año para distinguir una mejora útil del puro bombo publicitario?',
  },
  'a2-u1-l1': {
    scene: 'Jorge cuenta su rutina mezclando ayer, hoy y el siglo pasado en la misma frase. Britjoy apunta en la pizarra: «Para lo que haces cada martes no necesitas viajar en el tiempo».',
    prediction: '¿Qué pistas de una frase en inglés indican que hablas de un hábito diario y no de algo puntual?',
    transfer: 'Cuenta en dos frases tu mañana habitual de trabajo o estudio y comprueba los verbos antes de leerla en voz alta.',
  },
  'b1-u1-l1': {
    scene: 'En una reunión, Jorge suelta «You are wrong!» para dar su opinión. Britjoy carraspea: «En inglés puedes discrepar con firmeza sin lanzar una silla verbal».',
    prediction: '¿Cómo introducirías tu punto de vista en inglés para sonar claro y respetuoso a la vez?',
    transfer: 'Elige un cambio que propondrías en tu barrio o trabajo: expresa tu opinión y comprueba que incluyes una razón concreta.',
  },
  'dia-01-presentaciones': {
    scene: 'La familia García llega a su nueva calle y Jorge ensaya una presentación digna de discurso real. Britjoy sonríe: «El vecino solo quiere saber tu nombre y de qué piso vienes».',
    prediction: 'En tu primer encuentro con un vecino en el Reino Unido, ¿qué tres datos sencillos te ayudarán a romper el hielo?',
    transfer: 'Imagina que te presentas mañana en el colegio o en el trabajo: ¿qué dirías y qué preguntarías para confirmar que os entendisteis?',
  },
  'tur-01-antes-de-viajar': {
    scene: 'Sofía mete el paraguas en la maleta pero deja para el taxi comprobar pasaporte y autorización electrónica (ETA). Britjoy frena el cierre: «El paraguas no pasa el control fronterizo por ti».',
    prediction: 'Antes de volar al Reino Unido, ¿qué documentos y requisitos oficiales debes comprobar con antelación?',
    transfer: 'Prepara tu propia lista previa a un viaje internacional y comprueba en GOV.UK si tu nacionalidad requiere ETA o visado.',
  },
  'uk-vida-l1': {
    scene: 'Un vídeo viral promete «aprobar Life in the UK leyendo cinco trucos secretos». Britjoy abre el manual oficial: «Veinticuatro preguntas, cuarenta y cinco minutos y GOV.UK: cero magia, cien por cien comprobable».',
    prediction: '¿Qué formato real y qué fuente oficial debes consultar antes de preparar o reservar el examen Life in the UK?',
    transfer: 'Explica a un amigo cómo reservar el examen sin caer en webs intermediarias con recargo y qué comprobar en GOV.UK.',
  },
  'uk-salud-l1': {
    scene: 'Jorge espera a tener gripe para averiguar dónde queda su centro de salud británico. Britjoy le tiende la ficha: «Registrarse en el GP se hace con calma, no con termómetro en la boca».',
    prediction: '¿Qué pasos y qué diferencia entre GP, 111 y 999 conviene conocer en el sistema NHS del Reino Unido?',
    transfer: 'Si un familiar recién llegado necesita médico no urgente el fin de semana en el Reino Unido, ¿qué comprobarías en nhs.uk?',
  },
  'uk-conducir-l1': {
    scene: 'Jorge arranca pensando que su carné y las rotondas funcionan igual en todas partes. Britjoy señala la izquierda: «Aquí manda el Highway Code, la DVLA y el MOT: comprueba antes de girar».',
    prediction: '¿Qué documentos y normas británicas debes verificar antes de conducir un coche en el Reino Unido?',
    transfer: 'Revisa el caso de alguien que trae permiso extranjero al Reino Unido: ¿qué comprobarías en GOV.UK y en la DVLA?',
  },
  'es-en-nie': {
    scene: 'En Madrid, Jorge usa «NIE» y «TIE» como si fueran el mismo plástico. Britjoy saca dos carpetas: «Uno es tu número para toda la vida administrativa en España; la otra es la tarjeta física».',
    prediction: 'Al empezar tus trámites en España, ¿por qué importa distinguir el número NIE de la tarjeta TIE y del NIF?',
    transfer: 'Vas a rellenar un formulario en España y a explicarlo en inglés: ¿qué dato revisas en sede electrónica oficial antes de pedir cita?',
  },
  'es-en-padron': {
    scene: 'Jorge se muda a Valencia y deja el empadronamiento «para cuando tenga tiempo». Britjoy señala el ayuntamiento: «Sin padrón municipal, medio mapa de trámites locales ni te abre la puerta».',
    prediction: '¿Para qué sirve empadronarse en tu ayuntamiento en España y qué documentos suelen pedirte?',
    transfer: 'Explica a alguien recién llegado a tu municipio en España cómo comprobar los requisitos del padrón en la web de su ayuntamiento.',
  },
  'co-en-cedula': {
    scene: 'En Bogotá, Jorge guarda el registro civil y la cédula pensando que cualquier carné sirve para todo trámite. Britjoy ordena la carpeta: «En Colombia, la Registraduría no acepta aproximaciones».',
    prediction: '¿Qué papel cumple la cédula frente al registro civil en Colombia y cuándo te exigen cada documento?',
    transfer: 'Si necesitas actualizar o pedir un duplicado de identificación en Colombia, ¿qué comprobarías primero en la Registraduría Nacional?',
  },
  'co-en-tutela': {
    scene: 'Un vecino en Medellín cree que sin abogado caro no puede defender un derecho fundamental urgente. Britjoy abre la Constitución: «En Colombia existe la acción de tutela; conozcamos cuándo procede».',
    prediction: '¿Qué diferencia en Colombia una acción de tutela de un derecho de petición ordinario?',
    transfer: 'Ante una demora urgente de salud en Colombia, explica qué hechos reunirías y qué verificarías en fuentes oficiales antes de presentar el escrito.',
  },
};

const pilotsEn: Record<string, LessonStory> = {
  'es-es-nie': {
    scene: 'In Madrid, Sam treats “NIE” and “TIE” as the exact same card. Britjoy opens two folders: “One is your administrative number in Spain; the other is the physical residence card.”',
    prediction: 'When settling in Spain, why does it matter to distinguish your NIE number from a TIE card and NIF?',
    transfer: 'Imagine booking an appointment at an office in Spain: how would you ask in Spanish and what would you verify on the official government portal first?',
  },
  'es-es-padron': {
    scene: 'Sam moves to Seville and puts off town-hall registration “until next month”. Britjoy points to the ayuntamiento: “In Spain, the padrón is the key to local public services.”',
    prediction: 'What does registering on the municipal padrón in Spain unlock, and what proof of address will you need?',
    transfer: 'Write or say in Spanish how you would ask for a padrón appointment at your local ayuntamiento and check its official checklist.',
  },
  'co-es-cedula': {
    scene: 'In Bogotá, Sam mixes up the civil registry record with the Colombian ID card (cédula). Britjoy straightens the file: “In Colombia, the Registraduría gives each document a distinct legal job.”',
    prediction: 'How do the cédula and civil registry differ in Colombia, and where do you verify official requirements?',
    transfer: 'Practise asking in Spanish about a document procedure in Colombia and note what you would verify on the official Registraduría site.',
  },
  'co-es-tutela': {
    scene: 'In Cali, a neighbour assumes defending an urgent fundamental right requires an expensive lawyer. Britjoy opens the guide: “In Colombia, learn how tutela and right of petition each work.”',
    prediction: 'In Colombia, when is an acción de tutela used compared with a standard derecho de petición?',
    transfer: 'Explain in Spanish what facts you would state clearly in a petition in Colombia and which official source you would check.',
  },
};

export function storyForLesson(lesson: Lesson, locale: 'es' | 'en'): LessonStory {
  if (locale === 'es' && pilots[lesson.id]) return pilots[lesson.id];
  if (locale === 'en' && pilotsEn[lesson.id]) return pilotsEn[lesson.id];
  // Use only a scene explicitly authored as a scene, never an answer or explanation body.
  const dialogue = lesson.exercises.find((exercise) => exercise.type === 'dialogue' && exercise.scene);
  const scene = dialogue?.type === 'dialogue' ? dialogue.scene : undefined;
  return locale === 'es'
    ? {
        scene: scene || `Britjoy abre el capítulo «${lesson.title}»: «He ensayado delante del espejo. El espejo ha pedido otra opinión». Ahora te toca resolver la situación.`,
        prediction: `Antes de empezar «${lesson.title}», ¿qué crees que necesitarás saber hacer y comprobar?`,
        transfer: 'Aplica lo aprendido a un caso nuevo: ¿qué harías, qué error evitarías y dónde lo comprobarías?',
      }
    : {
        scene: scene || `Britjoy opens “${lesson.title}”: “I rehearsed in front of the mirror. The mirror asked for a second opinion.” Your turn to solve the situation.`,
        prediction: `Before starting “${lesson.title}”, what do you think you will need to do and check?`,
        transfer: 'Apply this lesson to a new case: what would you do, what mistake would you avoid, and where would you check it?',
      };
}

export function explanationSegments(body: string): string[] {
  return body.split('\n').map((line) => line.trim()).filter(Boolean);
}

function clipText(raw: string, max = 140): string {
  const clean = raw.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

/** Clear upfront objective for a lesson without disclosing any graded answer. */
export function objectiveForLesson(lesson: Lesson, locale: 'es' | 'en'): string {
  const explains = lesson.exercises.filter((e): e is Extract<Exercise, { type: 'explain' }> => e.type === 'explain');
  for (const ex of explains) {
    for (const seg of explanationSegments(ex.body)) {
      const m = locale === 'es' ? seg.match(/^•?\s*Objetivo:\s*(.+)$/i) : seg.match(/^•?\s*(?:Goal|Objective):\s*(.+)$/i);
      if (m?.[1]) return clipText(m[1], 150);
    }
  }
  if (locale === 'es' && lesson.tip?.trim()) return clipText(lesson.tip, 150);
  const firstExplain = explains[0];
  if (firstExplain?.title) {
    return locale === 'es'
      ? `Dominar paso a paso «${lesson.title}» (${firstExplain.title}) y comprobarlo en un caso práctico.`
      : `Practise “${lesson.title}” (${firstExplain.title}) step by step and verify it on a practical case.`;
  }
  return locale === 'es'
    ? `Practicar «${lesson.title}» paso a paso y aplicarlo a otro caso real.`
    : `Practise “${lesson.title}” step by step and apply it to a new case.`;
}

/** Concise pedagogical explanation shown in the red/green feedback banner after checking an exercise. */
export function explanationForExercise(lesson: Lesson, exercise: Exercise, correctAnswer: string, locale: 'es' | 'en'): string {
  const norm = correctAnswer.trim().toLowerCase();
  const explains = lesson.exercises.filter((e): e is Extract<Exercise, { type: 'explain' }> => e.type === 'explain');
  if (norm) {
    for (const ex of explains) {
      const hit = ex.phrases?.find((p) => p.en.trim().toLowerCase() === norm || p.es.trim().toLowerCase() === norm);
      if (hit) {
        return locale === 'es'
          ? `Clave: «${hit.en}» corresponde a «${hit.es}».`
          : `Key match: “${hit.en}” means “${hit.es}”.`;
      }
    }
  }
  if (exercise.type === 'fillBlank' && exercise.hint) {
    return locale === 'es'
      ? `Pista («${exercise.hint}»): la forma exacta en contexto es «${correctAnswer}».`
      : `Cue (“${exercise.hint}”): the exact form in context is “${correctAnswer}”.`;
  }
  const firstExplain = explains[0];
  if (firstExplain) {
    const firstLine = explanationSegments(firstExplain.body)
      .map((s) => s.replace(/^•\s*/, ''))
      .find((s) => !/^(?:Objetivo|Goal|Objective|Tu tarea|Pista):/i.test(s));
    if (firstLine) {
      const sentence = firstLine.split(/(?<=[.!?])\s+/)[0] || firstLine;
      return locale === 'es'
        ? `Mecanismo: ${clipText(sentence, 135)}`
        : `Mechanism: ${clipText(sentence, 135)}`;
    }
  }
  return locale === 'es'
    ? 'Revisa la estructura modelo antes de continuar o volver a intentarlo.'
    : 'Review the model pattern before continuing or trying again.';
}

