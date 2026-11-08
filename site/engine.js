/* Prompt Atelier · движок разбора идеи (офлайн, без ИИ)
   Разбирает свободный текст на место, сезон, время, погоду, героя, жанр и достраивает недостающее
   по правилам knowledge/prompt_service_knowledge_base.md (разделы 18–20).
   Каждая запись: re — корни слов в идее; en/ru — фразы для промпта. */

const PLACES = [
  { id: "taiga", re: /сибир|тайг/, label: "Сибирская тайга", season: "winter",
    en: "Siberian taiga: dense dark spruce and birch forest, deep untouched snowdrifts, a frozen river bend in the distance",
    ru: "сибирская тайга: густой тёмный ельник и березняк, глубокие нетронутые сугробы, вдали изгиб замёрзшей реки",
    sound: ["wind moving through spruce branches, snow creaking under weight, a distant crow", "ветер в еловых ветках, скрип снега под весом, далёкий крик вороны"] },
  { id: "arctic", re: /арктик|антарктид|тундр|северн\w* полюс|ледник|айсберг/, label: "Арктика / тундра", season: "winter",
    en: "open Arctic tundra: flat wind-carved snow, blue ice ridges, endless white horizon",
    ru: "открытая арктическая тундра: плоский снег с ветровыми застругами, голубые ледяные гряды, бесконечный белый горизонт",
    sound: ["howling wind, ice cracking far away", "завывание ветра, далёкий треск льда"] },
  { id: "desert", re: /пустын|бархан|сахар/, label: "Пустыня", season: "summer",
    en: "sand desert: rippled dunes, sharp dune crests, heat haze over the horizon",
    ru: "песчаная пустыня: барханы с рябью, острые гребни дюн, марево над горизонтом",
    sound: ["dry wind hissing over sand", "сухой ветер, шуршащий по песку"] },
  { id: "jungle", re: /джунгл|тропик|амазон|тропическ\w* лес/, label: "Джунгли", season: "summer",
    en: "humid tropical jungle: layered giant leaves, hanging vines, mist between trunks, wet glossy foliage",
    ru: "влажные тропические джунгли: ярусы огромных листьев, свисающие лианы, дымка между стволами, мокрая глянцевая листва",
    sound: ["dense insect chorus, birds calling, dripping water", "плотный хор насекомых, крики птиц, капель"] },
  { id: "beach", re: /пляж|море|океан|побереж|берег\w* мор|прибо/, label: "Морское побережье",
    en: "seashore: wet sand reflecting the sky, rolling waves with white foam, a wide open horizon",
    ru: "морское побережье: мокрый песок отражает небо, накатывающие волны с белой пеной, широкий открытый горизонт",
    sound: ["surf rolling and retreating, gulls", "накат и откат прибоя, чайки"] },
  { id: "mountains", re: /гор[аыуе ]|горах|горн|альп|скал|ущель|вершин/, label: "Горы",
    en: "mountain landscape: steep rocky slopes, distant layered ridges, thin clear air",
    ru: "горный пейзаж: крутые скалистые склоны, слои дальних хребтов, прозрачный разреженный воздух",
    sound: ["high-altitude wind, small stones rolling", "высокогорный ветер, скатывающиеся камешки"] },
  { id: "swamp", re: /болот|топь|мангр/, label: "Болото",
    en: "swamp: still dark water, reeds and moss, half-sunken logs, low mist on the surface",
    ru: "болото: тёмная стоячая вода, камыш и мох, полузатопленные коряги, низкий туман над водой",
    sound: ["frogs, water bubbles, insects", "лягушки, бульканье воды, насекомые"] },
  { id: "river", re: /(?<![а-яё])рек[аеиу](?![а-яё])|(?<![а-яё])озер|(?<![а-яё])пруд/, label: "Река / озеро",
    en: "riverbank: slow water with soft reflections, stones and grass along the edge",
    ru: "берег реки: медленная вода с мягкими отражениями, камни и трава у кромки",
    sound: ["gentle water flow, birds", "мягкое течение воды, птицы"] },
  { id: "forest", re: /(?<![а-яё])лес(?!тн)|(?<![а-яё])рощ|(?<![а-яё])чащ/, label: "Лес",
    en: "forest: tall trunks receding in depth, layered undergrowth, light filtering through the canopy",
    ru: "лес: высокие стволы, уходящие в глубину, ярусный подлесок, свет, пробивающийся сквозь кроны",
    sound: ["leaves rustling, birdsong, twigs snapping underfoot", "шелест листвы, пение птиц, хруст веток"] },
  { id: "field", re: /(?<![а-яё])пол[еяю](?![а-яё])|(?<![а-яё])луг|деревн|ферм|(?<![а-яё])сел[оа](?![а-яё])/, label: "Поле / деревня",
    en: "open countryside: a wide field, a wooden fence, a few distant houses",
    ru: "открытая сельская местность: широкое поле, деревянный забор, несколько далёких домов",
    sound: ["wind over grass, distant rooster, insects", "ветер над травой, далёкий петух, насекомые"] },
  { id: "space", re: /космос|орбит|планет|луна|марс|звездолёт|звездолет/, label: "Космос",
    en: "outer space: deep black void, crisp stars, a planet's curved horizon glowing at the edge of frame",
    ru: "открытый космос: глубокая чёрная пустота, чёткие звёзды, изогнутый горизонт планеты светится у края кадра",
    sound: ["near silence, low resonant hum", "почти тишина, низкий резонирующий гул"] },
  { id: "underwater", re: /под водой|подводн|(?<![а-яё])риф(?![а-яё])|на дне/, label: "Под водой",
    en: "underwater: clear turquoise water, light caustics rippling over sand and coral, floating particles",
    ru: "под водой: прозрачная бирюзовая вода, блики каустики бегут по песку и кораллам, взвесь частиц",
    sound: ["muffled underwater ambience, bubbles", "приглушённая подводная атмосфера, пузыри"] },
  { id: "metro", re: /метро|станци|вокзал|поезд|электричк/, label: "Метро / вокзал",
    en: "subway station: tiled walls, long platform, overhead fluorescent lights, a train arriving",
    ru: "станция метро: плиточные стены, длинная платформа, люминесцентные лампы под потолком, прибывающий поезд",
    sound: ["train rumble, announcements echo, footsteps on tiles", "гул поезда, эхо объявлений, шаги по плитке"] },
  { id: "cafe", re: /каф[еэ]|кофейн|ресторан|(?<![а-яё])бар(?![а-яё])|бистро/, label: "Кафе",
    en: "cozy café interior: wooden tables, warm pendant lamps, a coffee machine steaming behind the counter, street visible through the window",
    ru: "уютное кафе: деревянные столы, тёплые подвесные лампы, кофемашина парит за стойкой, за окном видна улица",
    sound: ["soft café murmur, cups clinking, espresso machine hiss", "негромкий гул кафе, звон чашек, шипение кофемашины"] },
  { id: "kitchen", re: /кухн/, label: "Кухня",
    en: "home kitchen: countertop with real utensils, a window over the sink, steam rising from a pan",
    ru: "домашняя кухня: столешница с настоящей утварью, окно над раковиной, пар поднимается от сковороды",
    sound: ["sizzling pan, utensils on ceramic", "шкворчание сковороды, стук утвари о керамику"] },
  { id: "room", re: /комнат|квартир|гостин|спальн|интерьер|дом[ае]? /, label: "Комната / квартира",
    en: "apartment room: real proportions, a window as the main light source, walls, floor and furniture in consistent perspective",
    ru: "комната в квартире: реальные пропорции, окно как главный источник света, стены, пол и мебель в согласованной перспективе",
    sound: ["quiet room tone, distant street through the window", "тихий фон комнаты, далёкая улица за окном"] },
  { id: "office", re: /офис|кабинет|коворкинг/, label: "Офис",
    en: "modern office: glass partitions, desks with monitors, daylight from floor-to-ceiling windows",
    ru: "современный офис: стеклянные перегородки, столы с мониторами, дневной свет из панорамных окон",
    sound: ["keyboard clicks, air conditioning hum", "щелчки клавиатур, гул кондиционера"] },
  { id: "studio", re: /студи|фотозон|на белом фоне|на чёрном фоне|на черном фоне/, label: "Студия",
    en: "photo studio: seamless backdrop, controlled light, nothing distracting in the background",
    ru: "фотостудия: бесшовный фон, контролируемый свет, ничего отвлекающего на фоне",
    sound: ["quiet studio room tone", "тихий фон студии"] },
  { id: "city", re: /город|улиц|мегаполис|проспект|площад|москв|питер|петербург|нью-йорк|токио|париж|лондон/, label: "Город",
    en: "city street: buildings with real facades, sidewalks, parked cars, passersby kept small in the background",
    ru: "городская улица: здания с настоящими фасадами, тротуары, припаркованные машины, прохожие мелко на заднем плане",
    sound: ["city traffic hum, distant horns, footsteps", "гул городского трафика, далёкие гудки, шаги"] },
  { id: "park", re: /парк|сквер|(?<![а-яё])сад[уе]?(?![а-яё])/, label: "Парк",
    en: "city park: paths, benches, trees, lawns, people far in the background",
    ru: "городской парк: дорожки, скамейки, деревья, газоны, люди далеко на заднем плане",
    sound: ["birds, distant children, leaves", "птицы, далёкие голоса детей, листва"] },
];

