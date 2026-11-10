/* Prompt Atelier · библиотека камер и движений (knowledge/camera_library.md)
   Подключается после engine.js: дополняет RIGS, выбирает камеру и движение по идее. */

/* ---------- Форматы и камеры (раздел A) ---------- */
Object.assign(RIGS, {
  anamorphic: { group: "Кино", label: "Анаморф: блокбастер",
    body: ["ARRI Alexa Mini LF", "ARRI Alexa Mini LF"],
    lens: (f) => [`Panavision C-Series anamorphic ${f}`, `анаморфный объектив Panavision C-Series ${f}`],
    look: ["oval bokeh, horizontal blue streak flares from bright lights, slight edge distortion, wide cinematic feel", "овальное боке, горизонтальные синие блики от ярких источников, лёгкая дисторсия по краям, широкое киношное ощущение"] },
  imax: { group: "Кино", label: "IMAX 65 мм: масштаб",
    body: ["large-format IMAX 65mm film camera", "широкоформатная плёночная камера IMAX 65 мм"],
    lens: () => ["Hasselblad-based IMAX wide lens, about 50mm", "широкий объектив IMAX на базе Hasselblad, около 50 мм"],
    look: ["immense detail and depth, clean grain, overwhelming sense of scale", "огромная детализация и глубина, чистое зерно, ощущение масштаба"], deep: true },
  super8: { group: "Плёнка", label: "Super 8: семейный архив",
    body: ["Canon 514XL Super 8 film camera, Kodak Ektachrome", "плёночная камера Canon 514XL Super 8, плёнка Kodak Ektachrome"],
    lens: () => ["built-in zoom lens, mostly wide", "встроенный зум, в основном широкий угол"],
    look: ["heavy grain, gate weave, soft focus, faded warm colors, light leaks at the edges, vignette, 18 fps stepped motion, 4:3 frame", "крупное зерно, дрожание кадра, мягкий фокус, выцветшие тёплые цвета, засветки по краям, виньетка, рывковое движение 18 кадров/с, кадр 4:3"],
    smallSensor: true, move: "handheld", fourThree: true },
  dv2000: { group: "Атмосфера и ностальгия", label: "DV-камера 2000-х (атмосферно)",
    body: ["Sony DCR-VX2000 3CCD MiniDV camcorder (early 2000s)", "камера Sony DCR-VX2000, 3 CCD, MiniDV (начало 2000-х)"],
    lens: () => ["built-in Sony 12x zoom lens, 6–72mm (about 43–518mm equivalent), f/1.6–2.4, mostly at the wide end", "встроенный зум Sony 12x, 6–72 мм (≈ 43–518 мм в эквиваленте), f/1.6–2.4, чаще на широком конце"],
    look: ["standard-definition 480i video, 4:3 frame, smooth 60i video motion without film motion blur, electronic edge sharpening with thin halos, clipped bright highlights and sky, auto exposure breathing, warm skin, slight red color bleed, auto white balance shifts, visible noise in shadows, authentic early-2000s home-video feel",
           "видео стандартной чёткости 480i, кадр 4:3, плавное видео-движение 60i без киношного размытия, электронная перерезкость с тонкими ореолами, выбитые света и небо, «дышащая» автоэкспозиция, тёплая кожа, лёгкое растекание красного, сдвиги автобаланса белого, шум в тенях, живое ощущение домашнего видео начала 2000-х"],
    smallSensor: true, move: "handheld", fourThree: true, stamp: true,
    focus: ["autofocus, occasionally hunting", "автофокус, иногда «ищет»"] },
  vhs: { group: "Атмосфера и ностальгия", label: "VHS-камкордер 90-х",
    body: ["shoulder-mounted VHS camcorder (Panasonic M7, early 1990s)", "плечевой VHS-камкордер (Panasonic M7, начало 90-х)"],
    lens: () => ["built-in zoom lens", "встроенный зум"],
    look: ["soft low-resolution VHS image, chroma bleed, tracking lines and jitter at the bottom of the frame, tape noise, shifted colors, 4:3 frame", "мягкая картинка VHS низкого разрешения, растекание цвета, полосы трекинга и дрожание внизу кадра, шум плёнки, смещённые цвета, кадр 4:3"],
    smallSensor: true, move: "handheld", fourThree: true, stamp: true },
  hi8: { group: "Атмосфера и ностальгия", label: "Hi8 Handycam конца 90-х",
    body: ["Sony Handycam CCD-TRV Hi8 camcorder (late 1990s)", "камера Sony Handycam CCD-TRV, Hi8 (конец 90-х)"],
    lens: () => ["built-in zoom lens", "встроенный зум"],
    look: ["slightly sharper than VHS, soft saturated colors, analog noise, 4:3 frame, video motion", "чуть чётче VHS, мягкие насыщенные цвета, аналоговый шум, кадр 4:3, видео-движение"],
    smallSensor: true, move: "handheld", fourThree: true, stamp: true },
  digicam: { group: "Атмосфера и ностальгия", label: "Цифромыльница 2000-х",
    body: ["2000s compact digital camera in video mode (Canon PowerShot)", "компактная цифровая камера 2000-х в режиме видео (Canon PowerShot)"],
    lens: () => ["small built-in zoom lens", "маленький встроенный зум"],
    look: ["640x480 at 30 fps, compression artifacts, soft focus, noisy shadows, no flash in video, thin mono sound", "640×480, 30 кадров/с, артефакты сжатия, мягкий фокус, шумные тени, вспышки нет, тонкий моно-звук"],
    smallSensor: true, move: "handheld", fourThree: true },
  oldphone: { group: "Атмосфера и ностальгия", label: "Телефон 2000-х",
    body: ["mid-2000s mobile phone camera (Nokia N95)", "камера телефона середины 2000-х (Nokia N95)"],
    lens: () => ["tiny fixed lens", "крошечный фиксированный объектив"],
    look: ["very low resolution, heavy compression blocks, choppy motion around 15 fps, blooming highlights, crackling sound", "очень низкое разрешение, сильные блоки сжатия, рывковое движение около 15 кадров/с, расплывающиеся света, хрипящий звук"],
    smallSensor: true, move: "handheld" },
  gopro: { group: "Бытовое и «реальное»", label: "GoPro: экшн / от первого лица",
    body: ["GoPro HERO action camera, chest or helmet mount", "экшн-камера GoPro HERO на груди или шлеме"],
    lens: () => ["ultra-wide SuperView lens, about 16mm equivalent, fisheye distortion", "сверхширокий SuperView, около 16 мм в эквиваленте, дисторсия «рыбий глаз»"],
    look: ["everything in focus, electronic stabilization, vivid saturated colors, wind noise", "всё в фокусе, электронная стабилизация, яркие насыщенные цвета, шум ветра"],
    smallSensor: true, move: "bodycam" },
  cctv: { group: "Бытовое и «реальное»", label: "Камера наблюдения (CCTV)",
    body: ["fixed high-corner CCTV security camera", "неподвижная камера наблюдения в верхнем углу"],
    lens: () => ["wide fixed lens", "широкий фиксированный объектив"],
    look: ["low resolution, compression artifacts, uneven frame rate, infrared black-and-white at night, slightly washed colors by day", "низкое разрешение, артефакты сжатия, неровная частота кадров, ночью чёрно-белый ИК-режим, днём слегка блёклые цвета"],
    smallSensor: true, move: "static", stamp: true },
  dashcam: { group: "Бытовое и «реальное»", label: "Видеорегистратор",
    body: ["car dashcam mounted behind the windshield", "автомобильный видеорегистратор за лобовым стеклом"],
    lens: () => ["wide fixed lens with the hood visible at the bottom", "широкий фиксированный объектив, капот виден внизу кадра"],
    look: ["windshield reflections and glare, compression, steady fixed view", "отражения и блики на стекле, сжатие, неподвижный ракурс"],
    smallSensor: true, move: "vehicle", stamp: true },
  bodycam: { group: "Бытовое и «реальное»", label: "Нательная камера",
    body: ["chest-mounted body camera", "нательная камера на груди"],
    lens: () => ["fisheye wide lens", "широкоугольный объектив «рыбий глаз»"],
    look: ["heavy shake from footsteps, hands entering the frame, low-light noise", "сильная тряска от шагов, руки входят в кадр, шум при слабом свете"],
    smallSensor: true, move: "bodycam", stamp: true },
  doorbell: { group: "Бытовое и «реальное»", label: "Дверной звонок с камерой",
    body: ["doorbell security camera looking down at the porch", "камера дверного звонка, смотрит сверху на крыльцо"],
    lens: () => ["fisheye lens", "объектив «рыбий глаз»"],
    look: ["strong fisheye distortion, digital noise, infrared at night", "сильная дисторсия, цифровой шум, ночью ИК"],
    smallSensor: true, move: "static", stamp: true },
  docu: { group: "Репортаж", label: "Документалка: Sony FX6",
    body: ["Sony FX6", "Sony FX6"],
    lens: (f) => [`Sony FE 24–70mm f/2.8 GM II at ${f}`, `зум Sony FE 24–70 мм f/2.8 GM II на ${f}`],
    look: ["clean natural documentary color, face-tracking autofocus", "чистый естественный документальный цвет, автофокус по лицу"], move: "handheld" },
});
Object.assign(RIGS.cinema, { group: "Кино" });
Object.assign(RIGS.film, { group: "Плёнка" });
Object.assign(RIGS.vintage, { group: "Плёнка" });
Object.assign(RIGS.canon, { group: "Репортаж", move: "handheld" });
Object.assign(RIGS.wildlife, { group: "Репортаж" });
Object.assign(RIGS.phone, { group: "Бытовое и «реальное»", smallSensor: true, move: "handheld" });
Object.assign(RIGS.product, { group: "Кино" });

