/**
 * build_product_images.mjs
 * ---------------------------------------------------------------------------
 * Pipeline determinista de curaduría y recorte Cero-OEM en WebP (640x480, 4:3, <= 45 KB)
 * sobre lienzo blanco humo (#F8FAFC, Solar Light-First WCAG AAA) con lista blanca explícita
 * 1:1 hacia 04_fototeca_de_productos/ (0 archivos de exhibición con marca, 0 operador módulo %,
 * 19/19 SHA-256 y 64-bit dHash perceptuales únicos, PRD v3.2 §6.2 / D4 = 4-C+ / ARB-SMAT-34).
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');
const CATALOG_PATH = path.join(SITE_ROOT, 'data/quick_checkout_Catalog.json');
const OUTPUT_DIR = path.join(SITE_ROOT, 'public/images/productos');
const MEMO_ROOT = path.resolve(SITE_ROOT, '../../2_smat/ideas/PAGINA SMAT MEMO');

/**
 * Lista blanca 1:1 curada de fotografías reales limpias (Cero-OEM, sin lonas de feria)
 * verificadas contra 00_MANIFESTO_PAGINA_MEMO.csv.
 */
export const SKU_TO_CURATED_PHOTO_SPEC = Object.freeze({
  'SMAT-LAB-MARCY-1000': {
    relPath: '04_fototeca_de_productos/04_piezas_y_stock_almacen/balanza.jpg',
    cropGravity: 'center',
    cropBox: { leftRatio: 0.04, topRatio: 0.02, widthRatio: 0.92, heightRatio: 0.94 }
  },
  'SMAT-LAB-VASO-1000': {
    relPath: '04_fototeca_de_productos/03_tamices_e_instrumental/IMG_0395.JPG',
    cropGravity: 'center',
    cropBox: { leftRatio: 0.08, topRatio: 0.05, widthRatio: 0.84, heightRatio: 0.90 }
  },
  'SMAT-LAB-TAMIZ-E11': {
    relPath: '04_fototeca_de_productos/03_tamices_e_instrumental/1I4in.jpg',
    cropGravity: 'center',
    cropBox: { leftRatio: 0.05, topRatio: 0.05, widthRatio: 0.90, heightRatio: 0.90 }
  },
  'SMAT-LAB-ROTAP-MECH': {
    relPath: '04_fototeca_de_productos/03_tamices_e_instrumental/70bb8f.jpg',
    cropGravity: 'center',
    cropBox: { leftRatio: 0.05, topRatio: 0.04, widthRatio: 0.90, heightRatio: 0.92 }
  },
  'SMAT-LAB-PLATO-TENT': {
    relPath: '04_fototeca_de_productos/04_piezas_y_stock_almacen/platostentinox.jpg',
    cropGravity: 'center',
    cropBox: { leftRatio: 0.06, topRatio: 0.06, widthRatio: 0.88, heightRatio: 0.88 }
  },
  'SMAT-LAB-PULV-DISC': {
    relPath: '04_fototeca_de_productos/03_tamices_e_instrumental/IMG_0648.JPG',
    cropGravity: 'center',
    cropBox: { leftRatio: 0.10, topRatio: 0.08, widthRatio: 0.80, heightRatio: 0.84 }
  },
  'SMAT-LAB-FILTRO-BATCH': {
    relPath: '04_fototeca_de_productos/04_piezas_y_stock_almacen/Pressure Filter.jpg',
    cropGravity: 'center',
    cropBox: { leftRatio: 0.04, topRatio: 0.03, widthRatio: 0.92, heightRatio: 0.94 }
  },
  'SMAT-PUMP-IMP-AH': {
    relPath: '04_fototeca_de_productos/01_sesion_taller_alta_resolucion/DSCF7815.JPG',
    cropGravity: 'center',
    cropBox: { leftRatio: 0.12, topRatio: 0.08, widthRatio: 0.76, heightRatio: 0.84 }
  },
  'SMAT-PUMP-WETKIT-554': {
    relPath: '04_fototeca_de_productos/04_piezas_y_stock_almacen/explosion bomba.jpg',
    cropGravity: 'center',
    cropBox: { leftRatio: 0.02, topRatio: 0.04, widthRatio: 0.96, heightRatio: 0.92 }
  },
  'SMAT-PUMP-EXPELLER-KIT': {
    relPath: '04_fototeca_de_productos/01_sesion_taller_alta_resolucion/DSCF7820.JPG',
    cropGravity: 'center',
    cropBox: { leftRatio: 0.14, topRatio: 0.10, widthRatio: 0.72, heightRatio: 0.80 }
  },
  'SMAT-PUMP-BRG-005M': {
    relPath: '04_fototeca_de_productos/01_sesion_taller_alta_resolucion/DSCF7825.JPG',
    cropGravity: 'center',
    cropBox: { leftRatio: 0.10, topRatio: 0.12, widthRatio: 0.80, heightRatio: 0.78 }
  },
  'SMAT-PUMP-LINERS-AH': {
    relPath: '04_fototeca_de_productos/04_piezas_y_stock_almacen/laina succion bomba 2.jpg',
    cropGravity: 'center',
    cropBox: { leftRatio: 0.05, topRatio: 0.05, widthRatio: 0.90, heightRatio: 0.90 }
  },
  'SMAT-CYC-D6-D20': {
    relPath: '04_fototeca_de_productos/04_piezas_y_stock_almacen/IMG_0516.JPG',
    cropGravity: 'center',
    cropBox: { leftRatio: 0.08, topRatio: 0.04, widthRatio: 0.84, heightRatio: 0.92 }
  },
  'SMAT-COUPLED-PUMP-CYC': {
    relPath: '04_fototeca_de_productos/04_piezas_y_stock_almacen/bomba de lodo.jpg',
    cropGravity: 'center',
    cropBox: { leftRatio: 0.04, topRatio: 0.06, widthRatio: 0.92, heightRatio: 0.88 }
  },
  'SMAT-SCR-TH48-30': {
    relPath: '04_fototeca_de_productos/02_bombas_y_equipos_de_planta/malla para criba.jpg',
    cropGravity: 'center',
    cropBox: { leftRatio: 0.06, topRatio: 0.06, widthRatio: 0.88, heightRatio: 0.88 }
  },
  'SMAT-SCR-MOD-1X1': {
    relPath: '04_fototeca_de_productos/04_piezas_y_stock_almacen/Modulo poliuretano.jpg',
    cropGravity: 'center',
    cropBox: { leftRatio: 0.05, topRatio: 0.05, widthRatio: 0.90, heightRatio: 0.90 }
  },
  'SMAT-FILT-CLOTH-PLATE': {
    relPath: '04_fototeca_de_productos/04_piezas_y_stock_almacen/IMG_1138.JPG',
    cropGravity: 'center',
    cropBox: { leftRatio: 0.06, topRatio: 0.06, widthRatio: 0.88, heightRatio: 0.88 }
  },
  'SMAT-FILT-SHIFTER-CHAIN': {
    relPath: '04_fototeca_de_productos/04_piezas_y_stock_almacen/IMG_4895.JPG',
    cropGravity: 'center',
    cropBox: { leftRatio: 0.08, topRatio: 0.08, widthRatio: 0.84, heightRatio: 0.84 }
  },
  'SMAT-FLOT-MECH-18SP': {
    relPath: '04_fototeca_de_productos/02_bombas_y_equipos_de_planta/mecanismo.JPG',
    cropGravity: 'center',
    cropBox: { leftRatio: 0.05, topRatio: 0.04, widthRatio: 0.90, heightRatio: 0.92 }
  }
});

