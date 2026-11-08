/* Prompt Atelier · прототип 0.1
   Сборка промпта по правилам knowledge/prompt_service_knowledge_base.md без ИИ.
   В рабочей версии функция buildPrompt() будет отдавать бриф языковой модели (см. docs/ARCHITECTURE.md). */

const $ = (id) => document.getElementById(id);

const state = {
  model: "seedance-2-5",
  mode: "ref",
  files: [], // { id, type, name, role, roleTouched, url, demo }
};
let uid = 0;

/* ---------- Справочники фраз ---------- */

const LIGHT = {
  auto: [
    "Lighting is motivated by sources inside the scene; they stay fixed in space while shading and reflections change continuously as the subject and camera move.",
    "Свет мотивирован источниками внутри сцены; они остаются на своих местах, а тени и отражения меняются непрерывно при движении героя и камеры.",
  ],
  window: [
    "Soft daylight from a large window on the left of frame at shoulder height: broad soft shadow edge, gentle bounce fill from the room, background a little darker than the subject.",
    "Мягкий дневной свет из большого окна слева в кадре на уровне плеч: широкая мягкая граница тени, лёгкое отражённое заполнение от комнаты, фон немного темнее героя.",
  ],
  sun: [
    "Hard low sunlight from behind-right: crisp shadow edges, warm rim on hair and shoulders, the shadow side stays readable from bounce light.",
    "Жёсткое низкое солнце сзади справа: чёткие границы теней, тёплый контур на волосах и плечах, теневая сторона читается за счёт отражённого света.",
  ],
  night: [
    "Night scene lit by practical sources visible in frame (lamps, signs): separate pools of warm and cool light, deep but readable shadows, no flicker unless motivated.",
    "Ночная сцена, освещённая видимыми источниками в кадре (лампы, вывески): отдельные пятна тёплого и холодного света, глубокие, но читаемые тени, без мерцания без причины.",
  ],
  studio: [
    "Studio key light high front-left through a large softbox, subtle fill, dark seamless background, controlled highlights on skin and materials.",
    "Студийный рисующий свет высоко спереди слева через большой софтбокс, слабое заполнение, тёмный бесшовный фон, контролируемые блики на коже и материалах.",
  ],
};

const CAMERA = {
  auto: ["One main camera move per stage, chosen to support the action.", "Одно основное движение камеры на стадию, выбранное под действие."],
  static: ["Locked-off static camera throughout.", "Неподвижная камера на всём протяжении."],
  push: ["Slow dolly push-in from a medium shot to a close-up.", "Медленный физический наезд со среднего плана на крупный."],
  pull: ["Slow dolly pull-out from a close-up to a wide shot that reveals the space.", "Медленный физический отъезд с крупного плана на общий, раскрывающий пространство."],
  orbit: ["Smooth 90° orbit around the subject at eye level, constant distance, subject stays centered.", "Плавная дуга 90° вокруг героя на уровне глаз, дистанция постоянная, герой остаётся в центре."],
  crane: ["Crane up from eye level to a high angle, revealing the surroundings.", "Подъём камеры краном с уровня глаз в верхний ракурс, раскрывающий окружение."],
  handheld: ["Light handheld camera with natural micro-movement, no shake blur.", "Лёгкая съёмка с рук с естественным микродвижением, без смаза от тряски."],
  fpv: ["FPV drone path through the space along the described route, never passing through solid objects.", "FPV-пролёт по описанному маршруту, без прохождения сквозь твёрдые объекты."],
};

const TAKE = {
  one: ["Single continuous take, no cuts.", "Один непрерывный дубль, без склеек."],
  cuts: ["Several shots joined by clean cuts; each shot keeps screen direction and spatial relations.", "Несколько планов со склейками; каждый план сохраняет направление движения и пространственные связи."],
  transform: ["One intentional transformation, clearly triggered, everything else stays physically stable.", "Одна намеренная трансформация с понятным запуском, всё остальное остаётся физически стабильным."],
};

