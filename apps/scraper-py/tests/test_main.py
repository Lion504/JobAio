#!/usr/bin/env python3
"""
Test Full Job Scraper & Analyzer Pipeline
Tests all 8 steps: scraping → pre-translate → categorize → analyze → save → insert DB → translate → insert translated
"""

import json
import sys
import argparse
import random
from pathlib import Path

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from job_analyzer.hybrid_job_analyzer import HybridJobAnalyzer
from job_deduplicator import deduplicate_jobs


def test_component_analysis(input_file: Path, limit: int):
    """
    Test just the analysis component (steps 4-5 equivalent)
    """
    print("\n" + "=" * 60)
    print("🔬 COMPONENT TEST: Job Analysis Only")
    print("Tests hybrid analyzer with pre-categorized jobs")
    print("=" * 60)

    # Load pre-processed jobs
    try:
        with open(input_file, "r", encoding="utf-8") as f:
            jobs = json.load(f)
        print(f"✅ Loaded {len(jobs)} pre-processed jobs")
    except Exception as e:
        print(f"❌ Error loading jobs: {e}")
        return False

    # Select subset
    jobs_to_test = jobs[:limit] if len(jobs) > limit else jobs
    print(f"📊 Testing with {len(jobs_to_test)} jobs")

    # Test hybrid analyzer
    analyzer = HybridJobAnalyzer()
    analyzed_jobs = analyzer.analyze_batch(jobs_to_test)

    if analyzed_jobs and len(analyzed_jobs) > 0:
        print(f"✅ Analysis successful: {len(analyzed_jobs)} jobs processed")
        return True
    else:
        print("❌ Analysis failed")
        return False


def test_full_pipeline_simulation(limit: int = 2):
    """
    Test full pipeline simulation with mock/minimal data
    """
    print("\n" + "=" * 70)
    print("🚀 FULL PIPELINE SIMULATION TEST")
    print("Tests all 8 steps with minimal data (no external APIs)")
    print("=" * 70)

    # Create mock jobs
    mock_jobs = [
        {
            "title": "Software Developer",
            "company": "TestCorp",
            "location": "Helsinki",
            "description": "Develop software applications using Python and JavaScript. Requires 3+ years experience.",
            "url": "https://example.com/job1",
            "source": "test"
        },
        {
            "title": "Data Analyst",
            "company": "DataCorp",
            "location": "Tampere",
            "description": "Analyze data using SQL and Python. Experience with Tableau preferred.",
            "url": "https://example.com/job2",
            "source": "test"
        }
    ][:limit]

    print(f"🧪 Created {len(mock_jobs)} mock jobs for testing")

    # Step 1-2: Simulate scraping and deduplication
    print("\n🕷️ [1-2/9] Simulating scraping and deduplication...")
    scraped_jobs = deduplicate_jobs(mock_jobs)
    print(f"✅ Simulated scraping: {len(scraped_jobs)} jobs")

    # Step 3: Mock pre-translation (just pass through for test)
    print("\n🌐 [3/9] Simulating pre-translation...")
    translated_jobs = scraped_jobs  # Skip actual translation in test
    print(f"✅ Simulated pre-translation: {len(translated_jobs)} jobs")

    # Step 4: Mock categorization (add basic categories)
    print("\n🏷️ [4/9] Simulating categorization...")
    for job in translated_jobs:
        job["industry_category"] = ["Technology"]
        job["job_type"] = ["Full-time"]
    categorized_jobs = translated_jobs
    print(f"✅ Simulated categorization: {len(categorized_jobs)} jobs")

    # Step 5: Analysis
    print("\n🔬 [5/9] Testing job analysis...")
    analyzer = HybridJobAnalyzer()
    analyzed_jobs = analyzer.analyze_batch(categorized_jobs)
    print(f"✅ Analysis complete: {len(analyzed_jobs)} jobs")

    # Step 6: Save results
    print("\n💾 [6/9] Saving test results...")
    test_dir = Path(__file__).parent / "test_output"
    test_dir.mkdir(exist_ok=True)

    from datetime import datetime
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = test_dir / f"pipeline_test_{timestamp}.json"

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(analyzed_jobs, f, indent=2, ensure_ascii=False)
    print(f"💾 Saved test results to: {output_file}")

    # Steps 7-8: Simulate DB operations (just log, don't actually insert)
    print("\n🗄️ [7/9] Simulating database insertion...")
    print("   (Skipping actual DB operations in test mode)")
    print("✅ Simulated original jobs insertion")

    print("\n🌍 [8/9] Simulating translation...")
    print("   (Skipping actual translation in test mode)")
    print("✅ Simulated translation")

    print("\n🗃️ [9/9] Simulating translated insertion...")
    print("   (Skipping actual DB operations in test mode)")
    print("✅ Simulated translated jobs insertion")

    print(f"\n🎉 Pipeline simulation complete!")
    print(f"   Test results: {output_file}")

    return True


