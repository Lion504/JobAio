#!/usr/bin/env python3
"""
Simplified Job Analyzer Workflow Test
"""

import json
import sys
import argparse
import random
from pathlib import Path
from datetime import datetime

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from job_analyzer.ai_analyzer import HybridJobAnalyzer


def run_workflow(input_file: Path, output_file: Path, limit: int):
    """
    Run the job analyzer workflow on a subset of jobs.
    """
    print("\n" + "=" * 60)
    print("🧪 JOB ANALYZER TEST WORKFLOW")
    print("=" * 60)
    print(f"Input:  {input_file}")
    print(f"Output: {output_file}")
    print(f"Limit:  {limit} jobs")
    print("-" * 60)

    # 1. Load Jobs
    try:
        with open(input_file, "r", encoding="utf-8") as f:
            jobs = json.load(f)
        print(f"✅ Loaded {len(jobs)} jobs from input file")
    except Exception as e:
        print(f"❌ Error loading input file: {e}")
        return

    # 2. Process Jobs
    analyzer = HybridJobAnalyzer()
    processed_jobs = []

    # Slice jobs based on limit
    jobs_to_process = jobs[:limit]

    print(f"\n📊 Processing first {len(jobs_to_process)} jobs...")

    for idx, job in enumerate(jobs_to_process, 1):
        title = job.get("title", "Unknown")
        description = job.get("description", "")

        print(f"\n[{idx}/{len(jobs_to_process)}] {title}")

        if not description:
            print("   ⚠️  Skipping: No description")
            continue

        try:
            # Analyze
            analysis = analyzer.analyze_job(description)

            # Create result with analysis
            expanded_job = job.copy()
            expanded_job["analysis"] = {
                "language": analysis["language"],
                "experience_level": analysis["experience_level"],
                "education_level": analysis["education_level"],
                "skill_type": analysis["skill_type"],
                "responsibilities": analysis["responsibilities"],
                "metadata": {
                    "analyzed_at": datetime.now().isoformat(),
                    "ai_enhanced": analysis.get("_metadata", {}).get(
                        "ai_enhanced", False
                    ),
                    "analysis_method": analysis.get("_metadata", {}).get(
                        "analysis_method", "unknown"
                    ),
                },
            }

            processed_jobs.append(expanded_job)

            # Print concise results
            if isinstance(analysis["language"], dict):
                lang_str = f"{analysis['language'].get('required', [])} / {analysis['language'].get('advantage', [])}"
            else:
                lang_str = f"{analysis['language']}"

            print(f"   🔹 Languages:  {lang_str}")
            print(f"   🔹 Experience: {analysis['experience_level']}")
            print(f"   🔹 Education:  {analysis['education_level']}")
            print(
                f"   🔹 Skills:     {sum(len(v) for v in analysis['skill_type'].values())} found"
            )
            print(f"   🔹 Job type:   {analysis['job_type']}")

        except Exception as e:
            print(f"   ❌ Error: {e}")

    # 3. Save Results
    print("\n" + "-" * 60)
    try:
        output_file.parent.mkdir(parents=True, exist_ok=True)
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(processed_jobs, f, indent=2, ensure_ascii=False)
        print(f"💾 Saved {len(processed_jobs)} analyzed jobs to:")
        print(f"   {output_file}")
    except Exception as e:
        print(f"❌ Error saving output file: {e}")

    print("=" * 60 + "\n")


def main():
    parser = argparse.ArgumentParser(description="Run Job Analyzer Test Workflow")

    # Default input file (try to find one in logs)
    default_input = (
        Path(__file__).parent.parent / "logs" / "jobs_jobly_20251112_002641.json"
    )

    parser.add_argument(
        "--input", type=Path, default=default_input, help="Input JSON file path"
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).parent / "test_output" / "analyzed_jobs.json",
        help="Output JSON file path",
    )
    parser.add_argument(
        "--limit", type=int, default=20, help="Number of jobs to process"
    )

    args = parser.parse_args()

    if not args.input.exists():
        print(f"❌ Input file not found: {args.input}")
        print("Please specify a valid input file with --input")
        return

    run_workflow(args.input, args.output, args.limit)


if __name__ == "__main__":
    main()