/**
 * Calcula el hash perceptual diferencial de 64 bits (dHash 9x8 en escala de grises, Zauner 2010)
 * para garantizar distancia de Hamming > 0 entre los 19 SKUs.
 * Acepta tanto un buffer crudo de 72 bytes (9x8) como un Buffer de imagen comprimida (WebP/PNG/JPEG).
 * @param {Buffer|Uint8Array} inputBuffer
 * @returns {Promise<string>} Hexadecimal de 16 caracteres (64 bits)
 */
export async function computeImageDHash64(inputBuffer) {
  let gray9x8 = inputBuffer;
  if (inputBuffer && inputBuffer.length !== 72) {
    gray9x8 = await sharp(inputBuffer).grayscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer();
  }
  let bits = 0n;
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const left = gray9x8[row * 9 + col] ?? 0;
      const right = gray9x8[row * 9 + col + 1] ?? 0;
      bits = (bits << 1n) | (left > right ? 1n : 0n);
    }
  }
  return bits.toString(16).padStart(16, '0');
}

export function buildCadBlueprintSvg(skuOrKey, diagramIdOverride) {
  if (typeof skuOrKey === 'string') {
    return buildFamilyGeometrySvg({ sku_id: skuOrKey, diagram_id: diagramIdOverride || 'impeller_5vane' }, 0);
  }
  return buildFamilyGeometrySvg(skuOrKey, 0);
}