const REALISM_FULL = [
  "natural and believable, soft diffused lighting, realistic skin texture with subtle pores, soft natural hair strands, true-to-life proportions, shallow depth of field, clean high-definition photographic finish, smooth tonal transitions, restrained sharpening, no AI artifacts, no plastic skin, no repetitive patterns, no banding, no pixelation, no CGI look.",
  "естественный и правдоподобный вид, мягкий рассеянный свет, реалистичная фактура кожи с деликатными порами, естественные отдельные пряди волос, достоверные пропорции, малая глубина резкости, чистая детализированная фотографическая подача, плавные тональные переходы, сдержанная резкость, без ИИ-артефактов, пластиковой кожи, повторяющихся узоров, полос, пикселизации и CGI-вида.",
];
// База знаний, раздел 7: при жёстком свете убрать «мягкий рассеянный свет», чтобы не было противоречия.
const REALISM_HARD = [
  REALISM_FULL[0].replace("soft diffused lighting, ", ""),
  REALISM_FULL[1].replace("мягкий рассеянный свет, ", ""),
];

/* Фразы ролей: t — тег файла. Возвращает [en, ru]. */
function roleLine(type, role, t, ctx) {
  const L = {
    image: {
      identity: [`Use ${t} as the identity reference for the main character: keep the face shape, eyes, brows, nose, lips, original skin tone, age, proportions and individual features such as moles and freckles; do not take its background or lighting.`,
                 `${t} — источник внешности главного героя: сохранить форму лица, глаза, брови, нос, губы, исходный цвет кожи, возраст, пропорции и индивидуальные особенности, включая родинки и веснушки; фон и свет из него не брать.`],
      outfit:   [`Take only the outfit from ${t}: cut, color, fabric and details; do not take the face, pose or background.`,
                 `Из ${t} взять только одежду: крой, цвет, ткань и детали; лицо, позу и фон не брать.`],
      product:  [`${t} is the product: keep its shape, proportions, size, color, material, label and distinctive details exactly; ignore its background, light and angle.`,
                 `${t} — предмет: точно сохранить форму, пропорции, размер, цвет, материал, этикетку и отличительные детали; фон, свет и ракурс исходника не переносить.`],
      location: [`${t} is the location: keep its geometry, layout, walls, windows and doors; do not include any people from it.`,
                 `${t} — локация: сохранить геометрию, планировку, стены, окна и двери; людей из него не переносить.`],
      light:    [`Use ${t} only as the lighting reference: direction, softness, contrast and color relationships, adapted to this scene's geometry; do not copy its costume or interior.`,
                 `${t} использовать только как референс света: направление, мягкость, контраст и цветовые отношения, перенесённые на геометрию этой сцены; костюм и интерьер не копировать.`],
      style:    [`Use ${t} only as a style reference for color, contrast and texture; do not copy its subjects or composition.`,
                 `${t} использовать только как референс стиля: цвет, контраст, фактура; объекты и композицию не копировать.`],
      first_frame: [`${t} is the first frame: the video starts exactly from this image.`, `${t} — первый кадр: ролик начинается точно с этого изображения.`],
      last_frame:  [`${t} is the last frame: the video ends exactly on this image.`, `${t} — последний кадр: ролик заканчивается точно этим изображением.`],
      storyboard:  [`Use ${t} as a storyboard for shot order and rough composition only; do not reproduce its grid, frames, numbers or captions.`,
                    `${t} — сториборд: взять только порядок планов и примерную композицию; сетку, рамки, номера и подписи не воспроизводить.`],
    },
    video: {
      edit_source:   [`Edit ${t}.`, `Отредактировать ${t}.`],
      extend_source: [`Extend ${t} by ${ctx.duration} seconds, continuing seamlessly from its last frame.`, `Продлить ${t} на ${ctx.duration} секунд, бесшовно продолжая с последнего кадра.`],
      motion:  [`Use ${t} only for camera movement, blocking and pacing; do not take its people, set, text or music.`,
                `${t} использовать только для движения камеры, мизансцены и темпа; людей, декорации, надписи и музыку из него не брать.`],
      choreo:  [`Use ${t} only for the character's body movement and timing; do not take its person, clothing or background.`,
                `${t} использовать только для движения тела героя и тайминга; человека, одежду и фон из него не брать.`],
      style:   [`Use ${t} only as a style reference for color grade and texture.`, `${t} использовать только как референс стиля: цветокоррекция и фактура.`],
    },
    audio: {
      music:    [`Use ${t} as the background music; sync key actions to its beats.`, `${t} — фоновая музыка; ключевые действия синхронизировать с её долями.`],
      voice:    [`Use ${t} as the voice reference for the speaking character: timbre and manner only.`, `${t} — образец голоса говорящего героя: только тембр и манера.`],
      lipsync:  [`The main character speaks the speech from ${t}, lips synced to it.`, `Главный герой произносит речь из ${t}, губы синхронизированы с ней.`],
      ambience: [`Use ${t} as the ambient sound reference.`, `${t} — референс фоновой атмосферы.`],
    },
  };
  return (L[type] && L[type][role]) || [`${t}: reference.`, `${t}: референс.`];
}

