document.addEventListener("DOMContentLoaded", () => {
    localStorage.setItem('sh_token', data.token);
    localStorage.setItem('sh_name', data.user.fullName);
    const headerBtns = document.querySelector('.header-btns');
    if (!headerBtns) return;

    if (token) {
        // Получаем имя из токена (payload — средняя часть JWT)
        let initials = '?';
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            // Если есть сохранённое имя — берём из localStorage
            const savedName = localStorage.getItem('sh_name');
            if (savedName) {
                initials = savedName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
            }
        } catch {}

        headerBtns.innerHTML = `
            <a href="dashboard.html" title="Личный кабинет" style="
                width: 38px; height: 38px; border-radius: 50%;
                background-color: var(--blue); color: white;
                display: flex; align-items: center; justify-content: center;
                font-size: 14px; font-weight: 700; text-decoration: none;
                flex-shrink: 0;
            " id="header-avatar">${initials}</a>
        `;
    }
});

window.logoutGlobal = function() {
    localStorage.removeItem('sh_token');
    localStorage.removeItem('sh_name');
    window.location.href = 'login.html';
};