export function buildFamilyGeometrySvg(sku, idx) {
  const triplet = sku.geometric_triplet_mm || { a_id_mm: 100, b_od_mm: 400, c_thickness_mm: 80 };
  const skuKey = sku.sku_id || sku.id;
  const diagramId = sku.diagram_id || 'impeller_5vane';
  const cx = 485;
  const cy = 165;
  let cadSvg = '';

  if (skuKey === 'SMAT-LAB-VASO-1000') {
    cadSvg = `
      <!-- Cilindro Graduado Inox 1,000 ml con Válvula de Pellizco -->
      <rect x="${cx - 32}" y="${cy - 68}" width="64" height="122" rx="6" fill="#F1F5F9" stroke="#0F172A" stroke-width="2.5"/>
      <line x1="${cx - 22}" y1="${cy - 45}" x2="${cx + 12}" y2="${cy - 45}" stroke="#475569" stroke-width="2"/>
      <line x1="${cx - 22}" y1="${cy - 20}" x2="${cx + 18}" y2="${cy - 20}" stroke="#D97706" stroke-width="2"/>
      <line x1="${cx - 22}" y1="${cy + 5}" x2="${cx + 12}" y2="${cy + 5}" stroke="#475569" stroke-width="2"/>
      <line x1="${cx - 22}" y1="${cy + 30}" x2="${cx + 18}" y2="${cy + 30}" stroke="#D97706" stroke-width="2"/>
      <path d="M ${cx - 8} ${cy + 54} L ${cx - 8} ${cy + 78} L ${cx + 8} ${cy + 78} L ${cx + 8} ${cy + 54}" fill="#FFFFFF" stroke="#0F172A" stroke-width="2"/>
      <circle cx="${cx}" cy="${cy - 82}" r="10" fill="none" stroke="#0F172A" stroke-width="2.5"/>
    `;
  } else if (diagramId === 'marcy_scale' || diagramId === 'marcy') {
    cadSvg = `
      <!-- Carátula Concéntrica de Doble Anillo Graduado (Balanza Marcy) -->
      <circle cx="${cx}" cy="${cy}" r="76" fill="#F1F5F9" stroke="#0F172A" stroke-width="2.5"/>
      <circle cx="${cx}" cy="${cy}" r="56" fill="#FFFFFF" stroke="#D97706" stroke-width="2" stroke-dasharray="6 3"/>
      <circle cx="${cx}" cy="${cy}" r="36" fill="#F8FAFC" stroke="#0284C7" stroke-width="1.8" stroke-dasharray="4 2"/>
      <line x1="${cx}" y1="${cy}" x2="${cx + 48}" y2="${cy - 34}" stroke="#DC2626" stroke-width="3" stroke-linecap="round"/>
      <circle cx="${cx}" cy="${cy}" r="6" fill="#0F172A"/>
    `;
  } else if (skuKey === 'SMAT-LAB-ROTAP-MECH') {
    cadSvg = `
      <!-- Columna Excéntrica Vertical con Brazo Martillo (Tamizadora Ro-Tap) -->
      <rect x="${cx - 52}" y="${cy - 60}" width="104" height="120" rx="6" fill="#F1F5F9" stroke="#0F172A" stroke-width="2.5"/>
      <line x1="${cx - 38}" y1="${cy - 45}" x2="${cx - 38}" y2="${cy + 45}" stroke="#475569" stroke-width="3"/>
      <line x1="${cx + 38}" y1="${cy - 45}" x2="${cx + 38}" y2="${cy + 45}" stroke="#475569" stroke-width="3"/>
      <rect x="${cx - 28}" y="${cy - 28}" width="56" height="58" fill="#FFFFFF" stroke="#D97706" stroke-width="2"/>
      <path d="M ${cx} ${cy - 76} L ${cx + 26} ${cy - 48} L ${cx} ${cy - 34}" fill="none" stroke="#0F172A" stroke-width="3" stroke-linecap="round"/>
    `;
  } else if (diagramId === 'astm_sieves' || diagramId === 'sieves') {
    cadSvg = `
      <!-- Pila de Tamices Cilíndricos con Retícula ASTM E11 -->
      <ellipse cx="${cx}" cy="${cy - 36}" rx="64" ry="20" fill="#FFFFFF" stroke="#0F172A" stroke-width="2.5"/>
      <path d="M ${cx - 64} ${cy - 36} L ${cx - 64} ${cy + 34} A 64 20 0 0 0 ${cx + 64} ${cy + 34} L ${cx + 64} ${cy - 36}" fill="#F1F5F9" stroke="#0F172A" stroke-width="2.5"/>
      <line x1="${cx - 42}" y1="${cy - 36}" x2="${cx + 42}" y2="${cy - 36}" stroke="#D97706" stroke-width="1.5"/>
      <line x1="${cx}" y1="${cy - 52}" x2="${cx}" y2="${cy - 20}" stroke="#D97706" stroke-width="1.5"/>
    `;
  } else if (skuKey === 'SMAT-LAB-PLATO-TENT') {
    cadSvg = `
      <!-- Plato Concéntrico Escalonado de Tentadura Inox 304 -->
      <ellipse cx="${cx}" cy="${cy}" rx="74" ry="46" fill="#F1F5F9" stroke="#0F172A" stroke-width="2.5"/>
      <ellipse cx="${cx}" cy="${cy + 4}" rx="56" ry="34" fill="#FFFFFF" stroke="#475569" stroke-width="2"/>
      <ellipse cx="${cx}" cy="${cy + 8}" rx="36" ry="22" fill="#F8FAFC" stroke="#D97706" stroke-width="2"/>
    `;
  } else if (diagramId === 'lab_comminution_pan') {
    cadSvg = `
      <!-- Cámara de Discos Estriados Contrarrotativos (Pulverizador) -->
      <circle cx="${cx}" cy="${cy}" r="72" fill="#F1F5F9" stroke="#0F172A" stroke-width="2.5"/>
      <circle cx="${cx}" cy="${cy}" r="24" fill="#FFFFFF" stroke="#D97706" stroke-width="2.5"/>
      <line x1="${cx - 68}" y1="${cy}" x2="${cx - 24}" y2="${cy}" stroke="#475569" stroke-width="3"/>
      <line x1="${cx + 24}" y1="${cy}" x2="${cx + 68}" y2="${cy}" stroke="#475569" stroke-width="3"/>
      <line x1="${cx}" y1="${cy - 68}" x2="${cx}" y2="${cy - 24}" stroke="#475569" stroke-width="3"/>
      <line x1="${cx}" y1="${cy + 24}" x2="${cx}" y2="${cy + 68}" stroke="#475569" stroke-width="3"/>
    `;
  } else if (diagramId === 'batch_filter') {
    cadSvg = `
      <!-- Cilindro Neumático Presurizado con Manómetro (Filtro Prensa Batch) -->
      <rect x="${cx - 46}" y="${cy - 44}" width="92" height="92" rx="8" fill="#F1F5F9" stroke="#0F172A" stroke-width="2.5"/>
      <line x1="${cx - 56}" y1="${cy - 44}" x2="${cx + 56}" y2="${cy - 44}" stroke="#0F172A" stroke-width="3.5"/>
      <line x1="${cx - 56}" y1="${cy + 48}" x2="${cx + 56}" y2="${cy + 48}" stroke="#0F172A" stroke-width="3.5"/>
      <circle cx="${cx + 28}" cy="${cy - 66}" r="14" fill="#FFFFFF" stroke="#D97706" stroke-width="2.5"/>
      <line x1="${cx + 28}" y1="${cy - 66}" x2="${cx + 35}" y2="${cy - 72}" stroke="#DC2626" stroke-width="2"/>
    `;
  } else if (diagramId === 'cyclone_d6_d20' || diagramId === 'cyclone_apex' || diagramId === 'cyclone_apex_vortex') {
    cadSvg = `
      <!-- Hidrociclón D6-D20 con Cabezal Involuta, Vortex Finder y Apex SiC -->
      <rect x="${cx - 34}" y="${cy - 68}" width="68" height="36" fill="#F1F5F9" stroke="#0F172A" stroke-width="2.5"/>
      <polygon points="${cx - 34},${cy - 32} ${cx + 34},${cy - 32} ${cx + 12},${cy + 58} ${cx - 12},${cy + 58}" fill="#FFFFFF" stroke="#0F172A" stroke-width="2.5"/>
      <rect x="${cx - 12}" y="${cy - 82}" width="24" height="32" fill="#F8FAFC" stroke="#7C3AED" stroke-width="2.2"/>
      <rect x="${cx - 10}" y="${cy + 58}" width="20" height="18" fill="#7C3AED" stroke="#0F172A" stroke-width="2"/>
    `;
  } else if (diagramId === 'pinch_knife_valve' || skuKey === 'SMAT-VALV-PINCH-KNIFE') {
    cadSvg = `
      <!-- Válvula Pinch de Manga R55 y Cuchilla Pasante Bridada ANSI 150 -->
      <rect x="${cx - 56}" y="${cy - 34}" width="112" height="68" rx="6" fill="#F1F5F9" stroke="#0F172A" stroke-width="2.5"/>
      <line x1="${cx - 56}" y1="${cy - 48}" x2="${cx - 56}" y2="${cy + 48}" stroke="#0F172A" stroke-width="4"/>
      <line x1="${cx + 56}" y1="${cy - 48}" x2="${cx + 56}" y2="${cy + 48}" stroke="#0F172A" stroke-width="4"/>
      <path d="M ${cx - 48} ${cy - 18} Q ${cx} ${cy + 6} ${cx + 48} ${cy - 18}" fill="none" stroke="#EA580C" stroke-width="3"/>
      <path d="M ${cx - 48} ${cy + 18} Q ${cx} ${cy - 6} ${cx + 48} ${cy + 18}" fill="none" stroke="#EA580C" stroke-width="3"/>
      <line x1="${cx}" y1="${cy - 72}" x2="${cx}" y2="${cy - 10}" stroke="#475569" stroke-width="3.5"/>
      <line x1="${cx - 24}" y1="${cy - 72}" x2="${cx + 24}" y2="${cy - 72}" stroke="#D97706" stroke-width="4" stroke-linecap="round"/>
    `;
  } else if (diagramId === 'coupled_pump_cyclone') {
    cadSvg = `
      <!-- Paquete Casado Lazo Cerrado Bomba AH + Hidrociclón D10-D20 -->
      <circle cx="${cx - 36}" cy="${cy + 18}" r="36" fill="#F1F5F9" stroke="#0F172A" stroke-width="2.5"/>
      <circle cx="${cx - 36}" cy="${cy + 18}" r="14" fill="#FFFFFF" stroke="#D97706" stroke-width="2"/>
      <path d="M ${cx - 6} ${cy - 4} L ${cx + 26} ${cy - 48}" stroke="#0284C7" stroke-width="4" stroke-linecap="round"/>
      <rect x="${cx + 18}" y="${cy - 64}" width="44" height="24" fill="#F1F5F9" stroke="#0F172A" stroke-width="2.2"/>
      <polygon points="${cx + 18},${cy - 40} ${cx + 62},${cy - 40} ${cx + 48},${cy + 36} ${cx + 32},${cy + 36}" fill="#FFFFFF" stroke="#0F172A" stroke-width="2.2"/>
    `;
  } else if (diagramId === 'urethane_screen_panel_305' || skuKey === 'SMAT-SCR-MOD-1X1') {
    cadSvg = `
      <!-- Módulo de Poliuretano 305x305 mm (1x1 ft) con Fijación Pin-and-Sleeve -->
      <rect x="${cx - 62}" y="${cy - 62}" width="124" height="124" rx="6" fill="#FFF7ED" stroke="#EA580C" stroke-width="2.8"/>
      <circle cx="${cx - 48}" cy="${cy - 48}" r="7" fill="#FFFFFF" stroke="#0F172A" stroke-width="2"/>
      <circle cx="${cx + 48}" cy="${cy - 48}" r="7" fill="#FFFFFF" stroke="#0F172A" stroke-width="2"/>
      <circle cx="${cx - 48}" cy="${cy + 48}" r="7" fill="#FFFFFF" stroke="#0F172A" stroke-width="2"/>
      <circle cx="${cx + 48}" cy="${cy + 48}" r="7" fill="#FFFFFF" stroke="#0F172A" stroke-width="2"/>
      <rect x="${cx - 34}" y="${cy - 34}" width="28" height="28" rx="3" fill="#FFFFFF" stroke="#EA580C" stroke-width="1.8"/>
      <rect x="${cx + 6}" y="${cy - 34}" width="28" height="28" rx="3" fill="#FFFFFF" stroke="#EA580C" stroke-width="1.8"/>
      <rect x="${cx - 34}" y="${cy + 6}" width="28" height="28" rx="3" fill="#FFFFFF" stroke="#EA580C" stroke-width="1.8"/>
      <rect x="${cx + 6}" y="${cy + 6}" width="28" height="28" rx="3" fill="#FFFFFF" stroke="#EA580C" stroke-width="1.8"/>
    `;
  } else if (diagramId === 'urethane_screen_th48') {
    cadSvg = `
      <!-- Panel Modular de Poliuretano con Ranuras de Alivio Troncocónico TH48-30 -->
      <rect x="${cx - 66}" y="${cy - 54}" width="132" height="108" rx="6" fill="#F1F5F9" stroke="#EA580C" stroke-width="2.5"/>
      <rect x="${cx - 48}" y="${cy - 36}" width="24" height="10" rx="2" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.8"/>
      <rect x="${cx - 12}" y="${cy - 36}" width="24" height="10" rx="2" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.8"/>
      <rect x="${cx + 24}" y="${cy - 36}" width="24" height="10" rx="2" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.8"/>
      <rect x="${cx - 48}" y="${cy - 6}" width="24" height="10" rx="2" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.8"/>
      <rect x="${cx - 12}" y="${cy - 6}" width="24" height="10" rx="2" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.8"/>
      <rect x="${cx + 24}" y="${cy - 6}" width="24" height="10" rx="2" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.8"/>
      <rect x="${cx - 48}" y="${cy + 24}" width="24" height="10" rx="2" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.8"/>
      <rect x="${cx - 12}" y="${cy + 24}" width="24" height="10" rx="2" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.8"/>
      <rect x="${cx + 24}" y="${cy + 24}" width="24" height="10" rx="2" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.8"/>
    `;
  } else if (diagramId === 'filter_press' || diagramId === 'filter') {
    cadSvg = `
      <!-- Paquete de Placas Recesadas PP 16 bar y Lona Filtrante Multifilamento -->
      <rect x="${cx - 58}" y="${cy - 56}" width="116" height="112" rx="8" fill="#F1F5F9" stroke="#0F172A" stroke-width="2.5"/>
      <rect x="${cx - 38}" y="${cy - 36}" width="76" height="72" rx="4" fill="#FFFFFF" stroke="#0284C7" stroke-width="2"/>
      <circle cx="${cx}" cy="${cy}" r="16" fill="#F8FAFC" stroke="#D97706" stroke-width="2.5"/>
      <circle cx="${cx - 44}" cy="${cy - 42}" r="6" fill="#0F172A"/>
      <circle cx="${cx + 44}" cy="${cy - 42}" r="6" fill="#0F172A"/>
      <circle cx="${cx - 44}" cy="${cy + 42}" r="6" fill="#0F172A"/>
      <circle cx="${cx + 44}" cy="${cy + 42}" r="6" fill="#0F172A"/>
    `;
  } else if (diagramId === 'filter_plate_shifter') {
    cadSvg = `
      <!-- Mecanismo Corre-Placas (Plate Shifter) con Cadena de Rodillos y Trinquete -->
      <line x1="${cx - 72}" y1="${cy - 28}" x2="${cx + 72}" y2="${cy - 28}" stroke="#0F172A" stroke-width="3.5" stroke-dasharray="10 5"/>
      <circle cx="${cx - 54}" cy="${cy - 28}" r="14" fill="#FFFFFF" stroke="#D97706" stroke-width="2.5"/>
      <circle cx="${cx + 54}" cy="${cy - 28}" r="14" fill="#FFFFFF" stroke="#D97706" stroke-width="2.5"/>
      <rect x="${cx - 26}" y="${cy - 18}" width="52" height="36" rx="4" fill="#F1F5F9" stroke="#0F172A" stroke-width="2.5"/>
      <path d="M ${cx - 8} ${cy + 18} L ${cx - 16} ${cy + 52} L ${cx + 16} ${cy + 52} L ${cx + 8} ${cy + 18} Z" fill="#FFFFFF" stroke="#0284C7" stroke-width="2.2"/>
    `;
  } else if (diagramId === 'flotation_cell' || diagramId === 'flotation') {
    cadSvg = `
      <!-- Mecanismo Suspendido Rotor-Estator con Tubo Central (#18 SP / #24 / #30) -->
      <rect x="${cx - 14}" y="${cy - 76}" width="28" height="92" fill="#F1F5F9" stroke="#0F172A" stroke-width="2.5"/>
      <polygon points="${cx - 48},${cy + 16} ${cx + 48},${cy + 16} ${cx + 62},${cy + 54} ${cx - 62},${cy + 54}" fill="#FFFFFF" stroke="#D97706" stroke-width="2.5"/>
      <line x1="${cx - 32}" y1="${cy + 16}" x2="${cx - 38}" y2="${cy + 54}" stroke="#0F172A" stroke-width="2.5"/>
      <line x1="${cx}" y1="${cy + 16}" x2="${cx}" y2="${cy + 54}" stroke="#0F172A" stroke-width="2.5"/>
      <line x1="${cx + 32}" y1="${cy + 16}" x2="${cx + 38}" y2="${cy + 54}" stroke="#0F172A" stroke-width="2.5"/>
    `;
  } else if (diagramId === 'bearing_cartridge' || diagramId === 'bearing') {
    cadSvg = `
      <!-- Cartucho Cilíndrico de Rodamientos Espalda-con-Espalda 005M -->
      <rect x="${cx - 66}" y="${cy - 38}" width="132" height="76" rx="6" fill="#F1F5F9" stroke="#0F172A" stroke-width="2.5"/>
      <line x1="${cx - 82}" y1="${cy}" x2="${cx + 82}" y2="${cy}" stroke="#D97706" stroke-width="4"/>
      <rect x="${cx - 48}" y="${cy - 30}" width="24" height="60" fill="#FFFFFF" stroke="#475569" stroke-width="2"/>
      <rect x="${cx + 24}" y="${cy - 30}" width="24" height="60" fill="#FFFFFF" stroke="#475569" stroke-width="2"/>
    `;
  } else if (diagramId === 'expeller_seal' || diagramId === 'expeller') {
    cadSvg = `
      <!-- Sello Centrífugo Seco: Expulsor A05 + Anillo Expulsor + Camisa Cerámica -->
      <circle cx="${cx}" cy="${cy}" r="66" fill="#F1F5F9" stroke="#0F172A" stroke-width="2.5" stroke-dasharray="10 4"/>
      <circle cx="${cx}" cy="${cy}" r="46" fill="#FFFFFF" stroke="#D97706" stroke-width="2.5"/>
      <circle cx="${cx}" cy="${cy}" r="20" fill="#F8FAFC" stroke="#0891B2" stroke-width="3"/>
      <line x1="${cx - 46}" y1="${cy}" x2="${cx - 20}" y2="${cy}" stroke="#0F172A" stroke-width="2.5"/>
      <line x1="${cx + 20}" y1="${cy}" x2="${cx + 46}" y2="${cy}" stroke="#0F172A" stroke-width="2.5"/>
      <line x1="${cx}" y1="${cy - 46}" x2="${cx}" y2="${cy - 20}" stroke="#0F172A" stroke-width="2.5"/>
      <line x1="${cx}" y1="${cy + 20}" x2="${cx}" y2="${cy + 46}" stroke="#0F172A" stroke-width="2.5"/>
    `;
  } else if (diagramId === 'wet_kit_554' || diagramId === 'material_kit_grid') {
    cadSvg = `
      <!-- Lote Húmedo Sincronizado 5:5:4 (Impulsor + Cuello de Succión + Voluta) -->
      <circle cx="${cx - 26}" cy="${cy - 12}" r="42" fill="#F1F5F9" stroke="#0F172A" stroke-width="2.5"/>
      <circle cx="${cx - 26}" cy="${cy - 12}" r="16" fill="#FFFFFF" stroke="#D97706" stroke-width="2"/>
      <circle cx="${cx + 28}" cy="${cy + 16}" r="36" fill="#FFFFFF" stroke="#059669" stroke-width="2.5"/>
      <circle cx="${cx + 28}" cy="${cy + 16}" r="14" fill="#F8FAFC" stroke="#0F172A" stroke-width="2"/>
    `;
  } else if (diagramId === 'volute_liner' || diagramId === 'liners') {
    cadSvg = `
      <!-- Perfil Meridional de Voluta / Cuello de Succión Cónico y Platos AH -->
      <path d="M ${cx - 58} ${cy - 48} C ${cx + 42} ${cy - 68}, ${cx + 68} ${cy + 48}, ${cx - 48} ${cy + 54} Z" fill="#F1F5F9" stroke="#0F172A" stroke-width="2.5"/>
      <circle cx="${cx - 10}" cy="${cy + 2}" r="28" fill="#FFFFFF" stroke="#059669" stroke-width="2.5"/>
      <circle cx="${cx - 10}" cy="${cy + 2}" r="14" fill="#F8FAFC" stroke="#D97706" stroke-width="2"/>
    `;
  } else if (diagramId === 'impeller_5vane' || diagramId === 'impeller') {
    const rOuter = Math.max(44, Math.min(110, Math.round((Number(triplet.b_od_mm) || 350) / 6.2)));
    const rInner = Math.max(14, Math.min(rOuter - 16, Math.round((Number(triplet.a_id_mm) || 90) / 3.6)));
    const vaneCount = 5;
    let vanesSvg = '';
    for (let v = 0; v < vaneCount; v += 1) {
      const angle = ((v * 360) / vaneCount + idx * 19) * (Math.PI / 180);
      const x1 = Math.round(cx + rInner * Math.cos(angle));
      const y1 = Math.round(cy + rInner * Math.sin(angle));
      const x2 = Math.round(cx + rOuter * Math.cos(angle + 0.42));
      const y2 = Math.round(cy + rOuter * Math.sin(angle + 0.42));
      vanesSvg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#475569" stroke-width="3.5" stroke-linecap="round"/>`;
    }
    cadSvg = `
      <circle cx="${cx}" cy="${cy}" r="${rOuter}" fill="#F1F5F9" stroke="#0F172A" stroke-width="2.5"/>
      ${vanesSvg}
      <circle cx="${cx}" cy="${cy}" r="${rInner}" fill="#FFFFFF" stroke="#D97706" stroke-width="2.5"/>
    `;
  } else {
    throw new Error(`[E_UNKNOWN_CAD_DIAGRAM_ID] diagram_id "${diagramId}" (SKU ${skuKey}) no tiene geometría registrada en buildFamilyGeometrySvg`);
  }

  return `
    <g opacity="0.96" data-cad-blueprint="${diagramId}">
      ${cadSvg}
      <!-- Tarjeta de Escala Humana ISO/IEC 7810 (85.60 x 53.98 x 0.76 mm) -->
      <rect x="405" y="285" width="205" height="104" rx="8" fill="#FFFFFF" stroke="#0F172A" stroke-width="2"/>
      <rect x="419" y="301" width="28" height="20" rx="3" fill="#F59E0B" stroke="#B45309" stroke-width="1.5"/>
      <text x="455" y="315" fill="#0F172A" font-family="monospace" font-size="10.5" font-weight="bold">ISO/IEC 7810 (0.76mm)</text>
      <text x="419" y="340" fill="#0F172A" font-family="monospace" font-size="10.5" font-weight="bold">${skuKey}</text>
      <text x="419" y="358" fill="#334155" font-family="monospace" font-size="10">CANDADO: ${sku.gate_lock} · MAT: ${sku.default_material}</text>
      <text x="419" y="376" fill="#B45309" font-family="monospace" font-size="10.5" font-weight="bold">MASA SECA: ${sku.mass_kg} kg</text>
    </g>
  `;
}