/* ---------- Вспомогательные ---------- */

const model = () => MODELS.find((m) => m.id === state.model);
const typeOfFile = (f) => (f.type.startsWith("image/") ? "image" : f.type.startsWith("video/") ? "video" : f.type.startsWith("audio/") ? "audio" : null);
const TYPE_RU = { image: "фото", video: "видео", audio: "аудио" };

function tagFor(file) {
  const upper = $("tagUpper").checked;
  const sameType = state.files.filter((f) => f.type === file.type);
  const n = sameType.indexOf(file) + 1;
  const word = upper ? file.type[0].toUpperCase() + file.type.slice(1) : file.type;
  return `@${word}${n}`;
}

function allowedRoles(type) {
  const m = model();
  let keys = Object.keys(ROLES[type]);
  if (type === "audio") keys = keys.filter((k) => m.audioRoles.includes(k));
  if (type === "video") {
    keys = keys.filter((k) => (k === "edit_source" ? state.mode === "edit" : k === "extend_source" ? state.mode === "extend" : true));
  }
  if (type === "image") {
    keys = keys.filter((k) => (k === "first_frame" ? ["i2v", "flf"].includes(state.mode) : k === "last_frame" ? state.mode === "flf" : true));
  }
  return keys;
}

function defaultRole(type, indexInType) {
  const roles = allowedRoles(type);
  if (type === "image") {
    if (state.mode === "flf") return indexInType === 0 ? "first_frame" : indexInType === 1 ? "last_frame" : "identity";
    if (state.mode === "i2v" && indexInType === 0) return "first_frame";
    return indexInType === 0 ? "identity" : "location";
  }
  if (type === "video") {
    if (state.mode === "edit" && indexInType === 0) return "edit_source";
    if (state.mode === "extend" && indexInType === 0) return "extend_source";
    return "motion";
  }
  return roles[0];
}

function normalizeRoles() {
  const counters = { image: 0, video: 0, audio: 0 };
  state.files.forEach((f) => {
    const allowed = allowedRoles(f.type);
    const idx = counters[f.type]++;
    if (!f.roleTouched || !allowed.includes(f.role)) f.role = defaultRole(f.type, idx);
    if (!allowed.includes(f.role)) f.role = allowed[0] || null;
  });
}

function esc(s) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

/* ---------- Отрисовка левой панели ---------- */

function renderModels() {
  $("modelGrid").innerHTML = MODELS.map((m) => {
    const io = ["image", "video", "audio"].map((t) => `<span class="io ${m.limits[t] ? "" : "off"}">${TYPE_RU[t]} ${m.limits[t] || ""}</span>`).join("");
    return `<button type="button" class="model" role="radio" aria-checked="${m.id === state.model}" data-id="${m.id}">
      <span class="model-name">${m.name}</span><span class="model-alias">${m.alias}</span><span class="model-io">${io}</span></button>`;
  }).join("");
  $("modelNotes").textContent = model().blurb;
}

