document.addEventListener('DOMContentLoaded', () => {
    const welcomeOverlay = document.getElementById('welcomeOverlay');
    const startButton = document.getElementById('startButton');
    const storageKey = 'welcomeDismissed'; // Ключ для localStorage

    // Проверяем, был ли блок уже скрыт ранее
    if (localStorage.getItem(storageKey) === 'true') {
        // Если да, сразу скрываем его без анимации (или с ней, если нужно)
        welcomeOverlay.style.display = 'none'; // Быстрое скрытие
        // или можно добавить класс для скрытия с анимацией, если элемент должен быть в DOM
        // welcomeOverlay.classList.add('welcome-overlay--hidden');
        return; // Выходим, чтобы не вешать лишний слушатель
    }

    // Показываем блок (на случай, если он был скрыт стилями по умолчанию)
    // Обычно это не нужно, если он видим по умолчанию
    // welcomeOverlay.style.display = 'flex';

    // Добавляем обработчик клика на кнопку
    if (startButton && welcomeOverlay) {
        startButton.addEventListener('click', () => {
            // 1. Добавляем класс для запуска анимации скрытия
            welcomeOverlay.classList.add('welcome-overlay--hidden');

            // 2. Запоминаем, что пользователь нажал кнопку
            try {
                localStorage.setItem(storageKey, 'true');
            } catch (e) {
                // Обработка ошибки, если localStorage недоступен (например, в режиме инкогнито в некоторых браузерах)
                console.error("Не удалось сохранить состояние в localStorage:", e);
                // В этом случае блок просто скроется до следующей перезагрузки
            }

            // 3. Опционально: можно удалить элемент из DOM после завершения анимации
            // Это не обязательно, так как visibility: hidden и pointer-events: none его убирают
            // welcomeOverlay.addEventListener('transitionend', () => {
            //     if (welcomeOverlay.classList.contains('welcome-overlay--hidden')) {
            //        welcomeOverlay.remove();
            //     }
            // }, { once: true }); // Выполнится только один раз
        });
    } else {
        console.error("Не найдены элементы welcomeOverlay или startButton");
    }
});