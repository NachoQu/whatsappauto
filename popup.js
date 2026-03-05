const csvInput = document.getElementById('csvFile');
const delayInput = document.getElementById('delayMs');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusEl = document.getElementById('status');

let parsedRows = [];

const setStatus = (message) => {
  statusEl.textContent = message;
};

const parseCsv = (text) => {
  const rows = [];
  let current = '';
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        i += 1;
      }
      row.push(current.trim());
      current = '';
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    rows.push(row);
  }

  if (rows.length < 2) {
    throw new Error('El CSV debe incluir encabezado y al menos una fila.');
  }

  const headers = rows[0].map((h) => h.toLowerCase());
  const linkIndex = headers.indexOf('link');
  const mensajeIndex = headers.indexOf('mensaje');

  if (linkIndex === -1 || mensajeIndex === -1) {
    throw new Error('Encabezados requeridos: link,mensaje');
  }

  return rows
    .slice(1)
    .map((r, idx) => ({
      row: idx + 2,
      link: (r[linkIndex] || '').trim(),
      mensaje: (r[mensajeIndex] || '').trim(),
    }))
    .filter((r) => r.link && r.mensaje);
};

const getActiveTab = async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
};

csvInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    parsedRows = [];
    setStatus('Sin archivo seleccionado.');
    return;
  }

  const text = await file.text();
  try {
    parsedRows = parseCsv(text);
    setStatus(`CSV cargado correctamente.\nFilas válidas: ${parsedRows.length}`);
  } catch (error) {
    parsedRows = [];
    setStatus(`Error CSV: ${error.message}`);
  }
});

startBtn.addEventListener('click', async () => {
  if (!parsedRows.length) {
    setStatus('Primero carga un CSV válido.');
    return;
  }

  const tab = await getActiveTab();
  if (!tab?.id || !tab.url?.startsWith('https://web.whatsapp.com/')) {
    setStatus('Debes abrir y seleccionar una pestaña de web.whatsapp.com');
    return;
  }

  const delayMs = Number(delayInput.value);
  if (Number.isNaN(delayMs) || delayMs < 3000) {
    setStatus('La pausa mínima recomendada es 3000 ms.');
    return;
  }

  await chrome.tabs.sendMessage(tab.id, {
    type: 'WA_BULK_START',
    payload: { rows: parsedRows, delayMs },
  });
  setStatus(`Proceso enviado a WhatsApp Web.\nTotal: ${parsedRows.length}`);
});

stopBtn.addEventListener('click', async () => {
  const tab = await getActiveTab();
  if (!tab?.id) {
    return;
  }
  await chrome.tabs.sendMessage(tab.id, { type: 'WA_BULK_STOP' });
  setStatus('Solicitud de detención enviada.');
});
