import React, { useState, useEffect } from 'react';

// --- ESTILOS CSS (DISEÑO PREMIUM INTEGRADO) ---
const styles = `
:root {
  --primary: #2563eb; --primary-dark: #1e40af; --bg-page: #f8fafc;
  --bg-card: #ffffff; --text-dark: #1e293b; --success-gradient: linear-gradient(135deg, #059669 0%, #047857 100%);
}
* { box-sizing: border-box; }
body { margin: 0; font-family: 'Inter', system-ui, sans-serif; background: var(--bg-page); color: var(--text-dark); display: flex; justify-content: center; min-height: 100vh; padding: 40px 20px; }
.card { background: var(--bg-card); width: 100%; max-width: 500px; padding: 2.5rem; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1); }
h1 { text-align: center; margin: 0 0 0.5rem 0; font-size: 1.8rem; font-weight: 800; letter-spacing: -0.5px; }
.subtitle { text-align: center; color: #64748b; margin-bottom: 2rem; font-size: 0.95rem; }
.form-group { margin-bottom: 1.25rem; }
label { display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.9rem; color: #334155; }
input, select { width: 100%; padding: 0.75rem 1rem; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1rem; transition: all 0.2s; background: #fff; color: #0f172a; }
input:focus, select:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }
.row { display: flex; gap: 15px; } .row .form-group { flex: 1; }
.btn-predict { width: 100%; margin-top: 1rem; padding: 1rem; background: var(--primary); color: white; border: none; border-radius: 14px; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
.btn-predict:hover { background: var(--primary-dark); transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3); }
.btn-predict:disabled { background: #cbd5e1; cursor: not-allowed; transform: none; box-shadow: none; }
.result-container { margin-top: 2rem; animation: popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
.result-box { background: var(--success-gradient); border-radius: 20px; padding: 2rem; text-align: center; color: white; position: relative; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(5, 150, 105, 0.4); }
.value-uf { font-size: 3.5rem; font-weight: 800; line-height: 1; display: block; letter-spacing: -1px; text-shadow: 0 4px 6px rgba(0,0,0,0.2); }
.divider { height: 2px; background: rgba(255,255,255,0.2); width: 40%; margin: 1rem auto; border-radius: 2px; }
.value-clp { font-size: 1.4rem; font-weight: 500; opacity: 0.9; }
.debug-txt { font-size: 0.75rem; color: #94a3b8; margin-top: 5px; display: block; }
@keyframes popIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
`;

