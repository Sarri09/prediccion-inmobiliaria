import pandas as pd
import numpy as np
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestRegressor
import joblib
import re
import os

if not os.path.exists('propiedades_portal_inmobiliario.csv'):
    print("ERROR: Faltan los archivos CSV.")
    exit()

print("Cargando datos...")
df_basico = pd.read_csv('propiedades_portal_inmobiliario.csv', encoding='utf-8-sig')
df_detalle = pd.read_csv('propiedades_detalle_caracteristicas.csv', encoding='utf-8-sig')
df = pd.merge(df_basico, df_detalle, on='link', how='left')

def to_m2_float(x):
    if pd.isna(x): return np.nan
    s = str(x).lower().replace("m²", "").replace("m2", "").replace(",", ".")
    nums = re.findall(r"\d*\.?\d+", s)
    if not nums: return np.nan
    return float(np.mean([float(n) for n in nums if n != ""]))

df_pesos = df[df['moneda'].astype(str).str.strip() == "$"].copy()

for col in ["superficie_util", "superficie_total"]:
    df_pesos[col] = df_pesos[col].apply(to_m2_float)
for col in ["dormitorios", "banos", "precio"]:
    df_pesos[col] = pd.to_numeric(df_pesos[col], errors="coerce")

df_pesos = df_pesos[df_pesos['precio'] > 150000]
df_pesos = df_pesos[df_pesos['superficie_total'] > 15]
df_pesos = df_pesos.dropna(subset=['precio', 'superficie_total'])

VALOR_UF_TRAIN = 38000
df_pesos['precio_uf'] = df_pesos['precio'] / VALOR_UF_TRAIN

if len(df_pesos) > 0:
    ratio = (df_pesos["superficie_total"] / df_pesos["superficie_util"]).median()
    df_pesos["superficie_util"] = df_pesos["superficie_util"].fillna(df_pesos["superficie_total"] / ratio)
    df_pesos["superficie_total"] = df_pesos["superficie_total"].fillna(df_pesos["superficie_util"] * ratio)

df_pesos['factor_barrio'] = 1.0 

features = ["superficie_util", "superficie_total", "dormitorios", "banos"]
target = "precio_uf"

df_train = df_pesos.dropna(subset=features + [target])

X = df_train[features]
y = df_train[target]

print(f"Entrenando con {len(df_train)} propiedades...")

imputer = SimpleImputer(strategy="median")
X_imp = imputer.fit_transform(X)

rf = RandomForestRegressor(n_estimators=500, max_depth=20, random_state=42, n_jobs=-1)
rf.fit(X_imp, y)

joblib.dump(rf, 'modelo_casas.joblib')
joblib.dump(imputer, 'imputer.joblib')
print("Modelo guardado. La magia real ocurrirá en main.py")