import { useState, useEffect } from 'react'
import { CENTROS_COMUNAS, ESTACIONES_METRO } from './comunasData'
import './App.css'


const COMUNAS_COMPACTAS = [
    'Santiago', 
    'Providencia', 
    'San Miguel', 
    'Independencia', 
    'Estación Central', 
    'Recoleta',
    'Macul', 
    'San Joaquín',
    'Ñuñoa'
];

function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1*(Math.PI/180)) * Math.cos(lat2*(Math.PI/180)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
}

function App() {
  const [form, setForm] = useState({
    comuna: 'Santiago',
    superficie_util: 50,
    superficie_total: 55,
    dormitorios: 2,
    banos: 1,
    dist_metro_km: 0.5
  })

  const [resultado, setResultado] = useState(null)
  const [loading, setLoading] = useState(false)
  const [opcionesMetroFiltradas, setOpcionesMetroFiltradas] = useState([])
  const [mensajeDebug, setMensajeDebug] = useState("")

  const listaComunas = Object.keys(CENTROS_COMUNAS).sort();

  const opcionesBase = [
    { id: 1, label: 'A pasos (< 300m)', value: 0.2 },
    { id: 2, label: 'Caminable (300m - 800m)', value: 0.5 },
    { id: 3, label: 'Cerca (800m - 1.5km)', value: 1.2 },
    { id: 4, label: 'Micro de acercamiento (1.5 - 3km)', value: 2.0 },
    { id: 5, label: 'Solo auto / Lejos (> 3km)', value: 3.5 }
  ]

  useEffect(() => {
    const centro = CENTROS_COMUNAS[form.comuna];
    if (!centro) return;

    let minDist = 9999;
    ESTACIONES_METRO.forEach(est => {
        const d = calcularDistancia(centro[0], centro[1], est[0], est[1]);
        if (d < minDist) minDist = d;
    });

    let filtradas = [...opcionesBase];
    let debugMsg = `Distancia Centro-Metro: ${minDist.toFixed(2)} km. `;

    if (minDist > 5.0) {
        filtradas = filtradas.filter(op => op.value >= 3.0);
        debugMsg += "Zona Rural.";
    } 
    else if (minDist > 1.5) {
        filtradas = filtradas.filter(op => op.value >= 1.2); 
        debugMsg += "Periferia (Sin 'A pasos').";
    }

    const esCompacta = COMUNAS_COMPACTAS.includes(form.comuna);
    if (esCompacta) {
        filtradas = filtradas.filter(op => op.value < 3.0);
        if (minDist < 0.8) {
             filtradas = filtradas.filter(op => op.value < 1.8);
             debugMsg += "Zona Compacta.";
        }
    }

    setOpcionesMetroFiltradas(filtradas);
    setMensajeDebug(debugMsg);

    const actualValida = filtradas.find(op => op.value === Number(form.dist_metro_km));
    if (!actualValida) {
        setForm(prev => ({ ...prev, dist_metro_km: filtradas[0].value }));
    }

  }, [form.comuna]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResultado(null)
    try {
      const response = await fetch('http://127.0.0.1:8000/predecir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...form,
            superficie_util: Number(form.superficie_util),
            superficie_total: Number(form.superficie_total),
            dormitorios: Number(form.dormitorios),
            banos: Number(form.banos),
            dist_metro_km: Number(form.dist_metro_km)
        })
      })
      const data = await response.json()
      setResultado(data)
    } catch (error) {
      alert("Error de conexión.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
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
            <div className="form-group">
                <label>Dormitorios</label>
                <input type="number" name="dormitorios" value={form.dormitorios} onChange={handleChange} min="1"/>
            </div>
            <div className="form-group">
                <label>Baños</label>
                <input type="number" name="banos" value={form.banos} onChange={handleChange} min="1"/>
            </div>
          </div>

          <div className="row">
            <div className="form-group">
                <label>Util (m²)</label>
                <input type="number" name="superficie_util" value={form.superficie_util} onChange={handleChange}/>
            </div>
            <div className="form-group">
                <label>Total (m²)</label>
                <input type="number" name="superficie_total" value={form.superficie_total} onChange={handleChange}/>
            </div>
          </div>

          <div className="form-group">
            <label>Cercanía al Metro</label>
            <select name="dist_metro_km" value={form.dist_metro_km} onChange={handleChange}>
                {opcionesMetroFiltradas.map(op => (
                    <option key={op.id} value={op.value}>{op.label}</option>
                ))}
            </select>
            <div className="debug-box">
                <small>{mensajeDebug}</small>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-predict">
            {loading ? 'Calculando...' : 'Predecir Valor de Arriendo'}
          </button>
        </form>

        {resultado && (
          <div className="result-container">
            <div className="result-box">
                <span className="result-header-text">Estimación de Mercado</span>
                <span className="value-uf">{resultado.precio_uf} UF</span>
                <div className="divider"></div>
                <span className="value-clp">
                    ≈ {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(resultado.precio_clp)}
                </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App