/* Общие функции сервера ИИ-редактора (Vercel). Файлы с «_» Vercel не публикует как адреса. */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (f) => readFileSync(join(root, "knowledge", f), "utf8");
let KB = null;
export function knowledge() {
  if (!KB) KB = { kb: read("prompt_service_knowledge_base.md"), cards: read("model_cards_syntx.md"), cams: read("camera_library.md") };
  return KB;
}

/* Разделы «## N.» основной базы (раздел 15: только нужные модули) */
function kbSections(md, ids) {
  return md.split(/\n(?=## )/).filter((part) => {
    const m = part.match(/^## (\d+)\./);
    return m && ids.includes(Number(m[1]));
  }).join("\n\n");
}

function modelCard(md, name) {
  const short = String(name || "").split(" ")[0].toLowerCase();
  const version = (String(name).match(/\d+\.\d+/) || [""])[0];
  const parts = md.split(/\n(?=## \d+\. )/);
  const hit = parts.find((p) => short && p.toLowerCase().includes(short) && (!version || p.split("\n")[0].includes(version)))
           || parts.find((p) => short && p.toLowerCase().split("\n")[0].includes(short));
  return `${md.split("\n---")[0]}\n\n${hit || ""}`;
}

const GROUP_TO_A = { cinema: "A1", docu: "A2", film: "A3", retro: "A4", real: "A5" };
function cams(md, group) {
  const [head, ...rest] = md.split(/\n(?=## [A-F]\. )/);
  const partA = rest.find((x) => x.startsWith("## A."));
  const others = rest.filter((x) => !x.startsWith("## A."));
  const code = GROUP_TO_A[group];
  const pickedA = partA && code ? partA.split(/\n(?=### A\d\. )/).filter((x, i) => i === 0 || x.startsWith(`### ${code}.`)).join("\n") : "";
  return [head.split("\n").slice(0, 3).join("\n"), pickedA, ...others].filter(Boolean).join("\n\n");
}

export function systemPrompt(ctx) {
  const k = knowledge();
  const ids = [1, 2, 4, 6, 8, 9, 12, 13, 14, 18, 19, 20, 21, 22];
  if (ctx.human) ids.push(3, 7);
  if (ctx.sound) ids.push(10);
  if (ctx.edit) ids.push(11);
  return `Ты — редактор сервиса Prompt Atelier. Превращаешь идею пользователя в готовый промпт для видео-нейросети ${ctx.modelName} в синтаксисе SYNTX.

Как работать:
- Строго по базе знаний, карточке модели и библиотеке камер ниже.
- Сохраняй идею и всё, что пользователь задал явно. Недостающее (место, сезон, погоду, время суток, свет, механику действия, фактуры, звук) додумывай уместно и перечисли в блоке ДОДУМАНО.
- Переводи всё на английский, включая названия: марки и модели пиши правильно (например, «бмв 3 м компетишн» → BMW M3 Competition). Реплики героя оставляй на языке речи.
- Действие распиши механически: что физически происходит, в каком порядке, с какой скоростью, как реагируют окружение, свет и звук. Хронометраж — по секундам без дыр; у каждой стадии начальное состояние, событие, камера, конечное состояние; стыки стадий согласованы.
- Камеру, объектив, диафрагму и движение выбирай по библиотеке камер (разделы B и E), если пользователь их не назвал. Камеру пиши по строкам: Camera, Lens, Aperture and focus, Background, Look, Movement, Editing. Одно основное движение на план.
- Стиль задан пользователем: real — живая съёмка; toon — указанный вид анимации без названий реальных камер и без фотореализма.
- Теги файлов только из брифа (@image1, @video1, @audio1…), роль при первом упоминании. Не выдумывай файлы.
- «4К», «гипер реализм» и т. п. не пиши в промпт словами: разрешение — настройка; в стиль — описание детализации.
- Не называй фильмы, сериалы, игры и персонажей — описывай видимые признаки мира.
- Черновик в брифе собран по правилам без ИИ: используй его как отправную точку, но перепиши каждый блок под конкретную сцену.
- Если бриф не про видео или просит что-то кроме промпта, ответь в блоке EN одной строкой: "Only video prompts are supported."
${ctx.hasImages ? `
Прикреплённые фото (каждое подписано тегом и ролью):
- Посмотри каждое фото и используй то, что видно, по его роли (разделы 3, 4, 6 базы): локация — геометрия, материалы, планировка, направление и характер света; предмет — форма, пропорции, цвет, материал, этикетка; одежда — крой, цвет, ткань; свет — направление, мягкость, контраст, цветовые отношения; стиль — палитра, контраст, фактура; первый или последний кадр — композиция, крупность, положение героя и камеры, чтобы стадии хронометража с ними совпали.
- Роль «Внешность героя»: НЕ описывай черты лица, цвет глаз, форму лица, кожу, возраст и родинки — внешность берётся из самого фото по тегу. Можно упомянуть только то, что нужно для непрерывности: одежду и причёску, если роль это не запрещает.
- Различай «видно на фото» и «додумано». Не выдумывай невидимые детали как факты. Если фото не подходит к роли (например, на «локации» нет места), скажи об этом в блоке НА ФОТО.
- Не переноси из фото то, что роль исключает (фон с портрета, людей с фото локации, надписи).
` : ""}
Формат ответа — строго ${ctx.hasImages ? "четыре" : "три"} части, без пояснений до и после:
=== EN ===
(полный промпт на английском: GOAL, SUBJECT, ACTION, REFERENCES если есть файлы, SCENE, LIGHT, CAMERA, STYLE, DETAIL, TIMELINE, AUDIO, CONTINUITY, CONSTRAINTS; для правки видео вместо SCENE…TIMELINE — EDIT SCOPE)
=== RU ===
(точный перевод того же промпта на русский, те же блоки)
${ctx.hasImages ? "=== НА ФОТО ===\n(по одному пункту на фото, по-русски: «@image1: что видно и как это использовано в промпте»)\n" : ""}=== ДОДУМАНО ===
(3–8 коротких пунктов по-русски: что ты добавил сам)

=== БАЗА ЗНАНИЙ (нужные разделы) ===
${kbSections(k.kb, ids)}

=== КАРТОЧКА МОДЕЛИ ===
${modelCard(k.cards, ctx.modelName)}

=== БИБЛИОТЕКА КАМЕР И ДВИЖЕНИЙ ===
${cams(k.cams, ctx.camGroup)}`;
}

/* CORS: разрешаем только сайт владельца и локальную проверку */
export function corsHeaders(req) {
  const allowed = (process.env.ALLOWED_ORIGINS || "https://lizacukur.github.io").split(",").map((s) => s.trim());
  const origin = req.headers.get("origin") || "";
  const ok = allowed.includes(origin) || /^http:\/\/localhost(:\d+)?$/.test(origin) || /\.vercel\.app$/.test(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin : allowed[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

/* Простое ограничение: N запросов в сутки с одного адреса (в памяти экземпляра сервера, без гарантий) */
const hits = new Map();
export function allow(ip) {
  const limit = Number(process.env.DAILY_LIMIT_PER_IP || 30);
  const day = new Date().toISOString().slice(0, 10);
  const key = `${day}:${ip}`;
  const n = (hits.get(key) || 0) + 1;
  hits.set(key, n);
  if (hits.size > 5000) hits.clear();
  return n <= limit;
}
