# Участие в разработке

Спасибо за вклад в проект. Репозиторий содержит community-плагин канала VK Teams
для OpenClaw.

## Перед началом работы

- прочитайте README;
- небольшие исправления отправляйте pull request;
- крупные изменения сначала обсудите в issue или discussion.

## Среда разработки

Используйте версию Node.js из `.nvmrc` и версию pnpm из `package.json`.

```bash
pnpm install --frozen-lockfile
```

## Проверки

Перед pull request выполните:

```bash
pnpm check
pnpm test
pnpm build
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

Для пользовательских изменений добавляйте запись в раздел `Unreleased` файла
[`CHANGELOG.md`](CHANGELOG.md). Порядок подготовки и публикации версии описан
в [`RELEASING.md`](RELEASING.md).

## Безопасность

Не добавляйте в репозиторий реальные токены, приватные конфигурации или реальные
идентификаторы пользователей без необходимости.
