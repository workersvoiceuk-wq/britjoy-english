/** Duolingo-style achievements, computed from saved progress (nothing extra is stored). */
export interface ProgressSnapshot {
  xp: number;
  streak: number;
  levels: Record<string, { completedLessons: Record<string, { stars: number }> }>;
}

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  earned: boolean;
}

export function achievements(p: ProgressSnapshot, coursesCompleted: number): Achievement[] {
  const lessons = Object.values(p.levels).flatMap((l) => Object.values(l.completedLessons));
  const perfect = lessons.filter((l) => l.stars === 3).length;
  const lifeDone = Object.keys(p.levels.UK?.completedLessons ?? {}).length;
  return [
    { id: 'first-lesson', icon: '🌱', title: 'Primer paso', description: 'Completa tu primera lección.', earned: lessons.length >= 1 },
    { id: 'ten-lessons', icon: '📚', title: 'Constante', description: 'Completa 10 lecciones.', earned: lessons.length >= 10 },
    { id: 'perfect', icon: '⭐', title: 'Perfección', description: 'Termina una lección sin errores.', earned: perfect >= 1 },
    { id: 'streak-3', icon: '🔥', title: 'Racha de 3 días', description: 'Practica 3 días seguidos.', earned: p.streak >= 3 },
    { id: 'streak-7', icon: '🏆', title: 'Racha de una semana', description: 'Practica 7 días seguidos.', earned: p.streak >= 7 },
    { id: 'xp-100', icon: '⚡', title: '100 XP', description: 'Consigue 100 puntos de experiencia.', earned: p.xp >= 100 },
    { id: 'xp-500', icon: '💎', title: '500 XP', description: 'Consigue 500 puntos de experiencia.', earned: p.xp >= 500 },
    { id: 'life-uk', icon: '🇬🇧', title: 'Ya vives en UK', description: 'Completa 5 lecciones de «Vivir en UK».', earned: lifeDone >= 5 },
    { id: 'graduate', icon: '🎓', title: 'Graduado', description: 'Termina un curso completo y consigue tu certificado.', earned: coursesCompleted >= 1 },
  ];
}
