"""Human-in-the-Loop (HITL) Interrupt Gate.

Intercepts high-impact or destructive actions (e.g., fee payments, course drops, semester withdrawal)
requiring explicit user confirmation before agent execution.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any


@dataclass
class HITLGateResult:
    is_interrupted: bool = False
    action_details: dict[str, Any] = field(default_factory=dict)


HIGH_RISK_KEYWORDS = [
    "withdraw", "drop course", "delete profile", "transfer fee", "cancel enrollment"
]


def check_hitl_interrupt(
    query: str,
    intents: list[str],
    steps: list[dict[str, Any]],
) -> HITLGateResult:
    """Evaluate whether an execution plan contains high-impact actions requiring HITL interrupt."""
    q_lower = query.lower()
    for kw in HIGH_RISK_KEYWORDS:
        if kw in q_lower:
            return HITLGateResult(
                is_interrupted=True,
                action_details={
                    "title": f"High-Impact Action: '{kw.title()}'",
                    "description": f"The requested action '{kw}' has permanent effects. Please confirm to proceed.",
                    "risk_level": "HIGH",
                },
            )
    return HITLGateResult(is_interrupted=False)
