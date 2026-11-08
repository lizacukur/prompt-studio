# Prompt Atelier

Сайт, который превращает идею в готовый промпт для видео-нейросетей в синтаксисе SYNTX: Gemini Omni, Kling 4.0 Omni, Seedance 2.0, Seedance 2.5, Wan 3.0 Omni.

Слева человек описывает идею, выбирает модель и режим, прикрепляет фото, видео, аудио. Справа получает настройки, порядок загрузки файлов с тегами (`@image1`, `@video1`, `@audio1`) и промпт на EN и RU.

## Структура
- `knowledge/prompt_service_knowledge_base.md` — база знаний 1.1, правила составления промптов
- `knowledge/model_cards_syntx.md` — карточки моделей: режимы, лимиты, синтаксис тегов, источники
- `site/` — сам сайт (HTML, CSS, JS без сборки); `site/models.js` — те же карточки для интерфейса
- `docs/ARCHITECTURE.md` — логика работы и этапы
- `docs/DESIGN_SYSTEM.md` — цвета, шрифты, компоненты

## Запуск
Открыть `site/index.html` в браузере. Сервер не нужен.

## Публикация
GitHub Pages через Actions (`.github/workflows/pages.yml`): Settings → Pages → Source: **GitHub Actions**. Сайт публикуется из папки `site/` при каждом push в `main`.

Сейчас сайт закрыт от поисковиков (meta robots и `robots.txt`). Как включить — в `docs/ARCHITECTURE.md`.

## Статус
Прототип 0.1: промпт собирается по правилам базы без ИИ. Лимиты моделей собраны 08.11.2026 по вторичным источникам и требуют проверки в SYNTX.
