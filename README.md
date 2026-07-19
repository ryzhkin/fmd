# Fantasy Map Demo

Модульный MVP фэнтезийной карты на реальной геометрии OpenStreetMap. Текущая
версия отображает детерминированный тестовый квадрат Сум; данные не обновляются
автоматически во время build или deploy.

## Команды

```sh
npm ci
npm run dev
npm run check
```

Обновление OSM snapshot выполняется только явно:

```sh
npm run data:refresh -- --region=sumy
```

Архитектура и правила изменения проекта описаны в `ARCHITECTURE.md` и
`AGENTS.md`.
