let stopRequested = false;
let running = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeChatUrl = (rawLink, message) => {
  const url = new URL(rawLink);

  if (url.hostname === 'wa.me') {
    const cleanPath = url.pathname.replace(/\//g, '');
    return `https://web.whatsapp.com/send/?phone=${encodeURIComponent(cleanPath)}&text=${encodeURIComponent(message)}`;
  }

  if (url.hostname.includes('whatsapp.com')) {
    url.searchParams.set('text', message);
    if (!url.pathname.includes('/send')) {
      return `https://web.whatsapp.com/send/?text=${encodeURIComponent(message)}`;
    }
    return url.toString();
  }

  throw new Error('Link de WhatsApp no válido');
};

const waitForComposer = async (timeoutMs = 30000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const composer = document.querySelector('footer [contenteditable="true"][role="textbox"], div[contenteditable="true"][data-tab="10"]');
    if (composer) {
      return composer;
    }
    await sleep(500);
  }
  throw new Error('No se encontró el cuadro de mensaje (timeout)');
};

const waitForSendButton = async (timeoutMs = 10000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const sendBtn = document.querySelector('button span[data-icon="send"], button span[data-icon="wds-ic-send-filled"]')?.closest('button');
    if (sendBtn) {
      return sendBtn;
    }
    await sleep(400);
  }
  return null;
};

const sendWithEnter = (composer) => {
  composer.focus();

  const eventOptions = {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true,
  };

  composer.dispatchEvent(new KeyboardEvent('keydown', eventOptions));
  composer.dispatchEvent(new KeyboardEvent('keypress', eventOptions));
  composer.dispatchEvent(new KeyboardEvent('keyup', eventOptions));
};

const processRows = async (rows, delayMs) => {
  running = true;
  stopRequested = false;

  for (let i = 0; i < rows.length; i += 1) {
    if (stopRequested) {
      console.warn('[WA Bulk] Proceso detenido manualmente.');
      break;
    }

    const { link, mensaje, row } = rows[i];
    try {
      const targetUrl = normalizeChatUrl(link, mensaje);
      window.location.href = targetUrl;
      await sleep(7000);

      const composer = await waitForComposer();
      sendWithEnter(composer);

      await sleep(700);
      const possibleSendBtn = await waitForSendButton();
      if (possibleSendBtn) {
        possibleSendBtn.click();
      }

      console.info(`[WA Bulk] Enviado ${i + 1}/${rows.length} (fila CSV ${row}).`);
    } catch (error) {
      console.error(`[WA Bulk] Error en fila ${row}: ${error.message}`);
    }

    await sleep(delayMs);
  }

  running = false;
  console.info('[WA Bulk] Flujo finalizado.');
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'WA_BULK_STOP') {
    stopRequested = true;
    sendResponse({ ok: true, running, stopped: true });
    return true;
  }

  if (message?.type === 'WA_BULK_START') {
    if (running) {
      sendResponse({ ok: false, error: 'Ya hay un proceso en ejecución.' });
      return true;
    }

    const { rows, delayMs } = message.payload || {};
    if (!Array.isArray(rows) || !rows.length) {
      sendResponse({ ok: false, error: 'No se recibieron filas válidas.' });
      return true;
    }

    sendResponse({ ok: true, started: true });

    processRows(rows, delayMs || 8000).catch((error) => {
      running = false;
      console.error(`[WA Bulk] Error general: ${error.message}`);
    });

    return false;
  }

  return false;
});
