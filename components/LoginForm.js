// Компонент формы входа
Vue.component('login-form', {
    template: `
        <div class="card" style="max-width: 420px; margin: 5rem auto;">
            <div class="logo-container">
                <img 
                    src="logo.png" 
                    alt="Ykt.ru" 
                    class="logo-img"
                    @error="handleLogoError"
                    v-show="logoLoaded"
                >
                <h1 v-show="!logoLoaded" style="font-size: 2rem;">Ykt.ru</h1>
            </div>
            <h2 style="text-align: center; justify-content: center;">
                <i class="fas fa-lock"></i> Вход в систему
            </h2>
            <form @submit.prevent="doLogin">
                <div class="form-field">
                    <label><i class="fas fa-user"></i> Логин</label>
                    <input v-model="login" type="text" placeholder="Введите логин" autofocus>
                </div>
				</br>
                <div class="form-field">
                    <label><i class="fas fa-key"></i> Пароль</label>
                    <input v-model="password" type="password" placeholder="Введите пароль">
                </div>
                <button type="submit" style="width: 100%; margin-top: 8px; justify-content: center;">
                    <i class="fas fa-sign-in-alt"></i> Войти
                </button>
            </form>
            <div v-if="error" class="alert" style="margin-top: 20px;">
                <i class="fas fa-exclamation-triangle"></i> {{ error }}
            </div>
        </div>
    `,
    data() {
        return {
            login: '',
            password: '',
            error: '',
            logoLoaded: true
        };
    },
    methods: {
        handleLogoError() {
            this.logoLoaded = false;
        },
        async doLogin() {
            try {
                const token = await API.login(this.login, this.password);
                this.$emit('login-success', token);
            } catch(e) {
                this.error = e.message;
            }
        }
    }
});