#!/usr/bin/env python3
"""
Test Hybrid Job Analyzer
Uses two-stage analysis: Base (regex) + AI (override) pipeline and saves results to logs folder
"""

import json
import sys
import argparse
import random
from pathlib import Path

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from job_analyzer.main import HybridJobAnalyzer


def run_hybrid_test(input_file: Path, limit: int):
    """
    Run hybrid analysis on jobs
    """
    print("\n" + "=" * 60)
    print("🔬 HYBRID JOB ANALYZER TEST")
    print("🔧 Stage 1: Base (rule-based) + 🤖 Stage 2: AI (override)")
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

    print(f"\n🔄 Processing {len(jobs_to_process)} jobs with hybrid analysis...")

    # 3. Process Jobs with Hybrid Analyzer
    analyzer = HybridJobAnalyzer()
    all_analyses = []

    for idx, job in enumerate(jobs_to_process, 1):
        title = job.get("title", "")
        description = job.get("description", "")

        print(f"\n[{idx}/{len(jobs_to_process)}] {title}")

        if not description:
            print("   ⚠️  Skipping: No description")
            continue

        try:
            # Hybrid analysis: Base + AI override
            enhanced_job = analyzer.analyze_job(job)

            all_analyses.append(enhanced_job)

            # Show merge insights
            meta = enhanced_job.get('_metadata', {})
            base_found = meta.get('base_stage', {})
            ai_enhanced = meta.get('ai_stage', {})

            print("   🔧 Base Results:")
            print(f"      Job type: {enhanced_job.get('job_type', [])}")
            print(f"      Languages: {enhanced_job.get('language', {}).get('required', [])}")
            print(f"      Experience: {enhanced_job.get('experience_level', '')}")
            print(f"      Education: {enhanced_job.get('education_level', [])}")
            print(f"      Skills found: {base_found.get('skills_found', False)}")
            print(f"      Responsibilities: {enhanced_job.get('responsibilities', [])}")

            print("   🤖 AI Enhanced:")
            print(f"      Job type: {enhanced_job.get('job_type', [])}")
            print(f"      Languages: {enhanced_job.get('language', {}).get('required', [])}")
            print(f"      Experience: {enhanced_job.get('experience_level', '')}")
            print(f"      Education: {enhanced_job.get('education_level', [])}")
            print(f"      Skills: {sum(len(v) for v in enhanced_job.get('skill_type', {}).values())} found")
            print(f"      Responsibilities: {enhanced_job.get('responsibilities', [])}")
            print(f"      Analysis: {'Combined' if meta.get('ai_used', False) else 'Base only'}")

        except Exception as e:
            print(f"   ❌ Error: {e}")
            import traceback

            traceback.print_exc()

    # 4. Save Combined Results
    print("\n" + "-" * 60)
    from datetime import datetime

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    combined_filename = f"hybrid_analysis_batch_{timestamp}.json"
    logs_dir = Path(__file__).parent.parent / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)
    combined_filepath = logs_dir / combined_filename

    try:
        with open(combined_filepath, "w", encoding="utf-8") as f:
            json.dump(all_analyses, f, indent=2, ensure_ascii=False)
        print(f"💾 Saved {len(all_analyses)} hybrid analyses to:")
        print(f"   {combined_filepath}")
    except Exception as e:
        print(f"❌ Error saving combined results: {e}")

    print("=" * 60 + "\n")


def main():
    parser = argparse.ArgumentParser(description="Run Hybrid Job Analyzer Test")

    # Default input file (use the provided jobs file)
    default_input = (
        Path(__file__).parent.parent / "logs" / "jobs_jobly_20251121_213443.json"
    )

    parser.add_argument(
        "--input", type=Path, default=default_input, help="Input JSON file path"
    )
    parser.add_argument(
        "--limit", type=int, default=3, help="Number of jobs to process"  # Lower default due to 2-stage processing
    )

    args = parser.parse_args()

    if not args.input.exists():
        print(f"❌ Input file not found: {args.input}")
        print("Please specify a valid input file with --input")
        return

    run_hybrid_test(args.input, args.limit)


if __name__ == "__main__":
    main()
