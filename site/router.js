/* Prompt Atelier · раскладка свободного текста по блокам промпта (без ИИ)
   Идея режется на фразы; каждая фраза по ключевым словам уходит в свой блок:
   действие, герой/одежда, место, свет, камера, стиль, детали, звук, финал.
   Слова качества («4К», «гипер реализм») вынимаются из текста и становятся настройками. */

const B_ = "(?<![а-яёa-z])"; // начало слова для кириллицы и латиницы

/* Миры и атмосферы: вместо названия франшизы описываем видимые признаки (раздел 18) */
const WORLDS = [
  { id: "medieval", re: /игр\w* престолов|престол|средневек|рыцар|фэнтези|фентези|ведьмак|властелин\w* колец|королевств|викинг|(?<![а-яё])замк|(?<![а-яё])замок/, label: "Мрачное средневековое фэнтези",
    look: ["Gritty medieval dark-fantasy look: weathered stone fortresses, muddy roads, smoke and torchlight, cold desaturated palette with deep shadows and earthy browns, grounded and believable rather than glossy.",
           "Суровое средневековое тёмное фэнтези: обветренные каменные крепости, грязные дороги, дым и свет факелов, холодная приглушённая палитра с глубокими тенями и землистыми коричневыми, приземлённо и правдоподобно, без глянца."],
    wardrobe: ["Period-accurate medieval clothing: rough wool and linen layers, worn leather belts and boots, fur-lined cloaks, visible wear, dirt and mud on hems.",
               "Одежда эпохи средневековья: грубые слои шерсти и льна, потёртые кожаные ремни и сапоги, плащи с мехом, следы носки, грязь на подолах."],
    place: ["a rugged medieval landscape: stone fortress walls, a muddy road, wooden palisades, smoke rising from distant fires", "суровый средневековый пейзаж: каменные стены крепости, грязная дорога, деревянный частокол, дым от далёких костров"] },
  { id: "cyberpunk", re: /киберпанк|кибер|неонов\w* город|будущ\w* город|футурист/, label: "Киберпанк",
    look: ["Cyberpunk look: dense futuristic city, wet streets, neon signs in magenta and cyan, holographic ads, haze catching colored light, high contrast.",
           "Киберпанк: плотный футуристический город, мокрые улицы, неон пурпурный и бирюзовый, голографическая реклама, дымка ловит цветной свет, высокий контраст."],
    wardrobe: ["Techwear: layered synthetic jackets, reflective details, subtle cybernetic implants.", "Техно-одежда: многослойные синтетические куртки, светоотражающие детали, незаметные кибер-импланты."],
    place: ["a dense neon-lit futuristic street with rain-slick asphalt", "плотная футуристическая улица в неоне, мокрый асфальт после дождя"] },
  { id: "postapoc", re: /постапокалип|апокалип|руин\w* город|после конца света|зомби/, label: "Постапокалипсис",
    look: ["Post-apocalyptic look: ruined overgrown buildings, dust in the air, bleached sun, rust and decay, muted ochre palette.", "Постапокалипсис: разрушенные заросшие здания, пыль в воздухе, выжженное солнце, ржавчина и тлен, приглушённая охристая палитра."],
    wardrobe: ["Scavenged layered clothing: patched fabric, makeshift armor, dust and wear.", "Собранная из остатков одежда: заплатки, самодельная защита, пыль и износ."],
    place: ["a ruined city overgrown with weeds, abandoned cars, collapsed concrete", "разрушенный город, заросший травой, брошенные машины, обрушенный бетон"] },
  { id: "noir", re: /нуар|детектив\w* 40|чёрно-бел|черно-бел/, label: "Нуар",
    look: ["Film-noir look: black-and-white, hard low-key light, venetian-blind shadows, wet streets, cigarette smoke.", "Нуар: чёрно-белое изображение, жёсткий низкий ключ, тени от жалюзи, мокрые улицы, сигаретный дым."],
    wardrobe: ["1940s clothing: fedoras, trench coats, tailored suits.", "Одежда 1940-х: шляпы-федоры, плащи, костюмы по фигуре."],
    place: ["a 1940s city street at night", "улица города 1940-х ночью"] },
  { id: "western", re: /вестерн|дикий запад|ковбо/, label: "Вестерн",
    look: ["Western look: dusty frontier town, harsh sun, warm ochre and sepia palette, wide horizons.", "Вестерн: пыльный городок фронтира, жёсткое солнце, тёплая охра и сепия, широкие горизонты."],
    wardrobe: ["Frontier clothing: wide-brim hats, worn leather, dusters, boots with spurs.", "Одежда фронтира: широкополые шляпы, потёртая кожа, пыльники, сапоги со шпорами."],
    place: ["a dusty frontier town main street", "главная улица пыльного городка Дикого Запада"] },
  { id: "eighties", re: /80-?х|восьмидесят|ретро|синтвейв/, label: "Ретро 80-х",
    look: ["1980s retro look: warm film colors, soft halation around highlights, neon accents, analog texture.", "Ретро 80-х: тёплые плёночные цвета, мягкий ореол вокруг светов, неоновые акценты, аналоговая фактура."],
    wardrobe: ["1980s fashion: bright windbreakers, high-waisted jeans, big hair.", "Мода 80-х: яркие ветровки, джинсы с высокой талией, пышные причёски."],
    place: null },
  { id: "ussr", re: /ссср|советск|90-?х|девяност/, label: "Советская / 90-е эстетика",
    look: ["Late-Soviet look: concrete apartment blocks, faded paint, warm tungsten interiors, slightly desaturated film colors.", "Позднесоветская эстетика: бетонные панельки, выцветшая краска, тёплый свет ламп накаливания в интерьерах, слегка приглушённые плёночные цвета."],
    wardrobe: ["Period clothing: knitted sweaters, simple coats, fur hats in winter.", "Одежда эпохи: вязаные свитеры, простые пальто, меховые шапки зимой."],
    place: ["a courtyard between concrete apartment blocks", "двор между панельными домами"] },
  { id: "antique", re: /древн\w* рим|древн\w* греци|египет|фараон|гладиатор|антич/, label: "Античность",
    look: ["Ancient-world look: sunlit marble and sandstone, dust in the air, warm golden palette.", "Античный мир: освещённый солнцем мрамор и песчаник, пыль в воздухе, тёплая золотистая палитра."],
    wardrobe: ["Ancient clothing: draped linen tunics, leather sandals, bronze accessories.", "Античная одежда: драпированные льняные туники, кожаные сандалии, бронзовые украшения."],
    place: ["an ancient city square of marble and sandstone", "площадь античного города из мрамора и песчаника"] },
  { id: "space", re: /космическ\w* корабл|звёздн\w* войн|звездн\w* войн|научн\w* фантаст|sci-?fi|инопланет/, label: "Научная фантастика",
    look: ["Grounded science-fiction look: functional spacecraft interiors, practical panel lights, clean but used surfaces.", "Приземлённая научная фантастика: функциональные интерьеры кораблей, свет от панелей, чистые, но обжитые поверхности."],
    wardrobe: ["Practical sci-fi flight suits with worn patches and utility pockets.", "Практичные лётные комбинезоны с потёртыми нашивками и карманами."],
    place: ["the interior of a spacecraft", "интерьер космического корабля"] },
];

