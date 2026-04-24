document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('sh_token'); // читаем токен из хранилища
    const headerBtns = document.querySelector('.header-btns');
    if (!headerBtns) return;

    if (token) {
        // Получаем инициалы из сохранённого имени
        let initials = '?';
        const savedName = localStorage.getItem('sh_name');
        if (savedName) {
            initials = savedName
                .split(' ')
                .map(w => w[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
        }

        // Заменяем кнопки «Войти / Регистрация» на аватар + кнопку выхода
        headerBtns.innerHTML = `
            <a href="dashboard.html" title="Личный кабинет" style="
                width: 38px; height: 38px; border-radius: 50%;
                background-color: var(--blue); color: white;
                display: flex; align-items: center; justify-content: center;
                font-size: 14px; font-weight: 700; text-decoration: none;
                flex-shrink: 0;
            " id="header-avatar">${initials}</a>
            <button onclick="logoutGlobal()" class="btn btn-outline" style="cursor: pointer;">
                Выйти
            </button>
        `;
    }
});

window.logoutGlobal = function () {
    localStorage.removeItem('sh_token');
    localStorage.removeItem('sh_name');
    window.location.href = 'login.html';
};
