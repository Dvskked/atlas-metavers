# Atlas · Metaverso

Parque 3D interactivo para simular la cadena de reciclaje de Atlas: recoge botellas PET, colócalas en la estación, escanéalas y acumula **AtlasPuntos** con reglas idénticas al sistema original (`+50` botella, `+10` tapa, `+5` etiqueta, máximo `65`).

Desarrollado con React + Vite + React Three Fiber + Three.js + Zustand.

## Características

- **Identidad Atlas**: Paleta oficial (`#050e1c`, `#0e2038`, `#11294a`, `#00e5ff`, `#2f6bff`, `#eef5ff`) y tipografía `Segoe UI`.
- **Mundo nocturno**: Parque con césped, paseo central, luces cyan, postes, vallas y motas animadas (luciérnagas).
- **Botellas recogibles**: Apariciones con variaciones (con/sin tapa/etiqueta), halos interactivos y físicas sencillas por bounding box.
- **Marcas ficticias (parodias)**: Botellas NPC que saltan por el paseo o yacen en el suelo con wordmarks inventados (`KOKA-KOLA`, `PEPSEN`, `ESPITE`, `FANTU`, `SIET UP`, `MONSTEL`, etc.). **Atlas no verifica marcas**: el comprobante lo aclara y las copias siguen la misma mecánica.
- **Estación de escaneo IA**: Pedestal con anillo luminoso, plano de barrido, recuadros 3D por parte (botella/etiqueta/tapa), etiquetas DOM flotantes, sonidos y cronómetro de `3.2s`.
- **Flujo correcto**: Recoger botella → colocarla en la plataforma → pulsar `Escanear botella` → registro automático con puntos y comprobante `ATLA-000001` y sucesivos.
- **HUD + UI**: Menú inicial, tooltip de interacción, tostadas `+XX AtlasPuntos`, comprobante modal, carteles informativos y catálogo ecológico.
- **Persistencia**: Saldo, botellas registradas, último comprobante y siguiente ID se guardan en `localStorage` (`atlas-metaverso`).
- **Logo real**: Usa `public/logo-atlas.png` (460×466) importado desde `F:\Atlas\static\img\logo.png`.

## Estructura

```text
metaverso-atlas/
├─ index.html
├─ public/
│  ├─ logo-atlas.png
│  └─ catalogo/  (llavero-sigirec.png, mini-maceta.png, portalapices.png, ...)
├─ src/
│  ├─ App.jsx
│  ├─ Experience.jsx
│  ├─ Overlay.jsx
│  ├─ main.jsx
│  ├─ store.js
│  ├─ styles.css
│  ├─ atlas/
│  │  ├─ brands.js      (marcas, stands, catálogo)
│  │  ├─ palette.js     (colores, SCORE, comprobante)
│  │  └─ world.js       (mapa, colliders, spots)
│  ├─ components/
│  │  ├─ Bottles.jsx
│  │  ├─ Carried.jsx
│  │  ├─ CopyBrands.jsx
│  │  ├─ ErrorBoundary.jsx
│  │  ├─ Interaction.jsx
│  │  ├─ Lights.jsx
│  │  ├─ LoadingScreen.jsx
│  │  ├─ Park.jsx
│  │  ├─ Player.jsx
│  │  ├─ PointerLock.jsx
│  │  ├─ ScanStation.jsx
│  │  └─ Sky.jsx
│  ├─ game/
│  │  ├─ bottle.js       (geometría Lathe PET, materiales)
│  │  ├─ bus.js          (diálogos NPC)
│  │  ├─ sfx.js          (efectos WebAudio sencillos)
│  │  └─ textures.js     (canvas 2D para etiquetas/carteles)
│  └─ hooks/
│     └─ useKeyboard.js
├─ package.json
└─ vite.config.js
```

## Scripts

```powershell
# Modo desarrollo (recarga caliente)
npm run dev

# Build de producción
npm run build

# Vista previa del build
npm run preview
```

## Puesta en marcha

**Desarrollo:**
```powershell
cd "F:\Atlas\metaverso-atlas"
npx vite --port 5175 --host
```
Abrir [http://localhost:5175/metaverso/](http://localhost:5175/metaverso/)

**Producción (preview):**
```powershell
cd "F:\Atlas\metaverso-atlas"
npx vite build
npx vite preview --port 4174 --host
```
Abrir [http://localhost:4174/metaverso/](http://localhost:4174/metaverso/)

> `vite.config.js` usa `base: '/metaverso/'`.

## Controles

| Tecla/acción | Efecto |
|---|---|
| `W` `A` `S` `D` | Movimiento |
| `Shift` | Correr |
| `Espacio` | Saltar |
| `Clic izquierdo` | Recoger · Colocar · Interactuar (leer carteles) |
| `Esc` | Liberar puntero (Pointer Lock) |

## Reglas de puntuación

- **Botella PET**: `+50`
- **Tapa presente**: `+10`
- **Etiqueta presente**: `+5`
- **Máximo por botella**: `65`

La lógica coincide con `app.py` del backend Flask. Los comprobantes tienen formato `ATLA-XXXXXX` (correlativo). Para las botellas con marca ficticia se muestra una nota aclarando que **Atlas evalúa el material y no verifica la marca**.

## Notas técnicas

- **Renderizado 3D**: Three.js 0.169 + `@react-three/fiber` 8.17 + `@react-three/drei` 9.117 (sin uso activo, pero declarado).
- **Estado**: Zustand con persistencia en `localStorage` (`atlas-metaverso`).
- **Interacción**: Raycast central + registro de meshes en `REGISTRY` (Bottles, CopyBrands, Park stands, Pedestal).
- **Colliders**: AABB sencillos para evitar atravesar árboles, vallas, kiosco y stands.
- **SFX**: WebAudio API ligero (pick/place/scan/scanDone/points/open).
- **Optimización**: Geometrías compartidas para botellas, texturas canvas cacheables y uso de `useMemo/useEffect` para limpieza.

## Advertencias

- **Tamaño de chunks**: Vite avisa de chunks > 500KB tras minificación (normal con Three.js). Se puede dividir con `manualChunks` si se desea optimizar más.
- **WebGL**: Requiere aceleración por hardware y WebGL activado. Si falla, aparece fallback con mensaje explicativo.
- **Legacy**: El subdirectorio contiene algunos componentes originales de Xupply; no se eliminaron (respaldo implícito). El metaverso completo reescrito es este.

## Créditos

Basado en la identidad visual y reglas de negocio de **Atlas** (reciclaje inteligente). Logo y paleta extraídos del proyecto Flask existente. Marcas usadas son **parodias ficticias** con fines demostrativos.