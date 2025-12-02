import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split


"""
Навчаємо ML-модель для оцінки стану пацієнта.
Фічі у моделі:
0 - age
1 - gender (1=male, 0=female)
2 - bp
3 - glucose
4 - vitamin_d
5 - heart_rate
6 - bmi
7 - allergies_count
8 - chronic_count

Класи:
0 = normal
1 = attention_needed
2 = high_risk
"""


# -------- DATSET --------
X = np.array([
    # age, gender, bp,   gluc, vitD, hr,  bmi, al, ch

    # NORMAL (0)
    [25, 1, 120, 4.9, 35, 72, 22, 0, 0],
    [30, 0, 118, 5.1, 40, 70, 21, 0, 0],
    [40, 1, 126, 5.3, 33, 75, 25, 1, 0],
    [35, 0, 122, 4.7, 38, 69, 24, 0, 1],

    # ATTENTION NEEDED (1)
    [45, 1, 138, 5.9, 28, 78, 27, 0, 1],
    [50, 0, 135, 6.2, 26, 80, 30, 1, 1],
    [38, 1, 132, 5.8, 25, 83, 29, 0, 2],
    [55, 0, 130, 6.1, 29, 85, 31, 1, 1],

    # HIGH RISK (2)
    [60, 1, 160, 7.4, 12, 95, 32, 2, 2],
    [65, 0, 170, 8.1, 10, 100, 35, 2, 3],
    [70, 1, 180, 9.0, 8, 105, 38, 1, 3],
    [58, 0, 155, 7.8, 15, 98, 36, 2, 2],
])

y = np.array([
    0,0,0,0,   # normal
    1,1,1,1,   # attention_needed
    2,2,2,2    # high_risk
])


# -------- TRAIN MODEL --------
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestClassifier(
    n_estimators=300,
    max_depth=10,
    random_state=42
)

model.fit(X_train, y_train)

acc = model.score(X_test, y_test)
print("Accuracy:", acc)

# -------- SAVE MODEL --------
joblib.dump(model, "models/recommender.pkl")
print("Model saved to models/recommender.pkl")
