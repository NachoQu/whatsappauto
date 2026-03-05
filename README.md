# WA Lead Sender (Extensión de Chrome)

Extensión para **WhatsApp Web** que permite cargar un CSV con columnas `link` y `mensaje`, y automatizar el envío de mensajes uno por uno.

> ⚠️ Úsala solo con contactos que hayan dado su consentimiento. El envío masivo no solicitado puede violar políticas y normativas locales.

## Estructura CSV

```csv
link,mensaje
https://wa.me/5491122334455,"Hola, te contacto por..."
https://web.whatsapp.com/send?phone=5491199988877,"¿Te interesa recibir info?"
```

## Instalar localmente

1. Abre `chrome://extensions`.
2. Activa **Developer mode**.
3. Haz clic en **Load unpacked**.
4. Selecciona esta carpeta (`/workspace/whatsappauto`).

## Uso

1. Abre y autentica `https://web.whatsapp.com/`.
2. Haz clic en el icono de la extensión.
3. Carga el CSV.
4. Ajusta la pausa entre envíos (recomendado >= 8000 ms).
5. Pulsa **Iniciar envío masivo**.
6. Si necesitas cortar el proceso, pulsa **Detener**.

## Notas técnicas

- `popup.js` valida y parsea CSV.
- `content.js` navega por cada chat, espera el botón enviar y hace click.
- Si un link es `wa.me`, se transforma a URL de `web.whatsapp.com/send`.
