from schemas.patient import PatientData
from services.preprocess import build_feature_vector
from services.ml_model import predict_health_state
from services.rules import rule_based_recommendations
from services.llm import generate_text_recommendation


async def build_hybrid_recommendation(data: PatientData, mode: str):
    features = build_feature_vector(data)
    state_info = predict_health_state(features)
    base_recs = rule_based_recommendations(data)

    # PATIENT MODE
    if mode == "patient":
        # індикатор для пацієнта
        indicator = "green"
        if state_info:
            s = state_info.get("state_class")
            if s == 1:
                indicator = "yellow"
            elif s == 2:
                indicator = "red"

        # AI-текст ДЛЯ ПАЦІЄНТА
        text_rec = await generate_text_recommendation(
            state_info,
            base_recs,
            locale="patient"
        )

        return {
            "ai_text": text_rec,
            "indicator": indicator,
        }

    #  DOCTOR MODE
    if mode == "doctor":
        # AI-текст ДЛЯ ЛІКАРЯ
        text_rec = await generate_text_recommendation(
            state_info,
            base_recs,
            locale="doctor"
        )

        return {
            "state": state_info,
            "structured_recommendations": base_recs,
            "ai_text": text_rec,
            "feature_vector": features.tolist(),
            "risk_score": state_info["probabilities"][2] if state_info and state_info.get("probabilities") else None
        }

    # DEFAULT MODE
    text_rec = await generate_text_recommendation(state_info, base_recs, locale="patient")
    return {
        "ai_text": text_rec,
        "indicator": "green"
    }