/* Ключевые слова → камера (раздел B). Первое совпадение побеждает. */
const RIG_WORDS = [
  ["cctv", /камер\w* наблюден|видеонаблюден|cctv|запись с камер/],
  ["dashcam", /регистратор|дэшкам|dashcam/],
  ["bodycam", /бодикам|нательн\w* камер/],
  ["doorbell", /домофон|дверн\w* звон|ring/],
  ["oldphone", /стар\w* телефон|нокиа|nokia|раскладушк|кнопочн\w* телефон/],
  ["digicam", /мыльниц|цифров\w* фотоаппарат/],
  ["vhs", /vhs|кассет|видеокассет|90-?х|девяност/],
  ["hi8", /hi8|хай.?8/],
  ["super8", /super ?8|супер ?8|кинопл[её]нк\w* 8|семейн\w* архив|60-?х|70-?х|шестидесят|семидесят/],
  ["dv2000", /атмосферн|живо[ейг]|живая съ|как в 2000|2000-?х|нулевы|домашн\w* видео|лампов|ностальг|скейт|как будто снял друг|любительск/],
  ["gopro", /гопро|gopro|экшн-?камер|от первого лица|на шлеме|pov/],
  ["phone", /влог|тикток|tiktok|рилс|reels|сторис|ugc|на телефон|селфи/],
  ["film", /на пл[её]нку|пл[её]ночн|kodak|кодак|35 ?мм/],
  ["vintage", /16 ?мм|инди|винтаж/],
  ["imax", /imax|аймакс/],
  ["anamorphic", /блокбастер|эпичн|как в кино|широкоформат|голливуд/],
  ["product", /реклам|товар|предметк|продукт/],
  ["docu", /документал|репортаж|интервью|новост/],
];