function renderModes() {
  const m = model();
  if (!m.modes.includes(state.mode)) state.mode = m.modes.includes("ref") ? "ref" : m.modes[0];
  $("modeChips").innerHTML = m.modes.map((k) =>
    `<button type="button" class="chip" role="radio" aria-checked="${k === state.mode}" data-mode="${k}">${MODES[k].label}</button>`).join("");
}

function renderSelects() {
  const m = model();
  const keep = (sel, values, fmt, pref) => {
    const cur = sel.value;
    sel.innerHTML = values.map((v) => `<option value="${v}">${fmt(v)}</option>`).join("");
    sel.value = values.map(String).includes(cur) ? cur : String(pref ?? values[0]);
  };
  keep($("duration"), m.durations, (v) => `${v} сек`, m.durations[1]);
  keep($("aspect"), m.aspects, (v) => v, m.aspects.includes("9:16") ? "9:16" : m.aspects[0]);
  $("limitsLine").textContent = `${m.name}: фото до ${m.limits.image} · видео до ${m.limits.video} · аудио ${m.limits.audio ? "до " + m.limits.audio + (m.audioRoles.length === 1 ? " (только голос)" : "") : "нет"} · всего до ${m.limits.total}`;
}

function renderFiles() {
  const counters = { image: 0, video: 0, audio: 0 };
  const m = model();
  $("fileList").innerHTML = state.files.map((f, i) => {
    counters[f.type]++;
    const over = counters[f.type] > m.limits[f.type];
    const roles = allowedRoles(f.type);
    const opts = roles.map((r) => `<option value="${r}" ${r === f.role ? "selected" : ""}>${ROLES[f.type][r].label}</option>`).join("");
    const thumb = f.url
      ? f.type === "image" ? `<img src="${f.url}" alt="">` : f.type === "video" ? `<video src="${f.url}" muted></video>` : TYPE_RU[f.type]
      : TYPE_RU[f.type];
    return `<li class="file ${over || !roles.length ? "bad" : ""}" data-id="${f.id}">
      <div class="thumb">${thumb}</div>
      <div class="file-main">
        <div class="file-top"><span class="tag">${tagFor(f)}</span><span class="fname" title="${esc(f.name)}">${esc(f.name)}${f.demo ? " · пример" : ""}</span></div>
        ${roles.length ? `<select data-role="${f.id}" aria-label="Роль файла ${esc(f.name)}">${opts}</select>` : `<span class="hint">${m.name} не принимает ${TYPE_RU[f.type]}</span>`}
      </div>
      <div class="file-actions">
        <button type="button" class="icon-btn" data-up="${i}" aria-label="Выше">▲</button>
        <button type="button" class="icon-btn" data-del="${f.id}" aria-label="Удалить">✕</button>
      </div></li>`;
  }).join("");
}

/* ---------- Сборка промпта ---------- */

