// Basic initialization
document.addEventListener('DOMContentLoaded', function() {
    const inspectionDate = document.getElementById('inspectionDate');
    inspectionDate.valueAsDate = new Date();
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const durationSpan = document.getElementById('duration');

    // Items data
    const sections = {
        "Documentação": ["CNH","CRLV","Seguro Obrigatório"],
        "Interior": ["Airbags","Cinto de segurança","Sistema de som","Luzes de cortesia","Painel e indicadores","Bancos"],
        "Exterior": ["Para-choques","Lataria","Vidros e para-brisas","Faróis","Luzes traseiras","Retrovisores"],
        "Motor": ["Nível de óleo","Líquido de arrefecimento","Correias e mangueiras","Bateria"],
        "Segurança": ["Extintor de incêndio","Triângulo de segurança","Chave de roda","Macaco","Estepe"],
        "Rodas": ["Pneus (estado e calibragem)","Calotas ou rodas de liga leve","Freios"]
    };

    // Build items UI
    function createItemEl(name, sectionName){
        const el = document.createElement('div');
        el.className = 'item';
        el.dataset.item = name;
        el.dataset.section = sectionName;

        const nm = document.createElement('div');
        nm.className = 'name';
        nm.innerHTML = `<div style="display:flex;align-items:center;gap:8px">
            <span class="item-icon">${getIconForItem(name)}</span>
            <div>
                <strong>${name}</strong>
            </div>
        </div>
        <div class="item-status">
            <button class="btn-status" data-status="Bom">Bom</button>
            <button class="btn-status" data-status="Atenção">Atenção</button>
            <button class="btn-status" data-status="Defeito">Defeito</button>
        </div>`;

        const extra = document.createElement('div');
        extra.className = 'extra';
        extra.innerHTML = `
            <textarea placeholder="Descrição do problema ou atenção..."></textarea>
            <div class="controls">
                <input type="file" accept="image/*" class="photo-input" style="display:none;" />
                <button class="upload-btn">📷 Anexar Foto</button>
                <div class="photo-preview-container" style="display:none;">
                    <img class="photo-preview" style="max-width:100px;border-radius:8px;"/>
                </div>
            </div>
        `;
        
        el.appendChild(nm);
        el.appendChild(extra);
        
        // Event listeners
        const statusButtons = el.querySelectorAll('.btn-status');
        statusButtons.forEach(btn=>{
            btn.addEventListener('click', ()=>{
                el.dataset.status = btn.dataset.status;
                el.className = `item ${btn.dataset.status}`;
                statusButtons.forEach(b=>b.classList.remove('active'));
                btn.classList.add('active');
                if(btn.dataset.status !== 'Bom'){
                    el.classList.add('show');
                } else {
                    el.classList.remove('show');
                }
            });
        });

        const uploadBtn = el.querySelector('.upload-btn');
        const photoInput = el.querySelector('.photo-input');
        const photoPreviewContainer = el.querySelector('.photo-preview-container');
        const photoPreview = el.querySelector('.photo-preview');

        uploadBtn.addEventListener('click', () => {
            photoInput.click();
        });

        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    photoPreview.src = event.target.result;
                    photoPreviewContainer.style.display = 'block';
                    el.dataset.photo = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
        
        return el;
    }

    Object.entries(sections).forEach(([sectionName, items])=>{
        const container = document.querySelector(`.content[data-section="${sectionName}"]`);
        items.forEach(itemName=>{
            container.appendChild(createItemEl(itemName, sectionName));
        });
    });

    // Função para calcular e exibir a duração
    function updateDuration() {
        if (startTimeInput.value && endTimeInput.value) {
            const start = new Date(`2000/01/01 ${startTimeInput.value}`);
            const end = new Date(`2000/01/01 ${endTimeInput.value}`);
            const diffMs = end - start;
            if (diffMs < 0) {
                durationSpan.textContent = "Erro na duração.";
                return;
            }
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            durationSpan.textContent = `${diffHours}h ${diffMinutes}m`;
        } else {
            durationSpan.textContent = '';
        }
    }

    // Gather data from form
    function gatherInspection(){
        const data = {
            driverName: document.getElementById('driverName').value,
            vehicleModel: document.getElementById('vehicleModel').value,
            date: document.getElementById('inspectionDate').value,
            startTime: startTimeInput.value,
            endTime: endTimeInput.value,
            duration: durationSpan.textContent,
            items: []
        };
        document.querySelectorAll('.item').forEach(itemEl=>{
            const status = itemEl.dataset.status || 'Bom'; // Considera Bom como status padrão
            const name = itemEl.dataset.item;
            const desc = itemEl.querySelector('textarea').value;
            const photo = itemEl.dataset.photo || null;
            data.items.push({ name, status, desc, photo });
        });
        return data;
    }

    // Save/Load inspections to/from localStorage
    function saveInspectionLocal(data){
        let history = JSON.parse(localStorage.getItem('inspections')) || [];
        const existingIndex = history.findIndex(i=> i.driverName === data.driverName && i.vehicleModel === data.vehicleModel && i.date === data.date);
        if(existingIndex > -1){
            history[existingIndex] = data;
        } else {
            history.push(data);
        }
        localStorage.setItem('inspections', JSON.stringify(history));
        renderHistory();
    }

    function loadInspectionLocal(data){
        document.getElementById('driverName').value = data.driverName;
        document.getElementById('vehicleModel').value = data.vehicleModel;
        document.getElementById('inspectionDate').value = data.date;
        startTimeInput.value = data.startTime || '';
        endTimeInput.value = data.endTime || '';
        updateDuration();

        document.querySelectorAll('.item').forEach(el=>{
            el.className = 'item';
            el.classList.remove('show');
            el.querySelector('textarea').value = '';
            el.querySelectorAll('.btn-status').forEach(b=>b.classList.remove('active'));
            const photoPreviewContainer = el.querySelector('.photo-preview-container');
            photoPreviewContainer.style.display = 'none';
            el.dataset.photo = '';
        });
        data.items.forEach(item=>{
            const itemEl = document.querySelector(`.item[data-item="${item.name}"]`);
            if(itemEl){
                itemEl.className = `item ${item.status}`;
                itemEl.querySelector(`.btn-status[data-status="${item.status}"]`).classList.add('active');
                if(item.status !== 'Bom'){
                    itemEl.classList.add('show');
                }
                itemEl.querySelector('textarea').value = item.desc;
                if(item.photo){
                    const photoPreviewContainer = itemEl.querySelector('.photo-preview-container');
                    const photoPreview = itemEl.querySelector('.photo-preview');
                    photoPreview.src = item.photo;
                    photoPreviewContainer.style.display = 'block';
                    itemEl.dataset.photo = item.photo;
                }
            }
        });
    }

    function renderHistory(){
        const history = JSON.parse(localStorage.getItem('inspections')) || [];
        const list = document.getElementById('historyList');
        list.innerHTML = '';
        history.forEach(item=>{
            const el = document.createElement('div');
            el.className = 'history-item';
            el.innerHTML = `
                <div class="history-item-details">
                    <span class="history-item-name">${item.driverName} - ${item.vehicleModel}</span>
                    <span class="history-item-date">${formatDateBR(item.date)}</span>
                </div>
                <div class="history-item-actions">
                    <button class="load-btn">↩️</button>
                    <button class="pdf-btn">📄</button>
                    <button class="delete-btn">🗑️</button>
                </div>
            `;
            el.querySelector('.load-btn').addEventListener('click', ()=>loadInspectionLocal(item));
            el.querySelector('.pdf-btn').addEventListener('click', ()=>generatePdfFromData(item));
            el.querySelector('.delete-btn').addEventListener('click', ()=>{
                const updatedHistory = history.filter(i=> i.driverName !== item.driverName || i.vehicleModel !== item.vehicleModel || i.date !== item.date);
                localStorage.setItem('inspections', JSON.stringify(updatedHistory));
                renderHistory();
            });
            list.appendChild(el);
        });
    }

    function formatDateBR(dateStr){
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }

    // PDF generation
    async function generatePdfFromData(itemData){
        const data = itemData || gatherInspection();
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p','mm','a4');
        const margin = 12;
        
        // Configurar fonte padrão que suporta caracteres em português
        doc.setFont("helvetica");
        doc.setFontSize(12);
        doc.setTextColor(30);
        
        try {
            const logoPdf = document.getElementById('logoPdf');
            if(logoPdf.complete && logoPdf.naturalWidth !== 0) {
                const aspectRatio = logoPdf.naturalWidth / logoPdf.naturalHeight;
                const width = 40;
                const height = width / aspectRatio;
                doc.addImage(logoPdf, 'PNG', margin, 10, width, height);
                doc.setFillColor(255, 255, 255);
                doc.rect(margin, 10 + height + 10, 190, 5, 'F');
            } else {
                await new Promise((resolve, reject) => {
                    logoPdf.onload = resolve;
                    logoPdf.onerror = reject;
                    logoPdf.src = logoPdf.src;
                });
                const aspectRatio = logoPdf.naturalWidth / logoPdf.naturalHeight;
                const width = 40;
                const height = width / aspectRatio;
                doc.addImage(logoPdf, 'PNG', margin, 10, width, height);
                doc.setFillColor(255, 255, 255);
                doc.rect(margin, 10 + height + 10, 190, 5, 'F');
            }
        }catch(e){
            console.log('Não foi possível carregar a logo local:', e);
            try {
                const logoHeader = document.getElementById('logo');
                const aspectRatio = logoHeader.naturalWidth / logoHeader.naturalHeight;
                const width = 40;
                const height = width / aspectRatio;
                doc.addImage(logoHeader, 'JPEG', margin, 10, width, height);
                doc.setFillColor(255, 255, 255);
                doc.rect(margin, 10 + height + 10, 190, 5, 'F');
            } catch(e2) {
                console.log('Fallback também falhou:', e2);
            }
        }

        // Título do relatório
        doc.setFontSize(14);
        doc.text('Relatório de Inspeção Veicular', margin, 30 + 15);
        
        // Informações básicas
        doc.setFontSize(10);
        doc.text(`Condutor: ${data.driverName}`, margin, 38 + 15);
        doc.text(`Veículo: ${data.vehicleModel}`, margin, 44 + 15);
        doc.text(`Data: ${formatDateBR(data.date)}`, margin, 50 + 15);
        doc.text(`Hora de Saída: ${data.startTime || 'Não informada'}`, margin, 56 + 15);
        doc.text(`Hora de Chegada: ${data.endTime || 'Não informada'}`, margin, 62 + 15);
        doc.text(`Duração da Viagem: ${data.duration || 'Não calculada'}`, margin, 68 + 15);

        let y = 74 + 15;
        
        // Seção de sumário
        doc.setFontSize(12); 
        doc.text('Sumário', margin, y); 
        y+=6;
        
        // Lista de todos os itens com status
        const allItems = Object.values(sections).flat().map(name => {
            const foundItem = data.items.find(item => item.name === name);
            return foundItem || { name, status: 'Não inspecionado' };
        });

        allItems.forEach(it=>{
            if(y > 260){ 
                doc.addPage(); 
                y = 16; 
            }
            let statusMark = '';
            if (it.status === 'Bom') {
                statusMark = '✓';
            } else if (it.status === 'Atenção') {
                statusMark = '!';
            } else if (it.status === 'Defeito') {
                statusMark = '✕';
            } else {
                statusMark = '—';
            }
            doc.setFontSize(10);
            doc.text(`${statusMark} ${it.name} — ${it.status}`, margin, y);
            y+=6;
        });

        // Detalhes dos itens com problemas
        for(const it of data.items.filter(i=>i.status!=='Bom')){
            if(y > 240){ 
                doc.addPage(); 
                y = 16; 
            }
            doc.setFontSize(12); 
            doc.text(it.name + ' — ' + it.status, margin, y); 
            y+=6;
            doc.setFontSize(10);
            
            // Quebra de linha para descrições longas
            const splitDesc = doc.splitTextToSize((it.desc||'Sem descrição'), 180);
            doc.text(splitDesc, margin, y);
            y += splitDesc.length * 6;
            
            if(it.photo){
                try{
                    const img = await new Promise((resolve, reject) => {
                        const im = new Image(); 
                        im.onload = () => resolve(im); 
                        im.onerror = reject;
                        im.src = it.photo;
                    });
                    const ratio = img.width / img.height;
                    const w = 80;
                    const h = 80 / ratio;
                    doc.addImage(it.photo, 'JPEG', margin, y, w, h);
                    y += h + 8;
                }catch(e){
                    console.log('Erro ao adicionar imagem:', e);
                }
            }
        }

        // Rodapé
        doc.setFontSize(9); 
        doc.text('Gerado por Performance Ocupacional', margin, 290);
        
        // Salvar o PDF
        const filename = `inspecao_${data.driverName.replace(/\s+/g,'_')||'anon'}_${Date.now()}.pdf`;
        doc.save(filename);
        
        if(!itemData){
            saveInspectionLocal(data);
        }
    }
    
    // Event listeners for time buttons
    document.getElementById('markStartTime').addEventListener('click', () => {
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        startTimeInput.value = timeStr;
        updateDuration();
    });

    document.getElementById('markEndTime').addEventListener('click', () => {
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        endTimeInput.value = timeStr;
        updateDuration();
    });
    
    // Listen to changes in time inputs to update duration
    startTimeInput.addEventListener('change', updateDuration);
    endTimeInput.addEventListener('change', updateDuration);

    // Service Worker registration using blob (no separate file required)
    if('serviceWorker' in navigator){
        const swCode = `
            const CACHE_NAME = 'inspecoes-cache-v1';
            const TO_CACHE = ['./','/'];
            self.addEventListener('install', (e)=>{ self.skipWaiting(); e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(TO_CACHE)).catch(()=>{}));});
            self.addEventListener('activate', (e)=>{ e.waitUntil(self.clients.claim()); });
            self.addEventListener('fetch', (e)=> {
                if(e.request.method !== 'GET') return;
                e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request).then(resp=>{
                    if(!resp || resp.status!==200) return resp;
                    const copy = resp.clone();
                    caches.open(CACHE_NAME).then(c=> c.put(e.request, copy));
                    return resp;
                }).catch(()=>{}));
            });
        `;
        const blob = new Blob([swCode], {type: 'application/javascript'});
        const url = URL.createObjectURL(blob);
        navigator.serviceWorker.register(url);
    }
    
    // Event listeners for main buttons
    document.getElementById('saveInspection').addEventListener('click', ()=>{
        saveInspectionLocal(gatherInspection());
    });
    document.getElementById('generatePdf').addEventListener('click', ()=>{
        generatePdfFromData();
    });
    document.getElementById('resetForm').addEventListener('click', ()=>{
        document.getElementById('driverName').value = '';
        document.getElementById('vehicleModel').value = '';
        startTimeInput.value = '';
        endTimeInput.value = '';
        updateDuration();
        document.querySelectorAll('.item').forEach(el=>{
            el.className = 'item';
            el.classList.remove('show');
            el.querySelector('textarea').value = '';
            el.querySelectorAll('.btn-status').forEach(b=>b.classList.remove('active'));
            const photoPreviewContainer = el.querySelector('.photo-preview-container');
            photoPreviewContainer.style.display = 'none';
            el.dataset.photo = '';
        });
    });

    renderHistory();
});
