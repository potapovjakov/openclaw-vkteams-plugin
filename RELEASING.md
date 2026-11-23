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

## Секреты

Для публикации через GitHub Actions требуется секрет `NPM_TOKEN`.
