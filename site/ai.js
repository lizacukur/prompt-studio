/* Prompt Atelier · ИИ-редактор (DeepSeek через свой сервер на Vercel)
   Ученикам не нужны аккаунты: сайт отправляет бриф на сервер владельца (папка api/),
   сервер добавляет нужные разделы базы знаний и спрашивает DeepSeek. Ключ хранится только на сервере. */

/* Адрес сервера. На копии сайта на vercel.app сервер тот же, поэтому адрес не нужен. */
const AI_SERVER = (() => { try { return localStorage.getItem("aiServer") || ""; } catch { return ""; } })() || "https://prompt-studio-self.vercel.app";
const AI_ENDPOINT = location.hostname.endsWith(".vercel.app") ? "/api/prompt" : (AI_SERVER ? `${AI_SERVER.replace(/\/$/, "")}/api/prompt` : "");

const AI_MODELS = {
  flash: "Быстро, видит фото — DeepSeek Flash",
  pro: "Подробнее, без фото — DeepSeek V4 Pro",
};

const RIG_GROUP = { "Кино": "cinema", "Репортаж": "docu", "Плёнка": "film", "Атмосфера и ностальгия": "retro", "Бытовое и «реальное»": "real" };

function briefForAi() {
  const { en, tagged, a, f } = buildPrompt();
  const m = model();
  return {
    payload: {
      context: {
        modelName: m.name,
        quality: $("aiModel").value,
        human: a.subjects.some((x) => x.kind === "human") || state.files.some((x) => x.role === "identity"),
        sound: !!(f.speech || f.sound),
        edit: ["edit", "extend"].includes(state.mode),
        camGroup: f.style === "real" && a.rigId ? RIG_GROUP[RIGS[a.rigId].group] || "" : "",
      },
      brief: {
        model: { name: m.name, limits: m.limits, durations: m.durations, aspects: m.aspects, notes: m.notes },
        mode: MODES[state.mode].en,
        style: f.style === "real" ? { type: "real", camera: f.rig === "auto" ? "подобрать" : RIGS[a.rigId].label, background: f.bg } : { type: "toon", kind: TOON[f.toon].label },
        idea: f.inputMode === "free" ? f.idea : f.fields,
        ending: f.ending, speech: f.speech,
        settings: { duration_s: f.dur, aspect: f.aspect, light: f.light, take_by_rules: f.take, music: f.music, sound: f.sound, no_on_screen_text: f.noText, macro_detail: f.macro, infer_details: f.infer },
        files: tagged.map((x) => ({ tag: x.tag, type: x.type, role: ROLES[x.type][x.role].label, name: x.name })),
        understood_by_rules: { place: a.place && a.place.label, season: a.season && a.season.label, time: a.time && a.time.label, weather: a.weather && a.weather.label, subjects: a.subjects.map((x) => x.label), world: a.world && a.world.label, camera: a.rigId && RIGS[a.rigId].label, move: a.moveId && MOVES[a.moveId].ru },
      },
      draft: en,
    },
  };
}

/* Разбор ответа по маркерам; работает и на неполном тексте во время потока */
function splitAnswer(text) {
  const MARKS = ["=== EN ===", "=== RU ===", "=== НА ФОТО ===", "=== ДОДУМАНО ==="];
  const grab = (from) => {
    const i = text.indexOf(from);
    if (i < 0) return "";
    const rest = text.slice(i + from.length);
    const ends = MARKS.map((m) => rest.indexOf(m)).filter((j) => j >= 0);
    return (ends.length ? rest.slice(0, Math.min(...ends)) : rest).trim();
  };
  const list = (s) => s.split("\n").map((x) => x.replace(/^[-•\d.)\s]+/, "").trim()).filter(Boolean);
  return {
    en: grab("=== EN ==="),
    ru: grab("=== RU ==="),
    photos: list(grab("=== НА ФОТО ===")),
    assumptions: list(grab("=== ДОДУМАНО ===")),
  };
}

/* Кадры из видео: 8 равномерных кадров с отметкой времени, до 640 px */
function videoFrames(file, n = 8, maxSide = 640) {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.muted = true; v.preload = "auto"; v.src = URL.createObjectURL(file);
    const frames = [];
    const done = () => { URL.revokeObjectURL(v.src); resolve(frames); };
    v.onerror = done;
    v.onloadedmetadata = async () => {
      const dur = v.duration;
      if (!isFinite(dur) || dur <= 0) return done();
      const k = Math.min(1, maxSide / Math.max(v.videoWidth, v.videoHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k);
      for (let i = 0; i < n; i++) {
        const t = Math.min(dur - 0.05, (dur * (i + 0.5)) / n);
        await new Promise((r) => { v.onseeked = r; v.currentTime = t; setTimeout(r, 4000); });
        c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
        frames.push({ t: t.toFixed(1), dur: dur.toFixed(1), data: c.toDataURL("image/jpeg", 0.75) });
      }
      done();
    };
  });
}

