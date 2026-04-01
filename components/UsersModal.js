Vue.component('users-modal', {
    template: `
        <div class="modal" @click.self="close">
            <div class="modal-content">
                <div class="flex-between" style="margin-bottom: 24px;">
                    <h2 style="margin-bottom: 0;"><i class="fas fa-users-cog"></i> Управление пользователями</h2>
                    <button class="btn-outline btn-sm" @click="close"><i class="fas fa-times"></i></button>
                </div>
                
                <div class="section-bg" style="margin-bottom: 24px;">
                    <h3><i class="fas fa-user-plus"></i> Добавить пользователя</h3>
                    <div class="form-grid">
                        <div class="form-field">
                            <label>Логин</label>
                            <input v-model="newLogin" placeholder="login">
                        </div>
                        <div class="form-field">
                            <label>Пароль</label>
                            <input type="password" v-model="newPassword" placeholder="******">
                        </div>
                        <div class="form-field">
                            <label>Подтверждение</label>
                            <input type="password" v-model="newPasswordConfirm" placeholder="******">
                        </div>
                        <div class="form-field">
                            <label>Роль</label>
                            <select v-model="newRole">
                                <option value="user">👤 Пользователь</option>
                                <option value="admin">👑 Администратор</option>
                            </select>
                        </div>
                        <button @click="createUser" style="align-self: flex-end;">
                            <i class="fas fa-plus"></i> Создать
                        </button>
                    </div>
                </div>
                
                <h3><i class="fas fa-list"></i> Список пользователей</h3>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Логин</th>
                                <th>Роль</th>
                                <th style="width: 100px;">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="u in users" :key="u.id">
                                <td>{{ u.id }}</td>
                                <td><i class="fas fa-user"></i> {{ u.login }}</td>
                                <td>
                                    <span class="badge" :style="u.role === 'admin' ? 'background:#f3f4f6; color:#667eea' : 'background:#f3f4f6; color:#6b7280'">
                                        {{ u.role === 'admin' ? '👑 Админ' : '👤 Пользователь' }}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn-success btn-sm" @click="editUser(u)" style="margin-right: 6px;">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button v-if="u.login !== 'admin'" class="btn-danger btn-sm" @click="$emit('delete-user', u.id)">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `,
    props: ['users', 'visible'],
    data() {
        return {
            newLogin: '',
            newPassword: '',
            newPasswordConfirm: '',
            newRole: 'user'
        };
    },
    methods: {
        close() {
            this.$emit('close');
        },
        async createUser() {
            if (!this.newLogin.trim() || !this.newPassword.trim()) {
                alert('Заполните логин и пароль');
                return;
            }
            if (this.newPassword !== this.newPasswordConfirm) {
                alert('Пароли не совпадают');
                return;
            }
            this.$emit('create-user', {
                login: this.newLogin,
                password: this.newPassword,
                role: this.newRole
            });
            this.newLogin = '';
            this.newPassword = '';
            this.newPasswordConfirm = '';
        },
        editUser(user) {
            this.$emit('edit-user', user);
        }
    }
});