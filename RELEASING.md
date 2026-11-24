# Выпуск версий

[`CHANGELOG.md`](CHANGELOG.md) — единственный источник истории изменений и текста
для GitHub Release. Пользовательские изменения добавляются в `## Unreleased`.
Один git-тег запускает три независимых workflow: создание GitHub Release,
публикацию в npm и публикацию в ClawHub.

## Подготовка релизного PR

1. Выберите версию: `YY.M.K` для стабильного выпуска или `YY.M.K-beta.N` для беты.
2. Перенесите записи, которые входят в выпуск, из `## Unreleased` под новый
   заголовок `## <версия>`. Оставьте `## Unreleased` для следующих изменений.
3. Обновите версию в `package.json` и `package-lock.json`. Команда
   `npm version <версия> --no-git-tag-version --ignore-scripts` обновляет оба файла,
   не создавая коммит или тег. Если зависимости менялись, обновите и закоммитьте
   оба lockfile (`pnpm install --lockfile-only` и `npm install --package-lock-only --ignore-scripts`).
4. Выполните проверки и закоммитьте обновлённый `dist/`, если он изменился:

   ```bash
   pnpm install --frozen-lockfile
   pnpm check:version
   pnpm check
   pnpm test
   pnpm build
   ```

## Публикация

После слияния релизного PR создайте тег `v<версия>` на коммите выпуска из `main`.
Например, для будущего выпуска `26.1.7`:

```bash
git switch main
git pull --ff-only
git tag -a v26.1.7 <коммит-релиза> -m 'Release 26.1.7'
git push origin refs/tags/v26.1.7
```

- **Create GitHub Release** берёт описание из раздела текущей версии в
  `CHANGELOG.md` и помечает бета-версию как pre-release. Он не публикует пакеты.
- Убедитесь, что **Publish to npm** и **Publish to ClawHub** завершились успешно.
  Они не зависят от GitHub Release. Стабильные версии получают метку `latest`
  в обоих реестрах, бета-версии — `beta`.
- Проверьте версию в обоих реестрах: `npm view openclaw-vkteams-plugin dist-tags`
  и `clawhub package inspect openclaw-vkteams-plugin --versions`.

Кнопка **Run workflow** в workflows публикации пакетов выполняет только пробный прогон.
Если один реестр уже принял версию, а второй вернул ошибку или таймаут, сначала
проверьте фактический статус и повторите только неудачный workflow для того же
тега при необходимости. Не переносите опубликованные теги ради повторного запуска.

## Секреты

- `NPM_TOKEN` — npm-токен с правом публикации пакета без интерактивного подтверждения.
- `CLAWHUB_TOKEN` — токен издателя ClawHub.

Для GitHub Release используется встроенный `GITHUB_TOKEN` с `contents: write`.
Для пробного прогона публикации пакетов секреты не нужны. Создание тегов `v*` ограничивайте
доверенными сопровождающими.
