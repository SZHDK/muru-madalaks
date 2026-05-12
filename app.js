// State
let invoices = JSON.parse(localStorage.getItem('muru_madalaks_invoices')) || [];

// Helper: Format date to Estonian (DD.MM.YYYY)
function formatDate(dateStr) {
    if (!dateStr || dateStr === '-') return '-';
    
    // If it's already in DD.MM.YYYY format (contains dots and is 10 chars), return it
    if (dateStr.includes('.') && dateStr.length >= 8) return dateStr;

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    
    return `${d}.${m}.${y}`;
}

// Page Initialization
window.addEventListener('DOMContentLoaded', () => {
    // Load my details
    document.getElementById('inp-my-name').value = localStorage.getItem('muru_my_name') || '';
    document.getElementById('inp-my-iban').value = localStorage.getItem('muru_my_iban') || '';
    
    // Load next invoice number
    const savedNextNo = localStorage.getItem('muru_next_invoice_no') || '1';
    document.getElementById('inp-next-no').value = savedNextNo;
    
    renderDashboard();
    updatePreview();
});

// Tab Switching
function switchTab(tabId, el) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');

    document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
    if (el) el.classList.add('active');

    if (tabId === 'dashboard') renderDashboard();
}

// Item Management
function addNewItem() {
    const container = document.getElementById('items-list');
    const div = document.createElement('div');
    div.className = 'item-row';
    div.innerHTML = `
        <input type="text" placeholder="Kirjeldus" class="item-desc" oninput="updatePreview()">
        <input type="text" placeholder="Aadress" class="item-address" oninput="updatePreview()">
        <input type="text" placeholder="PP.KK.AAAA" class="item-date" oninput="updatePreview()">
        <input type="number" placeholder="Hind" class="item-price" oninput="updatePreview()">
        <button class="btn" style="background: transparent; color: #ef4444;" onclick="removeItem(this)"><ion-icon name="trash-outline"></ion-icon></button>
    `;
    container.appendChild(div);
    updatePreview();
}

function removeItem(btn) {
    btn.parentElement.remove();
    updatePreview();
}

