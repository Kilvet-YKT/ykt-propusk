Vue.component('requests-list', {
    template: `
        <div class="card">
            <div class="flex-between">
                <h2><i class="fas fa-table-list"></i> Все заявки</h2>
                <div style="display: flex; gap: 12px;">
                    <div class="filter-badge" @click="$emit('filter-change', 'all')" :class="{ active: statusFilter === 'all' }">
                        
                    </div>
                    <div class="filter-badge" @click="$emit('filter-change', 'В работе')" :class="{ active: statusFilter === 'В работе' }">
                        
                    </div>
                    <div class="filter-badge" @click="$emit('filter-change', 'Вынесено')" :class="{ active: statusFilter === 'Вынесено' }">
                        
                    </div>
                    <div class="filter-badge" @click="$emit('filter-change', 'Возвращено')" :class="{ active: statusFilter === 'Возвращено' }">
                       
                    </div>
                    <button @click="$emit('export')" class="btn-outline btn-sm">
                        <i class="fas fa-file-excel"></i> Excel
                    </button>
                </div>
            </div>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>№</th>
                            <th>Дата</th>
                            <th>Сотрудник</th>
                            <th>Статус</th>
                            <th>Проверил вынос</th>
                            <th>Проверил возврат</th>
                            <th style="min-width: 200px;">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="req in requests" :key="req.id">
                            <td><strong>{{ req.request_number }}</strong></td>
                            <td>{{ req.date }}</td>
                            <td>{{ req.carrier_name }}</td>
                            <td><span :class="'badge ' + getStatusClass(req.status)">{{ req.status }}</span></td>
                            <td>{{ req.checked_out_by || '—' }}</td>
                            <td>{{ req.returned_by || '—' }}</td>
                            <td>
                                <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                                    <button class="btn-print btn-sm" @click="$emit('print', req)"><i class="fas fa-print"></i></button>
                                    <button v-if="req.status === 'В работе'" class="btn-sm" style="background: #3b82f6;" @click="$emit('update-status', req, 'Вынесено', 'checked_out_by')">
                                        <i class="fas fa-truck"></i> Вынести
                                    </button>
                                    <button v-if="req.status === 'В работе'" class="btn-sm" style="background: #8b5cf6;" @click="$emit('update-status', req, 'Возвращено', 'returned_by')">
                                        <i class="fas fa-undo-alt"></i> Вернуть
                                    </button>
                                    <button v-if="req.status === 'Вынесено'" class="btn-sm" style="background: #8b5cf6;" @click="$emit('update-status', req, 'Возвращено', 'returned_by')">
                                        <i class="fas fa-check"></i> Возврат
                                    </button>
                                    <button class="btn-danger btn-sm" @click="$emit('delete', req.id)"><i class="fas fa-trash"></i></button>
                                    <button class="btn-outline btn-sm" @click="$emit('show-items', req)"><i class="fas fa-box"></i></button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `,
    props: ['requests', 'statusFilter'],
    methods: {
        getStatusClass(status) {
            if (status === 'В работе') return 'status-work';
            if (status === 'Вынесено') return 'status-out';
            return 'status-return';
        }
    }
});