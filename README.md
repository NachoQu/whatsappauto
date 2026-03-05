# WA Lead Sender (Extensión de Chrome)

Extensión para **WhatsApp Web** que permite importar leads y mensajes desde:

- **CSV** (archivo)
- **Excel / Google Sheets** (pegando tabla con tabulaciones)
- **Google Sheets por URL pública** (export CSV automático)

Luego automatiza el envío de mensajes uno por uno.

> ⚠️ Úsala solo con contactos que hayan dado su consentimiento. El envío masivo no solicitado puede violar políticas y normativas locales.

## Formato requerido

Las columnas deben llamarse exactamente:

- `link`
- `mensaje`

Ejemplo:

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

## Uso rápido

1. Abre y autentica `https://web.whatsapp.com/`.
2. Abre el popup de la extensión.
3. Elige origen:
   - **Archivo CSV**: sube tu archivo.
   - **Pegar tabla (Excel/Sheets)**: copia y pega rango con encabezados.
   - **Google Sheets URL**: pega URL de hoja pública/compartida.
4. Ajusta pausa entre envíos (recomendado >= 8000 ms).
5. Pulsa **Iniciar envío masivo**.
6. Para cortar el proceso, pulsa **Detener**.

## Notas técnicas

- `popup.js` importa y normaliza datos desde múltiples orígenes.
- `content.js` navega por cada chat, espera botón enviar y hace click.
- Links `wa.me` se transforman a URLs `web.whatsapp.com/send`.
