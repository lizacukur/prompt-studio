/* GET /api/health — проверка, что сервер открывается (удобно проверять из разных стран) */
export function GET() {
  return new Response(JSON.stringify({ ok: true, service: "Prompt Atelier", keyConfigured: !!process.env.DEEPSEEK_API_KEY }), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" },
  });
}
