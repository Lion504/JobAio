#!/usr/bin/env python3
"""
Test Pure AI Job Analyzer
Uses only AI (no rule-based fallback) and saves results to logs folder
"""

import json
import sys
import argparse
import random
from pathlib import Path

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from job_analyzer.pure_ai_analyzer import PureAIJobAnalyzer


def run_pure_ai_test(input_file: Path, limit: int):
    """
    Run pure AI analysis on jobs
    """
    print("\n" + "=" * 60)
    print("🤖 PURE AI JOB ANALYZER TEST")
    print("=" * 60)
    print(f"Input:  {input_file}")
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

    # 2. Randomly select jobs to process
    if len(jobs) > limit:
        jobs_to_process = random.sample(jobs, limit)
        print(f"🎲 Randomly selected {limit} jobs from {len(jobs)} total")
    else:
        jobs_to_process = jobs
        print(f"📊 Processing all {len(jobs)} jobs (less than limit)")

    print(f"\n📊 Processing {len(jobs_to_process)} jobs with Pure AI...")

    # 3. Process Jobs
    analyzer = PureAIJobAnalyzer()
    all_analyses = []

    for idx, job in enumerate(jobs_to_process, 1):
        title = job.get("title", "Unknown")
        description = job.get("description", "")

        print(f"\n[{idx}/{len(jobs_to_process)}] {title}")

        if not description:
            print("   ⚠️  Skipping: No description")
            continue

        try:
            # Analyze with pure AI
            updated_job = analyzer.analyze_job(job)

            all_analyses.append(updated_job)

            # Print results
            lang_str = f"{updated_job['language'].get('required', [])} / {updated_job['language'].get('advantage', [])}"
            print(f"   🔹 Languages:  {lang_str}")
            print(f"   🔹 Experience: {updated_job['experience_level']}")
            print(f"   🔹 Education:  {updated_job['education_level']}")
            print(
                f"   🔹 Skills:     {sum(len(v) for v in updated_job['skill_type'].values())} found"
            )
            print(f"   🔹 Job type:   {updated_job['job_type']}")
            print(f"   🔹 Resp count: {len(updated_job.get('responsibilities', []))}")

        except Exception as e:
            print(f"   ❌ Error: {e}")
            import traceback

            traceback.print_exc()

    # 4. Save Combined Results
    print("\n" + "-" * 60)
    from datetime import datetime

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    combined_filename = f"pure_ai_batch_{timestamp}.json"
    logs_dir = Path(__file__).parent.parent / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)
    combined_filepath = logs_dir / combined_filename

    try:
        with open(combined_filepath, "w", encoding="utf-8") as f:
            json.dump(all_analyses, f, indent=2, ensure_ascii=False)
        print(f"💾 Saved {len(all_analyses)} analyses to:")
        print(f"   {combined_filepath}")
    except Exception as e:
        print(f"❌ Error saving combined results: {e}")

    print("=" * 60 + "\n")


def main():
    parser = argparse.ArgumentParser(description="Run Pure AI Job Analyzer Test")

    # Default input file
    default_input = (
        Path(__file__).parent.parent / "logs" / "jobs_jobly_20251112_002641.json"
    )

    parser.add_argument(
        "--input", type=Path, default=default_input, help="Input JSON file path"
    )
    parser.add_argument(
        "--limit", type=int, default=5, help="Number of jobs to process"
    )

    args = parser.parse_args()

    if not args.input.exists():
        print(f"❌ Input file not found: {args.input}")
        print("Please specify a valid input file with --input")
        return

    run_pure_ai_test(args.input, args.limit)


if __name__ == "__main__":
    main()
