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
  'ia-06-language': {
    scene: 'El generador entrega una frase impecable. Britjoy pregunta por la fuente. «Tengo una coma preciosa», contesta. Britjoy: «La coma no cuenta como testigo».',
    prediction: '¿Una frase que suena convincente basta para saber que es cierta? Explica tu primera intuición.',
    transfer: 'Una IA te da un horario con mucha seguridad. ¿Qué comprobarías antes de hacer el viaje?',
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
