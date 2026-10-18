from app.spread import predict_spread, risk_from_score


def hours(days: int, temp: float, rh: float, rain: float = 0.0) -> list[dict]:
    return [
        {"time": f"2026-10-{19 + d:02d}T{h:02d}:00", "temp": temp, "rh": rh, "rain": rain}
        for d in range(days)
        for h in range(24)
    ]


def test_thresholds():
    assert risk_from_score(0) == "low"
    assert risk_from_score(34.9) == "low"
    assert risk_from_score(35) == "medium"
    assert risk_from_score(65) == "high"


def test_cool_wet_week_is_high_for_late_blight():
    out = predict_spread("late_blight", "high", 2, hours(7, temp=18, rh=95, rain=0.5))
    assert out["risk_level"] == "high"
    assert len(out["forecast"]) == 7
    assert all(0 <= p["score"] <= 100 for p in out["forecast"])
    assert "above 90% humidity" in out["summary"]


def test_hot_dry_week_is_low_for_late_blight():
    out = predict_spread("late_blight", "low", 0, hours(7, temp=34, rh=40))
    assert out["risk_level"] == "low"


def test_early_blight_band_is_warm():
    warm = predict_spread("early_blight", "moderate", 0, hours(7, temp=26, rh=95))
    cool = predict_spread("early_blight", "moderate", 0, hours(7, temp=15, rh=95))
    assert warm["risk_score"] > cool["risk_score"]


def test_risk_builds_over_consecutive_days():
    out = predict_spread("late_blight", "moderate", 0, hours(7, temp=18, rh=95))
    scores = [p["score"] for p in out["forecast"]]
    assert scores == sorted(scores)
