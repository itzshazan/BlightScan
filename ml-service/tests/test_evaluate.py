import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
from evaluate import mcnemar, metrics  # noqa: E402


def rows(outcomes: list[tuple[str, str]]) -> list[dict]:
    return [{"file": f"{i}.jpg", "truth": t, "pred": p, "confidence": 90.0, "warned": False, "model_ms": 1.0} for i, (t, p) in enumerate(outcomes)]


def test_mcnemar_exact_for_few_disagreements():
    # 10 photos only A gets right, 4 only B: exact two-sided binomial p = 2·P(X ≤ 4 | n=14) ≈ 0.180
    a = rows([("healthy", "healthy")] * 10 + [("healthy", "late_blight")] * 4)
    b = rows([("healthy", "late_blight")] * 10 + [("healthy", "healthy")] * 4)
    t = mcnemar(a, b)
    assert (t["only_first_correct"], t["only_second_correct"]) == (10, 4)
    assert t["method"] == "exact binomial"
    assert abs(t["p_value"] - 0.1796) < 0.001
    assert t["significant"] is False


def test_mcnemar_chi_square_for_many_disagreements():
    a = rows([("early_blight", "early_blight")] * 30 + [("early_blight", "healthy")] * 5)
    b = rows([("early_blight", "healthy")] * 30 + [("early_blight", "early_blight")] * 5)
    t = mcnemar(a, b)
    assert t["method"].startswith("chi-square")
    assert t["chi2"] == round((abs(30 - 5) - 1) ** 2 / 35, 3)
    assert t["significant"] is True


def test_metrics_confusion_matrix_and_scores():
    m = metrics(rows([("healthy", "healthy"), ("healthy", "late_blight"), ("late_blight", "late_blight"), ("early_blight", "early_blight")]))
    assert m["accuracy"] == 0.75
    assert m["confusion_matrix"]["rows_true_cols_pred"] == [[1, 0, 1], [0, 1, 0], [0, 0, 1]]
    assert m["per_class"]["late_blight"]["precision"] == 0.5
    assert m["per_class"]["healthy"]["recall"] == 0.5
