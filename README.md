# WA Lead Sender (Extensión de Chrome)

Extensión para **WhatsApp Web** que permite importar leads y mensajes desde:

- **Documento CSV/TXT/TSV** (subida de archivo)
- **Excel / Google Sheets** (copiar/pegar tabla)
- **Google Sheets por URL** (link normal o link de exportación CSV)

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

## Nota sobre archivos Excel (`.xlsx` / `.xls`)

- La extensión ahora detecta estos archivos y te guía con un mensaje.
- Para cargar datos desde Excel:
  1. Exporta a CSV/TXT/TSV y súbelo, o
  2. Copia el rango con encabezados `link` y `mensaje` y pégalo en la opción **Pegar tabla**.

## Instalar localmente

1. Abre `chrome://extensions`.
2. Activa **Developer mode**.
3. Haz clic en **Load unpacked**.
4. Selecciona esta carpeta (`/workspace/whatsappauto`).

## Uso rápido

1. Abre y autentica `https://web.whatsapp.com/`.
2. Abre el popup de la extensión.
3. Elige origen:
   - **Documento**: sube CSV/TXT/TSV (coma, punto y coma o tabulador).
   - **Pegar tabla (Excel/Sheets)**: copia y pega rango con encabezados (también acepta texto CSV pegado).
   - **Google Sheets URL**: pega URL de hoja (incluye soporte para `#gid=`).
4. Ajusta pausa entre envíos (recomendado >= 8000 ms).
5. Pulsa **Iniciar envío masivo**.
6. Para cortar el proceso, pulsa **Detener**.

## Notas técnicas

- `popup.js` importa y normaliza datos desde múltiples orígenes.
- Parser de documentos detecta delimitador automáticamente (`,`, `;`, `\t`).
- `content.js` navega por cada chat, espera botón enviar y hace click.
- Links `wa.me` se transforman a URLs `web.whatsapp.com/send`.


## Solución a error común

Si ves `Encabezados requeridos: link,mensaje` al pegar datos, revisa que:

- la primera fila sea exactamente `link,mensaje` (o `link<TAB>mensaje`),
- el valor de `mensaje` quede entre comillas cuando tiene comas,
- y estés pegando en la caja completa desde la primera línea.


## Si al presionar "Iniciar envío masivo" no pasa nada

- Verifica que la pestaña activa sea `https://web.whatsapp.com` (no el popup ni otra web).
- Recarga la extensión desde `chrome://extensions` después de actualizarla.
- La extensión ahora reintenta inyectar automáticamente `content.js` si Chrome no lo detecta en la pestaña, y muestra un error claro en el estado si falla.
