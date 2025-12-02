import os
import httpx
from typing import List, Dict, Optional


LLM_API_URL = os.getenv("LLM_API_URL", "")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")


async def generate_text_recommendation(
    state_info: Optional[dict],
    recs: List[Dict],
    locale: str = "uk"
) -> str:
    """
    Hybrid AI генерація:
    - якщо LLM API не підключений -> fallback текст
    - якщо працює -> красивий AI текст
    """

    # Якщо ключ або URL не вказані — fallback
    if not LLM_API_URL or not LLM_API_KEY:
        print("LLM_API_URL =", LLM_API_URL)
        print("LLM_API_KEY =", "SET" if LLM_API_KEY else "EMPTY")
        return _fallback_text(state_info, recs, locale)

    if locale == "doctor":
        prompt = build_doctor_prompt(state_info, recs)
    else:
        prompt = build_patient_prompt(state_info, recs)

    body = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "system", "content": "Ти медичний асистент. Не став діагнозів."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 300,
        "top_p": 1.0,
        "stream": False
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                LLM_API_URL,
                headers={"Authorization": f"Bearer {LLM_API_KEY}"},
                json=body
            )

        response.raise_for_status()
        data = response.json()
        print("=== USING AI ===")
        print(data)
        return data["choices"][0]["message"]["content"]

    except Exception as e:
        print("[LLM ERROR]", e)
        print("[LLM ERROR]", e)
        print("FULL RESPONSE:", getattr(e, "response", None).text if hasattr(e, "response") else "")
        return _fallback_text(state_info, recs, locale)


def build_patient_prompt(state_info, recs):
    """
    Prompt для ПАЦІЄНТА:
    - м’які рекомендації
    - без термінів
    - без діагнозів
    - без ризикових чисел
    """
    rec_lines = "\n".join([f"- {r['name']}" for r in recs])

    return (
        "Сформуй короткі, дружні та спокійні рекомендації для пацієнта відповідно до його медичних даних. "
        "Уникай медичних термінів, діагнозів, цифр ризику чи складних пояснень. "
        "Не лякай пацієнта. Наголошуй на простих діях та підтримці. "
        "Не згадуй ймовірності чи класи стану.\n\n"
        f"Рекомендації:\n{rec_lines}\n\n"
        "Сформуй короткий і зрозумілий текст, з чітко виділеними рекомендаціями."
        "Якщо мова про вітаміни поясенюй де вони містяться."
        "Починай повідомлення з \"Вітаю, я допоможу тобі покращити твій стан здоров'я! Відповідно я б рекомендував тобі:... \"."
    )


def build_doctor_prompt(state_info, recs):
    """
    Prompt для ЛІКАРЯ:
    - професійний тон
    - структурований текст
    - можна згадувати ризики і фактори
    - можна використовувати терміни
    - зрозуміла логіка
    """

    state_label = state_info.get("state_label")
    probs = state_info.get("probabilities")

    rec_lines = "\n".join(
        [f"- {r['name']} (reason: {r['reason']})" for r in recs]
    )

    return (
        "Сформуй професійний, структурований медичний висновок для лікаря на основі даних пацієнта. "
        "Використовуй терміни, але не став діагнозів. "
        "Додай короткий клінічний огляд, ключові показники, та запропоновані дії. "
        "Подавай інформацію чітко та без емоцій."
        "Для аналізу використовуй інформацію нижче:\n\n"
        f"ML-стан пацієнта: {state_label}\n"
        f"Ймовірності класів: {probs}\n\n"
        f"Rule-based рекомендації:\n{rec_lines}\n\вn"
        "Обмеж повідомлення до 1000 символів."
        "Почни повідомлення з \"Для цього пацієнта характерним є:\"."
    )

def _fallback_text(state_info: Optional[dict], recs: List[Dict], locale: str) -> str:
    """
    Резервний текст, якщо AI не працює або немає ключів.
    """

    if not recs:
        return (
            "На основі наданих даних критичних відхилень не виявлено. "
            "За потреби зверніться до вашого лікаря."
        )

    lines = ["Попередні рекомендації на основі поточних показників:"]
    for r in recs:
        lines.append(f"- {r['name']}: {r['reason']}")

    lines.append(
        "Ці поради не є медичним діагнозом. "
        "Обов’язково проконсультуйтесь з лікарем."
    )

    return "\n".join(lines)