function buildPrompt() {
  const m = model();
  const mode = state.mode;
  const dur = Number($("duration").value);
  const aspect = $("aspect").value;
  const idea = $("idea").value.trim();
  const ending = $("ending").value.trim();
  const speech = $("speech").value.trim();
  const light = $("light").value;
  const camera = $("camera").value;
  const take = $("take").value;
  const sound = $("sound").checked;
  const realism = $("realism").checked;
  const noText = $("noText").checked;
  const music = $("music").value;

  const en = [], ru = [];
  const add = (pair) => { en.push(pair[0]); ru.push(pair[1]); };
  const head = (e, r) => add([`\n${e}`, `\n${r}`]);

  const usable = usableFiles();
  const tagged = usable.map((f) => ({ ...f, tag: tagFor(f) }));
  const byRole = (r) => tagged.filter((f) => f.role === r);
  const identity = byRole("identity");
  const editSrc = byRole("edit_source")[0];
  const extendSrc = byRole("extend_source")[0];

  // GOAL
  const ideaEn = idea ? `Scene idea, author's words in Russian: «${idea}».` : "Scene idea: [describe the event].";
  const ideaRu = idea ? `Идея сцены: «${idea}».` : "Идея сцены: [опишите событие].";
  if (mode === "edit" && editSrc) {
    add([`GOAL: Edit ${editSrc.tag}. Change only what the idea describes; everything else stays as in the source. ${ideaEn}`,
         `ЦЕЛЬ: Отредактировать ${editSrc.tag}. Изменить только то, что описано в идее; всё остальное остаётся как в исходнике. ${ideaRu}`]);
  } else if (mode === "extend" && extendSrc) {
    add([`GOAL: Extend ${extendSrc.tag} by ${dur} seconds, ${aspect} as in the source. ${ideaEn}`,
         `ЦЕЛЬ: Продлить ${extendSrc.tag} на ${dur} секунд, формат как у исходника. ${ideaRu}`]);
  } else {
    add([`GOAL: A ${dur}-second ${aspect} video, ${MODES[mode].en}. ${ideaEn}`,
         `ЦЕЛЬ: Ролик ${dur} секунд, формат ${aspect}, режим «${MODES[mode].label.toLowerCase()}». ${ideaRu}`]);
  }

  // REFERENCES
  if (tagged.length) {
    head("REFERENCES:", "РЕФЕРЕНСЫ:");
    tagged.forEach((f) => {
      const p = roleLine(f.type, f.role, f.tag, { duration: dur });
      add([`- ${p[0]}`, `- ${p[1]}`]);
    });
    if (identity.length > 1) add([`- ${identity.map((f) => f.tag).join(" and ")} show the same one person.`, `- ${identity.map((f) => f.tag).join(" и ")} — один и тот же человек.`]);
  }

  // SCENE AND LIGHT
  if (mode !== "edit") {
    head("SCENE AND LIGHT:", "СЦЕНА И СВЕТ:");
    if (byRole("light").length) add([`Lighting follows ${byRole("light")[0].tag}, adapted to this space.`, `Свет по ${byRole("light")[0].tag}, перенесённый на это пространство.`]);
    else add(LIGHT[light]);
    add(TAKE[take]);
    add(CAMERA[camera]);
  }

  // STAGES
  if (mode === "edit") {
    head("EDIT SCOPE:", "ОБЪЁМ ПРАВКИ:");
    add(["Keep timing, cuts, camera movement, people, faces, expressions, lips, hands, clothing and the original audio unchanged unless the idea says otherwise. New elements match the source perspective, exposure, color temperature and depth of field; stable edges on hair and clothing, no halos, no flicker.",
         "Сохранить тайминг, склейки, движение камеры, людей, лица, мимику, губы, руки, одежду и исходный звук, если идея не говорит иного. Новые элементы согласованы с перспективой, экспозицией, цветовой температурой и глубиной резкости исходника; края волос и одежды стабильны, без ореолов и мерцания."]);
  } else {
    head("TIMELINE:", "ХРОНОМЕТРАЖ:");
    stages(dur, mode, ending).forEach((s) => add(s));
  }

  // AUDIO
  head("AUDIO:", "ЗВУК:");
  if (!sound) {
    add(["Silent video, no generated audio.", "Немой ролик, без сгенерированного звука."]);
  } else {
    add(["Diegetic ambience and action sounds tied to the on-screen events.", "Фоновая атмосфера и звуки действий, привязанные к событиям в кадре."]);
    const mus = byRole("music")[0];
    if (mus) add([`Music: ${mus.tag}.`, `Музыка: ${mus.tag}.`]);
    else if (music === "none") add(["No background music.", "Без фоновой музыки."]);
    else add(["Subtle background score matching the mood, lower than the action sounds.", "Ненавязчивая фоновая музыка по настроению, тише звуков действия."]);
    if (speech) {
      const voice = byRole("voice")[0];
      const startAt = Math.max(1, Math.round(dur * 0.3));
      add([`Dialogue: one speaker, the main character, says in Russian at about ${startAt}s: «${speech}». Calm natural delivery, lips synced to the words${voice ? `, voice timbre from ${voice.tag}` : ""}.`,
           `Речь: говорит один герой, главный, примерно с ${startAt}-й секунды, по-русски: «${speech}». Спокойная естественная подача, губы синхронизированы со словами${voice ? `, тембр голоса из ${voice.tag}` : ""}.`]);
    }
  }

  // CONTINUITY
  head("CONTINUITY:", "НЕПРЕРЫВНОСТЬ:");
  if (identity.length) add([`The character from ${identity[0].tag} stays identical in every frame: face, skin texture, moles and freckles, hair, body proportions and clothing.`,
                            `Герой из ${identity[0].tag} одинаков в каждом кадре: лицо, фактура кожи, родинки и веснушки, волосы, пропорции тела и одежда.`]);
  add(["Characters, props and who holds them, positions in space, time of day and lighting stay consistent; no morphing of faces, hands or architecture.",
       "Герои, реквизит и его владельцы, положение в пространстве, время суток и свет остаются согласованными; без морфинга лиц, рук и архитектуры."]);
  if (realism) {
    const r = light === "sun" || light === "night" ? REALISM_HARD : REALISM_FULL;
    add([`Realism: ${r[0]}`, `Реализм: ${r[1]}`]);
  }

  // CONSTRAINTS
  head("CONSTRAINTS:", "ОГРАНИЧЕНИЯ:");
  const c = [["no extra people", "без лишних людей"], ["no flicker", "без мерцания"]];
  if (noText) c.unshift(["no on-screen text, subtitles or watermarks", "без надписей, субтитров и водяных знаков"]);
  if (take === "one") c.push(["no cuts", "без склеек"]);
  const cap = (t) => t[0].toUpperCase() + t.slice(1);
  add([cap(c.map((x) => x[0]).join(", ")) + ".", cap(c.map((x) => x[1]).join(", ")) + "."]);

  return { en: en.join("\n").trim(), ru: ru.join("\n").trim(), tagged };
}

