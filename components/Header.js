Vue.component('app-header', {
    template: `
        <div class="card">
            <div class="flex-between">
                <div class="header-logo">
                    <img 
                        src="logo.png" 
                        alt="Ykt.ru" 
                        class="logo-img"
                        @error="handleLogoError"
                        v-show="logoLoaded"
                    >
                    <h1 v-show="!logoLoaded">Ykt.ru</h1>
                    <h1 v-show="logoLoaded" style="margin:0;">Система создания и учета заявок-пропусков</h1>
                </div>
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div class="badge" style="background: #f3f4f6; color: #667eea;">
                        <i :class="userRole === 'admin' ? 'fa-crown' : 'fa-user'"></i>
                        {{ userRole === 'admin' ? 'Администратор' : 'Пользователь' }}
                    </div>
                    <button v-if="userRole === 'admin'" class="btn-outline btn-sm" @click="$emit('open-users')">
                        <i class="fas fa-users"></i> Пользователи
                    </button>
                    <button @click="$emit('logout')" class="btn-outline btn-sm">
                        <i class="fas fa-sign-out-alt"></i> Выйти
                    </button>
                </div>
            </div>
            <div v-if="message" class="alert">{{ message }}</div>
        </div>
    `,
    props: ['userRole', 'message'],
    data() {
        return {
            logoLoaded: true
        };
    },
    methods: {
        handleLogoError() {
            this.logoLoaded = false;
        }
    }
});