def test_script_availability():
    """
    Test that all required scripts are available
    """
    print("\n" + "=" * 60)
    print("🔍 SCRIPT AVAILABILITY TEST")
    print("Checking all Node.js scripts used in pipeline")
    print("=" * 60)

    project_root = Path(__file__).parent.parent / "src"
    scripts_root = Path(__file__).parent.parent.parent

    scripts_to_check = [
        ("Pre-translator", scripts_root / "packages" / "ai" / "src" / "job_pretranslator.js"),
        ("Categorizer", scripts_root / "packages" / "ai" / "src" / "job_categorization.js"),
        ("Translator", scripts_root / "packages" / "ai" / "src" / "translator.js"),
        ("Insert Original", scripts_root / "packages" / "db" / "src" / "insert-original.js"),
        ("Insert Translated", scripts_root / "packages" / "db" / "src" / "insert-translated.js"),
    ]

    all_available = True
    for name, script_path in scripts_to_check:
        if script_path.exists():
            print(f"✅ {name}: {script_path}")
        else:
            print(f"❌ {name}: {script_path} (NOT FOUND)")
            all_available = False

    # Check Python components
    python_components = [
        ("Hybrid Analyzer", project_root / "job_analyzer" / "hybrid_job_analyzer.py"),
        ("Deduplicator", project_root / "job_deduplicator.py"),
    ]

    for name, component_path in python_components:
        if component_path.exists():
            print(f"✅ {name}: {component_path}")
        else:
            print(f"❌ {name}: {component_path} (NOT FOUND)")
            all_available = False

    print(f"\n{'✅ All scripts available' if all_available else '❌ Some scripts missing'}")
    return all_available


def run_full_pipeline_test(max_pages: int = 1):
    """
    Run the actual full pipeline (use with caution - makes real API calls)
    """
    print("\n" + "=" * 70)
    print("🚀 FULL PIPELINE INTEGRATION TEST")
    print("⚠️  WARNING: This runs the real pipeline with API calls!")
    print("=" * 70)

    # Import and run the actual main function
    try:
        from main import main as pipeline_main

        # Temporarily modify sys.argv to set test parameters
        original_argv = sys.argv.copy()
        sys.argv = ["main.py", "--max-pages", str(max_pages)]

        print("Starting full pipeline test...")
        pipeline_main()

        # Restore argv
        sys.argv = original_argv

        print("✅ Full pipeline test completed")
        return True

    except Exception as e:
        print(f"❌ Full pipeline test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Test Job Scraper & Analyzer Pipeline Components",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Test script availability
  python test_main.py --test scripts

  # Test analysis component only
  python test_main.py --test analysis --input path/to/jobs.json --limit 5

  # Test full pipeline simulation
  python test_main.py --test simulation --limit 3

  # Run full pipeline (makes real API calls!)
  python test_main.py --test full --max-pages 1
        """
    )

    parser.add_argument(
        "--test",
        choices=["scripts", "analysis", "simulation", "full"],
        default="simulation",
        help="Test type to run"
    )

    parser.add_argument(
        "--input",
        type=Path,
        help="Input JSON file for analysis test"
    )

    parser.add_argument(
        "--limit",
        type=int,
        default=3,
        help="Number of jobs to process in tests"
    )

    parser.add_argument(
        "--max-pages",
        type=int,
        default=1,
        help="Max pages to scrape in full pipeline test"
    )

    args = parser.parse_args()

    if args.test == "scripts":
        success = test_script_availability()

    elif args.test == "analysis":
        if not args.input:
            # Try to find a default input file
            logs_dir = Path(__file__).parent.parent / "logs"
            possible_files = list(logs_dir.glob("pipeline_results_*.json"))
            if possible_files:
                args.input = max(possible_files, key=lambda f: f.stat().st_mtime)
                print(f"Using latest pipeline file: {args.input}")
            else:
                print("❌ No input file specified and no pipeline files found")
                return

        if not args.input.exists():
            print(f"❌ Input file not found: {args.input}")
            return

        success = test_component_analysis(args.input, args.limit)

    elif args.test == "simulation":
        success = test_full_pipeline_simulation(args.limit)

    elif args.test == "full":
        print("⚠️  Running full pipeline test - this will make real API calls!")
        confirm = input("Continue? (y/N): ").lower().strip()
        if confirm == "y":
            success = run_full_pipeline_test(args.max_pages)
        else:
            print("Test cancelled")
            return

    if 'success' in locals():
        print(f"\n{'✅ Test passed' if success else '❌ Test failed'}")
    else:
        print("\n❓ Test completed")


if __name__ == "__main__":
    main()