function rigFromText(text) {
  const low = (text || "").toLowerCase();
  const hit = RIG_WORDS.find(([, re]) => re.test(low));
  return hit ? hit[0] : null;
}

/* ---------- Движения (раздел D): формула Movement / Speed / Framing / End ---------- */
const MOVES = {
  static:   { g: "Статика и поворот", ru: "Статика", en: "locked-off static shot. Movement: one fixed camera position for the whole clip. Speed: still and steady. Framing: same angle, height and composition. End: the same framing.", r: "неподвижная камера. Движение: одна точка на весь клип. Темп: полная статика. Кадр: ракурс, высота и композиция не меняются. Финал: тот же кадр." },
  panR:     { g: "Статика и поворот", ru: "Панорама вправо", en: "pan right. Movement: rotate horizontally left to right from one fixed point. Speed: smooth constant rotation. Framing: horizon level, new space enters from the right. End: settle on a clear composition.", r: "панорама вправо. Движение: поворот слева направо с одной точки. Темп: плавный и ровный. Кадр: горизонт ровный, справа открывается новое пространство. Финал: ясная композиция." },
  panL:     { g: "Статика и поворот", ru: "Панорама влево", en: "pan left. Movement: rotate horizontally right to left from one fixed point. Speed: smooth constant rotation. Framing: horizon level, new space enters from the left. End: settle on a clear composition.", r: "панорама влево. Движение: поворот справа налево с одной точки. Темп: плавный. Кадр: горизонт ровный, слева открывается пространство. Финал: ясная композиция." },
  whip:     { g: "Статика и поворот", ru: "Резкая панорама", en: "whip pan. Movement: rotate rapidly from one readable composition to a new target. Speed: fast snap with brief motion blur. Framing: start and land on readable targets. End: a sharp final frame.", r: "резкая панорама. Движение: быстрый поворот от одного объекта к другому. Темп: рывок с коротким смазом. Кадр: начало и конец читаются. Финал: резкий итоговый кадр." },
  tiltUp:   { g: "Статика и поворот", ru: "Наклон вверх", en: "tilt up. Movement: rotate upward from one fixed point. Speed: smooth constant tilt. Framing: the tall subject stays centered as the frame travels up. End: land on the upper target.", r: "наклон вверх. Движение: поворот вверх с одной точки. Темп: плавный. Кадр: высокий объект по центру. Финал: верхняя цель." },
  tiltDown: { g: "Статика и поворот", ru: "Наклон вниз", en: "tilt down. Movement: rotate downward from one fixed point. Speed: smooth constant tilt. Framing: the subject stays centered as the frame travels down. End: land on the lower target.", r: "наклон вниз. Движение: поворот вниз с одной точки. Темп: плавный. Кадр: объект по центру. Финал: нижняя цель." },
  zoomIn:   { g: "Зум", ru: "Медленный зум к герою", en: "slow zoom in. Movement: slowly increase focal length toward a tighter frame, camera stays in place. Speed: gradual and even. Framing: the main target stays readable as it grows. End: a stable tighter composition.", r: "медленный зум. Движение: фокусное плавно растёт, камера на месте. Темп: ровный. Кадр: цель читается и растёт. Финал: устойчивый более крупный кадр." },
  zoomOut:  { g: "Зум", ru: "Медленный зум от героя", en: "slow zoom out. Movement: slowly decrease focal length, camera stays in place. Speed: gradual and even. Framing: the target stays readable as surroundings appear. End: a stable wider composition.", r: "медленный отъезд зумом. Движение: фокусное плавно уменьшается, камера на месте. Темп: ровный. Кадр: появляется окружение. Финал: более общий кадр." },
  fastZoom: { g: "Зум", ru: "Быстрый зум", en: "fast zoom in. Movement: quickly increase focal length toward the target. Speed: quick and decisive. Framing: the target stays centered through the scale change. End: a stable tighter composition.", r: "быстрый зум. Движение: быстрое увеличение к цели. Темп: решительный. Кадр: цель по центру. Финал: устойчивый крупный кадр." },
  crashIn:  { g: "Зум", ru: "Удар зумом", en: "crash zoom in. Movement: snap the lens rapidly toward the target. Speed: very fast and punchy. Framing: the target stays readable through the sudden change. End: a bold tight composition.", r: "удар зумом. Движение: мгновенный рывок к цели. Темп: очень быстрый. Кадр: цель читается. Финал: смелый крупный кадр." },
  dollyIn:  { g: "Тележка и сопровождение", ru: "Наезд (долли)", en: "dolly in. Movement: the camera physically travels forward in a straight line toward the subject. Speed: smooth controlled push. Framing: height and lens direction stay the same while distance closes. End: a tighter composition.", r: "наезд. Движение: камера физически едет прямо к герою. Темп: плавный и контролируемый. Кадр: высота и направление те же, дистанция сокращается. Финал: более крупный план." },
  dollyOut: { g: "Тележка и сопровождение", ru: "Отъезд (долли)", en: "dolly out. Movement: the camera physically travels backward away from the subject. Speed: smooth controlled retreat. Framing: more environment enters the frame. End: a wider composition.", r: "отъезд. Движение: камера физически едет назад от героя. Темп: плавный. Кадр: входит окружение. Финал: более общий план." },
  tracking: { g: "Тележка и сопровождение", ru: "Сопровождение", en: "tracking shot. Movement: travel through the scene with the subject. Speed: match the subject's pace. Framing: the subject stays readable while the environment moves around them. End: a clear moving composition.", r: "сопровождение. Движение: камера движется вместе с героем. Темп: в темпе героя. Кадр: герой читается, окружение движется. Финал: ясная движущаяся композиция." },
  follow:   { g: "Тележка и сопровождение", ru: "За героем через плечо", en: "follow shot from behind. Movement: move behind the subject along their route at shoulder height. Speed: match their pace. Framing: back, shoulder or head as the foreground guide, the route ahead readable. End: keep following with the subject leading.", r: "за героем сзади. Движение: камера идёт за героем на уровне плеча. Темп: как у героя. Кадр: спина или плечо на переднем плане, путь впереди читается. Финал: продолжаем следовать." },
  reverse:  { g: "Тележка и сопровождение", ru: "Пятится перед героем", en: "reverse tracking shot. Movement: move backward in front of the walking subject. Speed: match their forward pace. Framing: stable front-facing framing of face and body while the background moves. End: a clear front-facing moving composition.", r: "камера пятится перед героем. Движение: назад перед идущим героем. Темп: как у героя. Кадр: лицо и фигура анфас, фон движется. Финал: ясный фронтальный кадр в движении." },
  side:     { g: "Тележка и сопровождение", ru: "Сбоку параллельно", en: "side tracking shot. Movement: move parallel beside the subject along their direction. Speed: match the subject. Framing: profile or three-quarter at a stable distance. End: continue the parallel move.", r: "сбоку параллельно. Движение: камера идёт рядом параллельно. Темп: как у героя. Кадр: профиль или три четверти на постоянной дистанции. Финал: продолжение движения." },
  low:      { g: "Тележка и сопровождение", ru: "Низко у земли", en: "low tracking shot. Movement: travel at ground height alongside the movement path. Speed: match footsteps, paws or wheels. Framing: the low detail stays readable while the ground plane moves. End: keep the low perspective.", r: "низкое сопровождение. Движение: камера у земли рядом с движением. Темп: как шаги, лапы или колёса. Кадр: деталь у земли читается. Финал: низкая точка сохраняется." },
  vehicle:  { g: "Тележка и сопровождение", ru: "С транспортом", en: "vehicle tracking shot. Movement: travel with the vehicle along its route. Speed: match the vehicle. Framing: the vehicle stable in frame while the road moves past. End: a clear moving vehicle composition.", r: "с транспортом. Движение: камера едет вместе с машиной. Темп: как у машины. Кадр: машина стабильна, дорога несётся. Финал: ясный кадр в движении." },
  chase:    { g: "Тележка и сопровождение", ru: "Погоня", en: "chase shot. Movement: follow the moving subject quickly along the action route. Speed: fast, reactive and physically close. Framing: the subject stays visible with energetic reframing. End: stay connected to the subject in motion.", r: "погоня. Движение: камера быстро следует за героем. Темп: быстрый, близко. Кадр: герой виден, энергичная перекадровка. Финал: камера не теряет героя." },
  truck:    { g: "Перемещения", ru: "Проезд вбок", en: "truck right. Movement: move the camera physically to the right on a straight path. Speed: smooth constant lateral travel. Framing: the lens faces the same direction while the scene slides across. End: a clean lateral composition.", r: "проезд вбок. Движение: камера едет вправо по прямой. Темп: ровный. Кадр: объектив смотрит прямо, сцена проплывает. Финал: чистая композиция." },
  pedUp:    { g: "Перемещения", ru: "Подъём камеры", en: "pedestal up. Movement: move the whole camera straight up. Speed: smooth constant lift. Framing: the lens stays level and pointed the same way. End: the higher framing clearly readable.", r: "подъём камеры. Движение: вся камера поднимается вертикально. Темп: плавный. Кадр: объектив ровно. Финал: верхний кадр читается." },
  slider:   { g: "Перемещения", ru: "Слайдер", en: "slider move. Movement: slide the camera a short distance sideways. Speed: slow controlled motion. Framing: foreground, subject and background shift in readable parallax. End: a refined composition from the new angle.", r: "слайдер. Движение: короткое смещение вбок. Темп: медленный. Кадр: слои сдвигаются с параллаксом. Финал: выверенный кадр под новым углом." },
  pushPast: { g: "Перемещения", ru: "Проход мимо переднего плана", en: "push past. Movement: move forward past a close foreground object or opening. Speed: smooth forward glide. Framing: the foreground passes near the lens while the space beyond becomes clear. End: arrive beyond the foreground layer.", r: "проход мимо переднего плана. Движение: камера проходит мимо близкого объекта или проёма. Темп: плавный. Кадр: передний план проплывает у объектива. Финал: камера за ним." },
  arc:      { g: "Перемещения", ru: "Дуга", en: "arc. Movement: travel on a shallow curve around the subject. Speed: smooth and measured. Framing: distance, height and subject readability stay constant while the angle changes. End: a new side angle.", r: "дуга. Движение: неглубокая дуга вокруг героя. Темп: размеренный. Кадр: дистанция и высота постоянны, меняется угол. Финал: новый ракурс сбоку." },
  orbit:    { g: "Перемещения", ru: "Облёт", en: "orbit. Movement: circle around the subject at a consistent radius. Speed: smooth and controlled. Framing: the subject centered while the background rotates. End: complete the arc with stable framing.", r: "облёт. Движение: круг вокруг героя на постоянном расстоянии. Темп: плавный. Кадр: герой по центру, фон вращается. Финал: завершённая дуга, устойчивый кадр." },
  handheld: { g: "Человек-оператор", ru: "С рук", en: "handheld shot. Movement: the camera held at operator height with natural body movement. Speed: responsive and organic. Framing: the subject readable with subtle sway and micro-adjustments. End: a natural handheld composition.", r: "съёмка с рук. Движение: камера в руках оператора, естественные движения тела. Темп: живой. Кадр: герой читается, лёгкое покачивание. Финал: естественный кадр с рук." },
  bodycam:  { g: "Человек-оператор", ru: "Камера на теле", en: "body-mounted camera. Movement: the camera fixed to the subject's torso or helmet while they move. Speed: matches the body motion. Framing: hands or body edges in frame, the world moving around. End: still locked to the body.", r: "камера на теле. Движение: камера закреплена на корпусе или шлеме героя. Темп: как движения тела. Кадр: руки или край тела в кадре, мир движется вокруг. Финал: камера по-прежнему на теле." },
  snorri:   { g: "Человек-оператор", ru: "Сноррикам (лицо неподвижно)", en: "body-mounted Snorricam. Movement: the camera fixed facing the subject's face while they move. Speed: matches the body. Framing: the face close and centered, the background swinging around. End: the subject still locked in frame.", r: "сноррикам. Движение: камера закреплена напротив лица героя. Темп: как тело. Кадр: лицо крупно по центру, фон раскачивается. Финал: герой всё так же в кадре." },
  craneUp:  { g: "Кран и дрон", ru: "Кран вверх", en: "crane up. Movement: travel smoothly upward through open space. Speed: slow controlled lift. Framing: the subject or place readable as the camera rises. End: the larger scale clearly visible.", r: "кран вверх. Движение: плавный подъём. Темп: медленный. Кадр: герой или место читаются. Финал: виден масштаб." },
  craneDown:{ g: "Кран и дрон", ru: "Кран вниз", en: "crane down. Movement: travel smoothly downward through open space. Speed: slow controlled descent. Framing: the place readable as the camera descends. End: the subject or destination clearly visible.", r: "кран вниз. Движение: плавный спуск. Темп: медленный. Кадр: место читается. Финал: герой или цель видны." },
  droneIn:  { g: "Кран и дрон", ru: "Дрон к цели", en: "drone push in. Movement: fly forward through open space toward the subject. Speed: controlled aerial glide. Framing: the route and destination readable. End: a closer aerial composition.", r: "дрон к цели. Движение: полёт вперёд к герою. Темп: плавное парение. Кадр: путь и цель читаются. Финал: более близкий кадр сверху." },
  droneOut: { g: "Кран и дрон", ru: "Дрон отлетает", en: "drone pull back. Movement: fly backward away from the subject. Speed: controlled aerial retreat. Framing: the subject readable as more landscape appears. End: a wide aerial composition.", r: "дрон отлетает. Движение: полёт назад от героя. Темп: плавный. Кадр: появляется пейзаж. Финал: широкий кадр сверху." },
  heli:     { g: "Кран и дрон", ru: "Вертолётный пролёт", en: "helicopter-style aerial shot. Movement: a broad gradual flight path from high altitude. Speed: steady. Framing: the landscape or distant subject readable at wide scale. End: a stable high-altitude composition.", r: "вертолётный пролёт. Движение: широкая траектория на высоте. Темп: ровный. Кадр: пейзаж читается в масштабе. Финал: устойчивый кадр с высоты." },
  pov:      { g: "Специальные", ru: "От первого лица", en: "first-person view. Movement: forward at eye height from the character's perspective. Speed: natural walking or reaching pace. Framing: visible hands or body edges as reference. End: arrive at the next point of action.", r: "от первого лица. Движение: вперёд на уровне глаз героя. Темп: шаг или движение руки. Кадр: видны руки. Финал: следующая точка действия." },
  tiltshift:{ g: "Специальные", ru: "Тилт-шифт (миниатюра)", en: "tilt-shift miniature view. Movement: hold or glide from a high angled view. Speed: small precise movement. Framing: a narrow band of sharp focus with soft blur above and below. End: the miniature look intact.", r: "тилт-шифт. Движение: стоп или скольжение сверху под углом. Темп: точный. Кадр: узкая полоса резкости, размытие сверху и снизу. Финал: эффект миниатюры." },
  infinite: { g: "Специальные", ru: "Бесконечный зум", en: "infinite zoom. Movement: zoom continuously into the exact center. Speed: smooth, accelerating. Framing: the central target stays centered as it expands. End: the next world fills the frame.", r: "бесконечный зум. Движение: непрерывно в центр кадра. Темп: ускоряется. Кадр: цель по центру. Финал: новый мир заполняет кадр." },
  earth:    { g: "Специальные", ru: "Отлёт до планеты", en: "earth zoom out. Movement: pull upward from street to city to landscape to planet scale. Speed: rapid expanding. Framing: the original spot stays centered. End: a planet-scale view.", r: "отлёт до планеты. Движение: от улицы к городу, пейзажу и планете. Темп: быстрый. Кадр: исходная точка по центру. Финал: вид планеты." },
  timelapse:{ g: "Специальные", ru: "Таймлапс", en: "locked-camera time-lapse. Movement: one fixed position while time moves rapidly. Speed: fast time compression, stable camera. Framing: the same composition and horizon. End: visible passage of time from the same angle.", r: "таймлапс. Движение: камера неподвижна, время бежит. Темп: быстрое сжатие времени. Кадр: та же композиция. Финал: видно, как прошло время." },
  passThru: { g: "Специальные", ru: "Сквозь преграду", en: "pass-through movement. Movement: move toward a surface, window or barrier and continue into the space beyond. Speed: smooth centered glide. Framing: the opening centered as the transition point. End: arrive inside the revealed space.", r: "сквозь преграду. Движение: к окну или стене и дальше в пространство за ней. Темп: плавный. Кадр: проём по центру. Финал: камера внутри нового пространства." },
  dollyZoom:{ g: "Специальные", ru: "Долли-зум (головокружение)", en: "dolly zoom. Movement: the camera dollies in while the lens zooms out (or the reverse) so the subject keeps its size. Speed: slow and steady. Framing: the subject stays the same size while the background stretches or compresses. End: the warped perspective holds.", r: "долли-зум. Движение: камера едет вперёд, зум уходит назад (или наоборот), герой не меняет размер. Темп: медленный. Кадр: фон растягивается или сжимается. Финал: искажённая перспектива держится." },
};

