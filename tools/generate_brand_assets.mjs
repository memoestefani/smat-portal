import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const siteRoot = path.resolve('c:/Users/52331/Documents/Proyectos/2_smat/site');
const publicDir = path.join(siteRoot, 'public');
const imagesDir = path.join(publicDir, 'images');

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// 1. Crear favicon.svg vectorial con prefers-color-scheme
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="vortex-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#051B2E"/>
      <stop offset="50%" stop-color="#0D78C6"/>
      <stop offset="100%" stop-color="#4FAEEB"/>
    </linearGradient>
  </defs>
  <style>
    .vortex-core { fill: #051B2E; }
    .vortex-blade-1 { fill: #051B2E; }
    .vortex-blade-2 { fill: #083860; }
    .vortex-blade-3 { fill: #0D78C6; }
    .vortex-blade-4 { fill: #4FAEEB; }
    @media (prefers-color-scheme: dark) {
      .vortex-core { fill: #FFFFFF; }
      .vortex-blade-1 { fill: #FFFFFF; }
      .vortex-blade-2 { fill: #38BDF8; }
      .vortex-blade-3 { fill: #4FAEEB; }
      .vortex-blade-4 { fill: #0D78C6; }
    }
  </style>
  <g transform="translate(32, 32)">
    <path class="vortex-blade-1" d="M 0 -28 C 12 -28 24 -18 24 -4 C 24 6 16 12 6 8 C -2 4 -4 -6 -3 -16 Z" />
    <path class="vortex-blade-2" d="M 28 0 C 28 12 18 24 4 24 C -6 24 -12 16 -8 6 C -4 -2 6 -4 16 -3 Z" />
    <path class="vortex-blade-3" d="M 0 28 C -12 28 -24 18 -24 4 C -24 -6 -16 -12 -6 -8 C 2 -4 4 6 3 16 Z" />
    <path class="vortex-blade-4" d="M -28 0 C -28 -12 -18 -24 -4 -24 C 6 -24 12 -16 8 -6 C 4 2 -6 4 -16 3 Z" />
    <circle class="vortex-core" cx="0" cy="0" r="4.5" />
  </g>
</svg>
`;

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg, 'utf-8');
console.log('✅ public/favicon.svg creado con éxito.');

// 2. Generar public/favicon.ico multi-resolución con Sharp
async function buildIco() {
  const svgBuffer = Buffer.from(faviconSvg);
  const sizes = [16, 32, 48];
  const pngBuffers = [];

  for (const s of sizes) {
    const png = await sharp(svgBuffer)
      .resize(s, s)
      .png()
      .toBuffer();
    pngBuffers.push({ size: s, data: png });
  }

  // Header ICO: 6 bytes
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(count, 4); // image count

  let currentOffset = 6 + (16 * count);
  const directoryEntries = [];

  for (const item of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(item.size === 256 ? 0 : item.size, 0); // width
    entry.writeUInt8(item.size === 256 ? 0 : item.size, 1); // height
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(item.data.length, 8); // size of image data
    entry.writeUInt32LE(currentOffset, 12); // offset of image data
    directoryEntries.push(entry);
    currentOffset += item.data.length;
  }

  const icoBuffer = Buffer.concat([
    header,
    ...directoryEntries,
    ...pngBuffers.map(p => p.data)
  ]);

  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log('✅ public/favicon.ico multi-resolución generado con éxito (' + icoBuffer.length + ' bytes).');
}

// 3. Generar public/images/og-card.jpg (1200x630)
async function buildOgCard() {
  const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#051B2E" />
        <stop offset="45%" stop-color="#082A48" />
        <stop offset="100%" stop-color="#0B1320" />
      </linearGradient>
      <linearGradient id="cyan-glow" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#0D78C6" stop-opacity="0.8" />
        <stop offset="100%" stop-color="#4FAEEB" stop-opacity="0.9" />
      </linearGradient>
      <radialGradient id="vortex-ambient" cx="80%" cy="30%" r="50%">
        <stop offset="0%" stop-color="#0D78C6" stop-opacity="0.35" />
        <stop offset="60%" stop-color="#083860" stop-opacity="0.1" />
        <stop offset="100%" stop-color="#051B2E" stop-opacity="0" />
      </radialGradient>
      <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
      </pattern>
    </defs>

    <!-- Fondo Principal -->
    <rect width="1200" height="630" fill="url(#bg)" />
    <rect width="1200" height="630" fill="url(#vortex-ambient)" />
    <rect width="1200" height="630" fill="url(#grid-pattern)" />

    <!-- Acento Lateral Superior -->
    <rect x="0" y="0" width="1200" height="6" fill="url(#cyan-glow)" />

    <!-- Isotipo Vórtice en Fondo Derecho -->
    <g transform="translate(940, 315) scale(5.5)" opacity="0.18">
      <path fill="#4FAEEB" d="M 0 -28 C 12 -28 24 -18 24 -4 C 24 6 16 12 6 8 C -2 4 -4 -6 -3 -16 Z" />
      <path fill="#0D78C6" d="M 28 0 C 28 12 18 24 4 24 C -6 24 -12 16 -8 6 C -4 -2 6 -4 16 -3 Z" />
      <path fill="#38BDF8" d="M 0 28 C -12 28 -24 18 -24 4 C -24 -6 -16 -12 -6 -8 C 2 -4 4 6 3 16 Z" />
      <path fill="#FFFFFF" d="M -28 0 C -28 -12 -18 -24 -4 -24 C 6 -24 12 -16 8 -6 C 4 2 -6 4 -16 3 Z" />
      <circle fill="#FFFFFF" cx="0" cy="0" r="4.5" />
    </g>

    <!-- Contenido Editorial -->
    <g transform="translate(80, 110)">
      <!-- Badge de Ubicación y Planta -->
      <rect x="0" y="0" width="370" height="36" rx="6" fill="rgba(13, 120, 198, 0.2)" stroke="#0E4A7D" stroke-width="1.5" />
      <circle cx="18" cy="18" r="5" fill="#4FAEEB" />
      <text x="32" y="23" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#E2E8F0" letter-spacing="1.5">ALMACÉN CENTRAL DURANGO • MÉXICO</text>

      <!-- Título de Marca SMAT MINERALS -->
      <text x="0" y="110" font-family="system-ui, -apple-system, sans-serif" font-size="64" font-weight="900" fill="#FFFFFF" letter-spacing="-1">SMAT MINERALS</text>
      
      <!-- Subtítulo de Posicionamiento -->
      <text x="0" y="165" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="600" fill="#4FAEEB" letter-spacing="0.5">Equipos de Proceso y Refaccionamiento Crítico</text>

      <!-- Párrafo Descriptivo -->
      <text x="0" y="225" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="400" fill="#94A3B8">Soluciones integradas para plantas de beneficio minero en México.</text>
      <text x="0" y="258" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="400" fill="#94A3B8">Metalurgias de alta resiliencia y balanceo dinámico en taller.</text>

      <!-- 4 Circuitos de Planta -->
      <g transform="translate(0, 310)">
        <!-- Circuito 1 -->
        <rect x="0" y="0" width="220" height="48" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" stroke-width="1" />
        <text x="18" y="29" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="700" fill="#FFFFFF">1. BOMBEO PULPA</text>

        <!-- Circuito 2 -->
        <rect x="235" y="0" width="220" height="48" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" stroke-width="1" />
        <text x="253" y="29" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="700" fill="#FFFFFF">2. FLOTACIÓN</text>

        <!-- Circuito 3 -->
        <rect x="470" y="0" width="220" height="48" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" stroke-width="1" />
        <text x="488" y="29" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="700" fill="#FFFFFF">3. FILTRACIÓN</text>

        <!-- Circuito 4 -->
        <rect x="705" y="0" width="230" height="48" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" stroke-width="1" />
        <text x="723" y="29" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="700" fill="#FFFFFF">4. HIDROCICLONES</text>
      </g>

      <!-- Pie de Certeza y SLA -->
      <g transform="translate(0, 400)">
        <line x1="0" y1="0" x2="935" y2="0" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
        <text x="0" y="32" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#E2E8F0">VENTAS Y ATENCIÓN DE PLANTA: (618) 810-4408 • VENTAS@SMATMINERALS.COM</text>
        <text x="640" y="32" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#38BDF8">HORARIO: L-V 08:00 - 18:00 CST</text>
      </g>
    </g>
  </svg>
  `;

  const jpgBuffer = await sharp(Buffer.from(ogSvg))
    .jpeg({ quality: 88, chromaSubsampling: '4:4:4' })
    .toBuffer();

  const ogCardPath = path.join(imagesDir, 'og-card.jpg');
  fs.writeFileSync(ogCardPath, jpgBuffer);
  console.log(`✅ public/images/og-card.jpg generado (${jpgBuffer.length} bytes / ${(jpgBuffer.length / 1024).toFixed(1)} KB).`);
}

async function main() {
  await buildIco();
  await buildOgCard();
}

main().catch(err => {
  console.error('Error generando brand assets:', err);
  process.exit(1);
});
