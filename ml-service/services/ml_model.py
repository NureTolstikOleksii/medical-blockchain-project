import os
import joblib
import numpy as np
from typing import Optional


_model = None


def load_model(path: str = "models/recommender.pkl"):
    global _model
    if _model is not None:
        return _model

    if os.path.getsize(path) == 0:
        print("[ML] Empty model file, skipping load.")
        _model = None
        return None

    if os.path.exists(path):
        _model = joblib.load(path)
        print(f"[ML] Model loaded from {path}")
    else:
        print(f"[ML] Model file not found at {path}, working without ML.")
        _model = None
    return _model


def predict_health_state(features: np.ndarray) -> Optional[dict]:
    """
    Повертає словник з класом/станом або None, якщо модель відсутня.
    Наприклад:
      { "state_class": 2, "state_label": "high_risk", "probabilities": [...] }
    """

    model = load_model()
    if model is None:
        return None

    X = features.reshape(1, -1)
    y_pred = model.predict(X)[0]

    proba = None
    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(X)[0].tolist()

    state_label = str(y_pred)
    label_map = {
        0: "normal",
        1: "attention_needed",
        2: "high_risk",
    }
    if y_pred in label_map:
        state_label = label_map[y_pred]

    return {
        "state_class": int(y_pred),
        "state_label": state_label,
        "probabilities": proba,
    }
