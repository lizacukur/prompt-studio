/* POST /api/prompt — ИИ-редактор: бриф с сайта → DeepSeek → промпт (поток текста).
   Ключ DeepSeek хранится в переменной окружения Vercel DEEPSEEK_API_KEY и в браузер не попадает. */
import { systemPrompt, corsHeaders, allow } from "./_lib.js";

const MODELS = { flash: "deepseek-v4-flash", pro: "deepseek-v4-pro" };

export function OPTIONS(req) {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

const fail = (req, status, error) =>
  new Response(JSON.stringify({ error }), { status, headers: { ...corsHeaders(req), "Content-Type": "application/json; charset=utf-8" } });

export async function POST(req) {
  if (!process.env.DEEPSEEK_API_KEY) return fail(req, 500, "На сервере не задан ключ DeepSeek (DEEPSEEK_API_KEY).");
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  if (!allow(ip)) return fail(req, 429, "Дневной лимит запросов с вашего адреса исчерпан. Попробуйте завтра или используйте черновик по правилам.");

  let body;
  try { body = await req.json(); } catch { return fail(req, 400, "Неверный запрос."); }
  const briefText = JSON.stringify(body.brief || {});
  const draft = String(body.draft || "");
  if (briefText.length > 12000 || draft.length > 12000) return fail(req, 413, "Слишком длинная идея: сократите описание.");
  const ctx = body.context || {};
  const model = MODELS[ctx.quality] || MODELS.flash;

  const upstream = await fetch(`${process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com"}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model,
      stream: true,
      max_tokens: 6000,
      messages: [
        { role: "system", content: systemPrompt({
          modelName: String(ctx.modelName || "Seedance 2.5").slice(0, 40),
          human: !!ctx.human, sound: !!ctx.sound, edit: !!ctx.edit, camGroup: String(ctx.camGroup || ""),
        }) },
        { role: "user", content: `Бриф (JSON):\n${briefText}\n\nЧерновик по правилам:\n${draft}` },
      ],
    }),
  }).catch((e) => ({ ok: false, status: 502, text: async () => String(e) }));

  if (!upstream.ok) {
    const detail = await upstream.text();
    const msg = upstream.status === 401 ? "Неверный ключ DeepSeek на сервере."
      : upstream.status === 402 ? "На балансе DeepSeek закончились деньги. Владельцу сайта нужно пополнить баланс."
      : upstream.status === 429 ? "DeepSeek перегружен, попробуйте через минуту."
      : `DeepSeek ответил ошибкой ${upstream.status}.`;
    console.error("deepseek error", upstream.status, detail.slice(0, 500));
    return fail(req, 502, msg);
  }

  // Пересылаем поток: из событий DeepSeek (SSE) берём только текст
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body.getReader();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop();
          for (const line of lines) {
            const data = line.startsWith("data:") ? line.slice(5).trim() : "";
            if (!data || data === "[DONE]") continue;
            try {
              const piece = JSON.parse(data).choices?.[0]?.delta?.content;
              if (piece) controller.enqueue(encoder.encode(piece));
            } catch { /* неполная строка — пропускаем */ }
          }
        }
      } catch (e) {
        controller.enqueue(encoder.encode(`\n\n[[ERROR]] ${String(e).slice(0, 200)}`));
      }
      controller.close();
    },
  });
  return new Response(stream, { headers: { ...corsHeaders(req), "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