const QUALITY_RE = /(?:,\s*)?(?:в\s+)?(?:гипер\s*-?\s*реализм\w*|гиперреалистичн\w*|ультра\s*-?\s*реализм\w*|фотореализм\w*|фотореалистичн\w*|супер\s*реализм\w*|реализм\w*|реалистичн\w*|(?:в\s+)?(?:4|8)\s?[кk](?![а-яё])|full\s?hd|hd(?![a-z])|в\s+высоком\s+качестве|высок\w*\s+качеств\w*|ультра\s?hd|максимальн\w* детализац\w*)/gi;
const TOON_RE = /мульт|анимац|аниме|пластилин|3д-?|3d|рисованн/;
const REAL_RE = /реализм|реалистичн|фотореал|как в жизни|живая съ[её]мк/;
const STYLE_CLAUSE_RE = /(?:,\s*)?(?:всё|все)?\s*(?:это\s*)?(?:происходит\s*)?(?:в\s+атмосфере|в\s+стиле|в\s+духе|в\s+эстетике|как\s+в\s+(?:фильме|сериале|игре|мультфильме))\s+[^,.;!?]+/gi;
const FILLER_RE = /\s*(?:и\s+т\.?\s?д\.?|и\s+тд|и\s+так\s+далее|и\s+т\.?\s?п\.?)/gi;

const ROUTES = [
  { key: "ending", re: /в\s+конце|в\s+финале|заканчива|финал|последн\w*\s+кадр|в\s+итоге/ },
  { key: "wardrobe", re: /одежд|одет[аыо]?(?![а-яё])|одеты|костюм|плать|наряд|доспех|броне|плащ|шуб[аые]|куртк|обув|причёск|причеcк|макияж/ },
  { key: "camera", re: /камер|снят[оа]?(?![а-яё])|сним|ракурс|объектив|дрон|наезд|отъезд|облёт|облет|замедлен|слоу|slow|крупн\w*\s+план|общ\w*\s+план|средн\w*\s+план|с\s+рук|стабилизатор|fpv|фокус|боке|размыт\w*\s+фон/ },
  { key: "light", re: /свет(?!л)|освещ|тени|тень|сияни|подсвет|неон|контров|блик/ },
  { key: "sound", re: /звук|музык|тишин|шум[аеы]?(?![а-яё])|саундтрек|за\s+кадром|эхо/ },
  { key: "style", re: /кинематограф|атмосфер|в\s+стиле|в\s+духе|стилистик|эстетик|жанр|цветокор|палитр|оттенк|тонах|мульт|аниме|нуар|киберпанк|ретро|винтаж|фэнтези|фентези/ },
  { key: "detail", re: /детал|фактур|макро|крупно\s+видно|капл|пыл[ьи]|морщин|пор[ыа](?![а-яё])/ },
];

