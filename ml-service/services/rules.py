from schemas.patient import PatientData


def rule_based_recommendations(data: PatientData):
    recs = []

    measurements = {m.measurement_type: float(m.value) for m in data.measurements}

    bp = measurements.get("blood_pressure")
    if bp is not None and bp > 140:
        recs.append({
            "name": "Контроль артеріального тиску",
            "reason": f"Значення тиску {bp} > 140",
            "priority": 0.9,
        })

    glucose = measurements.get("glucose")
    if glucose is not None and glucose > 6.2:
        recs.append({
            "name": "Зниження споживання вуглеводів",
            "reason": f"Підвищений рівень глюкози {glucose}",
            "priority": 0.85,
        })

    vitamin_d = measurements.get("vitamin_d")
    if vitamin_d is not None and vitamin_d < 30:
        recs.append({
            "name": "Додаткова підтримка вітаміном D",
            "reason": f"Низький рівень вітаміну D: {vitamin_d}",
            "priority": 0.8,
        })

    for allergy in data.profile.allergies:
        recs.append({
            "name": f"Уникати препаратів з {allergy}",
            "reason": "Зазначена алергія в профілі пацієнта",
            "priority": 1.0,
        })

    for condition in data.profile.chronic_conditions:
        recs.append({
            "name": f"Регулярний контроль стану при '{condition}'",
            "reason": "Хронічне захворювання в історії пацієнта",
            "priority": 0.7,
        })

    return recs
