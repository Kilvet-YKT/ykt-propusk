Vue.component('app-stats', {
    template: `
        <div class="stats-grid">
            <div class="stat-card" @click="showStatsModal('all')">
                <h4><i class="fas fa-clipboard-list"></i> ВСЕГО</h4>
                <div class="stat-number">{{ total }}</div>
                <div class="stat-label">заявок в системе</div>
            </div>
            <div class="stat-card" @click="showStatsModal('В работе')">
                <h4><i class="fas fa-spinner"></i> В РАБОТЕ</h4>
                <div class="stat-number">{{ inWork }}</div>
                <div class="stat-label">ожидают выноса</div>
            </div>
            <div class="stat-card" @click="showStatsModal('Вынесено')">
                <h4><i class="fas fa-truck"></i> ВЫНЕСЕНО</h4>
                <div class="stat-number">{{ out }}</div>
                <div class="stat-label">на руках</div>
            </div>
            <div class="stat-card" @click="showStatsModal('Возвращено')">
                <h4><i class="fas fa-check-circle"></i> ВОЗВРАЩЕНО</h4>
                <div class="stat-number">{{ returned }}</div>
                <div class="stat-label">завершено</div>
            </div>
        </div>
    `,
    props: ['requests'],
    computed: {
        total() { return this.requests.length; },
        inWork() { return this.requests.filter(r => r.status === 'В работе').length; },
        out() { return this.requests.filter(r => r.status === 'Вынесено').length; },
        returned() { return this.requests.filter(r => r.status === 'Возвращено').length; }
    },
    methods: {
        showStatsModal(status) {
            let title = '';
            let filteredRequests = [];
            
            if (status === 'all') {
                title = 'Все заявки';
                filteredRequests = this.requests;
            } else {
                title = `Заявки со статусом "${status}"`;
                filteredRequests = this.requests.filter(r => r.status === status);
            }
            
            this.$emit('show-stats', {
                title: title,
                status: status,
                requests: filteredRequests,
                count: filteredRequests.length
            });
        }
    }
});