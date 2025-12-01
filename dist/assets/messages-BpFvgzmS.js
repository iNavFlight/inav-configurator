const n=`{\r
    "translation_version": {\r
        "message": "0"\r
    },\r
    "language_de": {\r
        "message": "Deutsch",\r
        "comment": "Don't translate!"\r
    },\r
    "language_en": {\r
        "message": "English",\r
        "_comment": "Don't translate!"\r
    },\r
    "language_uk": {\r
        "message": "українська",\r
        "_comment": "Don't translate!"\r
    },\r
    "language_ja": {\r
        "message": "日本語",\r
        "_comment": "Don't translate!"\r
    },\r
    "language_zh_CN": {\r
        "message": "简体中文",\r
        "_comment": "Don't translate!"\r
    },\r
    "language": {\r
        "message": "Мова"\r
    },\r
    "options_title": {\r
        "message": "Параметри додатку"\r
    },\r
    "options_receive_app_notifications": {\r
        "message": "Отримувати <strong>сповіщення</strong>, коли застосунок оновлюється"\r
    },\r
    "options_improve_configurator": {\r
        "message": "Анонімно надсилати дані розробнику"\r
    },\r
    "options_showProfileParameters": {\r
        "message": "Виділяти параметри, які змінюються при зміні профілів живлення або керування"\r
    },\r
    "options_cliAutocomplete": {\r
        "message": "Просунуте автодоповнення CLI"\r
    },\r
    "options_unit_type": {\r
        "message": "Налаштуйте одиниці вимірювання в межах конфігуратора"\r
    },\r
    "options_render": {\r
        "message": "Налаштування рендерингу конфігуратора"\r
    },\r
    "unexpectedError": {\r
        "message": "Неочікувана помилка: $1"\r
    },\r
    "disconnecting": {\r
        "message": "Від'єднуємось..."\r
    },\r
    "connect": {\r
        "message": "Під'єднати"\r
    },\r
    "connecting": {\r
        "message": "Під'єднуємось"\r
    },\r
    "disconnect": {\r
        "message": "Від'єднати"\r
    },\r
    "autoConnect": {\r
        "message": "Автоматичне під'єднання"\r
    },\r
    "autoConnectEnabled": {\r
        "message": "Автопідключення: Увімкнено - конфігуратор автоматично здійснює підключення при виявленні нового порту"\r
    },\r
    "autoConnectDisabled": {\r
        "message": "Автопідключення: Вимкнено - Користувач повинен вибрати правильний серійний порт та натиснути \\"Під'єднати'\\""\r
    },\r
    "deviceRebooting": {\r
        "message": "Пристрій - <span style=\\"color: red\\">перезавантажується</span>"\r
    },\r
    "deviceReady": {\r
        "message": "Пристрій - <span style=\\"color: #37a8db\\">готовий</span>"\r
    },\r
    "savingDefaults": {\r
        "message": "Пристрій - <span style=\\"color: red\\">Збереження налаштувань за замовчуванням</span>"\r
    },\r
    "fcNotConnected": {\r
        "message": "Не під'єднано"\r
    },\r
    "backupFileIncompatible": {\r
        "message": "Наданий файл резервної копії для попередньої версії конфігуратора. Він є несумісним з цією версією конфігуратора. Вибачте"\r
    },\r
    "backupFileUnmigratable": {\r
        "message": "Наданий файл резервної копії було створено попередньою версією конфігуратора і його перенесення не є можливим. Вибачте."\r
    },\r
    "configMigrationFrom": {\r
        "message": "Перенесення файлу конфігурації, згенерованого конфігуратором: $1"\r
    },\r
    "configMigratedTo": {\r
        "message": "Перенесено конфігурацію до конфігуратора: $1"\r
    },\r
    "configMigrationSuccessful": {\r
        "message": "Перенесення конфігурації завершено, міграцій застосовано: $1"\r
    },\r
    "documentation": {\r
        "message": "Документація"\r
    },\r
    "tabFirmwareFlasher": {\r
        "message": "Програматор"\r
    },\r
    "tabLanding": {\r
        "message": "Вітаємо"\r
    },\r
    "tabHelp": {\r
        "message": "Документація та підтримка"\r
    },\r
    "tabSetup": {\r
        "message": "Статус"\r
    },\r
    "tabCalibration": {\r
        "message": "Калібрування"\r
    },\r
    "tabConfiguration": {\r
        "message": "Конфігурація"\r
    },\r
    "tabPorts": {\r
        "message": "Порти"\r
    },\r
    "tabPidTuning": {\r
        "message": "Налаштування ПІД"\r
    },\r
    "tabReceiver": {\r
        "message": "Приймач"\r
    },\r
    "tabMisc": {\r
        "message": "Інше"\r
    },\r
    "tabModeSelection": {\r
        "message": "Вибір режиму"\r
    },\r
    "tabServos": {\r
        "message": "Сервоприводи"\r
    },\r
    "tabFailsafe": {\r
        "message": "Безаварійність"\r
    },\r
    "tabEzTune": {\r
        "message": "Легке налаштування"\r
    },\r
    "tabGPS": {\r
        "message": "GPS"\r
    },\r
    "tabOutputs": {\r
        "message": "Виводи"\r
    },\r
    "tabLedStrip": {\r
        "message": "LED стрічка"\r
    },\r
    "tabRawSensorData": {\r
        "message": "Датчики"\r
    },\r
    "tabCLI": {\r
        "message": "Командний рядок"\r
    },\r
    "tabLogging": {\r
        "message": "Журналювання через кабель"\r
    },\r
    "tabOnboardLogging": {\r
        "message": "Чорна скриня"\r
    },\r
    "tabAdjustments": {\r
        "message": "Регулювання"\r
    },\r
    "tabAuxiliary": {\r
        "message": "Режими"\r
    },\r
    "tabSitl": {\r
        "message": "SITL"\r
    },\r
    "sitlDemoMode": {\r
        "message": "Демо-режим"\r
    },\r
    "sitlResetDemoModeData": {\r
        "message": "Скинути демо-режим"\r
    },\r
    "sitlOSNotSupported": {\r
        "message": "SITL в цій операційній системі не підтримується."\r
    },\r
    "sitlOptions": {\r
        "message": "Налаштування SITL"\r
    },\r
    "sitlEnableSim": {\r
        "message": "Увімкнути симулятор"\r
    },\r
    "sitlSimulator": {\r
        "message": "Симулятор"\r
    },\r
    "sitlUseImu": {\r
        "message": "Використовувати блок інерційних вимірювань"\r
    },\r
    "sitlSimIP": {\r
        "message": "IP симулятора"\r
    },\r
    "sitlPort": {\r
        "message": "Порт симулятора"\r
    },\r
    "sitlChannelMap": {\r
        "message": "Схема каналів"\r
    },\r
    "sitlSimInput": {\r
        "message": "Вхід симулятора"\r
    },\r
    "sitlInavOutput": {\r
        "message": "INAV Вивід"\r
    },\r
    "sitlLog": {\r
        "message": "Журнал"\r
    },\r
    "sitlStart": {\r
        "message": "Почати"\r
    },\r
    "sitlStop": {\r
        "message": "Зупинити"\r
    },\r
    "sitlStopped": {\r
        "message": "SITL зупинено"\r
    },\r
    "sitlProfiles": {\r
        "message": "Профілі SITL"\r
    },\r
    "sitlNew": {\r
        "message": "Новий"\r
    },\r
    "sitlSave": {\r
        "message": "Зберегти"\r
    },\r
    "sitlDelete": {\r
        "message": "Видалити"\r
    },\r
    "sitlNewProfile": {\r
        "message": "Новий профіль SITL"\r
    },\r
    "sitlEnterName": {\r
        "message": "(Назва профілю)"\r
    },\r
    "sitlProfileExists": {\r
        "message": "Профіль з такою назвою вже існує."\r
    },\r
    "sitlStdProfileCantDeleted": {\r
        "message": "Стандартний профіль SITL не можна видаляти."\r
    },\r
    "sitlStdProfileCantOverwritten": {\r
        "message": "Стандартний профіль SITL не може бути перезаписаний. Будь ласка, створіть новий."\r
    },\r
    "serialReceiver": {\r
        "message": "Послідовний приймач"\r
    },\r
    "sitlSerialProtocoll": {\r
        "message": "Пресет налаштування послідовного порту для RX протоколу підключеного приймача"\r
    },\r
    "sitlSerialStopbits": {\r
        "message": "Стоп-біти"\r
    },\r
    "sitlSerialPort": {\r
        "message": "Послідовний приймач/проксі польотного контролера з'єднаний з послідовним портом хоста"\r
    },\r
    "sitlSerialUART": {\r
        "message": "Послідовний приймач налаштований на UART SITL"\r
    },\r
    "sitlSerialParity": {\r
        "message": "Парність"\r
    },\r
    "sitlSerialTcpEnable": {\r
        "message": "Увімкнути"\r
    },\r
    "sitlHelp": {\r
        "message": "SITL (програмне забезпечення в циклі) дозволяє INAV працювати на комп'ютері без польотного контролеру і симулювати польоти FPV. Для цього INAV компілюється звичайним компілятором комп'ютера. Датчики замінюються даними, що їх надає симулятор. <br/> Наразі підтримуються <br/><ul><li><a href=\\"https://www.realflight.com\\" target=\\"_blank\\">RealFlight</a><br/></li><li><a href=\\"https://www.x-plane.com\\" target=\\"_blank\\">X-Plane</a></li></ul>"\r
    },\r
    "sitlProfilesHelp": {\r
        "message": "Профілі зберігаються локально. Профілі містять не тільки всі дані цієї вкладки, але і файл конфігурації (\\"EEPROM\\") самого INAV. <br><span style=\\"color: red\\">Примітка:</span><br>Стандартні профілі не можуть бути перезаписані. Щоб зберегти зміни, створіть новий профіль. "\r
    },\r
    "sitlEnableSimulatorHelp": {\r
        "message": "Якщо цю опцію відключено, можна використовувати тільки UARTS (MSP/Configurator). Корисно для налаштування INAV без необхідності запуску симулятора."\r
    },\r
    "sitlUseImuHelp": {\r
        "message": "Використовувати дані датчика IMU (інерційний вимірювальний пристрій) від симулятора замість використання даних про орієнтацію безпосередньо з симулятора (експериментальний режим, не рекомендується)."\r
    },\r
    "sitlIpHelp": {\r
        "message": "IP-адреса комп'ютера, на якій працює симулятор. Якщо симулятор працює на тому самому комп'ютері, залиште його за адресою \\"127.0.0.1"\r
    },\r
    "sitlPortHelp": {\r
        "message": "Номер порту інтерфейсу симулятора. Примітка: Порт RealFlight зафіксований і не може бути змінений."\r
    },\r
    "sitlSerialReceiverHelp": {\r
        "message": "Використовувати приймач (SBUS/CRSF/тощо) з підключенням до хоста використовуючи USB-to-UART адаптер або проксі польотного контролера."\r
    },\r
    "auxiliaryAcroEnabled": {\r
        "message": "АКРО"\r
    },\r
    "serialPortOpened": {\r
        "message": "MSP з'єднання  <span style=\\"color: #37a8db\\">успішно</span> відкрито з ID: $1"\r
    },\r
    "serialPortOpenFail": {\r
        "message": "<span style=\\"color: red\\">Не вдалося</span> відкрити MSP з'єднання"\r
    },\r
    "serialPortClosedOk": {\r
        "message": "MSP з'єднання <span style=\\"color: #37a8db\\">успішно</span> закрито"\r
    },\r
    "serialPortClosedFail": {\r
        "message": "<span style=\\"color: red\\">Не вдалося</span> закрити MSP з'єднання"\r
    },\r
    "serialPortUnrecoverable": {\r
        "message": "Непоправна <span style=\\"color: red\\">помилка</span> послідовного з'єднання. Роз'єднуємось...'"\r
    },\r
    "connectionConnected": {\r
        "message": "З'єднано з: $1"\r
    },\r
    "connectionBleType": {\r
        "message": "Тип пристрою BLE: $1"\r
    },\r
    "connectionBleNotSupported": {\r
        "message": "<span style=\\"color: red\\">Помилка підключення:</span> Прошивка не підтримує BLE з'єднання. Скасування."\r
    },\r
    "connectionBleInterrupted": {\r
        "message": "З'єднання було несподівано перервано."\r
    },\r
    "connectionBleError": {\r
        "message": "Помилка при відкритті BLE пристрою: $1"\r
    },\r
    "connectionBleCliEnter": {\r
        "message": "Підключення через BLE активне, вивід може бути повільнішим, ніж зазвичай."\r
    },\r
    "connectionUdpTimeout": {\r
        "message": "Час з’єднання UDP вийшов."\r
    },\r
    "usbDeviceOpened": {\r
        "message": "Пристрій USB <span style=\\"color: #37a8db\\">успішно</span> відкрито"\r
    },\r
    "usbDeviceOpenFail": {\r
        "message": "<span style=\\"color: red\\">Не вдалося</span> відкрити USB пристрій!"\r
    },\r
    "usbDeviceClosed": {\r
        "message": "Пристрій USB <span style=\\"color: #37a8db\\">успішно</span> закрито"\r
    },\r
    "usbDeviceCloseFail": {\r
        "message": "<span style=\\"color: red\\">Не вдалося</span> закрити USB пристрій"\r
    },\r
    "usbDeviceUdevNotice": {\r
        "message": "<strong>udev правила</strong> коректно встановлені? Перегляньте документацію для інструкцій"\r
    },\r
    "stm32UsbDfuNotFound": {\r
        "message": "Завантажувач USB не знайдено"\r
    },\r
    "stm32RebootingToBootloader": {\r
        "message": "Ініціюється перезавантаження до завантажувача..."\r
    },\r
    "stm32RebootingToBootloaderFailed": {\r
        "message": "Перезавантаження пристрою до завантажувача: НЕВДАЧА"\r
    },\r
    "stm32TimedOut": {\r
        "message": "STM32 - сплинув час очікування, програмування: НЕВДАЧА"\r
    },\r
    "stm32WrongResponse": {\r
        "message": "Помилка зв’язку STM32, неправильна відповідь, очікується: $1 (0x$2) отримано: $3 (0x$4)"\r
    },\r
    "stm32ContactingBootloader": {\r
        "message": "Встановлення зв'язку з завантажувачем ..."\r
    },\r
    "stm32ContactingBootloaderFailed": {\r
        "message": "Помилка зв’язку із завантажувачем"\r
    },\r
    "stm32ResponseBootloaderFailed": {\r
        "message": "Немає відповіді від завантажувача, програмування: НЕВДАЧА"\r
    },\r
    "stm32GlobalEraseExtended": {\r
        "message": "Виконання глобального стирання чіпа (через розширене стирання)..."\r
    },\r
    "stm32LocalEraseExtended": {\r
        "message": "Виконання локального стирання (через розширене стирання)..."\r
    },\r
    "stm32GlobalErase": {\r
        "message": "Виконання глобального стирання чіпа..."\r
    },\r
    "stm32LocalErase": {\r
        "message": "Виконання локального стирання..."\r
    },\r
    "stm32InvalidHex": {\r
        "message": "Недійсний hex"\r
    },\r
    "stm32Erase": {\r
        "message": "Видалення ..."\r
    },\r
    "stm32Flashing": {\r
        "message": "Прошиваємо ..."\r
    },\r
    "stm32Verifying": {\r
        "message": "Перевіряємо..."\r
    },\r
    "stm32ProgrammingSuccessful": {\r
        "message": "Програмування: УСПІШНО"\r
    },\r
    "stm32ProgrammingFailed": {\r
        "message": "Програмування: ПОМИЛКА"\r
    },\r
    "stm32AddressLoadFailed": {\r
        "message": "Не вдалось завантажити адресу для сектора байтів конфігурації STM32. Швидше за все через захист від читання."\r
    },\r
    "stm32AddressLoadSuccess": {\r
        "message": "Завантаження адреси для сектора байтів конфігурації виконано успішно."\r
    },\r
    "stm32AddressLoadUnknown": {\r
        "message": "Невдале завантаження адреси для сектора байтів конфігурації через невідому помилку. Скасування."\r
    },\r
    "stm32NotReadProtected": {\r
        "message": "Захист від читання не активний"\r
    },\r
    "stm32ReadProtected": {\r
        "message": "Схоже, плата захищена від читання. Зняття захисту. Не роз'єднуйте/не відключайте!"\r
    },\r
    "stm32UnprotectSuccessful": {\r
        "message": "Захист знято."\r
    },\r
    "stm32UnprotectUnplug": {\r
        "message": "НЕОБХІДНА ДІЯ: від’єднайте та знову під’єднайте польотний контролер в режимі DFU, щоб спробувати прошити ще раз!"\r
    },\r
    "stm32UnprotectFailed": {\r
        "message": "Не вдалося зняти захист плати"\r
    },\r
    "stm32UnprotectInitFailed": {\r
        "message": "Не вдалося запустити процес зняття захисту"\r
    },\r
    "noConfigurationReceived": {\r
        "message": "Конфігурація не отримана протягом <span style=\\"color: red\\">10 секунд</span>, зв'язок <span style=\\"color: red\\">не вдався</span>"\r
    },\r
    "firmwareVersionNotSupported": {\r
        "message": "Ця версія прошивки <span style=\\"color: red\\">не підтримується</span>. Ця версія конфігуратора підтримує прошивку з $1 до $2 (не включно)"\r
    },\r
    "firmwareVariantNotSupported": {\r
        "message": "Ця версія прошивки <span style=\\"color: red\\">не підтримується</span>. Будь ласка, обновіть INAV прошивку. Використовуйте командний рядок для створення резервної копії перед прошивкою. Процедура створення резервної копії є в документації."\r
    },\r
    "tabSwitchConnectionRequired": {\r
        "message": "Необхідно <strong>під'єднатися</strong>, перш ніж ви зможете переглянути будь-яку з вкладок."\r
    },\r
    "tabSwitchWaitForOperation": {\r
        "message": "Ви \\"<span style=\\"color: red\\">не можете</span> зробити це зараз, будь ласка, зачекайте на завершення поточної операції..."\r
    },\r
    "tabSwitchUpgradeRequired": {\r
        "message": "Вам треба <strong>оновити</strong> прошивку перед використанням вкладки $1."\r
    },\r
    "firmwareVersion": {\r
        "message": "Версія прошивки: <strong>$1</strong>"\r
    },\r
    "apiVersionReceived": {\r
        "message": "Версія API MultiWii <span style=\\"color: #37a8db\\">отримано</span> - <strong>$1</strong>"\r
    },\r
    "uniqueDeviceIdReceived": {\r
        "message": "Унікальний ID пристрою <span style=\\"color: #37a8db\\">отримано</span> - <strong>0x$1</strong>"\r
    },\r
    "boardInfoReceived": {\r
        "message": "Плата: <strong>$1</strong>, версія: <strong>$2</strong>"\r
    },\r
    "buildInfoReceived": {\r
        "message": "Запущена прошивка випущена: <strong>$1</strong>"\r
    },\r
    "fcInfoReceived": {\r
        "message": "Інформація про польотний контролер, ідентифікатор: <strong>$1</strong>, версія: <strong>$2</strong>"\r
    },\r
    "notifications_app_just_updated_to_version": {\r
        "message": "Застосунок оновлено до версії: $1"\r
    },\r
    "notifications_click_here_to_start_app": {\r
        "message": "Натисніть тут, щоб запустити застосунок"\r
    },\r
    "statusbar_port_utilization": {\r
        "message": "Використання порту:"\r
    },\r
    "statusbar_usage_download": {\r
        "message": "D: $1%"\r
    },\r
    "statusbar_usage_upload": {\r
        "message": "U: $1%"\r
    },\r
    "statusbar_packet_error": {\r
        "message": "Помилки пакетів:"\r
    },\r
    "statusbar_i2c_error": {\r
        "message": "Помилка I2C:"\r
    },\r
    "statusbar_cycle_time": {\r
        "message": "Час циклу:"\r
    },\r
    "statusbar_cpu_load": {\r
        "message": "Навантаження процесора: $1%"\r
    },\r
    "statusbar_arming_flags": {\r
        "message": "Попередження взведення:"\r
    },\r
    "dfu_connect_message": {\r
        "message": "Будь ласка, використовуйте програматор для доступу до пристроїв DFU"\r
    },\r
    "dfu_erased_kilobytes": {\r
        "message": "<span style=\\"color: #37a8db\\">Успішно</span> стерто $1 kB флешпам'яті"\r
    },\r
    "dfu_device_flash_info": {\r
        "message": "Виявлено пристрій із загальним розміром флешпам’яті $1 КБ"\r
    },\r
    "dfu_error_image_size": {\r
        "message": "<span style=\\"color: red; font-weight: bold\\">Помилка</span>: Образ більший, ніж доступна флешпам'ять на чіпі! Образ: $1 KiB, обмеження = $2 KiB"\r
    },\r
    "eeprom_saved_ok": {\r
        "message": "EEPROM <span style=\\"color: #37a8db\\">збережено</span>"\r
    },\r
    "defaultWelcomeIntro": {\r
        "message": "Ласкаво просимо до <strong>INAV конфігуратора</strong> - програми, призначеної для спрощення оновлення, конфігурації та налаштування вашого польотного контролера."\r
    },\r
    "defaultWelcomeHead": {\r
        "message": "Прошивка і драйвери"\r
    },\r
    "defaultWelcomeHead2": {\r
        "message": "Друзі INAV"\r
    },\r
    "defaultWelcomeText2": {\r
        "message": "INAV підтримується чудовою спільнотою користувачів, розробників і компаній. Ось короткий список: <a href=\\"http://www.mateksys.com/\\" target=\\"_blank\\">Mateksys</a>, <a href=\\"https://www.speedybee.com/\\" target=\\"_blank\\">SpeedyBee</a>, <a href=\\"https://geprc.com/\\" target=\\"_blank\\">GEPRC</a>. "\r
    },\r
    "defaultWelcomeText": {\r
        "message": "Вихідний код прошивки можна завантажити <a href=\\"https://github.com/iNavFlight\\" title=\\"www.github.com\\" target=\\"_blank\\">тут</a><br />Найновіший образ прошивки мікропрограми є <a href=\\"https://github.com/iNavFlight/inav/releases\\" title=\\"www.github.com\\" target=\\"_blank\\">тут</a>.<br /><br />Останні <strong>драйвери STM USB VCP</strong> можна завантажити <a href=\\"http://www.st.com/web/en/catalog/tools/PF257938\\" title=\\"http://www.st.com\\" target=\\"_blank\\">тут</a><br />Останній <strong>Zadig</strong> для прошивки з Windows DFU можна завантажити <a href=\\"http://zadig.akeo.ie/\\" title=\\"http://zadig.akeo.ie\\" target=\\"_blank\\">тут</a><br />"\r
    },\r
    "defaultContributingHead": {\r
        "message": "Сприяння"\r
    },\r
    "defaultContributingText": {\r
        "message": "Якщо ви хочете допомогти зробити INAV ще кращим, можна доєднатися у різний спосіб, включаючи:<br /><ul><li>Відповіді на запитання інших користувачів на форумах та IRC.</li><li>Внесення коду до прошивки та конфігуратора - нові функції, виправлення, покращення. </li><li>Тестування <a href=\\"https://github.com/iNavFlight/inav/pulls\\" target=\\"_blank\\">new нових функцій/виправлень</a> та надання зворотного зв'язку.</li><li>Допомога <a href=\\"https://github.com/iNavFlight/inav/issues\\" target=\\"_blank\\">у вирішенні проблем та коментування запитів на нові функції. </a>.</li></ul>"\r
    },\r
    "defaultChangelogHead": {\r
        "message": "Конфігуратор - Журнал змін"\r
    },\r
    "defaultButtonFirmwareFlasher": {\r
        "message": "Програматор"\r
    },\r
    "defaultDonateHead": {\r
        "message": "Відкритий код / Повідомлення про пожертву"\r
    },\r
    "defaultDonateText": {\r
        "message": "Ця утиліта є повністю <strong>відкритим вихідним кодом</strong> і доступна безкоштовно для всіх користувачів <strong>INAV</strong>.<br />Якщо ви вважаєте, що INAV або INAV Configurator корисні, будь ласка, розгляньте можливість <strong>підтримати</strong> його розробку шляхом пожертви."\r
    },\r
    "defaultSponsorsHead": {\r
        "message": "INAV підтримується"\r
    },\r
    "communityRCGroupsSupport": {\r
        "message": "Підтримка RC групами"\r
    },\r
    "communityDiscordServer": {\r
        "message": "Сервер Discord"\r
    },\r
    "communitySlackSupport": {\r
        "message": "Чат підтримки Slack"\r
    },\r
    "communityTelegramSupport": {\r
        "message": "Telegram канал"\r
    },\r
    "communityFacebookSupport": {\r
        "message": "Група у Facebook"\r
    },\r
    "initialSetupBackupAndRestoreApiVersion": {\r
        "message": "<span style=\\"color: red\\">Функція резервного копіювання та відновлення відключена.</span> Ви маєте прошивку з версією API <span style=\\"color: red\\">$1</span>, для резервного копіювання та відновлення потрібна версія <span style=\\"color: #37a8db\\">$2</span>. Будь ласка, виконайте резервне копіювання налаштувань через командний рядок, дивіться документацію INAV для цієї процедури."\r
    },\r
    "initialSetupButtonCalibrateAccel": {\r
        "message": "Відкалібрувати акселерометр"\r
    },\r
    "initialSetupCalibrateAccelText": {\r
        "message": "Калібрування акселерометра за 6 точками. Перейдіть до wiki iNav і дотримуйтесь інструкцій з калібрування датчиків для отримання додаткової інформації"\r
    },\r
    "initialSetupButtonCalibrateMag": {\r
        "message": "Калібрувати Магнітометр"\r
    },\r
    "initialSetupCalibrateMagText": {\r
        "message": "Покрутіть мультикоптер принаймні <strong>360</strong> градусів по всіх 3-х осях обертання, у вас є 30 секунд, щоб виконати це завдання"\r
    },\r
    "initialSetupButtonReset": {\r
        "message": "Скинути налаштування"\r
    },\r
    "initialSetupResetText": {\r
        "message": "Відновити налаштування до <strong>значень за замовчуванням</strong>"\r
    },\r
    "initialSetupButtonBackup": {\r
        "message": "Резервна копія"\r
    },\r
    "initialSetupButtonRestore": {\r
        "message": "Відновити"\r
    },\r
    "initialSetupBackupRestoreText": {\r
        "message": "<strong>Зробіть резервну копію</strong> вашої конфігурації на випадок аварії, налаштування <strong>CLI</strong> <span style=\\"color: red\\">не</span> включені - Дивіться команду командного рядка 'dump'"\r
    },\r
    "initialSetupBackupSuccess": {\r
        "message": "Резервну копію збережено <span style=\\"color: #37a8db\\">успішно</span>"\r
    },\r
    "initialSetupRestoreSuccess": {\r
        "message": "Конфігурацію відновлено <span style=\\"color: #37a8db\\">успішно</span>"\r
    },\r
    "initialSetupButtonResetZaxis": {\r
        "message": "Скинути вісь Z, зміщення: 0 градусів"\r
    },\r
    "initialSetupButtonResetZaxisValue": {\r
        "message": "Скинути вісь Z, зміщення: $1 градусів"\r
    },\r
    "initialSetupMixerHead": {\r
        "message": "Тип Мікшеру"\r
    },\r
    "initialSetupThrottleHead": {\r
        "message": "Налаштування тяги"\r
    },\r
    "initialSetupMinimum": {\r
        "message": "Мінімум:"\r
    },\r
    "initialSetupMaximum": {\r
        "message": "Максимум:"\r
    },\r
    "initialSetupFailsafe": {\r
        "message": "Безаварійність:"\r
    },\r
    "initialSetupMinCommand": {\r
        "message": "МінКоманда:"\r
    },\r
    "initialSetupBatteryHead": {\r
        "message": "Батарея"\r
    },\r
    "initialSetupMinCellV": {\r
        "message": "Мін. напруга комірки:"\r
    },\r
    "initialSetupMaxCellV": {\r
        "message": "Макс. напруга комірки:"\r
    },\r
    "initialSetupVoltageScale": {\r
        "message": "Масштаб напруги:"\r
    },\r
    "initialSetupAccelTrimsHead": {\r
        "message": "Коригування акселерометра"\r
    },\r
    "initialSetupPitch": {\r
        "message": "Тангаж:"\r
    },\r
    "initialSetupRoll": {\r
        "message": "Крен:"\r
    },\r
    "initialSetupMagHead": {\r
        "message": "Магнітометр"\r
    },\r
    "initialSetupDeclination": {\r
        "message": "Схилення:"\r
    },\r
    "initialSetupInfoHead": {\r
        "message": "Інформація"\r
    },\r
    "initialSetupBatteryVoltage": {\r
        "message": "Напруга батареї:"\r
    },\r
    "initialSetupBatteryDetectedCells": {\r
        "message": "Кількість виявлених комірок:"\r
    },\r
    "initialSetupBatteryDetectedCellsValue": {\r
        "message": "$1"\r
    },\r
    "initialSetupBatteryPercentage": {\r
        "message": "Залишилось заряду батареї:"\r
    },\r
    "initialSetupBatteryPercentageValue": {\r
        "message": "$1 %"\r
    },\r
    "initialSetupBatteryRemainingCapacity": {\r
        "message": "Залишкова ємність батареї"\r
    },\r
    "initialSetupBatteryRemainingCapacityValue": {\r
        "message": "$1 $2"\r
    },\r
    "initialSetupBatteryFull": {\r
        "message": "Повний заряд батареї, коли підключено"\r
    },\r
    "initialSetupBatteryFullValue": {\r
        "message": "$1"\r
    },\r
    "initialSetupBatteryThresholds": {\r
        "message": "Порогові значення використання батареї"\r
    },\r
    "initialSetupBatteryThresholdsValue": {\r
        "message": "$1"\r
    },\r
    "initialSetup_Wh_drawn": {\r
        "message": "Спожита ємність:"\r
    },\r
    "initialSetup_Wh_drawnValue": {\r
        "message": "$1 Втг"\r
    },\r
    "initialSetupBatteryVoltageValue": {\r
        "message": "$1 В"\r
    },\r
    "initialSetupDrawn": {\r
        "message": "Спожита ємність:"\r
    },\r
    "initialSetupCurrentDraw": {\r
        "message": "Поточне струмоспоживання:"\r
    },\r
    "initialSetupPowerDraw": {\r
        "message": "Споживання потужності:"\r
    },\r
    "initialSetupPowerDrawValue": {\r
        "message": "$1 Вт"\r
    },\r
    "initialSetupBatteryMahValue": {\r
        "message": "$1 мАг"\r
    },\r
    "initialSetupCurrentDrawValue": {\r
        "message": "$1 А"\r
    },\r
    "initialSetupRSSI": {\r
        "message": "RSSI: "\r
    },\r
    "initialSetupRSSIValue": {\r
        "message": "$1 %"\r
    },\r
    "initialSetupGPSHead": {\r
        "message": "GPS"\r
    },\r
    "initialSetupInstrumentsHead": {\r
        "message": "Інструменти"\r
    },\r
    "initialSetupButtonSave": {\r
        "message": "Зберегти"\r
    },\r
    "initialSetupModel": {\r
        "message": "Модель: $1"\r
    },\r
    "initialSetupAttitude": {\r
        "message": "$1 °"\r
    },\r
    "initialSetupAccelCalibStarted": {\r
        "message": "Калібрування акселерометра розпочалося"\r
    },\r
    "initialSetupAccelCalibEnded": {\r
        "message": "Калібрування акселерометра <span style=\\"color: #37a8db\\">завершено</span>"\r
    },\r
    "initialSetupMagCalibStarted": {\r
        "message": "Калібрування магнітометра розпочалося"\r
    },\r
    "initialSetupMagCalibEnded": {\r
        "message": "Калібрування магнітометра <span style=\\"color: #37a8db\\">завершено</span>"\r
    },\r
    "initialSetupOpflowCalibStarted": {\r
        "message": "Калібрування оптичного потоку почалось"\r
    },\r
    "initialSetupOpflowCalibEnded": {\r
        "message": "Калібрування оптичного датчика потоку<span style=\\"color: #37a8db\\">завершено</span>"\r
    },\r
    "initialSetupSettingsRestored": {\r
        "message": "Налаштування відновлені до <strong>значень за замовчуванням</strong>"\r
    },\r
    "initialSetupEepromSaved": {\r
        "message": "EEPROM <span style=\\"color: #37a8db\\">збережено</span>: налаштування"\r
    },\r
    "RX_PPM": {\r
        "message": "Вхід PPM RX"\r
    },\r
    "RX_SERIAL": {\r
        "message": "Послідовний приймач (SPEKSAT, SBUS, SUMD)"\r
    },\r
    "RX_PWM": {\r
        "message": "Вхід ШІМ приймача (один провід на канал)"\r
    },\r
    "RX_MSP": {\r
        "message": "Вхід MSP приймача (керування через порт MSP)"\r
    },\r
    "RX_SPI": {\r
        "message": "Приймач на основі SPI (NRF24L01, RFM22)"\r
    },\r
    "RX_NONE": {\r
        "message": "Немає приймача"\r
    },\r
    "featureVBAT": {\r
        "message": "Моніторинг напруги батареї"\r
    },\r
    "featureTX_PROF_SEL": {\r
        "message": "Вибір профілю за допомогою команди стіка TX"\r
    },\r
    "featureINFLIGHT_ACC_CAL": {\r
        "message": "Калібрування під час польоту"\r
    },\r
    "featureMOTOR_STOP": {\r
        "message": "Зупиняти мотори при низькій тязі"\r
    },\r
    "featureSERVO_TILT": {\r
        "message": "Сервоприводний підвіс"\r
    },\r
    "featureBAT_PROFILE_AUTOSWITCH": {\r
        "message": "Автоматичний вибір профілю батареї"\r
    },\r
    "featureBAT_PROFILE_AUTOSWITCHTip": {\r
        "message": "Автоматично перемикати профіль батареї в залежності від напруги батареї, коли батарею підключено"\r
    },\r
    "featureTHR_VBAT_COMP": {\r
        "message": "Компенсація падіння напруги батареї"\r
    },\r
    "featureTHR_VBAT_COMPTip": {\r
        "message": "Автоматично компенсувати падіння напруги, коли розряджається батарея, щоб стабілізувати тягу"\r
    },\r
    "featureSOFTSERIAL": {\r
        "message": "Увімкнути послідовні порти на основі ЦП"\r
    },\r
    "featureSOFTSERIALTip": {\r
        "message": "Після включення налаштуйте порти у вкладці Порти."\r
    },\r
    "featureGPS": {\r
        "message": "GPS для навігації та телеметрії"\r
    },\r
    "featureGPSTip": {\r
        "message": "Спочатку налаштуйте порт"\r
    },\r
    "featureFAILSAFE": {\r
        "message": "Застосування налаштувань безаварійності при втраті сигналу приймачем"\r
    },\r
    "featureSONAR": {\r
        "message": "Сонар"\r
    },\r
    "featureTELEMETRY": {\r
        "message": "Вивід телеметрії"\r
    },\r
    "featureCURRENT_METER": {\r
        "message": "Відстеження струму батареї"\r
    },\r
    "featureREVERSIBLE_MOTORS": {\r
        "message": "Режим реверсних моторів (для використання з реверсними регуляторами швидкості ESC)"\r
    },\r
    "featureRSSI_ADC": {\r
        "message": "Аналоговий RSSI вхід"\r
    },\r
    "featureLED_STRIP": {\r
        "message": "Підтримка багатоколірної RGB LED стрічки"\r
    },\r
    "featureDASHBOARD": {\r
        "message": "OLED Дисплей"\r
    },\r
    "featureONESHOT125": {\r
        "message": "Підтримка ONESHOT ESC"\r
    },\r
    "featureONESHOT125Tip": {\r
        "message": "Від'єднайте батарею та зніміть пропелери перед увімкненням."\r
    },\r
    "featurePWM_OUTPUT_ENABLE": {\r
        "message": "Увімкнути вивід моторів та сервоприводів"\r
    },\r
    "featurePWM_OUTPUT_ENABLETip": {\r
        "message": "Увімкнення цієї опції необхідне для того, щоб INAV могло відправляти сигнали до ESC. Це захисний захід, який запобігає пошкодженню сервоприводів безпосередньо після прошивки польотного контролеру."\r
    },\r
    "featureBLACKBOX": {\r
        "message": "Записи даних «Чорної скриньки»"\r
    },\r
    "featureBLACKBOXTip": {\r
        "message": "Налаштувати через вкладку Чорної Скриньки BlackBox після увімкнення."\r
    },\r
    "onboardLoggingBlackbox": {\r
        "message": "Пристрій для запису журналу"\r
    },\r
    "onboardLoggingBlackboxRate": {\r
        "message": "Частка ітерацій циклу процесора для журналювання (частота журналювання)"\r
    },\r
    "featureCHANNEL_FORWARDING": {\r
        "message": "Перенаправляти AUX канали на серво виходи"\r
    },\r
    "featureSOFTSPI": {\r
        "message": "SPI на основі ЦП"\r
    },\r
    "featurePWM_SERVO_DRIVER": {\r
        "message": "Зовнішній драйвер ШІМ сервоприводу"\r
    },\r
    "featurePWM_SERVO_DRIVERTip": {\r
        "message": "Використовуйте зовнішній PCA9685 ШІМ-драйвер, щоб підключити до 16 сервоприводів до польотного контролеру. PCA9685 повинен бути підключений для увімкнення цієї функції."\r
    },\r
    "featureRSSI_ADCTip": {\r
        "message": "Індикатор рівня потужності отриманого сигналу (RSSI) - це вимірювання рівня сигналу, і він дуже зручний, щоб ви знали, коли ваше повітряне судно виходить за межі діапазону або зазнає радіочастотних перешкод."\r
    },\r
    "featureOSD": {\r
        "message": "Наекранне меню"\r
    },\r
    "featureAIRMODE": {\r
        "message": "Включити AIRMODE постійно"\r
    },\r
    "featureFW_LAUNCH": {\r
        "message": "Постійне включення режиму запуску для фіксованого крила"\r
    },\r
    "featureFW_AUTOTRIM": {\r
        "message": "Постійна корекція сервоприводів на фіксованому крилі"\r
    },\r
    "featureFW_AUTOTRIMTip": {\r
        "message": "Під час польоту в стабілізованому режимі постійно регулювати середні точки сервоприводів, щоб літак продовжував летіти прямо під час переключення на ручний режим. Потребує GPS."\r
    },\r
    "featureDYNAMIC_FILTERS": {\r
        "message": "Динамічні фільтри гіроскопу"\r
    },\r
    "featureDYNAMIC_FILTERSTip": {\r
        "message": "Використовує автоматичний ШПФ-аналіз даних гіроскопу при налаштуванні режекторниx фільтрів для послаблення шумів гіроскопу. Має бути ввімкнений весь час!"\r
    },\r
    "configurationFeatureEnabled": {\r
        "message": "Увімкнено"\r
    },\r
    "configurationFeatureName": {\r
        "message": "Функція"\r
    },\r
    "configurationFeatureDescription": {\r
        "message": "Опис"\r
    },\r
    "configurationMixer": {\r
        "message": "Мікшер"\r
    },\r
    "configurationFeatures": {\r
        "message": "Інші функції"\r
    },\r
    "configurationReceiver": {\r
        "message": "Режим приймача"\r
    },\r
    "configurationRSSI": {\r
        "message": "RSSI (Сила сигналу)"\r
    },\r
    "configurationEscFeatures": {\r
        "message": "Функції ESC/мотора"\r
    },\r
    "serialrx_inverted": {\r
        "message": "Послідовний порт інвертований (порівнюючи з протоколом за замовчуванням)"\r
    },\r
    "serialrx_halfduplex": {\r
        "message": "Послідовний приймач напівдуплексний"\r
    },\r
    "serialrx_frSkyPitchRollLabel": {\r
        "message": "Використовуйте датчики тангажу та крену у телеметрії"\r
    },\r
    "serialrx_frSkyPitchRollHelp": {\r
        "message": "Це надсилає дані телеметрії кутів тангажу та крену замість стандартних датчиків сирих прискорень. Якщо ви використовуєте LUA-скрипти панелі телеметрії INAV OpenTX/EdgeTX або ETHOS, це слід увімкнути <strong>on</strong>."\r
    },\r
    "serialrx_frSkyFuelUnitLabel": {\r
        "message": "Паливні одиниці SmartPort"\r
    },\r
    "serialrx_frSkyFuelUnitHelp": {\r
        "message": "Виберіть дані, які потрібно надіслати на телеметричний сенсор <strong>палива</strong>."\r
    },\r
    "configurationFeaturesHelp": {\r
        "message": "<strong>Примітка:</strong> Не всі комбінації функцій є дійсними. Коли прошивка польотного контролера виявляє недійсні комбінації, конфліктуючі функції будуть вимкнені. <br /> <strong>Примітка:</strong> Налаштуйте послідовні порти <span style=\\"color: red\\">перед</span> активацією функцій, які будуть використовувати ці порти."\r
    },\r
    "configurationSerialRXHelp": {\r
        "message": "<strong>Примітка:</strong> Не забудьте налаштувати послідовний порт (через вкладку портів) для послідовного приймача"\r
    },\r
    "configurationFrSkyOptions": {\r
        "message": "Параметри FrSky"\r
    },\r
    "configurationFrSkyOptions_HELP": {\r
        "message": "Ці параметри забезпечують швидкий доступ до налаштування телеметричних сенсорів SmartPort для роботи з LUA-скриптами телеметрії OpenTX/EdgeTX та ETHOS. Зверніть увагу, що якщо ви використовуєте SBUS, вам потрібно налаштувати телеметрію SmartPort на окремому серійному порту."\r
    },\r
    "configurationSensorAlignmentMag": {\r
        "message": "Вирівнювання магнітометра"\r
    },\r
    "configurationSensorAlignmentMagRoll": {\r
        "message": "Крен"\r
    },\r
    "configurationSensorAlignmentMagPitch": {\r
        "message": "Тангаж"\r
    },\r
    "configurationSensorAlignmentMagYaw": {\r
        "message": "Рискання"\r
    },\r
    "configurationAccelTrims": {\r
        "message": "Корекція акселерометра"\r
    },\r
    "configurationAccelTrimRoll": {\r
        "message": "Корекція акселерометра по крену"\r
    },\r
    "configurationAccelTrimPitch": {\r
        "message": "Корекція акселерометра по тангажу"\r
    },\r
    "configurationMagDeclination": {\r
        "message": "Схилення магнітометра [градуси]"\r
    },\r
    "configurationAutoDisarmDelay": {\r
        "message": "Кількість секунд до охолощення через низьку тягу"\r
    },\r
    "configurationAutoDisarmDelayHelp": {\r
        "message": "Використовується тільки для взведення стіком (тобто, не використовуючи перемикач)"\r
    },\r
    "configurationThrottleMinimum": {\r
        "message": "Мінімальна тяга"\r
    },\r
    "configurationThrottleMid": {\r
        "message": "Середня тяга [центральне вхідне значення пульта]"\r
    },\r
    "configurationThrottleMaximum": {\r
        "message": "Максимальна тяга"\r
    },\r
    "configurationThrottleMinimumCommand": {\r
        "message": "Мінімальна Команда"\r
    },\r
    "configurationVoltageCurrentSensor": {\r
        "message": "Датчики напруги та струму"\r
    },\r
    "configurationBatteryCurrent": {\r
        "message": "Струм споживання"\r
    },\r
    "configurationVoltageSource": {\r
        "message": "Джерело напруги для попереджень і телеметрії"\r
    },\r
    "configurationVoltageSourceHelp": {\r
        "message": "Необроблена напруга — це напруга, яка зчитується безпосередньо з батареї. Компенсована напруга — це розрахована напруга, яка повинна бути на батареї без навантаження (імітує ідеальну батарею і повинна усунути помилкові сигнали попередження, що їх викликано високими навантаженнями)"\r
    },\r
    "configurationBatteryCells": {\r
        "message": "Кількість комірок (0 = авто)"\r
    },\r
    "configurationBatteryCellsHelp": {\r
        "message": "Вкажіть кількість елементів батареї, щоб вимкнути автоматичне визначення кількoсті елементів i щоб вимкнути функцію автоматичного перемикання профілів акумулятора. 7S, 9S та 11S акумулятори не можна автоматично визначити."\r
    },\r
    "configurationBatteryCellDetectVoltage": {\r
        "message": "Максимальна напруга елементів для визначення кількості елементів"\r
    },\r
    "configurationBatteryCellDetectVoltageHelp": {\r
        "message": "Максимальна напруга комірки, яка використовується для автоматичного визначення кількості комірoк. Повинна бути більшою, ніж максимальна напруга комірки, щоб брати до розрахунку можливий дрейф y вимірюваній напрузі та точності розпізнавання комірoк."\r
    },\r
    "configurationBatteryMinimum": {\r
        "message": "Мін. напруга комірки"\r
    },\r
    "configurationBatteryMaximum": {\r
        "message": "Макс. напруга комірки"\r
    },\r
    "configurationBatteryWarning": {\r
        "message": "Попередження про напругу комірки"\r
    },\r
    "configurationBatteryScale": {\r
        "message": "Маштаб напруги"\r
    },\r
    "configurationBatteryVoltage": {\r
        "message": "Напруга батареї"\r
    },\r
    "configurationCurrentScale": {\r
        "message": "Шкала вимірювання струму"\r
    },\r
    "configurationCurrentScaleHelp": {\r
        "message": "Шкала вихідної напруги в міліампери [1/10та мВ/А]"\r
    },\r
    "configurationCurrentOffset": {\r
        "message": "Зсув у мілівольтових кроках"\r
    },\r
    "configurationBatteryMultiwiiCurrent": {\r
        "message": "Увімкнути підтримку застарілого Multiwii MSP у якості джерела інформації про струм"\r
    },\r
    "configurationBatterySettings": {\r
        "message": "Налаштування батареї"\r
    },\r
    "configurationBatterySettingsHelp": {\r
        "message": "Ці налаштування застосовуються до поточного профілю акумулятора "\r
    },\r
    "configurationBatteryCapacityValue": {\r
        "message": "Ємність"\r
    },\r
    "configurationBatteryCapacityWarning": {\r
        "message": "Попередження про заряд батареї (залишилось %)"\r
    },\r
    "configurationBatteryCapacityCritical": {\r
        "message": "Критично низький заряд (залишилось %)"\r
    },\r
    "configurationBatteryCapacityUnit": {\r
        "message": "Номінальна ємність батареї"\r
    },\r
    "configurationLaunch": {\r
        "message": "Налаштування автоматичного запуску для крил"\r
    },\r
    "configurationLaunchVelocity": {\r
        "message": "Порогова швидкість"\r
    },\r
    "configurationLaunchVelocityHelp": {\r
        "message": "Поріг прямої швидкості для розпізнавання запуску з розмаху. За замовчуванням: 300 [100-10000]"\r
    },\r
    "configurationLaunchAccel": {\r
        "message": "Поріг прискорення"\r
    },\r
    "configurationLaunchAccelHelp": {\r
        "message": "Поріг прискорення для запуску з катапульти чи для підкидного запуску, 1G = 981 см/с. За замовчуванням: 1863 [1000-20000]"\r
    },\r
    "configurationLaunchMaxAngle": {\r
        "message": "Максимальний кут підкидання для запуску"\r
    },\r
    "configurationLaunchMaxAngleHelp": {\r
        "message": "Макс. кут підкидання (нахил/тангаж), коли запуск вважається успішним. Встановіть 180 для повного вимкнення цієї функції. 3а замовчуванням: 45 [5-180]"\r
    },\r
    "configurationLaunchDetectTime": {\r
        "message": "Визначити час"\r
    },\r
    "configurationLaunchDetectTimeHelp": {\r
        "message": "Поріг часу, перевищення якого буде означати завершення запуску. За замовчуванням: 40 [10-1000]"\r
    },\r
    "configurationLaunchThr": {\r
        "message": "Тяга запуску"\r
    },\r
    "configurationLaunchThrHelp": {\r
        "message": "Тяга запуску - налаштування тяги під час послідовності запуску. За замовчуванням: 1700 [1000-2000]"\r
    },\r
    "configurationLaunchIdleThr": {\r
        "message": "Тяга холостого ходу"\r
    },\r
    "configurationLaunchIdleThrHelp": {\r
        "message": "Idle throttle - тяга, яка встановлюється перед початком запуску. Якщо встановлено нижче мінімальної тяги, це припинить роботу мотора або встановить холосту тягу (залежно від того, чи увімкнено MOTOR_STOP). Якщо встановлено вище мінімальної тяги, це примусово встановить цю тягу (якщо MOTOR_STOP увімкнено, це буде оброблено відповідно до положення ручки тяги). За замовчуванням: 1000 [1000-2000]"\r
    },\r
    "configurationLaunchIdleDelay": {\r
        "message": "Затримка тяги холостого ходу"\r
    },\r
    "configurationLaunchIdleDelayHelp": {\r
        "message": "Установіть затримку між підняттям тяги для старту та переходом мотора на холості оберти. За замовчуванням: 0 [0-60000]"\r
    },\r
    "configurationWiggleWakeIdle": {\r
        "message": "Поворушити для виходу з простою"\r
    },\r
    "configurationWiggleWakeIdleHelp": {\r
        "message": "Якщо увімкнено, ця функція дозволяє похитування по осі рискання для запуску моторів після холостого ходу.<br />0: Вимкнено (за замовчуванням)<br />1: 1 похитування – Вищий поріг виявлення, призначено для літаків без хвоста, які можуть легше обертатись<br />\\n2: 2 похитування – Нижчий поріг виявлення, але потребує повторної дії. Призначено для більших моделей та літаків з хвостом"\r
    },\r
    "configurationLaunchMotorDelay": {\r
        "message": "Затримка мотора"\r
    },\r
    "configurationLaunchMotorDelayHelp": {\r
        "message": "Затримка між виявленим запуском і початком послідовності запуску та підвищенням тяги. За замовчуванням: 500 [0-5000]"\r
    },\r
    "configurationLaunchSpinupTime": {\r
        "message": "Час розкрутки мотора"\r
    },\r
    "configurationLaunchSpinupTimeHelp": {\r
        "message": "Час для збільшення потужності від мінімальної тяги до nav_fw_launch_thr, щоб уникнути великого навантаження на ESC і великого крутного моменту від пропелера. За замовчуванням: 100 [0-1000]"\r
    },\r
    "configurationLaunchMinTime": {\r
        "message": "Мінімальний час запуску"\r
    },\r
    "configurationLaunchMinTimeHelp": {\r
        "message": "Дозволити режиму запуску виконуватися щонайменше цей час [мс] та ігнорувати рухи стиків. За замовчуванням: 0 [0-60000]"\r
    },\r
    "configurationLaunchTimeout": {\r
        "message": "Тайм-аут запуску"\r
    },\r
    "configurationLaunchTimeoutHelp": {\r
        "message": "Максимальний час для виконання послідовності зльоту. Після цього часу режим ЗЛІТ буде вимкнено, і буде активовано звичайний режим польоту. За замовчуванням: 5000 [0-60000]"\r
    },\r
    "configurationLaunchEndTime": {\r
        "message": "Час плавного переходу"\r
    },\r
    "configurationLaunchEndTimeHelp": {\r
        "message": "Час плавного переходу в кінці запуску (мс). Це додається до таймауту запуску. За замовчуванням: 2000 [0-5000]"\r
    },\r
    "configurationLaunchMaxAltitude": {\r
        "message": "Максимальна висота"\r
    },\r
    "configurationLaunchMaxAltitudeHelp": {\r
        "message": "Висота, на якій режим LAUNCH буде вимкнено, і включиться звичайний режим польоту. За замовчуванням: 0 [0-60000]"\r
    },\r
    "configurationLaunchClimbAngle": {\r
        "message": "Кут підйому"\r
    },\r
    "configurationLaunchClimbAngleHelp": {\r
        "message": "Кут набору висоти (положення моделі, не нахил при наборі висоти) для послідовності запуску (градуси), також обмежується глобальним max_angle_inclination_pit. За замовчуванням: 18 [5-45]"\r
    },\r
    "configuration3d": {\r
        "message": "Реверсивні мотори"\r
    },\r
    "configuration3dDeadbandLow": {\r
        "message": "Зона нечутливости реверсивних моторів, низька"\r
    },\r
    "configuration3dDeadbandHigh": {\r
        "message": "Зона нечутливости реверсивних моторів, висока"\r
    },\r
    "configuration3dNeutral": {\r
        "message": "Нейтральне положення реверсивних моторів"\r
    },\r
    "configuration3dDeadbandThrottle": {\r
        "message": "Реверсивні мотори, мертва зона тяги"\r
    },\r
    "configurationSystem": {\r
        "message": "Конфігурація системи"\r
    },\r
    "configurationLoopTime": {\r
        "message": "Час циклу польотного контролера"\r
    },\r
    "configurationCalculatedCyclesSec": {\r
        "message": "Цикли/сек (Гц)"\r
    },\r
    "configurationGPS": {\r
        "message": "Конфігурація"\r
    },\r
    "configurationGPSProtocol": {\r
        "message": "Протокол"\r
    },\r
    "configurationGPSUseGalileo": {\r
        "message": "Використовувати супутники Galileo (ЄС)"\r
    },\r
    "configurationGPSUseBeidou": {\r
        "message": "Використовувати супутники BeiDou (Китай)"\r
    },\r
    "configurationGPSUseGlonass": {\r
        "message": "Використовувати супутники Глонасс (РФ)"\r
    },\r
    "tzOffset": {\r
        "message": "Зміщення часового поясу"\r
    },\r
    "tzOffsetHelp": {\r
        "message": "Зміщення часового поясу від UTC. Це застосовується до часу GPS для ведення журналів та позначення часу в логах чорної скрині. (За замовчуванням = 0 хвилин)"\r
    },\r
    "tzAutomaticDST": {\r
        "message": "Автоматичний перехід на літній час"\r
    },\r
    "tzAutomaticDSTHelp": {\r
        "message": "Автоматично додавати літній час до часу GPS за потреби або просто ігнорувати його. Включає попередні налаштування для ЄС та США - якщо ви живете за межами цих регіонів, рекомендується керувати літнім часом вручну через tz_offset. (За замовчуванням = Викл.)"\r
    },\r
    "configurationGPSBaudrate": {\r
        "message": "Швидкість передачі даних"\r
    },\r
    "configurationGPSubxSbas": {\r
        "message": "Тип наземної допомоги"\r
    },\r
    "receiverType": {\r
        "message": "Тип приймача"\r
    },\r
    "configurationSerialRX": {\r
        "message": "Постачальник послідовного приймача"\r
    },\r
    "configurationSPIProtocol": {\r
        "message": "Протокол SPI приймача"\r
    },\r
    "configurationEepromSaved": {\r
        "message": "EEPROM <span style=color: #37a8db>збережено</span>: Конфігурація"\r
    },\r
    "configurationButtonSave": {\r
        "message": "Зберегти й перезавантажити"\r
    },\r
    "configurationVTX": {\r
        "message": "Відеопередавач"\r
    },\r
    "configurationVTXBand": {\r
        "message": "Діапазон"\r
    },\r
    "configurationNoBand": {\r
        "message": "Відсутній"\r
    },\r
    "configurationVTXNoBandHelp": {\r
        "message": "Частота VTX була встановлена вручну. Вибір діапазону перезапише налаштовану частоту."\r
    },\r
    "configurationVTXChannel": {\r
        "message": "Канал"\r
    },\r
    "configurationVTXPower": {\r
        "message": "Рівень потужності"\r
    },\r
    "configurationVTXPowerHelp": {\r
        "message": "Рівень потужності відеопередавача. Точна потужність у мВт (або дБм) буде залежати від конкретного апаратного забезпечення. Перевірте інструкцію до вашого відеопередавача."\r
    },\r
    "configurationVTXLowerPowerDisarm": {\r
        "message": "Використовувати низьку потужність, коли апарат охолощений"\r
    },\r
    "configurationVTXLowerPowerDisarmHelp": {\r
        "message": "Увімкнення цієї опції змусить VTX використовувати свою найнижчу потужність, коли апарат охолощений. Використовуйте 'До першого взведення', щоб змусити його використовувати найнижчу потужність лише до того, як ви вперше взведете."\r
    },\r
    "configurationVTXLowPowerDisarmValue_0": {\r
        "message": "Вимкнено"\r
    },\r
    "configurationVTXLowPowerDisarmValue_1": {\r
        "message": "Завжди"\r
    },\r
    "configurationVTXLowPowerDisarmValue_2": {\r
        "message": "До першого взведення"\r
    },\r
    "configurationGimbal": {\r
        "message": "Послідовний підвіс"\r
    },\r
    "configurationGimbalSensitivity": {\r
        "message": "Чутливість підвісу"\r
    },\r
    "configurationGimbalPanChannel": {\r
        "message": "Канал панорамування (рискання)"\r
    },\r
    "configurationGimbalTiltChannel": {\r
        "message": "Канал нахилу (тангаж)"\r
    },\r
    "configurationGimbalRollChannel": {\r
        "message": "Канал крена"\r
    },\r
    "configurationHeadtracker": {\r
        "message": "Трекер голови"\r
    },\r
    "configurationHeadtrackerType": {\r
        "message": "Тип трекера голови"\r
    },\r
    "configurationHeadtrackerPanRatio": {\r
        "message": "Коефіцієнт руху панорамного трекера голови"\r
    },\r
    "configurationHeadtrackerTiltRatio": {\r
        "message": "Коефіцієнт руху нахилу трекера голови"\r
    },\r
    "configurationHeadtrackerRollRatio": {\r
        "message": "Коефіцієнт руху крену трекера голови"\r
    },\r
    "portsHelp": {\r
        "message": "<strong>Примітка:</strong> не всі комбінації є допустимими. Коли прошивка польотного контролера виявляє це, конфігурація послідовного порту буде скинута."\r
    },\r
    "portsFirmwareUpgradeRequired": {\r
        "message": "<span style=\\"color: red\\">Потрібне</span> оновлення прошивки."\r
    },\r
    "portsButtonSave": {\r
        "message": "Зберегти й перезавантажити"\r
    },\r
    "portsTelemetryDisabled": {\r
        "message": "Вимкнено"\r
    },\r
    "portsFunction_MSP": {\r
        "message": "MSP"\r
    },\r
    "portsFunction_GPS": {\r
        "message": "GPS"\r
    },\r
    "portsFunction_RANGEFINDER": {\r
        "message": "<p>Далекомір</p>"\r
    },\r
    "portsFunction_OPFLOW": {\r
        "message": "Оптичний потік"\r
    },\r
    "portsFunction_ESC": {\r
        "message": "Вихід/телеметрія ESC"\r
    },\r
    "portsFunction_TELEMETRY_FRSKY": {\r
        "message": "FrSky"\r
    },\r
    "portsFunction_TELEMETRY_HOTT": {\r
        "message": "HoTT"\r
    },\r
    "portsFunction_TELEMETRY_LTM": {\r
        "message": "LTM"\r
    },\r
    "portsFunction_TELEMETRY_MAVLINK": {\r
        "message": "MAVLink"\r
    },\r
    "portsFunction_TELEMETRY_IBUS": {\r
        "message": "IBUS"\r
    },\r
    "portsFunction_GSM_SMS": {\r
        "message": "GSM SMS"\r
    },\r
    "portsFunction_TELEMETRY_MSP": {\r
        "message": "MSP"\r
    },\r
    "portsFunction_TELEMETRY_SMARTPORT": {\r
        "message": "SmartPort"\r
    },\r
    "portsFunction_SMARTPORT_MASTER": {\r
        "message": "SmartPort Master"\r
    },\r
    "portsFunction_RX_SERIAL": {\r
        "message": "Серійний приймач"\r
    },\r
    "portsFunction_BLACKBOX": {\r
        "message": "Чорна скриня"\r
    },\r
    "portsFunction_RUNCAM_DEVICE_CONTROL": {\r
        "message": "Пристрій RunCam"\r
    },\r
    "portsFunction_TBS_SMARTAUDIO": {\r
        "message": "TBS SmartAudio"\r
    },\r
    "portsFunction_IRC_TRAMP": {\r
        "message": "IRC Трамп"\r
    },\r
    "portsFunction_VTX_FFPV": {\r
        "message": "FuriousFPV Vtx"\r
    },\r
    "portsFunction_FRSKY_OSD": {\r
        "message": "FrSky OSD"\r
    },\r
    "portsFunction_DJI_FPV": {\r
        "message": "DJI FPV VTX"\r
    },\r
    "portsFunction_MSP_DISPLAYPORT": {\r
        "message": "Дисплейний Порт MSP"\r
    },\r
    "portsFunction_SBUS_OUTPUT": {\r
        "message": "Вихід SBus"\r
    },\r
    "portsFunction_GIMBAL": {\r
        "message": "Послідовний підвіс"\r
    },\r
    "portsFunction_HEADTRACKER": {\r
        "message": "Послідовний трекер голови"\r
    },\r
    "pidTuning_Other": {\r
        "message": "Інше"\r
    },\r
    "pidTuning_Limits": {\r
        "message": "Обмеження"\r
    },\r
    "pidTuning_HeadingHold_Rate": {\r
        "message": "Показник утримання курсу (°/с)"\r
    },\r
    "pidTuning_Max_Inclination_Angle": {\r
        "message": "Макс. кут нахилу"\r
    },\r
    "pidTuning_Max_Roll": {\r
        "message": "Крен (°/10)"\r
    },\r
    "pidTuning_Max_Pitch": {\r
        "message": "Тангаж (°/10)"\r
    },\r
    "pidTuning_ShowAllPIDs": {\r
        "message": "Показати всі ПІД"\r
    },\r
    "pidTuning_PIDmain": {\r
        "message": "Головні коефіцієнти ПІД"\r
    },\r
    "pidTuning_PIDother": {\r
        "message": "Додаткові коефіцієнти ПІД"\r
    },\r
    "pidTuning_SelectNewDefaults": {\r
        "message": "Вибрати нові значення за замовчуванням"\r
    },\r
    "pidTuning_ResetPIDController": {\r
        "message": "Скинути ПІД регулятор"\r
    },\r
    "pidTuning_PIDgains": {\r
        "message": "Коефіцієнти ПІД"\r
    },\r
    "pidTuning_Name": {\r
        "message": "Назва"\r
    },\r
    "pidTuning_Proportional": {\r
        "message": "Пропорційна"\r
    },\r
    "pidTuning_Integral": {\r
        "message": "Інтегральна"\r
    },\r
    "pidTuning_Derivative": {\r
        "message": "Диференціальна"\r
    },\r
    "pidTuning_FeedForward": {\r
        "message": "Упередження"\r
    },\r
    "pidTuning_ControlDerivative": {\r
        "message": "Контроль Д"\r
    },\r
    "pidTuning_Basic": {\r
        "message": "Базові/Акро"\r
    },\r
    "pidTuning_Level": {\r
        "message": "Кут/Горизонт"\r
    },\r
    "pidTuning_Altitude": {\r
        "message": "Висота з барометра та сонара"\r
    },\r
    "pidTuning_Mag": {\r
        "message": "Компас/Курс"\r
    },\r
    "pidTuning_GPS": {\r
        "message": "Навігація GPS"\r
    },\r
    "pidTuning_LevelP": {\r
        "message": "Рівень"\r
    },\r
    "pidTuning_LevelI": {\r
        "message": "Частота відсікання ФНЧ (Гц)"\r
    },\r
    "pidTuning_LevelD": {\r
        "message": "Перехід (Горизонт)"\r
    },\r
    "pidTuning_LevelHelp": {\r
        "message": "Значення нижче змінюють поведінку режимів польоту ANGLE та HORIZON. Різні ПІД регулятори обробляють значення рівня по-різному. Будь ласка, перевірте документацію."\r
    },\r
    "pidTuning_RatesAndExpo": {\r
        "message": "Швидкості та експоненційність"\r
    },\r
    "pidTuning_Rates_Stabilized": {\r
        "message": "Стабілізовані швидкості"\r
    },\r
    "pidTuning_Rates_Roll": {\r
        "message": "Крен (°/с)"\r
    },\r
    "pidTuning_Rates_Pitch": {\r
        "message": "Тангаж (°/с)"\r
    },\r
    "pidTuning_Rates_Yaw": {\r
        "message": "Рискання (°/с)"\r
    },\r
    "pidTuning_Expo_Stabilized": {\r
        "message": "Стабілізована експоненційність"\r
    },\r
    "pidTuning_Expo_Manual": {\r
        "message": "Ручна експоненційність"\r
    },\r
    "pidTuning_Expo_RollPitch": {\r
        "message": "Регулювання крену та тангажа (%)"\r
    },\r
    "pidTuning_Expo_Yaw": {\r
        "message": "Рискання (%)"\r
    },\r
    "pidTuning_RateDynamics": {\r
        "message": "Динаміка швидкостей"\r
    },\r
    "pidTuning_RateDynamics_Sensitivity": {\r
        "message": "Чутливість"\r
    },\r
    "pidTuning_RateDynamics_Correction": {\r
        "message": "Корекція"\r
    },\r
    "pidTuning_RateDynamics_Weight": {\r
        "message": "Вага"\r
    },\r
    "pidTuning_RateDynamics_Center": {\r
        "message": "Центр"\r
    },\r
    "pidTuning_RateDynamics_End": {\r
        "message": "Кінець"\r
    },\r
    "pidTuning_RollPitchRate": {\r
        "message": "Швидкість крену та тангажа"\r
    },\r
    "pidTuning_RollRate": {\r
        "message": "Швидкість крену"\r
    },\r
    "pidTuning_PitchRate": {\r
        "message": "Швидкість тангажа"\r
    },\r
    "pidTuning_YawRate": {\r
        "message": "Швидкість рискання"\r
    },\r
    "pidTuning_RollAndPitchExpo": {\r
        "message": "Експоненційність крену та тангажа"\r
    },\r
    "pidTuning_YawExpo": {\r
        "message": "Експоненційність рискання"\r
    },\r
    "pidTuning_MaxRollAngle": {\r
        "message": "Макс. кут КРЕНУ"\r
    },\r
    "pidTuning_MaxRollAngleHelp": {\r
        "message": "Максимальний кут КРЕНУ в режимі ANGLE. Це також обмежує максимальний нахил у режимах навігації."\r
    },\r
    "pidTuning_MaxPitchAngle": {\r
        "message": "Макс. кут ТАНГАЖА"\r
    },\r
    "pidTuning_MaxPitchAngleHelp": {\r
        "message": "Максимальний кут ТАНГАЖА в режимі ANGLE. Це також обмежує максимальний підйом і спуск в режимах навігації."\r
    },\r
    "pidTuning_ManualRollRate": {\r
        "message": "Ручна швидкість крену"\r
    },\r
    "pidTuning_ManualPitchRate": {\r
        "message": "Ручний коефіцієнт тангажа"\r
    },\r
    "pidTuning_ManualYawRate": {\r
        "message": "Ручна швидкість рискання"\r
    },\r
    "pidTuning_magHoldYawRate": {\r
        "message": "Обмеження швидкості утримання курсу"\r
    },\r
    "pidTuning_MagHoldYawRateHelp": {\r
        "message": "Максимальна швидкість обертання рискання, яку контролер MagHold може запросити у БПЛА. Використовується лише в режимі MagHold, під час повернення до дому (RTH) і навігації за маршрутними точками (WAYPOINT). Значення нижче 30 градусів в секунду забезпечують плавні кінематографічні повороти"\r
    },\r
    "pidTuning_Filters": {\r
        "message": "Фільтри"\r
    },\r
    "pidTuning_mainFilters": {\r
        "message": "Фільтри гіроскопа"\r
    },\r
    "pidTuning_advancedFilters": {\r
        "message": "Розширені фільтри гіроскопа"\r
    },\r
    "pidTuning_gyro_main_lpf_hz": {\r
        "message": "Основна частота зрізу фільтра гіроскопа"\r
    },\r
    "pidTuning_gyro_main_lpf_hz_help": {\r
        "message": "Вищі значення забезпечують меншу затримку, але більше шуму. Нижчі значення забезпечують менше шуму, але більшу затримку при обробці гіроскопа"\r
    },\r
    "pidTuning_MatrixFilterMinFrequency": {\r
        "message": "Мінімальна частота матричного фільтра"\r
    },\r
    "pidTuning_MatrixFilterMinFrequencyHelp": {\r
        "message": "Мінімальна частота для матричного фільтра. Значення повинно залежати від розміру пропелера. 150 Гц добре працює з 5&quot; і менше. Для 7&quot; і більше знижуйте ще нижче 100 Гц."\r
    },\r
    "pidTuning_MatrixFilterQFactor": {\r
        "message": "Добротність матричного фільтра"\r
    },\r
    "pidTuning_MatrixFilterQFactorHelp": {\r
        "message": "Чим вище значення, тим вища селективність матричного фільтра. Рекомендуються значення між 150 та 300."\r
    },\r
    "pidTuning_UnicornFilterQFactor": {\r
        "message": "Добротність фільтра Єдинорога"\r
    },\r
    "pidTuning_dtermFilters": {\r
        "message": "Фільтри Д-складової"\r
    },\r
    "pidTuning_dtermLpfCutoffFrequency": {\r
        "message": "Частота зрізу ФНЧ Д-складової"\r
    },\r
    "pidTuning_dtermLpfCutoffFrequencyHelp": {\r
        "message": "Низькочастотний фільтр для Д-складової для всіх ПІД-регуляторів"\r
    },\r
    "pidTuning_rpmFilters": {\r
        "message": "Фільтри гіроскопа з урахуванням об/хв моторів"\r
    },\r
    "pidTuning_rpm_gyro_filter_enabled": {\r
        "message": "RPM фільтр гіроскопа (потребує телеметрії ESC)"\r
    },\r
    "pidTuning_rpm_gyro_min_hz": {\r
        "message": "Мін. частота RPM фільтра гіроскопа"\r
    },\r
    "pidTuning_Mechanics": {\r
        "message": "Механіка"\r
    },\r
    "pidTuning_ITermMechanics": {\r
        "message": "Механіка I-складової"\r
    },\r
    "pidTuning_itermRelaxCutoff": {\r
        "message": "Частота зрізу послаблення І-складової"\r
    },\r
    "pidTuning_itermRelaxCutoffHelp": {\r
        "message": "Нижчі значення відкривають довше часове вікно для роботи послаблення І-складової і сильніше придушення І-складової. Вищі значення скорочують вікно часу та зменшують придушення."\r
    },\r
    "pidTuning_antigravityGain": {\r
        "message": "Підсилення антигравітації"\r
    },\r
    "pidTuning_antigravityAccelerator": {\r
        "message": "Акселератор антигравітації"\r
    },\r
    "pidTuning_antigravityCutoff": {\r
        "message": "Частота відсікання антигравітації"\r
    },\r
    "pidTuning_itermBankAngleFreeze": {\r
        "message": "Заморожування I-складової рискання при розворотах з креном"\r
    },\r
    "pidTuning_itermBankAngleFreezeHelp": {\r
        "message": "Заморозка І-компоненти рискання при нахилі планера більше, ніж на цей кут у градусах. Це допомагає запобігти ситуації, коли кермо чинить супротив повороту. Значення 0 вимикає цю функцію. Застосовується тільки для літаків з нерухомим крилом."\r
    },\r
    "pidTuning_dTermMechanics": {\r
        "message": "Механіка Д-складової"\r
    },\r
    "pidTuning_d_boost_min": {\r
        "message": "Мін. масштаб послаблення Д"\r
    },\r
    "pidTuning_d_boost_min_help": {\r
        "message": "Визначає максимальне допустиме послаблення Д-складової під час фази прискорення руху стіків. Значення 1.0 означає, що Д-складова не послаблюється. 0.5 означає, що дозволено зменшити до половини. Нижчі значення призводять до швидшої реакції під час швидкого руху стіків."\r
    },\r
    "pidTuning_d_boost_max": {\r
        "message": "Макс. масштаб підвищення Д"\r
    },\r
    "pidTuning_d_boost_max_help": {\r
        "message": "Визначає максимальне підвищення Д-складової при досягненні максимальної кутової швидкості. Значення 1.0 означає, що приріст Д-складової вимкнено, 2.0 означає, що Д-складова може збільшуватись на 100%. Значення між 1.5 та 1.7 зазвичай є оптимальними."\r
    },\r
    "pidTuning_d_boost_max_at_acceleration": {\r
        "message": "Макс. підвищення Д-складової при прискоренні [dps^2]"\r
    },\r
    "pidTuning_d_boost_max_at_acceleration_help": {\r
        "message": "Підвищення Д-складової повністю активне, коли кутове прискорення (виявлене гіроскопом або за заданою частотою) досягає певного значення прискорення. Між 0 і цим значенням коефіцієнт приросту Д-складової масштабується лінійно."\r
    },\r
    "pidTuning_d_boost_gyro_delta_lpf_hz": {\r
        "message": "Фільтр НЧ гіроскопа підвищення Д-складової"\r
    },\r
    "pidTuning_d_boost_gyro_delta_lpf_hz_help": {\r
        "message": "Слід встановити на частоту осциляцій при реакції самотурбулентність (prop wash). 5-дюймові квадрокоптери працюють найкраще при частоті близько 80Гц, 7-дюймові квадрокоптери – близько 50Гц"\r
    },\r
    "pidTuning_tpaMechanics": {\r
        "message": "Послаблення ПІД в залежності від тяги"\r
    },\r
    "pidTuning_TPA": {\r
        "message": "Послаблення ПІД в залежності від тяги (TPA)"\r
    },\r
    "pidTuning_TPABreakPoint": {\r
        "message": "TPA точка перегину"\r
    },\r
    "pidTuning_FW_TPATimeConstant": {\r
        "message": "Константа часу TPA для літака"\r
    },\r
    "pidTuning_FW_TPATimeConstantHelp": {\r
        "message": "Згладжування TPA і постійна часу затримки для відображення не миттєвої реакції літака на швидкість/тягу."\r
    },\r
    "pidTuning_fwLevelTrimMechanics": {\r
        "message": "Механіка фіксованого крила"\r
    },\r
    "pidTuning_fw_level_pitch_trim": {\r
        "message": "Регулювання рівня [°]"\r
    },\r
    "pidTuning_fw_level_pitch_trim_help": {\r
        "message": "Тример тангажу для режимів польоту з самовирівнюванням. У градусах. +5 означає, що ніс літака має бути піднятий на 5° від горизонтального рівня"\r
    },\r
    "pidTuning_ButtonSave": {\r
        "message": "Зберегти"\r
    },\r
    "pidTuning_ButtonRefresh": {\r
        "message": "Оновити"\r
    },\r
    "pidTuning_ProfileHead": {\r
        "message": "Профіль"\r
    },\r
    "pidTuning_LoadedProfile": {\r
        "message": "Завантажено профіль:  <strong style=\\"color: #37a8db\\">$1</strong>"\r
    },\r
    "pidTuning_Manual_Rates": {\r
        "message": "Ручне налаштування швидкостей"\r
    },\r
    "pidTuning_Manual_Roll": {\r
        "message": "Крен (%)"\r
    },\r
    "pidTuning_Manual_Pitch": {\r
        "message": "Тангаж (%)"\r
    },\r
    "pidTuning_Manual_Yaw": {\r
        "message": "Рискання (%)"\r
    },\r
    "pidTuning_gyro_dyn_lpf_min_hz": {\r
        "message": "Динамічний ФНЧ гіроскопа, мін. частота зрізу"\r
    },\r
    "pidTuning_gyro_dyn_lpf_max_hz": {\r
        "message": "Динамічний ФНЧ гіроскопа, макс. частота зрізу"\r
    },\r
    "pidTuning_gyro_dyn_lpf_curve_expo": {\r
        "message": "Експоненційність кривої динамічного ФНЧ гіроскопа"\r
    },\r
    "pidTuning_gyro_dyn_lpf_min_hz_help": {\r
        "message": "Визначає частоту зрізу фільтру низьких частот гіроскопа на мінімальній тязі. При збільшенні тяги, частота зрізу НЧФ також збільшується до максимальної частоти зрізу."\r
    },\r
    "pidTuning_gyro_dyn_lpf_max_hz_help": {\r
        "message": "Визначає частоту зрізу динамічного фільтра низьких частот при максимальній тязі. При зниженні тяги, частота зрізу фільтра низьких частот також знижується до мінімальної частоти зрізу."\r
    },\r
    "loadedMixerProfile": {\r
        "message": "Завантажений профіль мікшера: <strong style=\\"color: #37a8db\\">$1</strong>, Перевірте вкладку режими: ПРОФІЛЬ ЗМІШУВАННЯ 2, якщо не бачите змін"\r
    },\r
    "loadedBatteryProfile": {\r
        "message": "Завантажений профіль акумулятора: <strong style=\\"color: #37a8db\\">$1</strong>"\r
    },\r
    "setControlProfile": {\r
        "message": "Встановити профіль керування: <strong style=\\"color: #37a8db\\">$1</strong>"\r
    },\r
    "setMixerProfile": {\r
        "message": "Встановлення профілю мікшера: <strong style=\\"color: #37a8db\\">$1</strong>"\r
    },\r
    "setBatteryProfile": {\r
        "message": "Встановлення профілю батареї: <strong style=\\"color: #37a8db\\">$1</strong>"\r
    },\r
    "pidTuningDataRefreshed": {\r
        "message": "Дані ПІД <strong>оновлено</strong>"\r
    },\r
    "pidTuningEepromSaved": {\r
        "message": "EEPROM <span style=\\"color: #37a8db\\">saved</span>: Налаштування ПІД"\r
    },\r
    "receiverHelp": {\r
        "message": "Будь ласка, прочитайте розділ документації про приймач.  Налаштуйте послідовний порт (якщо потрібно), режим приймача (serial/ppm/pwm), постачальника (для послідовних приймачів), прив'яжіть приймач, задайте карту каналів, налаштуйте кінцеві точки/діапазон каналів на передавачі таким чином, щоб усі канали проходили від ~1000 до ~2000.  Встановіть середню точку (за замовчуванням - 1500), налаштуйте тріми на 1500, налаштуйте зону нечутливості стіків, перевірте поведінку, коли передавач вимкнено або поза діапазоном. Переконайтеся, що значення каналів зростають, коли ви натискаєте стіки вгору і вправо. Якщо ні, змініть напрямок каналу в передавачі. Не застосовуйте інше змішування в передавачі.<br /><span style=\\"color: red\\">ВАЖЛИВО:</span> Перед польотом прочитайте розділ документації про безаварійність та налаштуйте безаварійність."\r
    },\r
    "receiverThrottleMid": {\r
        "message": "Середня точка тяги"\r
    },\r
    "receiverThrottleExpo": {\r
        "message": "Експоненційність тяги"\r
    },\r
    "receiverRcRate": {\r
        "message": "RC коефіцієнт"\r
    },\r
    "receiverDeadband": {\r
        "message": "Мертва зона пульта"\r
    },\r
    "receiverHelpDeadband": {\r
        "message": "Ці значення (у мкс) показують, наскільки мають відрізнятись вхідні дані від пульта, перш ніж вони будуть вважатись дійсними. Для передавачів з джитером на виходах це значення можна збільшити, якщо вхідні сигнали тремтять/посмикуються без рухів стіками."\r
    },\r
    "receiverHelpYawDeadband": {\r
        "message": "Ці значення (у мікросекундах) показують, наскільки можуть відрізнятись сигнали від пульта, перш ніж вони будуть вважатись дійсними. Для передавачів з джитером на виходах це значення можна збільшити, якщо вхідні сигнали від пульта смикаються без рухів стіками. <strong>Це налаштування стосується тільки руху за віссю рискання.</strong>"\r
    },\r
    "receiverYawDeadband": {\r
        "message": "Мертва зона рискання"\r
    },\r
    "receiverRcExpo": {\r
        "message": "RC Експонента"\r
    },\r
    "receiverRcYawExpo": {\r
        "message": "RC Експоненційність рискання"\r
    },\r
    "receiverManualRcExpo": {\r
        "message": "Ручне налаштування експоненційності RC"\r
    },\r
    "receiverManualRcYawExpo": {\r
        "message": "Ручна експоненційність рискання"\r
    },\r
    "receiverChannelMap": {\r
        "message": "Схема каналів"\r
    },\r
    "receiverChannelMapTitle": {\r
        "message": "Ви можете визначити власну схему каналів, натиснувши в цьому полі"\r
    },\r
    "receiverRssiChannel": {\r
        "message": "Канал RSSI"\r
    },\r
    "receiverRssiSource": {\r
        "message": "Джерело RSSI"\r
    },\r
    "receiverRefreshRateTitle": {\r
        "message": "Частота оновлення графіків"\r
    },\r
    "receiverButtonSave": {\r
        "message": "Зберегти"\r
    },\r
    "receiverButtonRefresh": {\r
        "message": "Оновити"\r
    },\r
    "receiverButtonSticks": {\r
        "message": "Стіки керування"\r
    },\r
    "receiverDataRefreshed": {\r
        "message": "Дані для тюнінгу пульта <strong>оновлено</strong>"\r
    },\r
    "receiverEepromSaved": {\r
        "message": "EEPROM <span style=\\"color: #37a8db\\">збережено</span>: Приймач"\r
    },\r
    "auxiliaryHelp": {\r
        "message": "Використовуйте діапазони для визначення перемикачів на вашому передавачі та відповідних призначень режимів. Канал приймача, що дає показання у межах мінімального/максимального діапазону, активує режим. Не забудьте зберегти ваші налаштування, використовуючи кнопку Зберегти."\r
    },\r
    "auxiliaryToggleUnused": {\r
        "message": "Сховати невикористані режими"\r
    },\r
    "auxiliaryMin": {\r
        "message": "Мін."\r
    },\r
    "auxiliaryMax": {\r
        "message": "Макс."\r
    },\r
    "auxiliaryAddRange": {\r
        "message": "Додати діапазон"\r
    },\r
    "auxiliaryAutoChannelSelect": {\r
        "message": "АВТО"\r
    },\r
    "auxiliaryButtonSave": {\r
        "message": "Зберегти"\r
    },\r
    "auxiliaryEepromSaved": {\r
        "message": "EEPROM <span style=\\"color: #37a8db\\">збережено</span>"\r
    },\r
    "eepromSaved": {\r
        "message": "EEPROM <span style=\\"color: #37a8db\\">збережено</span>"\r
    },\r
    "adjustmentsHelp": {\r
        "message": "Конфігуруйте перемикачі регулювання. Див. розділ «регулювання під час польоту» у посібнику для деталей. Зміни, які вносять функції регулювання, не зберігаються автоматично. Є 4 слоти. Кожен перемикач, що використовується для одночасного внесення змін, потребує виключного використання слота."\r
    },\r
    "adjustmentsExamples": {\r
        "message": "Приклади"\r
    },\r
    "adjustmentsExample1": {\r
        "message": "Використовуйте слот 1 та 3-позиційний перемикач на каналі CH5 для вибору між регулюванням П, І і Д тангажа/крену та інший 3-позиційний перемикач на каналі CH6 для збільшення або зменшення значення при утриманні в верхньому чи нижньому положенні."\r
    },\r
    "adjustmentsExample2": {\r
        "message": "Використовуйте слот 2 і 3-позиційний перемикач на CH8 для увімкнення Вибору профілю швидкостей через той самий 3-позиційний перемикач на тому ж каналі."\r
    },\r
    "adjustmentsColumnEnable": {\r
        "message": "Якщо увімкнено"\r
    },\r
    "adjustmentsColumnUsingSlot": {\r
        "message": "використовуючи слот"\r
    },\r
    "adjustmentsColumnWhenChannel": {\r
        "message": "коли канал"\r
    },\r
    "adjustmentsColumnIsInRange": {\r
        "message": "є в діапазоні"\r
    },\r
    "adjustmentsColumnThenApplyFunction": {\r
        "message": "значить застосуй"\r
    },\r
    "adjustmentsColumnViaChannel": {\r
        "message": "через канал"\r
    },\r
    "adjustmentsSlot0": {\r
        "message": "Слот 1"\r
    },\r
    "adjustmentsSlot1": {\r
        "message": "Слот 2"\r
    },\r
    "adjustmentsSlot2": {\r
        "message": "Слот 3"\r
    },\r
    "adjustmentsSlot3": {\r
        "message": "Слот 4"\r
    },\r
    "adjustmentsMin": {\r
        "message": "Мін."\r
    },\r
    "adjustmentsMax": {\r
        "message": "Макс."\r
    },\r
    "adjustmentsGroupRates": {\r
        "message": "Швидкості та експоненційність"\r
    },\r
    "adjustmentsGroupPIDTuning": {\r
        "message": "Налаштування ПІД"\r
    },\r
    "adjustmentsGroupNavigationFlight": {\r
        "message": "Навігація та політ"\r
    },\r
    "adjustmentsGroupMisc": {\r
        "message": "Різне"\r
    },\r
    "adjustmentsFunction0": {\r
        "message": "Без змін"\r
    },\r
    "adjustmentsFunction1": {\r
        "message": "Корекція коефіцієнтів RC"\r
    },\r
    "adjustmentsFunction2": {\r
        "message": "Корекція експоненційності"\r
    },\r
    "adjustmentsFunction3": {\r
        "message": "Корекція експоненційності тяги"\r
    },\r
    "adjustmentsFunction4": {\r
        "message": "Корекція коефіцієнтів тангажа та крену"\r
    },\r
    "adjustmentsFunction5": {\r
        "message": "Корекція швидкості рискання"\r
    },\r
    "adjustmentsFunction6": {\r
        "message": "Корекція P тангажа та крену"\r
    },\r
    "adjustmentsFunction7": {\r
        "message": "Корекція І тангажа та крену"\r
    },\r
    "adjustmentsFunction8": {\r
        "message": "Тангаж & Крен Д"\r
    },\r
    "adjustmentsFunction9": {\r
        "message": "Корекція ПК/Упер. тангажа та крену"\r
    },\r
    "adjustmentsFunction10": {\r
        "message": "Корекція П тангажа"\r
    },\r
    "adjustmentsFunction11": {\r
        "message": "Корекція I тангажу"\r
    },\r
    "adjustmentsFunction12": {\r
        "message": "Корекція Д тангажа"\r
    },\r
    "adjustmentsFunction13": {\r
        "message": "Корекція ПК/Упер. тангажу"\r
    },\r
    "adjustmentsFunction14": {\r
        "message": "Корекція П крену"\r
    },\r
    "adjustmentsFunction15": {\r
        "message": "Корекція І крену"\r
    },\r
    "adjustmentsFunction16": {\r
        "message": "Корекція Д крену"\r
    },\r
    "adjustmentsFunction17": {\r
        "message": "Корекція ПК/Упер. крена"\r
    },\r
    "adjustmentsFunction18": {\r
        "message": "Корекція П рискання"\r
    },\r
    "adjustmentsFunction19": {\r
        "message": "Корекція I рискання"\r
    },\r
    "adjustmentsFunction20": {\r
        "message": "Коригування Д рискання"\r
    },\r
    "adjustmentsFunction21": {\r
        "message": "Коригування Д/Уп рискання"\r
    },\r
    "adjustmentsFunction22": {\r
        "message": "Вибір профілю швидкостей"\r
    },\r
    "adjustmentsFunction23": {\r
        "message": "Швидкість тангажа"\r
    },\r
    "adjustmentsFunction24": {\r
        "message": "Швидкість крену"\r
    },\r
    "adjustmentsFunction25": {\r
        "message": "Корекція експоненційності команд рискання"\r
    },\r
    "adjustmentsFunction26": {\r
        "message": "Ручка корекція експоненційності команд пульта"\r
    },\r
    "adjustmentsFunction27": {\r
        "message": "Ручка корекція експоненційності команд рискання"\r
    },\r
    "adjustmentsFunction28": {\r
        "message": "Ручне регулювання швидкостей тангажа та крену"\r
    },\r
    "adjustmentsFunction29": {\r
        "message": "Ручне регулювання швидкості крену"\r
    },\r
    "adjustmentsFunction30": {\r
        "message": "Ручне регулювання швидкості тангажа"\r
    },\r
    "adjustmentsFunction31": {\r
        "message": "Ручне регулювання швидкості рискання"\r
    },\r
    "adjustmentsFunction32": {\r
        "message": "Корекція тяги круїзу в режимі Навігація FW"\r
    },\r
    "adjustmentsFunction33": {\r
        "message": "Навігація FW Коригування тангажу до тяги"\r
    },\r
    "adjustmentsFunction34": {\r
        "message": "Корекція вирівнювання плати за креном"\r
    },\r
    "adjustmentsFunction35": {\r
        "message": "Корекція вирівнювання плати за тангажем"\r
    },\r
    "adjustmentsFunction36": {\r
        "message": "Корекція рівня П"\r
    },\r
    "adjustmentsFunction37": {\r
        "message": "Корекція рівня І"\r
    },\r
    "adjustmentsFunction38": {\r
        "message": "Корекція рівня Д"\r
    },\r
    "adjustmentsFunction39": {\r
        "message": "Корекція П положення XY"\r
    },\r
    "adjustmentsFunction40": {\r
        "message": "Корекція І положення XY"\r
    },\r
    "adjustmentsFunction41": {\r
        "message": "Корекція Д положення XY"\r
    },\r
    "adjustmentsFunction42": {\r
        "message": "Корекція П положення Z"\r
    },\r
    "adjustmentsFunction43": {\r
        "message": "Корекція І положення Z"\r
    },\r
    "adjustmentsFunction44": {\r
        "message": "Корекція Д положення Z"\r
    },\r
    "adjustmentsFunction45": {\r
        "message": "Корекція П курсу"\r
    },\r
    "adjustmentsFunction46": {\r
        "message": "Корекція П швидкості XY"\r
    },\r
    "adjustmentsFunction47": {\r
        "message": "Корекція І швидкості XY"\r
    },\r
    "adjustmentsFunction48": {\r
        "message": "Корекція Д швидкості XY"\r
    },\r
    "adjustmentsFunction49": {\r
        "message": "Корекція П швидкості Z"\r
    },\r
    "adjustmentsFunction50": {\r
        "message": "Корекція І швидкості Z"\r
    },\r
    "adjustmentsFunction51": {\r
        "message": "Корекція Д швидкості Z"\r
    },\r
    "adjustmentsFunction52": {\r
        "message": "Коригування кута тангажа вниз при мін. тязі FW"\r
    },\r
    "adjustmentsFunction53": {\r
        "message": "Регулювання рівня потужності VTX"\r
    },\r
    "adjustmentsFunction54": {\r
        "message": "Регулювання послаблення ПІД від тяги (TPA)"\r
    },\r
    "adjustmentsFunction55": {\r
        "message": "Коригування точки перегину TPA"\r
    },\r
    "adjustmentsFunction56": {\r
        "message": "Корекція плавності керування"\r
    },\r
    "adjustmentsFunction57": {\r
        "message": "Константа часу TPA для нерухомого крила"\r
    },\r
    "adjustmentsFunction58": {\r
        "message": "Нерухоме крило: корекція рівня"\r
    },\r
    "adjustmentsFunction59": {\r
        "message": "Коригування індексу мультимісії"\r
    },\r
    "adjustmentsFunction60": {\r
        "message": "Коригування відгуку контролю висоти для нерухомого крила"\r
    },\r
    "adjustmentsSave": {\r
        "message": "Зберегти"\r
    },\r
    "adjustmentsEepromSaved": {\r
        "message": "EEPROM <span style=\\"color: #37a8db\\">збережено</span>: Коригування"\r
    },\r
    "programmingEepromSaved": {\r
        "message": "EEPROM <span style=\\"color: #37a8db\\">збережено</span>: Програмування"\r
    },\r
    "servosChangeDirection": {\r
        "message": "Змініть напрямок у TX для збігу"\r
    },\r
    "servosName": {\r
        "message": "Назва"\r
    },\r
    "servosMid": {\r
        "message": "Сер."\r
    },\r
    "servosMin": {\r
        "message": "Мін."\r
    },\r
    "servosMax": {\r
        "message": "Макс."\r
    },\r
    "servosReverse": {\r
        "message": "Зворотний"\r
    },\r
    "servoOutput": {\r
        "message": "Вихід"\r
    },\r
    "servosRate": {\r
        "message": "Швидкість (%)"\r
    },\r
    "servosLiveMode": {\r
        "message": "Включити \\"живий режим\\""\r
    },\r
    "servosButtonSave": {\r
        "message": "Зберегти"\r
    },\r
    "servosNormal": {\r
        "message": "Нормальний"\r
    },\r
    "servoEmptyTableInfo": {\r
        "message": "Жоден сервопривід не налаштовано. Додайте їх за допомогою вкладки Мікшер."\r
    },\r
    "servosEepromSave": {\r
        "message": "EEPROM <span style=\\"color: #37a8db\\">збережено</span>"\r
    },\r
    "mixerSaved": {\r
        "message": "Мікшер <span style=\\"color: #37a8db\\">збережено</span>"\r
    },\r
    "mixerWizard": {\r
        "message": "Майстер мікшера моторів"\r
    },\r
    "mixerWizardInfo": {\r
        "message": "<ol><li>Зніміть пропелери</li><li>Підключіть батарею і використовуйте вкладку Виводи для тестування всіх моторів</li><li>Занотуйте положення кожного мотора (мотор №1 - верхній лівий і так далі)</li><li>Заповніть таблицю нижче</li></ol>"\r
    },\r
    "gpsHead": {\r
        "message": "Позиція"\r
    },\r
    "gpsStatHead": {\r
        "message": "Статистика"\r
    },\r
    "gpsMapHead": {\r
        "message": "Поточне розташування за GPS"\r
    },\r
    "gpsMapMessage1": {\r
        "message": "Перевірте інтернет-з'єднання"\r
    },\r
    "gpsMapMessage2": {\r
        "message": "Очікуємо 3D координати GPS…"\r
    },\r
    "gpsFix": {\r
        "message": "Тип місцезнаходження:"\r
    },\r
    "gpsFix2D": {\r
        "message": "<span class=\\"fix2d\\">2D</span>"\r
    },\r
    "gpsFix3D": {\r
        "message": "<span class=\\"fix3d\\">3D</span>"\r
    },\r
    "gpsFixNone": {\r
        "message": "<span class=\\"fixnone\\">Немає</span>"\r
    },\r
    "gpsAltitude": {\r
        "message": "Висота:"\r
    },\r
    "gpsLat": {\r
        "message": "Широта:"\r
    },\r
    "gpsLon": {\r
        "message": "Довгота:"\r
    },\r
    "gpsSpeed": {\r
        "message": "Швидкість:"\r
    },\r
    "gpsSats": {\r
        "message": "Супутники:"\r
    },\r
    "gpsDistToHome": {\r
        "message": "Відс. до точки зльоту:"\r
    },\r
    "gpsHDOP": {\r
        "message": "Горизонтальне погіршення точності:"\r
    },\r
    "gpsTotalMessages": {\r
        "message": "Загальна кількість повідомлень:"\r
    },\r
    "gpsMessageRate": {\r
        "message": "Частота оновлення:"\r
    },\r
    "gpsErrors": {\r
        "message": "Помилки:"\r
    },\r
    "gpsTimeouts": {\r
        "message": "Тайм-аути:"\r
    },\r
    "gpsEPH": {\r
        "message": "Оцінка похибки в горизонтальній площині:"\r
    },\r
    "gpsEPV": {\r
        "message": "Оцінка похибки у вертикальній площині:"\r
    },\r
    "gpsSignalStr": {\r
        "message": "Рівень сигналу"\r
    },\r
    "gpsPort": {\r
        "message": "Послідовний порт"\r
    },\r
    "gpsBaud": {\r
        "message": "Швидкість передачі"\r
    },\r
    "magnetometerHead": {\r
        "message": "Інструмент вирівнювання"\r
    },\r
    "magnetometerHelp": {\r
        "message": "1. Відрегулюйте орієнтацію польотного контролера, щоб вона відповідала фізичній орієнтації на літальному апараті <u>відповідно до стрілки напрямку на польотному контролері</u>.<br/>2. Відрегулюйте модель магнітометра, або чип магнітометра, або орієнтацію осей магнітометра, щоб вони відповідали фізичній орієнтації на літальному апараті.<br/><strong>Примітка:</strong> Попередні налаштування орієнтації магнітометра (align_mag) відноситься до польотного контролера. Переконайтеся, що спочатку вирівняли польотний контролер (align_board_pitch, align_board_roll, align_board_yaw).<br/>Якщо не використовувати попередні налаштування (орієнтація встановлюється за допомогою align_mag_roll, align_mag_pitch і align_mag_yaw), то орієнтація магнітометра є незалежною."\r
    },\r
    "magnetometerOrientationPreset": {\r
        "message": "Попередні налаштування орієнтації (align_mag). Відносно орієнтації польотного контролера"\r
    },\r
    "boardInfo": {\r
        "message": "1. Виберіть орієнтацію польотного контролера<br>(align_board_roll, align_board_pitch, align_board_yaw)"\r
    },\r
    "magnetometerInfo": {\r
        "message": "2. Виберіть попереднє налаштування (align_mag) або створіть власну конфігурацію за допомогою повзунків<br>(align_mag_roll, align_mag_pitch, align_mag_yaw)"\r
    },\r
    "magnetometerElementToShow": {\r
        "message": "Показувати елемент: Модель магнітометра або чип або осі"\r
    },\r
    "magnetometerAxes": {\r
        "message": "XYZ (Осі магнітометра)"\r
    },\r
    "axisTableTitleAxis": {\r
        "message": "Вісі"\r
    },\r
    "axisTableTitleValue": {\r
        "message": "Значення [градуси]"\r
    },\r
    "configurationSensorMagPreset": {\r
        "message": "Орієнтацію задано: ПРЕСЕТОМ (align_mag)"\r
    },\r
    "configurationSensorMagAngles": {\r
        "message": "Орієнтацію задано: КУТАМИ (align_mag_roll, align_mag_pitch, align_mag_yaw)"\r
    },\r
    "configurationMagnetometerHelp": {\r
        "message": "<strong>Примітка:</strong> Не забудьте налаштувати послідовний порт (через вкладку Порти), коли використовуєте функцію магнітометра."\r
    },\r
    "magnetometerStatHead": {\r
        "message": "Статистика магнітометра"\r
    },\r
    "tabMAGNETOMETER": {\r
        "message": "Інструмент вирівнювання"\r
    },\r
    "motors": {\r
        "message": "Мотори"\r
    },\r
    "servos": {\r
        "message": "Сервоприводи"\r
    },\r
    "motorsMaster": {\r
        "message": "Майстер"\r
    },\r
    "motorsNotice": {\r
        "message": "<strong>Попередження про режим тестування моторів:</strong><br />Рухання повзунків викличе <strong>обертання моторів</strong>.<br />Щоб уникнути травм, <strong style=\\"color: red\\">зніміть ВСІ пропелери</strong> перед використанням цієї функції.<br />"\r
    },\r
    "motorsEnableControl": {\r
        "message": "Я розумію ризики, пропелери зняті - Увімкнути контроль моторів."\r
    },\r
    "sensorsInfo": {\r
        "message": "Майте на увазі, що використання швидких періодів оновлення і відображення декількох графіків одночасно вимагає багато ресурсів і спричиняє швидке розрядження батареї, якщо ви використовуєте ноутбук.<br />Ми рекомендуємо відображати графіки лише для датчиків, які вас цікавлять, використовуючи розумні періоди оновлення."\r
    },\r
    "sensorsRefresh": {\r
        "message": "Оновлення:"\r
    },\r
    "sensorsScale": {\r
        "message": "Масштаб:"\r
    },\r
    "cliInfo": {\r
        "message": "<strong>Примітка</strong>: Вихід із вкладки \\"Командний рядок\\" або натискання кнопки Відключити <strong>автоматично</strong> відправить команду <strong>exit</strong> на плату. З останньою версією прошивки це змусить контролер <span style=\\"color: red\\">перезавантажитися</span>, і незбережені зміни будуть <span style=\\"color: red\\">втрачені</span>."\r
    },\r
    "cliInputPlaceholder": {\r
        "message": "Введіть вашу команду тут"\r
    },\r
    "cliEnter": {\r
        "message": "Виявлено режим CLI"\r
    },\r
    "cliReboot": {\r
        "message": "Виявлено перезавантаження з CLI"\r
    },\r
    "cliDocsBtn": {\r
        "message": "Довідка команд CLI"\r
    },\r
    "cliSaveToFileBtn": {\r
        "message": "Зберегти до файлу"\r
    },\r
    "cliSaveToFileFailed": {\r
        "message": "Не вдалося зберегти вивід команд у файл"\r
    },\r
    "cliSaveToFileAborted": {\r
        "message": "Збереження виводу команд до файлу було перервано"\r
    },\r
    "cliSaveToFileCompleted": {\r
        "message": "Вивід команд успішно збережено у файл"\r
    },\r
    "cliClearOutputHistoryBtn": {\r
        "message": "Очистити екран"\r
    },\r
    "cliCopyToClipboardBtn": {\r
        "message": "Скопіювати до буфера обміну"\r
    },\r
    "cliExitBtn": {\r
        "message": "Вийти"\r
    },\r
    "cliSaveSettingsBtn": {\r
        "message": "Зберегти налаштування"\r
    },\r
    "cliMscBtn": {\r
        "message": "Чорна скриня (MSC)"\r
    },\r
    "cliDiffAllBtn": {\r
        "message": "Diff All"\r
    },\r
    "cliCommandsHelp": {\r
        "message": "Введіть або вставте команди в поле зліва. Ви можете використовувати клавіші стрілок вгору та вниз для виклику раніше введених команд. Введіть 'help' або натисніть на цю іконку для отримання додаткової інформації."\r
    },\r
    "cliCopySuccessful": {\r
        "message": "Скопійовано!"\r
    },\r
    "cliLoadFromFileBtn": {\r
        "message": "Завантажити з файлу"\r
    },\r
    "cliConfirmSnippetDialogTitle": {\r
        "message": "Переглянути завантажені команди"\r
    },\r
    "cliConfirmSnippetNote": {\r
        "message": "<strong>Примітка</strong>: Ви можете переглядати та редагувати команди перед виконанням."\r
    },\r
    "cliConfirmSnippetBtn": {\r
        "message": "Виконати"\r
    },\r
    "loggingNote": {\r
        "message": "Дані будуть записані в цій вкладці <span style=\\"color: red\\">тільки</span>, вихід з вкладки <span style=\\"color: red\\">скасує</span> запис, і додаток повернеться до свого нормального стану <strong>конфігуратора</strong>.<br /> Ви можете вибрати глобальний період оновлення, дані будуть записуватися в лог-файл кожну <strong>1</strong> секунду з міркувань продуктивності."\r
    },\r
    "loggingSamplesSaved": {\r
        "message": "Зразків збережено:"\r
    },\r
    "loggingLogSize": {\r
        "message": "Розмір журналу:"\r
    },\r
    "loggingButtonLogFile": {\r
        "message": "Виберіть файл журналу"\r
    },\r
    "loggingStart": {\r
        "message": "Почати Логування"\r
    },\r
    "loggingStop": {\r
        "message": "Зупинити логування"\r
    },\r
    "loggingBack": {\r
        "message": "Вийти з журналу / Від'єднатися"\r
    },\r
    "loggingErrorNotConnected": {\r
        "message": "Спочатку вам потрібно <strong>підключитися</strong>"\r
    },\r
    "loggingErrorLogFile": {\r
        "message": "Будь ласка, оберіть файл журналу"\r
    },\r
    "loggingErrorOneProperty": {\r
        "message": "Будь ласка, оберіть принаймні одну властивість для логування"\r
    },\r
    "loggingAutomaticallyRetained": {\r
        "message": "Автоматично завантажений попередній файл журналу: <strong>$1</strong>"\r
    },\r
    "blackboxNotSupported": {\r
        "message": "Прошивка вашого польотного контролера не підтримує запис в чорну скриню або функція чорна скриня не увімкнена"\r
    },\r
    "blackboxConfiguration": {\r
        "message": "Конфігурація чорної скрині"\r
    },\r
    "blackboxButtonSave": {\r
        "message": "Зберегти й перезавантажити"\r
    },\r
    "serialLogging": {\r
        "message": "Зовнішній послідовний пристрій для логування"\r
    },\r
    "serialLoggingSupportedNote": {\r
        "message": "Ви можете вести журнал на зовнішній пристрій для логування (такий як OpenLog або сумісний клон), використовуючи послідовний порт. Налаштуйте порт на вкладці Порти."\r
    },\r
    "onboardLoggingFlashLogger": {\r
        "message": "Вбудований чіп пам'яті"\r
    },\r
    "OnboardSDCard": {\r
        "message": "Вбудована SD карта"\r
    },\r
    "sdcardNote": {\r
        "message": "Журнали польоту можна записувати на карту пам'яті, вставлену у слот для SD-карт у вашому польотному контролері."\r
    },\r
    "dataflashNote": {\r
        "message": "Журнали польоту можна записувати на вбудований чіп пам'яті у вашому польотному контролері."\r
    },\r
    "dataflashNotPresentNote": {\r
        "message": "У вашому польотному контролері відсутній сумісний чіп пам'яті для зберігання даних."\r
    },\r
    "dataflashFirmwareUpgradeRequired": {\r
        "message": "Для використання флешпам'яті польотника необхідна прошивка &gt;= 1.8.0."\r
    },\r
    "dataflashButtonSaveFile": {\r
        "message": "Зберегти флешпам'ять в файл..."\r
    },\r
    "dataflashButtonErase": {\r
        "message": "Стерти флешпамять"\r
    },\r
    "dataflashConfirmEraseTitle": {\r
        "message": "Підтвердьте стирання флешпам'яті контролера"\r
    },\r
    "dataflashConfirmEraseNote": {\r
        "message": "Це видалить всі журнали чорної скрині або інші дані, що містяться на внутрішній пам'яті польотника, що триватиме близько 20 секунд, ви впевнені?"\r
    },\r
    "dataflashEraseing": {\r
        "message": "Виконується видалення, зачекайте..."\r
    },\r
    "dataflashSavingTitle": {\r
        "message": "Збереження вмісту вбудованої в контролер флеш-пам'яті в файл"\r
    },\r
    "dataflashSavingNote": {\r
        "message": "Збереження може зайняти кілька хвилин, зачекайте."\r
    },\r
    "dataflashSavingNoteAfter": {\r
        "message": "Збереження завершено! Натисніть \\"Гаразд\\", щоб продовжити."\r
    },\r
    "dataflashButtonSaveCancel": {\r
        "message": "Скасувати"\r
    },\r
    "dataflashButtonSaveDismiss": {\r
        "message": "Гаразд"\r
    },\r
    "dataflashButtonEraseConfirm": {\r
        "message": "Так, стерти флеш-пам’ять"\r
    },\r
    "dataflashButtonEraseCancel": {\r
        "message": "Скасувати"\r
    },\r
    "dataflashFileWriteFailed": {\r
        "message": "Не вдалося записати у вибраний файл. Чи в порядку дозволи для цієї папки?"\r
    },\r
    "firmwareFlasherReleaseSummaryHead": {\r
        "message": "Інформація про реліз"\r
    },\r
    "firmwareFlasherReleaseName": {\r
        "message": "<p>Ім'я/Версія:</p>"\r
    },\r
    "firmwareFlasherReleaseVersionUrl": {\r
        "message": "Відвідайте сторінку релізу."\r
    },\r
    "firmwareFlasherReleaseNotes": {\r
        "message": "Примітки до випуску:"\r
    },\r
    "firmwareFlasherReleaseDate": {\r
        "message": "Дата:"\r
    },\r
    "firmwareFlasherReleaseStatus": {\r
        "message": "Статус:"\r
    },\r
    "firmwareFlasherReleaseTarget": {\r
        "message": "Цільовий пристрій:"\r
    },\r
    "firmwareFlasherReleaseFile": {\r
        "message": "Бінарник:"\r
    },\r
    "firmwareFlasherReleaseStatusReleaseCandidate": {\r
        "message": "<span style=\\"color: red\\">ВАЖЛИВО: Це випуск прошивки наразі відзначено як кандидат на реліз. Будь ласка, негайно повідомляйте про будь-які проблеми.</span>"\r
    },\r
    "firmwareFlasherReleaseFileUrl": {\r
        "message": "Звантажити вручну."\r
    },\r
    "firmwareFlasherTargetWarning": {\r
        "message": "<span style=\\"color: red\\">ВАЖЛИВО</span>: Переконайтеся, що ви прошиваєте файл, що відповідає вашому пристрою. Прошивка бінарного файлу для невірного пристрою може призвести до <span style=\\"color: red\\">негативних</span> наслідків."\r
    },\r
    "firmwareFlasherPath": {\r
        "message": "Шлях:"\r
    },\r
    "firmwareFlasherSize": {\r
        "message": "Розмір:"\r
    },\r
    "firmwareFlasherStatus": {\r
        "message": "Стан:"\r
    },\r
    "firmwareFlasherProgress": {\r
        "message": "Прогрес:"\r
    },\r
    "firmwareFlasherLoadFirmwareFile": {\r
        "message": "Будь ласка, завантажте файл прошивки"\r
    },\r
    "firmwareFlasherNoReboot": {\r
        "message": "Польотник уже в режимі завантажувача"\r
    },\r
    "firmwareFlasherOnlineSelectBoardDescription": {\r
        "message": "Виберіть вашу плату, щоб побачити доступні онлайн-релізи прошивок - Виберіть правильну прошивку, відповідну вашій платі. Будь ласка, зверніть увагу, що <strong>Автовибір</strong> працюватиме лише для INAV прошивок версії 5.0 і новіше."\r
    },\r
    "firmwareFlasherOnlineSelectFirmwareVersionDescription": {\r
        "message": "Виберіть версію прошивки для вашої плати.<br />Примітка: навіть якщо ви можете прошити різні версії прошивки за допомогою цього конфігуратора, при налаштуванні польотного контролера, вам треба зробити однаковими основні та другорядні номери версій як для прошивки, так і для конфігуратора."\r
    },\r
    "firmwareFlasherNoRebootDescription": {\r
        "message": "Увімкніть, якщо ви подали живлення на ваш польотний контролер, коли ніжки завантажувача були з'єднані, або тримали затиснутою кнопку BOOT вашого польотного контролера."\r
    },\r
    "firmwareFlasherFlashOnConnect": {\r
        "message": "Прошити при підключенні"\r
    },\r
    "firmwareFlasherFlashOnConnectDescription": {\r
        "message": "Спроба автоматичного прошивання плати (запускається при виявленні нового послідовного порту)."\r
    },\r
    "firmwareFlasherFullChipErase": {\r
        "message": "Повністю очистити мікроконтролер"\r
    },\r
    "firmwareFlasherFullChipEraseDescription": {\r
        "message": "Очистить всі дані конфігурації, які зараз зберігаються на платі."\r
    },\r
    "firmwareFlasherFlashDevelopmentFirmware": {\r
        "message": "Використовувати прошивку, що в стадії розробки"\r
    },\r
    "firmwareFlasherFlashDevelopmentFirmwareDescription": {\r
        "message": "Встановити найсвіжішу (неперевірену) прошивку, що зараз є в стані розробки."\r
    },\r
    "firmwareFlasherManualBaud": {\r
        "message": "Задати вручну швидкість передачі даних"\r
    },\r
    "firmwareFlasherManualBaudDescription": {\r
        "message": "Ручний вибір швидкості передачі даних для плат, які не підтримують швидкість передачі за замовчуванням, або для прошивки через Bluetooth.<br /><span style=\\"color: red\\">Примітка:</span> Не використовується при прошивці через USB DFU"\r
    },\r
    "firmwareFlasherShowDevelopmentReleases": {\r
        "message": "Показати нестабільні релізи"\r
    },\r
    "firmwareFlasherShowDevelopmentReleasesDescription": {\r
        "message": "Показувати кандидатів на реліз та релізи для розробників."\r
    },\r
    "firmwareFlasherOptionLabelSelectFirmware": {\r
        "message": "Виберіть прошивку / плату"\r
    },\r
    "firmwareFlasherOptionLabelSelectBoard": {\r
        "message": "Оберіть плату"\r
    },\r
    "firmwareFlasherOptionLabelSelectFirmwareVersion": {\r
        "message": "Оберіть версію прошивки"\r
    },\r
    "firmwareFlasherOptionLabelSelectFirmwareVersionFor": {\r
        "message": "Оберіть версію прошивки для"\r
    },\r
    "firmwareFlasherButtonAutoSelect": {\r
        "message": "Автовибір цільового пристрою"\r
    },\r
    "firmwareFlasherButtonLoadLocal": {\r
        "message": "Завантажити прошивку локально"\r
    },\r
    "firmwareFlasherButtonLoadOnline": {\r
        "message": "Завантажити прошивку онлайн"\r
    },\r
    "firmwareFlasherButtonLoading": {\r
        "message": "Завантаження..."\r
    },\r
    "firmwareFlasherFlashFirmware": {\r
        "message": "Прошити прошивку"\r
    },\r
    "firmwareFlasherGithubInfoHead": {\r
        "message": "\`GitHub дані про прошивку\`"\r
    },\r
    "firmwareFlasherCommiter": {\r
        "message": "Автор:"\r
    },\r
    "firmwareFlasherDate": {\r
        "message": "Дата:"\r
    },\r
    "firmwareFlasherHash": {\r
        "message": "Хеш:"\r
    },\r
    "firmwareFlasherUrl": {\r
        "message": "Перейдіть на GitHub, щоб переглянути цей коміт..."\r
    },\r
    "firmwareFlasherMessage": {\r
        "message": "Повідомлення:"\r
    },\r
    "firmwareFlasherWarningHead": {\r
        "message": "Попередження"\r
    },\r
    "firmwareFlasherWarningText": {\r
        "message": "Будь ласка, <span style=\\"color: red\\">не</span> намагайтеся прошивати <strong>не-iNAV</strong> апаратне забезпечення за допомогою цього програматора.<br /> Під час прошивки <span style=\\"color: red\\">не</span> <strong>від'єднуйте</strong> плату або <strong>не вимикайте</strong> комп'ютер.<br /> <br /><strong>Примітка: </strong>Завантажувач STM32 зберігається в ПЗП, він не може бути пошкодженим.<br /><strong>Примітка: </strong><span style=\\"color: red\\">Автопідключення</span> завжди вимкнено, поки ви перебуваєте в програматорі прошивки.<br /><strong>Примітка: </strong>Переконайтеся, що у вас є резервна копія; деякі оновлення/пониження прошивки зітруть вашу конфігурацію.<br /><strong>Примітка:</strong> Якщо у вас виникають проблеми з прошивкою, спробуйте спочатку від'єднати всі кабелі від польотного контролера, перезапустіть, оновіть Chrome, оновіть драйвери.<br /><strong>Примітка:</strong> Під час прошивки плат із безпосередньо підключеними USB-гніздами (Matek H743-SLIM, Holybro Kakute тощо) переконайтеся, що ви прочитали розділ про прошивку USB в керівництві INAV і маєте встановлене правильне програмне забезпечення та драйвери"\r
    },\r
    "firmwareFlasherRecoveryHead": {\r
        "message": "<strong>Відновлення / Втрата зв'язку<strong>"\r
    },\r
    "firmwareFlasherRecoveryText": {\r
        "message": "Якщо ви втратили зв'язок з вашою платою, дотримуйтесь цих кроків, щоб відновити його: <ul><li>Вимкніть живлення</li><li>Увімкніть 'Польотник уже в режимі завантажувача', увімкніть 'Повністю очистити мікроконтролер'.</li><li>З'єднайте контакти BOOT або утримуйте кнопку BOOT.</li><li>Увімкніть живлення (індикатор активності НЕ буде блимати, якщо все зроблено правильно).</li><li>Встановіть усі драйвери STM32 і Zadig, якщо це необхідно (див. розділ <a href=\\"https://github.com/iNavFlight/inav/blob/master/docs/USB%20Flashing.md\\"target=\\"_blank\\">Прошивка через USB</a> в документації INAV).</li><li>Закрийте конфігуратор, закрийте всі запущені екземпляри Chrome, закрийте всі програми Chrome, перезапустіть конфігуратор.</li><li>Відпустіть кнопку BOOT, якщо вона є на вашому польотному контролері.</li><li>Прошивайте правильною прошивкою (використовуючи ручну швидкість передачі даних, якщо це вказано в керівництві до вашого польотного контролера).</li><li>Вимкніть живлення.</li><li>Видаліть перемичку BOOT.</li><li>Увімкніть живлення (індикатор активності має блимати).</li><li>Під'єднайте як зазвичай.</li></ul>"\r
    },\r
    "firmwareFlasherButtonLeave": {\r
        "message": "Вийти з програматора"\r
    },\r
    "firmwareFlasherFirmwareNotLoaded": {\r
        "message": "Прошивка не завантажена"\r
    },\r
    "firmwareFlasherHexCorrupted": {\r
        "message": "Схоже, бінарний файл пошкоджено"\r
    },\r
    "firmwareFlasherRemoteFirmwareLoaded": {\r
        "message": "<span style=\\"color: #37a8db\\">Віддалена прошивка завантажена, готова до прошивання</span>"\r
    },\r
    "firmwareFlasherFailedToLoadOnlineFirmware": {\r
        "message": "Не вдалося завантажити віддалену прошивку"\r
    },\r
    "ledStripHelp": {\r
        "message": "Польотний контролер може керувати кольорами та ефектами окремих світлодіодів в стрічці.<br />Налаштуйте світлодіоди на сітці, налаштуйте порядок підключення проводів, а потім закріпіть світлодіоди на вашому літальному апараті відповідно до позицій на сітці. Світлодіоди без порядкового номера не будуть збережені.<br />Подвійний клік на кольорі дозволяє редагувати значення HSV - Hue - Saturation - Value."\r
    },\r
    "ledStripButtonSave": {\r
        "message": "Зберегти"\r
    },\r
    "ledStripEepromSaved": {\r
        "message": "EEPROM <span style=\\"color: #37a8db\\">збережено</span>: LED"\r
    },\r
    "controlAxisRoll": {\r
        "message": "Крен [A]"\r
    },\r
    "controlAxisPitch": {\r
        "message": "Тангаж [E]"\r
    },\r
    "controlAxisYaw": {\r
        "message": "Рискання [R]"\r
    },\r
    "controlAxisThrottle": {\r
        "message": "Тяга [T]"\r
    },\r
    "controlAxisMotor": {\r
        "message": "Мотор"\r
    },\r
    "radioChannelShort": {\r
        "message": "Канал "\r
    },\r
    "configHelp2": {\r
        "message": "Довільний поворот плати на кут у градусах дозволяє встановити її боком / догори дриґом / поверненою. При використанні зовнішніх датчиків, використовуйте корекцію датчиків (гіроскоп, акселерометр, компас) для визначення положення датчиків незалежно від орієнтації плати. "\r
    },\r
    "failsafeFeaturesHelpOld": {\r
        "message": "Конфігурація безаварійності значно змінилася. Використовуйте останню версію INAV"\r
    },\r
    "failsafePaneTitleOld": {\r
        "message": "Безаварійність приймача"\r
    },\r
    "failsafeFeatureItemOld": {\r
        "message": "Настройки безаварійності при втраті сигналу приймачем"\r
    },\r
    "failsafeThrottleItemOld": {\r
        "message": "Тяга при безаварійності"\r
    },\r
    "failsafeFeaturesHelpNew": {\r
        "message": "Безаварійність має два етапи. <strong>Етап 1</strong> активується, коли політний канал має некоректну тривалість імпульсу, приймач повідомляє про безаварійний режим або взагалі немає сигналу від приймача, налаштування резервних каналів застосовуються до <span style=\\"color: red\\">всіх каналів</span> і надається короткий час для відновлення. <strong>Етап 2</strong> активується, коли стан помилки триває довше, ніж заданий захисний час, поки апарат <span style=\\"color: red\\">взведено</span>, всі канали лишаються в налаштуваннях резервного каналу, якщо це не змінено обраною процедурою. <br /><strong>Примітка:</strong> Перед входом в етап 1, налаштування резервних каналів також застосовуються до окремих радіоканалів, які мають некоректні імпульси."\r
    },\r
    "failsafePulsrangeTitle": {\r
        "message": "Валідні значення діапазону імпульсу"\r
    },\r
    "failsafePulsrangeHelp": {\r
        "message": "Імпульси коротші за мінімальні або довші за максимальні є недійсними і викличуть застосування індивідуальних аварійних налаштувань для каналів радіо або перехід на етап 1 для польотних каналів"\r
    },\r
    "failsafeRxMinUsecItem": {\r
        "message": "Мінімальна тривалість"\r
    },\r
    "failsafeRxMaxUsecItem": {\r
        "message": "Максимальна тривалість"\r
    },\r
    "failsafeChannelFallbackSettingsTitle": {\r
        "message": "Налаштування резервних каналів"\r
    },\r
    "failsafeChannelFallbackSettingsHelp": {\r
        "message": "Ці налаштування застосовуються до недійсних окремих радіоканалів або до всіх каналів при переході в етап 1. <strong>Примітка:</strong> значення зберігаються кроками по 25 мкс, тому малі зміни зникають"\r
    },\r
    "failsafeChannelFallbackSettingsAuto": {\r
        "message": "<strong>Авто</strong> означає, що крен, тангаж і рискання по центру і тяга низька. <strong>Утримувати</strong> означає збереження останнього отриманого хорошого значення"\r
    },\r
    "failsafeChannelFallbackSettingsHold": {\r
        "message": "<strong>Утримувати</strong> означає збереження останнього прийнятного значення. <strong>Встановити</strong> означає, що використовуватиметься вказане тут значення"\r
    },\r
    "failsafeStageTwoSettingsTitle": {\r
        "message": "Налаштування"\r
    },\r
    "failsafeFeatureItem": {\r
        "message": "Увімкнено"\r
    },\r
    "failsafeFeatureHelp": {\r
        "message": "<strong>Примітка:</strong> Якщо Етап 2 ВИМКНЕНО, замість користувацьких налаштувань для всіх каналів польоту (Крен, Тангаж, Рискання та Тяга) буде використано резервне налаштування <strong>Авто</strong>."\r
    },\r
    "failsafeDelayItem": {\r
        "message": "Час запобіжника для активації після втрати сигналу [Для децисекунд (дс): 1 = 0,1 с.]"\r
    },\r
    "failsafeDelayHelp": {\r
        "message": "Час очікування на відновлення для етапу 1"\r
    },\r
    "failsafeThrottleItem": {\r
        "message": "Значення тяги, яке використовується під час посадки"\r
    },\r
    "failsafeOffDelayItem": {\r
        "message": "Затримка вимкнення моторів під час безаварійності [Для децисекунд (дс): 1 = 0.1 с.]"\r
    },\r
    "failsafeOffDelayHelp": {\r
        "message": "Час перебування в режимі посадки, доки мотори не будуть вимкнені та апарат не буде охолощений"\r
    },\r
    "failsafeSubTitle1": {\r
        "message": "Процедура"\r
    },\r
    "failsafeProcedureItemSelect1": {\r
        "message": "Приземлитись"\r
    },\r
    "failsafeProcedureItemSelect2": {\r
        "message": "Впасти"\r
    },\r
    "failsafeProcedureItemSelect3": {\r
        "message": "Повернення додому"\r
    },\r
    "failsafeProcedureItemSelect4": {\r
        "message": "Нічого не робити"\r
    },\r
    "failsafeKillSwitchItem": {\r
        "message": "Перемикач аварійного відключення (миттєво охолостити літальний апарат у разі збою)"\r
    },\r
    "failsafeKillSwitchHelp": {\r
        "message": "Установіть цю опцію, щоб перемикач безаварійного режиму, налаштований на вкладці режимів, діяв як перемикач аварійного відключення, оминаючи обраний безаварійний процес. <strong>Примітка:</strong> Взведення заблоковано, коли перемикач безаварійного режиму увімкнено"\r
    },\r
    "failsafeUseMinimumDistanceItem": {\r
        "message": "Використовувати альтернативну процедуру безаварійності, коли судно знаходиться близько до домашньої точки"\r
    },\r
    "failsafeUseMinimumDistanceHelp": {\r
        "message": "Установіть цю опцію, якщо вам потрібна альтернативна поведінка безаварійності, коли апарат знаходиться близько до домашньої точки. Наприклад, автор цієї функції має літак, який переходить у режим безаварійності, коли крила від'єднуються під час посадки, коли поведінка безаварійності RTH, яка зазвичай бажана у польоті, більше не потрібна або не бажана."\r
    },\r
    "failsafeMinDistanceItem": {\r
        "message": "Мінімальна дистанція для безаварійності"\r
    },\r
    "failsafeMinDistanceHelp": {\r
        "message": "Літальний апарат використовуватиме альтернативну поведінку безаварійності, коли він знаходиться між 0 та цією мінімальною відстанню в сантиметрах від точки зльоту. Наприклад, якщо встановлено 2000 сантиметрів (20 метрів), і літальний апарат знаходиться на відстані 13 метрів, буде виконуватись процедура безаварійності мінімальної відстані. Коли літальний апарат знаходиться на відстані 25 метрів, буде виконуватись нормальна безаварійна процедура. Якщо встановлено 0, нормальна безаварійна процедура буде використовуватись завжди. "\r
    },\r
    "failsafeMinDistanceProcedureItem": {\r
        "message": "Процедура безаварійності мінімальної відстані"\r
    },\r
    "failsafeMinDistanceProcedureHelp": {\r
        "message": "Це процедура безаварійності, яка буде виконана, коли апарат знаходиться ближче до мінімальної відстані безаварійності від домашньої точки."\r
    },\r
    "mainHelpArmed": {\r
        "message": "Взведення мотора"\r
    },\r
    "mainHelpFailsafe": {\r
        "message": "Режим безаварійності"\r
    },\r
    "mainHelpLink": {\r
        "message": "Статус послідовного порту"\r
    },\r
    "warning": {\r
        "message": "Попередження"\r
    },\r
    "escProtocol": {\r
        "message": "Протокол ESC"\r
    },\r
    "escRefreshRate": {\r
        "message": "Швидкість оновлення ESC"\r
    },\r
    "escProtocolHelp": {\r
        "message": "ESC повинен підтримувати обраний протокол. Змінюйте лише в тому випадку, якщо ви знаєте, що ESC його підтримує!"\r
    },\r
    "escRefreshRatelHelp": {\r
        "message": "ESC має підтримувати частоту оновлення. Змінюйте лише якщо впевнені, що ESC це підтримує!"\r
    },\r
    "servoRefreshRate": {\r
        "message": "Частота оновлення сервоприводу"\r
    },\r
    "servoRefreshRatelHelp": {\r
        "message": "Сервопривід має підтримувати частоту оновлення. Змінюйте лише, якщо знаєте, що сервопривід це підтримує. Занадто висока частота оновлення може пошкодити сервоприводи!"\r
    },\r
    "logPwmOutputDisabled": {\r
        "message": "Вивід PWM відключений. Мотори та серво не працюватимуть. Використовуйте вкладку <u>Виводи</u> для увімкнення!"\r
    },\r
    "configurationGyroSyncTitle": {\r
        "message": "Синхронізувати час циклу з гіроскопом"\r
    },\r
    "configurationGyroLpfTitle": {\r
        "message": "Частота зрізу ФНЧ гіроскопа"\r
    },\r
    "configurationGyroSyncDenominator": {\r
        "message": "Знаменник гіроскопу"\r
    },\r
    "yawJumpPreventionLimit": {\r
        "message": "Попередження стрибка рискання"\r
    },\r
    "yawJumpPreventionLimitHelp": {\r
        "message": "Запобігти стрибкам рискання під час зупинок рискання і швидких команд рискання. Для відключення встановіть 500. Коригуйте це, якщо ваш літальний апарат ковзає і заносить. Вищі значення збільшують авторитетність рискання, але можуть спричинити нестабільність крена/тангажу у випадку малопотужних БПЛА. Нижчі значення роблять коригування рискання більш м'якими, але можуть спричинити нездатність БПЛА утримувати курс"\r
    },\r
    "yawPLimit": {\r
        "message": "Обмеження П рискання"\r
    },\r
    "yawPLimitHelp": {\r
        "message": "Обмежувач для П-складової рискання. Підвищення його значення покращує керування рисканням, але може викликати нестабільність у крені та тангажі."\r
    },\r
    "tabFiltering": {\r
        "message": "Фільтрація"\r
    },\r
    "gyroLpfCutoffFrequency": {\r
        "message": "Частота зрізу ФНЧ гіроскопа"\r
    },\r
    "gyroLpfCutoffFrequencyHelp": {\r
        "message": "Фільтр на основі програмного забезпечення для видалення механічних вібрацій із сигналу гіроскопа. Значення є частотою зрізу (Гц). Для більших рам із великими пропелерами встановіть на нижче значення. Занадто високе значення може викликати перегрів мотора та ESC."\r
    },\r
    "accLpfCutoffFrequency": {\r
        "message": "Частота зрізу ФНЧ акселерометра"\r
    },\r
    "yawLpfCutoffFrequency": {\r
        "message": "Частота зрізу ФНЧ рискання"\r
    },\r
    "yawLpfCutoffFrequencyHelp": {\r
        "message": "Частота зрізу ФНЧ П-складової"\r
    },\r
    "rollPitchItermIgnoreRate": {\r
        "message": "Швидкість ігнорування І-складової крену/тангажа"\r
    },\r
    "rollPitchItermIgnoreRateHelp": {\r
        "message": "I-складова ПІД ігнорується вище за цю швидкість обертання. Це запобігає накопиченню I-складової під час маневрів"\r
    },\r
    "yawItermIgnoreRate": {\r
        "message": "Швидкість ігнорування І-складової рискання"\r
    },\r
    "yawItermIgnoreRateHelp": {\r
        "message": "І-складова ПІД ігнорується вище цієї швидкості обертання. Це запобігає накопиченню I-складової під час маневрів"\r
    },\r
    "axisAccelerationLimitRollPitch": {\r
        "message": "Обмеження прискорення крену/тангажа"\r
    },\r
    "axisAccelerationLimitRollPitchHelp": {\r
        "message": "Це максимальний кутовий коефіцієнт прискорення, який пілот може вимагати від БПЛА. БПЛА повинен бути в змозі підтримувати цей коефіцієнт прискорення. Як правило, чим більший БПЛА, тим нижче прискорення, яке він може витримати"\r
    },\r
    "axisAccelerationLimitYaw": {\r
        "message": "Обмеження прискорення рискання"\r
    },\r
    "axisAccelerationLimitYawHelp": {\r
        "message": "Це максимальний кутовий коефіцієнт прискорення, який пілот може вимагати від БПЛА. БПЛА повинен бути в змозі підтримувати цей коефіцієнт прискорення. Як правило, чим більший БПЛА, тим нижче прискорення, яке він може витримати"\r
    },\r
    "pidTuningTPAHelp": {\r
        "message": "Фактор послаблення ПІД в залежності від тяги. ПІД коефіцієнти будуть зменшуватися лінійно починаючи з 0 в точці зламу TPA до фактору послаблення TPA при максимальній тязі"\r
    },\r
    "pidTuningTPABreakPointHelp": {\r
        "message": "Послаблення ПІД в залежності від тяги починається, коли положення тяги перевищує це значення. "\r
    },\r
    "configurationAsyncMode": {\r
        "message": "Асинхронний режим"\r
    },\r
    "configurationGyroFrequencyTitle": {\r
        "message": "Частота задачі гіроскопа"\r
    },\r
    "configurationAccelerometerFrequencyTitle": {\r
        "message": "Частота задачі акселерометра"\r
    },\r
    "configurationAttitudeFrequencyTitle": {\r
        "message": "Частота задачі кута нахилу"\r
    },\r
    "configurationGyroLpfHelp": {\r
        "message": "Заснована на апаратному забезпеченні частота зрізу для гіроскопа. Загалом, більше значення краще, але робить БПЛА більш чутливим до вібрацій"\r
    },\r
    "configurationAsyncModeHelp": {\r
        "message": "Перегляньте документацію про прошивку \\"Looptime\\" для отримання деталей"\r
    },\r
    "configurationGyroFrequencyHelp": {\r
        "message": "Загалом, вища частота є кращою, але вона робить БПЛА більш чутливим до вібрацій. Має бути встановлена вище частоти 'Час циклу польотного контролера'. Максимальне практичне значення залежить від апаратного забезпечення. Якщо встановити занадто високо, плата може працювати неправильно. Спостерігайте за навантаженням ЦП."\r
    },\r
    "configurationAccelerometerFrequencyHelp": {\r
        "message": "Для польотів в Акро, це значення можна зменшити зі значення за замовчуванням"\r
    },\r
    "configurationAttitudeFrequencyHelp": {\r
        "message": "Для польотів в Акро, це значення можна знизити від значень за замовчуванням"\r
    },\r
    "configurationLoopTimeHelp": {\r
        "message": "Загалом, вищі значення є кращими. За використання асинхронного гіроскопа, повинно триматися нижче частоти оновлення гіроскопа. Максимальне практичне значення залежить від апаратного забезпечення. Якщо встановити занадто високе значення, плата може працювати неправильно. Спостерігайте за завантаженням процесора."\r
    },\r
    "tabOSD": {\r
        "message": "Наекранне меню"\r
    },\r
    "configurationSensors": {\r
        "message": "Сенсори та шини"\r
    },\r
    "sensorAccelerometer": {\r
        "message": "Акселерометр"\r
    },\r
    "sensorMagnetometer": {\r
        "message": "Магнітометр"\r
    },\r
    "sensorBarometer": {\r
        "message": "Барометр"\r
    },\r
    "sensorPitot": {\r
        "message": "Трубка Піто"\r
    },\r
    "sensorRangefinder": {\r
        "message": "Далекомір"\r
    },\r
    "sensorOpflow": {\r
        "message": "Оптичний потік"\r
    },\r
    "manualEnablingTemplate": {\r
        "message": "Щоб увімкнути через CLI, використовуйте команду <strong>feature {name}</strong>"\r
    },\r
    "armingFailureReasonTitle": {\r
        "message": "Перевірки перед взведенням"\r
    },\r
    "BLOCKED_UAV_NOT_LEVEL": {\r
        "message": "БПЛА вирівняно"\r
    },\r
    "BLOCKED_SENSORS_CALIBRATING": {\r
        "message": "Калібрування під час виконання"\r
    },\r
    "BLOCKED_SYSTEM_OVERLOADED": {\r
        "message": "Завантаження ЦП"\r
    },\r
    "BLOCKED_NAVIGATION_SAFETY": {\r
        "message": "Навігація безпечна"\r
    },\r
    "BLOCKED_COMPASS_NOT_CALIBRATED": {\r
        "message": "Компас відкалібровано"\r
    },\r
    "BLOCKED_ACCELEROMETER_NOT_CALIBRATED": {\r
        "message": "Акселерометр відкалібровано"\r
    },\r
    "BLOCKED_HARDWARE_FAILURE": {\r
        "message": "Здоров'я апаратного забезпечення"\r
    },\r
    "BLOCKED_INVALID_SETTING": {\r
        "message": "Налаштування підтверджено"\r
    },\r
    "armingCheckPass": {\r
        "message": "<div class=\\"checkspass\\"></div>"\r
    },\r
    "armingCheckFail": {\r
        "message": "<div class=\\"checksfail\\"></div>"\r
    },\r
    "calibrationHead1": {\r
        "message": "Калібрування акселерометра"\r
    },\r
    "calibrationHead2": {\r
        "message": "Значення акселерометра"\r
    },\r
    "calibrationHead3": {\r
        "message": "Калібрування рівня"\r
    },\r
    "calibrationHead4": {\r
        "message": "Калібрування компаса"\r
    },\r
    "calibrationHead5": {\r
        "message": "Калібрування оптичного потоку"\r
    },\r
    "OpflowCalText": {\r
        "message": "Після натискання кнопки у вас є 30 секунд, щоб утримувати модель у повітрі та нахиляти її в сторони, не рухаючи горизонтально. Зверніть увагу, що оптичний сенсор потоку повинен постійно спостерігати за поверхнею."\r
    },\r
    "OpflowCalBtn": {\r
        "message": "Калібрувати датчик оптичного потоку"\r
    },\r
    "accZero": {\r
        "message": "Акс Нуль"\r
    },\r
    "accGain": {\r
        "message": "Коефіцієнт приросту акселерометра"\r
    },\r
    "NoteCalibration": {\r
        "message": "Примітка: Якщо ІВП встановлено під іншим кутом або на нижній стороні польотного контролера, виконуйте кроки калібрування з ІВП, поверненим так, як показано на зображеннях, а не квадрокоптером (інакше калібрування не спрацює)."\r
    },\r
    "AccBtn": {\r
        "message": "Відкалібрувати акселерометр"\r
    },\r
    "stepTitle1": {\r
        "message": "Крок 1"\r
    },\r
    "stepTitle2": {\r
        "message": "Крок 2"\r
    },\r
    "stepTitle3": {\r
        "message": "Крок 3"\r
    },\r
    "stepTitle4": {\r
        "message": "Крок 4"\r
    },\r
    "stepTitle5": {\r
        "message": "Крок 5"\r
    },\r
    "stepTitle6": {\r
        "message": "Крок 6"\r
    },\r
    "MagXText": {\r
        "message": "Нуль Х"\r
    },\r
    "MagYText": {\r
        "message": "Нуль Y"\r
    },\r
    "MagZText": {\r
        "message": "Нуль Z"\r
    },\r
    "MagGainXText": {\r
        "message": "Підсилення X"\r
    },\r
    "MagGainYText": {\r
        "message": "Підсилення Y"\r
    },\r
    "MagGainZText": {\r
        "message": "Підсилення Z"\r
    },\r
    "OpflowScaleText": {\r
        "message": "Масштаб"\r
    },\r
    "AccResetBtn": {\r
        "message": "Скинути калібрування акселерометра"\r
    },\r
    "MagCalText": {\r
        "message": "Після натискання кнопки у вас буде 30 секунд, щоб утримувати модель у повітрі і обертати її так, щоб кожна сторона (передня, задня, ліва, права, верхня та нижня) була спрямована вниз до землі. Переконайтеся, що ваш компас не знаходиться поруч з магнітами або електромагнітами після установки на літальному апараті або під час виконання калібрування."\r
    },\r
    "MagBtn": {\r
        "message": "Калібрувати компас"\r
    },\r
    "LevCalText": {\r
        "message": "Будь ласка, введіть текст тут…"\r
    },\r
    "LevBtn": {\r
        "message": "Калібрування рівня"\r
    },\r
    "tabMixer": {\r
        "message": "Мікшер"\r
    },\r
    "presetsApplyHeader": {\r
        "message": "Попередження"\r
    },\r
    "presetApplyDescription": {\r
        "message": "<p style='color: darkred;'>Переконайтеся, що <strong>мікшер</strong> був налаштований перед застосуванням будь-яких попередніх налаштувань!</p><p>Попередні налаштування перезаписують вибрані значення конфігурації, включаючи мікшер, фільтрацію, ПІД та інші. Такі налаштування, як: режими польоту, налаштування пульта, безаварійність та наекранне меню не змінюються. Застосовані значення слід <strong>НЕ</strong> розглядати як остаточні значення, а як вихідні точки для кінцевого налаштування. <br> Завжди перевіряйте нову конфігурацію перед польотом!</p>"\r
    },\r
    "OK": {\r
        "message": "Гаразд"\r
    },\r
    "accCalibrationStartTitle": {\r
        "message": "Калібрування акселерометра"\r
    },\r
    "accCalibrationStartBody": {\r
        "message": "Розмістіть польотний контролер у положенні, показаному на зображенні, потім натисніть кнопку <strong>Калібрувати</strong> знову. Повторіть для кожного з 6 положень. Утримуйте його стабільним під час калібрування."\r
    },\r
    "accCalibrationStopTitle": {\r
        "message": "Завершено калібрування"\r
    },\r
    "accCalibrationStopBody": {\r
        "message": "Калібрування акселерометра завершено, перевірте, чи збережено значення."\r
    },\r
    "accCalibrationProcessing": {\r
        "message": "Обробка..."\r
    },\r
    "tabProgramming": {\r
        "message": "Програмування"\r
    },\r
    "tabAdvancedTuning": {\r
        "message": "Розширені налаштування"\r
    },\r
    "advancedTuningSave": {\r
        "message": "Зберегти й перезавантажити"\r
    },\r
    "tabAdvancedTuningTitle": {\r
        "message": "Розширені налаштування"\r
    },\r
    "tabAdvancedTuningAirplaneTuningTitle": {\r
        "message": ": Нерухоме крило"\r
    },\r
    "tabAdvancedTuningMultirotorTuningTitle": {\r
        "message": ": Мультикоптери"\r
    },\r
    "tabAdvancedTuningGenericTitle": {\r
        "message": "Загальні налаштування"\r
    },\r
    "presetApplyHead": {\r
        "message": "Застосовує наступні налаштування:"\r
    },\r
    "gyroNotchHz1": {\r
        "message": "Частота першого режекторного фільтра гіроскопа"\r
    },\r
    "gyroNotchCutoff1": {\r
        "message": "Частота відсікання першого режекторного фільтра гіроскопа"\r
    },\r
    "gyroNotchHz2": {\r
        "message": "Частота другого режекторного фільтра гіроскопа"\r
    },\r
    "gyroNotchCutoff2": {\r
        "message": "Частота відсікання другого режекторного фільтра гіроскопа"\r
    },\r
    "gyroNotchHz1Help": {\r
        "message": "Повинно бути налаштовано на гармонічну частоту пропелера. Зазвичай дорівнює <i>[частота_мотора] * [кількість_лопатей_у_пропелера]</i><br><br>Повинна бути вище частоти зрізу<br><br><i>0</i> вимикає фільтр"\r
    },\r
    "gyroNotchHz2Help": {\r
        "message": "Повинно бути налаштовано на частоту мотора.<br><br>Має бути вище частоти відсікання і нижче першої частоти режекторного фільтра гіроскопа.<br><br><i>0</i> вимикає фільтр"\r
    },\r
    "gyroNotchCutoff1Help": {\r
        "message": "Визначає смугу режекторного фільтра. <br><br>Треба тримати менше частоти режекторного фільтра."\r
    },\r
    "gyroNotchCutoff2Help": {\r
        "message": "Визначає смугу режекторного фільтра. <br><br>Повинна бути нижче частоти режекторного фільтра."\r
    },\r
    "dtermNotchHz": {\r
        "message": "Частота режекторного фільтра Д-складової"\r
    },\r
    "dtermNotchCutoff": {\r
        "message": "Частота зрізу режекторного фільтра Д-складової"\r
    },\r
    "dtermNotchHzHelp": {\r
        "message": "Повинно бути розміщено між  першою та другою частотами режекторного фільтру гіроскопа<br><br>Має бути вище частоти зрізу<br><br><i>0</i> вимикає фільтр"\r
    },\r
    "dtermNotchCutoffHelp": {\r
        "message": "Визначає смугу фільтра. <br><br>Повинно бути нижче частоти режекторного фільтра."\r
    },\r
    "multiRotorNavigationConfiguration": {\r
        "message": "Налаштування навігації мультикоптера"\r
    },\r
    "userControlMode": {\r
        "message": "Режим керування користувачем"\r
    },\r
    "posholdDefaultSpeed": {\r
        "message": "Навігаційна швидкість за замовчуванням"\r
    },\r
    "posholdDefaultSpeedHelp": {\r
        "message": "Швидкість за замовчуванням під час повернення додому, також використовується для навігації по точках маршруту, якщо не задано швидкість по точках маршруту. Обмежена макс. швидкістю навігації"\r
    },\r
    "posholdMaxSpeed": {\r
        "message": "Максимальна навігаційна швидкість"\r
    },\r
    "posholdMaxManualSpeed": {\r
        "message": "Макс. КРЕЙСЕРСЬКА швидкість"\r
    },\r
    "posholdMaxManualSpeedHelp": {\r
        "message": "Максимальна горизонтальна швидкість, дозволена під час ручного керування пілотом у режимі POSHOLD/CRUISE"\r
    },\r
    "posholdMaxClimbRate": {\r
        "message": "Макс. швидкість набору висоти під час навігації [см/с]"\r
    },\r
    "posholdMaxManualClimbRate": {\r
        "message": "Макс. швидкість набору висоти в режимі ALTHOLD [см/с]"\r
    },\r
    "posholdMaxBankAngle": {\r
        "message": "Макс. кут крену для мультикоптера"\r
    },\r
    "posholdMaxBankAngleHelp": {\r
        "message": "Максимальний кут крену в режимах навігації. Обмежується максимальним кутом КРЕНУ на вкладці налаштування ПІД."\r
    },\r
    "posholdHoverThrottle": {\r
        "message": "Тяга зависання"\r
    },\r
    "navmcAltholdThrottle": {\r
        "message": "Положення стіка для зависання на висоті"\r
    },\r
    "mcWpSlowdown": {\r
        "message": "Сповільнитися при наближенні до точки маршруту"\r
    },\r
    "mcWpSlowdownHelp": {\r
        "message": "Коли увімкнено, двигун NAV сповільнюватиметься при переході до наступної точки маршруту. Це ставить пріоритет повороту над рухом вперед. Коли вимкнено, навігаційний двигун продовжуватиме рух до наступної точки маршруту та повертатиме по ходу."\r
    },\r
    "positionEstimatorConfiguration": {\r
        "message": "Оцінювач положення"\r
    },\r
    "w_z_baro_p": {\r
        "message": "Вага положення по вертикалі за барометром"\r
    },\r
    "w_z_gps_p": {\r
        "message": "Вага положення по вертикалі за GPS"\r
    },\r
    "w_z_gps_v": {\r
        "message": "Вага вертикальної швидкості за GPS"\r
    },\r
    "w_xy_gps_p": {\r
        "message": "Вага горизонтального положення за GPS"\r
    },\r
    "w_xy_gps_v": {\r
        "message": "Вага горизонтальної швидкості за GPS"\r
    },\r
    "positionEstimatorConfigurationDisclaimer": {\r
        "message": "Ці значення слід змінювати дуже обережно. У більшості випадків немає потреби їх змінювати. Тільки для досвідчених користувачів!"\r
    },\r
    "gps_min_sats": {\r
        "message": "Мін. кількість супутників GPS для точних координат"\r
    },\r
    "w_z_baro_p_help": {\r
        "message": "Коли це значення встановлено на <strong>0</strong>, барометр не використовується для обчислення висоти"\r
    },\r
    "w_z_gps_p_help": {\r
        "message": "Це налаштування використовується лише коли барометр не встановлено та налаштовано <strong>inav_use_gps_no_baro</strong>."\r
    },\r
    "wirelessModeSwitch": {\r
        "message": "Бездротовий режим"\r
    },\r
    "rthConfiguration": {\r
        "message": "Налаштування повернення додому"\r
    },\r
    "autoLandingSettings": {\r
        "message": "Налаштування автоматичного приземлення"\r
    },\r
    "minRthDistance": {\r
        "message": "Мін. дистанція повернення додому"\r
    },\r
    "minRthDistanceHelp": {\r
        "message": "Якщо БПЛА знаходиться у межах цієї відстані від точки повернення, він буде приземлятись замість підльоту до точки повернення та приземлення"\r
    },\r
    "rthClimbFirst": {\r
        "message": "Підйом перед поверненням додому"\r
    },\r
    "rthClimbFirstHelp": {\r
        "message": "Якщо встановлено ON або ON_FW_SPIRAL, літальний апарат спочатку підніметься до nav_rth_altitude, а потім поверне до точки зльоту. Якщо встановлено OFF, літальний апарат негайно поверне і прямуватиме до точки зльоту, піднімаючись по дорозі. Для літака з фіксованим крилом, ON використовуватиме лінійний підйом, ON_FW_SPIRAL використовуватиме підйом по спіралі з радіусом розвороту, встановленим nav_fw_loiter_radius, і швидкістю підйому, встановленою nav_auto_climb_rate (ON_FW_SPIRAL є налаштуванням для літака з фіксованим крилом і поводиться так само, як ON для мультикоптера)."\r
    },\r
    "rthClimbIgnoreEmergency": {\r
        "message": "Підійматися незалежно від стану датчиків положення"\r
    },\r
    "rthAltControlOverride": {\r
        "message": "Перевизначити висоту та налаштування набору висоти для повернення додому (RTH) за допомогою стіків крену/тангажа"\r
    },\r
    "rthAltControlOverrideHELP": {\r
        "message": "Коли це увімкнено, підйом при поверненнi додому можна скасувати, відхиливши стік до кінця і утримуючи тангаж протягом >1 секунди, щоб літальний апарат летів додому на поточній висоті. На літаках з фіксованим крилом, налаштування 'Підйом перед RTH' можна скасувати, утримуючи повний крен вліво або вправо протягом >1 секунди, щоб літак негайно повернувся додому."\r
    },\r
    "rthTailFirst": {\r
        "message": "Хвостом вперед"\r
    },\r
    "rthAllowLanding": {\r
        "message": "Приземлення після повернення додому"\r
    },\r
    "rthAltControlMode": {\r
        "message": "Режим висоти повернення додому"\r
    },\r
    "rthAbortThreshold": {\r
        "message": "Поріг скасування повернення додому"\r
    },\r
    "rthAbortThresholdHelp": {\r
        "message": "Функція перевірки придатності RTH (повернення до дому), якщо відстань до точки зльоту збільшується під час RTH, і якщо вона перевищує поріг, визначений цим параметром, замість продовження RTH, БПЛА увійде в режим аварійної посадки. За замовчуванням встановлено 500 м, що є безпечним для обох мультикоптерів та літаків."\r
    },\r
    "fsMissionDelay": {\r
        "message": "Затримка місії безаварійності"\r
    },\r
    "fsMissionDelayHelp": {\r
        "message": "Визначає затримку в секундах, як довго INAV має чекати перед активацією RTH безаварійності, якщо літальний апарат виконує місію за точками. Встановити -1, щоб повністю вимкнути безаварійність [0-600с]"\r
    },\r
    "drNavigation": {\r
        "message": "Навігація методом числення шляху"\r
    },\r
    "drNavigationHelp": {\r
        "message": "Дозволяє INAV продовжити навігацію (точка маршруту, повернення додому, крейсерський режим, утримання курсу тощо) під час короткочасних втрат сигналу GPS. Ця функція потребує увімкнення компаса та датчика повітряної швидкості на літальних апаратах з нерухомим крилом."\r
    },\r
    "rthAltitude": {\r
        "message": "Висота RTH"\r
    },\r
    "rthAltitudeHelp": {\r
        "message": "Використовується в таких режимах висоти повернення додому як \\"Extra\\" (додаткова), \\"Fixed\\" (фіксована) i \\"At Least\\" (як мінімум)"\r
    },\r
    "rthTrackBack": {\r
        "message": "Режим повернення за маршрутом"\r
    },\r
    "rthTrackBackHelp": {\r
        "message": "Коли увімкнено, літальний апарат спочатку буде летіти назад по останньому маршруту, перш ніж летіти безпосередньо до точки повернення. Літальні апарати з нерухомим крилом будуть летіти назад по маршруту з набором висоти, і без зниження. Режими використання для RTH Track Back. OFF = вимкнено, ON = Нормальний і Безаварійний RTH, FS = Тільки Безаварійний RTH."\r
    },\r
    "rthTrackBackDistance": {\r
        "message": "Відстань повернення по маршруту RTH"\r
    },\r
    "rthTrackBackDistanceHelp": {\r
        "message": "Відстань, пройдена під час зворотного маршруту. Нормальне повернення додому (RTH) виконується після перевищення цієї загальної відстані польоту [м]."\r
    },\r
    "rthSafeHome": {\r
        "message": "Режим безпечної точки повернення"\r
    },\r
    "rthSafeHomeHelp": {\r
        "message": "Використовується для керування, коли застосовуються безпечні точки повернення. Можливі значення: OFF, RTH та RTH_FS. Див. документацію Safehome (безпечні точки повернення) для отримання додаткової інформації."\r
    },\r
    "rthSafeHomeDistance": {\r
        "message": "Макс. відстань до безпечної точки повернення"\r
    },\r
    "rthSafeHomeDistanceHelp": {\r
        "message": "Щоб використовувати безпечну точка повернення, відстань від точки взведення повинна бути меншою за це значення [в см]."\r
    },\r
    "navMaxAltitude": {\r
        "message": "Максимальна висота для навігації"\r
    },\r
    "navMaxAltitudeHelp": {\r
        "message": "Максимальна дозволена висота (над точкою повернення), яка застосовується до всіх режимів NAV (включаючи режим утримання висоти). 0 означає, що обмеження відключене"\r
    },\r
    "rthHomeAltitudeLabel": {\r
        "message": "Висота повернення додому"\r
    },\r
    "rthHomeAltitudeHelp": {\r
        "message": "Використовується, коли посадка не відбувається в точці зльоту. Після прибуття в точку повернення літак буде тримати курс по колу і змінить висоту до висоти повернення додому. За замовчуванням 0, що означає, що функція вимкнена."\r
    },\r
    "rthTwoStage": {\r
        "message": "Метод етапу Спочатку Піднятись"\r
    },\r
    "rthTwoStageHelp": {\r
        "message": "Поетапна функція повернення додому, якщо увімкнено Спочатку Піднятись. Встановіть висоту першого етапу підйому на 0, щоб використовувати класичне однорівневе повернення додому."\r
    },\r
    "rthTwoStageAlt": {\r
        "message": "Висота етапу Спочатку Піднятись"\r
    },\r
    "rthTwoStageAltHelp": {\r
        "message": "Налаштування висоти для першого етапу поетапного повернення додому (RTH). Встановіть на 0 для вимкнення двоетапного повернення додому [0-65000см]"\r
    },\r
    "rthUseLinearDescent": {\r
        "message": "Використовувати лінійний спуск"\r
    },\r
    "rthUseLinearDescentHelp": {\r
        "message": "Якщо увімкнено, літальний апарат повільно знижуватиметься до висоти точки повернення додому (RTH) на етапі слідування додому в режимі RTH."\r
    },\r
    "rthLinearDescentStart": {\r
        "message": "Відстань початку лінійного зниження"\r
    },\r
    "rthLinearDescentStartHelp": {\r
        "message": "Це відстань від домашньої точки, на якій починатиметься лінійне зниження. Якщо встановлено значення 0, лінійне зниження почнеться негайно."\r
    },\r
    "landMaxAltVspd": {\r
        "message": "Літальний апарат почне знижуватися з цією швидкістю, як тільки досягне <strong>домашньої</strong> точки."\r
    },\r
    "landMaxAltVspdHelp": {\r
        "message": "Після повернення додому (RTH), якщо автоматичну посадку увімкнено, літальний апарат почне зниження на цій швидкості до досягнення <strong>висоти уповільнення</strong>"\r
    },\r
    "landSlowdownMaxAlt": {\r
        "message": "Коли апарат опуститься на <i>цю</i> висоту, він почне сповільнюватись для посадки."\r
    },\r
    "landSlowdownMaxAltHelp": {\r
        "message": "Коли літальний апарат досягне цієї висоти, він почне сповільнюватися лінійно між <strong>початковою швидкістю приземлення</strong> та <strong>кінцевою швидкістю приземлення</strong>, щоб досягти її на <strong>висотi для кiнцевого етапу заходу на посадку</strong>"\r
    },\r
    "landSlowdownMinAlt": {\r
        "message": "Коли апарат знизився до <i>цієї</i> висоти, його швидкість буде знижена до швидкості посадки."\r
    },\r
    "landMinAltVspd": {\r
        "message": "Це швидкість в момент приземлення."\r
    },\r
    "landMinAltVspdHelp": {\r
        "message": "Цільова швидкість зниження літального апарата буде дорівнювати цьому значенню, коли літальний апарат досягне <strong>Висоти на кінцевому етапі заходу на посадку</strong>, сповільнившись лінійно з <strong>Висоти сповільнення</strong> на <strong>Початковій швидкості посадки</strong>"\r
    },\r
    "emergencyDescentRate": {\r
        "message": "Швидкість аварійної посадки"\r
    },\r
    "cruiseThrottle": {\r
        "message": "Крейсерська тяга"\r
    },\r
    "cruiseYawRateLabel": {\r
        "message": "Крейсерська швидкість рискання"\r
    },\r
    "cruiseYawRateHelp": {\r
        "message": "Це швидкість повороту в режимах крейсерський і 3D крейсерський."\r
    },\r
    "cruiseManualThrottleLabel": {\r
        "message": "Дозволити ручне збільшення тяги"\r
    },\r
    "cruiseManualThrottleHelp": {\r
        "message": "Увімкнення цього параметра дозволить вам змінювати значення автоматичної тяги у всіх режимах навігації. Ви не можете зменшити значення автоматичної тяги, за винятком випадків, коли налаштовано функцію зупинки мотора при нульовій тязі."\r
    },\r
    "minThrottle": {\r
        "message": "Мін. тяга"\r
    },\r
    "maxThrottle": {\r
        "message": "Макс. тяга"\r
    },\r
    "maxBankAngle": {\r
        "message": "Макс. кут крену при навігації"\r
    },\r
    "maxBankAngleHelp": {\r
        "message": "Максимальний кут крену в режимах навігації. Обмежений максимальним кутом КРЕНУ у вкладці налаштування ПІД."\r
    },\r
    "maxClimbAngle": {\r
        "message": "Макс. кут підйому при навігації"\r
    },\r
    "maxClimbAngleHelp": {\r
        "message": "Максимальний кут підйому в режимах навігації. Обмежується максимальним кутом ТАНГАЖА на вкладці налаштування ПІД."\r
    },\r
    "navManualClimbRate": {\r
        "message": "Макс. швидкість підйому при утриманні висоти"\r
    },\r
    "navManualClimbRateHelp": {\r
        "message": "Максимальна швидкість підйому/зниження, дозволена прошивкою при обробці значення, яке вводить пілот для режиму управління ALTHOLD [см/с]"\r
    },\r
    "navAutoClimbRate": {\r
        "message": "Макс. швидкість підйому під час навігації"\r
    },\r
    "navAutoClimbRateHelp": {\r
        "message": "Максимальна швидкість підйому/зниження, яку дозволено досягти БПЛА під час навігаційних режимів. [см/с]"\r
    },\r
    "maxDiveAngle": {\r
        "message": "Макс. кут пікірування при навігації"\r
    },\r
    "maxDiveAngleHelp": {\r
        "message": "Максимальний кут пікірування у режимах навігації. Обмежується максимальним кутом ТАНГАЖА на вкладці налаштувань ПІД."\r
    },\r
    "pitchToThrottle": {\r
        "message": "Співвідношення тангажу до тяги"\r
    },\r
    "pitchToThrottleHelp": {\r
        "message": "В режимах навігації кожен градус підйому додасть стільки одиниць до крейсерської тяги. І навпаки, кожен градус зниження буде віднімати цю кількість одиниць від неї."\r
    },\r
    "minThrottleDownPitch": {\r
        "message": "Нахил вперед при мінімальній тязі"\r
    },\r
    "minThrottleDownPitchHelp": {\r
        "message": "Автоматичний кут тангажа вниз при нульовій тязі в режимі кут. Застосовується поступово між крейсерською тягою та нульовою тягою."\r
    },\r
    "pitchToThrottleSmoothing": {\r
        "message": "Згладжування тяги"\r
    },\r
    "pitchToThrottleSmoothingHelp": {\r
        "message": "Як плавно автопілот коригує рівень тяги у відповідь на зміни кута тангажа [0-9]."\r
    },\r
    "pitchToThrottleThreshold": {\r
        "message": "Поріг миттєвої корекції тяги"\r
    },\r
    "pitchToThrottleThresholdHelp": {\r
        "message": "Автопілот миттєво налаштує рівень тяги без згладжування відповідно до тангажа і тяги, якщо кут тангажа буде більше за фільтроване значення на таку кількість сотих градуса."\r
    },\r
    "loiterRadius": {\r
        "message": "Радіус баражування"\r
    },\r
    "loiterDirectionLabel": {\r
        "message": "Напрямок баражування"\r
    },\r
    "loiterDirectionHelp": {\r
        "message": "Це налаштування дозволяє вибрати напрямок баражування. Якщо вибрати РИСКАННЯ, то це дозволяє змінювати напрямок баражування за допомогою стіка рискання."\r
    },\r
    "controlSmoothness": {\r
        "message": "Плавність керування"\r
    },\r
    "controlSmoothnessHelp": {\r
        "message": "Наскільки плавно автопілот керує літаком для коригування помилки навігації [0-9]."\r
    },\r
    "wpTrackingAccuracy": {\r
        "message": "Точність відстеження точки маршруту"\r
    },\r
    "wpTrackingAccuracyHelp": {\r
        "message": "Мертва зона відстеження – наскільки точно літальний апарат слідує за шляховою точкою в метрах. Менші значення означають більш точне слідування, але викликають більше коригувань керування. 2 – хороше початкове значення [0-10]."\r
    },\r
    "wpTrackingAngle": {\r
        "message": "Кут відстеження точки маршруту"\r
    },\r
    "wpTrackingAngleHelp": {\r
        "message": "Кут, під яким апарат підходить до треку точки маршруту. Менші значення роблять підхід довшим, тоді як вищі значення можуть спричинити переліт. 60° є рекомендованим початковим значенням [30-80]."\r
    },\r
    "powerConfiguration": {\r
        "message": "Налаштування оцінки заряду батареї"\r
    },\r
    "idlePower": {\r
        "message": "Потужність холостого ходу"\r
    },\r
    "idlePowerHelp": {\r
        "message": "Споживання енергії при нульовій тязі, яке використовується для оцінки залишкового часу/відстані польоту, в одиницях 0.01 Вт"\r
    },\r
    "cruisePower": {\r
        "message": "Крейсерська потужність"\r
    },\r
    "cruisePowerHelp": {\r
        "message": "Споживання потужності при крейсерській тязі, що використовується для оцінки залишкового часу/відстані польоту в одиницях 0.01Вт"\r
    },\r
    "cruiseSpeed": {\r
        "message": "Крейсерська швидкість"\r
    },\r
    "cruiseSpeedHelp": {\r
        "message": "Швидкість літака/крила при крейсерській тязі, що використовується для оцінки залишкового часу польоту/відстані у см/с"\r
    },\r
    "rthEnergyMargin": {\r
        "message": "Запас енергії для повернення додому"\r
    },\r
    "rthEnergyMarginHelp": {\r
        "message": "Запас енергії необхідної після повернення додому (відсоток від ємності батареї). Використовується для розрахунку залишкового часу/відстані польоту."\r
    },\r
    "generalNavigationSettings": {\r
        "message": "Загальні налаштування навігації"\r
    },\r
    "waypointConfiguration": {\r
        "message": "Налаштування навігації по точках маршруту"\r
    },\r
    "wpLoadBoot": {\r
        "message": "Завантажити точки маршруту при включенні"\r
    },\r
    "wpLoadBootHelp": {\r
        "message": "Якщо увімкнено, задачі за точками маршруту в EEPROM будуть автоматично завантажені після включення."\r
    },\r
    "wpEnforceAlt": {\r
        "message": "Дотримуватися висоти на точці маршруту"\r
    },\r
    "wpEnforceAltHelp": {\r
        "message": "Забезпечує досягнення висоти в кожній точці маршруту перед переходом до наступної точки маршруту. Апарат залишатиметься на місці [баражуватиме якщо апарат з фіксованим крилом] та підніматиметься/знижуватиметься, доки висота не буде в межах встановленого діапазону [1-2000 см] від висоти точки маршруту. Встановіть значення [0], щоб вимкнути. Апаратам з фіксованим крилом не слід встановлювати значення нижче 500 см."\r
    },\r
    "waypointRadius": {\r
        "message": "Радіус точки маршруту"\r
    },\r
    "wpRestartMission": {\r
        "message": "Перезапуск місії за точками"\r
    },\r
    "wpRestartMissionHelp": {\r
        "message": "Налаштовує поведінку при перезапуску задачі за точками маршруту (WP), яку було перервано під час виконання. ПОЧАТИ з першої точки маршруту, ПРОДОВЖИТИ з останньої активної точки маршруту або ПЕРЕМИКАТИ між ПОЧАТИ і ПРОДОВЖИТИ кожного разу, коли знову обирається режим WP. ПЕРЕМИКАННЯ ефективно дозволяє продовжити тільки один раз з точки в середині місії, після чого місія розпочнеться з першої точки."\r
    },\r
    "wpTurnSmoothing": {\r
        "message": "Плавність повороту на точках маршруту"\r
    },\r
    "wpTurnSmoothingHelp": {\r
        "message": "Згладжує повороти під час місій за точками маршруту (WP) шляхом переходу до баражуючих поворотів на точках. При ввімкненні ON, апарат досягне точки під час повороту. При ввімкненні ON-CUT апарат зробить поворот раніше, не досягнувши точки фактично (зрізаючи кут)."\r
    },\r
    "navMotorStop": {\r
        "message": "Перевизначити зупинку мотора під час навігації"\r
    },\r
    "navMotorStopHelp": {\r
        "message": "Коли встановлено значення OFF, навігаційна система не буде контролювати мотор, якщо тяга на низькому рівні (мотор зупиниться). Коли встановлено значення OFF_ALWAYS, навігаційна система не буде контролювати мотор, якщо тяга була на низькому рівні, навіть коли спрацьовує безаварійнiсть. Коли встановлено значення AUTO_ONLY, навігаційна система буде контролювати тягу лише в автономних режимах навігації (NAV WP і NAV RTH). Коли встановлено значення ALL_NAV (за замовчуванням), навігаційна система повністю контролює мотор і не дозволяє йому зупинитися, навіть якщо тяга на низькому рівні. Ця настройка впливає тільки на NAV режими, які беруть під контроль тягу у поєднанні з MOTOR_STOP, і може призвести до зупинки, якщо fw_min_throttle_down_pitch налаштовано неправильно або оцінка тангажу є неправильною для моделей з нерухомим крилом, коли не встановлено значення ALL_NAV."\r
    },\r
    "soarMotorStop": {\r
        "message": "Зупинка мотора в режимі планерування"\r
    },\r
    "soarMotorStopHelp": {\r
        "message": "Зупиняє мотор, коли увімкнено режим Паріння."\r
    },\r
    "soarPitchDeadband": {\r
        "message": "Мертва зона тангажа в режимі паріння"\r
    },\r
    "soarPitchDeadbandHelp": {\r
        "message": "Мертва зона кута тангажа при увімкненому режимі планерування (градусів). Режим кут неактивний в межах мертвої зони, дозволяючи тангажу вільно коливатися під час планерування."\r
    },\r
    "altControlResponse": {\r
        "message": "Коефіцієнт відгуку контролю висоти"\r
    },\r
    "altControlResponseHelp": {\r
        "message": "Налаштовує відгук контролю висоти для нерухомого крила при наближенні до цільової висоти. Вищі значення підвищують чутливість контролю висоти, але можуть також спричинити надмірне перерегулювання або нестабільність тангажу, якщо встановлені занадто високими."\r
    },\r
    "waypointRadiusHelp": {\r
        "message": "Це встановлює допустиму відстань від точки маршруту, на якій вважається, що точку маршруту було досягнуто."\r
    },\r
    "waypointSafeDistance": {\r
        "message": "Безпечна відстань до точки маршруту"\r
    },\r
    "waypointSafeDistanceHelp": {\r
        "message": "Максимальна відстань між точкою повернення та першою точкою маршруту."\r
    },\r
    "fixedWingNavigationConfiguration": {\r
        "message": "Налаштування навігації для літачків"\r
    },\r
    "fixedWingLandingConfiguration": {\r
        "message": "Налаштування посадки літака з нерухомим крилом"\r
    },\r
    "MissionPlannerOnlyOneLandWp": {\r
        "message": "Ви можете встановити лише одну точку приземлення (LAND) в місії."\r
    },\r
    "fwLandApproachLength": {\r
        "message": "Відстань для остаточного заходження на посадку"\r
    },\r
    "fwLandApproachLengthHelp": {\r
        "message": "Довжина завершального заходу на посадку, включає фазу планування та перехоплення. Це відстань від безпечної точки повернення до останньої точки розвороту."\r
    },\r
    "fwLandFinalApproachPitch2throttle": {\r
        "message": "Коефіцієнт коригування співвідношення тангажа до тяги на остаточному заході на посадку"\r
    },\r
    "fwLandFinalApproachPitch2throttleHelp": {\r
        "message": "Це значення множиться на значення співвідношення тангаж/тяга під час остаточного заходу на посадку. Дозволяє зменшити швидкість."\r
    },\r
    "fwLandGlideAlt": {\r
        "message": "Початкова висота фази глісади"\r
    },\r
    "fwLandGlideAltHelp": {\r
        "message": "На цій висоті (виміряній від висоти точки посадки) двигун вимикається, і літальний апарат починає глісаду."\r
    },\r
    "fwLandFlareAlt": {\r
        "message": "Початкова висота фази вирівнювання"\r
    },\r
    "fwLandFlareAltHelp": {\r
        "message": "На цій висоті (виміряно від висоти точки посадки) виконується остання фаза посадки."\r
    },\r
    "fwLandGlidePitch": {\r
        "message": "Значення тангажу для фази глісади"\r
    },\r
    "fwLandGlidePitchHelp": {\r
        "message": "Цей кут тангажа утримується під час фази глісади."\r
    },\r
    "fwLandFlarePitch": {\r
        "message": "Значення тангажа для фази вирівнювання"\r
    },\r
    "fwLandFlarePitchHelp": {\r
        "message": "Цей кут тангажа тримається під час фази вирівнювання."\r
    },\r
    "fwLandMaxTailwind": {\r
        "message": "Максимальна швидкість попутного вітру"\r
    },\r
    "fwLandMaxTailwindHelp": {\r
        "message": "Це значення використовується, коли посадка проти вітру неможлива і швидкість вітру нижче цього значення ігнорується (неточності в вимірюванні вітру в INAV)."\r
    },\r
    "osd_unsupported_msg1": {\r
        "message": "Ваш польотний контролер не відповідає на команди наекранного меню. Це, ймовірно, означає, що він не має інтегрованого OSD чіпа."\r
    },\r
    "osd_unsupported_msg2": {\r
        "message": "Зауважте, що деякі польотні контролери мають вбудований <a href=\\"https://www.youtube.com/watch?v=ikKH_6SQ-Tk\\" target=\\"_blank\\">MinimOSD</a>, який може бути прошито та налаштовано за допомогою <a href=\\"https://github.com/ShikOfTheRa/scarab-osd/releases/latest\\" target=\\"_blank\\">scarab-osd</a>, однак MinimOSD не можна налаштувати за допомогою цього інтерфейса."\r
    },\r
    "osd_elements": {\r
        "message": "Елементи"\r
    },\r
    "osd_preview_title": {\r
        "message": "Попередній перегляд <span>(перетягніть для зміни положення)</span>"\r
    },\r
    "osd_preview_title_drag": {\r
        "message": ""\r
    },\r
    "osd_video_format": {\r
        "message": "Формат відео"\r
    },\r
    "osd_craft_name": {\r
        "message": "Назва повітряного судна"\r
    },\r
    "osd_pilot_name": {\r
        "message": "Ім'я пілота"\r
    },\r
    "osdElement_PILOT_LOGO_HELP": {\r
        "message": "Показує ваше маленьке лого пілота в наекранному меню, де ви його розмістите. Це вимагає спеціального шрифту з вашим лого пілота."\r
    },\r
    "osd_use_pilot_logo": {\r
        "message": "Використовувати логотип пілота"\r
    },\r
    "osd_use_large_pilot_logo_help": {\r
        "message": "Використовуйте свій великий логотип пілота з/замість логотипа INAV. Це вимагає власного шрифта з вашим логотипом пілота. Це видно на екрані взведення."\r
    },\r
    "osd_units": {\r
        "message": "Одиниці виміру"\r
    },\r
    "osd_main_voltage_decimals": {\r
        "message": "Десяткові розряди напруги"\r
    },\r
    "osd_decimals_altitude": {\r
        "message": "Десяткові знаки висоти"\r
    },\r
    "osd_decimals_distance": {\r
        "message": "Десяткові знаки відстані"\r
    },\r
    "osd_mah_precision": {\r
        "message": "Точність мАг"\r
    },\r
    "osd_coordinate_digits": {\r
        "message": "Цифри координат"\r
    },\r
    "osd_plus_code_digits": {\r
        "message": "Цифри плюс-коду"\r
    },\r
    "osd_plus_code_short": {\r
        "message": "Видалити початкові цифри з плюс-коду"\r
    },\r
    "osd_esc_rpm_precision": {\r
        "message": "Точність обертів ESC"\r
    },\r
    "osd_esc_rpm_precision_help": {\r
        "message": "Кількість цифр, що показуються для обертів мотора. Якщо оберти мотора перевищують кількість цифр, вони будуть показані в тисячах обертів за хвилину з максимально можливою кількістю десяткових знаків."\r
    },\r
    "osd_crosshairs_style": {\r
        "message": "Стиль перехрестя"\r
    },\r
    "osd_horizon_offset": {\r
        "message": "Зміщення AHI і HUD"\r
    },\r
    "osd_horizon_offset_help": {\r
        "message": "Переміщайте HUD і AHI вгору або вниз наекранного меню, щоб вирівняти їх з фактичним горизонтом. AHI може виглядати вище або нижче залежно від кута камери під час польоту. <span style='color:red;'>ПРИМІТКА: </span> Це не працює з Pixel OSD. Для цього використовуйте команду \`osd_ahi_vertical_offset\` в командному рядку."\r
    },\r
    "osd_left_sidebar_scroll": {\r
        "message": "Прокрутка лівої бічної панелі"\r
    },\r
    "osd_right_sidebar_scroll": {\r
        "message": "Прокрутка правої бічної панелі"\r
    },\r
    "osd_crsf_lq_format": {\r
        "message": "Формат LQ Crossfire"\r
    },\r
    "osd_sidebar_scroll_arrows": {\r
        "message": "Стрілки прокручування бічної панелі"\r
    },\r
    "osd_home_position_arm_screen": {\r
        "message": "Позиція Дім на екрані взведення"\r
    },\r
    "osd_hud_settings": {\r
        "message": "Налаштування екрану Heads-up"\r
    },\r
    "osd_custom_element_settings": {\r
        "message": "Користувацькі елементи OSD"\r
    },\r
    "osd_custom_element_settings_HELP": {\r
        "message": "Для отримання повної інформації про використання користувацьких елементів OSD натисніть тут ?"\r
    },\r
    "osd_custom_element_settings_icons_HELP": {\r
        "message": "Номери іконок можна знайти, натиснувши цю кнопку допомоги."\r
    },\r
    "custom_element": {\r
        "message": "Користувацький елемент"\r
    },\r
    "osd_hud_settings_HELP": {\r
        "message": "Цей розділ дозволяє налаштовувати поведінку елементів HUD."\r
    },\r
    "osd_hud_radar_disp": {\r
        "message": "Максимальна кількість елементів радара на екрані."\r
    },\r
    "osd_hud_radar_disp_help": {\r
        "message": "Це використовується для INAV Radar/FormationFlight. 0 вимикає цю функцію."\r
    },\r
    "osd_hud_radar_range_min": {\r
        "message": "Мінімальна дальність дії радару"\r
    },\r
    "osd_hud_radar_range_min_help": {\r
        "message": "Літаки, що знаходяться ближче цього значення, не будуть відображатися на HUD."\r
    },\r
    "osd_hud_radar_range_max": {\r
        "message": "Максимальна дальність дії радара"\r
    },\r
    "osd_hud_radar_range_max_help": {\r
        "message": "Літальні апарати, які знаходяться далі від цього радіуса, не будуть відображатися на HUD."\r
    },\r
    "osd_hud_wp_disp": {\r
        "message": "Максимальна кількість елементів точки маршруту на екрані."\r
    },\r
    "osd_hud_wp_disp_help": {\r
        "message": "Кількість точок маршруту для відображення на екрані. 0 вимикає цю функцію."\r
    },\r
    "osd_camera_uptilt": {\r
        "message": "Нахил камери догори"\r
    },\r
    "osd_camera_uptilt_help": {\r
        "message": "Встановіть кут підйому FPV камери в градусах відносно горизонталі, позитивний - вгору, негативний - вниз. Використовується для коректного відображення елементів HUD та індикатора штучного горизонту (коли увімкнено osd_ahi_camera_uptilt_comp=ON)."\r
    },\r
    "osd_camera_fov_h": {\r
        "message": "Кут горизонтального поля зору камери"\r
    },\r
    "osd_camera_fov_h_help": {\r
        "message": "Кут поля зору камери по горизонталі у градусах. Використовується для обчислення положення елементів на HUD-дисплеї."\r
    },\r
    "osd_camera_fov_v": {\r
        "message": "Кут вертикального поля зору камери"\r
    },\r
    "osd_camera_fov_v_help": {\r
        "message": "Кут вертикального поля зору камери в градусах. Використовується для розрахунку положення елементів в HUD-дисплеї."\r
    },\r
    "osd_alarms": {\r
        "message": "Сигналізація"\r
    },\r
    "osdLayoutDefault": {\r
        "message": "Розкладка за замовчуванням"\r
    },\r
    "osdLayoutAlternative": {\r
        "message": "Альтернативна розкладка #$1"\r
    },\r
    "osdUnitImperial": {\r
        "message": "Імперські"\r
    },\r
    "osdUnitMetric": {\r
        "message": "Метричні"\r
    },\r
    "osdUnitMetricMPH": {\r
        "message": "Метрична + миль за годину"\r
    },\r
    "osdUnitMetricMPHTip": {\r
        "message": "Використовуйте метричні одиниці, за винятком швидкості, яка відображається в милях на годину."\r
    },\r
    "osdUnitUK": {\r
        "message": "Англійська"\r
    },\r
    "osdUnitUKTip": {\r
        "message": "Використовувати англійську систему мір, за винятком температури, яка показується в градусах Цельсія."\r
    },\r
    "osdUnitGA": {\r
        "message": "Загальна авіація"\r
    },\r
    "osdUnitGATip": {\r
        "message": "Використовувати стандартні одиниці загальної авіації (не міжнародну систему одиниць): морські милі, фути, вузли, градуси Цельсія."\r
    },\r
    "osd_rssi_alarm": {\r
        "message": "RSSI (%)"\r
    },\r
    "osdAlarmBATT_CAP": {\r
        "message": "Використана батарея"\r
    },\r
    "osdAlarmBATT_CAP_HELP": {\r
        "message": "Індикатор використаної ємності батареї (використано мАг) буде блимати, коли загальне спожите значення мАг перевищить це значення. Потребує датчика струму. Нуль вимикає цю сигналізацію."\r
    },\r
    "osd_time_alarm": {\r
        "message": "Час польоту (хвилини)"\r
    },\r
    "osd_alt_alarm": {\r
        "message": "Висота"\r
    },\r
    "osd_dist_alarm": {\r
        "message": "Відстань"\r
    },\r
    "osdAlarmDIST_HELP": {\r
        "message": "Індикатор відстані до точки зльоту буде блимати, коли відстань буде більшою за це значення. Нуль вимикає цю сигналізацію."\r
    },\r
    "osd_neg_alt_alarm": {\r
        "message": "Негативна висота"\r
    },\r
    "osdAlarmMAX_NEG_ALTITUDE_HELP": {\r
        "message": "Індикатор висоти буде блимати, коли висота негативна, і її абсолютне значення перевищує значення на цій сигналізації. Корисно при зльоті, коли точка зльоту знаходиться на висоті. Значення нуль вимикає цю сигналізацію."\r
    },\r
    "osd_airspeed_min_alarm": {\r
        "message": "Мінімальна повітряна швидкість"\r
    },\r
    "osd_airspeed_min_alarm_HELP": {\r
        "message": "Покажчик повітряної швидкості буде блимати, коли швидкість повітря нижче цього порогу. Нуль вимикає цю сигналізацію."\r
    },\r
    "osd_airspeed_max_alarm": {\r
        "message": "Максимальна повітряна швидкість"\r
    },\r
    "osd_airspeed_max_alarm_HELP": {\r
        "message": "Покажчик повітряної швидкості буде блимати, коли повітряна швидкість вище цього порогу. Нуль вимикає цю сигналізацію."\r
    },\r
    "osd_gforce_alarm": {\r
        "message": "Перевантаження"\r
    },\r
    "osdAlarmGFORCE_HELP": {\r
        "message": "Елемент перевантаження почне блимати, коли це значення перевищене"\r
    },\r
    "osd_gforce_axis_alarm_min": {\r
        "message": "Мінімальне значення перевантаження відносно осі"\r
    },\r
    "osdAlarmGFORCE_AXIS_MIN_HELP": {\r
        "message": "Елементи перевантаження G на осях почнуть блимати, коли перевантаження опускається нижче цього значення"\r
    },\r
    "osd_gforce_axis_alarm_max": {\r
        "message": "Максимальне перевантаження відносно осі"\r
    },\r
    "osdAlarmGFORCE_AXIS_MAX_HELP": {\r
        "message": "Елементи перевантаження на осях почнуть блимати, коли перевантаження підійматися вище цього значення"\r
    },\r
    "osdAlarmADSB_MAX_DISTANCE_WARNING": {\r
        "message": "Відстань у метрах для літака з ADSB, яка відображається"\r
    },\r
    "osdAlarmADSB_MAX_DISTANCE_ALERT": {\r
        "message": "Відстань, на якій дані ADSB починають блимати для попередження про зближення"\r
    },\r
    "osd_current_alarm": {\r
        "message": "Струм (А)"\r
    },\r
    "osdAlarmCURRENT_HELP": {\r
        "message": "Елемент споживання струму почне блимати, коли споживання перевищить це значення. Нуль вимикає цю сигналізацію."\r
    },\r
    "osd_imu_temp_alarm_min": {\r
        "message": "Мінімальна температура ІВП"\r
    },\r
    "osd_imu_temp_alarm_max": {\r
        "message": "Максимальна температура ІВП"\r
    },\r
    "osd_baro_temp_alarm_min": {\r
        "message": "Мінімальна температура барометра"\r
    },\r
    "osd_baro_temp_alarm_max": {\r
        "message": "Максимальна температура барометра"\r
    },\r
    "osd_esc_temp_alarm_min": {\r
        "message": "Мінімальна температура регулятора обертів"\r
    },\r
    "osd_esc_temp_alarm_max": {\r
        "message": "Максимальна температура регулятора обертів"\r
    },\r
    "osd_snr_alarm": {\r
        "message": "Рівень сигналізації SNR"\r
    },\r
    "osdalarmSNR_HELP": {\r
        "message": "SNR відображається лише нижче цього значення. 0dB (співвідношення 1:1) означає, що отриманий сигнал дорівнює рівню шумів."\r
    },\r
    "osd_link_quality_alarm": {\r
        "message": "Сигналізація якості зв'язку"\r
    },\r
    "osdalarmLQ_HELP": {\r
        "message": "Для Crossfire використовуйте 70%. Для Tracer використовуйте 50%."\r
    },\r
    "osd_rssi_dbm_alarm": {\r
        "message": "Cигналізація RSSI в дБм"\r
    },\r
    "osd_adsb_distance_warning": {\r
        "message": "Попередження про відстань ADSB"\r
    },\r
    "osd_adsb_distance_alert": {\r
        "message": "Сповіщення про відстань ADSB"\r
    },\r
    "osd_rssi_dbm_alarm_HELP": {\r
        "message": "Індикатор RSSI блимає нижче цього значення. Діапазон: [-130,0]. Нуль вимикає цю сигналізацію."\r
    },\r
    "osdGroupGeneral": {\r
        "message": "Загальні"\r
    },\r
    "osdGroupAltitude": {\r
        "message": "Висота"\r
    },\r
    "osdGroupTimers": {\r
        "message": "Таймери"\r
    },\r
    "osdGroupGForce": {\r
        "message": "Перевантаження"\r
    },\r
    "osdGroupTemperature": {\r
        "message": "Температура"\r
    },\r
    "osdGroupAttitude": {\r
        "message": "Орієнтація"\r
    },\r
    "osdGroupCurrentMeter": {\r
        "message": "Вимірювач струму"\r
    },\r
    "osdGroupGPS": {\r
        "message": "GPS"\r
    },\r
    "osdGroupPowerLimits": {\r
        "message": "Межі потужності"\r
    },\r
    "osdGroupPIDs": {\r
        "message": "Налаштовувані значення RC"\r
    },\r
    "osdGroupPIDOutputs": {\r
        "message": "Результати ПІД-регуляторів"\r
    },\r
    "osdGroupVTX": {\r
        "message": "Відеопередавач"\r
    },\r
    "osdGroupRx": {\r
        "message": "Статистика приймача RX"\r
    },\r
    "osdGroupMapsAndRadars": {\r
        "message": "Карти та радарні системи"\r
    },\r
    "osdGroupMapsAndRadars_HELP": {\r
        "message": "Карти та радари дозволяють накладати додаткові елементи зверху, якщо вони не закривають жодну з видимих частин карти."\r
    },\r
    "osdElement_ONTIME_FLYTIME": {\r
        "message": "Час увімкнення / Час польоту"\r
    },\r
    "osdElement_RSSI_VALUE": {\r
        "message": "RSSI (Сила сигналу)"\r
    },\r
    "osdElement_RSSI_VALUE_HELP": {\r
        "message": "Показує якість сигналу, отриманого з пульта (чим вище, тим краще)."\r
    },\r
    "osdElement_MAIN_BATT_VOLTAGE": {\r
        "message": "Напруга батареї"\r
    },\r
    "osdElement_SAG_COMP_MAIN_BATT_VOLTAGE": {\r
        "message": "Напруга батареї з врахуванням компенсації падіння напруги"\r
    },\r
    "osdElement_SAG_COMP_MAIN_BATT_VOLTAGE_HELP": {\r
        "message": "Розрахунок напруги, яку повинна мати батарея без навантаження (симулює ідеальну батарею)"\r
    },\r
    "osdElement_MESSAGES": {\r
        "message": "Системні повідомлення"\r
    },\r
    "osdElement_MESSAGES_HELP": {\r
        "message": "Показує різні системні повідомлення, такі як попередження, збої апаратного забезпечення та розширені деталі поточного режиму польоту (наприклад, режими AUTOTUNE і AUTOTRIM та етапи RTH)."\r
    },\r
    "osdElement_MAIN_BATT_CELL_VOLTAGE": {\r
        "message": "Напруга комірки батареї"\r
    },\r
    "osdElement_SAG_COMP_MAIN_BATT_CELL_VOLTAGE": {\r
        "message": "Скомпенсована напруга комірки батареї"\r
    },\r
    "osdElement_SAG_COMP_MAIN_BATT_CELL_VOLTAGE_HELP": {\r
        "message": "Розрахована середня напруга комірки, при якій батарея повинна бути без навантаження (імітує ідеальну батарею)"\r
    },\r
    "osdElement_MAIN_BATT_REMAINING_PERCENTAGE": {\r
        "message": "Відсоток залишку батареї"\r
    },\r
    "osdElement_MAIN_BATT_REMAINING_CAPACITY": {\r
        "message": "Залишкова ємність батареї"\r
    },\r
    "osdElement_REMAINING_FLIGHT_TIME_HELP": {\r
        "message": "Очікуваний залишковий час польоту до того, як літальний апарат повинен почати повертатися додому, на основі розрахунку залишкової енергії батареї, середньої потужності та відстані до точки зльоту (тільки для фіксованого крила, будь ласка, прочитайте документацію)"\r
    },\r
    "osdElement_REMAINING_FLIGHT_DISTANCE_HELP": {\r
        "message": "Очікувана залишкова відстань польоту, яку може подолати літальний апарат, перш ніж йому потрібно повернутися додому, на основі розрахунку залишкової енергії батареї, середньої потужності та відстані до точки зльоту (тільки для літака, будь ласка, ознайомтесь з документацією)"\r
    },\r
    "osdElement_MAIN_BATT_CELL_VOLTAGE_HELP": {\r
        "message": "Відображає середню напругу комірки з основної батареї"\r
    },\r
    "osdElement_MAH_DRAWN": {\r
        "message": "мАг використано"\r
    },\r
    "osdElement_EFFICIENCY_MAH": {\r
        "message": "Ефективність мАг/км"\r
    },\r
    "osdElement_EFFICIENCY_WH": {\r
        "message": "Ефективність Вт·г/км"\r
    },\r
    "osdElement_PLIMIT_REMAINING_BURST_TIME": {\r
        "message": "Залишок часу пікового навантаження"\r
    },\r
    "osdElement_PLIMIT_ACTIVE_CURRENT_LIMIT": {\r
        "message": "Чинне обмеження струму"\r
    },\r
    "osdElement_PLIMIT_ACTIVE_POWER_LIMIT": {\r
        "message": "Чинне обмеження потужності"\r
    },\r
    "osdElement_THROTTLE_POSITION_HELP": {\r
        "message": "Показує положення стіка тяги в режимах польоту, де <i>він</i> контролює тяговий вихід. У навігаційних режимах показує значення тяги, задане INAV."\r
    },\r
    "osdElement_SCALED_THROTTLE_POSITION_HELP": {\r
        "message": "Показує положення стіка тяги в режимах польоту, де <i>він</i> контролює вихід тяги. У навігаційних режимах показується значення тяги, задане INAV. Ця тяга масштабується на основі холостої тяги та максимальної тяги."\r
    },\r
    "osdElement_GPS_SPEED": {\r
        "message": "Швидкість відносно землі"\r
    },\r
    "osdElement_GPS_SPEED_HELP": {\r
        "message": "Показує швидкість GPS відносно землі."\r
    },\r
    "osdElement_GPS_MAX_SPEED": {\r
        "message": "Максимальна швидкість за GPS"\r
    },\r
    "osdElement_GPS_MAX_SPEED_HELP": {\r
        "message": "Показує найвищу наземну швидкість за GPS."\r
    },\r
    "osdElement_MSL_ALTITUDE": {\r
        "message": "Висота над рівнем моря"\r
    },\r
    "osdElement_MSL_ALTITUDE_HELP": {\r
        "message": "Висота над рівнем моря"\r
    },\r
    "osdElement_3D_SPEED": {\r
        "message": "3D Швидкість"\r
    },\r
    "osdElement_3D_SPEED_HELP": {\r
        "message": "Показує тривимірну швидкість, враховуючи як горизонтальну, так і вертикальну швидкість."\r
    },\r
    "osdElement_3D_MAX_SPEED": {\r
        "message": "Максимальна 3D швидкість"\r
    },\r
    "osdElement_3D_MAX_SPEED_HELP": {\r
        "message": "Показує найвищу 3D швидкість, враховуючи як горизонтальну, так і вертикальну швидкість."\r
    },\r
    "osdElement_AIR_MAX_SPEED": {\r
        "message": "Максимальна повітряна швидкість"\r
    },\r
    "osdElement_AIR_MAX_SPEED_HELP": {\r
        "message": "Показує найвищу повітряну швидкість."\r
    },\r
    "osdElement_GPS_SATS": {\r
        "message": "Супутники GPS"\r
    },\r
    "osdElement_GPS_SATS_HELP": {\r
        "message": "Показує кількість GPS супутників, виявлених GPS-приймачем."\r
    },\r
    "osdElement_GPS_HDOP": {\r
        "message": "Горизонтальне погіршення точності GPS"\r
    },\r
    "osdElement_GPS_HDOP_HELP": {\r
        "message": "Показує горизонтальне розсіювання точності даних GPS. Чим нижче значення, тим точнішим є фіксація положення за GPS."\r
    },\r
    "osdElement_PLUS_CODE": {\r
        "message": "Плюс-код (широта + довгота)"\r
    },\r
    "osdElement_PLUS_CODE_HELP": {\r
        "message": "Коди плюс кодують як широту, так і довготу в одному значенні, яке можна ввести безпосередньо в Google Maps. Вони забезпечують такий самий рівень точності, як і широта та довгота, при цьому займаючи менше екранного простору."\r
    },\r
    "osdElement_AZIMUTH": {\r
        "message": "Азимут"\r
    },\r
    "osdElement_AZIMUTH_HELP": {\r
        "message": "Азимут - це напрямок літального апарата відносно домашньої точки. Це корисно для збереження правильного курсу літального апарата або для утримання літального апарата перед фіксованою спрямованою антеною."\r
    },\r
    "osdElement_TRIP_DIST": {\r
        "message": "Відстань подорожі"\r
    },\r
    "osdElement_VARIO_HELP": {\r
        "message": "Показує вертикальну швидкість за допомогою стрілок вгору або вниз. Кожна стрілка представляє 10 см (~4 дюйми) на секунду."\r
    },\r
    "osdElement_VERTICAL_SPEED_INDICATOR": {\r
        "message": "Вказівник вертикальної швидкості"\r
    },\r
    "osdElement_VERTICAL_SPEED_INDICATOR_HELP": {\r
        "message": "Показує числом вертикальну швидкість"\r
    },\r
    "osdElement_G_FORCE": {\r
        "message": "Перевантаження (g)"\r
    },\r
    "osdElement_G_FORCE_HELP": {\r
        "message": "Показує перевантаження з урахуванням усіх осей"\r
    },\r
    "osdElement_G_FORCE_X": {\r
        "message": "Поздовжнє перевантаження в системі координат судна (X)"\r
    },\r
    "osdElement_G_FORCE_X_HELP": {\r
        "message": "Показує перевантаження по осі X (поздовжнє)"\r
    },\r
    "osdElement_G_FORCE_Y": {\r
        "message": "Бічне перевантаження в системі координат судна (Y)"\r
    },\r
    "osdElement_G_FORCE_Y_HELP": {\r
        "message": "Показує перевантаження по осі Y (бічне)"\r
    },\r
    "osdElement_G_FORCE_Z": {\r
        "message": "Вертикальне перевантаження в системі координат судна (Z)"\r
    },\r
    "osdElement_G_FORCE_Z_HELP": {\r
        "message": "Показує перевантаження по осі Z (вертикальній)"\r
    },\r
    "osdElement_ROLL_PIDS": {\r
        "message": "Елементи ПІД крену"\r
    },\r
    "osdElement_PITCH_PIDS": {\r
        "message": "Елементи ПІД тангажа"\r
    },\r
    "osdElement_YAW_PIDS": {\r
        "message": "Елементи ПІД рискання"\r
    },\r
    "osdElement_ONTIME_FLYTIME_HELP": {\r
        "message": "Показує \\"Час увімкнення\\" коли не взведений і \\"Час польоту\\" коли взведений."\r
    },\r
    "osdElement_RTC_TIME": {\r
        "message": "Час доби"\r
    },\r
    "osdElement_RTC_TIME_HELP": {\r
        "message": "Відображає поточний час, отриманий від GPS або заданий через радіопередавач."\r
    },\r
    "osdElement_RC_SOURCE": {\r
        "message": "Джерело радіокерування"\r
    },\r
    "osdElement_RC_SOURCE_HELP": {\r
        "message": "Показує поточне джерело радіокерування, STD (при роботі від приймача) або MSP (корисно при використанні заміщення MSP)"\r
    },\r
    "osdElement_VTX_POWER": {\r
        "message": "Рівень потужності відеопередавача"\r
    },\r
    "osdElement_VTX_POWER_HELP": {\r
        "message": "Показує поточний рівень потужності відеопередавача. Блимає, коли відбувається зміна через радіокерування"\r
    },\r
    "osdElement_ESC_RPM": {\r
        "message": "Оберти мотора за телеметрією ESC"\r
    },\r
    "osdElement_GLIDESLOPE": {\r
        "message": "Глісада"\r
    },\r
    "osdElement_GLIDESLOPE_HELP": {\r
        "message": "Кількість горизонтальної відстані, пройденої на одиницю втраченої висоти"\r
    },\r
    "osdElement_PAN_SERVO_CENTRED": {\r
        "message": "Центрування сервоприводу панорамування"\r
    },\r
    "osdElement_PAN_SERVO_CENTRED_HELP": {\r
        "message": "Відображає, чи панорамний сервопривід перебуває в центрі (0) або зміщений (стрілки). Перевірте налаштування <b>osd_pan_servo_</b> для конфігурації сервоприводу панорамування."\r
    },\r
    "osdElement_VTX_CHANNEL": {\r
        "message": "Діапазон та канал відеопередавача"\r
    },\r
    "osdElement_VTX_CHANNEL_HELP": {\r
        "message": "Показує поточний діапазон і канал відеопередавача. Потребує або відеопередавач зі SmartAudio чи Tramp, або відеопередавач, інтегрований у польотний контролер."\r
    },\r
    "osdElement_RSSI_DBM": {\r
        "message": "Значення RX RSSI в дБм"\r
    },\r
    "osdElement_LQ_UPLINK": {\r
        "message": "Якість з'єднання від RX до TX %"\r
    },\r
    "osdElement_LQ_UPLINK_HELP": {\r
        "message": "Якщо використовується CRSF, використовуйте налаштування формату LQ Crossfire для вибору типу формату."\r
    },\r
    "osdElement_LQ_DOWNLINK": {\r
        "message": "Якість каналу від TX до RX %"\r
    },\r
    "osdElement_SNR_DB": {\r
        "message": "SNR каналу від RX до TX у дБ"\r
    },\r
    "osdElement_SNR_DB_HELP": {\r
        "message": "Показується лише коли SNR (співвідношення сигнал/шум) опускається нижче рівня попередження. При 0 дБ рівень прийнятого сигналу дорівнює рівню шуму."\r
    },\r
    "osdElement_TX_POWER_UPLINK": {\r
        "message": "Потужність передавача в мВт"\r
    },\r
    "osdElement_OSD_RX_POWER_DOWNLINK": {\r
        "message": "Потужність приймача в мВт"\r
    },\r
    "osdElement_MAP_NORTH": {\r
        "message": "Карта (північ вгорі)"\r
    },\r
    "osdElement_MAP_TAKEOFF": {\r
        "message": "Карта (вгорі напрямок зльоту)"\r
    },\r
    "osdElement_RADAR": {\r
        "message": "Радар"\r
    },\r
    "osdElement_MAP_SCALE": {\r
        "message": "Масштаб карти"\r
    },\r
    "osdElement_MAP_SCALE_HELP": {\r
        "message": "Масштаб поточної зображеної карти/радара."\r
    },\r
    "osdElement_MAP_REFERENCE": {\r
        "message": "Орієнтир на карті"\r
    },\r
    "osdElement_MAP_REFERENCE_HELP": {\r
        "message": "Орієнтир на карті (напрямок, що вказує вгору) поточної карти. N для Півночі і T для напрямку зльоту."\r
    },\r
    "osdElement_FORMATION_FLIGHT": {\r
        "message": "Радар Inav зафіксовано"\r
    },\r
    "osdElement_FORMATION_FLIGHT_HELP": {\r
        "message": "Найближчий літальний апарат з радара Inav/груповий політ"\r
    },\r
    "osdElement_WIND_SPEED_HORIZONTAL": {\r
        "message": "Горизонтальна швидкість вітру"\r
    },\r
    "osdElement_WIND_SPEED_HORIZONTAL_HELP": {\r
        "message": "Показує розрахункову горизонтальну швидкість та напрямок вітру."\r
    },\r
    "osdElement_WIND_SPEED_VERTICAL": {\r
        "message": "Вертикальна швидкість вітру"\r
    },\r
    "osdElement_WIND_SPEED_VERTICAL_HELP": {\r
        "message": "Показує оцінену вертикальну швидкість та напрям вітру (вгору або вниз)."\r
    },\r
    "osdElement_ACTIVE_PROFILE": {\r
        "message": "Показати активний профіль"\r
    },\r
    "osdElement_LEVEL_PIDS": {\r
        "message": "Рівень ПІД"\r
    },\r
    "osdElement_POS_XY_PIDS": {\r
        "message": "ПІД позиції XY"\r
    },\r
    "osdElement_POS_Z_PIDS": {\r
        "message": "ПІД позиції Z"\r
    },\r
    "osdElement_VEL_XY_PIDS": {\r
        "message": "ПІД швидкості XY"\r
    },\r
    "osdElement_VEL_Z_PIDS": {\r
        "message": "ПІД швидкості Z"\r
    },\r
    "osdElement_FW_ALT_PID_OUTPUTS": {\r
        "message": "Результати ПІД регулятора висоти FW"\r
    },\r
    "osdElement_FW_POS_PID_OUTPUTS": {\r
        "message": "Результати ПІД регулятора положення FW"\r
    },\r
    "osdElement_MC_VEL_X_PID_OUTPUTS": {\r
        "message": "Результати ПІД регулятора швидкості мультикоптера по осі X"\r
    },\r
    "osdElement_MC_VEL_Y_PID_OUTPUTS": {\r
        "message": "Результати ПІД регулятора швидкості мультикоптера по осі Y"\r
    },\r
    "osdElement_MC_VEL_Z_PID_OUTPUTS": {\r
        "message": "Результати ПІД регулятора швидкості мультикоптера по осі Z"\r
    },\r
    "osdElement_MC_POS_XYZ_P_OUTPUTS": {\r
        "message": "Результати П регулятора положення XYZ мультикоптера"\r
    },\r
    "osdElement_IMU_TEMPERATURE": {\r
        "message": "Температура ІВП"\r
    },\r
    "osdElement_IMU_TEMPERATURE_HELP": {\r
        "message": "Температура інерційного вимірювального пристрою"\r
    },\r
    "osdElement_BARO_TEMPERATURE": {\r
        "message": "Температура барометра"\r
    },\r
    "osdElement_BARO_TEMPERATURE_HELP": {\r
        "message": "Температура барометра"\r
    },\r
    "osdElement_ESC_TEMPERATURE": {\r
        "message": "Температура ESC"\r
    },\r
    "osdElement_ESC_TEMPERATURE_HELP": {\r
        "message": "Температура ESC, отримана з телеметрії DSHOT"\r
    },\r
    "osdGroupSwitchIndicators": {\r
        "message": "Індикатори перемикачів"\r
    },\r
    "osdElement_SWITCH_INDICATOR_0": {\r
        "message": "Індикатор перемикача 1"\r
    },\r
    "osdElement_SWITCH_INDICATOR_1": {\r
        "message": "Індикатор перемикача 2"\r
    },\r
    "osdElement_SWITCH_INDICATOR_2": {\r
        "message": "Індикатор перемикача 3"\r
    },\r
    "osdElement_SWITCH_INDICATOR_3": {\r
        "message": "Індикатор перемикача 4"\r
    },\r
    "osd_pan_servo_settings": {\r
        "message": "Налаштування OSD панорамного сервоприводу"\r
    },\r
    "osd_pan_servo_settings_HELP": {\r
        "message": "Цей розділ вмикає та налаштовує функцію зміщення панорамного сервоприводу. Вона використовується для того, щоб елементи наекранного меню, такі як стрілка до домашньої точки та POI, вказували або були спрямовані у правильний напрямок. Навіть якщо ви обертали камеру."\r
    },\r
    "osdPanServoIndex": {\r
        "message": "Вихід панорамного сервоприводу"\r
    },\r
    "osdPanServoIndex_HELP": {\r
        "message": "Встановіть номер виходу сервоприводу панорамування відповідно до таблиці виходів мікшера. Наприклад, вихід S6."\r
    },\r
    "osdPanServoRangeDecadegrees": {\r
        "message": "Загальна кількість градусів руху сервоприводу панорамування"\r
    },\r
    "osdPanServoRangeDecadegrees_HELP": {\r
        "message": "Кут обертання сервопривода панорамування. Для сервопривода з діапазоном обертання 180 градусів зазвичай потрібно встановити значення 180. Задайте від’ємне значення, щоб змінити напрям обертання."\r
    },\r
    "osdPanServoIndicatorShowDegrees": {\r
        "message": "Показувати градуси зміщення поруч з індикатором панорамування"\r
    },\r
    "osdPanServoOffcentreWarning": {\r
        "message": "Попередження про зміщення від центру"\r
    },\r
    "osdPanServoOffcentreWarning_HELP": {\r
        "message": "Градусів з будь-якої зі сторін від центру панорамного сервоприводу; де передбачається, що камера повинна дивитися вперед, але не знаходиться в положенні 0. Якщо камера перебуває в цьому діапазоні і не в положенні 0 протягом більше ніж 10 секунд, елемент зміщення панорамного сервоприводу буде блимати. Значення 0 означає, що попередження вимкнено."\r
    },\r
    "osdGroupOSDCustomElements": {\r
        "message": "Користувацькі елементи OSD"\r
    },\r
    "osdGroupGVars": {\r
        "message": "Глобальні змінні"\r
    },\r
    "osdElement_GVAR_0": {\r
        "message": "Глобальна змінна 0"\r
    },\r
    "osdElement_GVAR_1": {\r
        "message": "Глобальна змінна 1"\r
    },\r
    "osdElement_GVAR_2": {\r
        "message": "Глобальна змінна 2"\r
    },\r
    "osdElement_GVAR_3": {\r
        "message": "Глобальна змінна 3"\r
    },\r
    "osdElement_SENSOR1_TEMPERATURE": {\r
        "message": "Датчик температури 1"\r
    },\r
    "osdElement_SENSOR2_TEMPERATURE": {\r
        "message": "Датчик температури 2"\r
    },\r
    "osdElement_SENSOR3_TEMPERATURE": {\r
        "message": "Датчик температури 3"\r
    },\r
    "osdElement_SENSOR4_TEMPERATURE": {\r
        "message": "Температурний датчик 4"\r
    },\r
    "osdElement_SENSOR5_TEMPERATURE": {\r
        "message": "Датчик температури 5"\r
    },\r
    "osdElement_SENSOR6_TEMPERATURE": {\r
        "message": "Датчик температури 6"\r
    },\r
    "osdElement_SENSOR7_TEMPERATURE": {\r
        "message": "Датчик температури 7"\r
    },\r
    "osdElement_SENSOR8_TEMPERATURE": {\r
        "message": "Датчик температури 8"\r
    },\r
    "osdSettingMainVoltageDecimals": {\r
        "message": "Десяткові розряди основної напруги"\r
    },\r
    "osdElement_OSD_RANGEFINDER": {\r
        "message": "Відстань далекоміра"\r
    },\r
    "osdElement_COURSE_NEXT_GEOZONE": {\r
        "message": "Курс до наступної геозони"\r
    },\r
    "osdElement_HOR_DIST_TO_NEXT_GEOZONE": {\r
        "message": "Горизонтальна відстань до наступної геозони"\r
    },\r
    "osdElement_VERT_DIST_TO_NEXT_GEOZONE": {\r
        "message": "Вертикальна відстань до наступної геозони"\r
    },\r
    "osdSettingPLUS_CODE_DIGITS_HELP": {\r
        "message": "Точність на екваторі: 10=13,9x13,9м; 11=2,8x3,5м; 12=56x87см; 13=11x22см."\r
    },\r
    "osdSettingPLUS_CODE_SHORT_HELP": {\r
        "message": "Вилучення 2, 4 і 6 перших цифр потребує референтного розташування в межах, відповідно, ~800 км, ~40 км та ~2 км для відновлення оригінальних координат."\r
    },\r
    "osdSettingCRSF_LQ_FORMAT_HELP": {\r
        "message": "TYPE1 показує LQ% як використовується апаратним забезпеченням TBS. TYPE2 показує режими профілю RF (2=150Гц, 1=50Гц, 0=4Гц частота оновлення) та LQ % [0..100%]. Tracer показує RFMode 1 (1=250Гц) та LQ % [0..100%]."\r
    },\r
    "osd_video_show_guides": {\r
        "message": "Показати орієнтири видимої зони"\r
    },\r
    "osd_video_HELP": {\r
        "message": "Для HD: червоні лінії показують екран формату 4:3, HDZero: тримайтеся в межах синьої рамки для вищої частоти оновлення, AUTO/PAL: зелена лінія є межею NTSC."\r
    },\r
    "osd_dji_HD_FPV": {\r
        "message": "DJI HD FPV"\r
    },\r
    "osd_dji_hide_unsupported": {\r
        "message": "Сховати непідтримувані елементи"\r
    },\r
    "osd_dji_ESC_temp": {\r
        "message": "Джерело <i>температури ESC</i>"\r
    },\r
    "osd_dji_RSSI_source": {\r
        "message": "Джерело <i>RSSI</i>"\r
    },\r
    "osd_dji_GPS_source": {\r
        "message": "Джерело <i>швидкості GPS</i>"\r
    },\r
    "osd_dji_speed_source": {\r
        "message": "Джерело <i>3D швидкості</i>"\r
    },\r
    "osd_dji_use_craft_name_elements": {\r
        "message": "Використовувати ім'я апарата для повідомлень та додаткових елементів.</span><br/>Елементи <span class=\\"blue\\">синього</span> кольору з'являються в імені апарата."\r
    },\r
    "osd_dji_adjustments": {\r
        "message": "Показати коригування в імені судна"\r
    },\r
    "osd_dji_cn_alternating_duration": {\r
        "message": "Тривалість чергування назви апарату (в 1/10 сек)"\r
    },\r
    "osd_switch_indicator_settings": {\r
        "message": "Налаштування індикатора перемикача"\r
    },\r
    "osd_switch_indicator_settings_HELP": {\r
        "message": "Рекомендується використовувати користувацькі елементи OSD замість індикаторів перемикачів. Вони набагато потужніші. Натисніть, щоб побачити приклад."\r
    },\r
    "osd_switch_indicators_align_left": {\r
        "message": "Вирівняти назви перемикачів зліва від перемикачів"\r
    },\r
    "osdSwitchInd0": {\r
        "message": "Перемикач 1"\r
    },\r
    "osdSwitchInd1": {\r
        "message": "Перемикач 2"\r
    },\r
    "osdSwitchInd2": {\r
        "message": "Перемикач 3"\r
    },\r
    "osdSwitchInd3": {\r
        "message": "Перемикач 4"\r
    },\r
    "osd_font_default": {\r
        "message": "За замовчуванням"\r
    },\r
    "osd_font_vision": {\r
        "message": "Vision"\r
    },\r
    "osd_font_impact": {\r
        "message": "Impact"\r
    },\r
    "osd_font_impact_mini": {\r
        "message": "Impact mini"\r
    },\r
    "osd_font_clarity": {\r
        "message": "Чіткість"\r
    },\r
    "osd_font_clarity_medium": {\r
        "message": "Чіткість середня"\r
    },\r
    "osd_font_bold": {\r
        "message": "Жирний"\r
    },\r
    "osd_font_large": {\r
        "message": "Великий"\r
    },\r
    "osd_font_load_file": {\r
        "message": "Відкрити файл шрифту"\r
    },\r
    "osd_font_upload": {\r
        "message": "Завантажити шрифт"\r
    },\r
    "osd_font_manager": {\r
        "message": "Менеджер шрифтів для аналога"\r
    },\r
    "uploadingCharacters": {\r
        "message": "Завантаження..."\r
    },\r
    "uploadedCharacters": {\r
        "message": "Завантажено $1 символів"\r
    },\r
    "portsIdentifier": {\r
        "message": "Ідентифікатор"\r
    },\r
    "portsConfiguration": {\r
        "message": "Дані"\r
    },\r
    "portsTelemetryOut": {\r
        "message": "Телеметрія"\r
    },\r
    "portsSerialRx": {\r
        "message": "RX"\r
    },\r
    "portColumnSensors": {\r
        "message": "Датчики"\r
    },\r
    "portsPeripherals": {\r
        "message": "Периферія"\r
    },\r
    "appUpdateNotificationHeader": {\r
        "message": "Доступна новіша версія Конфігуратора."\r
    },\r
    "appUpdateNotificationDescription": {\r
        "message": "Будь ласка, відвідайте<a href=\\"https://github.com/iNavFlight/inav-configurator/releases\\" target=\\"_blank\\">вебсайт</a>, щоб прочитати примітки до релізу та завантажити."\r
    },\r
    "closeUpdateBtn": {\r
        "message": "Закрити"\r
    },\r
    "downloadUpdatesBtn": {\r
        "message": "Завантажити новий додаток"\r
    },\r
    "tabMissionControl": {\r
        "message": "Керування місією"\r
    },\r
    "loadMissionButton": {\r
        "message": "Завантажити місію з польотного контролера"\r
    },\r
    "saveMissionButton": {\r
        "message": "Зберегти місію на польотний контролер"\r
    },\r
    "loadEepromMissionButton": {\r
        "message": "Завантажити місію з Eeprom"\r
    },\r
    "saveEepromMissionButton": {\r
        "message": "Зберегти місію в Eeprom"\r
    },\r
    "loadFileMissionButton": {\r
        "message": "Завантажити файл"\r
    },\r
    "saveFileMissionButton": {\r
        "message": "Зберегти файл"\r
    },\r
    "missionSettingsSave": {\r
        "message": "Зберегти"\r
    },\r
    "missionSettingsCancel": {\r
        "message": "Скасувати"\r
    },\r
    "editPointHead": {\r
        "message": "Редагувати точку"\r
    },\r
    "editPointButtonSave": {\r
        "message": "Зберегти"\r
    },\r
    "editPointButtonRemove": {\r
        "message": "Видалити"\r
    },\r
    "removeAllPointButtonSave": {\r
        "message": "Видалити всі точки"\r
    },\r
    "missionTotalInformationHead": {\r
        "message": "Загальна інформація"\r
    },\r
    "missionTotalInfoFilenameLoaded": {\r
        "message": "Завантажено файл:"\r
    },\r
    "missionTotalInfoDistance": {\r
        "message": "Відстань (м):"\r
    },\r
    "missionTotalInfoAvailablePoints": {\r
        "message": "Доступні точки"\r
    },\r
    "missionTotalInfoMissionValid": {\r
        "message": "Місія дійсна"\r
    },\r
    "missionDefaultPointAlt": {\r
        "message": "Висота (см):"\r
    },\r
    "missionDefaultPointSpeed": {\r
        "message": "Швидкість (см/с):"\r
    },\r
    "missionDefaultSafeRangeSH": {\r
        "message": "Радіус (м):"\r
    },\r
    "missionMultiMissionsInfo": {\r
        "message": "Інформація про місії:"\r
    },\r
    "missionMultiActiveMission": {\r
        "message": "Активна місія:"\r
    },\r
    "missionMultiMissionNo": {\r
        "message": "Місія №"\r
    },\r
    "missionMultiUpdateAll": {\r
        "message": "Оновити все"\r
    },\r
    "missionMultiAddNewMission": {\r
        "message": "Додати нову місію"\r
    },\r
    "missionEllipsoidEarthDEMModel": {\r
        "message": "Використовувати еліпсоїд замість SL DEM:"\r
    },\r
    "SafehomeLegend": {\r
        "message": "Легенда : "\r
    },\r
    "SafehomeMaxDistance": {\r
        "message": "Макс. відстань (м):"\r
    },\r
    "SafehomeSafeRadius": {\r
        "message": "Безпечний радіус (м):"\r
    },\r
    "SafehomeFwAppraoch": {\r
        "message": "Наближення FW:"\r
    },\r
    "safehomeEdit": {\r
        "message": "Редагувати безпечну точку повернення"\r
    },\r
    "missionTitleHide": {\r
        "message": "Приховати"\r
    },\r
    "missionTitleCancel": {\r
        "message": "Скасувати"\r
    },\r
    "missionTitleSave": {\r
        "message": "Зберегти"\r
    },\r
    "missionTitlRemove": {\r
        "message": "Вилучити"\r
    },\r
    "missionTitleLoadMissionFile": {\r
        "message": "Завантажити файл місії"\r
    },\r
    "missionTitleSaveMissionFile": {\r
        "message": "Зберегти файл місії"\r
    },\r
    "missionTitleLoadMissionFromFC": {\r
        "message": "Завантажити місію з польотного контролера"\r
    },\r
    "missionTitleSaveMissionToFC": {\r
        "message": "Зберегти місію до польотного контролера"\r
    },\r
    "missionTitleLoadEepromMission": {\r
        "message": "Завантажити місію з Eeprom"\r
    },\r
    "missionTitleSaveEepromMission": {\r
        "message": "Зберегти місію в Eeprom"\r
    },\r
    "missionTitleDelete": {\r
        "message": "Видалити"\r
    },\r
    "missionTitleRemoveAll": {\r
        "message": "Видалити все"\r
    },\r
    "missionTitleSetActive": {\r
        "message": "Задати активною"\r
    },\r
    "missionTitleUpdateAll": {\r
        "message": "Оновити всі"\r
    },\r
    "missionTitleAdd": {\r
        "message": "Додати"\r
    },\r
    "missionTitleMoveToCenterView": {\r
        "message": "перемістити в центр огляду"\r
    },\r
    "missionTitleSaveEepromSafehome": {\r
        "message": "Зберегти в EEPROM безпечну точку повернення"\r
    },\r
    "missionTitleLoadEepromSafehome": {\r
        "message": "Завантажити з EEPROM безпечну точку повернення"\r
    },\r
    "missionTitlEditMission": {\r
        "message": "Редагувати місію"\r
    },\r
    "MissionPlannerFwLAndingAltitudeChangeReset": {\r
        "message": "Висота нижче мінімальної висоти для посадки. Зміну проігноровано"\r
    },\r
    "missionWpType": {\r
        "message": "Тип:"\r
    },\r
    "missionWpLat": {\r
        "message": "Широта:"\r
    },\r
    "missionWpLon": {\r
        "message": "Довгота:"\r
    },\r
    "missionSeaLevelRef": {\r
        "message": "Відносно рівня моря: "\r
    },\r
    "missionElevation": {\r
        "message": "Elevation (м):"\r
    },\r
    "missionNA": {\r
        "message": "Н/Д"\r
    },\r
    "missionGroundDist": {\r
        "message": "Шлях. відст. (м):"\r
    },\r
    "missionParameter1": {\r
        "message": "Параметр 1:"\r
    },\r
    "missionParameter2": {\r
        "message": "Параметр 2:"\r
    },\r
    "missionUserActions": {\r
        "message": "Дії користувача:"\r
    },\r
    "missionFwLandingSettings": {\r
        "message": "Налаштування посадки для фіксованого крила:"\r
    },\r
    "missionFwApproachAlt": {\r
        "message": "Висота наближення: (см):"\r
    },\r
    "missionFwLandAlt": {\r
        "message": "Висота приземлення: (см):"\r
    },\r
    "missionFwApproachDir": {\r
        "message": "Напрямок наближення:"\r
    },\r
    "missionFwLandHeading1": {\r
        "message": "Курс 1: (°):"\r
    },\r
    "missionFwLandHeading2": {\r
        "message": "Курс 2: (°):"\r
    },\r
    "missionExclusive": {\r
        "message": "Викл."\r
    },\r
    "missionRTHsettingsTitle": {\r
        "message": "Налаштування RTH"\r
    },\r
    "missionDefaultSettingsHead": {\r
        "message": "Налаштування за замовчуванням"\r
    },\r
    "missionDefaultElevationHead": {\r
        "message": "Профіль висоти"\r
    },\r
    "missionHomeHead": {\r
        "message": "Зліт з точки повернення"\r
    },\r
    "missionSafehomeHead": {\r
        "message": "Менеджер безпечних точок повернення"\r
    },\r
    "missionSafehomeAvailableSafehomes": {\r
        "message": "Доступні безпечні точки:"\r
    },\r
    "missionSafehomeMaxSafehomesReached": {\r
        "message": "Максимальна кількість безпечних точок досягнута."\r
    },\r
    "missionGeozoneHead": {\r
        "message": "Геозони"\r
    },\r
    "missionGeozoneEdit": {\r
        "message": "Редагувати геозону $1"\r
    },\r
    "missionGeozoneSaveAndReboot": {\r
        "message": "Записати Геозони в Eeprom та перезавантажити"\r
    },\r
    "missionGeozoneLoad": {\r
        "message": "Завантажити геозони з Eeprom"\r
    },\r
    "missionGeozone": {\r
        "message": "-Геозона "\r
    },\r
    "missionGezoneType": {\r
        "message": "Тип"\r
    },\r
    "missionGezoneShape": {\r
        "message": "Форма"\r
    },\r
    "missionGeozoneTypePolygon": {\r
        "message": "Багатокутна"\r
    },\r
    "missionGeozoneTypeCircular": {\r
        "message": "Кругова"\r
    },\r
    "missionGeozoneMaxZonesReached": {\r
        "message": "Досягнуто максимальної кількості геозон."\r
    },\r
    "missionGeozoneMaxVerticesReached": {\r
        "message": "Досягнуто максимальної кількості вершин геозони."\r
    },\r
    "missionGeozoneWarning": {\r
        "message": "Щонайменше одна місія та одна геозона налаштовані, будь ласка, переконайтеся, що місія не порушує межі геозони."\r
    },\r
    "geozoneEdit": {\r
        "message": "Редагувати геозону "\r
    },\r
    "geozoneShape": {\r
        "message": "Форма"\r
    },\r
    "geozoneInclusive": {\r
        "message": "Інклюзивна"\r
    },\r
    "geozoneExcusive": {\r
        "message": "Ексклюзивна"\r
    },\r
    "geozoneMinAlt": {\r
        "message": "Мін. вис. (см):"\r
    },\r
    "geozoneMaxAlt": {\r
        "message": "Макс. вис. (см):"\r
    },\r
    "geozoneInfiniteAlt": {\r
        "message": "0 = висота не обмежена"\r
    },\r
    "geozoneAction": {\r
        "message": "Дія:"\r
    },\r
    "geozoneActionNone": {\r
        "message": "Відсутня"\r
    },\r
    "geozoneActionAvoid": {\r
        "message": "Уникати"\r
    },\r
    "geozoneActionPosHold": {\r
        "message": "Утримувати позицію"\r
    },\r
    "geozoneActionRTH": {\r
        "message": "Повернення додому"\r
    },\r
    "geozoneRadius": {\r
        "message": "Радіус (см):"\r
    },\r
    "geozoneVerices": {\r
        "message": "Вершини:"\r
    },\r
    "": {\r
        "message": ""\r
    },\r
    "featureGEOZONE": {\r
        "message": "Геозона"\r
    },\r
    "geozone": {\r
        "message": "Геозона"\r
    },\r
    "featureGEOZONETip": {\r
        "message": "Віртуальні периметри для географічних зон (також називаються гео-огорожами) з автоматичною активацією дій у разі порушення цих периметрів."\r
    },\r
    "GeozoneSettings": {\r
        "message": "Налаштування геозони"\r
    },\r
    "geozoneDetectionDistance": {\r
        "message": "Відстань виявлення"\r
    },\r
    "geozoneDetectionDistanceHelp": {\r
        "message": "Відстань, з якої виявляється геозона"\r
    },\r
    "geozoneAvoidAltitudeRange": {\r
        "message": "Уникати діапазон висот"\r
    },\r
    "geozoneAvoidAltitudeRangeHelp": {\r
        "message": "Діапазон висот, в межах якого здійснюється спроба обійти геозону зверху"\r
    },\r
    "geozoneSafeAltitudeDistance": {\r
        "message": "Безпечна відстань по висоті"\r
    },\r
    "geozoneSafeAltitudeDistanceHelp": {\r
        "message": "Вертикальна відстань, яку необхідно утримувати до верхньої та нижньої межі зони."\r
    },\r
    "geozoneSafehomeAsInclusive": {\r
        "message": "Безпечна зона повернення інклюзивна"\r
    },\r
    "geozoneSafehomeAsInclusiveHelp": {\r
        "message": "Сприймати найближчу безпечну точку повернення як інклюзивну геозону"\r
    },\r
    "geozoneSafehomeZoneAction": {\r
        "message": "Дія зони безпечного повернення"\r
    },\r
    "geozoneSafehomeZoneActionHelp": {\r
        "message": "Межа дії для зони безпечної точки повернення"\r
    },\r
    "geozoneMrStopDistance": {\r
        "message": "Відстань зупинки мультикоптера"\r
    },\r
    "geozoneMrStopDistanceHelp": {\r
        "message": "Відстань до межі, на якій мультикоптер зупиняється"\r
    },\r
    "geozoneNoWayHomeAction": {\r
        "message": "Дія в разі відсутності можливості повернення додому"\r
    },\r
    "geozoneNoWayHomeActionHelp": {\r
        "message": "Дія, якщо Повернення додому RTH з активними геозонами не може розрахувати маршрут додому: \\nRTH: Повернутися додому і ігнорувати всі геозони."\r
    },\r
    "missionGeozoneReboot": {\r
        "message": "Бажаєте зберегти та перезавантажити?"\r
    },\r
    "missionGeozoneAvailableZones": {\r
        "message": "Доступні геозони:"\r
    },\r
    "missionGeozoneAvailableVertices": {\r
        "message": "Доступні вершини:"\r
    },\r
    "geozoneInvalidzone": {\r
        "message": "Виявлено недійсні геозони:"\r
    },\r
    "geozoneInvalidLat": {\r
        "message": "Неприпустима широта"\r
    },\r
    "geozoneInvalidLon": {\r
        "message": "Неприпустима довгота"\r
    },\r
    "gezoneInvalidReasonNotCC": {\r
        "message": "Не проти годинникової стрілки"\r
    },\r
    "gezoneInvalidReasonComplex": {\r
        "message": "Складна"\r
    },\r
    "gezoneInvalidReasonMinMaxAlt": {\r
        "message": "Макс. вис. <= Мін. вис."\r
    },\r
    "geozoneUnableToSave": {\r
        "message": "Неможливо зберегти геозони: недійсні зони"\r
    },\r
    "missionMultiMissionHead": {\r
        "message": "Мультимісії"\r
    },\r
    "missionTemplateHead": {\r
        "message": "Шаблон місії"\r
    },\r
    "missionActionMenuHead": {\r
        "message": "Меню дій"\r
    },\r
    "useOnlyStandalone": {\r
        "message": "Використовуйте самостійну програму.<br> Будь ласка, відвідайте <a href=\\"https://github.com/iNavFlight/inav-configurator/releases\\" target=\\"_blank\\">вебсайт</a>, щоб прочитати примітки до випуску та завантажити."\r
    },\r
    "eeprom_load_ok": {\r
        "message": "EEPROM <span style=\\"color: #37a8db\\">завантажено</span>"\r
    },\r
    "confirm_delete_all_points": {\r
        "message": "Ви дійсно хочете видалити всі точки?"\r
    },\r
    "confirm_delete_point_with_options": {\r
        "message": "Ви справді хочете видалити цю точку з параметрами не географічними JUMP/SET_HEAD/RTH опціями?\\nЯкщо так, також будуть видалені прикріплені не географічні опції!"\r
    },\r
    "confirm_multimission_file_load": {\r
        "message": "Це файл мультимісії. Завантаження перезапише поточну мультимісію.\\nПродовжити?"\r
    },\r
    "confirm_overwrite_multimission_file_load_option": {\r
        "message": "Це перезапише поточну мультимісію.\\nПродовжити?"\r
    },\r
    "multimission_active_index_saved_eeprom": {\r
        "message": "Індекс активної місії збережено"\r
    },\r
    "no_waypoints_to_load": {\r
        "message": "Немає точок маршруту для завантаження !"\r
    },\r
    "no_waypoints_to_save": {\r
        "message": "Немає точок маршруту для збереження!"\r
    },\r
    "mixerThrottleWarning": {\r
        "message": "Попередження: значення поза нормальним діапазоном роботи."\r
    },\r
    "servoMixer": {\r
        "message": "Мікшер сервоприводів"\r
    },\r
    "servoMixerDelete": {\r
        "message": "Видалити"\r
    },\r
    "servoMixerAdd": {\r
        "message": "Додати нове правило мікшера"\r
    },\r
    "platformType": {\r
        "message": "Тип платформи"\r
    },\r
    "platformConfiguration": {\r
        "message": "Конфігурація платформи"\r
    },\r
    "output_modeTitle": {\r
        "message": "Режим виведення"\r
    },\r
    "mixerPreset": {\r
        "message": "Пресет мікшера"\r
    },\r
    "mixerNotLoaded": {\r
        "message": "Мікшер не завантажено.<br />Натисніть <b>Завантажити та застосувати</b> або <b>Завантажити мікшер</b>, щоб використовувати вибраний мікшер.<br />Або натисніть <b>Оновити мікшер</b>, щоб використовувати ваш поточний мікшер."\r
    },\r
    "mixerLoadPresetRules": {\r
        "message": "Завантажити мікшер"\r
    },\r
    "mixerRefreshCurrentRules": {\r
        "message": "Оновити мікшер"\r
    },\r
    "mixerLoadAndApplyPresetRules": {\r
        "message": "Завантажити та застосувати"\r
    },\r
    "mixerApplyModalTitle": {\r
        "message": "Підтвердити"\r
    },\r
    "mixerButtonSaveAndReboot": {\r
        "message": "Зберегти й перезавантажити"\r
    },\r
    "mixerApplyDescription": {\r
        "message": "Ця дія перезаписує всі поточні налаштування мікшера і замінює їх на параметри за замовчуванням. Опція 'Скасувати' недоступна!"\r
    },\r
    "mixerWizardModalTitle": {\r
        "message": "Майстер налаштування мікшера квадрокоптера"\r
    },\r
    "mixerWizardModalApply": {\r
        "message": "Застосувати"\r
    },\r
    "motorWizard0": {\r
        "message": "Задній правий"\r
    },\r
    "motorWizard1": {\r
        "message": "Передній правий"\r
    },\r
    "motorWizard2": {\r
        "message": "Задній лівий"\r
    },\r
    "motorWizard3": {\r
        "message": "Передній лівий"\r
    },\r
    "mixerWizardMotorPosition": {\r
        "message": "Позиція мотора"\r
    },\r
    "mixerWizardMotorIndex": {\r
        "message": "Індекс мотора"\r
    },\r
    "settings": {\r
        "message": "Налаштування"\r
    },\r
    "decimals": {\r
        "message": "Десяткові знаки"\r
    },\r
    "motorMixer": {\r
        "message": "Мікшер моторів"\r
    },\r
    "servo": {\r
        "message": "Сервопривід"\r
    },\r
    "input": {\r
        "message": "Вхід"\r
    },\r
    "fixedValue": {\r
        "message": "Фіксоване значення (мкс)"\r
    },\r
    "weight": {\r
        "message": "Вага (%)"\r
    },\r
    "speed": {\r
        "message": "Швидкість (10мкс/c)"\r
    },\r
    "mixerPresetTitle": {\r
        "message": "Попередні налаштування мікшера"\r
    },\r
    "fcFirmwareUpdateRequired": {\r
        "message": "Прошивка польотного контролера повинна бути оновлена до останньої версії для використання цієї функції"\r
    },\r
    "mixerNotConfigured": {\r
        "message": "Мікшер не налаштовано. Використовуйте вкладку <u>Мікшер</u>, щоб налаштувати його!"\r
    },\r
    "confirm_reset_settings": {\r
        "message": "Ви дійсно хочете скинути всі налаштування?\\nУВАГА: Усі налаштування будуть втрачені! Вам доведеться налаштовувати весь літальний апарат після цієї операції!"\r
    },\r
    "confirm_select_defaults": {\r
        "message": "Це дозволить вибрати нові значення за замовчуванням для всіх налаштувань. Існуючий ПІД тюнінг та інші налаштування можуть бути втрачені!\\nБажаєте продовжити?"\r
    },\r
    "confirm_reset_pid": {\r
        "message": "Це скине всі налаштування ПІД до значень за замовчуванням у прошивці та збереже. \\nБажаєте продовжити?"\r
    },\r
    "mappingTableOutput": {\r
        "message": "Вивід (таймер)"\r
    },\r
    "mappingTableFunction": {\r
        "message": "Функція"\r
    },\r
    "mappingTableTitle": {\r
        "message": "Вихідне відображення"\r
    },\r
    "NONE": {\r
        "message": "Відсутній"\r
    },\r
    "DEFAULT": {\r
        "message": "За замовчуванням"\r
    },\r
    "AIRCRAFT": {\r
        "message": "Літальний апарат"\r
    },\r
    "ALTITUDE": {\r
        "message": "Висота"\r
    },\r
    "GROUND_SPEED": {\r
        "message": "Шляхова швидкість"\r
    },\r
    "HOME_DISTANCE": {\r
        "message": "Відстань до дому"\r
    },\r
    "brakingSpeedThreshold": {\r
        "message": "Мінімальний поріг швидкості"\r
    },\r
    "brakingSpeedThresholdTip": {\r
        "message": "Гальмування буде увімкнено лише якщо фактична швидкість перевищує поріг"\r
    },\r
    "brakingDisengageSpeed": {\r
        "message": "Швидкість вимкнення гальмування"\r
    },\r
    "brakingDisengageSpeedTip": {\r
        "message": "Гальмування закінчиться, коли швидкість опуститься нижче цього значення"\r
    },\r
    "brakingTimeout": {\r
        "message": "Макс. тривалість гальмування"\r
    },\r
    "brakingTimeoutTip": {\r
        "message": "Запобіжний захід. Це максимальний проміжок часу, протягом якого може бути активне гальмування."\r
    },\r
    "brakingBoostFactor": {\r
        "message": "Фактор підсилення"\r
    },\r
    "brakingBoostFactorTip": {\r
        "message": "Визначає, наскільки сильно буде підсилення гальмування. 100% означає, що навігаційному двигуну дозволено подвоювати швидкість і прискорення крену."\r
    },\r
    "brakingBoostTimeout": {\r
        "message": "Макс. тривалість підсилення гальмування"\r
    },\r
    "brakingBoostTimeoutTip": {\r
        "message": "Захисний захід. Це найдовший проміжок часу, протягом якого можна активувати підсилення гальмування."\r
    },\r
    "brakingBoostSpeedThreshold": {\r
        "message": "Поріг мін. швидкості підсилення"\r
    },\r
    "brakingBoostSpeedThresholdTip": {\r
        "message": "Підсилення гальмування буде увімкнено лише якщо фактична швидкість перевищує поріг"\r
    },\r
    "brakingBoostDisengageSpeed": {\r
        "message": "Швидкість відключення підсилення гальмування"\r
    },\r
    "brakingBoostDisengageSpeedTip": {\r
        "message": "Підсилення гальмування припиниться, коли швидкість знизиться нижче цього значення"\r
    },\r
    "brakingBankAngle": {\r
        "message": "Макс. кут крену"\r
    },\r
    "brakingBankAngleTip": {\r
        "message": "Макс. кут крену, дозволений під час фази гальмування"\r
    },\r
    "multirotorBrakingConfiguration": {\r
        "message": "Конфігурація режиму гальмування мультикоптера"\r
    },\r
    "mapProvider": {\r
        "message": "Постачальник мапи"\r
    },\r
    "proxyURL": {\r
        "message": "MapProxy URL"\r
    },\r
    "proxyLayer": {\r
        "message": "Шар MapProxy"\r
    },\r
    "accNotchHz": {\r
        "message": "Частота режекторного фільтра аксел."\r
    },\r
    "accNotchHzHelp": {\r
        "message": "Дозволяє встановити один режекторний фільтр для даних з акселерометра. Має бути налаштований таким же чином, як і режекторний фільтр гіроскопу, якщо акселерометр фіксує шумовий сплеск вище фільтра низьких частот акселерометра"\r
    },\r
    "accNotchCutoff": {\r
        "message": "Частота відсікання режекторного фільтра аксел."\r
    },\r
    "accNotchCutoffHelp": {\r
        "message": "Слід тримати нижче частоти режекторного фільтра акселерометра"\r
    },\r
    "gyroStage2LpfCutoffFrequency": {\r
        "message": "Частота зрізу другого ступеню ФНЧ гіроскопа"\r
    },\r
    "gyroStage2LpfCutoffFrequencyHelp": {\r
        "message": "Другий ступінь фільтра низьких частот гіроскопа, який є еквівалентом другого ступеня фільтрації Betaflight без використання фільтра Калмана. Його слід налаштовувати вище першого ступеня гіроскопічного фільтра низьких частот. Для мініквадрокоптерів з діагоналлю 5 і 6 дюймів це зазвичай означає вище 150 Гц. Для 7-дюймових квадрокоптерів – вище 125 Гц."\r
    },\r
    "escProtocolNotAdvised": {\r
        "message": "Цей протокол ESC не є рекомендованим, використовуйте його на свій страх і ризик"\r
    },\r
    "escProtocolExperimental": {\r
        "message": "Експериментальний протокол ESC, використовуйте на свій страх і ризик"\r
    },\r
    "looptimeNotAdvised": {\r
        "message": "Цикл ПІД може бути нестабільним, якщо використовуються GPS"\r
    },\r
    "gyroLpfSuggestedMessage": {\r
        "message": "Це рекомендоване налаштування для всіх мультикоптерів із розміром пропелерів менше 8 дюймів. Завжди перевіряйте температуру мотора після першого польоту"\r
    },\r
    "gyroLpfNotAdvisedMessage": {\r
        "message": "Рекомендується вибрати вищу частоту зрізу"\r
    },\r
    "gyroLpfNotFlyableMessage": {\r
        "message": "Це налаштування, ймовірно, зробить БПЛА непридатним для польоту"\r
    },\r
    "gyroLpfWhyNotHigherMessage": {\r
        "message": "Якщо мотори не перегріваються, спробуйте встановити 256 Гц замість цього"\r
    },\r
    "gyroLpfWhyNotSlightlyHigherMessage": {\r
        "message": "Якщо немає проблем з вібраціями й мотори не перегріваються, спробуйте встановити замість цього 188 Гц"\r
    },\r
    "tabLogicConditions": {\r
        "message": "Логічні умови"\r
    },\r
    "logicId": {\r
        "message": "#"\r
    },\r
    "logicEnabled": {\r
        "message": "Увімкнено"\r
    },\r
    "logicOperation": {\r
        "message": "Операція"\r
    },\r
    "logicOperandA": {\r
        "message": "Операнд А"\r
    },\r
    "logicOperandB": {\r
        "message": "Операнд B"\r
    },\r
    "logicFlags": {\r
        "message": "Прапорці"\r
    },\r
    "logicStatus": {\r
        "message": "Стан"\r
    },\r
    "logicSave": {\r
        "message": "Зберегти"\r
    },\r
    "logicClose": {\r
        "message": "Закрити"\r
    },\r
    "logicActivator": {\r
        "message": "Активний"\r
    },\r
    "save": {\r
        "message": "Зберегти"\r
    },\r
    "copy": {\r
        "message": "Копіювати"\r
    },\r
    "paste": {\r
        "message": "Вставити"\r
    },\r
    "clear": {\r
        "message": "Очистити"\r
    },\r
    "active": {\r
        "message": "Активно"\r
    },\r
    "itermRelax": {\r
        "message": "Послаблення I-складової"\r
    },\r
    "itermRelaxHelp": {\r
        "message": "Визначає активацію алгоритму розслаблення І-складової. PR означає активний на осях крену та тангажа. PRY активний також на осі рискання."\r
    },\r
    "dterm_lpf_type": {\r
        "message": "Тип ФНЧ Д-складової"\r
    },\r
    "dterm_lpf_type_help": {\r
        "message": "BIQUAD краще пригнічує шум за рахунок більшої затримки. PT1 має менше пригнічення, але забезпечує меншу затримку."\r
    },\r
    "dterm_lpf2_type": {\r
        "message": "Тип ФНЧ другого ступеню для Д-складової"\r
    },\r
    "dterm_lpf2_type_help": {\r
        "message": "BIQUAD забезпечує краще пригнічення шуму, але з більшою затримкою. PT1 дає менше пригнічення, але пропонує меншу затримку."\r
    },\r
    "dterm_lpf2_hz": {\r
        "message": "Частота зрізу ФНЧ другого ступеня Д-складової"\r
    },\r
    "dterm_lpf2_hz_help": {\r
        "message": "Низькочастотний фільтр для Д-складової на осях КРЕНУ і ТАНГАЖА. 0 означає, що фільтр вимкнено"\r
    },\r
    "tabFilteringAdvanced": {\r
        "message": "Інші фільтри"\r
    },\r
    "gps_map_center": {\r
        "message": "Центр"\r
    },\r
    "ouptputsConfiguration": {\r
        "message": "Конфігурація"\r
    },\r
    "vtxDisclaimer": {\r
        "message": "Використовуйте лише діапазони, канали та рівні потужності, які є легальними у місці, де ви літаєте! Завжди звертайтеся до користувацької інструкції відеопередавача та місцевих правил!"\r
    },\r
    "defaultsDialogTitle": {\r
        "message": "Значення за замовчуванням"\r
    },\r
    "defaultsDialogInfo": {\r
        "message": "INAV Configurator хотів би знати, який тип БПЛА ви налаштовуєте. На основі цієї інформації він змінить деякі значення за замовчуванням, щоб забезпечити найкращу льотну продуктивність."\r
    },\r
    "defaultsDialogInfo2": {\r
        "message": "Уникайте бездумного відновлювання всіх налаштувань ПІД та фільтрів з попередньої версії INAV. Найкращого результату можна досягти шляхом повторного тюнингу з налаштувань за замовчуванням!"\r
    },\r
    "throttleIdle": {\r
        "message": "Потужність мотора на холостих [%]"\r
    },\r
    "throttleIdleDigitalInfo": {\r
        "message": "Для цифрових протоколів, потужність на холостих можна знижувати навіть до 5-7% без зупинки моторів у повітрі. Якщо дрон починає хитатися після зниження тяги, спробуйте збільшити потужність холостого ходу, щоб виправити цю поведінку."\r
    },\r
    "throttleIdleAnalogInfo": {\r
        "message": "Для аналогових протоколів, потужність на холостих може бути зниженою нижче 10%, якщо мотори працюють плавно без переривань. Якщо дрон похитується після зниження тяги, спробуйте збільшити потужність холостого ходу, щоб усунути цю поведінку."\r
    },\r
    "motor_poles": {\r
        "message": "Кількість полюсів мотора (кількість магнітів)"\r
    },\r
    "motorStopWarning": {\r
        "message": "Слід увімкнути на літаках, роверах та човнах. Не слід вмикати на мультикоптерах! На мультикоптерах, коли активний Airmode, мотори не зупинятимуться."\r
    },\r
    "reversibleEscWarning": {\r
        "message": "Коли використовується функція Зворотного Напрямку Моторів, встановіть холостий хід моторів на 0%"\r
    },\r
    "dynamic_gyro_notch_enabled_help": {\r
        "message": "Матричний фільтр гіроскопа - це нове покоління динамічних зрізових фільтрів гіроскопа, доступних в INAV. Рекомендується увімкнути його на всіх збірках мультикоптерів на польотних контролерах F4 та F7."\r
    },\r
    "globalFunctions": {\r
        "message": "Глобальні функції"\r
    },\r
    "functionId": {\r
        "message": "#"\r
    },\r
    "functionEnabled": {\r
        "message": "Увімкнено"\r
    },\r
    "functionLogicId": {\r
        "message": "Умови логіки активації"\r
    },\r
    "functionAction": {\r
        "message": "Дія"\r
    },\r
    "functionOperand": {\r
        "message": "Операнд"\r
    },\r
    "functionFlags": {\r
        "message": "Прапорці"\r
    },\r
    "configurationI2cSpeed": {\r
        "message": "Швидкість I2C"\r
    },\r
    "configurationI2cSpeedHelp": {\r
        "message": "Швидкість I2C слід підтримувати на найвищому рівні, який дозволяє всім підключеним пристроям працювати. Значення за замовчуванням 400 кГц є безпечним, і рекомендується перемикати на 800 кГц у випадку з мультикоптерами."\r
    },\r
    "i2cSpeedSuggested800khz": {\r
        "message": "Будь ласка, перемкніть на 800 кГц, якщо підключене апаратне забезпечення це дозволяє"\r
    },\r
    "i2cSpeedTooLow": {\r
        "message": "Ця швидкість I2C занадто низька!"\r
    },\r
    "configurationVoltageMeterType": {\r
        "message": "Тип вольтметра"\r
    },\r
    "configurationCurrentMeterType": {\r
        "message": "Тип вимірювача струму"\r
    },\r
    "MissionPlannerJumpSettingsCheck": {\r
        "message": "Налаштування JUMP неправильні: Перевірте їх ще раз!\\nПримусове перенаправлення на WP  1!"\r
    },\r
    "MissionPlannerJump2SettingsCheck": {\r
        "message": "Неправильні налаштування JUMP: Кількість повторень не повинна перевищувати 10!\\nПеревірте ще раз! Змушені встановити кількість повторень рівною 0!"\r
    },\r
    "MissionPlannerJump3SettingsCheck": {\r
        "message": "Налаштування JUMP некоректні: неможливо перейти до POI!\\nПримусово переходжу до WP 1!"\r
    },\r
    "MissionPlannerHeadSettingsCheck": {\r
        "message": "Значення курсу некоректне : Перевірте ще раз! Примусово встановлюється за замовчуванням на -1!"\r
    },\r
    "MissionPlannerRTHSettingsCheck": {\r
        "message": "Опція RTH некоректна: повинна бути 0 або 1. Перевірте це ще раз!\\nЗа замовчуванням встановлено на 0, тобто немає посадки після RTH!"\r
    },\r
    "MissionPlannerJumpTargetRemoval": {\r
        "message": "Ви не можете видалити точку, яка визначена як ціль JUMP!\\nСпочатку потрібно видалити ціль у точці, що викликає JUMP."\r
    },\r
    "MissionPlannerAltitudeChangeReset": {\r
        "message": "Висота нижче рівня землі. Зміна проігнорована"\r
    },\r
    "SafehomeSelected": {\r
        "message": ""\r
    },\r
    "SafehomeId": {\r
        "message": "#"\r
    },\r
    "SafehomeEnabled": {\r
        "message": "Увімкнено"\r
    },\r
    "SafehomeLon": {\r
        "message": "Довг"\r
    },\r
    "SafehomeLat": {\r
        "message": "Широта"\r
    },\r
    "SafehomeAlt": {\r
        "message": "Висот."\r
    },\r
    "WaypointOptionSelected": {\r
        "message": "+"\r
    },\r
    "WaypointOptionId": {\r
        "message": "#"\r
    },\r
    "WaypointOptionAction": {\r
        "message": "Тип"\r
    },\r
    "WaypointOptionP1": {\r
        "message": "Т1"\r
    },\r
    "WaypointOptionP2": {\r
        "message": "Т2"\r
    },\r
    "pidId": {\r
        "message": "#"\r
    },\r
    "pidEnabled": {\r
        "message": "Увімкнено"\r
    },\r
    "pidSetpoint": {\r
        "message": "Задане значення"\r
    },\r
    "pidMeasurement": {\r
        "message": "Вимірювання"\r
    },\r
    "pidP": {\r
        "message": "коефіцієнт П"\r
    },\r
    "pidI": {\r
        "message": "коефіцієнт І"\r
    },\r
    "pidD": {\r
        "message": "коефіцієнт Д"\r
    },\r
    "pidFF": {\r
        "message": "коеф. упередження"\r
    },\r
    "pidOutput": {\r
        "message": "Вихід"\r
    },\r
    "reset": {\r
        "message": "Скинути"\r
    },\r
    "illegalStateRestartRequired": {\r
        "message": "Неприпустимий стан. Потрібне перезавантаження."\r
    },\r
    "motor_direction_inverted": {\r
        "message": "Нормальний напрямок мотора / Конфігурація пропелерів на камеру"\r
    },\r
    "motor_direction_isInverted": {\r
        "message": "Зворотний напрямок мотора / Конфігурація пропелерів на польотник"\r
    },\r
    "motor_direction_inverted_hint": {\r
        "message": "Увімкніть, якщо напрямок мотора змінено на протилежний і пропелери встановлені у зворотному напрямку."\r
    },\r
    "mixer_control_profile_linking": {\r
        "message": "Профіль керування буде використовувати той самий індекс, що й індекс Профілю мікшера"\r
    },\r
    "mixer_control_profile_linking_hint": {\r
        "message": "mixer_control_profile_linking: Увімкніть на обох профілях змішування, якщо ви хочете, щоб перемикання профілю керування здійснювалося через перемикання профілю мікшера (рекомендується для налаштувань типу втол/змішана платформа)"\r
    },\r
    "blackboxFields": {\r
        "message": "Поля чорної скрині"\r
    },\r
    "BLACKBOX_FEATURE_NAV_ACC": {\r
        "message": "Навігаційний акселерометр"\r
    },\r
    "BLACKBOX_FEATURE_NAV_POS": {\r
        "message": "Оцінювання навігаційної позиції"\r
    },\r
    "BLACKBOX_FEATURE_NAV_PID": {\r
        "message": "Навігаційний ПІД"\r
    },\r
    "BLACKBOX_FEATURE_MAG": {\r
        "message": "Магнітометр"\r
    },\r
    "BLACKBOX_FEATURE_ACC": {\r
        "message": "Акселерометр"\r
    },\r
    "BLACKBOX_FEATURE_ATTITUDE": {\r
        "message": "Орієнтація"\r
    },\r
    "BLACKBOX_FEATURE_RC_DATA": {\r
        "message": "Дані пульта"\r
    },\r
    "BLACKBOX_FEATURE_RC_COMMAND": {\r
        "message": "Команди пульта"\r
    },\r
    "BLACKBOX_FEATURE_MOTORS": {\r
        "message": "Вихід моторів"\r
    },\r
    "BLACKBOX_FEATURE_GYRO_RAW": {\r
        "message": "RAW гіроскоп (без фільтрації)"\r
    },\r
    "BLACKBOX_FEATURE_GYRO_PEAKS_ROLL": {\r
        "message": "Частота піків шуму гіроскопа, Крен"\r
    },\r
    "BLACKBOX_FEATURE_GYRO_PEAKS_PITCH": {\r
        "message": "Частота піків шуму гіроскопа, Тангаж"\r
    },\r
    "BLACKBOX_FEATURE_GYRO_PEAKS_YAW": {\r
        "message": "Частота піків шуму гіроскопа, Рискання"\r
    },\r
    "BLACKBOX_FEATURE_SERVOS": {\r
        "message": "Виводи сервоприводів"\r
    },\r
    "axisRoll": {\r
        "message": "Крен"\r
    },\r
    "axisPitch": {\r
        "message": "Тангаж"\r
    },\r
    "axisYaw": {\r
        "message": "Рискання"\r
    },\r
    "showAdvancedPIDs": {\r
        "message": "Показати просунуті ПІД регулятори"\r
    },\r
    "rc_filter_lpf_hz": {\r
        "message": "Ручний ФНЧ Гц"\r
    },\r
    "rc_filter_smoothing_factor": {\r
        "message": "Автоматичний коефіцієнт згладжування"\r
    },\r
    "rc_filter_auto": {\r
        "message": "Використовувати автоматичне згладжування команд пульта"\r
    },\r
    "rcSmoothing": {\r
        "message": "Згладжування команд пульта"\r
    },\r
    "throttle_scale": {\r
        "message": "Маштаб тяги"\r
    },\r
    "throttle_scale_help": {\r
        "message": "Дозволяє обмежити ефективну потужність, що подається на мотори. Масштаб тяги 1 означає, що обмеження потужності немає. Масштаб тяги 0.5 означає, що положення тяги буде зменшене наполовину перед передачею до моторів."\r
    },\r
    "pidTuning_MatrixFilterType": {\r
        "message": "Тип матричного фільтра"\r
    },\r
    "pidTuning_MatrixFilterTypeHelp": {\r
        "message": "Означає тип матричного фільтра. Для більшості користувачів рекомендується фільтр 2D за замовчуванням. Квадрокоптери з діагоналлю 7 дюймів і більше можуть отримати вигоду від фільтра 3D."\r
    },\r
    "softSerialWarning": {\r
        "message": "Не рекомендується використовувати softserial для критичних для польоту пристроїв, таких як GPS або приймач, або для пристроїв з високим трафіком, таких як MSP DisplayPort."\r
    },\r
    "ledStripColorSetupTitle": {\r
        "message": "Налаштування кольору"\r
    },\r
    "ledStripH": {\r
        "message": "Гор."\r
    },\r
    "ledStripS": {\r
        "message": "Південь"\r
    },\r
    "ledStripV": {\r
        "message": "Верт."\r
    },\r
    "ledStripRemainingText": {\r
        "message": "Залишилось"\r
    },\r
    "ledStripClearSelectedButton": {\r
        "message": "Очистити виділене"\r
    },\r
    "ledStripClearAllButton": {\r
        "message": "Очистити все"\r
    },\r
    "ledStripFunctionSection": {\r
        "message": "Функції LED"\r
    },\r
    "ledStripFunctionTitle": {\r
        "message": "Функція"\r
    },\r
    "ledStripFunctionNoneOption": {\r
        "message": "Відсутній"\r
    },\r
    "ledStripFunctionColorOption": {\r
        "message": "Колір"\r
    },\r
    "ledStripFunctionModesOption": {\r
        "message": "Режими &amp; Орієнтація"\r
    },\r
    "ledStripFunctionArmOption": {\r
        "message": "Статус взведення"\r
    },\r
    "ledStripFunctionBatteryOption": {\r
        "message": "Батарея"\r
    },\r
    "ledStripFunctionRSSIOption": {\r
        "message": "RSSI"\r
    },\r
    "ledStripFunctionGPSOption": {\r
        "message": "GPS"\r
    },\r
    "ledStripFunctionRingOption": {\r
        "message": "Кільце"\r
    },\r
    "ledStripFunctionChannelOption": {\r
        "message": "Канал"\r
    },\r
    "ledStripColorModifierTitle": {\r
        "message": "Модифікатор кольору"\r
    },\r
    "ledStripThrottleText": {\r
        "message": "Тяга"\r
    },\r
    "ledStripLarsonscannerText": {\r
        "message": "Лінія Ларсона"\r
    },\r
    "ledStripBlinkTitle": {\r
        "message": "Блимати"\r
    },\r
    "ledStripBlinkAlwaysOverlay": {\r
        "message": "Блимати завжди"\r
    },\r
    "ledStripBlinkLandingOverlay": {\r
        "message": "Блимати при посадці"\r
    },\r
    "ledStripStrobeText": {\r
        "message": "Строб"\r
    },\r
    "ledStripEnableStrobeLightEffectText": {\r
        "message": "Увімкнути ефект стробоскопа"\r
    },\r
    "ledStripOverlayTitle": {\r
        "message": "Накладання"\r
    },\r
    "ledStripWarningsOverlay": {\r
        "message": "Попередження"\r
    },\r
    "ledStripIndecatorOverlay": {\r
        "message": "Індикатор"\r
    },\r
    "colorBlack": {\r
        "message": "чорний"\r
    },\r
    "colorWhite": {\r
        "message": "білий"\r
    },\r
    "colorRed": {\r
        "message": "червоний"\r
    },\r
    "colorOrange": {\r
        "message": "помаранчевий"\r
    },\r
    "colorYellow": {\r
        "message": "жовтий"\r
    },\r
    "colorLimeGreen": {\r
        "message": "світло-зелений"\r
    },\r
    "colorGreen": {\r
        "message": "зелений"\r
    },\r
    "colorMintGreen": {\r
        "message": "м’ятно-зелений"\r
    },\r
    "colorCyan": {\r
        "message": "блакитний"\r
    },\r
    "colorLightBlue": {\r
        "message": "світло-синій"\r
    },\r
    "colorBlue": {\r
        "message": "синій"\r
    },\r
    "colorDarkViolet": {\r
        "message": "темно-фіолетовий"\r
    },\r
    "colorMagenta": {\r
        "message": "пурпуровий"\r
    },\r
    "colorDeepPink": {\r
        "message": "глибокий рожевий"\r
    },\r
    "ledStripSelectChannelFromColorList": {\r
        "message": "Вибрати канал зі списку кольорів"\r
    },\r
    "ledStripModeColorsTitle": {\r
        "message": "Кольори режимів"\r
    },\r
    "ledStripModeColorsModeOrientation": {\r
        "message": "Орієнтація"\r
    },\r
    "ledStripModeColorsModeHeadfree": {\r
        "message": "Headfree"\r
    },\r
    "ledStripModeColorsModeHorizon": {\r
        "message": "Горизонт"\r
    },\r
    "ledStripModeColorsModeAngle": {\r
        "message": "Кут"\r
    },\r
    "ledStripModeColorsModeMag": {\r
        "message": "Компас"\r
    },\r
    "ledStripModeColorsModeBaro": {\r
        "message": "Барометр"\r
    },\r
    "ledStripDirN": {\r
        "message": "Північ"\r
    },\r
    "ledStripDirE": {\r
        "message": "Схід"\r
    },\r
    "ledStripDirS": {\r
        "message": "Південь"\r
    },\r
    "ledStripDirW": {\r
        "message": "Захід"\r
    },\r
    "ledStripDirU": {\r
        "message": "Догори"\r
    },\r
    "ledStripDirD": {\r
        "message": "Вниз"\r
    },\r
    "ledStripModesOrientationTitle": {\r
        "message": "LED Орієнтація та Колір"\r
    },\r
    "ledStripModesSpecialColorsTitle": {\r
        "message": "Спеціальні кольори"\r
    },\r
    "ledStripModeColorsModeDisarmed": {\r
        "message": "Охолощений"\r
    },\r
    "ledStripModeColorsModeArmed": {\r
        "message": "Взведений"\r
    },\r
    "ledStripModeColorsModeAnimation": {\r
        "message": "Анімація"\r
    },\r
    "ledStripModeColorsModeBlinkBg": {\r
        "message": "Блимати фоном"\r
    },\r
    "ledStripModeColorsModeGPSNoSats": {\r
        "message": "GPS: нема супутників"\r
    },\r
    "ledStripModeColorsModeGPSNoLock": {\r
        "message": "GPS: координати недоступні"\r
    },\r
    "ledStripModeColorsModeGPSLocked": {\r
        "message": "GPS: координати отримано"\r
    },\r
    "ledStripWiring": {\r
        "message": "Схема підключення стрічки"\r
    },\r
    "ledStripWiringMode": {\r
        "message": "Режим упорядковування стрічки"\r
    },\r
    "ledStripWiringClearControl": {\r
        "message": "Очистити виділене"\r
    },\r
    "ledStripWiringClearAllControl": {\r
        "message": "Очистити ВСІ підключення"\r
    },\r
    "ledStripWiringMessage": {\r
        "message": "Світлодіоди без порядкового номера підключення не будуть збережені."\r
    },\r
    "mainLogoText": {\r
        "message": "Конфігуратор"\r
    },\r
    "mainLogoTextFirmware": {\r
        "message": "ПРОШИВКА ПОЛЬОТНОГО КОНТРОЛЕРА"\r
    },\r
    "mainPortOverrideLabel": {\r
        "message": "Порт:"\r
    },\r
    "mainManual": {\r
        "message": "Ручний"\r
    },\r
    "sensorDataFlashNotFound": {\r
        "message": "Чіп пам'яті <br>не знайдено"\r
    },\r
    "sensorDataFlashFreeSpace": {\r
        "message": "Флешпам'ять: <br />вільно "\r
    },\r
    "mixerProfile1": {\r
        "message": "Профіль мікшера 1"\r
    },\r
    "mixerProfile2": {\r
        "message": "Профіль мікшера 2"\r
    },\r
    "sensorProfile1": {\r
        "message": "Профіль керування 1"\r
    },\r
    "sensorProfile2": {\r
        "message": "Профіль керування 2"\r
    },\r
    "sensorProfile3": {\r
        "message": "Профіль керування 3"\r
    },\r
    "sensorBatteryProfile1": {\r
        "message": "Профіль батареї 1"\r
    },\r
    "sensorBatteryProfile2": {\r
        "message": "Профіль батареї 2"\r
    },\r
    "sensorBatteryProfile3": {\r
        "message": "Профіль батареї 3"\r
    },\r
    "sensorStatusGyro": {\r
        "message": "Гіроскоп"\r
    },\r
    "sensorStatusGyroShort": {\r
        "message": "Гіроскоп",\r
        "description": "Текст зображення на іконках датчиків зверху. Будь ласка, коротко."\r
    },\r
    "sensorStatusAccel": {\r
        "message": "Акселерометр"\r
    },\r
    "sensorStatusAccelShort": {\r
        "message": "Аксел",\r
        "description": "Текст зображення на іконках датчиків зверху. Будь ласка, коротко."\r
    },\r
    "sensorStatusMag": {\r
        "message": "Магнітометр"\r
    },\r
    "sensorStatusMagShort": {\r
        "message": "Компас",\r
        "description": "Текст зображення на іконках датчиків зверху. Будь ласка, коротко."\r
    },\r
    "sensorStatusBaro": {\r
        "message": "Барометр"\r
    },\r
    "sensorStatusBaroShort": {\r
        "message": "Барометр",\r
        "description": "Текст зображення на іконках датчиків зверху. Будь ласка, коротко."\r
    },\r
    "sensorStatusGPS": {\r
        "message": "GPS"\r
    },\r
    "sensorStatusGPSShort": {\r
        "message": "GPS",\r
        "description": "Текст зображення на іконках датчиків зверху. Будь ласка, коротко."\r
    },\r
    "sensorOpticalFlow": {\r
        "message": "Оптичний потік"\r
    },\r
    "sensorOpticalFlowShort": {\r
        "message": "Потік"\r
    },\r
    "sensorStatusSonar": {\r
        "message": "Сонар / Далекомір"\r
    },\r
    "sensorStatusSonarShort": {\r
        "message": "Сонар",\r
        "description": "Текст зображення на іконках датчиків зверху. Будь ласка, коротко."\r
    },\r
    "sensorAirspeed": {\r
        "message": "Швидкість повітря"\r
    },\r
    "sensorAirspeedShort": {\r
        "message": "Швидкість"\r
    },\r
    "sensorBatteryVoltage": {\r
        "message": "Напруга батареї"\r
    },\r
    "mainShowLog": {\r
        "message": "Показати журнал подій"\r
    },\r
    "mainHideLog": {\r
        "message": "Приховати журнал подій"\r
    },\r
    "waitingForData": {\r
        "message": "Очікування даних ..."\r
    },\r
    "outputStatsTableAcc": {\r
        "message": "Шум акселерометра RMS"\r
    },\r
    "outputStatsTableCurrent": {\r
        "message": "Струм [А]"\r
    },\r
    "outputStatsTableVoltage": {\r
        "message": "Напруга [В]"\r
    },\r
    "LogicConditions": {\r
        "message": "Логічні умови"\r
    },\r
    "PIDControllers": {\r
        "message": "ПІД регулятори"\r
    },\r
    "sensorsGyroSelect": {\r
        "message": "Гіроскоп"\r
    },\r
    "sensorsAccelSelect": {\r
        "message": "Акселерометр"\r
    },\r
    "sensorsMagSelect": {\r
        "message": "Магнітометр"\r
    },\r
    "sensorsAltitudeSelect": {\r
        "message": "Барометр"\r
    },\r
    "sensorsSonarSelect": {\r
        "message": "Сонар"\r
    },\r
    "sensorsAirSpeedSelect": {\r
        "message": "швидкість повітря"\r
    },\r
    "sensorsTemperaturesSelect": {\r
        "message": "Температури"\r
    },\r
    "sensorsDebugSelect": {\r
        "message": "Інформація для налагоджування"\r
    },\r
    "sensorsDebugTrace": {\r
        "message": "Відкрити трасування налагодження"\r
    },\r
    "sensorsGyroscope": {\r
        "message": "Гіроскоп - градуси/сек."\r
    },\r
    "sensorsAccelerometer": {\r
        "message": "Акселерометр - g"\r
    },\r
    "sensorsMagnetometer": {\r
        "message": "Магнітометр - Гc"\r
    },\r
    "sensorsBarometer": {\r
        "message": "Барометр - метри"\r
    },\r
    "sensorsSonar": {\r
        "message": "Сонар - сантиметри"\r
    },\r
    "sensorsAirspeed": {\r
        "message": "Швидкість повітря - см/с"\r
    },\r
    "sensorsTemperature0": {\r
        "message": "Temperature 0 - °C"\r
    },\r
    "sensorsTemperature1": {\r
        "message": "Температура 1 - °C"\r
    },\r
    "sensorsTemperature2": {\r
        "message": "Temperature 2 - °C"\r
    },\r
    "sensorsTemperature3": {\r
        "message": "Температура 3 - °C"\r
    },\r
    "sensorsTemperature4": {\r
        "message": "Температура 4 - °C"\r
    },\r
    "sensorsTemperature5": {\r
        "message": "Температура 5 - °C"\r
    },\r
    "sensorsTemperature6": {\r
        "message": "Температура 6 - °C"\r
    },\r
    "sensorsTemperature7": {\r
        "message": "Температура 7 - °C"\r
    },\r
    "sensorsTemperatureValue": {\r
        "message": "значення:"\r
    },\r
    "getRunningOS": {\r
        "message": "Запущена - ОС: <strong>"\r
    },\r
    "getConfiguratorVersion": {\r
        "message": "Конфігуратор: <strong>"\r
    },\r
    "loadedReleaseInfo": {\r
        "message": "Завантажено інформацію про реліз з GitHub."\r
    },\r
    "newVersionAvailable": {\r
        "message": "Нова версія доступна!"\r
    },\r
    "ReceiveTime": {\r
        "message": "Отримати час:"\r
    },\r
    "SendTime": {\r
        "message": "Надіслати час:"\r
    },\r
    "ErrorWritingFile": {\r
        "message": "<span style=\\"color: red\\">Помилка запису файлу</span>"\r
    },\r
    "FileSaved": {\r
        "message": "Файл збережено"\r
    },\r
    "selectedTarget": {\r
        "message": "обрана ціль = "\r
    },\r
    "toggledRCs": {\r
        "message": "перемикання RC"\r
    },\r
    "noFirmwareSelectedToLoad": {\r
        "message": "<b>Не вибрано прошивку для завантаження</b>"\r
    },\r
    "selectValidSerialPort": {\r
        "message": "<span style=\\"color: red\\">Будь ласка, виберіть дійсний серійний порт</span>"\r
    },\r
    "writePermissionsForFile": {\r
        "message": "Ви не маєте <span style=\\"color: red\\">прав доступу для запису</span> цього файлу"\r
    },\r
    "automaticTargetSelect": {\r
        "message": "Намагається автоматично вибрати цільовий пристрій"\r
    },\r
    "notAWAYPOINT": {\r
        "message": "Попередній вибір не був WAYPOINT!"\r
    },\r
    "startGettingSafehomePoints": {\r
        "message": "Початок отримання безпечних точок повернення"\r
    },\r
    "endGettingSafehomePoints": {\r
        "message": "Кінець отримання безпечних точок повернення"\r
    },\r
    "startSendingSafehomePoints": {\r
        "message": "Початок відправлення безпечних точок повернення"\r
    },\r
    "endSendingSafehomePoints": {\r
        "message": "Кінець відправлення безпечних точок повернення"\r
    },\r
    "startGetPoint": {\r
        "message": "Отримати точку старту"\r
    },\r
    "startSendPoint": {\r
        "message": "Відправити точку старту"\r
    },\r
    "errorReadingFileXml2jsNotFound": {\r
        "message": "<span style=\\"color: red\\">Помилка читання файлу (xml2js не знайдено)</span>"\r
    },\r
    "errorReadingFile": {\r
        "message": "<span style=\\"color: red\\">Помилка читання файлу</span>"\r
    },\r
    "errorParsingFile": {\r
        "message": "<span style=\\"color: red\\">Помилка розбору файлу</span>"\r
    },\r
    "loadedSuccessfully": {\r
        "message": " завантажено успішно!"\r
    },\r
    "errorWritingFileXml2jsNotFound": {\r
        "message": "<span style=\\"color: red\\">Помилка запису файлу (xml2js не знайдено)</span>"\r
    },\r
    "savedSuccessfully": {\r
        "message": " збережено успішно!"\r
    },\r
    "endGetPoint": {\r
        "message": "Отримати точку кінця"\r
    },\r
    "endSendPoint": {\r
        "message": "Відправити точку кінця"\r
    },\r
    "osdSettingsSaved": {\r
        "message": "Налаштування OSD збережено"\r
    },\r
    "osdLayoutInsertedIntoClipboard": {\r
        "message": "Розташування збережено в буфер обміну"\r
    },\r
    "osdLayoutPasteFromClipboard": {\r
        "message": "Розташування було відновлено з буфера обміну"\r
    },\r
    "osdClearLayout": {\r
        "message": "Розташування очищено"\r
    },\r
    "failedToOpenSerialPort": {\r
        "message": "<span style=\\"color: red\\">Не вдалося</span> відкрити послідовний порт"\r
    },\r
    "failedToFlash": {\r
        "message": "<span style=color: red>Не вдалося</span> прошити"\r
    },\r
    "targetPrefetchsuccessful": {\r
        "message": "Попереднє завантаження цілі успішне: "\r
    },\r
    "targetPrefetchFail": {\r
        "message": "Не вдається передати ціль заздалегідь:"\r
    },\r
    "targetPrefetchFailDFU": {\r
        "message": "Неможливо заздалегідь завантажити цільову прошивку: польотний контролер у режимі DFU"\r
    },\r
    "targetPrefetchFailOld": {\r
        "message": "Не вдалося попередньо завантажити цільову прошивку: прошивка INAV застаріла"\r
    },\r
    "targetPrefetchFailNonINAV": {\r
        "message": "Не вдалося завантажити цільову прошивку: Не INAV прошивка"\r
    },\r
    "targetPrefetchFailNoPort": {\r
        "message": "Не вдається завантажити цільову прошивку: Немає порту"\r
    },\r
    "timerOutputs": {\r
        "message": "Виходи таймера"\r
    },\r
    "ezTuneFilterHz": {\r
        "message": "Частота фільтра Гц"\r
    },\r
    "ezTuneAxisRatio": {\r
        "message": "Співвідношення осей"\r
    },\r
    "ezTuneResponse": {\r
        "message": "Відгук"\r
    },\r
    "ezTuneDamping": {\r
        "message": "Демпфування"\r
    },\r
    "ezTuneStability": {\r
        "message": "Стабільність"\r
    },\r
    "ezTuneAggressiveness": {\r
        "message": "Агресивність"\r
    },\r
    "ezTuneRate": {\r
        "message": "Швидкість обертання"\r
    },\r
    "ezTuneExpo": {\r
        "message": "Експо"\r
    },\r
    "ezTuneSnappiness": {\r
        "message": "Швидкість реакції"\r
    },\r
    "ezTuneSnappinessTips": {\r
        "message": "Допомагає досягнути швидкої реакції на команди стіків. Коли ви робите швидкий рух стіком, високе значення Швидкості реакції прискорить реакцію дрона. Як при початку, так і в кінці маневру. Спробуйте різні значення, щоб знайти те, що вам найбільше підходить."\r
    },\r
    "ezTuneFilterHzTips": {\r
        "message": "Це встановлює базову частоту зрізу для всіх фільтрів гіроскопа та Д-складової INAV. Вищі значення призведуть до зменшення затримки фільтра та кращої стабілізації, але більше шуму пройде через фільтри, і двигуни нагріватимуться, БПЛА може почати осцилювати і стати некерованим. Ваша мета - збільшити це значення наскільки можливо до появи негативних ефектів. Негативні ефекти включають: гарячі двигуни, звуки осциляції, швидкі вібрації БПЛА, БПЛА самостійно набирає висоту. Зазвичай початкові точки для 'Частота фільтра (Гц)' такі: <strong>3-дюймові пропелери</strong>: 90, <strong>5-дюймові пропелери</strong>: 110, <strong>7-дюймові пропелери</strong>: 90, <strong>10-дюймові пропелери</strong>: 75, <strong>12-дюймові пропелери</strong>: 60. Використовуйте чорну скриню і здоровий глузд, щоб знайти значення, яке найкраще підходить для вашого БПЛА."\r
    },\r
    "ezTuneAxisRatioTips": {\r
        "message": "Описує розподіл ваги/моменту інерції вашого БПЛА. Чим довша рама (більша маса на осі перед-зад), тим більше потрібно співвідношення осей. Ідеальна X-подібна рама має співвідношення 100. Більшість сучасних рам повинні знаходитися в діапазоні від 110 до 130. Стандартне значення 110 є гарною відправною точкою."\r
    },\r
    "ezTuneResponseTips": {\r
        "message": "Це налаштування визначає, як швидко БПЛА реагуватиме на рухи стіків і сигнал гіроскопа. Вищі значення призведуть до швидшої реакції, але також до більшого перельоту і коливань. Якщо БПЛА здається млявим або має повільні коливання, збільшуйте Відгук. Якщо мотори перегріваються, чутно коливання, перекидання або БПЛА здається занадто нервовим, зменшуйте Відгук. Більшість сучасних квадрокоптерів з потужними моторами будуть краще літати з Відгуком нижче 80. Повинно бути налаштовано разом з Демпфуванням. Це еквівалентно П-складовій."\r
    },\r
    "ezTuneDampingTips": {\r
        "message": "Описує силу, що протистоїть будь-яким змінам швидкості обертання. Це послаблює прискорення крену та тангажа, що призводить до плавнішого та більш стабільного польоту. Ваше завдання під час налаштування - дізнатися, наскільки ви можете збільшити його перед тим, як з'являться будь-які негативні симптоми: гарячі мотори, уловимі на слух осциляції, перельоти. Більшість сучасних квадрокоптерів повинні приймати значення Демпфування до 150-180. Це еквівалент Д-складової."\r
    },\r
    "ezTuneStabilityTips": {\r
        "message": "Визначає силу довготривалої стабілізації. Більшість сучасних квадрокоптерів повинні витримувати Стабільність навіть до 120-130. Зазвичай не потребує налаштування взагалі. Якщо БПЛА страждає від сильної реакції на самотурбулентність (пропвош) під час вертикального спуску, зниження Стабільності може допомогти. Це еквівалент І-складової"\r
    },\r
    "ezTuneAggressivenessTips": {\r
        "message": "Визначає, з якою швидкістю ваш БПЛА реагуватиме на швидкі рухи стіками. Вища Агресивність призводить до більш різких швидких маневрів. Це не впливає на стабілізацію, лише на відчуття стіків. Це еквівалент складової упередження."\r
    },\r
    "ezTuneRateTips": {\r
        "message": "Визначає, як швидко ваш БПЛА буде обертатися навколо осей крену, тангажа і рискання. Більше значення 'Швидкості обертання' призводить до швидшого обертання. Значення 0 еквівалентне 300 градусам за секунду, 100 відповідає 600 градусів за секунду, 200 - 900 градусів за секунду."\r
    },\r
    "ezTuneExpoTips": {\r
        "message": "Визначає експоненційність команд пульта. Менші значення призводять до більш чутливого стіка в центрі. Більші значення призводять до менш чутливого центру і швидшої реакції в кінці ходу джойстика. Значення 0 еквівалентне експоненційності 0, значення 100 еквівалентне експоненційності 0.7, значення 200 еквівалентне експоненційності 1.0."\r
    },\r
    "ezTunePidPreview": {\r
        "message": "Попередній перегляд ПІД"\r
    },\r
    "ezTuneRatePreview": {\r
        "message": "Перегляд швидкостей"\r
    },\r
    "ezTuneRatePreviewAxis": {\r
        "message": "Вісь"\r
    },\r
    "ezTuneRatePreviewRate": {\r
        "message": "Швидкість"\r
    },\r
    "ezTuneRatePreviewExpo": {\r
        "message": "Експо"\r
    },\r
    "ezTuneEnabledTips": {\r
        "message": "Коли увімкнено, <strong>Ez Tune</strong> буде переписувати декілька налаштувань INAV, щоб спростити процес налаштування. Замість того, щоб налаштовувати кожен ПІД і налаштування фільтрації окремо, вам потрібно працювати лише з 7 повзунками. Ez Tune автоматично налаштує всі інші параметри відповідно до ваших потреб. Ez Tune є відмінною відправною точкою для нових користувачів і чудовим способом швидко налаштувати новий БПЛА. Не рекомендується використовувати Ez Tune на складних збірках, оскільки він переписує всі ваші налаштування, і ви не зможете точно налаштувати свій БПЛА. Коли Ez Tune увімкнено, налаштування з вкладки <strong>Налаштування ПІД</strong> будуть переписані EzTune."\r
    },\r
    "ezTuneDisclaimer": {\r
        "message": "<strong>Відмова від відповідальності:</strong> Ez Tune - експериментальна функція. Її робота не гарантована на всіх БПЛА. Її робота не гарантована зі всіма типами рам. Її робота не гарантована з усіма пропелерами. Всі обчислення та результати налаштування можуть змінитися в майбутніх версіях INAV. Ми все ж заохочуємо вас перевірити цю функцію та поділитися своїм досвідом на <strong>#ez-tune</strong> каналі у INAV Discord"\r
    },\r
    "ezTuneNote": {\r
        "message": "<strong>Важливо</strong> Ez Tune увімкнено. Усі налаштування на цій вкладці задаються та контролюються Ez Tune. Щоб використовувати вкладку Налаштування ПІД, необхідно вимкнути Ez Tune. Для цього зніміть прапорець <strong>Увімкнено</strong> на вкладці Легке налаштування."\r
    },\r
    "gsActivated": {\r
        "message": "Активовано режим наземної станції"\r
    },\r
    "gsDeactivated": {\r
        "message": "Режим наземної станції деактивовано"\r
    },\r
    "gsTelemetry": {\r
        "message": "Телеметрія"\r
    },\r
    "gsTelemetryLatitude": {\r
        "message": "Широта"\r
    },\r
    "gsTelemetryLongitude": {\r
        "message": "Довгота"\r
    },\r
    "gsTelemetryAltitude": {\r
        "message": "Висота"\r
    },\r
    "gsTelemetryAltitudeShort": {\r
        "message": "Висота"\r
    },\r
    "gsTelemetryVoltageShort": {\r
        "message": "Напр. бат."\r
    },\r
    "gsTelemetrySats": {\r
        "message": "Супутники"\r
    },\r
    "gsTelemetryFix": {\r
        "message": "Отримано"\r
    },\r
    "gsTelemetrySpeed": {\r
        "message": "Швидкість"\r
    },\r
    "maintenance": {\r
        "message": "Обслуговування"\r
    },\r
    "maintenanceFlushSettingsCache": {\r
        "message": "Очистити кеш налаштувань"\r
    },\r
    "gpsOptions": {\r
        "message": "Параметри GPS"\r
    },\r
    "gpsOptionsAssistnowToken": {\r
        "message": "Токен AssistNow"\r
    },\r
    "gpsLoadAssistnowOfflineButton": {\r
        "message": "Завантажити AssistNow офлайн"\r
    },\r
    "gpsLoadAssistnowOnlineButton": {\r
        "message": "Завантажити AssistNow онлайн"\r
    },\r
    "gpsAssistnowStart": {\r
        "message": "Розпочинається передача даних AssistNow..."\r
    },\r
    "gpsAssistnowDone": {\r
        "message": "Передача даних AssistNow завершена."\r
    },\r
    "gpsAssistnowUpdate": {\r
        "message": "Повідомлення AssistNow надіслані."\r
    },\r
    "gpsAssistnowLoadDataError": {\r
        "message": "Помилка завантаження даних AssistNow."\r
    },\r
    "adsbVehicleTotalMessages": {\r
        "message": "Повідомлення літального апарату"\r
    },\r
    "adsbHeartbeatTotalMessages": {\r
        "message": "Повід. сигналів перевірки"\r
    },\r
    "currentLanguage": {\r
        "message": "uk"\r
    },\r
    "search": {\r
        "message": "Пошук"\r
    }\r
}\r
`;export{n as default};
