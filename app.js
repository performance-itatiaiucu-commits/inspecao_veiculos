// Basic initialization
const inspectionDate = document.getElementById('inspectionDate');
inspectionDate.valueAsDate = new Date();

// Formata datas para padrão brasileiro DD/MM/YYYY
function formatDateBR(input){
    if(!input) return '';
    if(input instanceof Date){
        const d = input.getDate().toString().padStart(2,'0');
        const m = (input.getMonth()+1).toString().padStart(2,'0');
        const y = input.getFullYear();
        return `${d}/${m}/${y}`;
    }
    if(/^\d{4}-\d{2}-\d{2}/.test(input)){
        const parts = input.slice(0,10).split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const isoMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if(isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
    const dt = new Date(input);
    if(!isNaN(dt.getTime())){
        return formatDateBR(dt);
    }
    return String(input);
}

// Items data
const sections = {
    "Documentação": ["CNH","Documento de Identidade","CRLV","Seguro Obrigatório"],
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
    nm.innerHTML = `<strong>${name}</strong><div style="font-size:12px;color:var(--muted)">Status</div>`;

    const status = document.createElement('div');
    status.className = 'status-group';
    ['Bom','Atenção','Defeito'].forEach(s=>{
        const btn = document.createElement('button');
        btn.className = 'btn-status';
        btn.textContent = s;
        btn.dataset.status = s;
        btn.addEventListener('click',()=>{
            el.querySelectorAll('.btn-status').forEach(b=>b.style.outline='');
            btn.style.outline='3px solid rgba(0,0,0,0.06)';
            el.dataset.status = s;
            if(s === 'Bom'){
                el.classList.remove('show');
                const txt = el.querySelector('textarea'); if(txt) txt.value='';
                const imgWrap = el.querySelector('.img-preview'); if(imgWrap) imgWrap.innerHTML='';
                delete el._photo; delete el._desc;
            }else{
                el.classList.add('show');
            }
        });
        status.appendChild(btn);
    });

    const extra = document.createElement('div');
    extra.className = 'extra';
    extra.innerHTML = `
        <textarea placeholder="Descreva o problema..."></textarea>
        <div style="display:flex;gap:8px;align-items:center">
            <label class="upload-btn">Enviar foto
                <input type="file" accept="image/*" capture="environment" style="display:none" />
            </label>
            <div class="img-preview" style="display:flex;gap:6px;flex-wrap:wrap"></div>
        </div>
    `;

    const fileInput = extra.querySelector('input[type=file]');
    const imgPreview = extra.querySelector('.img-preview');
    const textarea = extra.querySelector('textarea');
    fileInput.addEventListener('change', async (e)=>{
        const f = e.target.files[0];
        if(!f) return;
        const compressed = await compressImageFile(f, 1200, 0.7);
        el._photo = compressed;
        const img = document.createElement('img');
        img.src = compressed;
        img.style.width='86px';
        img.style.height='86px';
        img.style.objectFit='cover';
        img.style.borderRadius='8px';
        imgPreview.innerHTML='';
        imgPreview.appendChild(img);
    });
    textarea.addEventListener('input',()=> el._desc = textarea.value);

    el.appendChild(nm);
    el.appendChild(status);
    el.appendChild(extra);
    return el;
}

// populate
document.querySelectorAll('.content').forEach(c=>{
    const sectionName = c.dataset.section;
    const list = sections[sectionName] || [];
    list.forEach(itemName => c.appendChild(createItemEl(itemName, sectionName)));
});

// compress image file via canvas
async function compressImageFile(file, maxSize=1200, quality=0.75){
    return new Promise((res, rej) => {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = () => {
            img.onload = () => {
                let w = img.width, h = img.height;
                const scale = Math.min(1, maxSize / Math.max(w,h));
                w = Math.round(w * scale); h = Math.round(h * scale);
                const canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img,0,0,w,h);
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                res(dataUrl);
            };
            img.onerror = rej;
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}

// Save inspection to localStorage
function gatherInspection(){
    const data = {
        id: 'insp-' + Date.now(),
        driverName: document.getElementById('driverName').value || '',
        vehicleModel: document.getElementById('vehicleModel').value,
        date: document.getElementById('inspectionDate').value,
        items: []
    };
    document.querySelectorAll('.item').forEach(it=>{
        const obj = {name:it.dataset.item,section:it.dataset.section,status:it.dataset.status || 'Bom',desc:it._desc||'',photo:it._photo||null};
        data.items.push(obj);
    });
    return data;
}

function saveInspectionLocal(data){
    const arr = JSON.parse(localStorage.getItem('inspections')||'[]');
    arr.unshift(data);
    localStorage.setItem('inspections', JSON.stringify(arr));
    renderHistory();
    alert('Inspeção salva localmente.');
}

document.getElementById('saveInspection').addEventListener('click', ()=> {
    const data = gatherInspection();
    saveInspectionLocal(data);
});

// Reset form
document.getElementById('resetForm').addEventListener('click', ()=>{
    if(!confirm('Limpar todos os campos?')) return;
    document.getElementById('driverName').value='';
    document.getElementById('vehicleModel').selectedIndex=0;
    inspectionDate.valueAsDate = new Date();
    document.querySelectorAll('.item').forEach(it=>{
        it.dataset.status = 'Bom';
        it.classList.remove('show');
        it.querySelectorAll('.btn-status').forEach(b=>b.style.outline='');
        const ta = it.querySelector('textarea'); if(ta) ta.value='';
        const imgp = it.querySelector('.img-preview'); if(imgp) imgp.innerHTML='';
        delete it._photo; delete it._desc;
    });
    alert('Formulário limpo.');
});

// History UI
function renderHistory(){
    const list = JSON.parse(localStorage.getItem('inspections')||'[]');
    const out = document.getElementById('historyList');
    out.innerHTML = '';
    if(!list.length){ out.innerHTML = '<div style="color:var(--muted)">Nenhuma inspeção salva</div>'; return; }
    list.forEach(item=>{
        const card = document.createElement('div');
        card.className = 'history-card';
        card.innerHTML = `<div style="font-size:13px"><strong>${item.driverName||'—'}</strong><div style="font-size:12px;color:var(--muted)">${item.vehicleModel} • ${formatDateBR(item.date)}</div></div>
                                                    <div style="display:flex;gap:6px">
                                                        <button class="secondary" data-id="${item.id}" aria-label="view">Ver</button>
                                                        <button class="secondary" data-id="${item.id}" aria-label="pdf">PDF</button>
                                                        <button class="secondary" data-id="${item.id}" aria-label="del">Apagar</button>
                                                    </div>`;
        out.appendChild(card);
        const [btnView, btnPdf, btnDel] = card.querySelectorAll('button');
        btnView.addEventListener('click', ()=> loadInspectionToForm(item.id));
        btnPdf.addEventListener('click', ()=> generatePdfFromData(item));
        btnDel.addEventListener('click', ()=>{
            if(!confirm('Remover esta inspeção?')) return;
            const arr = JSON.parse(localStorage.getItem('inspections')||'[]').filter(i=>i.id!==item.id);
            localStorage.setItem('inspections', JSON.stringify(arr));
            renderHistory();
        });
    });
}
renderHistory();

function loadInspectionToForm(id){
    const arr = JSON.parse(localStorage.getItem('inspections')||'[]');
    const item = arr.find(i=>i.id===id);
    if(!item) return alert('Inspeção não encontrada');
    document.getElementById('driverName').value = item.driverName || '';
    document.getElementById('vehicleModel').value = item.vehicleModel || '';
    // Normalize date for input[type=date] (yyyy-mm-dd). Accepts stored formats like yyyy-mm-dd or dd/mm/yyyy
    let inDate = '';
    if(item.date){
        if(/^\d{4}-\d{2}-\d{2}/.test(item.date)){
            inDate = item.date.slice(0,10);
        }else if(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(item.date)){
            const p = item.date.split('/');
            const day = p[0].padStart(2,'0');
            const mon = p[1].padStart(2,'0');
            const yr = p[2].length === 2 ? ('20'+p[2]) : p[2];
            inDate = `${yr}-${mon}-${day}`;
        }else{
            const dt = new Date(item.date);
            if(!isNaN(dt.getTime())){
                inDate = dt.toISOString().slice(0,10);
            }
        }
    }
    document.getElementById('inspectionDate').value = inDate || '';
    document.querySelectorAll('.item').forEach(it=>{
        const found = item.items.find(x => x.name === it.dataset.item);
        if(found){
            it.dataset.status = found.status || 'Bom';
            it._desc = found.desc || '';
            it._photo = found.photo || null;
            if(found.photo){
                const imgp = it.querySelector('.img-preview');
                if(imgp) imgp.innerHTML = `<img src="${found.photo}" style="width:86px;height:86px;object-fit:cover;border-radius:8px">`;
            }
            if(it.dataset.status !== 'Bom') it.classList.add('show'); else it.classList.remove('show');
        }
    });
    alert('Inspeção carregada no formulário.');
}

// Generate PDF from current form
async function generatePdfFromData(itemData){
    const data = itemData || gatherInspection();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p','mm','a4');
    const margin = 12;
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

    doc.setFontSize(14);
    doc.text('Relatório de Inspeção Veicular', margin, 30 + 15);
    doc.setFontSize(10);
    doc.text(`Condutor: ${data.driverName}`, margin, 38 + 15);
    doc.text(`Veículo: ${data.vehicleModel}`, margin, 44 + 15);
    doc.text(`Data: ${formatDateBR(data.date)}`, margin, 50 + 15);

    let y = 58 + 15;
    doc.setFontSize(12); doc.text('Sumário', margin, y); y+=6;
    data.items.forEach(it=>{
        if(y > 260){ doc.addPage(); y = 16; }
        const statusMark = it.status === 'Bom' ? '✓' : (it.status === 'Atenção' ? '!' : '✕');
        doc.setFontSize(10);
        doc.text(`${statusMark} ${it.name} — ${it.status}`, margin, y);
        y+=6;
    });

    for(const it of data.items.filter(i=>i.status!=='Bom')){
        if(y > 240){ doc.addPage(); y = 16; }
        doc.setFontSize(12); doc.text(it.name + ' — ' + it.status, margin, y); y+=6;
        doc.setFontSize(10);
        doc.text((it.desc||'Sem descrição'), margin, y); y+=6;
        if(it.photo){
            try{
                const img = await new Promise(res=>{
                    const im = new Image(); im.onload = ()=> res(im); im.src = it.photo;
                });
                const ratio = img.width / img.height;
                const w = 80;
                const h = 80 / ratio;
                doc.addImage(it.photo, 'JPEG', margin, y, w, h);
                y += h + 8;
            }catch(e){}
        }
    }

    doc.setFontSize(9); doc.text('Gerado por Performance Ocupacional', margin, 290);
    const pdfStr = doc.output('datauristring');
    if(!itemData){
        saveInspectionLocal(data);
    }
    const filename = `inspecao_${data.driverName.replace(/\s+/g,'_')||'anon'}_${Date.now()}.pdf`;
    doc.save(filename);
}

document.getElementById('generatePdf').addEventListener('click', ()=> generatePdfFromData());
// Service Worker registration using blob (no separate file required)
if('serviceWorker' in navigator){
    const swCode = `
        const CACHE_NAME = 'inspecao-cache-v1';
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
            }).catch(()=>caches.match('/'))));
        });
    `;
    const blob = new Blob([swCode], {type:'application/javascript'});
    const swUrl = URL.createObjectURL(blob);
    navigator.serviceWorker.register(swUrl).catch(()=>{ /* ignore if fails (e.g., file protocol) */ });
}

// On load: load inspections if exist
window.addEventListener('load', ()=> renderHistory());