/* Есть ли во фразе действие: глаголы на -ет/-ит/-ут/-ют/-ат/-ят или прошедшее время */
const VERB_RE = /[а-яё]{2,}(?:ет|ит|ут|ют|ат|ят|ется|ится|утся|ются|ает|яет|ал|ала|али|ил|ила|или|ел|ела|ели)(?![а-яё])/;

function tidy(t) {
  return t.replace(/^[\s,.;:—-]+|[\s,.;:—-]+$/g, "").replace(/\s{2,}/g, " ").replace(/^и\s+/i, "");
}

function splitSentences(text) {
  return text
    .split(/(?<=[.!?…;])\s+|\n+/)
    .map((s) => s.trim().replace(/[.;]+$/, ""))
    .filter(Boolean);
}

function routeIdea(raw, sceneTest) {
  const buckets = { action: [], wardrobe: [], scene: [], light: [], camera: [], style: [], sound: [], detail: [], ending: [] };
  const flags = { quality: null, wantReal: false, wantToon: false, world: null, removed: [] };
  if (!raw) return { buckets, flags };
  const lower = raw.toLowerCase();
  flags.world = WORLDS.find((w) => w.re.test(lower)) || null;
  flags.wantToon = TOON_RE.test(lower);
  flags.wantReal = REAL_RE.test(lower);
  const q = lower.match(/(?<![а-яёa-z])(8|4)\s?[кk](?![а-яёa-z])/);
  if (q) flags.quality = q[1] + "K";
  else if (/full\s?hd|(?<![a-z])hd(?![a-z])|высок\w*\s+качеств/.test(lower)) flags.quality = "HD";

  const PRONOUN_RE = /(?<![а-яё])(он|она|они|его|её|ее|ему|ей|им|ним|ней|них|герой|героиня)(?![а-яё])/;
  const hasSubject = (low) => PRONOUN_RE.test(low) || SUBJECTS.some((x) => x.re.test(low));
  const FIRST = ["ending", "camera", "sound"];
  splitSentences(raw).forEach((sentence) => {
    let s = sentence.replace(FILLER_RE, "");
    // «в атмосфере игры престолов», «в стиле …» — в стиль
    s = s.replace(STYLE_CLAUSE_RE, (m) => { buckets.style.push(m.replace(/^,\s*/, "").trim()); return ""; });
    // «гипер реализм», «4к» — в качество, из текста убрать
    s = s.replace(QUALITY_RE, (m) => { flags.removed.push(m.replace(/^,\s*/, "").trim()); return ""; });
    s = tidy(s);
    if (!s || s.length < 3) return;
    const low = s.toLowerCase();
    // финал забирает всё предложение целиком
    if (ROUTES[0].re.test(low)) { buckets.ending.push(s); return; }
    // остальное — по частям предложения
    const parts = {};
    let last = "action";
    s.split(/,\s+/).map(tidy).filter(Boolean).forEach((clause) => {
      const c = clause.toLowerCase();
      let key = null;
      const early = ROUTES.find((r) => FIRST.includes(r.key) && r.re.test(c));
      if (early) key = early.key;
      else if (hasSubject(c)) key = "action";
      else {
        const r = ROUTES.find((x) => !FIRST.includes(x.key) && x.re.test(c));
        if (r && !(r.key === "detail" && VERB_RE.test(c) && !/детал|фактур|макро/.test(c))) key = r.key;
        else if (sceneTest(c) && !VERB_RE.test(c)) key = "scene";
        else if (VERB_RE.test(c)) key = "action";
        else key = last; // описание без глагола относится к предыдущей части
      }
      (parts[key] = parts[key] || []).push(clause);
      last = key;
    });
    Object.entries(parts).forEach(([k, arr]) => buckets[k].push(arr.join(", ")));
  });
  // «одежда соответствует» при узнанном мире — заменяется описанием мира
  if (flags.world) buckets.wardrobe = buckets.wardrobe.filter((x) => !/соответств|подходящ|в тему|как надо|в том же/.test(x.toLowerCase()));
  return { buckets, flags };
}

/* Режим «по пунктам»: поля формы сразу кладутся в свои блоки */
function routeFields(fields) {
  const all = Object.values(fields).join(". ");
  const { flags } = routeIdea(all, () => false);
  const clean = (t) => (t || "").replace(QUALITY_RE, "").replace(FILLER_RE, "").replace(/^[\s,.;:—-]+|[\s,.;:—-]+$/g, "").replace(/\s{2,}/g, " ");
  const one = (t) => (clean(t) ? [clean(t)] : []);
  return {
    buckets: {
      action: one(fields.action), wardrobe: one(fields.subject), scene: one(fields.scene), light: one(fields.light),
      camera: one(fields.camera), style: one(fields.style), sound: one(fields.sound), detail: one(fields.detail), ending: [],
    },
    flags,
  };
}
