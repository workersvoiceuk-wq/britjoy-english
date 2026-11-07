// BritJoy English · Repaso A2 con vídeos (página independiente para Sites).
// Sin cuenta, sin API, sin cuota ni proveedor: solo lee data.json y sus medios. No toca las claves de la app
// vigente (lumi-v8-guest, britjoy-answer-sound-v1) ni llama a /britjoy-english/api/*. Guarda el avance de práctica
// solo en este navegador, en su propia clave (KEY), separado del progreso de la cuenta y de las constancias.
const KEY = 'britjoy-repaso-a2-v1';
const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (v !== false && v !== undefined && v !== null) n.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) n.append(kid);
  return n;
};

// Corrección igual que la app BritJoy (src/logic/answer.ts).
const normalizeText = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[‘’ʼ`´]/g, "'")
  .replace(/[“”]/g, '"').replace(/[¿¡]/g, '').toLowerCase().replace(/\s+/g, ' ').trim().replace(/[\s.!?…,;:]+$/u, '').trim();
const tokenize = s => normalizeText(s).split(' ').map(t => t.replace(/^[.,!?;:"]+|[.,!?;:"]+$/g, '')).filter(Boolean);
const checkTyped = (input, answer, alts = []) => { const g = normalizeText(input); return !!g && [answer, ...alts].some(c => normalizeText(c) === g); };
const checkWordBank = (sel, answer, alts = []) => { const g = tokenize(sel.join(' ')); return g.length > 0 && [answer, ...alts].some(c => { const e = tokenize(c); return e.length === g.length && e.every((t, i) => t === g[i]); }); };
const words = s => (String(s).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).join(' ');
const mentions = (text, answer) => { const n = words(answer); return !!n && (' ' + words(text) + ' ').includes(' ' + n + ' '); };

const store = {
  read() { try { return JSON.parse(localStorage.getItem(KEY)) || {lessons: {}}; } catch { return {lessons: {}}; } },
  write(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* sin almacenamiento: la práctica sigue */ } },
};

let DATA = null;
const app = () => $('#app');

function player(clip, label) {
  const sel = el('select', {class: 'captions', 'aria-label': 'Subtítulos'},
    el('option', {value: 'es', text: 'Español'}), el('option', {value: 'en', text: 'English'}), el('option', {value: '', text: 'Sin subtítulos'}));
  const video = el('video', {controls: true, playsinline: true, preload: 'metadata', src: clip.mp4, 'data-clip': clip.id, 'aria-label': label},
    el('track', {kind: 'subtitles', srclang: 'es', label: 'Español', src: clip.vtt.es, default: true}),
    el('track', {kind: 'subtitles', srclang: 'en', label: 'English', src: clip.vtt.en}));
  const sync = () => { for (const t of video.textTracks || []) t.mode = t.language === sel.value ? 'showing' : 'disabled'; };
  sel.addEventListener('change', sync);
  video.addEventListener('loadedmetadata', sync);
  return el('figure', {class: 'clip', 'data-clip-figure': clip.id},
    video, el('figcaption', {}, el('label', {}, 'Subtítulos ', sel), el('span', {class: 'note', text: 'Locución original pendiente · vídeo con texto y subtítulos'})));
}

function home() {
  const st = store.read();
  app().replaceChildren(
    el('p', {class: 'eyebrow', text: 'Inglés A2 · repaso con vídeos'}),
    el('h1', {text: 'Practica A2 con BritJoy'}),
    el('p', {class: 'lead', text: 'Cuatro lecciones con un vídeo de capítulo y un vídeo de repaso por pregunta. El repaso aparece cuando aciertas o cuando agotas los dos intentos.'}),
    el('p', {class: 'scope', text: 'Esta práctica es independiente de tu cuenta: no cambia tu historia, tu progreso ni tus constancias de BritJoy English. Lo que completes aquí se guarda solo en este navegador.'}),
    el('ol', {class: 'lessons'}, DATA.lessons.map(l => el('li', {},
      el('button', {class: 'lesson', 'data-lesson': l.id, onclick: () => lesson(l.id)},
        el('strong', {text: l.title}), el('span', {text: `${l.unitTitle} · ${l.questions} preguntas`}),
        st.lessons[l.id]?.done ? el('span', {class: 'done', text: '✓ completada'}) : null)))),
  );
  document.title = 'Repaso A2 · BritJoy English';
  $('h1').focus?.();
}

function lesson(id, index = -1) {
  const l = DATA.lessons.find(x => x.id === id);
  if (index === -1) {
    app().replaceChildren(
      el('button', {class: 'back', onclick: home, text: '← Lecciones'}),
      el('p', {class: 'eyebrow', text: l.unitTitle}), el('h1', {tabindex: '-1', text: l.title}),
      l.tip ? el('p', {class: 'lead', text: l.tip}) : null,
      el('section', {class: 'chapter', 'data-chapter': l.id}, el('h2', {text: '🎬 Mira la demostración'}), player(l.chapter, `Demostración: ${l.title}`)),
      el('button', {class: 'primary', 'data-start': l.id, onclick: () => lesson(id, 0), text: 'Empezar las preguntas →'}),
    );
    $('h1').focus();
    return;
  }
  if (index >= l.exercises.length) {
    const st = store.read(); st.lessons[id] = {done: true, at: Date.now()}; store.write(st);
    app().replaceChildren(el('h1', {tabindex: '-1', text: '¡Lección repasada!'}), el('p', {class: 'lead', text: 'Has terminado este repaso. Tu progreso de BritJoy English no cambia.'}),
      el('button', {class: 'primary', onclick: home, 'data-finish': id, text: 'Volver a las lecciones'}));
    $('h1').focus();
    return;
  }
  const e = l.exercises[index];
  if (e.type === 'explain') {
    app().replaceChildren(el('p', {class: 'eyebrow', text: `${index + 1} / ${l.exercises.length}`}), el('h1', {tabindex: '-1', text: e.title}),
      el('div', {class: 'explain'}, String(e.body).split('\n').filter(Boolean).map(t => el('p', {text: t.replace(/^\*\*|\*\*$/g, '')}))),
      el('button', {class: 'primary', onclick: () => lesson(id, index + 1), text: 'Continuar →'}));
    $('h1').focus();
    return;
  }
  exercise(l, index, e, 0);
}

function exercise(l, index, e, attempt) {
  const qid = `${l.id}:${index}`;
  const clip = l.reviews[qid];
  let response = null;
  const feedback = el('div', {class: 'feedback', role: 'status', 'aria-live': 'polite'});
  const actions = el('div', {class: 'actions'});
  const check = el('button', {class: 'primary', 'data-check': qid, disabled: true, text: 'Comprobar'});
  const setResponse = v => { response = v; check.disabled = v === null || (Array.isArray(v) && !v.length) || v === ''; };
  const body = el('div', {class: 'task'});
  const prompt = e.prompt || e.sentence || (e.type === 'matching' ? 'Une las parejas' : e.type === 'listening' ? 'Escucha y responde' : '');
  if (e.type === 'listening') {
    const say = rate => { try { const u = new SpeechSynthesisUtterance(e.text); u.lang = 'en-GB'; u.rate = rate; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch { /* sin voz del navegador */ } };
    body.append(el('div', {class: 'listen'}, el('button', {onclick: () => say(1), text: '🔊 Escuchar'}), el('button', {onclick: () => say(0.6), text: '🐢 Lento'})));
    if (!('speechSynthesis' in window)) body.append(el('p', {class: 'note', text: `Tu navegador no reproduce voz. Frase: ${e.text}`}));
  }
  if (e.options?.length) {
    const group = el('div', {class: 'options', role: 'radiogroup', 'aria-label': prompt});
    for (const o of e.options) group.append(el('button', {class: 'option', role: 'radio', 'aria-checked': 'false', 'data-option': o, onclick: ev => {
      for (const b of group.children) b.setAttribute('aria-checked', 'false');
      ev.currentTarget.setAttribute('aria-checked', 'true'); setResponse(o); }, text: o}));
    body.append(group);
  } else if (e.type === 'wordBank') {
    const chosen = [], line = el('div', {class: 'built', 'aria-label': 'Tu frase'}), bank = el('div', {class: 'bank'});
    const paint = () => { line.replaceChildren(...chosen.map((w, i) => el('button', {class: 'word', onclick: () => { chosen.splice(i, 1); paint(); }, text: w}))); setResponse(chosen.length ? [...chosen] : null); };
    for (const w of e.words) bank.append(el('button', {class: 'word', 'data-word': w, onclick: () => { chosen.push(w); paint(); }, text: w}));
    body.append(line, bank);
  } else if (e.type === 'matching') {
    const pairs = {}; let left = null;
    const en = el('div', {class: 'col'}), es = el('div', {class: 'col'});
    const paint = () => { for (const b of en.children) { b.classList.toggle('sel', b.dataset.en === left); b.textContent = pairs[b.dataset.en] ? `${b.dataset.en} = ${pairs[b.dataset.en]}` : b.dataset.en; } setResponse(Object.keys(pairs).length === e.pairs.length ? {...pairs} : null); };
    for (const p of e.pairs) en.append(el('button', {class: 'word', 'data-en': p.en, onclick: () => { left = p.en; paint(); }, text: p.en}));
    for (const p of [...e.pairs].sort((a, b) => a.es.localeCompare(b.es))) es.append(el('button', {class: 'word', 'data-es': p.es, onclick: () => { if (left) { for (const k of Object.keys(pairs)) if (pairs[k] === p.es) delete pairs[k]; pairs[left] = p.es; left = null; paint(); } }, text: p.es}));
    body.append(el('div', {class: 'match'}, en, es));
  } else {
    const input = el('input', {class: 'typed', type: 'text', autocomplete: 'off', 'aria-label': 'Tu respuesta', placeholder: 'Escribe en inglés…', oninput: ev => setResponse(ev.currentTarget.value.trim())});
    body.append(input);
  }
  check.addEventListener('click', () => {
    let ok;
    if (e.type === 'matching') ok = e.pairs.every(p => response[p.en] === p.es);
    else if (e.type === 'wordBank') ok = checkWordBank(response, e.answer, e.alternatives);
    else if (e.options?.length) ok = normalizeText(response) === normalizeText(e.answer);
    else ok = checkTyped(response, e.answer, e.alternatives);
    for (const b of body.querySelectorAll('button, input')) b.disabled = true;
    check.hidden = true;
    const answerText = e.type === 'matching' ? e.pairs.map(p => `${p.en} = ${p.es}`).join(' · ') : e.answer;
    const reveal = ok || attempt >= 1; // tras acertar o al agotar los dos intentos
    if (ok) feedback.replaceChildren(el('p', {class: 'right', 'data-state': 'right', text: '✓ ¡Correcto!'}));
    else if (!reveal) {
      const authored = e.optionExplanations && typeof response === 'string' ? e.optionExplanations[response] : null;
      const hint = [authored, e.gradualHint].find(t => t && !mentions(t, e.answer)) || 'Revisa la frase completa y vuelve a intentarlo.';
      feedback.replaceChildren(el('p', {class: 'wrong', 'data-state': 'wrong1', text: '✗ Todavía no.'}), el('p', {text: hint}));
    } else feedback.replaceChildren(el('p', {class: 'wrong', 'data-state': 'wrong2', text: '✗ Respuesta correcta:'}), el('p', {class: 'answer', 'data-revealed': 'true', text: answerText}));
    if (reveal && clip) feedback.append(el('section', {class: 'review', 'data-review': qid}, el('h2', {text: '🎥 Vídeo de repaso'}), player(clip, `Repaso: ${qid}`)));
    actions.replaceChildren(
      !ok && !reveal ? el('button', {class: 'secondary', 'data-retry': qid, onclick: () => exercise(l, index, e, attempt + 1), text: 'Intentar de nuevo'}) : null,
      reveal ? el('button', {class: 'primary', 'data-next': qid, onclick: () => lesson(l.id, index + 1), text: 'Continuar →'}) : null);
    (actions.querySelector('button') || feedback).focus?.();
  });
  actions.append(check);
  app().replaceChildren(
    el('p', {class: 'eyebrow', text: `${l.title} · ${index + 1} / ${l.exercises.length}`}),
    el('h1', {tabindex: '-1', text: prompt}), body, feedback, actions);
  $('h1').focus();
}

fetch('data.json').then(r => r.json()).then(d => { DATA = d; home(); }).catch(() => {
  app().replaceChildren(el('p', {class: 'wrong', text: 'No se pudo cargar el repaso. Vuelve a BritJoy English e inténtalo más tarde.'}));
});
