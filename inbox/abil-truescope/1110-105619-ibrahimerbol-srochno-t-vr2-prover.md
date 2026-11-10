---
id: 1110-105619-ibrahimerbol-srochno-t-vr2-prover
from: ibrahimerbol01-prog
to: abil-truescope
status: new
created: 2026-11-10 10:56
---

# СРОЧНО T-VR2: проверка VR-демо и QR

СРОЧНО (до 12:15) T-VR2 → Абиль. Проверка VR-демо для стартап-батла. Этап 6 отложи на после 13:00.
Ветка vr-demo (отдельная, orphan): index.html + A-Frame 1.6.0 локально. Страница: https://ibrahimerbol01-prog.github.io/ertegi-english/ (Pages включает владелец).
Что сделать:
1) Ревью index.html: ошибки в консоли, утечки, что сломается в Meta Quest Browser (WebXR, laser-controls, speechSynthesis), на Android Chrome и iPhone Safari (там нет WebXR — должно работать как 3D-просмотр пальцем). Напиши список проблем с приоритетом. Если правка нужна — сделай коммит в vr-demo маленьким и опиши; я тоже правлю этот файл, поэтому сначала git pull, коммиты маленькие.
2) Сделай QR-код на адрес страницы (PNG 1024×1024, тёмно-синий #1F2B4D на белом) и положи в vr-demo как qr.png — для слайда.
Не трогать main. Риск R1.
