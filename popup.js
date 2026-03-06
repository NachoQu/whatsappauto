const sourceTypeEl = document.getElementById('sourceType');
const csvInput = document.getElementById('csvFile');
const tableInput = document.getElementById('tableInput');
const sheetsUrlInput = document.getElementById('sheetsUrl');
const parseTableBtn = document.getElementById('parseTableBtn');
const loadSheetsBtn = document.getElementById('loadSheetsBtn');
const delayInput = document.getElementById('delayMs');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusEl = document.getElementById('status');

const csvSection = document.getElementById('csvSection');
const tableSection = document.getElementById('tableSection');
const gSheetsSection = document.getElementById('gSheetsSection');

let parsedRows = [];

const setStatus = (message) => {
  statusEl.textContent = message;
};

const splitRow = (line, delimiter) => {
  const cols = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === delimiter && !inQuotes) {
      cols.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  cols.push(current.trim());
  return cols;
};

const getDelimiterFromHeader = (headerLine) => {
  const delimiterCandidates = [',', ';', '\t'];
  let selected = ',';
  let maxColumns = 0;

  for (const delimiter of delimiterCandidates) {
    const colCount = splitRow(headerLine, delimiter).length;
    if (colCount > maxColumns) {
      maxColumns = colCount;
      selected = delimiter;
    }
  }

  return selected;
};

const parseDelimitedText = (text, delimiter) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error('La tabla debe tener encabezado y al menos una fila.');
  }

  const headers = splitRow(lines[0], delimiter).map((h) => h.toLowerCase());
  const linkIndex = headers.indexOf('link');
  const mensajeIndex = headers.indexOf('mensaje');

  if (linkIndex === -1 || mensajeIndex === -1) {
    throw new Error('Encabezados requeridos: link,mensaje');
  }

  const rows = lines
    .slice(1)
    .map((line, idx) => {
      const cols = splitRow(line, delimiter);
      return {
        row: idx + 2,
        link: (cols[linkIndex] || '').trim(),
        mensaje: (cols[mensajeIndex] || '').trim(),
      };
    })
    .filter((r) => r.link && r.mensaje);

  if (!rows.length) {
    throw new Error('No se detectaron filas válidas con link y mensaje.');
  }

  return rows;
};

const parseDocumentText = (text) => {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim().length > 0) || '';
  const delimiter = getDelimiterFromHeader(firstLine);
  return parseDelimitedText(text, delimiter);
};

const parseTable = (text) => parseDelimitedText(text, '\t');

const getSheetsCsvUrl = (inputUrl) => {
  const url = new URL(inputUrl);

  if (!url.hostname.includes('docs.google.com') || !url.pathname.includes('/spreadsheets/')) {
    throw new Error('URL inválida de Google Sheets.');
  }

  if (url.pathname.includes('/export')) {
    return inputUrl;
  }

  const match = url.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match?.[1]) {
    throw new Error('No se pudo detectar el ID del documento.');
  }

  const sheetId = match[1];
  const queryGid = url.searchParams.get('gid');
  const hashGid = (url.hash.match(/gid=([0-9]+)/) || [])[1];
  const gid = queryGid || hashGid || '0';

  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
};

const getActiveTab = async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
};

const refreshSourceVisibility = () => {
  const sourceType = sourceTypeEl.value;
  csvSection.classList.toggle('hidden', sourceType !== 'csv');
  tableSection.classList.toggle('hidden', sourceType !== 'table');
  gSheetsSection.classList.toggle('hidden', sourceType !== 'gSheets');
};

sourceTypeEl.addEventListener('change', refreshSourceVisibility);
refreshSourceVisibility();

csvInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    parsedRows = [];
    setStatus('Sin archivo seleccionado.');
    return;
  }

  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
    parsedRows = [];
    setStatus('Archivo Excel detectado. Exporta a CSV o pega la tabla (copiar/pegar) desde Excel.');
    return;
  }

  const text = await file.text();
  try {
    parsedRows = parseDocumentText(text);
    setStatus(`Documento cargado correctamente.\nFilas válidas: ${parsedRows.length}`);
  } catch (error) {
    parsedRows = [];
    setStatus(`Error documento: ${error.message}`);
  }
});

parseTableBtn.addEventListener('click', () => {
  try {
    parsedRows = parseTable(tableInput.value);
    setStatus(`Tabla importada correctamente (Excel/Sheets).\nFilas válidas: ${parsedRows.length}`);
  } catch (error) {
    parsedRows = [];
    setStatus(`Error tabla: ${error.message}`);
  }
});

loadSheetsBtn.addEventListener('click', async () => {
  try {
    const exportUrl = getSheetsCsvUrl(sheetsUrlInput.value.trim());
    const response = await fetch(exportUrl);

    if (!response.ok) {
      throw new Error('No se pudo descargar la hoja. Verifica permisos de acceso público.');
    }

    const csvText = await response.text();
    parsedRows = parseDocumentText(csvText);
    setStatus(`Google Sheets importado correctamente.\nFilas válidas: ${parsedRows.length}`);
  } catch (error) {
    parsedRows = [];
    setStatus(`Error Google Sheets: ${error.message}`);
  }
});

startBtn.addEventListener('click', async () => {
  if (!parsedRows.length) {
    setStatus('Primero carga datos válidos (documento, tabla o Google Sheets).');
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
