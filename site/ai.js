/* Prompt Atelier · ИИ-редактор через Puter.js (Claude)
   Ключей нет: каждый пользователь входит в свой аккаунт Puter, запросы идут из его бесплатной квоты.
   Claude доступен только в странах из списка Anthropic: https://www.anthropic.com/supported-countries
   База знаний подгружается по разделам (раздел 15 базы: только нужные модули). */

const AI_MODELS = {
  "claude-sonnet-5-5": "Claude Sonnet 5.5 — быстро",
  "claude-opus-5-5": "Claude Opus 5.5 — сложные сцены",
};

const KB_FILES = {
  kb: "knowledge/prompt_service_knowledge_base.md",
  cards: "knowledge/model_cards_syntx.md",
  cams: "knowledge/camera_library.md",
};
let kbCache = null;

async function loadKnowledge() {
  if (kbCache) return kbCache;
  const entries = await Promise.all(Object.entries(KB_FILES).map(async ([k, url]) => {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`не удалось загрузить базу знаний (${url})`);
    return [k, await r.text()];
  }));
  kbCache = Object.fromEntries(entries);
  return kbCache;
}

/* Разделы «## N. ...» основной базы */
function kbSections(md, ids) {
  return md.split(/\n(?=## )/).filter((part) => {
    const m = part.match(/^## (\d+)\./);
    return m && ids.includes(Number(m[1]));
  }).join("\n\n");
}

/* Карточка выбранной модели из model_cards_syntx.md */
function modelCard(md, name) {
  const short = name.split(" ")[0].toLowerCase();
  const version = (name.match(/\d+\.\d+/) || [""])[0];
  const parts = md.split(/\n(?=## \d+\. )/);
  const hit = parts.find((p) => p.toLowerCase().includes(short) && (!version || p.split("\n")[0].includes(version)))
           || parts.find((p) => p.toLowerCase().split("\n")[0].includes(short));
  const rules = md.split("\n---")[0];
  return `${rules}\n\n${hit || ""}`;
}

function buildSystem(kb, f, a, m) {
  const ids = [1, 2, 4, 6, 8, 9, 12, 13, 14, 18, 19, 20, 21, 22];
  if (a.subjects.some((x) => x.kind === "human") || state.files.some((x) => x.role === "identity")) ids.push(3, 7);
  if (f.speech || f.sound) ids.push(10);
  if (["edit", "extend"].includes(state.mode)) ids.push(11);
  return `Ты — редактор сервиса Prompt Atelier. Превращаешь идею пользователя в готовый промпт для видео-нейросети ${m.name} в синтаксисе SYNTX.

Как работать:
- Строго по базе знаний, карточке модели и библиотеке камер ниже.
- Сохраняй идею и всё, что пользователь задал явно. Недостающее (место, сезон, погоду, время суток, свет, механику действия, фактуры, звук) додумывай уместно и перечисли в блоке ДОДУМАНО.
- Переводи всё на английский, включая названия: марки и модели пиши правильно (например, «бмв 3 м компетишн» → BMW M3 Competition). Реплики героя оставляй на языке речи.
- Действие распиши механически: что физически происходит, в каком порядке, с какой скоростью, как реагируют окружение, свет, звук. Хронометраж — по секундам без дыр, у каждой стадии начальное состояние, событие, камера, конечное состояние; стыки стадий согласованы.
- Камеру, объектив, диафрагму и движение выбирай по библиотеке камер (разделы B и E), если пользователь их не назвал. Пиши камеру по строкам: Camera, Lens, Aperture and focus, Background, Look, Movement, Editing. Одно основное движение на план.
- Стиль задан пользователем: real — живая съёмка; toon — указанный вид анимации без названий реальных камер и без фотореализма.
- Теги файлов только из брифа (@image1, @video1, @audio1…), роль при первом упоминании. Не выдумывай файлы.
- «4К», «гипер реализм» и т. п. не пиши в промпт как слова: разрешение — настройка; в стиль — описание детализации.
- Не называй фильмы, сериалы, игры и персонажей — описывай видимые признаки мира.
- Черновик в брифе собран по правилам без ИИ: используй его как отправную точку, но перепиши каждый блок под конкретную сцену.

Формат ответа — строго три части, без пояснений до и после:
=== EN ===
(полный промпт на английском: GOAL, SUBJECT, ACTION, REFERENCES если есть файлы, SCENE, LIGHT, CAMERA, STYLE, DETAIL, TIMELINE, AUDIO, CONTINUITY, CONSTRAINTS; для правки видео вместо SCENE…TIMELINE — EDIT SCOPE)
=== RU ===
(точный перевод того же промпта на русский, те же блоки)
=== ДОДУМАНО ===
(3–8 коротких пунктов по-русски: что ты добавил сам)

=== БАЗА ЗНАНИЙ (нужные разделы) ===
${kbSections(kb.kb, ids)}

=== КАРТОЧКА МОДЕЛИ ===
${modelCard(kb.cards, m.name)}

=== БИБЛИОТЕКА КАМЕР И ДВИЖЕНИЙ ===
${camsFor(kb.cams, a, f)}`;
}

/* Из каталога камер (раздел A) — только группа выбранной камеры; разделы B–F целиком */
const RIG_GROUP_TO_A = { "Кино": "A1", "Репортаж": "A2", "Плёнка": "A3", "Атмосфера и ностальгия": "A4", "Бытовое и «реальное»": "A5" };
function camsFor(md, a, f) {
  const [head, ...rest] = md.split(/\n(?=## [A-F]\. )/);
  const partA = rest.find((x) => x.startsWith("## A."));
  const others = rest.filter((x) => !x.startsWith("## A."));
  let pickedA = "";
  if (partA && f.style === "real" && a.rigId) {
    const code = RIG_GROUP_TO_A[RIGS[a.rigId].group];
    pickedA = partA.split(/\n(?=### A\d\. )/).filter((x, i) => i === 0 || (code && x.startsWith(`### ${code}.`))).join("\n");
  }
  return [head.split("\n").slice(0, 3).join("\n"), pickedA, ...others].filter(Boolean).join("\n\n");
}

function briefForAi() {
  const { en, tagged, a, f } = buildPrompt();
  const m = model();
  return {
    brief: {
      model: { name: m.name, limits: m.limits, durations: m.durations, aspects: m.aspects, notes: m.notes },
      mode: MODES[state.mode].en,
      style: f.style === "real" ? { type: "real", camera: f.rig === "auto" ? "подобрать" : RIGS[a.rigId].label, background: f.bg } : { type: "toon", kind: TOON[f.toon].label },
      idea: f.inputMode === "free" ? f.idea : f.fields,
      ending: f.ending, speech: f.speech,
      settings: { duration_s: f.dur, aspect: f.aspect, light: f.light, camera_move: f.camera === "auto" ? "подобрать" : MOVES[f.camera].ru, take: f.take, music: f.music, sound: f.sound, no_on_screen_text: f.noText, macro_detail: f.macro, infer_details: f.infer },
      files: tagged.map((x) => ({ tag: x.tag, type: x.type, role: ROLES[x.type][x.role].label, name: x.name })),
      understood_by_rules: { place: a.place && a.place.label, season: a.season && a.season.label, time: a.time && a.time.label, weather: a.weather && a.weather.label, subjects: a.subjects.map((x) => x.label), world: a.world && a.world.label, camera: a.rigId && RIGS[a.rigId].label, move: a.moveId && MOVES[a.moveId].ru },
    },
    draft: en,
    a, f, m,
  };
}

/* Разбор ответа по маркерам, работает и на неполном тексте во время потока */
function splitAnswer(text) {
  const grab = (from, to) => {
    const i = text.indexOf(from);
    if (i < 0) return "";
    const rest = text.slice(i + from.length);
    const j = to ? rest.indexOf(to) : -1;
    return (j >= 0 ? rest.slice(0, j) : rest).trim();
  };
  return {
    en: grab("=== EN ===", "=== RU ==="),
    ru: grab("=== RU ===", "=== ДОДУМАНО ==="),
    assumptions: grab("=== ДОДУМАНО ===").split("\n").map((s) => s.replace(/^[-•\d.)\s]+/, "").trim()).filter(Boolean),
  };
}

async function runClaude() {
  const btn = $("aiBtn");
  if (typeof puter === "undefined") { toast("Puter не загрузился: проверьте интернет и обновите страницу"); return; }
  if (location.protocol === "file:") { toast("Claude работает только на опубликованном сайте, не из файла"); return; }
  const modelId = $("aiModel").value;
  btn.disabled = true;
  try {
    if (!puter.auth.isSignedIn()) {
      btn.textContent = "Вход в Puter…";
      await puter.auth.signIn();
    }
    renderAccount();
    btn.textContent = "Готовлю базу знаний…";
    const kb = await loadKnowledge();
    const { brief, draft, a, f, m } = briefForAi();
    const messages = [
      { role: "system", content: buildSystem(kb, f, a, m) },
      { role: "user", content: `Бриф (JSON):\n${JSON.stringify(brief, null, 1)}\n\nЧерновик по правилам:\n${draft}` },
    ];
    btn.textContent = "Claude пишет промпт…";
    state.ai = { en: "", ru: "", assumptions: [], stale: false, model: AI_MODELS[modelId].split(" —")[0], streaming: true };
    const stream = await puter.ai.chat(messages, { model: modelId, stream: true });
    let text = "";
    for await (const part of stream) {
      if (part.type === "error") throw new Error(part.message || "ошибка модели");
      if (part.type === "text" && part.text) {
        text += part.text;
        Object.assign(state.ai, splitAnswer(text));
        showAi();
      }
    }
    Object.assign(state.ai, splitAnswer(text), { streaming: false });
    if (!state.ai.en) throw new Error("ответ пришёл не в том формате, попробуйте ещё раз");
    render();
    toast("Промпт написан Claude");
  } catch (e) {
    const msg = e && (e.msg || e.message || e.error) || String(e);
    if (state.ai && !state.ai.en) state.ai = null;
    render();
    toast(/auth_window_closed/.test(String(e && e.error)) ? "Вход в Puter отменён" : `Не получилось: ${msg}`);
  } finally {
    btn.disabled = false;
    btn.textContent = "Написать промпт с Claude";
  }
}

/* Показ ответа ИИ поверх черновика */
function showAi() {
  const ai = state.ai;
  const tag = ` · ${ai.model}${ai.streaming ? " · пишет…" : ""}`;
  $("enText").innerHTML = highlight(ai.en || "…");
  $("ruText").innerHTML = highlight(ai.ru || "…");
  $("enText").dataset.raw = ai.en;
  $("ruText").dataset.raw = ai.ru;
  $("enCount").textContent = `${ai.en.length} симв.${tag}`;
  $("ruCount").textContent = `${ai.ru.length} симв.${tag}`;
}

function aiChecks() {
  if (!state.ai || state.ai.streaming) return [];
  const out = [];
  if (state.ai.stale) out.push(["warn", "Claude", "Вы изменили настройки после ответа Claude. Нажмите «Написать промпт с Claude» ещё раз или «Показать черновик»."]);
  else out.push(["ok", "Claude", `Промпт написан ${state.ai.model} по базе знаний.`]);
  state.ai.assumptions.forEach((t) => out.push(["info", "Додумано", t]));
  return out;
}

async function renderAccount() {
  const box = $("aiAccount");
  try {
    if (typeof puter !== "undefined" && puter.auth.isSignedIn()) {
      const u = await puter.auth.getUser();
      box.innerHTML = `Вы вошли в Puter как <b>${esc(u.username || "пользователь")}</b> · <button type="button" class="link-btn" id="aiOut">выйти</button>`;
      $("aiOut").addEventListener("click", () => { puter.auth.signOut(); renderAccount(); });
      return;
    }
  } catch {}
  box.textContent = "При первом запуске откроется окно Puter: войдите или создайте бесплатный аккаунт.";
}

function bindAi() {
  $("aiModel").innerHTML = Object.entries(AI_MODELS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
  $("aiBtn").addEventListener("click", runClaude);
  $("aiDraft").addEventListener("click", () => { state.ai = null; render(); });
  renderAccount();
}
