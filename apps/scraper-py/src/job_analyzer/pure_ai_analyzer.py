import json
import os
import subprocess
import concurrent.futures
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

    def _call_ai_function(self, function_name: str, description: str) -> Dict[str, Any]:
        """Call Node.js AI function via subprocess"""
        try:
            # Escape special characters
            safe_description = (
                description.replace('"', '\\"').replace("\n", "\\n").replace("\r", "")
            )

            cmd = ["node", self.ai_script, function_name, safe_description]

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=15,
                cwd=os.path.dirname(self.ai_script),
            )

            if result.returncode == 0:
                return json.loads(result.stdout.strip())
            else:
                print(f"AI function {function_name} failed: {result.stderr}")
                return {}

        except subprocess.TimeoutExpired:
            print(f"AI function {function_name} timed out")
            return {}
        except json.JSONDecodeError as e:
            print(f"Failed to parse AI response: {e}")
            return {}
        except Exception as e:
            print(f"Error calling AI function {function_name}: {e}")
            return {}

    def analyze_pure_ai(self, description: str) -> Dict[str, Any]:
        """Perform full AI analysis without rule-based fallback"""
        if not self.ai_available:
            return {"error": "AI not available"}

        # Run all 6 AI function calls in parallel using ThreadPoolExecutor
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
            futures = {
                "job_type": executor.submit(
                    self._call_ai_function, "job_type", description
                ),
                "language": executor.submit(
                    self._call_ai_function, "language", description
                ),
                "experience_level": executor.submit(
                    self._call_ai_function, "experience_level", description
                ),
                "education_level": executor.submit(
                    self._call_ai_function, "education_level", description
                ),
                "skills": executor.submit(
                    self._call_ai_function, "skills", description
                ),
                "responsibilities": executor.submit(
                    self._call_ai_function, "responsibilities", description
                ),
            }

            # Collect results
            results = {name: future.result() for name, future in futures.items()}

        # Process results as before
        # 1. Job Type
        job_type_res = results["job_type"]
        job_type = job_type_res.get("job_type", [])
        if isinstance(job_type, str):
            job_type = [job_type]

        # 2. Language
        lang_res = results["language"]
        language_data = lang_res.get("languages", {"required": [], "advantage": []})

        # 3. Experience Level
        exp_res = results["experience_level"]
        experience_level = exp_res.get("level", "unknown")

        # 4. Education Level
        edu_res = results["education_level"]
        education_level = edu_res.get("education_level", [])
        if isinstance(education_level, str):
            education_level = [education_level]

        # 5. Skills
        skills_res = results["skills"]
        raw_skills = skills_res.get("skills", {})

        # Map JS skill categories to Python categories
        skill_type = {
            "programming": raw_skills.get("technical", []),
            "soft_skills": raw_skills.get("soft_skills", []),
            "domain_specific": raw_skills.get("domain_specific", []),
            "certificate": raw_skills.get("certifications", []),
            "other": raw_skills.get("other", []),
        }

        # Ensure all values are lists
        for key in skill_type:
            if not isinstance(skill_type[key], list):
                skill_type[key] = []

        # 6. Responsibilities
        resp_res = results["responsibilities"]
        responsibilities = resp_res.get("responsibilities", [])

        return {
            "job_type": job_type,
            "language": language_data,
            "experience_level": experience_level,
            "education_level": education_level,
            "skill_type": skill_type,
            "responsibilities": responsibilities,
            "_metadata": {"analysis_method": "pure_ai", "ai_available": True},
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