const SEASONS = [
  { id: "winter", re: /(?<![а-яё])зим|снег|снеж|мороз|сугроб|холод|(?<![а-яё])л[её]д(?![а-яё])|(?<![а-яё])льд|ледян/, label: "зима",
    en: "winter: snow on every horizontal surface, frost on branches, cold crisp air",
    ru: "зима: снег на всех горизонтальных поверхностях, иней на ветках, морозный прозрачный воздух" },
  { id: "spring", re: /весн|оттепел|цвет[еу]т|подснежник/, label: "весна",
    en: "spring: fresh young green, melting patches of snow, wet ground",
    ru: "весна: свежая молодая зелень, тающие пятна снега, влажная земля" },
  { id: "summer", re: /(?<![а-яё])лет(о|ом|а)(?![а-яё])|(?<![а-яё])жар[аы](?![а-яё])|(?<![а-яё])зно[йя]/, label: "лето",
    en: "summer: full green foliage, warm dry air, saturated colors",
    ru: "лето: густая зелёная листва, тёплый сухой воздух, насыщенные цвета" },
  { id: "autumn", re: /осен|листопад|жёлт\w* лист|желт\w* лист/, label: "осень",
    en: "autumn: yellow and rust foliage, fallen leaves on the ground, cool damp air",
    ru: "осень: жёлтая и ржавая листва, опавшие листья на земле, прохладный влажный воздух" },
];

const TIMES = [
  { id: "dawn", re: /рассвет|(?<![а-яё])утр|восход/, label: "рассвет" },
  { id: "golden", re: /закат|вечер|сумерк|золот\w* час/, label: "закат" },
  { id: "night", re: /ноч|полночь|темнот|в темноте/, label: "ночь" },
  { id: "day", re: /днём|днем|полдень|дневн/, label: "день" },
];

const WEATHER = [
  { id: "blizzard", re: /метел|вьюг|буран|пург/, label: "метель",
    en: "a blizzard: dense wind-driven snow crossing the frame, reduced visibility, snow building up on the subject",
    ru: "метель: плотный снег несётся ветром через кадр, видимость снижена, снег налипает на героя" },
  { id: "snowfall", re: /снегопад|падает снег|идёт снег|идет снег|снежинк/, label: "снегопад",
    en: "gentle snowfall: large flakes drifting down at different depths, some catching the light",
    ru: "мягкий снегопад: крупные хлопья падают на разной глубине, некоторые ловят свет" },
  { id: "rain", re: /дожд|ливен|ливн/, label: "дождь",
    en: "rain: streaks of falling rain, wet reflective surfaces, droplets running off edges",
    ru: "дождь: штрихи падающих капель, мокрые отражающие поверхности, капли стекают с краёв" },
  { id: "storm", re: /гроз|молни|шторм/, label: "гроза",
    en: "a storm: heavy dark clouds, gusting wind, occasional lightning flashes that briefly light the scene",
    ru: "гроза: тяжёлые тёмные тучи, порывистый ветер, редкие вспышки молний на мгновение освещают сцену" },
  { id: "fog", re: /туман|дымк|мгл/, label: "туман",
    en: "fog: soft layers of mist that fade the background and reveal depth",
    ru: "туман: мягкие слои дымки, которые растворяют фон и показывают глубину" },
  { id: "overcast", re: /пасмурн|облачн|серо/, label: "пасмурно",
    en: "overcast sky: even soft light, no hard shadows",
    ru: "пасмурное небо: ровный мягкий свет, без жёстких теней" },
  { id: "clear", re: /солнечн|(?<![а-яё])ясн|солнце/, label: "ясно",
    en: "clear sky with direct sunlight",
    ru: "ясное небо и прямое солнце" },
];