function stages(dur, mode, ending) {
  const n = dur <= 6 ? 1 : dur <= 10 ? 2 : dur <= 15 ? 3 : 4;
  const cuts = [0];
  for (let i = 1; i < n; i++) cuts.push(Math.round((dur * i) / n));
  cuts.push(dur);
  const endEn = ending ? `End state: «${ending}»; the final frame holds for a beat.` : "End state: the action is complete and the final composition holds for a beat.";
  const endRu = ending ? `Финал: «${ending}»; последний кадр держится мгновение.` : "Финал: действие завершено, итоговая композиция держится мгновение.";
  const startEn = mode === "i2v" || mode === "flf" ? "starts exactly from the first frame" : mode === "extend" ? "continues from the source's last frame" : "establish the location and the subject in the starting pose";
  const startRu = mode === "i2v" || mode === "flf" ? "начинается точно с первого кадра" : mode === "extend" ? "продолжает последний кадр исходника" : "показать локацию и героя в начальной позе";
  const tpl = {
    1: [[`Initial state: ${startEn}. Primary event: the idea happens as one readable action. ${endEn}`, `Начало: ${startRu}. Главное событие: идея как одно читаемое действие. ${endRu}`]],
    2: [[`Opening: ${startEn}; the action from the idea begins.`, `Начало: ${startRu}; действие из идеи начинается.`],
        [`Main event and resolution: the action completes readably. ${endEn}`, `Главное событие и развязка: действие читаемо завершается. ${endRu}`]],
    3: [[`Opening: ${startEn}.`, `Начало: ${startRu}.`],
        ["Main event: the action from the idea happens as one clear event.", "Главное событие: действие из идеи как одно ясное событие."],
        [`Resolution: ${endEn}`, `Развязка: ${endRu}`]],
    4: [[`Hook: ${startEn}.`, `Хук: ${startRu}.`],
        ["Development: the action from the idea begins and builds.", "Развитие: действие из идеи начинается и нарастает."],
        ["Peak: the key moment, one clear event.", "Кульминация: ключевой момент, одно ясное событие."],
        [`Resolution: ${endEn}`, `Развязка: ${endRu}`]],
  }[n];
  return tpl.map((p, i) => [`${cuts[i]}–${cuts[i + 1]}s: ${p[0]}`, `${cuts[i]}–${cuts[i + 1]} с: ${p[1]}`]);
}

