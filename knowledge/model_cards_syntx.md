# Карточки моделей для SYNTX · слой 12 базы знаний
Версия 1.0 · checked_at: 08.11.2026 · статус всех карточек: **не подтверждено в интерфейсе SYNTX**

Как собрано: веб-поиск 08.11.2026. Страницы syntx.ai, docs.syntx.ai, kling.ai и ai.google.dev напрямую не открывались: сеть среды сборки их блокировала. Факты взяты из выдержек поиска; где источники расходятся, указан осторожный вариант и расхождение.
Перед запуском сервиса для широкого круга людей каждую карточку нужно сверить в самом SYNTX: открыть модель, посмотреть режимы, лимиты загрузки и как интерфейс подставляет теги.

Правила тегов — раздел 12.1 основной базы. Коротко: всегда строчными `@image1`, `@video1`, `@audio1` для всех моделей сервиса; нумерация отдельно по типу в порядке загрузки; роль сразу при первом упоминании. Если в карточке ниже встречается `@Image1` — это написание из сторонних гайдов, в сервисе не используется.

Данные для сайта лежат в `site/models.js`. Если меняете лимит здесь, меняйте и там.

---

## 1. Google Gemini Omni (в обиходе «Veo Omni»)
- service: SYNTX · provider: Google DeepMind · model_id в API: `gemini-omni-1.1-flash` (встречается и 1.2 Flash; проверить версию в SYNTX)
- Важно: Gemini Omni и Veo 3.1 — разные модели. В сервисе оставляем только Omni.
- modes: text-to-video · image-to-video (первый кадр) · первый + последний кадр · reference-to-video · правка видео
- supported_inputs: изображения, видео. Аудио на вход: **не подтверждено** (одна сторонняя статья пишет «да», официального подтверждения не найдено). В прототипе выключено.
- reference_limits: изображения — от 3 до 9 по разным источникам; в прототипе 5. Видео-референсы — до 3 (по одному источнику, клипы около 3 с).
- duration_values: 3–10 с по сторонним гайдам; у 1.2 заявлено до 15 с. В прототипе 4 / 6 / 8 / 10.
- aspect_ratios: 16:9, 9:16
- audio_support: нативный звук синхронно с видео
- dialogue_support: да, реплика в кавычках; липсинк проверять по результату
- reference_syntax в SYNTX: `@image1`, `@video1` (проверить). В нативном API: заголовок `[# Sources <FIRST_FRAME>@Image1] [# References <IMAGE_REF_0>@Image2]`, также `LAST_FRAME` (только вместе с FIRST_FRAME) и `VIDEO_REF_N`, индексы с 0. В SYNTX-промпт заголовок не вставлять.
- caveats: на старте API видео-референсы принимались, но обрабатывались неверно (сторонний отзыв). Во Flow роли пишутся фразами: “Use @image1 as the product”, “Using @video1 as a motion and audio reference, change the subject to …”.

## 2. Kling 4.0 Omni
- service: SYNTX · provider: Kuaishou · official_source: kling.ai/quickstart/kling-4-model-user-guide
- modes: text-to-video · image-to-video / ключевые кадры (до 10 по сторонним источникам) · Omni Reference · правка видео
- reference_limits (официальный гайд): всего до 15 ассетов за задачу; изображения — до 10; видео — до 5 клипов, суммарно до 30 с (референсы, видео для правки и видео-элементы делят одну квоту); элементы — до 7; голос — до 3 voice profile.
- audio input: **только голос**. Voice profile: 5–30 с, до 50 МБ. Музыку и эффекты описывать текстом в блоке AUDIO.
- edit: до 5 клипов, один основной, каждый 3–30 с, вместе до 30 с (Higgsfield, Runware).
- duration_values: до 30 с. В прототипе 5 / 10 / 15 / 20 / 30.
- aspect_ratios: 16:9, 9:16, 1:1
- resolution: 1080p (одна таблица пишет 4K HDR — не подтверждено)
- audio_support: нативный звук и речь
- reference_syntax в SYNTX: `@image1`, `@video1`, `@audio1` (по порядку загрузки внутри типа; сверять нумерацию). Официальный API: `<<<image_1>>>`, в SYNTX не использовать.
- caveats: “Edit @video1 …” — правка; “Reference @video1 …” — новый ролик. Видео-референс ограничивать: “only for camera movement, camera path, framing changes and shot pacing”.

## 3. Seedance 2.0
- service: SYNTX (в SYNTX закрыт за тарифом PRO по одному тесту) · provider: ByteDance
- modes: text-to-video · первый кадр · первый + последний кадр · omni reference · правка видео через @video1 · продление
- reference_limits: до 9 изображений, до 3 видео (вместе до 15 с), до 3 аудио MP3 (вместе до 15 с); всего до 12 файлов. Есть источники с 15 файлами — используем осторожное 12.
- duration_values: 4–15 с. В прототипе 5 / 8 / 10 / 12 / 15.
- aspect_ratios: 16:9, 9:16, 1:1, 4:3, 3:4, 21:9
- audio_support: генерирует звук; один гайд (Promptra) пишет обратное — проверить в SYNTX.
- dialogue_support: реплика в кавычках, русская речь возможна (гайды vc.ru)
- reference_syntax: `@image1`, `@video1`, `@audio1`. Примеры ролей: “@image1 as the first frame”, “follow the camera path from @video1”, “use @audio1 for the background music rhythm”, “replace the woman in @video1 with @image1”.

