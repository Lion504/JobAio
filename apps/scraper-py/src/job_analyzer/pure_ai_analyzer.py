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

    def _call_batch_analysis(self, jobs: list) -> list:
        """Call Node.js batch analysis for multiple jobs"""
        try:
            # Convert jobs to JSON string
            jobs_json = json.dumps(jobs)

            cmd = ["node", self.ai_script, "batch", jobs_json]

            # Force UTF-8 encoding to handle Node.js Unicode output (emojis)
            env = os.environ.copy()
            env["PYTHONIOENCODING"] = "utf-8"

            result = subprocess.run(
                cmd,
                capture_output=True,
                timeout=15,
                cwd=os.path.dirname(self.ai_script),
                text=True,
            )

            if result.returncode == 0:
                try:
                    response_text = result.stdout.strip()
                    if not response_text:
                        print("⚠️ Warning: Empty response from batch AI analysis")
                        return []
                    return json.loads(response_text)
                except json.JSONDecodeError as e:
                    print(f"❌ Failed to parse batch AI response: {e}")
                    return []
            else:
                print(
                    f"❌ Batch AI analysis failed: "
                    f"(exit code {result.returncode}): {result.stderr}"
                )
                return []

        except subprocess.TimeoutExpired:
            print("Batch AI analysis timed out")
            return []
        except json.JSONDecodeError as e:
            print(f"Failed to parse batch AI response: {e}")
            return []
        except Exception as e:
            print(f"Error calling batch AI analysis: {e}")
            return []

    def analyze_pure_ai(self, description: str) -> Dict[str, Any]:
        """Perform full AI analysis using batch processing"""
        if not self.ai_available:
            return {"error": "AI not available"}

        # Create a single-job batch for analysis
        job_batch = [{"description": description}]
        analyzed_jobs = self._call_batch_analysis(job_batch)

        if not analyzed_jobs or len(analyzed_jobs) == 0:
            return {"error": "Batch analysis failed"}

        # Extract the single job result
        result = analyzed_jobs[0]

        # Process and format the results to match expected structure
        # 1. Job Type
        job_type = result.get("job_type", [])
        if isinstance(job_type, dict) and "job_type" in job_type:
            job_type = (
                [job_type["job_type"]]
                if isinstance(job_type["job_type"], str)
                else job_type["job_type"]
            )
        elif isinstance(job_type, str):
            job_type = [job_type]
        elif not isinstance(job_type, list):
            job_type = []

        # 2. Language
        language_data = result.get("language", {})
        if isinstance(language_data, dict) and "languages" in language_data:
            language_data = language_data["languages"]
        if not isinstance(language_data, dict):
            language_data = {"required": [], "advantage": []}

        # 3. Experience Level
        experience_level = result.get("experience_level", "unknown")
        if isinstance(experience_level, dict) and "level" in experience_level:
            experience_level = experience_level["level"]
        if not isinstance(experience_level, str):
            experience_level = "unknown"

        # 4. Education Level
        education_level = result.get("education_level", [])
        if isinstance(education_level, dict) and "education_level" in education_level:
            education_level = (
                [education_level["education_level"]]
                if isinstance(education_level["education_level"], str)
                else education_level["education_level"]
            )
        elif isinstance(education_level, str):
            education_level = [education_level]
        elif not isinstance(education_level, list):
            education_level = []

        # 5. Skills
        skill_type_data = result.get("skill_type", {})
        if isinstance(skill_type_data, dict) and "skills" in skill_type_data:
            skill_type_data = skill_type_data["skills"]

        # Map to expected structure
        skill_type = {
            "technical": (
                skill_type_data.get("technical", [])
                if isinstance(skill_type_data, dict)
                else []
            ),
            "domain_specific": (
                skill_type_data.get("domain_specific", [])
                if isinstance(skill_type_data, dict)
                else []
            ),
            "certifications": (
                skill_type_data.get("certifications", [])
                if isinstance(skill_type_data, dict)
                else []
            ),
            "soft_skills": (
                skill_type_data.get("soft_skills", [])
                if isinstance(skill_type_data, dict)
                else []
            ),
            "other": (
                skill_type_data.get("other", [])
                if isinstance(skill_type_data, dict)
                else []
            ),
        }

        # Ensure all values are lists
        for key in skill_type:
            if not isinstance(skill_type[key], list):
                skill_type[key] = []

        # 6. Responsibilities
        responsibilities = result.get("responsibilities", [])
        if (
            isinstance(responsibilities, dict)
            and "responsibilities" in responsibilities
        ):
            responsibilities = responsibilities["responsibilities"]
        if not isinstance(responsibilities, list):
            responsibilities = []

        return {
            "job_type": job_type,
            "language": language_data,
            "experience_level": experience_level,
            "education_level": education_level,
            "skill_type": skill_type,
            "responsibilities": responsibilities,
            "_metadata": {"analysis_method": "pure_ai_batch", "ai_available": True},
        }


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
        analysis = self.ai_analyzer.analyze_pure_ai(description)
        # Merge analysis into the original job data
        return {**job, **analysis}