function usableFiles() {
  const m = model();
  const counters = { image: 0, video: 0, audio: 0 };
  return state.files.filter((f) => {
    counters[f.type]++;
    return f.role && counters[f.type] <= m.limits[f.type];
  });
}

/* ---------- Проверки ---------- */

function runChecks(tagged) {
  const m = model();
  const out = [];
  const count = (t) => state.files.filter((f) => f.type === t).length;
  ["image", "video", "audio"].forEach((t) => {
    if (count(t) > m.limits[t]) out.push(["warn", "Лимит", m.limits[t] === 0
      ? `${m.name} не принимает ${TYPE_RU[t]}. Эти файлы не попали в промпт.`
      : `${TYPE_RU[t]}: загружено ${count(t)}, а ${m.name} принимает до ${m.limits[t]}. Лишние не попали в промпт.`]);
  });
  if (state.files.length > m.limits.total) out.push(["warn", "Лимит", `Всего файлов ${state.files.length}, у ${m.name} до ${m.limits.total}.`]);
  const need = MODES[state.mode].needs || {};
  Object.entries(need).forEach(([t, n]) => {
    if (tagged.filter((f) => f.type === t).length < n) out.push(["warn", "Режим", `Для режима «${MODES[state.mode].label}» нужно ${t === "image" ? "фото" : "видео"}: минимум ${n}.`]);
  });
  const dup = (r) => tagged.filter((f) => f.role === r).length > 1;
  if (dup("first_frame")) out.push(["warn", "Роли", "Первый кадр назначен двум файлам. Оставьте один."]);
  if (dup("last_frame")) out.push(["warn", "Роли", "Последний кадр назначен двум файлам. Оставьте один."]);
  if (!$("idea").value.trim()) out.push(["warn", "Идея", "Опишите, что должно произойти: без этого промпт будет с пустым местом."]);
  if ($("speech").value.trim() && !$("sound").checked) out.push(["warn", "Звук", "Есть реплика, но звук выключен. Реплика не попала в промпт."]);
  if (!out.some((x) => x[0] === "warn")) out.push(["ok", "Готово", "Теги, роли и лимиты согласованы с карточкой модели."]);
  m.notes.forEach((n) => out.push(["info", "Модель", n]));
  out.push(["info", "Статус", "Карточка модели собрана по вторичным источникам 08.11.2026; сверьте лимиты в SYNTX."]);
  return out;
}

/* ---------- Правая панель ---------- */

function highlight(text) {
  return esc(text)
    .replace(/(@(?:image|video|audio|Image|Video|Audio)\d+)/g, '<span class="t">$1</span>')
    .replace(/^([A-ZА-ЯЁ ]{4,}:)/gm, '<span class="h">$1</span>');
}

function render() {
  normalizeRoles();
  renderFiles();
  const m = model();
  const { en, ru, tagged } = buildPrompt();

  $("outEyebrow").textContent = `${m.name} · ${MODES[state.mode].label} · ${$("duration").value} сек · ${$("aspect").value}`;
  const idea = $("idea").value.trim();
  $("outTitle").textContent = idea ? (idea.length > 70 ? idea.slice(0, 68) + "…" : idea) : "Промпт";

  $("checks").innerHTML = runChecks(tagged).map(([k, b, t]) => `<div class="check ${k}"><b>${b}</b><span>${esc(t)}</span></div>`).join("");

  const settings = [
    ["Модель", m.name],
    ["Режим", MODES[state.mode].label],
    ["Длительность", `${$("duration").value} сек`],
    ["Формат", state.mode === "extend" ? "как у исходника" : $("aspect").value],
    ["Звук", $("sound").checked ? "включён" : "выключен"],
  ];
  $("settingsList").innerHTML = settings.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("");

  $("uploadOrder").innerHTML = tagged.length
    ? ["image", "video", "audio"].flatMap((t) => tagged.filter((f) => f.type === t))
        .map((f) => `<li><code>${f.tag}</code> ${esc(f.name)} — ${ROLES[f.type][f.role].label.toLowerCase()}</li>`).join("")
    : `<li class="empty">Файлов нет: промпт только по тексту.</li>`;

  const showEn = $("outEn").checked, showRu = $("outRu").checked;
  $("enCard").hidden = !showEn;
  $("ruCard").hidden = !showRu;
  $("enText").innerHTML = highlight(en);
  $("ruText").innerHTML = highlight(ru);
  $("enText").dataset.raw = en;
  $("ruText").dataset.raw = ru;
  $("enCount").textContent = `${en.length} симв.`;
  $("ruCount").textContent = `${ru.length} симв.`;
}

