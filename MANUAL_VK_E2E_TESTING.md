# Ручное E2E-тестирование VK Teams

Инструкция описывает проверку плагина VK Teams на чистой виртуальной машине через CLI OpenClaw и настоящий токен бота.

## Требования

- доступ к shell виртуальной машины;
- действующий токен VK Teams Bot API;
- checkout этого репозитория на виртуальной машине.

## Установка

```bash
cd ~/dev/openclaw-vkteams-plugin
git pull --ff-only
npm install -g openclaw@latest
openclaw onboard --install-daemon
openclaw plugins install .
```

Создайте файл токена:

```bash
mkdir -p ~/.openclaw/workspace/secrets
chmod 700 ~/.openclaw/workspace/secrets
$EDITOR ~/.openclaw/workspace/secrets/vkteams-token.txt
chmod 600 ~/.openclaw/workspace/secrets/vkteams-token.txt
```

В файле должен находиться только токен бота.

## Настройка и проверка

```bash
openclaw channels add
openclaw channels status --probe
```

В мастере выберите `VK Teams`, аккаунт `default` и файл `~/.openclaw/workspace/secrets/vkteams-token.txt`.

Напишите боту личное сообщение в VK Teams. После получения pairing-кода выполните:

```bash
openclaw pairing approve vkteams КОД
```

Проверьте, что пользователь получил уведомление, а последующие личные сообщения принимаются OpenClaw.
