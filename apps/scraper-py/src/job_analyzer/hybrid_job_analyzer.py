"""Pure hybrid job analysis engine - terminal output only"""

from typing import Any, Dict


class HybridJobAnalyzer:
    """Two-stage analysis: Base analyzer foundation + AI override enhancement"""

    def __init__(self):
        from .base_analyzer import BaseJobAnalyzer
        from .pure_ai_analyzer import PureAIJobAnalyzer

        self.base_analyzer = BaseJobAnalyzer()
        self.ai_analyzer = PureAIJobAnalyzer()

    def analyze_batch(self, jobs: list[Dict[str, Any]]) -> list[Dict[str, Any]]:
        # Analyze multiple jobs using parallel batch processing (Node.js unified)
        from concurrent.futures import ThreadPoolExecutor, as_completed

        BATCH_SIZE = 10
        MAX_WORKERS = 5

        print(f"\n🔄 Hybrid Analyzer: Processing {len(jobs)} jobs...")
        print(f"   - Batch Size: {BATCH_SIZE}")
        print(f"   - Concurrency: {MAX_WORKERS} threads")

        # Split jobs into batches
        batches = [jobs[i : i + BATCH_SIZE] for i in range(0, len(jobs), BATCH_SIZE)]
        total_batches = len(batches)

        results_map = {}  # Map index -> result to preserve order

        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            # Create a map of future -> (batch_index, batch_data)
            future_to_batch = {
                executor.submit(self.ai_analyzer.analyze_batch, batch): (i, batch)
                for i, batch in enumerate(batches)
            }

            for future in as_completed(future_to_batch):
                batch_idx, batch_data = future_to_batch[future]
                try:
                    # AI Results (Full override objects)
                    analyzed_batch = future.result()

                    print(f"   ✅ Batch {batch_idx + 1}/{total_batches} completed")

                    for local_idx, analyzed_job in enumerate(analyzed_batch):
                        original_job = batch_data[local_idx]

                        base_result = self.base_analyzer.analyze_job(
                            original_job.copy()
                        )

                        merged = {**base_result, **analyzed_job}

                        merged.update(original_job)

                        # Add metadata
                        merged["_metadata"] = {
                            "method": "hybrid_batch_parallel",
                            "ai_enhanced": True,
                        }

                        global_idx = batch_idx * BATCH_SIZE + local_idx
                        results_map[global_idx] = merged

                except Exception as exc:
                    print(f"   ❌ Batch {batch_idx + 1} generated an exception: {exc}")
                    # Fallback: Just return original jobs for this batch
                    for local_idx, job in enumerate(batch_data):
                        global_idx = batch_idx * BATCH_SIZE + local_idx
                        results_map[global_idx] = {**job, "_error": str(exc)}

        # Reconstruct list in order
        final_results = []
        for i in range(len(jobs)):
            if i in results_map:
                final_results.append(results_map[i])
            else:
                final_results.append(jobs[i])

        return final_results
