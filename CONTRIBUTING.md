# Участие в разработке

Спасибо за вклад в проект. Репозиторий содержит community-плагин канала VK Teams
для OpenClaw.

## Перед началом работы

- прочитайте README;
- небольшие исправления отправляйте pull request;
- крупные изменения сначала обсудите в issue или discussion.

## Среда разработки

Требуются Node.js, совместимый с установленной версией OpenClaw, и npm.

```bash
npm install
```

## Проверки

Перед pull request выполните:

```bash
npm run check
npm test
npm run build
```

Для изменений setup или runtime дополнительно проверьте загрузку плагина:

```bash
openclaw plugins install ~/dev/openclaw-vkteams-plugin --force
openclaw channels capabilities --channel vkteams
openclaw gateway run --force
```

## Правила изменений

Допустимы исправления канала VK Teams, улучшения setup и конфигурации,
документации, тестов и процесса выпуска. Не смешивайте несвязанные изменения в
одном pull request.

## Стиль кода

- TypeScript со строгой типизацией;
- без `any`, если это возможно;
- только публичные поверхности `openclaw/plugin-sdk/*`;
- без импортов внутренних путей OpenClaw `src/**`.

## Pull request

Укажите, что изменено, зачем, как выполнялась проверка, а также известные
ограничения. Если использовался ИИ, сообщите об этом явно.

## Коммиты

Используйте короткие conventional commit-сообщения:

```text
type(scope): summary
```

Допустимые типы: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`.

## Выпуски

Стабильные версии используют формат `YYYY.M.K`, beta-версии —
`YYYY.M.K-beta.N`. Для пользовательских изменений добавляйте changeset:

```bash
npx changeset
```

## Безопасность

Не добавляйте в репозиторий реальные токены, приватные конфигурации или реальные
идентификаторы пользователей без необходимости.
