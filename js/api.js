// API конфигурация
const API_URL = 'api.php';

// Глобальные функции API
const API = {
    // Аутентификация
    async login(login, password) {
        const creds = btoa(`${login}:${password}`);
        const res = await fetch(API_URL + '?path=requests', { 
            headers: { 'Authorization': `Basic ${creds}` } 
        });
        if (res.ok) return creds;
        throw new Error('Неверный логин или пароль');
    },

    // Заявки
    async getRequests(token, status = 'all') {
        const res = await fetch(`${API_URL}?path=requests&status=${status}`, { 
            headers: { 'Authorization': `Basic ${token}` } 
        });
        if (res.status === 401) throw new Error('Unauthorized');
        return await res.json();
    },

    async createRequest(token, data) {
        const res = await fetch(`${API_URL}?path=requests`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Basic ${token}` 
            },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    async updateRequestStatus(token, id, status, field, inspectorName) {
        const res = await fetch(`${API_URL}?path=requests/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Basic ${token}` 
            },
            body: JSON.stringify({ status, field, inspectorName })
        });
        return await res.json();
    },

    async deleteRequest(token, id) {
        const res = await fetch(`${API_URL}?path=requests/${id}`, { 
            method: 'DELETE', 
            headers: { 'Authorization': `Basic ${token}` } 
        });
        return res.ok;
    },

    async exportToExcel(token) {
        const res = await fetch(`${API_URL}?path=export`, { 
            headers: { 'Authorization': `Basic ${token}` } 
        });
        return await res.blob();
    },

    // Пользователи
    async getUsers(token) {
        const res = await fetch(`${API_URL}?path=users`, { 
            headers: { 'Authorization': `Basic ${token}` } 
        });
        return await res.json();
    },

    async createUser(token, login, password, role) {
        const res = await fetch(`${API_URL}?path=users`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Basic ${token}` 
            },
            body: JSON.stringify({ login, password, role })
        });
        return await res.json();
    },

    async updateUser(token, id, login, password, role) {
        const res = await fetch(`${API_URL}?path=users/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Basic ${token}` 
            },
            body: JSON.stringify({ login, password, role })
        });
        return await res.json();
    },

    async deleteUser(token, id) {
        const res = await fetch(`${API_URL}?path=users/${id}`, { 
            method: 'DELETE', 
            headers: { 'Authorization': `Basic ${token}` } 
        });
        return res.ok;
    },

    // Утилиты
    getUserRole(token) {
        const login = atob(token).split(':')[0];
        return login === 'admin' ? 'admin' : 'user';
    },

    showMessage(message, duration = 3000) {
        // Будет переопределено в app.js
        if (window.app && window.app.showMessage) {
            window.app.showMessage(message);
        }
    }
};