// --- DATOS GEOMÉTRICOS (BOUNDING BOXES) ---
// Definimos los límites aproximados (Norte, Sur, Este, Oeste) para permitir el cálculo desde cualquier punto.
const DATA_COMUNAS = {
    'Providencia': { center: [-33.4310, -70.6050], bounds: { minLat: -33.447, maxLat: -33.415, minLon: -70.635, maxLon: -70.590 } },
    'Las Condes': { center: [-33.4150, -70.5400], bounds: { minLat: -33.445, maxLat: -33.370, minLon: -70.585, maxLon: -70.480 } },
    'Vitacura': { center: [-33.3900, -70.5000], bounds: { minLat: -33.395, maxLat: -33.340, minLon: -70.600, maxLon: -70.540 } },
    'Ñuñoa': { center: [-33.4560, -70.5970], bounds: { minLat: -33.475, maxLat: -33.435, minLon: -70.615, maxLon: -70.570 } },
    'La Reina': { center: [-33.4450, -70.5300], bounds: { minLat: -33.470, maxLat: -33.430, minLon: -70.570, maxLon: -70.510 } },
    'Lo Barnechea': { center: [-33.3500, -70.5000], bounds: { minLat: -33.360, maxLat: -33.290, minLon: -70.540, maxLon: -70.450 } },
    'Peñalolén': { center: [-33.4850, -70.5400], bounds: { minLat: -33.510, maxLat: -33.460, minLon: -70.580, maxLon: -70.500 } },
    'Macul': { center: [-33.4910, -70.6000], bounds: { minLat: -33.510, maxLat: -33.470, minLon: -70.620, maxLon: -70.580 } },
    'La Florida': { center: [-33.5300, -70.5800], bounds: { minLat: -33.560, maxLat: -33.500, minLon: -70.610, maxLon: -70.530 } },
    'Santiago': { center: [-33.4430, -70.6540], bounds: { minLat: -33.475, maxLat: -33.430, minLon: -70.675, maxLon: -70.630 } },
    'Independencia': { center: [-33.4167, -70.6667], bounds: { minLat: -33.435, maxLat: -33.400, minLon: -70.680, maxLon: -70.650 } },
    'Recoleta': { center: [-33.4167, -70.6333], bounds: { minLat: -33.435, maxLat: -33.380, minLon: -70.660, maxLon: -70.610 } },
    'Conchalí': { center: [-33.3850, -70.6700], bounds: { minLat: -33.405, maxLat: -33.360, minLon: -70.690, maxLon: -70.650 } },
    'Huechuraba': { center: [-33.3738, -70.6400], bounds: { minLat: -33.390, maxLat: -33.350, minLon: -70.680, maxLon: -70.610 } },
    'Quinta Normal': { center: [-33.4333, -70.7000], bounds: { minLat: -33.450, maxLat: -33.410, minLon: -70.720, maxLon: -70.670 } },
    'Estación Central': { center: [-33.4667, -70.6833], bounds: { minLat: -33.480, maxLat: -33.445, minLon: -70.720, maxLon: -70.670 } },
    'Cerrillos': { center: [-33.5000, -70.7100], bounds: { minLat: -33.525, maxLat: -33.480, minLon: -70.740, maxLon: -70.690 } },
    'Maipú': { center: [-33.5108, -70.7578], bounds: { minLat: -33.550, maxLat: -33.460, minLon: -70.800, maxLon: -70.730 } },
    'Pudahuel': { center: [-33.4400, -70.7500], bounds: { minLat: -33.480, maxLat: -33.410, minLon: -70.820, maxLon: -70.720 } },
    'Lo Prado': { center: [-33.4500, -70.7300], bounds: { minLat: -33.465, maxLat: -33.435, minLon: -70.750, maxLon: -70.710 } },
    'Renca': { center: [-33.4050, -70.7200], bounds: { minLat: -33.430, maxLat: -33.380, minLon: -70.750, maxLon: -70.680 } },
    'Quilicura': { center: [-33.3600, -70.7300], bounds: { minLat: -33.390, maxLat: -33.330, minLon: -70.770, maxLon: -70.690 } },
    'Cerro Navia': { center: [-33.4200, -70.7400], bounds: { minLat: -33.440, maxLat: -33.400, minLon: -70.760, maxLon: -70.710 } },
    'San Miguel': { center: [-33.4969, -70.6533], bounds: { minLat: -33.515, maxLat: -33.480, minLon: -70.665, maxLon: -70.640 } },
    'La Cisterna': { center: [-33.5333, -70.6667], bounds: { minLat: -33.555, maxLat: -33.510, minLon: -70.680, maxLon: -70.650 } },
    'San Joaquín': { center: [-33.4900, -70.6200], bounds: { minLat: -33.510, maxLat: -33.470, minLon: -70.650, maxLon: -70.610 } },
    'Pedro Aguirre Cerda': { center: [-33.4850, -70.6800], bounds: { minLat: -33.500, maxLat: -33.470, minLon: -70.700, maxLon: -70.660 } },
    'Lo Espejo': { center: [-33.5200, -70.6800], bounds: { minLat: -33.545, maxLat: -33.505, minLon: -70.700, maxLon: -70.660 } },
    'San Ramón': { center: [-33.5400, -70.6450], bounds: { minLat: -33.560, maxLat: -33.520, minLon: -70.660, maxLon: -70.630 } },
    'La Granja': { center: [-33.5350, -70.6200], bounds: { minLat: -33.555, maxLat: -33.515, minLon: -70.640, maxLon: -70.610 } },
    'El Bosque': { center: [-33.5600, -70.6700], bounds: { minLat: -33.590, maxLat: -33.540, minLon: -70.690, maxLon: -70.650 } },
    'La Pintana': { center: [-33.5800, -70.6300], bounds: { minLat: -33.620, maxLat: -33.550, minLon: -70.660, maxLon: -70.600 } },
    'San Bernardo': { center: [-33.5900, -70.7000], bounds: { minLat: -33.680, maxLat: -33.600, minLon: -70.750, maxLon: -70.650 } },
    'Puente Alto': { center: [-33.6167, -70.5833], bounds: { minLat: -33.650, maxLat: -33.560, minLon: -70.620, maxLon: -70.540 } }
};