/**
 * Construye el lienzo de estudio Solar Light-First en blanco humo (#F8FAFC)
 * con contraste de tinta #0F172A (CR >= 14.8:1 WCAG AAA).
 */
function buildStudioOverlaySvg(sku, idx) {
  const triplet = sku.geometric_triplet_mm || { a_id_mm: 100, b_od_mm: 400, c_thickness_mm: 80 };
  const codeLabel = (sku.linked_atomic_codes && sku.linked_atomic_codes.length > 0)
    ? sku.linked_atomic_codes.join(' / ')
    : (sku.sat_tuple ? `SAT ${sku.sat_tuple.clave_prod_serv}` : 'DIRECTO PLANTA');
  const material = sku.default_material || 'A05';
  const avenue = (sku.avenue || 'avenida_1_bombeo').replace(/_/g, ' ').toUpperCase();

  const accentByMaterial = {
    A05: '#D97706',
    A49: '#0284C7',
    R55: '#059669',
    PU: '#EA580C',
    SiC: '#7C3AED',
    C21: '#0891B2'
  };
  const accent = accentByMaterial[material] || '#D97706';
  const familyGeometry = buildFamilyGeometrySvg(sku, idx);

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
      <defs>
        <linearGradient id="bgStudioLight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#F8FAFC"/>
          <stop offset="60%" stop-color="#F1F5F9"/>
          <stop offset="100%" stop-color="#E2E8F0"/>
        </linearGradient>
      </defs>
      <rect width="640" height="480" fill="url(#bgStudioLight)"/>
      <!-- Marco para fotografía real curada a la izquierda -->
      <rect x="20" y="76" width="368" height="320" rx="10" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
      <g stroke="#CBD5E1" stroke-width="1" opacity="0.65">
        <line x1="20" y1="236" x2="388" y2="236" stroke-dasharray="4 4"/>
        <line x1="204" y1="76" x2="204" y2="396" stroke-dasharray="4 4"/>
      </g>
      ${familyGeometry}
      <!-- Encabezado de inspección Cero-OEM sobre blanco humo -->
      <rect x="20" y="16" width="600" height="48" rx="6" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.5"/>
      <text x="34" y="36" fill="#0F172A" font-family="monospace" font-size="12.5" font-weight="bold">SMAT MINERALS · ${sku.sku_id || sku.id} · ${(sku.title_es || '').slice(0, 32)}</text>
      <text x="34" y="54" fill="#334155" font-family="monospace" font-size="10.5">${avenue} · MAT: ${material} · REF: ${codeLabel}</text>
      <!-- Pie de tripleta geométrica (A, B, C) -->
      <rect x="20" y="408" width="600" height="54" rx="6" fill="#FFFFFF" stroke="${accent}" stroke-width="2"/>
      <text x="34" y="430" fill="#0F172A" font-family="monospace" font-size="12" font-weight="bold">TRIPLETA (A,B,C): A=${triplet.a_id_mm}mm | B=${triplet.b_od_mm}mm | C=${triplet.c_thickness_mm}mm</text>
      <text x="34" y="450" fill="#334155" font-family="monospace" font-size="10.5">TOLERANCIA: ISO 2768-m · ESCALA: 0.76 mm (1 TARJETA ISO/IEC 7810) · #${String(idx + 1).padStart(2, '0')}</text>
    </svg>`,
    'utf8'
  );
}

export async function generateAllProductWebpImages() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

  const results = [];
  for (let idx = 0; idx < catalog.length; idx += 1) {
    const sku = catalog[idx];
    const skuKey = sku.sku_id || sku.id;
    const spec = SKU_TO_CURATED_PHOTO_SPEC[skuKey];
    if (!spec || !spec.relPath) {
      throw new Error(`[E_MISSING_CURATED_PHOTO_SPEC] SKU ${skuKey} carece de asignación 1:1 en SKU_TO_CURATED_PHOTO_SPEC`);
    }
    if (/expo\b/i.test(spec.relPath)) {
      throw new Error(`[E_FORBIDDEN_EXPO_RENDER] SKU ${skuKey} intenta usar archivo de lona de feria prohibido: ${spec.relPath}`);
    }

    const sourceImgPath = path.join(MEMO_ROOT, spec.relPath);
    if (!fs.existsSync(sourceImgPath)) {
      throw new Error(`[E_SOURCE_PHOTO_NOT_FOUND] No existe fotografía curada para ${skuKey}: ${sourceImgPath}`);
    }

    const baseSvg = buildStudioOverlaySvg(sku, idx);
    let imgPipe = sharp(sourceImgPath);
    if (spec.cropBox) {
      const meta = await imgPipe.metadata();
      if (meta.width && meta.height) {
        const left = Math.max(0, Math.round(meta.width * spec.cropBox.leftRatio));
        const top = Math.max(0, Math.round(meta.height * spec.cropBox.topRatio));
        const width = Math.max(16, Math.min(meta.width - left, Math.round(meta.width * spec.cropBox.widthRatio)));
        const height = Math.max(16, Math.min(meta.height - top, Math.round(meta.height * spec.cropBox.heightRatio)));
        imgPipe = sharp(sourceImgPath).extract({ left, top, width, height });
      }
    }
    const fgBuffer = await imgPipe
      .resize(344, 296, {
        fit: 'contain',
        background: { r: 248, g: 250, b: 252, alpha: 1 }
      })
      .png()
      .toBuffer();

    const pipeline = sharp(baseSvg)
      .resize(640, 480, { fit: 'cover' })
      .composite([
        {
          input: fgBuffer,
          top: 88,
          left: 32,
          blend: 'over'
        }
      ]);

    let quality = 70;
    let webpBuffer = await pipeline.webp({ quality, effort: 4 }).toBuffer();
    while (webpBuffer.length > 45000 && quality > 38) {
      quality -= 6;
      webpBuffer = await pipeline.webp({ quality, effort: 5 }).toBuffer();
    }

    const outFileName = `${sku.slug_es}.webp`;
    const outFullPath = path.join(OUTPUT_DIR, outFileName);
    fs.writeFileSync(outFullPath, webpBuffer);

    const dhash64 = await computeImageDHash64(webpBuffer);
    const sha256 = crypto.createHash('sha256').update(webpBuffer).digest('hex');

    results.push({
      id: skuKey,
      slug: sku.slug_es,
      sourceRelPath: spec.relPath,
      bytes: webpBuffer.length,
      sha256,
      dhash64,
      path: outFullPath
    });
  }

  // Purgar cualquier archivo .webp huérfano que no pertenezca a los 19 slugs canónicos (DEB-V34-01)
  const canonicalWebpSet = new Set(results.map((r) => `${r.slug}.webp`));
  for (const existingFile of fs.readdirSync(OUTPUT_DIR)) {
    if (existingFile.toLowerCase().endsWith('.webp') && !canonicalWebpSet.has(existingFile)) {
      fs.unlinkSync(path.join(OUTPUT_DIR, existingFile));
    }
  }

  const uniqueSha = new Set(results.map((r) => r.sha256)).size;
  const uniqueDhash = new Set(results.map((r) => r.dhash64)).size;
  const uniqueSources = new Set(results.map((r) => r.sourceRelPath)).size;
  console.log(
    `[build_product_images] Generadas ${results.length} imágenes WebP Cero-OEM en #F8FAFC (${uniqueSources}/19 fuentes 1:1, ${uniqueSha}/19 SHA-256 únicos, ${uniqueDhash}/19 dHash64 únicos)`
  );
  if (uniqueSources !== 19 || uniqueSha !== 19 || uniqueDhash !== 19) {
    throw new Error(
      `[E_IMAGE_COLLISION] Se requieren 19/19 fuentes, SHA-256 y dHash64 únicos (actual: sources=${uniqueSources}, sha=${uniqueSha}, dhash=${uniqueDhash})`
    );
  }
  for (const r of results) {
    if (r.bytes > 46080) {
      throw new Error(`Imagen ${r.slug} excede presupuesto de 45 KB: ${r.bytes} bytes`);
    }
  }
  return results;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  generateAllProductWebpImages().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