// Live Preview Logic
function updatePreview() {
    const clientName = document.getElementById('inp-client-name').value || 'Kliendi nimi';
    const clientEmail = document.getElementById('inp-client-email').value || 'klient@e-mail.ee';
    const myName = document.getElementById('inp-my-name').value || 'Muru Madalaks';
    const myIban = document.getElementById('inp-my-iban').value || 'EE00 0000...';
    
    document.getElementById('pre-client-name').textContent = clientName;
    document.getElementById('pre-client-email').textContent = clientEmail;
    document.getElementById('pre-my-name').textContent = myName;
    document.getElementById('pre-my-iban').textContent = myIban;

    // Save my details to local storage so they persist
    localStorage.setItem('muru_my_name', myName);
    localStorage.setItem('muru_my_iban', myIban);

    const rows = document.querySelectorAll('.item-row');
    const tbody = document.getElementById('pre-items-body');
    tbody.innerHTML = '';
    
    let total = 0;

    rows.forEach(row => {
        const desc = row.querySelector('.item-desc').value || 'Teenus';
        const address = row.querySelector('.item-address').value || '-';
        const dateRaw = row.querySelector('.item-date').value;
        const date = formatDate(dateRaw);
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        total += price;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div style="font-weight: 600;">${desc}</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Töö teostaja: MURU MADALAKS</div>
            </td>
            <td>${address}</td>
            <td>${date}</td>
            <td style="text-align: right; padding-left: 10px; font-weight: 700;">${price.toFixed(2)}€</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('pre-total').textContent = `${total.toFixed(2)}€`;
    
    // Strict DD.MM.YYYY format
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    document.getElementById('pre-date').textContent = `${day}.${month}.${year}`;
    
    // Show next invoice number from the input field
    const nextNo = document.getElementById('inp-next-no').value || '1';
    document.getElementById('pre-inv-id').textContent = String(nextNo).padStart(4, '0');
}

// Save Invoice
function saveInvoice() {
    try {
        const clientName = document.getElementById('inp-client-name').value.trim();
        const clientEmail = document.getElementById('inp-client-email').value.trim();
        
        const rows = document.querySelectorAll('.item-row');
        let total = 0;
        const items = Array.from(rows).map(row => {
            const desc = row.querySelector('.item-desc').value || 'Teenus';
            const address = row.querySelector('.item-address').value || '-';
            const date = row.querySelector('.item-date').value || '-';
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            total += price;
            return { desc, address, date, price };
        });

        if (!clientName) return alert('Palun sisesta kliendi nimi!');
        if (total <= 0) return alert('Arve summa peab olema suurem kui 0!');

        const nextNoField = document.getElementById('inp-next-no');
        const nextNo = nextNoField.value || '1';
        const invoiceId = `INV-${String(nextNo).padStart(4, '0')}`;

        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const y = now.getFullYear();

        const newInvoice = {
            id: invoiceId,
            client: clientName,
            email: clientEmail,
            myName: document.getElementById('inp-my-name').value,
            myIban: document.getElementById('inp-my-iban').value,
            total: total,
            items: items,
            date: `${d}.${m}.${y}`,
            status: 'Saadetud'
        };

        invoices.unshift(newInvoice);
        localStorage.setItem('muru_madalaks_invoices', JSON.stringify(invoices));
        
        const currentNo = parseInt(nextNo) || 1;
        const newNextNo = currentNo + 1;
        nextNoField.value = newNextNo;
        localStorage.setItem('muru_next_invoice_no', newNextNo);
        
        alert('Arve on edukalt salvestatud!');
        switchTab('dashboard', document.querySelectorAll('.nav-link')[0]);
        resetForm();
    } catch (err) {
        alert('Viga: ' + err.message);
    }
}

function resetForm() {
    document.getElementById('inp-client-name').value = '';
    document.getElementById('inp-client-email').value = '';
    
    // We do NOT reset inp-next-no here because it should keep incrementing
    
    document.getElementById('items-list').innerHTML = `
        <div class="item-row">
            <input type="text" placeholder="Kirjeldus" class="item-desc" oninput="updatePreview()">
            <input type="text" placeholder="Aadress" class="item-address" oninput="updatePreview()">
            <input type="text" placeholder="PP.KK.AAAA" class="item-date" oninput="updatePreview()">
            <input type="number" placeholder="Hind" class="item-price" oninput="updatePreview()">
            <button class="btn" style="background: transparent; color: #ef4444;" onclick="removeItem(this)"><ion-icon name="trash-outline"></ion-icon></button>
        </div>
    `;
    updatePreview();
}

// Dashboard Rendering
function renderDashboard() {
    let revenue = 0;
    invoices.forEach(inv => revenue += inv.total);

    document.getElementById('stat-revenue').textContent = `${revenue.toFixed(2)}€`;
    document.getElementById('stat-outstanding').textContent = `${(revenue * 0.4).toFixed(2)}€`;
    document.getElementById('stat-count').textContent = invoices.length;

    const list = document.getElementById('invoice-list-container');
    if (invoices.length === 0) {
        list.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 40px;">Arveid ei leitud. Alusta esimese loomisest!</p>';
        return;
    }

    let html = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
                <tr style="text-align: left; border-bottom: 1px solid var(--border); color: var(--text-muted); font-size: 13px;">
                    <th style="padding: 12px 8px;">ID</th>
                    <th style="padding: 12px 8px;">KLIENT</th>
                    <th style="padding: 12px 8px;">KUUPÄEV</th>
                    <th style="padding: 12px 8px;">SUMMA</th>
                    <th style="padding: 12px 8px; text-align: right;">TEGEVUSED</th>
                </tr>
            </thead>
            <tbody>
    `;

    invoices.forEach(inv => {
        html += `
            <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 16px 8px; font-weight: 600;">${inv.id}</td>
                <td style="padding: 16px 8px;">${inv.client}</td>
                <td style="padding: 16px 8px;">${inv.date}</td>
                <td style="padding: 16px 8px; font-weight: 700;">${inv.total.toFixed(2)}€</td>
                <td style="padding: 16px 8px; text-align: right;">
                    <div style="display: flex; gap: 5px; justify-content: flex-end;">
                        <button class="btn btn-primary" style="padding: 6px 10px; font-size: 12px;" onclick="downloadInvoiceAsImage('${inv.id}')">
                            <ion-icon name="image-outline"></ion-icon> Pilt
                        </button>
                        <button class="btn" style="background: #fef2f2; color: #ef4444; padding: 6px 10px;" onclick="deleteInvoice('${inv.id}')">
                            <ion-icon name="trash-outline"></ion-icon>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    list.innerHTML = html;
}

function deleteInvoice(id) {
    if (confirm('Kas soovid kindlasti selle arve kustutada?')) {
        invoices = invoices.filter(inv => inv.id !== id);
        localStorage.setItem('muru_madalaks_invoices', JSON.stringify(invoices));
        renderDashboard();
    }
}

// Download Invoice as Image
function downloadInvoiceAsImage(id) {
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;

    // Switch to create tab to ensure preview is in DOM
    const createTab = document.getElementById('tab-create');
    const wasHidden = createTab.classList.contains('hidden');
    createTab.classList.remove('hidden');
    
    populatePreview(inv);

    const preview = document.getElementById('invoice-preview');
    
    // Use html2canvas to capture
    setTimeout(() => {
        html2canvas(preview, {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `arve-${inv.id}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            // Restore tab state
            if (wasHidden) createTab.classList.add('hidden');
            switchTab('dashboard', document.querySelectorAll('.nav-link')[0]);
        });
    }, 500);
}

function populatePreview(inv) {
    document.getElementById('pre-client-name').textContent = inv.client;
    document.getElementById('pre-client-email').textContent = inv.email || '-';
    document.getElementById('pre-my-name').textContent = inv.myName || 'Muru Madalaks';
    document.getElementById('pre-my-iban').textContent = inv.myIban || '-';
    document.getElementById('pre-inv-id').textContent = inv.id.replace('INV-', '');
    document.getElementById('pre-date').textContent = inv.date;
    document.getElementById('pre-total').textContent = `${inv.total.toFixed(2)}€`;

    const tbody = document.getElementById('pre-items-body');
    tbody.innerHTML = '';

    if (inv.items) {
        inv.items.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="font-weight: 600;">${item.desc}</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Töö teostaja: MURU MADALAKS</div>
                </td>
                <td>${item.address}</td>
                <td>${formatDate(item.date)}</td>
                <td style="text-align: right; padding-left: 10px; font-weight: 700;">${item.price.toFixed(2)}€</td>
            `;
            tbody.appendChild(tr);
        });
    }
}

// Init
function init() {
    // Load saved my details
    const savedName = localStorage.getItem('muru_my_name');
    const savedIban = localStorage.getItem('muru_my_iban');
    if (savedName) document.getElementById('inp-my-name').value = savedName;
    if (savedIban) document.getElementById('inp-my-iban').value = savedIban;

    renderDashboard();
    updatePreview();
}

init();
