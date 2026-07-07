"""
calibration.py — Post-training confidence calibration for the multi-head bike classifier.

Implements:
  • Temperature Scaling  – single scalar T learned per head via NLL on a held-out set.
                           Divides raw logits by T before sigmoid.  (preferred: no extra params)
  • Platt Scaling        – per-head logistic regression (A·logit + B) via LBFGS optimisation.

After fitting, parameters are stored in  models/calibration_params.json  and loaded
automatically on every inference call so that  classify_bike()  returns calibrated scores.

Calibration diagnostics:
  • Expected Calibration Error (ECE)
  • Maximum Calibration Error (MCE)
  • Reliability diagram data (confidence bins → mean confidence, fraction positive)
"""

from __future__ import annotations

import json
import math
import os
from pathlib import Path
from typing import Literal

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim

# ──────────────────────────────────────────────────────────────────────────────
# Paths
# ──────────────────────────────────────────────────────────────────────────────
MODELS_DIR       = Path(__file__).resolve().parent.parent.parent / "models"
CALIB_PARAMS_PATH = MODELS_DIR / "calibration_params.json"

MULTI_LABEL_CLASSES = [
    "exhaust_modifications",
    "paint_changes",
    "wheel_swaps",
    "handlebar_alterations",
    "lighting_modifications",
    "engine_tampering",
]
N_CLASSES = len(MULTI_LABEL_CLASSES)


# ──────────────────────────────────────────────────────────────────────────────
# Temperature Scaling (per-head scalar)
# ──────────────────────────────────────────────────────────────────────────────
class TemperatureScaler(nn.Module):
    """
    Learns one temperature scalar T_i per head.
    Calibrated probability = sigmoid(logit / T_i).
    T > 1 softens (lowers) overconfident predictions.
    T < 1 sharpens underconfident ones.
    """

    def __init__(self, n_classes: int = N_CLASSES):
        super().__init__()
        # initialise all T = 1.0 (identity transform)
        self.temperature = nn.Parameter(torch.ones(n_classes))

    def forward(self, logits: torch.Tensor) -> torch.Tensor:
        """logits: (N, n_classes) → calibrated probs (N, n_classes)"""
        T = self.temperature.clamp(min=1e-3)     # prevent collapse to 0
        return torch.sigmoid(logits / T)

    def calibrate(self, logits: np.ndarray) -> np.ndarray:
        """Numpy convenience wrapper used at inference time."""
        with torch.no_grad():
            t = torch.tensor(logits, dtype=torch.float32)
            return self.forward(t).numpy()


# ──────────────────────────────────────────────────────────────────────────────
# Platt Scaling (per-head A·logit + B)
# ──────────────────────────────────────────────────────────────────────────────
class PlattScaler(nn.Module):
    """
    Learns A_i and B_i per head.
    Calibrated probability = sigmoid(A_i · logit_i + B_i).
    """

    def __init__(self, n_classes: int = N_CLASSES):
        super().__init__()
        self.A = nn.Parameter(torch.ones(n_classes))
        self.B = nn.Parameter(torch.zeros(n_classes))

    def forward(self, logits: torch.Tensor) -> torch.Tensor:
        return torch.sigmoid(self.A * logits + self.B)

    def calibrate(self, logits: np.ndarray) -> np.ndarray:
        with torch.no_grad():
            t = torch.tensor(logits, dtype=torch.float32)
            return self.forward(t).numpy()


# ──────────────────────────────────────────────────────────────────────────────
# Fitting  (LBFGS on NLL / BCE)
# ──────────────────────────────────────────────────────────────────────────────
def _fit_scaler(
    scaler: nn.Module,
    logits: np.ndarray,
    labels: np.ndarray,
    max_iter: int = 200,
    lr: float = 0.01,
) -> nn.Module:
    """
    Fit scaler parameters on held-out (logits, labels) using LBFGS.

    Args:
        scaler : TemperatureScaler or PlattScaler
        logits : (N, n_classes) raw model logits
        labels : (N, n_classes) binary ground-truth labels
        max_iter: LBFGS iterations
    Returns:
        fitted scaler (in-place and returned)
    """
    logits_t = torch.tensor(logits, dtype=torch.float32)
    labels_t = torch.tensor(labels, dtype=torch.float32)
    criterion = nn.BCELoss()

    optimizer = optim.LBFGS(scaler.parameters(), lr=lr, max_iter=max_iter)

    def _closure():
        optimizer.zero_grad()
        probs = scaler(logits_t)
        loss  = criterion(probs, labels_t)
        loss.backward()
        return loss

    scaler.train()
    optimizer.step(_closure)
    scaler.eval()
    return scaler


