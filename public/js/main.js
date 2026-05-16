document.getElementById('fecha-actual').valueAsDate = new Date();

window.onload = () => {
    document.getElementById('emisor-nombre').value = localStorage.getItem('pisco_emisor_nombre') || '';
    document.getElementById('emisor-ruc').value = localStorage.getItem('pisco_emisor_ruc') || '';
};

document.getElementById('emisor-nombre').addEventListener('input', (e) => {
    localStorage.setItem('pisco_emisor_nombre', e.target.value);
});

document.getElementById('emisor-ruc').addEventListener('input', (e) => {
    localStorage.setItem('pisco_emisor_ruc', e.target.value);
});

function agregarFila() {
    const container = document.getElementById('items-lista');
    const div = document.createElement('div');
    div.className = 'item-row';
    div.innerHTML = `
        <input type="text" placeholder="Descripción" class="item-desc">
        <input type="number" placeholder="Cant" class="item-qty" oninput="calcularTotales()">
        <input type="number" placeholder="Precio" class="item-price" oninput="calcularTotales()">
        <div class="item-total-display" style="font-weight: 800; text-align: right;">S/. 0.00</div>
        <button style="background:none; border:none; color:#ef4444; cursor:pointer; font-weight:800;" onclick="this.parentElement.remove(); calcularTotales()">✕</button>
    `;
    container.appendChild(div);
}

function calcularTotales() {
    const filas = document.querySelectorAll('.item-row');
    let subtotalGlobal = 0;
    filas.forEach(fila => {
        const qty = fila.querySelector('.item-qty').value || 0;
        const price = fila.querySelector('.item-price').value || 0;
        const totalFila = qty * price;
        fila.querySelector('.item-total-display').innerText = `S/. ${totalFila.toFixed(2)}`;
        subtotalGlobal += totalFila;
    });
    const igv = subtotalGlobal * 0.18;
    const total = subtotalGlobal + igv;
    document.getElementById('subtotal').innerText = `S/. ${subtotalGlobal.toFixed(2)}`;
    document.getElementById('igv').innerText = `S/. ${igv.toFixed(2)}`;
    document.getElementById('total-final').innerText = `S/. ${total.toFixed(2)}`;
}