/* Prompt Atelier · ИИ-редактор (DeepSeek через свой сервер на Vercel)
   Ученикам не нужны аккаунты: сайт отправляет бриф на сервер владельца (папка api/),
   сервер добавляет нужные разделы базы знаний и спрашивает DeepSeek. Ключ хранится только на сервере. */

/* Адрес сервера. На копии сайта на vercel.app сервер тот же, поэтому адрес не нужен. */
const AI_SERVER = (() => { try { return localStorage.getItem("aiServer") || ""; } catch { return ""; } })() || "https://prompt-studio-self.vercel.app";
const AI_ENDPOINT = location.hostname.endsWith(".vercel.app") ? "/api/prompt" : (AI_SERVER ? `${AI_SERVER.replace(/\/$/, "")}/api/prompt` : "");

const AI_MODELS = {
  flash: "Быстро — DeepSeek V4 Flash",
  pro: "Подробнее — DeepSeek V4 Pro",
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
        settings: { duration_s: f.dur, aspect: f.aspect, light: f.light, camera_move: f.camera === "auto" ? "подобрать" : MOVES[f.camera].ru, take: f.take, music: f.music, sound: f.sound, no_on_screen_text: f.noText, macro_detail: f.macro, infer_details: f.infer },
        files: tagged.map((x) => ({ tag: x.tag, type: x.type, role: ROLES[x.type][x.role].label, name: x.name })),
        understood_by_rules: { place: a.place && a.place.label, season: a.season && a.season.label, time: a.time && a.time.label, weather: a.weather && a.weather.label, subjects: a.subjects.map((x) => x.label), world: a.world && a.world.label, camera: a.rigId && RIGS[a.rigId].label, move: a.moveId && MOVES[a.moveId].ru },
      },
      draft: en,
    },
  };
}

/* Разбор ответа по маркерам; работает и на неполном тексте во время потока */
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

async function runAi() {
  const btn = $("aiBtn");
  if (!AI_ENDPOINT) { toast("ИИ-редактор ещё не подключён: владелец сайта настраивает сервер"); return; }
  btn.disabled = true;
  btn.textContent = "ИИ пишет промпт…";
  const quality = $("aiModel").value;
  state.ai = { en: "", ru: "", assumptions: [], stale: false, model: AI_MODELS[quality].split(" — ")[1], streaming: true };
  showAi();
  try {
    const res = await fetch(AI_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(briefForAi().payload) });
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
    Object.assign(state.ai, splitAnswer(text), { streaming: false });
    if (!state.ai.en) throw new Error("ответ пришёл не в том формате, попробуйте ещё раз");
    render();
    toast("Промпт написан");
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
  if (state.ai.stale) out.push(["warn", "ИИ", "Вы изменили настройки после ответа ИИ. Нажмите «Написать промпт с ИИ» ещё раз или «Показать черновик»."]);
  else out.push(["ok", "ИИ", `Промпт написан ${state.ai.model} по базе знаний.`]);
  state.ai.assumptions.forEach((t) => out.push(["info", "Додумано", t]));
  return out;
}

function bindAi() {
  $("aiModel").innerHTML = Object.entries(AI_MODELS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
  $("aiBtn").addEventListener("click", runAi);
  $("aiDraft").addEventListener("click", () => { state.ai = null; render(); });
  $("aiStatus").textContent = AI_ENDPOINT ? "Без регистрации. Ограничение — 30 запросов в день с одного устройства." : "ИИ-редактор скоро заработает: владелец сайта подключает сервер. Пока доступен черновик по правилам.";
}