def fit_temperature_scaling(
    logits: np.ndarray,
    labels: np.ndarray,
    max_iter: int = 200,
) -> TemperatureScaler:
    scaler = TemperatureScaler()
    return _fit_scaler(scaler, logits, labels, max_iter=max_iter)


def fit_platt_scaling(
    logits: np.ndarray,
    labels: np.ndarray,
    max_iter: int = 200,
) -> PlattScaler:
    scaler = PlattScaler()
    return _fit_scaler(scaler, logits, labels, max_iter=max_iter)


# ──────────────────────────────────────────────────────────────────────────────
# Persist / load calibration parameters
# ──────────────────────────────────────────────────────────────────────────────
def save_calibration_params(
    scaler: nn.Module,
    method: Literal["temperature", "platt"],
    nll_before: float,
    nll_after: float,
    ece_before: float,
    ece_after: float,
    n_samples: int,
    path: Path = CALIB_PARAMS_PATH,
) -> dict:
    """Serialise calibration parameters + diagnostics to JSON."""
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    params: dict = {
        "method":     method,
        "n_classes":  N_CLASSES,
        "classes":    MULTI_LABEL_CLASSES,
        "n_samples":  n_samples,
        "nll_before": round(nll_before, 6),
        "nll_after":  round(nll_after,  6),
        "ece_before": round(ece_before, 6),
        "ece_after":  round(ece_after,  6),
    }

    if method == "temperature":
        params["temperature"] = scaler.temperature.detach().tolist()
    else:
        params["A"] = scaler.A.detach().tolist()
        params["B"] = scaler.B.detach().tolist()

    with open(path, "w") as f:
        json.dump(params, f, indent=2)

    return params


def load_calibration_params(path: Path = CALIB_PARAMS_PATH) -> dict | None:
    """Return parsed JSON dict, or None if file does not exist."""
    if not path.exists():
        return None
    with open(path) as f:
        return json.load(f)


def build_scaler_from_params(params: dict) -> nn.Module | None:
    """Reconstruct a fitted scaler from the saved JSON params dict."""
    if params is None:
        return None
    method = params.get("method")
    if method == "temperature":
        s = TemperatureScaler(n_classes=params["n_classes"])
        s.temperature = nn.Parameter(torch.tensor(params["temperature"]))
    elif method == "platt":
        s = PlattScaler(n_classes=params["n_classes"])
        s.A = nn.Parameter(torch.tensor(params["A"]))
        s.B = nn.Parameter(torch.tensor(params["B"]))
    else:
        return None
    s.eval()
    return s


# ──────────────────────────────────────────────────────────────────────────────
# Singleton: calibration scaler used at inference time
# ──────────────────────────────────────────────────────────────────────────────
_scaler_cache: nn.Module | None = None
_scaler_loaded: bool = False


def get_inference_scaler() -> nn.Module | None:
    """Return the cached calibration scaler (None if not yet fitted)."""
    global _scaler_cache, _scaler_loaded
    if not _scaler_loaded:
        params = load_calibration_params()
        _scaler_cache  = build_scaler_from_params(params)
        _scaler_loaded = True
    return _scaler_cache


def reload_inference_scaler():
    """Force reload from disk (called after fitting new calibration)."""
    global _scaler_cache, _scaler_loaded
    _scaler_loaded = False
    return get_inference_scaler()


def apply_calibration(logits: np.ndarray) -> np.ndarray:
    """
    Apply loaded calibration to raw logits.
    Falls back to plain sigmoid if no calibration has been fitted yet.
    """
    scaler = get_inference_scaler()
    if scaler is not None:
        return scaler.calibrate(logits)
    return 1.0 / (1.0 + np.exp(-logits))   # plain sigmoid


# ──────────────────────────────────────────────────────────────────────────────
# Calibration diagnostics
# ──────────────────────────────────────────────────────────────────────────────
def _sigmoid(x: np.ndarray) -> np.ndarray:
    return np.where(x >= 0,
                    1.0 / (1.0 + np.exp(-x)),
                    np.exp(x) / (1.0 + np.exp(x)))


