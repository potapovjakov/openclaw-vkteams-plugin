# Плагин OpenClaw для VK Teams

[![CI](https://github.com/potapovjakov/openclaw-vkteams-plugin/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/potapovjakov/openclaw-vkteams-plugin/actions/workflows/ci.yml)
[![Publish to ClawHub](https://github.com/potapovjakov/openclaw-vkteams-plugin/actions/workflows/clawhub-publish.yml/badge.svg?event=push)](https://github.com/potapovjakov/openclaw-vkteams-plugin/actions/workflows/clawhub-publish.yml)
[![Publish to npm](https://github.com/potapovjakov/openclaw-vkteams-plugin/actions/workflows/npm-publish.yml/badge.svg?event=push)](https://github.com/potapovjakov/openclaw-vkteams-plugin/actions/workflows/npm-publish.yml)

Плагин канала VK Teams для OpenClaw. Использует VK Teams Bot API и long polling.
То же решение может встречаться под названиями **Среда**, **АРМГС** и **КС АРМГС**.

## Возможности

- личные сообщения через VK Teams Bot API;
- long polling через `/events/get`;
- отправка текстовых ответов через `/messages/sendText`;
- plain-text ответы без Markdown-разметки;
- индикатор набора текста во время подготовки ответа;
- приём вложений в личных сообщениях: изображения, документы, аудио, видео и голосовые сообщения (до 25 МиБ на файл);
- pairing OpenClaw;
- списки разрешённых пользователей и политики доступа к личным сообщениям;
- восстановление polling после временных ошибок сети.

Ограничения текущей версии: поддерживаются только личные сообщения и ответы.
Сообщения из групповых чатов игнорируются.

### Вложения в личных сообщениях

Начиная с `26.1.8`, отправьте боту в личку документ, изображение, аудио,
видео или голосовое сообщение. Можно отправить несколько файлов, с подписью
или без неё. Лимит — 25 МиБ на файл. Если один файл не загрузился, бот всё
равно передаст текст, подписи и остальные успешно загруженные вложения.

OpenClaw получает вложения как локальные файлы, без ссылок на скачивание.
Анализ файлов и расшифровка голосовых зависят от настроек OpenClaw и возможностей модели.

## Установка

Для версии плагина `26.1.6` и новее требуется **OpenClaw `2026.11.7` или новее**.
Изменения по версиям описаны в [CHANGELOG.md](https://github.com/potapovjakov/openclaw-vkteams-plugin/blob/main/CHANGELOG.md).

### Из ClawHub

```bash
openclaw onboard --install-daemon
openclaw plugins install clawhub:openclaw-vkteams-plugin
```

### Из npm

```bash
openclaw plugins install npm:openclaw-vkteams-plugin
```

### Из локального checkout

```bash
openclaw onboard --install-daemon
openclaw plugins install ~/dev/openclaw-vkteams-plugin
```

Если исходный код находится в другом каталоге, укажите путь к нему вместо
`~/dev/openclaw-vkteams-plugin`.

## Настройка канала и токена

Выберите один способ настройки токена VK Teams Bot API: ввод в мастере,
отдельный файл или переменная окружения.

### Ввод токена в мастере

```bash
openclaw channels add
```

Выберите `VK Teams` и аккаунт `default`, затем вставьте токен по запросу.
Мастер сохранит его в конфигурации канала как `botToken`. **Создавать файл
с токеном в этом случае не нужно.**

### Отдельный файл (необязательно)

Если не хотите хранить токен в конфигурации OpenClaw, сохраните его в отдельном
файле и укажите путь к нему в `channels.vkteams.tokenFile`. Например:

```bash
mkdir -p "$HOME/.openclaw/workspace/secrets"
chmod 700 "$HOME/.openclaw/workspace/secrets"
${EDITOR:-vi} "$HOME/.openclaw/workspace/secrets/vkteams-token.txt"
chmod 600 "$HOME/.openclaw/workspace/secrets/vkteams-token.txt"
```

Файл должен содержать только токен. Путь выше — пример: плагин не создаёт
файл и не ищет его автоматически. При переходе на `tokenFile` удалите
`botToken` из настроек того же аккаунта: он имеет приоритет над файлом.

### Переменная окружения (необязательно)

Для аккаунта `default` можно задать `VKTEAMS_BOT_TOKEN` в окружении процесса
Gateway. Плагин использует её, если токен не задан в конфигурации или файле.

API URL по умолчанию — `https://api.armgs.team/bot/v1`. Его можно изменить
параметром `apiBaseUrl`. Укажите конечный HTTPS-адрес: плагин не следует
перенаправлениям для запросов к Bot API.

## Проверка и pairing

```bash
openclaw channels status
openclaw channels status --probe
openclaw channels capabilities --channel vkteams
```

Напишите боту личное сообщение в VK Teams. Бот отправит pairing-код. Одобрите
пользователя:

```bash
openclaw pairing approve vkteams КОД
```

Затем отправьте боту новое сообщение.

## Запуск Gateway

```bash
openclaw onboard --install-daemon
openclaw gateway start
openclaw gateway status
```

Для диагностики в foreground:

```bash
openclaw gateway run --force
```

## Локальная разработка

Используйте Node.js из `.nvmrc` и версию pnpm из `package.json`.

```bash
nvm install
nvm use
npm install -g pnpm@10.34.9
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
```

После сборки:

```bash
openclaw plugins install ~/dev/openclaw-vkteams-plugin --force
```

## Обновление на сервере

```bash
cd ~/dev/openclaw-vkteams-plugin
git pull --ff-only
npm install --omit=dev --ignore-scripts --no-audit --no-fund
npm run build
openclaw plugins install ~/dev/openclaw-vkteams-plugin --force
openclaw gateway restart
```

Если `gateway restart` недоступна:

```bash
openclaw gateway stop
openclaw gateway start
```

## Диагностика

```bash
openclaw plugins list
openclaw channels status --probe
openclaw gateway status
openclaw logs
```

Не публикуйте токен, содержимое файла секретов и вывод команд, в котором они
могут присутствовать.

## Публикация

```bash
openclaw plugins install openclaw-vkteams-plugin
```

Версии используют формат `YYYY.M.K` или `YYYY.M.K-beta.N`.

Документация OpenClaw по публикации community-плагинов:

https://docs.openclaw.ai/plugins/community
