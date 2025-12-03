from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd
import numpy as np

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    model = joblib.load('modelo_casas.joblib')
    imputer = joblib.load('imputer.joblib')
except:
    print("ADVERTENCIA: Ejecuta entrenar_modelo.py primero.")

FACTORES_MERCADO = {
    'Vitacura': 2.1,
    'Lo Barnechea': 2.0,
    'Las Condes': 1.85,
    'La Reina': 1.5,
    'Providencia': 1.55,
    'Ñuñoa': 1.35,
    'Colina': 1.4, 

    'Santiago': 1.0, 
    'San Miguel': 1.05,
    'Macul': 1.05,
    'La Florida': 0.95,
    'Peñalolén': 1.1,
    'Independencia': 0.9,
    'San Joaquín': 0.95,
    'Huechuraba': 1.15, 

    'Maipú': 0.85,
    'Estación Central': 0.85,
    'Pudahuel': 0.8,
    'Quilicura': 0.8,
    'Renca': 0.75,
    'Recoleta': 0.85,
    'San Bernardo': 0.75,
    'Puente Alto': 0.75,
    'Cerrillos': 0.8,
    'Conchalí': 0.75,
    'La Cisterna': 0.8,
    'Quinta Normal': 0.8,
    'Pedro Aguirre Cerda': 0.75,
    
    'La Pintana': 0.6,
    'Lo Espejo': 0.65,
    'Cerro Navia': 0.65,
    'El Bosque': 0.7,
    'La Granja': 0.7,
    'San Ramón': 0.65,
    
    'Otra': 0.9
}

COORDENADAS_COMUNAS = {
    'Santiago': (-33.4430, -70.6540), 'Vitacura': (-33.3900, -70.5700),
    'Las Condes': (-33.4150, -70.5400), 'Providencia': (-33.4310, -70.6050)
}

class PropiedadInput(BaseModel):
    comuna: str
    superficie_util: float
    superficie_total: float
    dormitorios: int
    banos: int
    dist_metro_km: float

@app.post("/predecir")
def predecir_precio(datos: PropiedadInput):
    data_dict = {
        "superficie_util": [datos.superficie_util],
        "superficie_total": [datos.superficie_total],
        "dormitorios": [datos.dormitorios],
        "banos": [datos.banos]
    }
    
    df_input = pd.DataFrame(data_dict)
    vector_imp = imputer.transform(df_input)
    pred_base_uf = model.predict(vector_imp)[0]

    factor_comuna = FACTORES_MERCADO.get(datos.comuna, 0.9)
    
    factor_metro = 1.0
    comunas_auto_dependientes = ['Vitacura', 'Lo Barnechea', 'Colina', 'Lampa', 'Pirque']
    
    if datos.comuna not in comunas_auto_dependientes:
        if datos.dist_metro_km <= 0.3: factor_metro = 1.12   
        elif datos.dist_metro_km <= 0.7: factor_metro = 1.07 
        elif datos.dist_metro_km <= 1.2: factor_metro = 1.02 
        elif datos.dist_metro_km <= 2.0: factor_metro = 0.98 
        else: factor_metro = 0.90                            

    precio_final = pred_base_uf * factor_comuna * factor_metro
    
    precio_final = round(precio_final, 1)
    
    return {
        "precio_uf": precio_final,
        "precio_clp": round(precio_final * 38000),
        "debug_info": {
            "base_modelo": round(pred_base_uf, 1),
            "factor_zona": factor_comuna,
            "factor_metro": factor_metro
        }
    }