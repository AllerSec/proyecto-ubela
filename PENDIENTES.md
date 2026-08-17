# UBELA · Pasos para publicar

El código está terminado y verificado. Estos pasos no se pueden hacer desde el repo:

## 1. DNS (antes de nada)
`www.ubela.net` apunta hoy a `ghs.google.com` (el Google Sites antiguo). Al subir esta web
al hosting Apache, apuntar el DNS de `www.ubela.net` (y la raíz `ubela.net`) al hosting.
El `.htaccess` ya redirige `ubela.net` → `https://www.ubela.net`.

## 2. Activar FormSubmit (después de publicar)
El formulario de "Trabaja con nosotros" envía a `formsubmit.co/administracion@ubela.net`.
El PRIMER envío hace que FormSubmit mande un correo de activación a administracion@ubela.net:
hay que abrir ese correo y pulsar **Activate** (una sola vez). Hasta entonces no llegan candidaturas.
→ Tras publicar, hacer un envío de prueba desde la web y avisar al cliente de que pulse Activate.

## 3. Revisión del euskera
Todo el euskera está traducido por IA a partir del documento del cliente.
Conviene que un nativo lo repase antes de darlo por definitivo (igual que se hizo con Errekalde).

## 4. Fotos reales (opcional)
Las imágenes actuales son de stock (las que ya tenía el proyecto). Cuando el cliente pase
fotos reales del taller y de los dos pabellones, sustituirlas en `assets/images/services/`.

---

**Mantenimiento:** si se toca `assets/css/main.css` o `assets/js/main.js`, subir la versión
`?v=YYYYMMDD` en las 21 páginas HTML (el hosting cachea los estáticos 1 año).

**Prueba en local:** `python -m http.server 8642` desde esta carpeta y abrir
`http://localhost:8642/index.html`.
