// Основное Vue приложение
const app = new Vue({
    el: '#app',
    template: `
        <div class="container">
            <!-- Страница входа -->
            <login-form v-if="!token" @login-success="handleLogin" />
            
            <!-- Основной интерфейс -->
            <div v-else>
                <app-header 
                    :user-role="userRole" 
                    :message="infoMessage"
                    @logout="logout"
                    @open-users="openUsersModal"
                />
                
                <app-stats 
                    :requests="requests"
                    @show-stats="showStatsModal"
                />
                
                <request-form @create="createRequest" />
                
                <requests-list 
                    :requests="filteredRequests"
                    :status-filter="statusFilter"
                    @filter-change="statusFilter = $event; fetchRequests()"
                    @export="exportToExcel"
                    @print="printRequest"
                    @update-status="updateStatus"
                    @delete="deleteRequest"
                    @show-items="showItems"
                />
                
                <users-modal 
                    v-if="showUsersModal"
                    :users="users"
                    :visible="showUsersModal"
                    @close="closeUsersModal"
                    @create-user="createUser"
                    @edit-user="editUser"
                    @delete-user="deleteUser"
                />
                
                <stats-modal 
                    v-if="statsModal.visible"
                    :title="statsModal.title"
                    :status="statsModal.status"
                    :requests="statsModal.requests"
                    :count="statsModal.count"
                    :visible="statsModal.visible"
                    @close="closeStatsModal"
                />
                
                <div v-if="showEditModal" class="modal" @click.self="showEditModal = false">
                    <div class="modal-content">
                        <h2><i class="fas fa-user-edit"></i> Редактирование пользователя</h2>
                        <div class="form-field" style="margin: 16px 0;">
                            <label>Логин</label>
                            <input v-model="editUserForm.login" :disabled="editUserForm.login === 'admin'">
                        </div>
                        <div class="form-field" style="margin: 16px 0;">
                            <label>Новый пароль (оставьте пустым)</label>
                            <input type="password" v-model="editUserForm.password" placeholder="••••••••">
                        </div>
                        <div class="form-field" style="margin: 16px 0;">
                            <label>Подтверждение</label>
                            <input type="password" v-model="editUserForm.passwordConfirm">
                        </div>
                        <div class="form-field" style="margin: 16px 0;">
                            <label>Роль</label>
                            <select v-model="editUserForm.role" :disabled="editUserForm.login === 'admin'">
                                <option value="user">Пользователь</option>
                                <option value="admin">Администратор</option>
                            </select>
                        </div>
                        <div class="flex-between" style="margin-top: 24px;">
                            <button @click="saveUserEdit"><i class="fas fa-save"></i> Сохранить</button>
                            <button class="btn-outline" @click="showEditModal = false"><i class="fas fa-times"></i> Отмена</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            token: localStorage.getItem('token'),
            userRole: '',
            infoMessage: '',
            requests: [],
            statusFilter: 'all',
            users: [],
            showUsersModal: false,
            showEditModal: false,
            statsModal: {
                visible: false,
                title: '',
                status: '',
                requests: [],
                count: 0
            },
            editUserForm: {
                id: null,
                login: '',
                password: '',
                passwordConfirm: '',
                role: 'user'
            }
        };
    },
    computed: {
        filteredRequests() {
            if (this.statusFilter === 'all') return this.requests;
            return this.requests.filter(r => r.status === this.statusFilter);
        }
    },
    mounted() {
        if (this.token) {
            this.userRole = API.getUserRole(this.token);
            this.fetchRequests();
            if (this.userRole === 'admin') this.fetchUsers();
        }
    },
    methods: {
        // ==================== АУТЕНТИФИКАЦИЯ ====================
        handleLogin(token) {
            this.token = token;
            localStorage.setItem('token', token);
            this.userRole = API.getUserRole(token);
            this.fetchRequests();
            if (this.userRole === 'admin') this.fetchUsers();
        },
        
        logout() {
            this.token = null;
            localStorage.removeItem('token');
            this.userRole = '';
            this.requests = [];
            this.users = [];
            this.showUsersModal = false;
            this.statsModal.visible = false;
        },
        
        // ==================== ЗАЯВКИ ====================
        async fetchRequests() {
            try {
                this.requests = await API.getRequests(this.token, this.statusFilter);
            } catch(e) {
                if (e.message === 'Unauthorized') this.logout();
            }
        },
        
        async createRequest(data) {
            if (!data.carrierName || !data.employeeFio || !data.items.length) {
                alert('Заполните все поля и добавьте хотя бы одну позицию');
                return;
            }
            const result = await API.createRequest(this.token, data);
            if (result.success) {
                this.showMessage(`Заявка №${result.requestNumber} создана`);
                this.fetchRequests();
            } else {
                alert(result.error);
            }
        },
        
        async updateStatus(req, newStatus, field) {
            let inspectorName = '';
            if (field === 'checked_out_by') {
                inspectorName = prompt('Кто проверил перед выносом?');
            } else if (field === 'returned_by') {
                inspectorName = prompt('Кто проверил при возврате?');
            }
            if (field && !inspectorName) return;
            
            try {
                await API.updateRequestStatus(this.token, req.id, newStatus, field, inspectorName);
                this.showMessage(`Статус изменён на "${newStatus}"`);
                this.fetchRequests();
            } catch(e) {
                alert('Ошибка при изменении статуса');
            }
        },
        
        async deleteRequest(id) {
            if (!confirm('Удалить заявку?')) return;
            await API.deleteRequest(this.token, id);
            this.showMessage('Заявка удалена');
            this.fetchRequests();
        },
        
        async exportToExcel() {
            const blob = await API.exportToExcel(this.token);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Заявки_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.xls`;
            a.click();
            URL.revokeObjectURL(url);
            this.showMessage('Экспорт выполнен успешно');
        },
        
        printRequest(req) {
            const w = window.open('', '_blank');
            const dateObj = new Date(req.date);
            const day = dateObj.getDate().toString().padStart(2,'0');
            const month = (dateObj.getMonth()+1).toString().padStart(2,'0');
            const year = dateObj.getFullYear();
            const monthName = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'][parseInt(month)-1];
            const cur = new Date();
            const curDay = `${cur.getDate().toString().padStart(2,'0')}.${(cur.getMonth()+1).toString().padStart(2,'0')}.${cur.getFullYear()}`;
            let itemsHtml = '';
            
            if (req.items && req.items.length) {
                req.items.forEach((item, idx) => {
                    itemsHtml += `<tr>
                        <td style="border:1px solid black; padding:6px;">${idx+1}</td>
                        <td style="border:1px solid black; padding:6px;">${escapeHtml(item.item_name || item.name)}</td>
                        <td style="border:1px solid black; padding:6px;">${escapeHtml(item.serial_number || item.sn || '—')}</td>
                        <td style="border:1px solid black; padding:6px;">${escapeHtml(item.quantity || item.qty || 'Один')}</td>
                    </tr>`;
                });
            }
            
            for(let i = (req.items ? req.items.length : 0); i < 6; i++) {
                itemsHtml += `<tr>
                    <td style="border:1px solid black; padding:6px;">${i+1}</td>
                    <td style="border:1px solid black; padding:6px;">&nbsp;</td>
                    <td style="border:1px solid black; padding:6px;">&nbsp;</td>
                    <td style="border:1px solid black; padding:6px;">&nbsp;</td>
                </tr>`;
            }
            
            w.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Заявка-пропуск №${req.request_number}</title>
                    <style>
                        body { font-family: 'Times New Roman', Times, serif; margin: 0; padding: 0; font-size: 12pt; }
                        @page { margin: 0; size: A4; }
                        .print-area { padding: 2cm 1cm 1cm 2cm; }
                        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                        th, td { border: 1px solid black; padding: 6px; vertical-align: top; }
                        .center { text-align: center; margin-top: 2px; }
                        .sig-row { margin: 20px 0; display: flex; align-items: baseline; }
                        .sig-row .label { white-space: nowrap; margin-right: 10px; }
                        .sig-row .line { flex-grow: 1; border-bottom: 1px solid #000; }
                        .date-row { margin: 25px 0; display: flex; justify-content: space-between; align-items: baseline; }
                        .date-row .date-part { white-space: nowrap; }
                        .date-row u { border-bottom: 1px solid #000; padding-bottom: 2px; }
                        .d-day { display: inline-block; width: 25px; }
                        .d-month { display: inline-block; width: 120px; }
                        .d-year { display: inline-block; width: 35px; }
                        .underline { border-bottom: 1px solid black; display: inline-block; min-width: 150px; margin-left: 10px; }
                        .bold { font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="print-area">
                        <div class="bold">ООО "Локальные сервисы"</div>
                        <div class="bold" style="text-align:center; font-weight:bold; font-size:14pt; margin:15px 0 5px;">ЗАЯВКА-ПРОПУСК № ${req.request_number}</div>
                        <div class="bold" style="text-align:center;">на вынос материальных ценностей из делового здания компании</div>
                        <div class="bold" style="text-align:center;">Drivee, г. Якутск, 203 мкрн, д. 28</div>
                        <div class="bold" style="margin:10px 0;">«${day}» ${monthName} ${year} г.</div>
                        <div>Основание на вынос для работы вне офиса</div>
                        <table>
                            <thead>
                                <tr>
                                    <th>№ п/п</th>
                                    <th>Наименование</th>
                                    <th>Серийный номер</th>
                                    <th>Количество</th>
                                </tr>
                            </thead>
                            <tbody>${itemsHtml}</tbody>
                        </table>
                        <div style="margin:15px 0;">Использование оборудования для работы вне офиса ${escapeHtml(req.employee_fio)} согласовано ${escapeHtml(req.approved_by)}<span class="underline"></span></div>
                        <div class="center">(подпись, должность, инициалы, фамилия)</div>
                        
                        <div style="margin-top:25px;"><strong>ВЫНОС РАЗРЕШАЮ:</strong></div>
                        
                        <div class="sig-row">
                            <span class="label">Управляющий объектом</span>
                            <span class="line"></span>
                        </div>
                        
                        <div class="date-row">
                            <span>Материальные ценности проверены и вынесены</span>
                            <span class="date-part">«<u class="d-day"></u>» <u class="d-month"></u> 20<u class="d-year"></u> г.</span>
                        </div>
                        
                        <div class="sig-row">
                            <span class="label">Сотрудник охраны</span>
                            <span class="line"></span>
                        </div>
                        <div class="center">(подпись, инициалы, фамилия)</div>
                        
                        ${req.status === 'Вынесено' ? `<hr><div>Проверил перед выносом: ${req.checked_out_by || '______________'}<br>Дата выноса: ${curDay}</div>` : ''}
                        ${req.status === 'Возвращено' ? `<hr><div>Проверил при возврате: ${req.returned_by || '______________'}<br>Дата возврата: ${curDay}</div>` : ''}
                    </div>
                </body>
                </html>
            `);
            w.document.close();
            w.print();
        },
        
        showItems(req) {
            if (!req.items || req.items.length === 0) {
                alert('📦 Оборудование не указано');
                return;
            }
            const list = req.items.map(i => `${i.item_name || i.name} (${i.serial_number || i.sn || '—'}) — ${i.quantity || i.qty || 'Один'}`).join('\n');
            alert('📦 Оборудование:\n' + list);
        },
        
        // ==================== ПОЛЬЗОВАТЕЛИ ====================
        async fetchUsers() {
            this.users = await API.getUsers(this.token);
        },
        
        openUsersModal() {
            this.showUsersModal = true;
            this.fetchUsers();
        },
        
        closeUsersModal() {
            this.showUsersModal = false;
        },
        
        async createUser(data) {
            if (!data.login.trim() || !data.password.trim()) {
                alert('Заполните логин и пароль');
                return;
            }
            const result = await API.createUser(this.token, data.login, data.password, data.role);
            if (result.success) {
                this.showMessage('Пользователь создан');
                this.fetchUsers();
            } else {
                alert(result.error || 'Ошибка при создании пользователя');
            }
        },
        
        editUser(user) {
            this.editUserForm = {
                id: user.id,
                login: user.login,
                password: '',
                passwordConfirm: '',
                role: user.role
            };
            this.showEditModal = true;
        },
        
        async saveUserEdit() {
            if (this.editUserForm.password && this.editUserForm.password !== this.editUserForm.passwordConfirm) {
                alert('Пароли не совпадают');
                return;
            }
            const result = await API.updateUser(
                this.token, 
                this.editUserForm.id, 
                this.editUserForm.login, 
                this.editUserForm.password || null, 
                this.editUserForm.role
            );
            if (result.success) {
                this.showMessage('Пользователь обновлён');
                this.showEditModal = false;
                this.fetchUsers();
            } else {
                alert(result.error || 'Ошибка при обновлении пользователя');
            }
        },
        
        async deleteUser(id) {
            if (!confirm('Удалить пользователя?')) return;
            await API.deleteUser(this.token, id);
            this.showMessage('Пользователь удалён');
            this.fetchUsers();
        },
        
        // ==================== СТАТИСТИКА ====================
        showStatsModal(data) {
            this.statsModal = {
                visible: true,
                title: data.title,
                status: data.status,
                requests: data.requests,
                count: data.count
            };
        },
        
        closeStatsModal() {
            this.statsModal.visible = false;
        },
        
        // ==================== УТИЛИТЫ ====================
        showMessage(msg) {
            this.infoMessage = msg;
            setTimeout(() => this.infoMessage = '', 3000);
        }
    }
});

// Глобальная функция для escapeHtml
window.escapeHtml = function(str) { 
    if(!str) return ''; 
    return str.replace(/[&<>]/g, function(m){
        if(m === '&') return '&amp;'; 
        if(m === '<') return '&lt;'; 
        if(m === '>') return '&gt;'; 
        return m;
    }); 
};