/* Герои: kind влияет на фактуру, камеру и звук */
const SUBJECTS = [
  { id: "crocodile", re: /крокодил|аллигатор/, kind: "animal", label: "крокодил",
    en: "a large crocodile", ru: "крупный крокодил",
    texture: ["armored olive-brown scutes with ridged back plates, pale textured belly, slit-pupil amber eyes, heavy clawed feet",
              "панцирные оливково-бурые щитки с гребнями на спине, светлое рельефное брюхо, янтарные глаза с вертикальным зрачком, тяжёлые лапы с когтями"],
    toon: ["a friendly crocodile with a long rounded snout, oversized expressive eyes and a toothy grin", "дружелюбный крокодил с длинной округлой мордой, большими выразительными глазами и зубастой улыбкой"],
    sound: ["a low guttural hiss", "низкое гортанное шипение"], cold: "frost crystals forming on the scutes, the crocodile moving slowly and stiffly in the cold" , coldRu: "кристаллы инея на щитках, крокодил двигается медленно и скованно от холода" },
  { id: "cat", re: /(?<![а-яё])кот(?!ор)|кошк|котён|котен/, kind: "animal", label: "кот",
    en: "a domestic cat", ru: "домашний кот",
    texture: ["dense fur with individual guard hairs, whiskers catching the light, moist nose, reflective eyes", "густая шерсть с отдельными остевыми волосками, усы ловят свет, влажный нос, бликующие глаза"],
    toon: ["a round fluffy cat with big shiny eyes and a curious face", "круглый пушистый кот с большими блестящими глазами и любопытной мордой"],
    sound: ["soft purring, a short meow", "мягкое мурлыканье, короткое мяу"] },
  { id: "dog", re: /собак|(?<![а-яё])п[её]с(?![а-яё])|(?<![а-яё])щен|п[её]сик|(?<![а-яё])пс[аоу](?![а-яё])/, kind: "animal", label: "собака",
    en: "a dog", ru: "собака",
    texture: ["fur moving in layers with each step, wet nose, expressive eyebrows", "шерсть двигается слоями при каждом шаге, влажный нос, выразительные брови"],
    toon: ["a cheerful dog with floppy ears and a wagging tail", "весёлый пёс с висячими ушами и виляющим хвостом"],
    sound: ["panting, paws on the ground, a short bark", "дыхание, шаги лап, короткий лай"] },
  { id: "bear", re: /медвед|мишк/, kind: "animal", label: "медведь",
    en: "a brown bear", ru: "бурый медведь",
    texture: ["thick shaggy fur with lighter tips, heavy paws with long claws, small dark eyes", "густой косматый мех со светлыми кончиками, тяжёлые лапы с длинными когтями, маленькие тёмные глаза"],
    toon: ["a big cuddly bear with a round belly and small kind eyes", "большой плюшевый медведь с круглым животом и маленькими добрыми глазами"],
    sound: ["heavy breathing, a low grunt", "тяжёлое дыхание, низкое ворчание"] },
  { id: "wolf", re: /волк|волчиц/, kind: "animal", label: "волк", en: "a grey wolf", ru: "серый волк",
    texture: ["layered grey fur, alert ears, amber eyes", "многослойный серый мех, настороженные уши, янтарные глаза"],
    toon: ["a lanky grey wolf with pointy ears", "долговязый серый волк с острыми ушами"], sound: ["a distant howl", "далёкий вой"] },
  { id: "fox", re: /(?<![а-яё])лис(а|ы|у|ой|иц|ён|ен)?(?!т)(?![а-яё])|лисиц|лисёнок|лисенок/, kind: "animal", label: "лиса", en: "a red fox", ru: "рыжая лиса",
    texture: ["bright rust-red fur, white chest, black-tipped ears, bushy tail", "ярко-рыжий мех, белая грудка, чёрные кончики ушей, пушистый хвост"],
    toon: ["a clever red fox with a huge fluffy tail", "хитрая рыжая лиса с огромным пушистым хвостом"], sound: ["soft yips", "тихое тявканье"] },
  { id: "bigcat", re: /тигр|(?<![а-яё])лев(?![а-яё])|(?<![а-яё])льв|леопард|ягуар|гепард/, kind: "animal", label: "большая кошка", en: "a big cat (tiger or lion as named)", ru: "большая кошка (тигр или лев, как в идее)",
    texture: ["powerful muscles shifting under short fur, distinct markings, whiskers", "мощные мышцы под короткой шерстью, чёткий рисунок окраса, усы"],
    toon: ["a majestic big cat with a proud stance", "величественная большая кошка в гордой позе"], sound: ["a deep rumbling growl", "глубокое раскатистое рычание"] },
  { id: "horse", re: /лошад|(?<![а-яё])кон[ья]|жереб/, kind: "animal", label: "лошадь", en: "a horse", ru: "лошадь",
    texture: ["glossy short coat over defined muscles, flowing mane, breath from the nostrils", "блестящая короткая шерсть на рельефных мышцах, развевающаяся грива, дыхание из ноздрей"],
    toon: ["a graceful horse with a flowing stylized mane", "грациозная лошадь со стилизованной развевающейся гривой"], sound: ["hooves, snorting", "стук копыт, фырканье"] },
  { id: "bird", re: /птиц|ор[её]л|(?<![а-яё])орл|(?<![а-яё])ворон|(?<![а-яё])сов[аыу](?![а-яё])|попуга|(?<![а-яё])голуб(ь|я|ем|и)(?![а-яё])/, kind: "animal", label: "птица", en: "a bird", ru: "птица",
    texture: ["individual feathers with fine barbs, sharp eyes, feathers lifting in the wind", "отдельные перья с тонкими бородками, острый взгляд, перья приподнимаются от ветра"],
    toon: ["a lively bird with bright feathers", "живая птица с яркими перьями"], sound: ["wing flaps, a call", "взмахи крыльев, крик"] },
  { id: "dragon", re: /дракон/, kind: "creature", label: "дракон", en: "a dragon", ru: "дракон",
    texture: ["overlapping scales with iridescent edges, leathery wing membranes with visible veins, smoke from the nostrils", "перекрывающиеся чешуйки с переливающимися краями, кожистые перепонки крыльев с видимыми прожилками, дым из ноздрей"],
    toon: ["a playful dragon with tiny wings and big eyes", "игривый дракончик с маленькими крыльями и большими глазами"], sound: ["deep breath, wings beating, a roar", "глубокое дыхание, взмахи крыльев, рёв"] },
  { id: "dino", re: /динозавр|тираннозавр|раптор/, kind: "creature", label: "динозавр", en: "a dinosaur", ru: "динозавр",
    texture: ["rough pebbled skin, muscular legs, heavy footsteps shaking the ground", "грубая бугристая кожа, мускулистые ноги, тяжёлые шаги сотрясают землю"],
    toon: ["a goofy friendly dinosaur", "забавный добрый динозавр"], sound: ["heavy thuds, a roar", "тяжёлые удары шагов, рёв"] },
  { id: "robot", re: /робот|андроид|киборг/, kind: "creature", label: "робот", en: "a robot", ru: "робот",
    texture: ["brushed metal panels, visible joints and seams, small indicator lights", "панели из шлифованного металла, видимые шарниры и швы, маленькие индикаторы"],
    toon: ["a cute boxy robot with round screen eyes", "милый угловатый робот с круглыми глазами-экранами"], sound: ["servo whirs, soft beeps", "жужжание сервоприводов, тихие сигналы"] },
  { id: "girl", re: /девочк|девчушк/, kind: "human", label: "девочка", en: "a young girl", ru: "девочка" },
  { id: "boy", re: /мальчик|мальчишк|пацан/, kind: "human", label: "мальчик", en: "a young boy", ru: "мальчик" },
  { id: "child", re: /реб[её]н|малыш|(?<![а-яё])дет[иейь]/, kind: "human", label: "ребёнок", en: "a child", ru: "ребёнок" },
  { id: "elder", re: /бабушк|дедушк|старик|старушк|пожил/, kind: "human", label: "пожилой человек", en: "an elderly person", ru: "пожилой человек" },
  { id: "woman", re: /девушк|женщин|девуш|(?<![а-яё])мам[аыу](?![а-яё])|блогерш|(?<![а-яё])она(?![а-яё])/, kind: "human", label: "девушка", en: "a young woman", ru: "молодая женщина" },
  { id: "man", re: /парен|мужчин|мужик|(?<![а-яё])пап[аыу](?![а-яё])|(?<![а-яё])блогер(?![а-яё])|(?<![а-яё])он(?![а-яё])/, kind: "human", label: "мужчина", en: "a young man", ru: "молодой мужчина" },
  { id: "person", re: /человек|(?<![а-яё])люди|(?<![а-яё])я(?![а-яё])|(?<![а-яё])себя|(?<![а-яё])меня/, kind: "human", label: "человек", en: "a person", ru: "человек" },
  { id: "car", re: /машин|автомобил|тачк|джип|гонк/, kind: "product", label: "автомобиль", en: "a car", ru: "автомобиль",
    texture: ["clean body panels reflecting the environment, defined headlights, tires with real tread", "чистые панели кузова отражают окружение, чёткие фары, шины с настоящим протектором"],
    toon: ["a bouncy stylized car with rounded shapes", "упругая стилизованная машинка с округлыми формами"], sound: ["engine purr, tires on the road", "урчание мотора, шины по дороге"] },
  { id: "perfume", re: /духи|парфюм|флакон|аромат/, kind: "product", label: "флакон духов", en: "a perfume bottle", ru: "флакон духов",
    texture: ["thick glass refracting light, liquid with subtle color, crisp label edges", "толстое стекло преломляет свет, жидкость с лёгким оттенком, чёткие края этикетки"],
    toon: ["a shiny stylized perfume bottle", "блестящий стилизованный флакон"], sound: ["a soft glass clink", "тихий стеклянный звон"] },
  { id: "drink", re: /кофе|чашк|напит|(?<![а-яё])сок(?![а-яё])|коктейл|бутылк|(?<![а-яё])банк[аи](?![а-яё])/, kind: "product", label: "напиток", en: "a drink", ru: "напиток",
    texture: ["condensation droplets on the surface, steam or bubbles matching the drink, real liquid physics", "капли конденсата на поверхности, пар или пузырьки по напитку, настоящая физика жидкости"],
    toon: ["a cheerful stylized drink", "весёлый стилизованный напиток"], sound: ["pouring liquid, ice clinking", "звук наливаемой жидкости, звон льда"] },
  { id: "food", re: /торт|(?<![а-яё])еда(?![а-яё])|(?<![а-яё])блюд|пицц|бургер|десерт|выпечк/, kind: "product", label: "еда", en: "a dish", ru: "блюдо",
    texture: ["appetizing real textures: crumbs, glaze highlights, soft steam", "аппетитные настоящие фактуры: крошки, блики глазури, лёгкий пар"],
    toon: ["a delicious stylized dish", "аппетитное стилизованное блюдо"], sound: ["subtle kitchen sounds", "тихие кухонные звуки"] },
  { id: "shoes", re: /кроссовк|обув|туфл|ботин/, kind: "product", label: "обувь", en: "a pair of shoes", ru: "пара обуви",
    texture: ["visible stitching, material grain of leather or mesh, sole tread", "видимые строчки, фактура кожи или сетки, протектор подошвы"],
    toon: ["stylized sneakers with bold shapes", "стилизованные кроссовки с яркими формами"], sound: ["footsteps", "шаги"] },
  { id: "gadget", re: /телефон|смартфон|часы|наушник|ноутбук|гаджет/, kind: "product", label: "гаджет", en: "a gadget", ru: "гаджет",
    texture: ["precise edges, anodized metal and glass reflections, a screen with real content", "точные грани, отражения анодированного металла и стекла, экран с реальным изображением"],
    toon: ["a sleek stylized gadget", "гладкий стилизованный гаджет"], sound: ["soft click", "мягкий щелчок"] },
];