const ESTACIONES_METRO = [
    [-33.4450, -70.7167], [-33.4447, -70.7000], [-33.4397, -70.6833], [-33.4386, -70.6753],
    [-33.4375, -70.6667], [-33.4408, -70.6569], [-33.4456, -70.6506], [-33.4492, -70.6483],
    [-33.4528, -70.6461], [-33.4456, -70.6419], [-33.4428, -70.6333], [-33.4372, -70.6300],
    [-33.4375, -70.6250], [-33.4389, -70.6197], [-33.4400, -70.6144], [-33.4489, -70.6093],
    [-33.4550, -70.6028], [-33.4372, -70.6106], [-33.4336, -70.6044], [-33.4306, -70.5986],
    [-33.4167, -70.5917], [-33.4122, -70.5861], [-33.4083, -70.5806], [-33.4166, -70.6000],
    [-33.4042, -70.5694], [-33.3997, -70.5625], [-33.3928, -70.5547], [-33.3683, -70.6553],
    [-33.3867, -70.6553], [-33.3972, -70.6553], [-33.4072, -70.6553], [-33.4133, -70.6553],
    [-33.4200, -70.6497], [-33.4267, -70.6419], [-33.4361, -70.6408], [-33.4400, -70.6378],
    [-33.4428, -70.6333], [-33.4478, -70.6336], [-33.4547, -70.6336], [-33.4628, -70.6336],
    [-33.4689, -70.6369], [-33.4803, -70.6403], [-33.4903, -70.6458], [-33.4969, -70.6533],
    [-33.5050, -70.6594], [-33.5131, -70.6658], [-33.5214, -70.6722], [-33.5292, -70.6781],
    [-33.5331, -70.6678], [-33.5447, -70.6594], [-33.5531, -70.6508], [-33.5617, -70.6422],
    [-33.5728, -70.6286], [-33.3611, -70.7306], [-33.3694, -70.7194], [-33.3808, -70.7056],
    [-33.3889, -70.6958], [-33.3992, -70.6847], [-33.4083, -70.6742], [-33.4161, -70.6658],
    [-33.4236, -70.6583], [-33.4300, -70.6517], [-33.4361, -70.6408], [-33.4392, -70.6375],
    [-33.4425, -70.6342], [-33.4522, -70.6244], [-33.4600, -70.6167], [-33.4694, -70.6069],
    [-33.4753, -70.6008], [-33.4569, -70.5978], [-33.4828, -70.5931], [-33.4892, -70.5869],
    [-33.4500, -70.5333], [-33.5006, -70.5747], [-33.4167, -70.5917], [-33.4236, -70.5842],
    [-33.4308, -70.5764], [-33.4500, -70.5333], [-33.4500, -70.5450], [-33.4581, -70.5569],
    [-33.4653, -70.5647], [-33.4969, -70.5167], [-33.4789, -70.5831], [-33.4869, -70.5911],
    [-33.4914, -70.5978], [-33.4989, -70.6050], [-33.5050, -70.6119], [-33.5111, -70.6186],
    [-33.5175, -70.6253], [-33.5242, -70.5989], [-33.5317, -70.6050], [-33.5389, -70.6111],
    [-33.5461, -70.6172], [-33.5539, -70.6236], [-33.5614, -70.6300], [-33.5686, -70.6361],
    [-33.5989, -70.5758], [-33.6075, -70.5775], [-33.6167, -70.5833], [-33.5111, -70.6186],
    [-33.5197, -70.6258], [-33.5269, -70.6328], [-33.5333, -70.6394], [-33.5394, -70.6458],
    [-33.5331, -70.6678], [-33.5108, -70.7578], [-33.5067, -70.7492], [-33.5025, -70.7408],
    [-33.4981, -70.7322], [-33.4933, -70.7233], [-33.4881, -70.7142], [-33.4403, -70.7500],
    [-33.4483, -70.7389], [-33.4572, -70.7275], [-33.4669, -70.7158], [-33.4756, -70.7044],
    [-33.4844, -70.6931], [-33.4400, -70.6378], [-33.4392, -70.6375], [-33.4375, -70.6300],
    [-33.4489, -70.6093], [-33.4550, -70.6028], [-33.4639, -70.5939], [-33.4722, -70.5850],
    [-33.4803, -70.5764], [-33.4881, -70.5678], [-33.4958, -70.5594], [-33.5042, -70.5503],
    [-33.5111, -70.6186], [-33.5194, -70.6203], [-33.5275, -70.6219], [-33.5242, -70.5989],
    [-33.5331, -70.5903], [-33.5419, -70.5817], [-33.5506, -70.5731], [-33.4972, -70.7167],
    [-33.4889, -70.7053], [-33.4806, -70.6939], [-33.4689, -70.6369], [-33.4622, -70.6297],
    [-33.4881, -70.5678], [-33.4728, -70.5772], [-33.4569, -70.5978], [-33.4450, -70.6083],
    [-33.4306, -70.5986], [-33.5222, -70.7208], [-33.5158, -70.7153], [-33.5022, -70.7094]
];

