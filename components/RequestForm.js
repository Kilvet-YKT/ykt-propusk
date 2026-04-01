Vue.component('request-form', {
    template: `
        <div class="card">
            <h2><i class="fas fa-plus-circle"></i> Новая заявка-пропуск</h2>
            <div class="form-grid">
                <div class="form-field">
                    <label><i class="fas fa-hashtag"></i> Номер заявки</label>
                    <input v-model="localRequestNumber" placeholder="Авто (оставьте пустым)">
                </div>
                <div class="form-field">
                    <label><i class="fas fa-calendar"></i> Дата</label>
                    <input type="date" v-model="localDate">
                </div>
                <div class="form-field">
                    <label><i class="fas fa-user-check"></i> Сотрудник (кто выносит)</label>
                    <input v-model="localCarrierName" placeholder="Иванов Иван Иванович">
                </div>
            </div>
            <div class="section-bg">
                <h3><i class="fas fa-handshake"></i> Согласование</h3>
                <div class="form-grid">
                    <div class="form-field">
                        <label><i class="fas fa-signature"></i> Кем будет использоваться оборудование вне офиса</label>
                        <input v-model="localEmployeeFio" placeholder="Ивановым Иваном Ивановичем">
                    </div>
                    <div class="form-field">
                        <label><i class="fas fa-check-double"></i> Согласовано (должность, ФИО)</label>
                        <input v-model="localApprovedBy">
                    </div>
                </div>
            </div>
            <h3><i class="fas fa-boxes"></i> Материальные ценности</h3>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 40px;">№</th>
                            <th>Наименование</th>
                            <th>Серийный номер</th>
                            <th>Количество (прописью)</th>
                            <th style="width: 80px;"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, idx) in localItems" :key="idx">
                            <td>{{ idx+1 }}</td>
                            <td><input v-model="item.name" placeholder="Наименование" style="width:100%"></td>
                            <td><input v-model="item.sn" placeholder="Серийный номер" style="width:100%"></td>
                            <td><input v-model="item.qty" placeholder="Один, Два..." style="width:100%"></td>
                            <td><button class="btn-outline btn-sm" @click="removeItem(idx)"><i class="fas fa-trash"></i></button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <button class="btn-outline" @click="addItem" style="margin-top: 16px;">
                <i class="fas fa-plus"></i> Добавить позицию
            </button>
            <div class="flex-between" style="margin-top: 24px;">
                <button @click="create"><i class="fas fa-save"></i> Создать заявку</button>
                <button class="btn-outline" @click="clear"><i class="fas fa-eraser"></i> Очистить форму</button>
            </div>
        </div>
    `,
    data() {
        return {
            localRequestNumber: '',
            localDate: new Date().toISOString().slice(0,10),
            localCarrierName: '',
            localEmployeeFio: '',
            localApprovedBy: 'Операционный директор Антипина А.С.',
            localItems: []
        };
    },
    methods: {
        addItem() {
            this.localItems.push({ name: '', sn: '', qty: '' });
        },
        removeItem(idx) {
            this.localItems.splice(idx, 1);
        },
        clear() {
            this.localDate = new Date().toISOString().slice(0,10);
            this.localRequestNumber = '';
            this.localCarrierName = '';
            this.localEmployeeFio = '';
            this.localApprovedBy = 'Операционный директор Антипина А.С.';
            this.localItems = [];
        },
        async create() {
            if (!this.localCarrierName.trim() || !this.localEmployeeFio.trim() || 
                this.localItems.length === 0 || this.localItems.every(i=>!i.name.trim())) {
                alert('Заполните все поля и добавьте хотя бы одну позицию');
                return;
            }
            const validItems = this.localItems.filter(i=>i.name.trim());
            this.$emit('create', {
                requestNumber: this.localRequestNumber.trim() || null,
                date: this.localDate,
                carrierName: this.localCarrierName,
                employeeFio: this.localEmployeeFio,
                approvedBy: this.localApprovedBy,
                items: validItems.map(i=>({ name:i.name, sn:i.sn, qty:i.qty||'Один' }))
            });
        }
    }
});