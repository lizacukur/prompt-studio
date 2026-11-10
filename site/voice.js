/* Prompt Atelier · голосовой ввод
   Распознаёт речь сам браузер (Web Speech API): DeepSeek и сервер не участвуют, денег не тратится.
   Chrome и Edge отправляют звук в свою службу распознавания (Google или Microsoft), Safari — в Apple.
   Firefox голосовой ввод не поддерживает: там подсказка про микрофон на клавиатуре телефона. */

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const VOICE_LANGS = { "ru-RU": "Русский", "en-US": "English", "he-IL": "עברית", "ar-SY": "العربية", "uk-UA": "Українська" };
let rec = null;
let activeBtn = null;

function stopVoice() {
  if (rec) { try { rec.stop(); } catch {} }
}

function startVoice(btn, field) {
  if (rec) { const same = activeBtn === btn; stopVoice(); if (same) return; }
  rec = new SR();
  rec.lang = $("voiceLang").value;
  rec.continuous = true;
  rec.interimResults = true;
  const base = field.value.replace(/\s+$/, "");
  let finalText = "";
  activeBtn = btn;
  btn.classList.add("on");
  btn.setAttribute("aria-pressed", "true");
  btn.querySelector(".mic-label").textContent = "Говорите… нажмите, чтобы остановить";

  rec.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finalText += r[0].transcript.trim() + " ";
      else interim += r[0].transcript;
    }
    field.value = [base, (finalText + interim).trim()].filter(Boolean).join(base ? " " : "");
    field.dispatchEvent(new Event("input", { bubbles: true }));
  };
  rec.onerror = (e) => {
    const msg = {
      "not-allowed": "Разрешите сайту доступ к микрофону (значок слева от адреса сайта)",
      "service-not-allowed": "Браузер запретил голосовой ввод на этом сайте",
      "network": "Нет связи со службой распознавания речи браузера. Попробуйте другой браузер или микрофон на клавиатуре телефона",
      "no-speech": "Речь не услышана, попробуйте ещё раз",
      "language-not-supported": "Этот язык браузер не распознаёт",
      "audio-capture": "Микрофон не найден",
    }[e.error];
    if (msg) toast(msg);
  };
  rec.onend = () => {
    btn.classList.remove("on");
    btn.setAttribute("aria-pressed", "false");
    btn.querySelector(".mic-label").textContent = "Голосом";
    rec = null; activeBtn = null;
  };
  try { rec.start(); } catch { toast("Не удалось включить микрофон"); }
}

function bindVoice() {
  const fields = [$("idea"), ...document.querySelectorAll("#pointsBox textarea")];
  if (!SR) {
    $("voiceRow").innerHTML = '<p class="hint">Голосовой ввод в этом браузере не поддерживается. Работает в Chrome, Edge и Safari; на телефоне можно нажать микрофон на клавиатуре.</p>';
    return;
  }
  $("voiceLang").innerHTML = Object.entries(VOICE_LANGS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
  try { const saved = localStorage.getItem("voiceLang"); if (saved && VOICE_LANGS[saved]) $("voiceLang").value = saved; } catch {}
  $("voiceLang").addEventListener("change", () => { try { localStorage.setItem("voiceLang", $("voiceLang").value); } catch {} stopVoice(); });
  fields.forEach((field) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mic-btn";
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-label", "Голосовой ввод");
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12h-2z"/></svg><span class="mic-label">Голосом</span>';
    btn.addEventListener("click", () => startVoice(btn, field));
    field.insertAdjacentElement("afterend", btn);
  });
}