/* ---------- События ---------- */

function addFiles(list) {
  [...list].forEach((file) => {
    const type = typeOfFile(file);
    if (!type) return;
    state.files.push({ id: ++uid, type, name: file.name, role: null, roleTouched: false, url: URL.createObjectURL(file) });
  });
  render();
}

function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove("show"), 1600);
}

async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast("Скопировано"); }
  catch { toast("Не удалось скопировать: выделите текст вручную"); }
}

function bind() {
  $("modelGrid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-id]");
    if (!b) return;
    state.model = b.dataset.id;
    renderModels(); renderModes(); renderSelects(); render();
  });
  $("modeChips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-mode]");
    if (!b) return;
    state.mode = b.dataset.mode;
    renderModes(); render();
  });
  $("fileInput").addEventListener("change", (e) => { addFiles(e.target.files); e.target.value = ""; });
  const dz = $("dropzone");
  ["dragenter", "dragover"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add("drag"); }));
  ["dragleave", "drop"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove("drag"); }));
  dz.addEventListener("drop", (e) => addFiles(e.dataTransfer.files));

  $("fileList").addEventListener("click", (e) => {
    const del = e.target.closest("[data-del]");
    const up = e.target.closest("[data-up]");
    if (del) {
      const f = state.files.find((x) => x.id === Number(del.dataset.del));
      if (f && f.url) URL.revokeObjectURL(f.url);
      state.files = state.files.filter((x) => x !== f);
      render();
    } else if (up) {
      const i = Number(up.dataset.up);
      if (i > 0) { [state.files[i - 1], state.files[i]] = [state.files[i], state.files[i - 1]]; render(); }
    }
  });
  $("fileList").addEventListener("change", (e) => {
    const sel = e.target.closest("[data-role]");
    if (!sel) return;
    const f = state.files.find((x) => x.id === Number(sel.dataset.role));
    f.role = sel.value; f.roleTouched = true;
    render();
  });

  $("brief").addEventListener("input", render);
  $("brief").addEventListener("change", render);
  $("brief").addEventListener("submit", (e) => {
    e.preventDefault();
    render();
    if (window.matchMedia("(max-width: 900px)").matches) document.querySelector(".panel-output").scrollIntoView({ behavior: "smooth" });
    toast("Промпт собран");
  });

  document.querySelectorAll("[data-copy]").forEach((b) => b.addEventListener("click", () => copy($(b.dataset.copy).dataset.raw)));
  $("copyAll").addEventListener("click", () => {
    const parts = [];
    if ($("outEn").checked) parts.push($("enText").dataset.raw);
    if ($("outRu").checked) parts.push($("ruText").dataset.raw);
    copy(parts.join("\n\n———\n\n"));
  });
}

/* ---------- Пример при открытии ---------- */

function loadDemo() {
  $("idea").value = "Девушка щёлкает пальцами, и пустая светлая комната превращается в готовый уютный интерьер";
  $("ending").value = "Девушка стоит в центре готовой гостиной и смотрит в камеру";
  $("speech").value = "Вот теперь можно жить";
  $("take").value = "transform";
  $("light").value = "window";
  $("camera").value = "pull";
  state.files = [
    { id: ++uid, type: "image", name: "face_front.jpg", role: null, roleTouched: false, demo: true },
    { id: ++uid, type: "image", name: "empty_room.jpg", role: null, roleTouched: false, demo: true },
    { id: ++uid, type: "audio", name: "music_beat.mp3", role: "music", roleTouched: true, demo: true },
  ];
}

renderModels();
renderModes();
renderSelects();
loadDemo();
bind();
render();
