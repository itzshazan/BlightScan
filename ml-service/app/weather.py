"""Open-Meteo hourly forecast (free, no API key)."""

import time

import httpx

_cache: dict[str, tuple[float, list[dict]]] = {}
_TTL = 30 * 60


def hourly_forecast(lat: float, lon: float, timeout: float = 15.0) -> list[dict]:
    key = f"{lat:.2f},{lon:.2f}"
    hit = _cache.get(key)
    if hit and time.time() - hit[0] < _TTL:
        return hit[1]

    r = httpx.get(
        "https://api.open-meteo.com/v1/forecast",
        params={
            "latitude": lat,
            "longitude": lon,
            "hourly": "temperature_2m,relative_humidity_2m,precipitation",
            "forecast_days": 7,
            "timezone": "auto",
        },
        timeout=timeout,
    )
    r.raise_for_status()
    h = r.json()["hourly"]
    hourly = [
        {"time": t, "temp": temp, "rh": rh, "rain": rain}
        for t, temp, rh, rain in zip(h["time"], h["temperature_2m"], h["relative_humidity_2m"], h["precipitation"])
        if temp is not None and rh is not None
    ]
    _cache[key] = (time.time(), hourly)
    return hourly
