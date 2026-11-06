import type { Lesson } from '../types';

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
};

export function storyForLesson(lesson: Lesson, locale: 'es' | 'en'): LessonStory {
  if (locale === 'es' && pilots[lesson.id]) return pilots[lesson.id];
  // Use only a scene explicitly authored as a scene, never an answer or explanation body.
  const dialogue = lesson.exercises.find((exercise) => exercise.type === 'dialogue' && exercise.scene);
  const scene = dialogue?.type === 'dialogue' ? dialogue.scene : undefined;
  return locale === 'es'
    ? {
        scene: scene || `Britjoy abre el capítulo «${lesson.title}»: «He ensayado delante del espejo. El espejo ha pedido otra opinión». Ahora te toca resolver la situación.`,
        prediction: `Antes de empezar «${lesson.title}», ¿qué crees que necesitarás saber hacer?`,
        transfer: 'Inventa una situación nueva donde usarías lo aprendido. ¿Qué harías y por qué?',
      }
    : {
        scene: scene || `Britjoy opens “${lesson.title}”: “I rehearsed in front of the mirror. The mirror asked for a second opinion.” Your turn to solve the situation.`,
        prediction: `Before starting “${lesson.title}”, what do you think you will need to do?`,
        transfer: 'Imagine a new situation where you could use this lesson. What would you do, and why?',
      };
}

export function explanationSegments(body: string): string[] {
  return body.split('\n').map((line) => line.trim()).filter(Boolean);
}
