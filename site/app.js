/* Prompt Atelier · прототип 0.1
   Сборка промпта по правилам knowledge/prompt_service_knowledge_base.md без ИИ.
   В рабочей версии функция buildPrompt() будет отдавать бриф языковой модели (см. docs/ARCHITECTURE.md). */

const $ = (id) => document.getElementById(id);

const state = {
  model: "seedance-2-5",
  mode: "t2v",
  style: "real",
  inputMode: "free",
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

const TIME_PHR = {
  dawn: ["at dawn", "на рассвете"], day: ["during the day", "днём"], golden: ["at sunset, golden hour", "на закате, в золотой час"], night: ["at night", "ночью"],
};

function readForm() {
  return {
    dur: Number($("duration").value), aspect: $("aspect").value,
    idea: $("idea").value.trim(), ending: $("ending").value.trim(), speech: $("speech").value.trim(),
    light: $("light").value, camera: $("camera").value, take: $("take").value, music: $("music").value,
    sound: $("sound").checked, noText: $("noText").checked,
    style: state.style, rig: $("rig").value, bg: $("bg").value, toon: $("toon").value,
    macro: $("macro").checked, infer: $("infer").checked,
    inputMode: state.inputMode,
    fields: Object.fromEntries(["subject", "action", "scene", "light", "camera", "style", "detail", "sound"].map((k) => [k, $("p_" + k).value.trim()])),
  };
}

/* Итог разбора с учётом переключателя «додумывать» */
const sceneTest = (low) => [PLACES, SEASONS, WEATHER, TIMES].some((list) => list.some((x) => x.re.test(low)));

function scene(f) {
  const route = f.inputMode === "free" ? routeIdea(f.idea, sceneTest) : routeFields(f.fields);
  const fullText = f.inputMode === "free" ? f.idea : Object.values(f.fields).join(". ");
  const a = analyzeIdea(fullText);
  a.route = route;
  a.world = route.flags.world;
  if (!f.infer) {
    if (a.seasonInferred) a.season = null;
    if (a.weatherInferred) a.weather = null;
    if (a.timeInferred) a.time = null;
  }
  a.rigId = f.style === "real" ? (f.rig === "auto" ? autoRig(a, f.aspect) : f.rig) : null;
  return a;
}

function buildPrompt() {
  const m = model();
  const mode = state.mode;
  const f = readForm();
  const a = scene(f);
  const real = f.style === "real";
  const toon = TOON[f.toon];

  const en = [], ru = [];
  const add = (pair) => { en.push(pair[0]); ru.push(pair[1]); };
  const head = (e, r) => add([`\n${e}`, `\n${r}`]);

  const tagged = usableFiles().map((x) => ({ ...x, tag: tagFor(x) }));
  const byRole = (r) => tagged.filter((x) => x.role === r);
  const identity = byRole("identity");
  const product = byRole("product")[0];
  const location = byRole("location")[0];
  const editSrc = byRole("edit_source")[0];
  const extendSrc = byRole("extend_source")[0];
  const hero = a.subjects[0];
  const human = a.subjects.some((x) => x.kind === "human") || identity.length > 0;

  // GOAL
  const kindEn = real ? "photorealistic live-action" : `${toon.label === "3D-анимация" ? "stylized 3D animated" : toon.label === "Аниме" ? "anime-style 2D animated" : toon.label === "Пластилин / стоп-моушен" ? "claymation stop-motion" : toon.label === "Книжная иллюстрация" ? "animated storybook illustration" : "hand-drawn 2D animated"}`;
  const kindRu = real ? "фотореалистичный, как живая съёмка" : toon.label.toLowerCase();
  if (mode === "edit" && editSrc) {
    add([`GOAL: Edit ${editSrc.tag}. Change only what the action below describes; everything else stays as in the source.`,
         `ЦЕЛЬ: Отредактировать ${editSrc.tag}. Изменить только то, что описано в действии ниже; всё остальное как в исходнике.`]);
  } else if (mode === "extend" && extendSrc) {
    add([`GOAL: Extend ${extendSrc.tag} by ${f.dur} seconds in the same look and format.`, `ЦЕЛЬ: Продлить ${extendSrc.tag} на ${f.dur} секунд в том же виде и формате.`]);
  } else {
    add([`GOAL: A ${f.dur}-second ${f.aspect} ${kindEn} video, ${MODES[mode].en}.`, `ЦЕЛЬ: Ролик ${f.dur} секунд, ${f.aspect}, ${kindRu}, режим «${MODES[mode].label.toLowerCase()}».`]);
  }

  // SUBJECT + ACTION
  head("SUBJECT:", "ГЕРОЙ:");
  if (identity.length) add([`The main character is the person from ${identity[0].tag}.`, `Главный герой — человек из ${identity[0].tag}.`]);
  else if (product) add([`The hero object is the product from ${product.tag}.`, `Главный объект — предмет из ${product.tag}.`]);
  const describe = (x, lead) => {
    const look = real ? x.texture : x.toon;
    if (real || !look) add([`${lead[0]}${x.en}${look ? ": " + look[0] : ""}.`, `${lead[1]}${x.ru}${look ? ": " + look[1] : ""}.`]);
    else add([`${lead[0]}${look[0]}.`, `${lead[1]}${look[1]}.`]);
  };
  if (hero && !(identity.length && hero.kind === "human")) describe(hero, ["Main character: ", "Главный герой: "]);
  a.subjects.slice(1).filter((x) => x.kind !== "human" || !identity.length).forEach((x) => describe(x, ["Second character: ", "Второй персонаж: "]));
  if (!hero && !identity.length && !product) add(["The main subject as described in the action.", "Главный герой — как описан в действии."]);
  const R = a.route.buckets;
  const notes = (arr) => arr.join(". ");
  if (R.wardrobe.length) add([`Appearance and wardrobe (author's notes, in Russian): «${notes(R.wardrobe)}».`, `Внешность и одежда: «${notes(R.wardrobe)}».`]);
  if (a.world && human) add(a.world.wardrobe);
  head("ACTION:", "ДЕЙСТВИЕ:");
  add([`In the author's words, in Russian: «${notes(R.action) || "опишите событие"}».`, `«${notes(R.action) || "опишите событие"}».`]);

  // REFERENCES
  if (tagged.length) {
    head("REFERENCES:", "РЕФЕРЕНСЫ:");
    tagged.forEach((x) => { const p = roleLine(x.type, x.role, x.tag, { duration: f.dur }); add([`- ${p[0]}`, `- ${p[1]}`]); });
    if (identity.length > 1) add([`- ${identity.map((x) => x.tag).join(" and ")} show the same one person.`, `- ${identity.map((x) => x.tag).join(" и ")} — один и тот же человек.`]);
  }

  if (mode === "edit") {
    head("EDIT SCOPE:", "ОБЪЁМ ПРАВКИ:");
    add(["Keep timing, cuts, camera movement, people, faces, expressions, lips, hands, clothing and the original audio unchanged unless the action says otherwise. New elements match the source perspective, exposure, color temperature and depth of field; stable edges on hair and clothing, no halos, no flicker.",
         "Сохранить тайминг, склейки, движение камеры, людей, лица, мимику, губы, руки, одежду и исходный звук, если действие не говорит иного. Новые элементы согласованы с перспективой, экспозицией, цветовой температурой и глубиной резкости исходника; края волос и одежды стабильны, без ореолов и мерцания."]);
  } else {
    // SCENE
    head("SCENE:", "СЦЕНА:");
    const parts = [];
    if (location) parts.push([`the location from ${location.tag}`, `локация из ${location.tag}`]);
    else if (a.place) parts.push([a.place.en, a.place.ru]);
    else if (a.world && a.world.place) parts.push(a.world.place);
    else if (f.infer) parts.push(["an environment that fits the action, with real scale and consistent perspective", "окружение, подходящее под действие, с реальным масштабом и согласованной перспективой"]);
    if (a.season) parts.push([a.season.en, a.season.ru]);
    if (a.weather) parts.push([a.weather.en, a.weather.ru]);
    if (parts.length) add([cap(parts.map((x) => x[0]).join("; ")) + (a.time ? `, ${TIME_PHR[a.time.id][0]}` : "") + ".", cap(parts.map((x) => x[1]).join("; ")) + (a.time ? `, ${TIME_PHR[a.time.id][1]}` : "") + "."]);
    if (R.scene.length) add([`Author's notes on the place: «${notes(R.scene)}».`, `Уточнения автора о месте: «${notes(R.scene)}».`]);
    const inter = interactions(a);
    if (inter.length) add([`Physical details: ${inter.map((x) => x[0]).join("; ")}.`, `Физические детали: ${inter.map((x) => x[1]).join("; ")}.`]);

    // LIGHT
    head("LIGHT:", "СВЕТ:");
    if (R.light.length) add([`Author's notes: «${notes(R.light)}».`, `Пожелания автора: «${notes(R.light)}».`]);
    if (byRole("light").length) add([`Lighting follows ${byRole("light")[0].tag}, adapted to this space.`, `Свет по ${byRole("light")[0].tag}, перенесённый на это пространство.`]);
    else if (f.light !== "auto") add(LIGHT[f.light]);
    else if (a.time || a.place || a.season) add(autoLight({ ...a, time: a.time || { id: "day" } }));
    else add(LIGHT.auto);

    // CAMERA
    head("CAMERA:", "КАМЕРА:");
    const camNote = notes(R.camera).toLowerCase();
    if (R.camera.length) add([`Author's notes: «${notes(R.camera)}».`, `Пожелания автора: «${notes(R.camera)}».`]);
    if (real) {
      const userLens = /мм|mm|объектив|диафрагм|f\//.test(camNote);
      cameraLines(a, a.rigId, f.bg).filter((x) => !(userLens && /^(Lens|Aperture)/.test(x[0]))).forEach((x) => add(x));
    } else {
      add([`Camera: ${toon.camera}.`, `Камера: ${toon.cameraRu}.`]);
    }
    const userMove = /наезд|отъезд|облёт|облет|статич|с рук|дрон|кран|панорам|след|сопровожд|бежит за|едет|летит за|за ним|за ней|fpv/.test(camNote);
    if (!userMove) { const mv = f.camera !== "auto" ? CAMERA[f.camera] : autoCamera(a); add([`Movement: ${mv[0]}`, `Движение: ${mv[1]}`]); }
    add([`Editing: ${TAKE[f.take][0]}`, `Монтаж: ${TAKE[f.take][1]}`]);

    // STYLE
    head("STYLE:", "СТИЛЬ:");
    if (real) {
      add(["Photorealistic live-action footage: real-world physics, scale and materials, natural color grade without oversaturation, natural motion blur at a 180-degree shutter.",
           "Фотореалистичная живая съёмка: реальная физика, масштаб и материалы, естественная цветокоррекция без перенасыщения, естественное размытие движения при затворе 180°."]);
    } else {
      add(toon.style);
      add(toon.motion);
    }
    if (a.world) add(a.world.look);
    const ownStyle = R.style.filter((x) => !(a.world && a.world.re.test(x.toLowerCase())));
    if (ownStyle.length) add([`Author's style notes: «${ownStyle.join(". ")}».`, `Пожелания автора по стилю: «${ownStyle.join(". ")}».`]);
    if (a.route.flags.quality) add(["Crisp fine detail throughout, clean high-resolution image without artifacts.", "Чёткая мелкая детализация во всём кадре, чистое изображение высокого разрешения без артефактов."]);

    // DETAIL
    const det = [];
    if (R.detail.length) det.push([`Author's notes: «${notes(R.detail)}».`, `Пожелания автора: «${notes(R.detail)}».`]);
    if (real && human) det.push(light2(f.light, a, isBlur(a, a.rigId, f.bg)));
    if (f.macro) { const md = microDetail(a, f.take === "cuts"); if (md) det.push(md); }
    if (det.length) { head("DETAIL:", "ДЕТАЛИ:"); det.forEach((d) => add(d)); }

    // TIMELINE
    head("TIMELINE:", "ХРОНОМЕТРАЖ:");
    stages(f.dur, mode, f.ending || notes(R.ending), a, f.macro && f.take === "cuts").forEach((st) => add(st));
  }

  // AUDIO
  head("AUDIO:", "ЗВУК:");
  if (!f.sound) add(["Silent video, no generated audio.", "Немой ролик, без сгенерированного звука."]);
  else {
    const amb = [];
    if (a.place && a.place.sound) amb.push(a.place.sound);
    if (a.weather && ["rain", "storm", "blizzard"].includes(a.weather.id)) amb.push({ rain: ["steady rain patter", "ровный шум дождя"], storm: ["rolling thunder", "раскаты грома"], blizzard: ["roaring wind and hissing snow", "рёв ветра и шорох снега"] }[a.weather.id]);
    a.subjects.forEach((x) => x.sound && amb.push(x.sound));
    if (amb.length) add([`Ambience and effects: ${amb.map((x) => x[0]).join(", ")}; each sound tied to its on-screen source.`, `Атмосфера и эффекты: ${amb.map((x) => x[1]).join(", ")}; каждый звук привязан к источнику в кадре.`]);
    else add(["Diegetic ambience and action sounds tied to the on-screen events.", "Фоновая атмосфера и звуки действий, привязанные к событиям в кадре."]);
    if (a.route.buckets.sound.length) add([`Author's notes: «${a.route.buckets.sound.join(". ")}».`, `Пожелания автора: «${a.route.buckets.sound.join(". ")}».`]);
    const mus = byRole("music")[0];
    if (mus) add([`Music: ${mus.tag}.`, `Музыка: ${mus.tag}.`]);
    else if (f.music === "none") add(["No background music.", "Без фоновой музыки."]);
    else add([real ? "Subtle cinematic score matching the mood, lower than the effects." : "Playful animated-film score matching the mood, lower than the effects.", real ? "Ненавязчивая кинематографичная музыка по настроению, тише эффектов." : "Игривая музыка в духе мультфильма по настроению, тише эффектов."]);
    if (f.speech) {
      const voice = byRole("voice")[0];
      const startAt = Math.max(1, Math.round(f.dur * 0.3));
      add([`Dialogue: one speaker, the main character, says in Russian at about ${startAt}s: «${f.speech}». Natural delivery, lips synced to the words${voice ? `, voice timbre from ${voice.tag}` : ""}.`,
           `Речь: говорит один герой, главный, примерно с ${startAt}-й секунды, по-русски: «${f.speech}». Естественная подача, губы синхронизированы со словами${voice ? `, тембр голоса из ${voice.tag}` : ""}.`]);
    }
  }

  // CONTINUITY
  head("CONTINUITY:", "НЕПРЕРЫВНОСТЬ:");
  if (identity.length) add([`The character from ${identity[0].tag} stays identical in every frame: face, ${real ? "skin texture, moles and freckles, " : ""}hair, body proportions and clothing.`,
                            `Герой из ${identity[0].tag} одинаков в каждом кадре: лицо, ${real ? "фактура кожи, родинки и веснушки, " : ""}волосы, пропорции тела и одежда.`]);
  else if (hero) {
    const the = cap(hero.en.replace(/^(an?|a pair of) /, "the "));
    if (hero.kind === "human") add([`${the} keeps the same face, hair, body proportions and clothing in every frame.`, `${cap(hero.ru)}: одинаковые лицо, волосы, пропорции тела и одежда в каждом кадре.`]);
    else if (hero.kind === "product") add([`${the} keeps its exact shape, proportions, colors, materials and label in every frame.`, `${cap(hero.ru)}: точная форма, пропорции, цвета, материалы и этикетка в каждом кадре.`]);
    else add([`${the} keeps the same design, size, colors and markings in every frame.`, `${cap(hero.ru)}: одинаковые облик, размер, цвета и отметины в каждом кадре.`]);
  }
  add(["Props and who holds them, positions in space, time of day and lighting stay consistent; no morphing of faces, bodies or architecture.",
       "Реквизит и его владельцы, положение в пространстве, время суток и свет остаются согласованными; без морфинга лиц, тел и архитектуры."]);

  // CONSTRAINTS
  head("CONSTRAINTS:", "ОГРАНИЧЕНИЯ:");
  const c = [["no extra people or animals", "без лишних людей и животных"], ["no flicker", "без мерцания"]];
  if (f.noText) c.unshift(["no on-screen text, subtitles or watermarks", "без надписей, субтитров и водяных знаков"]);
  if (f.take === "one") c.push(["no cuts", "без склеек"]);
  if (real) c.push(["no CGI look, no plastic textures", "без CGI-вида и пластиковых фактур"]);
  else c.push(toon.neg);
  add([cap(c.map((x) => x[0]).join(", ")) + ".", cap(c.map((x) => x[1]).join(", ")) + "."]);

  return { en: en.join("\n").trim(), ru: ru.join("\n").trim(), tagged, a, f };
}

function cap(t) { return t ? t[0].toUpperCase() + t.slice(1) : t; }

/* Блок реализма Лизы (раздел 7): при жёстком или ночном свете без «мягкого рассеянного» */
function light2(lightPreset, a, blur) {
  const hard = lightPreset === "sun" || lightPreset === "night" || (lightPreset === "auto" && a.time && a.time.id === "night");
  let r = hard ? REALISM_HARD : REALISM_FULL;
  if (!blur) r = [r[0].replace("shallow depth of field, ", ""), r[1].replace("малая глубина резкости, ", "")];
  return [`Realism: ${r[0]}`, `Реализм: ${r[1]}`];
}

function stages(dur, mode, ending, a, macroShot) {
  const n = dur <= 6 ? 1 : dur <= 10 ? 2 : dur <= 15 ? 3 : 4;
  const cuts = [0];
  for (let i = 1; i < n; i++) cuts.push(Math.round((dur * i) / n));
  cuts.push(dur);
  const who = a.subjects[0] ? [a.subjects[0].en.replace(/^(an?|a pair of) /, "the "), a.subjects[0].ru] : ["the subject", "герой"];
  const where = a.place ? [a.place.en.split(":")[0], a.place.ru.split(":")[0]] : ["the location", "место действия"];
  const isProduct = a.subjects[0] && a.subjects[0].kind === "product";
  const endEn = ending ? `End state: «${ending}»; the final frame holds for a beat.` : isProduct ? `End state: ${who[0]} rests in its best hero angle, fully readable, and the frame holds for a beat.` : `End state: the action is complete, ${who[0]} settles into a clear final pose and the composition holds for a beat.`;
  const endRu = ending ? `Финал: «${ending}»; последний кадр держится мгновение.` : isProduct ? `Финал: ${who[1]} в лучшем ракурсе, полностью читается, кадр держится мгновение.` : `Финал: действие завершено, ${who[1]} замирает в ясной итоговой позе, композиция держится мгновение.`;
  const startEn = mode === "i2v" || mode === "flf" ? "the shot starts exactly from the first frame" : mode === "extend" ? "continue seamlessly from the source's last frame" : `establish ${where[0]} and ${who[0]} in the starting position`;
  const startRu = mode === "i2v" || mode === "flf" ? "кадр начинается точно с первого кадра" : mode === "extend" ? "бесшовно продолжить последний кадр исходника" : `показать: ${where[1]}, ${who[1]} в начальном положении`;
  const peakEn = macroShot ? "the key moment of the action, with a short macro insert of the detail" : "the key moment of the action, one clear readable event";
  const peakRu = macroShot ? "ключевой момент действия с короткой макровставкой детали" : "ключевой момент действия, одно ясное читаемое событие";
  const tpl = {
    1: [[`Initial state: ${startEn}. Primary event: the action happens as one readable move. ${endEn}`, `Начало: ${startRu}. Главное событие: действие одним читаемым движением. ${endRu}`]],
    2: [[`Opening: ${startEn}; the action begins.`, `Начало: ${startRu}; действие начинается.`],
        [`Main event and resolution: ${peakEn}. ${endEn}`, `Главное событие и развязка: ${peakRu}. ${endRu}`]],
    3: [[`Opening: ${startEn}.`, `Начало: ${startRu}.`],
        [`Main event: ${peakEn}.`, `Главное событие: ${peakRu}.`],
        [`Resolution: ${endEn}`, `Развязка: ${endRu}`]],
    4: [[`Hook: ${startEn}, something immediately catches the eye.`, `Хук: ${startRu}, сразу что-то цепляет взгляд.`],
        [`Development: ${who[0]} begins the action and it builds.`, `Развитие: ${who[1]} начинает действие, оно нарастает.`],
        [`Peak: ${peakEn}.`, `Кульминация: ${peakRu}.`],
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
  if (!(state.inputMode === "free" ? $("idea").value : $("p_action").value).trim()) out.push(["warn", "Идея", "Опишите, что должно произойти: без этого промпт будет с пустым местом."]);
  if ($("speech").value.trim() && !$("sound").checked) out.push(["warn", "Звук", "Есть реплика, но звук выключен. Реплика не попала в промпт."]);
  if (!out.some((x) => x[0] === "warn")) out.push(["ok", "Готово", "Теги, роли и лимиты согласованы с карточкой модели."]);
  m.notes.forEach((n) => out.push(["info", "Модель", n]));
  out.push(["info", "Статус", "Карточка модели собрана по вторичным источникам 08.11.2026; сверьте лимиты в SYNTX."]);
  return out;
}

/* ---------- Правая панель ---------- */

function renderFacts(a, f) {
  const chip = (k, v, guess) => `<span class="fact ${guess ? "guess" : ""}"><span>${k}</span>${esc(v)}</span>`;
  const none = (k, v) => `<span class="fact none"><span>${k}</span>${v}</span>`;
  const out = [];
  out.push(a.place ? chip("Место", a.place.label) : a.world && a.world.place ? chip("Место", "по миру", true) : none("Место", "не найдено"));
  if (a.season) out.push(chip("Сезон", a.season.label, a.seasonInferred));
  if (a.time) out.push(chip("Время", a.time.label, a.timeInferred));
  if (a.weather) out.push(chip("Погода", a.weather.label, a.weatherInferred));
  out.push(a.subjects.length ? chip("Герой", a.subjects.map((x) => x.label).join(", ")) : none("Герой", "не найден"));
  if (a.genre) out.push(chip("Жанр", a.genre.label));
  if (a.world) out.push(chip("Мир", a.world.label));
  if (a.route.flags.quality) out.push(chip("Качество", `${a.route.flags.quality} → в настройки`));
  const R = a.route.buckets;
  const names = { action: "действие", wardrobe: "герой", scene: "место", light: "свет", camera: "камера", style: "стиль", detail: "детали", sound: "звук", ending: "финал" };
  if (f.inputMode === "free") {
    const routed = Object.entries(R).filter(([k, v]) => v.length && k !== "action").map(([k]) => names[k]);
    if (routed.length) out.push(chip("Разложено", "действие + " + routed.join(", ")));
  }
  if (f.style === "real") {
    out.push(chip("Съёмка", RIGS[a.rigId].label, f.rig === "auto"));
  } else out.push(chip("Анимация", TOON[f.toon].label));
  $("facts").innerHTML = out.join("");
}

function highlight(text) {
  return esc(text)
    .replace(/(@(?:image|video|audio|Image|Video|Audio)\d+)/g, '<span class="t">$1</span>')
    .replace(/^([A-ZА-ЯЁ ]{4,}:)/gm, '<span class="h">$1</span>');
}

function render() {
  normalizeRoles();
  renderFiles();
  const m = model();
  const { en, ru, tagged, a, f } = buildPrompt();
  renderFacts(a, f);

  $("outEyebrow").textContent = `${m.name} · ${MODES[state.mode].label} · ${$("duration").value} сек · ${$("aspect").value}`;
  const idea = (state.inputMode === "free" ? $("idea").value : $("p_action").value || $("p_subject").value).trim();
  $("outTitle").textContent = idea ? (idea.length > 70 ? idea.slice(0, 68) + "…" : idea) : "Промпт";

  const styleWarn = [];
  if (f.style === "real" && a.route.flags.wantToon && !a.route.flags.wantReal) styleWarn.push(["warn", "Стиль", "В тексте похоже на мультфильм, а выбран «Реализм». Переключите стиль, если нужен мультфильм."]);
  if (f.style === "toon" && a.route.flags.wantReal && !a.route.flags.wantToon) styleWarn.push(["warn", "Стиль", "В тексте указан реализм, а выбран «Мультфильм». Переключите стиль, если нужна живая съёмка."]);
  $("checks").innerHTML = styleWarn.concat(runChecks(tagged)).map(([k, b, t]) => `<div class="check ${k}"><b>${b}</b><span>${esc(t)}</span></div>`).join("");

  const settings = [
    ["Модель", m.name],
    ["Режим", MODES[state.mode].label],
    ["Длительность", `${$("duration").value} сек`],
    ["Формат", state.mode === "extend" ? "как у исходника" : $("aspect").value],
    ["Звук", $("sound").checked ? "включён" : "выключен"],
  ];
  if (a.route.flags.quality) settings.push(["Разрешение", `${a.route.flags.quality}, если модель поддерживает (слово в промпте качество не меняет)`]);
  $("settingsList").innerHTML = settings.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("");

  $("uploadOrder").innerHTML = tagged.length
    ? ["image", "video", "audio"].flatMap((t) => tagged.filter((f) => f.type === t))
        .map((f) => `<li><code>${f.tag}</code> ${esc(f.name)} — ${ROLES[f.type][f.role].label.toLowerCase()}</li>`).join("")
    : `<li class="empty">Файлов нет: промпт только по тексту.</li>`;

  const showEn = $("outEn").checked, showRu = $("outRu").checked;
  $("enCard").hidden = !showEn;
  $("ruCard").hidden = !showRu;
  showPrompt(en, ru);
}

function showPrompt(en, ru) {
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

  document.querySelector(".seg-style").addEventListener("click", (e) => {
    const b = e.target.closest("[data-style]");
    if (!b) return;
    state.style = b.dataset.style;
    document.querySelectorAll(".seg-style .seg-btn").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
    $("realOpts").hidden = state.style !== "real";
    $("toonOpts").hidden = state.style === "real";
    render();
  });
  $("brief").addEventListener("input", render);
  $("brief").addEventListener("change", render);
  document.querySelector(".seg-input").addEventListener("click", (e) => {
    const b = e.target.closest("[data-input]");
    if (!b) return;
    state.inputMode = b.dataset.input;
    document.querySelectorAll(".seg-input .seg-btn").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
    $("freeBox").hidden = state.inputMode !== "free";
    $("pointsBox").hidden = state.inputMode === "free";
    render();
  });
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
  $("idea").value = "Девочка бежит от дракона. Всё это происходит в атмосфере игры престолов. Одежда и тд соответствует этому. Гипер реализм, 4к";
  $("ending").value = "";
  $("speech").value = "";
  state.files = [];
}

renderModels();
renderModes();
renderSelects();
loadDemo();
bind();
render();
