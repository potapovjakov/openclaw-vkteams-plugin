# Выпуск версий

Репозиторий использует Changesets для управления версиями, changelog, публикацией
npm-пакета и GitHub Release.

## Обычная работа

1. Внесите изменения.
2. Запустите проверки:

```bash
npm run check
npm test
npm run build
```

3. Для пользовательского изменения добавьте changeset:

```bash
npx changeset
```

4. Создайте commit и pull request.

## После слияния

После слияния pull request с changeset в `main` release workflow создаёт или
обновляет release pull request. После его слияния workflow обновляет версию,
публикует пакет в npm и создаёт GitHub Release.

## Формат версии

- стабильная версия: `YYYY.M.K`;
- beta-версия: `YYYY.M.K-beta.N`.

Если теги создаются вручную, используйте `vYYYY.M.K` или `vYYYY.M.K-beta.N`.

## Публикация в ClawHub

Workflow **Publish to ClawHub** запускается при пуше нового тега `v*`.
После слияния релизного PR проверьте, что тег указывает на коммит из `main`,
версия совпадает с `package.json`, а собранный `dist/` закоммичен. Например:

```bash
git switch main
git pull --ff-only
git tag -a v26.1.5 -m 'Release 26.1.5'
git push origin refs/tags/v26.1.5
```

Workflow проверит и соберёт пакет, загрузит архив и дождётся итогового статуса
ClawHub. Стабильные версии получают тег ClawHub `latest`, бета-версии — `beta`.
Кнопка **Run workflow** запускает только пробный прогон без загрузки.
Если ожидание завершилось по таймауту, проверьте статус версии в ClawHub перед
повторным запуском. Не переносите уже опубликованный git-тег.

## Секреты

Для публикации в npm через GitHub Actions требуется секрет `NPM_TOKEN`.
Для публикации в ClawHub добавьте отдельный токен издателя как Actions secret
`CLAWHUB_TOKEN`. Для пробного прогона секрет не нужен.
Ограничьте создание и изменение тегов `v*` доверенными сопровождающими.