## 4. Seedance 2.5
- service: SYNTX («Seedance 2.5 — Text-to-video AI, 50 references») · provider: ByteDance · релиз 31.07.2026, API с начала августа 2026
- modes: Auto · Reference · Edit · Extend · первый / первый + последний кадр · text-to-video. Рекомендация: режим фиксировать явно, не оставлять Auto, иначе мягко сформулированная правка может вернуть новый ролик.
- reference_limits: до 50 всего: до 30 изображений, до 10 видео, до 10 аудио (аудио вместе до 30 с). Один сервис пишет о 30 референсах — считаем выбросом.
- edit: исходный клип короче 20 с плюс 1–5 изображений; длительность результата равна исходной.
- extend: продолжение после последнего кадра, момент до первого кадра или мост между двумя клипами; число добавляемых секунд задаётся.
- duration_values: 4–30 с; есть бета длинного режима до 3 минут (Wikipedia, не проверено). В прототипе 5 / 10 / 15 / 20 / 30.
- aspect_ratios: 16:9, 9:16, 1:1, 4:3, 3:4, 21:9; для extend и кадров-якорей — adaptive (по исходнику). Последний кадр с другим соотношением растягивается — известный артефакт.
- resolution: 480p / 720p / 1080p (SYNTX заявляет 4K — не подтверждено)
- audio_support: да, в том же проходе; реплика в кавычках включает липсинк; 10–11 языков.
- reference_syntax: `@image1`, `@video1`, `@audio1` в порядке загрузки.

## 5. Wan 3.0 Omni
- service: SYNTX · provider: Alibaba · model_id у Alibaba Cloud: `wan3.0-video` (публичный тест, август 2026)
- modes: text-to-video · image-to-video · reference-to-video · правка видео (заявлено, детали не найдены)
- reference_limits: до 10 изображений, до 5 видео (вместе до 15 с), до 5 аудио (вместе до 15 с), плюс 1 документ или ссылка. Длительность результата плюс длительность видео-референса — не больше 30 с.
- duration_values: до 30 с. В прототипе 5 / 10 / 15 / 20 / 30.
- aspect_ratios: adaptive, 16:9, 9:16, 1:1, 4:3, 3:4
- resolution: 480p / 720p / 1080p
- audio_support: синхронный звук; можно выключить
- prompt_limit: 20 000 символов (DeepInfra)
- reference_syntax: в ComfyUI и SYNTX-подобных интерфейсах `@Image1`, `@Video1`, `@Audio1`; в API DeepInfra — словами “Image 1”, “Video 1”. Пример: “Have the rabbit from @image1 give the speech from @audio1.”
- Формула: тег + роль героя + действие + сцена + речь + звук + требования к непрерывности.

---

## Источники (выдержки поиска, 08.11.2026)
- Kling 4.0 User Guide — https://kling.ai/quickstart/kling-4-model-user-guide
- Kling 4.0 на Higgsfield — https://higgsfield.ai/blog/kling-4-0-on-higgsfield
- Kling 4.0 Omni Reference Guide — https://poyo.ai/hub/kling-4-0-omni-reference-guide
- Kling 3.0 Omni на Replicate — https://replicate.com/kwaivgi/kling-v3-omni-video
- Generate and edit videos with Gemini Omni Flash — https://ai.google.dev/gemini-api/docs/omni
- Introducing Gemini Omni — https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-omni/
- Generate videos from references (Google Cloud) — https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/generate-videos-from-references
- Wan 3.0 в ComfyUI — https://docs.comfy.org/tutorials/partner-nodes/wan/wan3-0
- Wan 3.0 документация DeepInfra — https://deepinfra.com/blog/wan-3-0-model-documentation-integration-guide
- Seedance 2.5 API — https://www.cined.com/bytedance-seedance-2-5-api-goes-live-30-second-single-shot-clips-50-reference-inputs-and-3d-camera-blockouts/
- Seedance 2.5: edit, extend — https://morphic.com/resources/models/seedance-2-5
- Seedance 2.5 Video Editing and Extend — https://tryonr.com/blog/seedance-2-5-video-editing-extend
- Seedance 2.0 Prompt Guide — https://www.rundiffusion.com/seedance-2-0-prompt-guide
- SYNTX: Seedance 2.5 — https://syntx.ai/models/seedance
- SYNTX: видеогенерация — https://syntx.ai/tools/video-generation
- SYNTX: промпты для видео с собой в Seedance 2.0 — https://docs.syntx.ai/
- Seedance 2.0 продвинутый гайд (vc.ru) — https://vc.ru/promtstudio/2919130-seedance-2-0-prodvinutyi-gayd
