// Configura aquí la URL que te dará Google Apps Script (Paso 2)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzp4SqPol6BOf1iFhgyjCPM9me7g7RVQdbHHIi3FRsxYzAeViu62BElM8qBokttBTLU/exec"; 

document.addEventListener("DOMContentLoaded", () => {
    fetchData();
    document.getElementById('btn-sync').addEventListener('click', fetchData);
});

// 1. LEER DATOS DE GOOGLE SHEETS
async function fetchData() {
    const statusDiv = document.getElementById('connection-status');
    statusDiv.className = "status loading";
    statusDiv.innerText = "Cargando datos...";

    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        renderTable(data);
        statusDiv.className = "status connected";
        statusDiv.innerText = "Conectado en tiempo real";
    } catch (error) {
        console.error("Error al obtener datos:", error);
        statusDiv.className = "status error";
        statusDiv.innerText = "Error de conexión";
    }
}

// 2. RENDERIZAR TABLA CON PERMISOS RESTRINGIDOS
function renderTable(data) {
    const tbody = document.getElementById('inventory-body');
    tbody.innerHTML = "";

    // Asumimos que la fila 1 son encabezados y los datos reales empiezan en el índice 2 (Fila 3 de Sheets)
    data.forEach((row, index) => {
        const sheetRowNumber = index + 1; // Mapeo correlativo con la fila de Sheets
        const tr = document.createElement('tr');

        // Columnas A a H (Índices 0 a 7)
        for (let colIndex = 0; colIndex < 8; colIndex++) {
            const td = document.createElement('td');
            const cellValue = row[colIndex] || "";

            // REGLA ESTRICTA: Permitir editar F (índice 5) y H (índice 7) SÓLO a partir de la fila 3
            const isColumnF_or_H = (colIndex === 5 || colIndex === 7);
            const isRow3OrHigher = (sheetRowNumber >= 3);

            if (isColumnF_or_H && isRow3OrHigher) {
                // Crear celda editable (Input)
                const input = document.createElement('input');
                input.type = "text";
                input.value = cellValue;
                
                // Evento al salir de la celda (Guardado en tiempo real)
                input.addEventListener('blur', (e) => {
                    updateCellInSheets(sheetRowNumber, colIndex + 1, e.target.value);
                });

                // Permitir guardar al presionar Enter
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') e.target.blur();
                });

                td.appendChild(input);
            } else {
                // Celda de solo lectura
                td.textContent = cellValue;
                td.className = "readonly-cell";
            }
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    });
}

// 3. ACTUALIZAR EN TIEMPO REAL
async function updateCellInSheets(row, col, value) {
    try {
        // Enviar actualización mediante método POST a la API
        await fetch(SCRIPT_URL, {
            method: "POST",
            mode: "no-cors", // Requerido para llamadas a Google Apps Script
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ row: row, col: col, value: value })
        });
        console.log(`Fila ${row}, Col ${col} actualizada con: ${value}`);
    } catch (error) {
        console.error("Error al actualizar:", error);
    }
}
