##  Как подключить сервис к google  таблицам

- 1 Войти на сайт Google Cloud Console https://console.cloud.google.com/
- 2 Создать проект
- 3 Разрешить the Google Sheets API
- 4 Создать сервисный аккаунт и скачать JSON файл с ключами
- 5 Расшарить гугл таблицу с  email сервисного аккаунта из JSON

## Создать файл с настройками и секретами settings.json

За образец формата можно взять settings.example.json

## Запуск сервиса 

```
docker compose up -d
```

##  Проверка работоспособности

```
docker compose logs app
```

Пример успешного сообщения:

```
app  | Delivery plan processed successfully
app  | Sheet 1EauTEv7xQvt_yzGIFc04hxUfyLeRjyunt6KspTpl-ac cleared and new data successfully written
```
