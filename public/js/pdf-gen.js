// ==========================================
// 1. SISTEMA DE ALERTAS PREMIUM (TOASTS)
// ==========================================
function mostrarAlerta(mensaje, tipo = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return; // Seguridad por si no encuentra el div
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    
    let icono = '🔔';
    if (tipo === 'success') icono = '✅';
    if (tipo === 'error') icono = '❌';
    if (tipo === 'warning') icono = '⚠️';
    
    toast.innerHTML = `<span>${icono}</span> <span>${mensaje}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 400);
    }, 4000);
}

// ==========================================
// 2. LOGICA PRINCIPAL Y VALIDACIONES
// ==========================================
async function procesarProforma() {
    const emisor = document.getElementById('emisor-nombre').value.trim();
    const emisorRuc = document.getElementById('emisor-ruc').value.trim();
    const cliente = document.getElementById('cliente-nombre').value.trim();
    const clienteId = document.getElementById('cliente-id').value.trim();
    const fecha = document.getElementById('fecha-actual').value;
    const validez = document.getElementById('validez').value;

    // --- VALIDACIONES DE CAMPOS OBLIGATORIOS ---
    if (!emisor || !cliente) {
        mostrarAlerta("Los nombres del emisor y cliente son obligatorios.", "warning");
        return;
    }

    // --- VALIDACIÓN DE RUC REAL (ALGORITMO MÓDULO 11 SUNAT) ---
    function validarRucPeruano(ruc) {
        // Primero verificamos la estructura básica (11 dígitos y que empiece con 10, 15, 17 o 20)
        const regexBasico = /^(10|15|17|20)[0-9]{9}$/;
        if (!regexBasico.test(ruc)) return false;

        // Factores de multiplicación oficiales de SUNAT
        const factores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
        let suma = 0;

        // Multiplicar los primeros 10 dígitos por sus respectivos factores
        for (let i = 0; i < 10; i++) {
            suma += parseInt(ruc.charAt(i)) * factores[i];
        }

        // Algoritmo Módulo 11
        const residuo = suma % 11;
        let digitoVerificador = 11 - residuo;

        if (digitoVerificador === 10) digitoVerificador = 0;
        if (digitoVerificador === 11) digitoVerificador = 1;

        // Comparar el resultado matemático con el último dígito real del RUC escrito
        const ultimoDigitoReal = parseInt(ruc.charAt(10));
        return digitoVerificador === ultimoDigitoReal;
    }

    // Ejecutar la validación estricta
    if (!validarRucPeruano(emisorRuc)) {
        mostrarAlerta("El RUC del emisor es inválido. No existe en el registro algorítmico de SUNAT.", "error");
        return;
    }

    // --- RECOLECCIÓN DE LOS ITEMS DE LA TABLA ---
    const items = [];
    document.querySelectorAll('.item-row').forEach(fila => {
        const desc = fila.querySelector('.item-desc').value.trim();
        const qty = parseFloat(fila.querySelector('.item-qty').value) || 0;
        const price = parseFloat(fila.querySelector('.item-price').value) || 0;
        
        if (desc && qty > 0 && price > 0) {
            items.push([desc, qty, `S/. ${price.toFixed(2)}`, `S/. ${(qty * price).toFixed(2)}`]);
        }
    });

    // --- VALIDACIÓN DE PRODUCTOS ---
    if (items.length === 0) {
        mostrarAlerta("Debes agregar al menos un ítem válido con cantidad y precio.", "warning");
        return;
    }

    // Extraer valores numéricos limpios calculados en la interfaz
    const subtotalNum = parseFloat(document.getElementById('subtotal').innerText.replace('S/. ', '')) || 0;
    const igvNum = parseFloat(document.getElementById('igv').innerText.replace('S/. ', '')) || 0;
    const totalNum = parseFloat(document.getElementById('total-final').innerText.replace('S/. ', '')) || 0;

    // --- ENVÍO DE DATOS AL BACKEND ---
    try {
        const response = await fetch('/api/proformas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                emisor, emisorRuc, cliente, clienteId, fecha, validez,
                subtotal: subtotalNum, igv: igvNum, total: totalNum
            })
        });

        const resultado = await response.json();
        
        if (resultado.success) {
            console.log(`Proforma guardada con éxito en SQLite. ID: ${resultado.id}`);
            mostrarAlerta("Proforma procesada y registrada en la base de datos.", "success");
            
            // Si la base de datos la guardó, procedemos a construir y descargar el PDF
            generarDocumentoPDF(emisor, emisorRuc, cliente, clienteId, fecha, validez, items);
        } else {
            mostrarAlerta("Error al procesar el registro en el servidor.", "error");
        }
    } catch (error) {
        console.error("Error al conectar con la API:", error);
        mostrarAlerta("No se pudo conectar con el servidor de base de datos.", "error");
    }
}

// ==========================================
// 3. GENERADOR DE PDF (jsPDF)
// ==========================================
function generarDocumentoPDF(emisor, emisorRuc, cliente, clienteId, fecha, validez, items) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Fondo estético derecho
    doc.setFillColor(245, 245, 245);
    doc.rect(150, 0, 60, 297, 'F'); 
    
    // Título Principal
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("PROFORMA", 15, 30);
    doc.setDrawColor(16, 185, 129);
    doc.line(15, 35, 60, 35);

    // Bloque Emisor
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.text("DE:", 15, 50);
    doc.setFontSize(12);
    doc.text(emisor.toUpperCase(), 15, 57);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`RUC: ${emisorRuc}`, 15, 63);

    // Bloque Cliente
    doc.setFont("helvetica", "bold");
    doc.text("PARA:", 15, 80);
    doc.setFont("helvetica", "normal");
    doc.text(cliente, 15, 87);
    doc.text(`RUC/DNI: ${clienteId || 'No especificado'}`, 15, 92);

    // Fechas e Información en bloque derecho
    doc.setFont("helvetica", "bold");
    doc.text("FECHA:", 155, 50);
    doc.setFont("helvetica", "normal");
    doc.text(fecha, 155, 56);
    doc.setFont("helvetica", "bold");
    doc.text("VIGENCIA:", 155, 70);
    doc.setFont("helvetica", "normal");
    doc.text(validez, 155, 76);

    // Renderizado de tabla dinámica
    doc.autoTable({
        startY: 110,
        head: [['DESCRIPCIÓN', 'CANT.', 'P. UNITARIO', 'SUBTOTAL']],
        body: items,
        headStyles: { fillColor: [16, 185, 129] },
        margin: { left: 15, right: 15 }
    });

    // Bloque de Totales finales
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(10);
    doc.text("Subtotal:", 140, finalY);
    doc.text(document.getElementById('subtotal').innerText, 195, finalY, { align: 'right' });
    
    doc.text("IGV (18%):", 140, finalY + 7);
    doc.text(document.getElementById('igv').innerText, 195, finalY + 7, { align: 'right' });
    
    doc.setFillColor(16, 185, 129);
    doc.rect(135, finalY + 12, 65, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text("TOTAL:", 140, finalY + 20);
    doc.text(document.getElementById('total-final').innerText, 195, finalY + 20, { align: 'right' });

    // Descarga automática del archivo
    doc.save(`Proforma_${cliente.replace(/\s+/g, '_')}.pdf`);
}