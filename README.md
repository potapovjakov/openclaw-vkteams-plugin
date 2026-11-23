# Плагин OpenClaw для VK Teams

Плагин канала VK Teams для OpenClaw. Использует VK Teams Bot API и long polling.

## Возможности

- личные сообщения через VK Teams Bot API;
- long polling через `/events/get`;
- отправка текстовых ответов через `/messages/sendText`;
- pairing OpenClaw;
- списки разрешённых пользователей и политики доступа к личным сообщениям;
- восстановление polling после временных ошибок сети.

Ограничения текущей версии: поддерживаются только личные сообщения, текстовые
сообщения и ответы. Сообщения из групповых чатов игнорируются.

## Установка

### Из npm

```bash
openclaw onboard --install-daemon
openclaw plugins install openclaw-vkteams-plugin
```

### Из локального checkout

```bash
openclaw onboard --install-daemon
openclaw plugins install ~/dev/openclaw-vkteams-plugin
```

Если исходный код находится в другом каталоге, укажите путь к нему вместо
`~/dev/openclaw-vkteams-plugin`.

## Настройка токена

```bash
mkdir -p ~/.openclaw/workspace/secrets
chmod 700 ~/.openclaw/workspace/secrets
$EDITOR ~/.openclaw/workspace/secrets/vkteams-token.txt
chmod 600 ~/.openclaw/workspace/secrets/vkteams-token.txt
```

Файл должен содержать только токен VK Teams Bot API. Также поддерживаются
переменная окружения `VKTEAMS_BOT_TOKEN`, прямое указание токена в конфигурации
и ссылка на файл с токеном.

## Настройка канала

Запустите интерактивный мастер:

```bash
openclaw channels add
```

Выберите `VK Teams` и аккаунт `default`. Если мастер предлагает выбрать файл
токена, укажите:

```text
~/.openclaw/workspace/secrets/vkteams-token.txt
```

API URL по умолчанию — `https://api.armgs.team/bot/v1`. Его можно изменить
параметром `apiBaseUrl`.

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

```bash
npm install
npm test
npm run check
npm run build
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