/* Выбор движения по идее (раздел E). Первое совпадение. */
const MOVE_WORDS = [
  ["dollyZoom", /головокруж|осознал\w* ужас|вертиго/],
  ["timelapse", /таймлапс|время бежит|день сменя|ночь сменя|закат за минут/],
  ["passThru", /сквозь (окно|стен|экран|дверь)|через окно влета|портал/],
  ["earth", /до планеты|из космоса|с орбиты/],
  ["tiltshift", /миниатюр|игрушечн\w* город|тилт-?шифт/],
  ["snorri", /паник|пьян|опьянен|головой кружит|в бреду/],
  ["pov", /от первого лица|глазами|pov/],
  ["vehicle", /едет|за рул|машин|мотоцикл|поезд|велосипед|на скейте/],
  ["chase", /убега|бежит от|погон|гонит|спаса\w* бегством|догоня/],
  ["side", /бежит|бега|мчит|несётся|несется/],
  ["reverse", /идёт и говор|идет и говор|разговаривает на ходу/],
  ["follow", /идёт|идет|гуля|шага|пробира|бред[её]т|уходит/],
  ["orbit", /танцу|кружит|крутит|вращ|триумф|герой-момент/],
  ["tiltUp", /огромн|гигант|небоскр|башн|над ней|над ним|в небо|взлета/],
  ["low", /лап[ыа]|шаги|колёс|колес|у земли|ползёт|ползет/],
  ["dollyIn", /осозна|замира|плач|слёз|слез|понима|вспомина|эмоци|задумал/],
  ["dollyOut", /одинок|прощан|уходит вдаль|остаётся один|остается один/],
  ["crashIn", /шок|внезапно|вдруг|испуг|в ужасе/],
  ["static", /говорит в камеру|в камеру|интервью|объясня|рассказыва/],
];

