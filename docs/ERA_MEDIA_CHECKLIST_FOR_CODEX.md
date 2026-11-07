# Медиа для главной A «Ресурс»

Макет уже свёрстан. Оригиналы хранить отдельно от `public/`; согласованные веб-копии разместить по таблице. После обычной сборки файлы автоматически заменяют текущие материалы, без правок HTML и CSS.

Фотографии: основной WebP, AVIF, JPG или PNG. Необязательные адаптивные версии — `имя-480.webp`, `имя-880.webp`, `имя-1280.webp`, `имя-1920.webp`; не увеличивать исходник.

| ID | Веб-файл | Текущий материал |
| --- | --- | --- |
| heroFeedstock | `public/assets/project-home/hero/feedstock_hero.jpg` | `public/assets/presentation/raw-film.webp` |
| heroEquipment | `public/assets/project-home/hero/equipment_hero.png` | `public/assets/presentation/complex.webp` |
| heroMobile | `public/assets/project-home/hero/feedstock_mobile.jpg` | `public/assets/presentation/raw-film.webp` |
| problemFilm | `public/assets/project-home/problem/film_mixed.jpg` | `public/assets/presentation/raw-film.webp` |
| mineralDetail | `public/assets/project-home/problem/inclusion_mineral.jpg` | Пиктограмма в подготовленной рамке |
| organicDetail | `public/assets/project-home/problem/inclusion_organic.jpg` | Пиктограмма в подготовленной рамке |
| solidDetail | `public/assets/project-home/problem/inclusion_solid.jpg` | Пиктограмма в подготовленной рамке |
| preshredder | `public/assets/project-home/process/preshredder.jpg` | `public/assets/photos/predvaritelnyy-izmelchitel/01.webp` |
| separator | `public/assets/project-home/process/separator.jpg` | `public/assets/photos/ballisticheskiy-separator/05.webp` |
| fluffier | `public/assets/project-home/process/fluffier.jpg` | `public/assets/photos/rotornyy-raspushitel/01.webp` |
| cleanFilm | `public/assets/project-home/process/clean_film.jpg` | `public/assets/presentation/clean-film.webp` |
| pellets | `public/assets/project-home/process/pellets.jpg` | `public/assets/presentation/granules.webp` |
| promo | `public/assets/project-home/video/era_promo_full.mp4` | Постер |
| promoPoster | `public/assets/project-home/video/era_promo_poster.jpg` | `public/assets/presentation/complex.webp` |
| filmProduct | `public/assets/project-home/products/clean_film_bale.jpg` | `public/assets/presentation/clean-film.webp` |
| pelletProduct | `public/assets/project-home/products/pe_pellets.jpg` | `public/assets/presentation/granules.webp` |
| evidenceInput | `public/assets/project-home/evidence/input_sample.jpg` | `public/assets/presentation/raw-film.webp` |
| evidenceProcess | `public/assets/project-home/evidence/process_running.jpg` | `public/assets/presentation/complex.webp` |
| evidenceOutput | `public/assets/project-home/evidence/output_sample.jpg` | `public/assets/presentation/clean-film.webp` |
| cleaningDemo | `public/assets/project-home/evidence/cleaning_demo.mp4` | `public/assets/videos/ballisticheskiy-separator.mp4` |
| cleaningPoster | `public/assets/project-home/evidence/cleaning_demo_poster.jpg` | `public/assets/videos/ballisticheskiy-separator-poster.webp` |
| lineWide | `public/assets/project-home/system/line_wide.jpg` | `public/assets/technology/separation/line.webp` |
| kairScreen | `public/assets/project-home/system/kair_screen.jpg` | `public/assets/kair/01.webp` |
| contactDetail | `public/assets/project-home/contact/machine_detail.jpg` | `public/assets/photos/rotornyy-raspushitel/01.webp` |

Для MP4 — H.264/AAC с fast start; дополнительный одноимённый WebM необязателен. Субтитры: `public/assets/project-home/video/captions.vtt` для проморолика и `public/assets/project-home/evidence/captions.vtt` для рабочего видео. Autoplay и loop отсутствуют.

Пока главный MP4 не добавлен, промоблок показывает постер «Видео о технологии ЭРА» без кнопки Play. В рабочем видеоблоке временно используется полная видеопрезентация баллистического сепаратора 1:40 с точной подписью операции. Монтаж и звук сохраняются. Большой исходный ролик сначала проверить по размеру и подготовить согласованный веб-экспорт, не помещать огромный оригинал сразу в git.

После добавления: `BASE_PATH=/Website_ERA npm run build`, проверить назначение кадров, источники, подписи и мобильный вид. Рендер не называть фото установленной линии; неизвестную общую партию не подписывать «до/после». На первом уровне нет служебных пометок отсутствующих файлов; исходный подбор сохранён в редакционном JSON-реестре.
