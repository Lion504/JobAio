import json
import os
import subprocess
from typing import Any, Dict


class AIAnalyzer:
    """AI analysis wrapper for Node.js functions"""

    def __init__(self):
        # Resolve path to Node.js AI script
        current_dir = os.path.dirname(os.path.abspath(__file__))
        workspace_root = os.path.abspath(
            os.path.join(current_dir, "..", "..", "..", "..")
        )
        self.ai_script = os.path.join(
            workspace_root,
            "packages",
            "ai",
            "src",
            "job_analysis.js",
        )
        self.ai_script = os.path.normpath(self.ai_script)

        # Check AI script availability
        if not os.path.exists(self.ai_script):
            print("Warning: AI script not found at", self.ai_script)
            self.ai_available = False
        else:
            self.ai_available = True

    def _call_node_process(self, payload: str) -> Any:
        try:
            # Pass "-" as argument to tell Node script to read from stdin
            # logic: node job_analysis.js "-"
            cmd = ["node", self.ai_script, "-"]

            # Force UTF-8 encoding
            env = os.environ.copy()
            env["PYTHONIOENCODING"] = "utf-8"

            result = subprocess.run(
                cmd,
                input=payload,
                capture_output=True,
                timeout=120,
                cwd=os.path.dirname(self.ai_script),
                text=True,
                encoding="utf-8",
                env=env,
            )

            if result.returncode == 0:
                try:
                    response_text = result.stdout.strip()
                    if not response_text:
                        print("⚠️ Warning: Empty response from AI analysis")
                        return []
                    return json.loads(response_text)
                except json.JSONDecodeError as e:
                    print(f"❌ Failed to parse AI response: {e}")
                    return []
            else:
                print(
                    f"❌ AI analysis failed (code {result.returncode}): {result.stderr}"
                )
                return []

        except subprocess.TimeoutExpired:
            print("AI analysis timed out")
            return []
        except Exception as e:
            print(f"Error calling AI analysis: {e}")
            return []

    def analyze_batch_unified(self, jobs: list) -> list:
        """Call Node.js unified batch analysis for multiple jobs"""
        if not self.ai_available:
            return jobs  # Return unprocessed

        # Convert jobs to JSON string
        jobs_json = json.dumps(jobs)

        # Call Node script (function name implicit in JS now)
        analyzed_jobs = self._call_node_process(jobs_json)

        if not analyzed_jobs or not isinstance(analyzed_jobs, list):
            print("❌ Unified batch analysis returned invalid data")
            return jobs

        return analyzed_jobs

    def analyze_pure_ai(self, description: str) -> Dict[str, Any]:
        """Legacy single analysis (wraps into batch)"""
        # implementation for single job backward compatibility
        if not self.ai_available:
            return {"error": "AI not available"}

        # Reuse batch logic for consistency
        result_list = self.analyze_batch_unified([{"description": description}])
        if result_list and len(result_list) > 0:
            return result_list[0]
        return {}


class PureAIJobAnalyzer:
    """Pure AI analysis without rule-based fallback"""

    def __init__(self):
        self.ai_analyzer = AIAnalyzer()
        self.logs_dir = os.path.join(
            os.path.dirname(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            ),
            "logs",
        )
        if not os.path.exists(self.logs_dir):
            os.makedirs(self.logs_dir)

    def analyze_job(self, job: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze job using only AI and merge analysis into original job data"""
        description = job.get("description", "")
        # Use the legacy wrapper
        analysis = self.ai_analyzer.analyze_pure_ai(description)
        # Merge analysis into the original job data
        return {**job, **analysis}

    def analyze_batch(self, jobs: list[Dict[str, Any]]) -> list[Dict[str, Any]]:
        """Analyze a batch of jobs efficiently"""
        return self.ai_analyzer.analyze_batch_unified(jobs)
