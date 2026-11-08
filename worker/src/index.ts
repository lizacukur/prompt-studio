/* Prompt Atelier · ИИ-редактор промптов (Cloudflare Worker)
   Принимает бриф с сайта, отдаёт полный промпт EN + RU, составленный по базе знаний.
   Ключ Anthropic хранится как секрет воркера и не попадает в браузер. */
import Anthropic from "@anthropic-ai/sdk";
import KB from "../../knowledge/prompt_service_knowledge_base.md";
import CARDS from "../../knowledge/model_cards_syntx.md";

interface Env {
  ANTHROPIC_API_KEY: string;
  ALLOWED_ORIGIN: string;
}

// Разделы 0, 16, 17 базы — сведения об источниках; в рабочий контекст их не передаём (раздел 15).
function trimKnowledge(md: string): string {
  return md
    .split(/\n(?=## )/)
    .filter((part) => !/^## (0|16|17)\. /.test(part))
    .join("\n");
}

const SYSTEM = `Ты — редактор сервиса Prompt Atelier. Ты превращаешь свободную идею пользователя в готовый промпт для видео-нейросети в синтаксисе SYNTX.

Работай строго по базе знаний ниже. Главное:
- Сохраняй идею пользователя и всё, что он явно задал. Недостающее (сезон, погоду, время суток, свет, камеру, объектив, фактуры, звук) додумывай уместно для сцены и перечисли эти допущения в поле assumptions.
- Стиль задаёт пользователь: «real» — фотореалистичная живая съёмка (камера, объектив, диафрагма, глубина резкости, фактуры, раздел 18.1); «toon» — анимация выбранного вида (раздел 18.2), без названий реальных камер и без фотореализма.
- Теги файлов бери только из брифа (@image1, @video1, @audio1 и т. п.), каждому тегу — роль при первом упоминании. Не выдумывай файлы.
- Учитывай карточку выбранной модели: режим, лимиты, поддержку звука. Неподдерживаемое не обещай.
- Действие переведи на английский полностью и разверни в стадии по хронометражу без дыр. Реплики героя оставляй на языке речи (русскую — по-русски).
- Черновик из брифа — отправная точка; перепиши его так, чтобы каждый блок соответствовал конкретной сцене, а не шаблону.
- en — полный промпт на английском, ru — точный перевод на русский. Блоки: GOAL, SUBJECT, REFERENCES (если есть файлы), SCENE, LIGHT, CAMERA, STYLE, DETAIL, TIMELINE, AUDIO, CONTINUITY, CONSTRAINTS; в ru — те же блоки по-русски. Для правки видео вместо SCENE…TIMELINE — EDIT SCOPE.
- Не пиши пояснений вне JSON.

=== БАЗА ЗНАНИЙ ===
${trimKnowledge(KB)}

=== КАРТОЧКИ МОДЕЛЕЙ SYNTX ===
${CARDS}`;

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    en: { type: "string", description: "Полный промпт на английском" },
    ru: { type: "string", description: "Точный перевод промпта на русский" },
    assumptions: { type: "array", items: { type: "string" }, description: "Что додумано, коротко по-русски" },
  },
  required: ["en", "ru", "assumptions"],
  additionalProperties: false,
} as const;

function cors(env: Env, origin: string | null): Record<string, string> {
  const allowed = origin && (origin === env.ALLOWED_ORIGIN || origin.startsWith("http://localhost")) ? origin : env.ALLOWED_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function json(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json; charset=utf-8" } });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const headers = cors(env, request.headers.get("Origin"));
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return json({ error: "Используйте POST" }, 405, headers);

    let brief: unknown;
    try {
      brief = await request.json();
    } catch {
      return json({ error: "Тело запроса должно быть JSON" }, 400, headers);
    }
    const briefText = JSON.stringify(brief);
    if (briefText.length > 20000) return json({ error: "Бриф слишком длинный" }, 413, headers);

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    try {
      const response = await client.beta.messages.create({
        model: "claude-opus-5-5",
        max_tokens: 16000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "medium", format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
        system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: `Бриф от сайта (JSON):\n${briefText}` }],
      });

      if (response.stop_reason === "refusal") {
        return json({ error: "Модель отказалась составлять этот промпт. Измените формулировку идеи." }, 422, headers);
      }
      if (response.stop_reason === "max_tokens") {
        return json({ error: "Ответ не поместился. Сократите идею или длительность." }, 502, headers);
      }
      const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
      const out = JSON.parse(text) as { en: string; ru: string; assumptions: string[] };
      return json(out, 200, headers);
    } catch (error) {
      if (error instanceof Anthropic.AuthenticationError) return json({ error: "Неверный ключ API на сервере" }, 500, headers);
      if (error instanceof Anthropic.RateLimitError) return json({ error: "Слишком много запросов, попробуйте через минуту" }, 429, headers);
      if (error instanceof Anthropic.APIError) return json({ error: `Ошибка API ${error.status}` }, 502, headers);
      if (error instanceof SyntaxError) return json({ error: "Модель вернула неполный ответ, повторите" }, 502, headers);
      throw error;
    }
  },
};