const GENRES = [
  { id: "ad", re: /реклам|товар|продукт|бренд|продаж/, label: "реклама" },
  { id: "horror", re: /страш|ужас|хоррор|жутк|мрачн/, label: "хоррор" },
  { id: "action", re: /бег|прыг|погон|драк(?!он)|(?<![а-яё])бой|взрыв|лет[ия]т|мчит|экшн|танц/, label: "динамика" },
  { id: "funny", re: /смешн|прикол|(?<![а-яё])мем|юмор|забавн/, label: "юмор" },
  { id: "romance", re: /любов|романт|свидан|поцелу|нежн/, label: "романтика" },
  { id: "epic", re: /эпич|величеств|масштаб|огромн|гигант/, label: "эпик" },
  { id: "talk", re: /говорит|рассказыва|объясня|обращается|в камеру|блог/, label: "разговор в камеру" },
];

function pick(list, text) { return list.find((x) => x.re.test(text)) || null; }

/* Разбор идеи → структура с пометками «из идеи» / «додумано» */
function analyzeIdea(raw) {
  const text = " " + (raw || "").toLowerCase().replace(/ё/g, "е").replace(/[.,!?;:()«»"]/g, " ") + " ";
  const rawLower = " " + (raw || "").toLowerCase() + " ";
  const test = (re) => re.test(rawLower) || re.test(text);
  const find = (list) => list.find((x) => test(x.re)) || null;

  const place = find(PLACES);
  let season = find(SEASONS);
  let seasonInferred = false;
  if (!season && place && place.season) { season = SEASONS.find((s) => s.id === place.season); seasonInferred = true; }

  let time = find(TIMES);
  let timeInferred = false;
  if (!time) { time = TIMES.find((x) => x.id === (place && ["cafe", "metro"].includes(place.id) ? "night" : "day")); timeInferred = true; }
  if (time.id === "day" && test(/закат|рассвет/)) time = find(TIMES);

  let weather = find(WEATHER);
  let weatherInferred = false;
  if (!weather && season && season.id === "winter" && place && ["taiga", "arctic", "forest", "mountains", "field"].includes(place.id) && time.id !== "night") {
    weather = WEATHER.find((w) => w.id === "snowfall"); weatherInferred = true;
  }

  const pos = (re) => { const m = rawLower.match(re) || text.match(re); return m ? m.index : -1; };
  const subjects = SUBJECTS.map((s) => ({ s, i: pos(s.re) })).filter((x) => x.i >= 0).sort((x, y) => x.i - y.i).map((x) => x.s);
  // «я»/«он»/«она» не считаем человеком, если в идее уже есть животное или предмет
  const pronounOnly = (s) => ["person", "woman", "man"].includes(s.id) && !/человек|люди|девушк|женщин|парен|мужчин|мужик|себя|меня/.test(text);
  const named = subjects.filter((s) => !pronounOnly(s) || subjects.every((x) => x.kind === "human"));
  const uniq = named.filter((s, i) => !(s.kind === "human" && named.findIndex((x) => x.kind === "human") !== i));
  const genre = find(GENRES);
  const indoor = place && ["cafe", "kitchen", "room", "office", "studio", "metro"].includes(place.id);

  return { place, season, seasonInferred, time, timeInferred, weather, weatherInferred, subjects: uniq, genre, indoor };
}

/* ---------- Свет по сцене (раздел 6 базы) ---------- */
function autoLight(a) {
  const s = a.season && a.season.id, t = a.time.id, w = a.weather && a.weather.id, p = a.place && a.place.id;
  if (p === "underwater") return ["Sunlight from above breaks through the surface: moving caustic patterns, light falling off into blue with depth.", "Солнце сверху пробивается сквозь поверхность: бегущие узоры каустики, свет уходит в синеву с глубиной."];
  if (p === "space") return ["A single hard light from the nearby star on one side, deep black shadows on the other, a thin glow from the planet as fill.", "Один жёсткий свет от близкой звезды с одной стороны, глубокие чёрные тени с другой, тонкое свечение планеты как заполнение."];
  if (p === "studio") return ["Large soft key high front-left, subtle fill, controlled rim to separate the subject from the backdrop.", "Большой мягкий рисующий свет высоко спереди слева, слабое заполнение, аккуратный контровой для отделения от фона."];
  if (w === "storm") return ["Dark diffused storm light; lightning flashes briefly light the scene from above, each flash motivated and short, then back to dim.", "Тёмный рассеянный грозовой свет; вспышки молний кратко освещают сцену сверху, каждая с причиной и короткая, затем снова полумрак."];
  if (w === "fog") return ["Soft diffused light scattered by fog; background shapes fade into haze, the subject separated by tone rather than hard edges.", "Мягкий рассеянный свет в тумане; фон растворяется в дымке, герой отделён тоном, а не жёсткими границами."];
  if (t === "night") {
    if (a.indoor) return ["Night interior lit by warm practical lamps in frame; pools of light with readable shadows, a cool hint of street light through the window.", "Ночной интерьер, освещённый тёплыми лампами в кадре; пятна света с читаемыми тенями, холодный отсвет улицы из окна."];
    if (s === "winter") return ["Night snow lit by cold moonlight and a distant warm light source; snow glows blue, the subject rim-lit, shadows deep but readable.", "Ночной снег в холодном лунном свете и далёком тёплом источнике; снег светится голубым, герой с контурным светом, тени глубокие, но читаемые."];
    if (p === "city") return ["Night city: wet asphalt reflecting neon signs and street lamps, mixed warm and cool practicals, no flicker unless motivated.", "Ночной город: мокрый асфальт отражает неон и фонари, смешанный тёплый и холодный свет, без мерцания без причины."];
    return ["Night scene lit by moonlight and one motivated practical source; low exposure with preserved detail in the shadows.", "Ночная сцена: лунный свет и один мотивированный источник; низкая экспозиция с сохранёнными деталями в тенях."];
  }
  if (a.indoor) return ["Daylight from a window to one side as the key: soft shadow edge, gentle bounce fill from walls, background slightly darker than the subject.", "Дневной свет из окна сбоку как рисующий: мягкая граница тени, лёгкое отражённое заполнение от стен, фон чуть темнее героя."];
  if (s === "winter") {
    if (w === "blizzard") return ["Flat white blizzard light from all sides, low contrast, the subject defined by silhouette against moving snow.", "Плоский белый свет метели со всех сторон, низкий контраст, герой читается силуэтом на фоне летящего снега."];
    if (t === "golden" || t === "dawn") return ["Low winter sun just above the treeline: warm pink-gold light on snow tops, long blue shadows, crisp cold air.", "Низкое зимнее солнце над кромкой леса: тёплый розово-золотой свет на верхушках сугробов, длинные синие тени, прозрачный морозный воздух."];
    return ["Low pale winter sun from the side: long cool blue shadows across the snow, sparkling snow crystals, bright but soft snow bounce filling the shadow side.", "Низкое бледное зимнее солнце сбоку: длинные холодные синие тени на снегу, искрящиеся кристаллы снега, яркое мягкое отражение от снега заполняет теневую сторону."];
  }
  if (w === "rain" || w === "overcast") return ["Overcast diffused daylight, low contrast, wet surfaces picking up soft sky reflections.", "Пасмурный рассеянный дневной свет, низкий контраст, мокрые поверхности ловят мягкие отражения неба."];
  if (t === "golden") return ["Golden-hour sun low behind the subject: warm rim on edges, long shadows toward camera, the shadow side filled by warm bounce.", "Солнце золотого часа низко за героем: тёплый контур, длинные тени к камере, теневая сторона заполнена тёплым отражённым светом."];
  if (t === "dawn") return ["Soft dawn light: cool shadows, a warm glow on the horizon, light mist close to the ground.", "Мягкий рассветный свет: прохладные тени, тёплое свечение у горизонта, лёгкая дымка у земли."];
  if (p === "desert") return ["Hard high sun: short crisp shadows, bright sand bounce, heat shimmer over distant dunes.", "Жёсткое высокое солнце: короткие чёткие тени, яркое отражение от песка, марево над дальними дюнами."];
  if (p === "jungle" || p === "forest") return ["Sunlight filtering through the canopy in shafts and dappled patches, deep green shade between them.", "Солнечный свет пробивается сквозь кроны лучами и пятнами, между ними глубокая зелёная тень."];
  return ["Natural daylight from a high side angle, clear shadow direction, soft sky fill.", "Естественный дневной свет под высоким боковым углом, ясное направление теней, мягкое заполнение небом."];
}

/* Взаимодействие среды и героя: то, что делает кадр правдоподобным */
function interactions(a) {
  const out = [];
  const s = a.season && a.season.id, w = a.weather && a.weather.id, p = a.place && a.place.id;
  const living = a.subjects.some((x) => ["human", "animal", "creature"].includes(x.kind));
  if (s === "winter" && living) out.push(["visible breath vapor in the cold air", "видимый пар от дыхания в холодном воздухе"]);
  if (s === "winter") out.push(["snow compresses and leaves real tracks where the subject moves, loose snow falls off in clumps", "снег проминается и оставляет настоящие следы там, где движется герой, рыхлый снег осыпается комьями"]);
  a.subjects.forEach((x) => { if (s === "winter" && x.cold) out.push([x.cold, x.coldRu]); });
  if (w === "rain") out.push(["raindrops bead and run on surfaces, splashes where feet or objects touch the ground", "капли собираются и стекают по поверхностям, брызги там, где ноги или предметы касаются земли"]);
  if (p === "desert") out.push(["sand kicked up by movement drifts in the wind", "песок, поднятый движением, сносит ветром"]);
  if (p === "beach" || p === "river" || p === "swamp") out.push(["water reacts with ripples and splashes where it is touched", "вода реагирует рябью и брызгами в точках касания"]);
  if (p === "underwater") out.push(["bubbles rise, hair and loose fabric float, slow damped movement", "поднимаются пузыри, волосы и свободная ткань парят, движение плавное и замедленное"]);
  if (w === "blizzard" || w === "snowfall") out.push(["snowflakes settle on the subject and slowly accumulate", "снежинки оседают на героя и постепенно накапливаются"]);
  return out;
}

/* ---------- Съёмка для реализма (раздел 18.1) ---------- */
const RIGS = {
  cinema:   { label: "Кино: ARRI Alexa 35",
    body: ["ARRI Alexa 35 digital cinema camera", "цифровая кинокамера ARRI Alexa 35"],
    lens: (f) => [`Cooke S4/i ${f} prime`, `фикс-объектив Cooke S4/i ${f}`],
    look: ["natural cinematic color, gentle highlight roll-off", "естественный кинематографичный цвет, мягкий уход светов"] },
  canon:    { label: "Canon EOS R5 C",
    body: ["Canon EOS R5 C", "Canon EOS R5 C"],
    lens: (f) => [`Canon RF 24–70mm f/2.8 zoom set to ${f}`, `зум Canon RF 24–70 мм f/2.8 на ${f}`],
    look: ["clean natural documentary color", "чистый естественный документальный цвет"] },
  wildlife: { label: "Природа: Sony FX6 + телевик",
    body: ["Sony FX6, wildlife documentary setup on a tripod from a distance", "Sony FX6, съёмка дикой природы со штатива издалека"],
    lens: () => ["Sony FE 100–400mm G Master telephoto at 300mm, compressed perspective", "телеобъектив Sony FE 100–400 мм G Master на 300 мм, сжатая перспектива"],
    look: ["natural documentary color", "естественный документальный цвет"] },
  film:     { label: "Плёнка Kodak 35 мм",
    body: (night) => [`ARRICAM LT 35mm film camera loaded with Kodak Vision3 ${night ? "500T" : "250D"}`, `плёночная камера ARRICAM LT 35 мм, плёнка Kodak Vision3 ${night ? "500T" : "250D"}`],
    lens: (f) => [`Zeiss Ultra Prime ${f}`, `фикс-объектив Zeiss Ultra Prime ${f}`],
    look: ["fine organic film grain, gentle highlight roll-off, rich but natural color", "мелкое органичное плёночное зерно, мягкий уход светов, богатый, но естественный цвет"] },
  vintage:  { label: "Винтаж 16 мм",
    body: ["Arriflex 16SR3 16mm film camera, Kodak Vision3 200T", "плёночная камера Arriflex 16SR3, плёнка 16 мм Kodak Vision3 200T"],
    lens: (f) => [`Zeiss Super Speed ${f}`, `объектив Zeiss Super Speed ${f}`],
    look: ["visible grain, slightly softer detail, warm faded color, subtle gate weave", "заметное зерно, чуть мягче детализация, тёплый выцветший цвет, лёгкое дрожание кадра"] },
  phone:    { label: "Смартфон / UGC",
    body: ["modern smartphone held vertically, handheld", "современный смартфон вертикально, с рук"],
    lens: () => ["main 26mm-equivalent camera", "основная камера, эквивалент 26 мм"],
    look: ["natural auto exposure, authentic social-media look", "естественная автоэкспозиция, живой вид соцсетей"] },
  product:  { label: "Предметка: RED + макро",
    body: ["RED V-Raptor on a motion-control rig", "RED V-Raptor на моушен-контроле"],
    lens: () => ["Canon EF 100mm f/2.8L macro", "макрообъектив Canon EF 100 мм f/2.8L"],
    look: ["pristine commercial detail, controlled reflections", "безупречная рекламная детализация, контролируемые отражения"] },
};

function autoRig(a, aspect) {
  const k = a.subjects[0] && a.subjects[0].kind;
  if (a.genre && a.genre.id === "talk") return "phone";
  if (k === "product" || (a.genre && a.genre.id === "ad")) return "product";
  if (k === "animal" && a.place && !a.indoor) return "wildlife";
  if (aspect === "9:16" && a.genre && a.genre.id === "funny") return "phone";
  if (a.genre && a.genre.id === "horror") return "film";
  return "cinema";
}

/* Блок камеры по строкам: корпус, объектив, диафрагма и фокус, фон (раздел 18.1) */
function cameraLines(a, rigId, bg) {
  const k = a.subjects[0] && a.subjects[0].kind;
  const rig = RIGS[rigId];
  let focal, stop;
  if (rigId === "wildlife") { focal = "300mm"; stop = "f/4"; }
  else if (rigId === "product") { focal = "100mm"; stop = "f/5.6"; }
  else if (rigId === "phone") { focal = "26mm"; stop = "f/1.8"; }
  else if (a.genre && (a.genre.id === "action" || a.genre.id === "epic")) { focal = "24mm"; stop = "f/4"; }
  else if (k === "human") { focal = "50mm"; stop = "f/2"; }
  else { focal = "35mm"; stop = "f/2.8"; }
  const night = a.time && a.time.id === "night";
  const body = typeof rig.body === "function" ? rig.body(night) : rig.body;
  const lens = rig.lens(focal);
  const blur = isBlur(a, rigId, bg);
  const focusEn = k === "human" ? "the eyes of the main character" : k === "animal" || k === "creature" ? "the eye and head of the main character" : k === "product" ? "the logo and key edge of the product" : "the main subject";
  const focusRu = k === "human" ? "глаза главного героя" : k === "animal" || k === "creature" ? "глаз и голова героя" : k === "product" ? "логотип и главная грань предмета" : "главный объект";
  const fstop = blur ? stop : "f/8";
  return [
    [`Camera: ${body[0]}.`, `Камера: ${body[1]}.`],
    [`Lens: ${lens[0]}.`, `Объектив: ${lens[1].replace(/(\d+)mm/g, "$1 мм")}.`],
    [`Aperture and focus: ${fstop}, focus on ${focusEn}.`, `Диафрагма и фокус: ${fstop}, фокус на: ${focusRu}.`],
    blur ? ["Background: softly out of focus with natural round bokeh; slight foreground blur for depth.", "Фон: мягко размыт, естественное круглое боке; лёгкое размытие переднего плана для глубины."]
         : ["Background: sharp, deep focus, the environment fully readable for scale.", "Фон: резкий, большая глубина резкости, окружение полностью читается для масштаба."],
    [`Look: ${rig.look[0]}.`, `Изображение: ${rig.look[1]}.`],
  ];
}

function isBlur(a, rig, bg) {
  return bg === "blur" || (bg === "auto" && !(a.genre && a.genre.id === "epic") && rig !== "phone");
}

/* Камера по жанру, если пользователь выбрал «решить по сцене» */
function autoCamera(a) {
  const g = a.genre && a.genre.id, k = a.subjects[0] && a.subjects[0].kind;
  if (g === "talk") return ["Static framing at eye level, medium close-up, subject looking into the lens.", "Статичный кадр на уровне глаз, средне-крупный план, герой смотрит в объектив."];
  if (g === "action") return ["Tracking shot on a gimbal following the subject at matching speed, low and close, then easing into a wider hold at the end.", "Сопровождение на стабилизаторе со скоростью героя, низко и близко, в конце камера замедляется и держит более общий план."];
  if (g === "epic") return ["Slow aerial crane up and back from the subject, revealing the full scale of the landscape.", "Медленный подъём и отлёт камеры от героя, раскрывающий полный масштаб пейзажа."];
  if (k === "product") return ["Slow orbit around the product at its height, constant distance, ending on the hero angle with the label readable.", "Медленный облёт предмета на его высоте, постоянная дистанция, финал в лучшем ракурсе с читаемой этикеткой."];
  if (k === "animal") return ["Slow observational push-in from a wide establishing shot to a medium shot of the animal, camera height at the animal's eye level.", "Медленный наблюдательный наезд с общего плана на средний, камера на уровне глаз животного."];
  return ["Slow dolly push-in from a wide shot to a medium close-up, one smooth continuous move.", "Медленный наезд с общего плана на средне-крупный, одно плавное непрерывное движение."];
}

/* ---------- Анимация (раздел 18.2) ---------- */
const TOON = {
  "3d": { label: "3D-анимация",
    style: ["Stylized 3D animated feature-film look: appealing rounded shapes, expressive faces with large eyes, soft subsurface shading on skin, simplified but rich materials, global illumination with gentle bounce light, clean saturated palette.",
            "Стилизованная 3D-анимация уровня полнометражного мультфильма: приятные округлые формы, выразительные лица с большими глазами, мягкое подповерхностное рассеяние на коже, упрощённые, но богатые материалы, глобальное освещение с мягким отражённым светом, чистая насыщенная палитра."],
    motion: ["Animation principles: squash and stretch, anticipation before key actions, follow-through on ears, tails and clothing, clear readable poses.",
             "Принципы анимации: сжатие и растяжение, замах перед ключевым действием, захлёст ушей, хвостов и одежды, ясные читаемые позы."],
    camera: "virtual camera with a 35mm-equivalent lens, gentle depth of field",
    cameraRu: "виртуальная камера с объективом в эквиваленте 35 мм, мягкая глубина резкости",
    neg: ["no photorealism, no live-action footage, no realistic skin pores", "без фотореализма, без живой съёмки, без реалистичных пор кожи"] },
  "2d": { label: "2D рисованная",
    style: ["Hand-drawn 2D cel animation: clean confident ink outlines, flat colors with one tone of cel shading, painted watercolor-like backgrounds, slight line boil between frames.",
            "Рисованная 2D-анимация: чистые уверенные контуры, плоские цвета с одним тоном тени, живописные фоны в духе акварели, лёгкое дрожание линии между кадрами."],
    motion: ["Animated on twos at about 12 drawings per second, snappy timing, smear frames on fast moves.",
             "Анимация «на двойках», около 12 рисунков в секунду, чёткий тайминг, смазанные фазы на быстрых движениях."],
    camera: "flat 2D camera moves: pans and trucks across layered backgrounds with parallax",
    cameraRu: "плоские 2D-движения камеры: панорамы и проезды по слоям фона с параллаксом",
    neg: ["no 3D render, no photorealism, no motion blur", "без 3D-рендера, без фотореализма, без размытия движения"] },
  anime: { label: "Аниме",
    style: ["Anime-style 2D animation: crisp line art, cel shading with sharp shadow shapes, luminous painted skies, detailed background art, expressive eyes with highlights.",
            "2D-анимация в стиле аниме: чёткий лайн, целл-шейдинг с резкими формами теней, светящиеся живописные небеса, детальные фоны, выразительные глаза с бликами."],
    motion: ["Limited animation with dramatic key poses, speed lines and impact frames on the main action, hair and clothes moving in the wind.",
             "Ограниченная анимация с драматичными ключевыми позами, линии скорости и ударные кадры на главном действии, волосы и одежда движутся от ветра."],
    camera: "dynamic anime camera: quick push-ins and low angles on key moments",
    cameraRu: "динамичная аниме-камера: быстрые наезды и нижние ракурсы в ключевые моменты",
    neg: ["no 3D render, no photorealism", "без 3D-рендера, без фотореализма"] },
  clay: { label: "Пластилин / стоп-моушен",
    style: ["Claymation stop-motion: characters sculpted from matte plasticine with visible fingerprints and tool marks, handmade miniature set with real textures, practical miniature lighting.",
            "Пластилиновый стоп-моушен: герои вылеплены из матового пластилина с видимыми отпечатками пальцев и следами стеков, рукотворная миниатюрная декорация с настоящими фактурами, практический свет миниатюры."],
    motion: ["Stepped motion at about 12 frames per second, slight frame-to-frame jitter, no motion blur.",
             "Пошаговое движение около 12 кадров в секунду, лёгкое подёргивание между кадрами, без размытия движения."],
    camera: "macro miniature camera with shallow depth of field that makes the set feel small and tactile",
    cameraRu: "макрокамера миниатюры с малой глубиной резкости, декорация ощущается маленькой и осязаемой",
    neg: ["no smooth CG rendering, no high-frame-rate motion, no live action", "без гладкого компьютерного рендера, без высокой частоты кадров, без живой съёмки"] },
  book: { label: "Книжная иллюстрация",
    style: ["Animated children's-book illustration: soft watercolor and colored-pencil textures, visible paper grain, gentle limited palette, simple charming shapes.",
            "Ожившая иллюстрация детской книги: мягкие текстуры акварели и цветных карандашей, видимое зерно бумаги, мягкая ограниченная палитра, простые очаровательные формы."],
    motion: ["Gentle cut-out style movement, calm pacing, elements drift and sway softly.",
             "Мягкое движение в духе перекладки, спокойный темп, элементы плавно покачиваются."],
    camera: "slow gentle pans across the illustrated page",
    cameraRu: "медленные мягкие панорамы по иллюстрированной странице",
    neg: ["no photorealism, no 3D render", "без фотореализма, без 3D-рендера"] },
};

/* Микро- и макро-детали под героя и сцену (раздел 7) */
function microDetail(a, cuts) {
  const lead = cuts ? ["A short macro insert", "Короткая макровставка"] : ["At the closest framing", "На самом близком плане"];
  const k = a.subjects[0];
  const winter = a.season && a.season.id === "winter";
  if (!k) return null;
  if (k.kind === "human") return winter
    ? [`${lead[0]}: frost on the eyelashes and a snowflake melting on the cheek, natural skin texture, focus on the eye.`, `${lead[1]}: иней на ресницах и тающая снежинка на щеке, естественная фактура кожи, фокус на глазу.`]
    : [`${lead[0]}: the eye and lashes in sharp focus, natural skin texture with fine pores, a soft catchlight.`, `${lead[1]}: глаз и ресницы в резком фокусе, естественная фактура кожи с тонкими порами, мягкий блик в глазу.`];
  if (k.kind === "animal" || k.kind === "creature") return winter
    ? [`${lead[0]}: snowflakes melting on the ${k.id === "crocodile" ? "scutes near the eye" : "fur near the eye"}, the eye blinking slowly.`, `${lead[1]}: снежинки тают на ${k.id === "crocodile" ? "щитках у глаза" : "шерсти у глаза"}, глаз медленно моргает.`]
    : [`${lead[0]}: the eye in sharp focus with the surface texture around it, a slow blink.`, `${lead[1]}: глаз в резком фокусе с фактурой вокруг, медленное моргание.`];
  if (k.kind === "product") return [`${lead[0]}: light gliding across the material and the logo edge, droplets or texture in crisp focus.`, `${lead[1]}: свет скользит по материалу и краю логотипа, капли или фактура в резком фокусе.`];
  return null;
}
