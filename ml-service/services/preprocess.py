import numpy as np
from schemas.patient import PatientData


def build_feature_vector(data: PatientData) -> np.ndarray:
    """
    Будуємо фіксований вектор фіч з профілю та останніх вимірів.
    Тут поки що прості фічі – потім можна розширити.
    """

    age = data.profile.age or 0

    gender_raw = (data.profile.gender or "").lower()
    if gender_raw.startswith("m"):
        gender = 1
    elif gender_raw.startswith("f") or gender_raw.startswith("ж"):
        gender = 0
    else:
        gender = -1

    last_measurements = {}
    for m in data.measurements:
        last_measurements[m.measurement_type] = float(m.value)

    bp = last_measurements.get("blood_pressure", 0.0)
    glucose = last_measurements.get("glucose", 0.0)
    vitamin_d = last_measurements.get("vitamin_d", 0.0)
    heart_rate = last_measurements.get("heart_rate", 0.0)
    bmi = last_measurements.get("bmi", 0.0)

    allergies_count = len(data.profile.allergies)
    chronic_count = len(data.profile.chronic_conditions)

    feature_vector = np.array(
        [
            age,
            gender,
            bp,
            glucose,
            vitamin_d,
            heart_rate,
            bmi,
            allergies_count,
            chronic_count,
        ],
        dtype=float,
    )

    return feature_vector
