"""Small, documented engineering evaluation harness for SeeLess.

Runs each test case through the backend and records latency, errors, and lightweight
correctness signals. Not a statistical benchmark — treat the output as a dev report.

Usage (from repo root, with the backend running):
    python evaluation/evaluate.py --api http://localhost:8000 --out evaluation/report.json
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import time
from pathlib import Path
from typing import Any, Dict, List

import httpx


def _guess_mime(path: Path) -> str:
    mt, _ = mimetypes.guess_type(path.name)
    return mt or "image/jpeg"


def _contains_any(text: str, needles: List[str]) -> bool:
    if not needles:
        return True
    lo = text.lower()
    return any(n.lower() in lo for n in needles)


def run_case(
    client: httpx.Client,
    api: str,
    repo_root: Path,
    case: Dict[str, Any],
    language: str,
) -> Dict[str, Any]:
    result: Dict[str, Any] = {
        "case_id": case["id"],
        "language": language,
        "category": case.get("category"),
        "errors": [],
    }

    image_path = repo_root / case["file"]
    if not image_path.exists():
        result["skipped"] = True
        result["errors"].append(f"missing image: {image_path}")
        return result

    with image_path.open("rb") as f:
        files = {"image": (image_path.name, f, _guess_mime(image_path))}
        data = {"language": language, "detail": "standard"}
        t0 = time.perf_counter()
        try:
            resp = client.post(f"{api}/api/v1/analyze", files=files, data=data, timeout=120.0)
        except httpx.HTTPError as e:
            result["errors"].append(f"analyze request failed: {e}")
            return result
        result["analyze_latency_s"] = round(time.perf_counter() - t0, 3)

    if resp.status_code != 200:
        result["errors"].append(f"analyze {resp.status_code}: {resp.text[:200]}")
        return result

    payload = resp.json()
    result["analysis_id"] = payload["analysis_id"]
    result["scene_type"] = payload["observations"]["scene_type"]
    result["description"] = payload["description"]
    result["num_ranked"] = len(payload["ranked_observations"])
    result["uncertainties"] = payload["observations"]["uncertainties"]

    expected_scene = case.get("expected_scene_type")
    if expected_scene:
        result["scene_type_match"] = expected_scene.lower() in result["scene_type"].lower()

    must_mention = case.get("must_mention") or []
    missing = [m for m in must_mention if m.lower() not in payload["description"].lower()]
    result["must_mention_missing"] = missing

    question = case.get("follow_up_question")
    if question:
        t1 = time.perf_counter()
        try:
            qresp = client.post(
                f"{api}/api/v1/ask",
                json={
                    "analysis_id": payload["analysis_id"],
                    "question": question,
                    "language": language,
                },
                timeout=60.0,
            )
        except httpx.HTTPError as e:
            result["errors"].append(f"ask request failed: {e}")
            return result
        result["ask_latency_s"] = round(time.perf_counter() - t1, 3)

        if qresp.status_code != 200:
            result["errors"].append(f"ask {qresp.status_code}: {qresp.text[:200]}")
        else:
            q = qresp.json()
            result["answer"] = q["answer"]
            result["supporting_evidence"] = q["supporting_evidence"]
            result["answer_uncertainty"] = q["uncertainty"]
            expected = case.get("expected_answer_contains") or []
            result["expected_answer_ok"] = _contains_any(q["answer"], expected)
            result["grounded"] = bool(q["supporting_evidence"])

    return result


def summarize(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    total = len(results)
    ran = [r for r in results if not r.get("skipped")]
    errors = sum(1 for r in ran if r["errors"])
    scene_ok = sum(1 for r in ran if r.get("scene_type_match"))
    grounded_rate = (
        sum(1 for r in ran if r.get("grounded")) / max(1, sum(1 for r in ran if "answer" in r))
    )
    latencies = [r["analyze_latency_s"] for r in ran if "analyze_latency_s" in r]
    avg_latency = sum(latencies) / max(1, len(latencies))
    return {
        "total_cases": total,
        "ran": len(ran),
        "errors": errors,
        "scene_type_match_rate": round(scene_ok / max(1, len(ran)), 3),
        "qa_grounded_rate": round(grounded_rate, 3),
        "avg_analyze_latency_s": round(avg_latency, 3),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--api", default="http://localhost:8000")
    parser.add_argument("--cases", default=str(Path(__file__).parent / "test_cases.json"))
    parser.add_argument("--out", default=str(Path(__file__).parent / "report.json"))
    parser.add_argument(
        "--languages",
        nargs="+",
        default=None,
        help="Override languages. Defaults to the list in test_cases.json.",
    )
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parent.parent
    cases_doc = json.loads(Path(args.cases).read_text(encoding="utf-8"))
    cases = cases_doc["cases"]
    languages = args.languages or cases_doc["languages"]

    results: List[Dict[str, Any]] = []
    with httpx.Client() as client:
        for case in cases:
            for lang in languages:
                print(f"→ {case['id']} [{lang}]")
                results.append(run_case(client, args.api, repo_root, case, lang))

    report = {"summary": summarize(results), "results": results}
    Path(args.out).write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nWrote report → {args.out}")
    print(json.dumps(report["summary"], indent=2))


if __name__ == "__main__":
    main()
