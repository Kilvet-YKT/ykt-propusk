Vue.component('stats-modal', {
    template: `
        <div class="modal" @click.self="close">
            <div class="modal-content stats-modal">
                <div class="flex-between" style="margin-bottom: 20px;">
                    <h2 style="margin-bottom: 0;">
                        <i class="fas fa-chart-bar"></i> {{ title }}
                        <span class="stat-badge">{{ count }} {{ getDeclension(count) }}</span>
                    </h2>
                    <button class="btn-outline btn-sm" @click="close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div v-if="requests.length === 0" class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>Нет заявок в этой категории</p>
                </div>
                
                <div v-else>
                    <!-- Краткая статистика -->
                    <div class="stats-summary">
                        <div class="summary-item">
                            <span class="summary-label">Всего заявок:</span>
                            <span class="summary-value">{{ count }}</span>
                        </div>
                        <div class="summary-item" v-if="status !== 'all'">
                            <span class="summary-label">Статус:</span>
                            <span class="summary-value">{{ status }}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Сотрудников:</span>
                            <span class="summary-value">{{ uniqueCarriers }}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Позиций оборудования:</span>
                            <span class="summary-value">{{ totalItems }}</span>
                        </div>
                    </div>
                    
                    <!-- Список заявок -->
                    <div class="table-wrapper">
                        <table class="stats-table">
                            <thead>
                                <tr>
                                    <th>№ заявки</th>
                                    <th>Дата</th>
                                    <th>Сотрудник</th>
                                    <th>Оборудование</th>
                                    <th>Проверил</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="req in requests" :key="req.id">
                                    <td><strong>{{ req.request_number }}</strong></td>
                                    <td>{{ req.date }}</td>
                                    <td>{{ req.carrier_name }}</td>
                                    <td>
                                        <div v-for="(item, idx) in req.items" :key="idx" class="item-list">
                                            {{ item.item_name || item.name }}
                                            <span v-if="item.serial_number || item.sn">({{ item.serial_number || item.sn }})</span>
                                            - {{ item.quantity || item.qty }}
                                        </div>
                                    </td>
                                    <td>
                                        <div v-if="req.status === 'Вынесено'">
                                            {{ req.checked_out_by || '—' }}
                                        </div>
                                        <div v-else-if="req.status === 'Возвращено'">
                                            {{ req.returned_by || '—' }}
                                        </div>
                                        <div v-else>—</div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button @click="exportStats" class="btn-outline btn-sm">
                        <i class="fas fa-file-excel"></i> Экспортировать
                    </button>
                    <button @click="close" class="btn-outline btn-sm">
                        <i class="fas fa-times"></i> Закрыть
                    </button>
                </div>
            </div>
        </div>
    `,
    props: ['title', 'status', 'requests', 'count', 'visible'],
    computed: {
        uniqueCarriers() {
            const carriers = new Set(this.requests.map(r => r.carrier_name));
            return carriers.size;
        },
        totalItems() {
            return this.requests.reduce((sum, req) => sum + (req.items ? req.items.length : 0), 0);
        }
    },
    methods: {
        close() {
            this.$emit('close');
        },
        getDeclension(count) {
            const lastDigit = count % 10;
            const lastTwoDigits = count % 100;
            
            if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'заявок';
            if (lastDigit === 1) return 'заявка';
            if (lastDigit >= 2 && lastDigit <= 4) return 'заявки';
            return 'заявок';
        },
        exportStats() {
            // Формируем данные для экспорта
            let exportData = [];
            this.requests.forEach(req => {
                const itemsList = (req.items || []).map(i => 
                    `${i.item_name || i.name}${i.serial_number || i.sn ? ' (' + (i.serial_number || i.sn) + ')' : ''} - ${i.quantity || i.qty}`
                ).join('; ');
                
                exportData.push({
                    '№ заявки': req.request_number,
                    'Дата': req.date,
                    'Сотрудник': req.carrier_name,
                    'ФИО для выноса': req.employee_fio,
                    'Согласовано': req.approved_by,
                    'Оборудование': itemsList,
                    'Статус': req.status,
                    'Проверил вынос': req.checked_out_by || '',
                    'Проверил возврат': req.returned_by || ''
                });
            });
            
            // Создаем Excel файл
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Статистика');
            
            const filename = `statistika_${this.status}_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.xlsx`;
            XLSX.writeFile(wb, filename);
        }
    }
});