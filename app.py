from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import xgboost as xgb
import requests
import pandas as pd
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
import os

# Inicializa Flask con carpetas de templates y estáticos
app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

# Ruta principal para servir index.html
@app.route("/")
def home():
    return render_template("index.html")

# Cargar modelo XGBoost
model = xgb.Booster()
model.load_model("modelo_incendios_gxboost.json")

# Función para obtener clima desde Open-Meteo
def obtener_datos_climaticos_openmeteo(lat, lon, fecha_objetivo):
    url = (
        f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
        f"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,relative_humidity_2m_mean"
        f"&timezone=America/Lima&forecast_days=16"
    )
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        if "daily" not in data:
            print("❌ Clave 'daily' no encontrada en respuesta.")
            return None

        fechas = data["daily"]["time"]
        if fecha_objetivo not in fechas:
            print(f"❌ Fecha {fecha_objetivo} no disponible.")
            return None

        idx = fechas.index(fecha_objetivo)
        tmax = data["daily"]["temperature_2m_max"][idx]
        tmin = data["daily"]["temperature_2m_min"][idx]
        temp = round((tmax + tmin) / 2, 2)
        prec = data["daily"]["precipitation_sum"][idx]
        wind = data["daily"]["windspeed_10m_max"][idx] / 3.6  # km/h a m/s
        hum = data["daily"]["relative_humidity_2m_mean"][idx] 
        
        fecha = fechas[idx]

        return [lat, lon, temp, hum, prec, wind, {
            "temperature": temp,
            "humidity": hum,
            "precipitation": prec,
            "windspeed": wind,
            "fecha": fecha
        }]
    except Exception as e:
        print(f"⚠️ Error en Open-Meteo para ({lat}, {lon}): {e}")
        return None

# Ruta para predicción
@app.route("/predecir", methods=["POST"])
def predecir():
    puntos = request.json.get("puntos", [])
    fecha_str = request.json.get("fecha")

    if not fecha_str:
        fecha_str = datetime.today().strftime('%Y-%m-%d')

    try:
        fecha_objetivo = datetime.strptime(fecha_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Fecha inválida. Formato: YYYY-MM-DD"}), 400

    hoy = datetime.today().date()
    if not (0 <= (fecha_objetivo - hoy).days <= 15):
        return jsonify({"error": "La fecha debe estar dentro de los próximos 16 días."}), 400

    def procesar_punto(punto):
        lat = punto['lat']
        lon = punto['lon']
        clima = obtener_datos_climaticos_openmeteo(lat, lon, fecha_str)

        if clima:
            temp, hum, prec, wind = clima[2], clima[3], clima[4], clima[5]

            # Variables temporales
            mes = fecha_objetivo.month
            dia_semana = fecha_objetivo.weekday()
            es_fin_semana = 1 if dia_semana >= 5 else 0
            es_verano = 1 if mes in [12, 1, 2] else 0

            if None in [temp, hum, prec, wind]:
                print(f"⚠️ Datos incompletos para ({lat}, {lon}): temp={temp}, hum={hum}, prec={prec}, wind={wind}")
                return None

            features = pd.DataFrame([{
                'latitude': lat,
                'longitude': lon,
                'temperature': temp,
                'humidity': hum,
                'precipitation': prec,
                'windspeed': wind,
                'month': mes,
                'day_of_week': dia_semana,
                'is_weekend': es_fin_semana,
                'season_verano': es_verano
            }])

            try:
                dmatrix = xgb.DMatrix(features)
                prob = round(float(model.predict(dmatrix)[0]) * 100, 2)
                detalles = clima[6]

                return {
                    "lat": lat,
                    "lon": lon,
                    "pred": int(prob >= 50),
                    "prob": prob,
                    "info": detalles,
                    "mes": mes,
                    "dia_semana": dia_semana,
                    "es_fin_semana": es_fin_semana,
                    "es_verano": es_verano
                }
            except Exception as e:
                print(f"⚠️ Error al predecir para ({lat}, {lon}): {e}")
                return None

        else:
            return None

    if not puntos:
        return jsonify({"error": "No se proporcionaron puntos para procesar."}), 400

    with ThreadPoolExecutor(max_workers=10) as executor:
        resultados = list(executor.map(procesar_punto, puntos))

    resultados = [r for r in resultados if r is not None]
    
    if not resultados:
        return jsonify({"error": "No se pudieron procesar ninguno de los puntos proporcionados."}), 500
    
    return jsonify(resultados)

# Iniciar servidor (compatible con Render)
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