/* Фото для ИИ: изображения уменьшаются до 1024 px; из видео берутся кадры */
async function photosForAi(tagged) {
  if (!$("sendPhotos").checked) return [];
  const out = [];
  for (const x of tagged.filter((y) => y.type === "video" && y.file).slice(0, 2)) {
    const frames = await videoFrames(x.file);
    if (!frames.length) { toast(`Браузер не смог прочитать ${x.name}: видео уйдёт только тегом`); continue; }
    frames.forEach((fr, i) => out.push({ tag: x.tag, role: ROLES.video[x.role].label, name: x.name, frame: `кадр ${i + 1} из ${frames.length}, ${fr.t} с из ${fr.dur} с`, data: fr.data }));
  }
  const picked = tagged.filter((x) => x.type === "image" && x.file).slice(0, 6);
  for (const x of picked) {
    try {
      const bmp = await createImageBitmap(x.file);
      const k = Math.min(1, 1024 / Math.max(bmp.width, bmp.height));
      const c = document.createElement("canvas");
      c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
      c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
      out.unshift({ tag: x.tag, role: ROLES.image[x.role].label, name: x.name, data: c.toDataURL("image/jpeg", 0.82) });
    } catch { /* формат не читается браузером — пропускаем */ }
  }
  return out;
}

async function runAi() {
  const btn = $("aiBtn");
  if (!AI_ENDPOINT) { toast("ИИ-редактор ещё не подключён: владелец сайта настраивает сервер"); return; }
  btn.disabled = true;
  btn.textContent = "ИИ пишет промпт…";
  let quality = $("aiModel").value;
  try {
    const { payload } = briefForAi();
    const tagged = usableFiles().map((x) => ({ ...x, tag: tagFor(x) }));
    if ($("sendPhotos").checked && tagged.some((x) => ["image", "video"].includes(x.type) && x.file)) btn.textContent = "Готовлю фото и кадры видео…";
    payload.images = await photosForAi(tagged);
    if (payload.images.length && quality === "pro") { quality = "flash"; toast("С фото работает режим «Быстро»: Pro не видит изображения"); }
    btn.textContent = payload.images.length ? "ИИ смотрит файлы и пишет…" : "ИИ пишет промпт…";
    state.ai = { en: "", ru: "", photos: [], assumptions: [], stale: false, model: AI_MODELS[quality].split(" — ")[1], streaming: true };
    showAi();
    const res = await fetch(AI_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `сервер ответил ${res.status}`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      if (text.includes("[[ERROR]]")) throw new Error("связь с нейросетью прервалась, попробуйте ещё раз");
      Object.assign(state.ai, splitAnswer(text));
      showAi();
    }
    const truncated = text.includes("[[TRUNCATED]]") || !text.includes("=== RU ===") || !text.includes("=== ДОДУМАНО ===");
    Object.assign(state.ai, splitAnswer(text.replace("[[TRUNCATED]]", "")), { streaming: false, truncated });
    if (!state.ai.en) throw new Error("ответ пришёл не в том формате, попробуйте ещё раз");
    render();
    toast(truncated ? "Ответ оборвался: часть промпта может отсутствовать, попробуйте ещё раз" : "Промпт написан");
  } catch (e) {
    state.ai = null;
    render();
    toast(`Не получилось: ${e.message === "Failed to fetch" ? "сервер недоступен, проверьте интернет" : e.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = "Написать промпт с ИИ";
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
  if (state.ai.truncated) out.push(["warn", "ИИ", "Ответ ИИ оборвался: русский перевод или списки могут отсутствовать. Нажмите «Написать промпт с ИИ» ещё раз."]);
  if (state.ai.stale) out.push(["warn", "ИИ", "Вы изменили настройки после ответа ИИ. Нажмите «Написать промпт с ИИ» ещё раз или «Показать черновик»."]);
  else out.push(["ok", "ИИ", `Промпт написан ${state.ai.model} по базе знаний.`]);
  (state.ai.photos || []).forEach((t) => out.push(["ok", "Увидел", t]));
  state.ai.assumptions.forEach((t) => out.push(["info", "Додумано", t]));
  return out;
}

function bindAi() {
  $("aiModel").innerHTML = Object.entries(AI_MODELS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
  $("aiBtn").addEventListener("click", runAi);
  $("aiDraft").addEventListener("click", () => { state.ai = null; render(); });
  $("aiStatus").textContent = AI_ENDPOINT ? "Без регистрации. Ограничение — 30 запросов в день с одного устройства." : "ИИ-редактор скоро заработает: владелец сайта подключает сервер. Пока доступен черновик по правилам.";
}