const COMUNAS_COMPACTAS = [
    'Santiago', 'Providencia', 'San Miguel', 'Independencia', 
    'Estación Central', 'Recoleta', 'Macul', 'San Joaquín', 'Ñuñoa'
];

// --- FÓRMULAS GEOMÉTRICAS ---

// Haversine: Distancia entre dos puntos
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1*(Math.PI/180)) * Math.cos(lat2*(Math.PI/180)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
}

// Distancia de un punto (metro) a un "Caja" (Comuna)
// Si el metro está DENTRO de la caja, retorna 0.
// Si está FUERA, retorna la distancia al borde más cercano.
function calcularDistanciaABoundingBox(estLat, estLon, bounds) {
    // 1. Clampear la latitud/longitud del metro a los límites de la caja
    const clampedLat = Math.max(bounds.minLat, Math.min(estLat, bounds.maxLat));
    const clampedLon = Math.max(bounds.minLon, Math.min(estLon, bounds.maxLon));

    // 2. Si el punto "clampeado" es igual al punto original, el metro está dentro.
    // Si no, calculamos la distancia entre el metro y ese punto del borde.
    return calcularDistancia(estLat, estLon, clampedLat, clampedLon);
}

export default function App() {
  const [form, setForm] = useState({
    comuna: 'Santiago', superficie_util: 50, superficie_total: 55,
    dormitorios: 2, banos: 1, dist_metro_km: 0.5
  })
  const [resultado, setResultado] = useState(null)
  const [loading, setLoading] = useState(false)
  const [opcionesMetroFiltradas, setOpcionesMetroFiltradas] = useState([])
  const [mensajeDebug, setMensajeDebug] = useState("")

  const listaComunas = Object.keys(DATA_COMUNAS).sort();
  const opcionesBase = [
    { id: 1, label: 'A pasos (< 300m)', value: 0.2 },
    { id: 2, label: 'Caminable (300m - 800m)', value: 0.5 },
    { id: 3, label: 'Cerca (800m - 1.5km)', value: 1.2 },
    { id: 4, label: 'Micro de acercamiento (1.5 - 3km)', value: 2.0 },
    { id: 5, label: 'Solo auto / Lejos (> 3km)', value: 3.5 }
  ]

  useEffect(() => {
    const datosComuna = DATA_COMUNAS[form.comuna];
    if (!datosComuna) return;

    let minDist = 9999;

    // Recorremos TODAS las estaciones de metro.
    // Calculamos la distancia de cada estación al BORDE más cercano de la comuna seleccionada.
    // Si una estación está DENTRO de los límites de la comuna, la distancia será 0.
    ESTACIONES_METRO.forEach(est => {
        const estLat = est[0];
        const estLon = est[1];
        
        // Nueva lógica: Distancia a la CAJA (Box) en vez del CENTRO
        const d = calcularDistanciaABoundingBox(estLat, estLon, datosComuna.bounds);
        if (d < minDist) minDist = d;
    });

    let filtradas = [...opcionesBase];
    let debugMsg = `Distancia Metro más cercano a Comuna: ${minDist.toFixed(2)} km. `;

    // Lógica Inversa: 
    // Si minDist es 0 (o muy bajo), significa que HAY un metro dentro o en el borde.
    // Entonces mostramos TODAS las opciones de cercanía.
    
    // Solo ocultamos opciones "Cerca" si REALMENTE el metro está lejos de TODO el polígono de la comuna.
    if (minDist > 3.0) {
        // Caso La Pintana (El borde más cercano está a >3km del metro más cercano)
        filtradas = filtradas.filter(op => op.value >= 3.0);
        debugMsg += "Zona Aislada (Lejos).";
    } else if (minDist > 1.0) {
        // Caso Borde (El metro no toca la comuna, está a 1km del borde más cercano)
        filtradas = filtradas.filter(op => op.value >= 1.2); 
        debugMsg += "Zona Periférica (Sin 'A pasos').";
    }
    // Si minDist < 0.1, significa que el metro está DENTRO o PEGADO. Mostramos todo.

    // FILTRO TECHO (Compactas) - Mantenemos esta lógica porque es correcta para Santiago Centro
    if (COMUNAS_COMPACTAS.includes(form.comuna)) {
        filtradas = filtradas.filter(op => op.value < 3.0);
        // En comunas compactas, asumimos que todo está relativamente cerca si el metro está dentro
        if (minDist < 0.1) {
             filtradas = filtradas.filter(op => op.value < 1.8);
             debugMsg += "Compacta.";
        }
    }

    setOpcionesMetroFiltradas(filtradas);
    //setMensajeDebug(debugMsg);

    if (!filtradas.find(op => op.value === Number(form.dist_metro_km))) {
        setForm(prev => ({ ...prev, dist_metro_km: filtradas[0].value }));
    }
  }, [form.comuna]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setResultado(null);
    try {
      const response = await fetch('http://127.0.0.1:8000/predecir', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, superficie_util: Number(form.superficie_util), superficie_total: Number(form.superficie_total), dormitorios: Number(form.dormitorios), banos: Number(form.banos), dist_metro_km: Number(form.dist_metro_km) })
      })
      const data = await response.json(); setResultado(data);
    } catch (error) { alert("Error de conexión con Backend Python."); } 
    finally { setLoading(false); }
  }

  return (
    <div className="app-container">
      <style>{styles}</style>
      <div className="card">
        <h1>Tasador Inmobiliario</h1>
        <p className="subtitle"></p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Comuna</label>
            <select name="comuna" value={form.comuna} onChange={handleChange}>
              {listaComunas.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="row">
            <div className="form-group"><label>Dormitorios</label><input type="number" name="dormitorios" value={form.dormitorios} onChange={handleChange} min="1"/></div>
            <div className="form-group"><label>Baños</label><input type="number" name="banos" value={form.banos} onChange={handleChange} min="1"/></div>
          </div>
          <div className="row">
            <div className="form-group"><label>Util (m²)</label><input type="number" name="superficie_util" value={form.superficie_util} onChange={handleChange}/></div>
            <div className="form-group"><label>Total (m²)</label><input type="number" name="superficie_total" value={form.superficie_total} onChange={handleChange}/></div>
          </div>
          <div className="form-group">
            <label>Cercanía al Metro</label>
            <select name="dist_metro_km" value={form.dist_metro_km} onChange={handleChange}>
                {opcionesMetroFiltradas.map(op => <option key={op.id} value={op.value}>{op.label}</option>)}
            </select>
            <span className="debug-txt">{mensajeDebug}</span>
          </div>
          <button type="submit" disabled={loading} className="btn-predict">{loading ? 'Calculando...' : 'Predecir Valor de Arriendo'}</button>
        </form>
        {resultado && (
          <div className="result-container">
            <div className="result-box">
                <span style={{opacity:0.9, textTransform:'uppercase', fontSize:'0.85rem', letterSpacing:'1px', fontWeight:600}}>Valor de Mercado</span>
                <span className="value-uf">{resultado.precio_uf} UF</span>
                <div className="divider"></div>
                <span className="value-clp">≈ {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(resultado.precio_clp)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}