def binary_nll(logits: np.ndarray, labels: np.ndarray) -> float:
    """Mean binary cross-entropy (NLL) over all (sample, class) pairs."""
    probs = np.clip(_sigmoid(logits), 1e-7, 1 - 1e-7)
    return float(-np.mean(labels * np.log(probs) + (1 - labels) * np.log(1 - probs)))


def calibration_curve_data(
    probs: np.ndarray,
    labels: np.ndarray,
    n_bins: int = 10,
    class_idx: int | None = None,
) -> dict:
    """
    Compute reliability diagram data for one class (or micro-averaged over all).

    Args:
        probs     : (N, C) predicted probabilities in [0, 1]
        labels    : (N, C) binary ground-truth
        n_bins    : number of equal-width confidence bins
        class_idx : if None, flatten all classes (micro-average)

    Returns dict with:
        bins            – list of bin upper boundaries
        mean_confidence – mean predicted probability per bin
        fraction_pos    – observed positive rate per bin
        bin_counts      – sample count per bin
        ece             – Expected Calibration Error (scalar)
        mce             – Maximum Calibration Error (scalar)
    """
    if class_idx is not None:
        p = probs[:, class_idx].ravel()
        y = labels[:, class_idx].ravel()
    else:
        p = probs.ravel()
        y = labels.ravel()

    bins_upper   = np.linspace(0.0, 1.0, n_bins + 1)[1:]   # e.g. 0.1 … 1.0
    mean_conf    = []
    frac_pos     = []
    counts       = []

    for i, upper in enumerate(bins_upper):
        lower = 0.0 if i == 0 else bins_upper[i - 1]
        mask  = (p > lower) & (p <= upper)
        cnt   = mask.sum()
        counts.append(int(cnt))
        if cnt > 0:
            mean_conf.append(float(p[mask].mean()))
            frac_pos.append(float(y[mask].mean()))
        else:
            mean_conf.append(float((lower + upper) / 2))
            frac_pos.append(0.0)

    n_total = len(p)
    ece = float(sum(
        counts[i] / n_total * abs(mean_conf[i] - frac_pos[i])
        for i in range(n_bins)
    ))
    mce = float(max(abs(mc - fp) for mc, fp in zip(mean_conf, frac_pos)))

    return {
        "bins":            [round(b, 2) for b in bins_upper.tolist()],
        "mean_confidence": [round(v, 4) for v in mean_conf],
        "fraction_pos":    [round(v, 4) for v in frac_pos],
        "bin_counts":      counts,
        "ece":             round(ece, 6),
        "mce":             round(mce, 6),
        "n_samples":       n_total,
    }


def full_calibration_report(
    logits: np.ndarray,
    labels: np.ndarray,
    scaler: nn.Module | None = None,
    n_bins: int = 10,
) -> dict:
    """
    Build the complete calibration report used by the /api/v1/calibration endpoint.

    Returns:
        {
          "uncalibrated": { per_class + micro curves, ECE, NLL },
          "calibrated":   { same, using scaler if provided },
          "params":       loaded calibration params dict or null,
        }
    """
    raw_probs  = _sigmoid(logits)
    nll_raw    = binary_nll(logits, labels)
    curve_raw  = calibration_curve_data(raw_probs, labels, n_bins=n_bins)
    per_cls_raw = [
        {**calibration_curve_data(raw_probs, labels, n_bins=n_bins, class_idx=i),
         "class": MULTI_LABEL_CLASSES[i]}
        for i in range(N_CLASSES)
    ]

    if scaler is not None:
        cal_probs  = scaler.calibrate(logits)
        cal_logits = np.log(np.clip(cal_probs, 1e-7, 1 - 1e-7) /
                            np.clip(1 - cal_probs, 1e-7, 1))
        nll_cal    = binary_nll(cal_logits, labels)
        curve_cal  = calibration_curve_data(cal_probs, labels, n_bins=n_bins)
        per_cls_cal = [
            {**calibration_curve_data(cal_probs, labels, n_bins=n_bins, class_idx=i),
             "class": MULTI_LABEL_CLASSES[i]}
            for i in range(N_CLASSES)
        ]
    else:
        nll_cal, curve_cal, per_cls_cal = None, None, None

    return {
        "uncalibrated": {
            "micro_average": curve_raw,
            "per_class":     per_cls_raw,
            "nll":           round(nll_raw, 6),
        },
        "calibrated": {
            "micro_average": curve_cal,
            "per_class":     per_cls_cal,
            "nll":           round(nll_cal, 6) if nll_cal is not None else None,
        } if scaler is not None else None,
        "params": load_calibration_params(),
    }