function moveFromText(text, a) {
  const low = (text || "").toLowerCase();
  const hit = MOVE_WORDS.find(([, re]) => re.test(low));
  if (hit) return hit[0];
  const g = a.genre && a.genre.id, k = a.subjects[0] && a.subjects[0].kind;
  if (g === "epic") return "droneOut";
  if (g === "horror") return "handheld";
  if (k === "product") return "orbit";
  if (k === "animal") return "dollyIn";
  return "dollyIn";
}

/* Формат камеры сильнее жанра: CCTV — статика, DV — с рук, GoPro — на теле */
const FORMAT_SAFE = { static: ["static"], handheld: ["handheld", "static", "follow", "chase", "side", "reverse", "zoomIn", "fastZoom", "crashIn", "pov", "panR", "panL", "whip", "tiltUp", "tiltDown", "low"], bodycam: ["bodycam", "pov"], vehicle: ["vehicle", "static"] };

function chooseMove(text, a, rigId, userMove) {
  if (userMove && userMove !== "auto") return userMove;
  const rig = rigId && RIGS[rigId];
  const wanted = moveFromText(text, a);
  if (rig && rig.move) {
    const ok = FORMAT_SAFE[rig.move] || [rig.move];
    return ok.includes(wanted) ? wanted : rig.move;
  }
  return wanted;
}

function moveLine(id) {
  const m = MOVES[id] || MOVES.dollyIn;
  const en = m.en.replace(". Movement: ", " — ").replace(/\. (Speed|Framing|End): /g, (_, w) => `; ${w.toLowerCase()}: `);
  const ru = m.r.replace(". Движение: ", " — ").replace(/\. (Темп|Кадр|Финал): /g, (_, w) => `; ${w.toLowerCase()}: `);
  return [en.charAt(0).toUpperCase() + en.slice(1), ru.charAt(0).toUpperCase() + ru.slice(1)];
}
