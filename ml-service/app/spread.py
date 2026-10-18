"""7-day spread-risk score (spec section 7, v1).

Mirrors web/lib/spread.ts, which the frontend uses in demo mode. Keep the two in sync.
Temperature bands, weights and thresholds are tunable starting values.
"""

from collections import OrderedDict
from datetime import date

BANDS = {
    "late_blight": (10.0, 25.0, "cool, wet hours"),
    "early_blight": (24.0, 29.0, "warm, wet hours"),
}
SEVERITY_POINTS = {"low": 5, "moderate": 12, "high": 20}
DAY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
MESSAGES = {
    "low": "Conditions unfavourable for spread. Keep monitoring.",
    "medium": "Spread possible. Inspect nearby plants within 3 days.",
    "high": "High risk of spread. Remove infected leaves and treat now.",
}


def risk_from_score(score: float) -> str:
    if score >= 65:
        return "high"
    if score >= 35:
        return "medium"
    return "low"


def predict_spread(disease: str, severity: str, recent_cases: int, hourly: list[dict]) -> dict:
    """hourly: [{"time": "2026-10-19T00:00", "temp": 18.2, "rh": 91, "rain": 0.2}, ...]"""
    lo, hi, band_label = BANDS.get(disease, BANDS["late_blight"])
    pressure = SEVERITY_POINTS.get(severity, 12) + min(20, max(0, recent_cases) * 5)

    days: "OrderedDict[str, list[dict]]" = OrderedDict()
    for h in hourly:
        days.setdefault(h["time"][:10], []).append(h)

    forecast, weather = [], []
    prev = None
    worst = None
    for d, hours in list(days.items())[:7]:
        humid_hours = sum(1 for h in hours if h["rh"] >= 90)
        favourable = sum(1 for h in hours if lo <= h["temp"] <= hi and (h["rh"] >= 90 or (h["rain"] or 0) > 0))
        fav = min(60.0, favourable / 24 * 60)
        day = fav + pressure
        if disease == "late_blight":
            day *= 1.2
        day = min(100.0, day)
        score = day if prev is None else 0.6 * day + 0.4 * prev
        prev = score

        point = {"date": d, "score": round(score)}
        forecast.append(point)
        weather.append(
            {
                "date": d,
                "temp_max": max(h["temp"] for h in hours),
                "temp_min": min(h["temp"] for h in hours),
                "humidity_mean": round(sum(h["rh"] for h in hours) / len(hours)),
                "rain_mm": round(sum(h["rain"] or 0 for h in hours), 1),
                "wet_hours": favourable,
            }
        )
        if worst is None or point["score"] > worst["score"]:
            worst = {**point, "humid_hours": humid_hours, "favourable": favourable}

    risk_score = worst["score"] if worst else 0
    level = risk_from_score(risk_score)
    if worst:
        day_name = DAY[date.fromisoformat(worst["date"]).weekday()]
        if worst["humid_hours"]:
            driver = f"{worst['humid_hours']} h above 90% humidity"
        elif worst["favourable"]:
            driver = f"{worst['favourable']} {band_label}"
        else:
            driver = f"no {band_label} forecast; the risk comes from infection already in the field"
        summary = f"{day_name}: {driver}. {MESSAGES[level]}"
    else:
        summary = MESSAGES[level]

    return {"risk_level": level, "risk_score": risk_score, "forecast": forecast, "weather": weather, "summary": summary}
