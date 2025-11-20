"""AI-enhanced job description analysis via Node.js"""

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

    def enhance_experience_level(self, description: str, rule_based_level: str) -> str:
        """Enhance experience level using AI for unknown cases"""
        if not self.ai_available or rule_based_level != "unknown":
            return rule_based_level

        try:
            result = self._call_ai_function("experience_level", description)
            return result.get("level", rule_based_level)
        except Exception as e:
            print(f"AI experience level enhancement failed: {e}")
            return rule_based_level

    def enhance_skills(
        self, description: str, rule_based_skills: Dict[str, list]
    ) -> Dict[str, list]:
        """Enhance skill extraction using AI"""
        if not self.ai_available:
            return rule_based_skills

        try:
            result = self._call_ai_function("skills", description)
            ai_skills = result.get("skills", {})

            enhanced = rule_based_skills.copy()
            for category, skills in ai_skills.items():
                if category in enhanced:
                    # Add unique AI-found skills
                    for skill in skills:
                        if skill not in enhanced[category]:
                            enhanced[category].append(skill)
                else:
                    enhanced[category] = skills

            return enhanced
        except Exception as e:
            print(f"AI skills enhancement failed: {e}")
            return rule_based_skills

    def enhance_responsibilities(self, description: str, rule_based_resp: list) -> list:
        """Enhance responsibility extraction using AI"""
        if not self.ai_available:
            return rule_based_resp

        try:
            result = self._call_ai_function("responsibilities", description)
            ai_resp = result.get("responsibilities", [])

            combined = list(set(rule_based_resp + ai_resp))
            return combined[:15]
        except Exception as e:
            print(f"AI responsibilities enhancement failed: {e}")
            return rule_based_resp

    def enhance_job_type(self, description: str, rule_based_type: list) -> list:
        """Enhance job type extraction using AI"""
        if not self.ai_available:
            return rule_based_type

        try:
            result = self._call_ai_function("job_type", description)
            ai_type = result.get("job_type", [])

            # If AI returns a string, convert to list
            if isinstance(ai_type, str):
                ai_type = [ai_type]

            combined = list(set(rule_based_type + ai_type))
            return combined
        except Exception as e:
            print(f"AI job type enhancement failed: {e}")
            return rule_based_type

    def enhance_languages(self, description: str, rule_based_langs: list) -> list:
        """Enhance language extraction using AI"""
        if not self.ai_available:
            return rule_based_langs

        try:
            result = self._call_ai_function(
                "language", description
            )  # Changed to "language"
            ai_langs = result.get("languages", [])

            combined = list(set(rule_based_langs + ai_langs))
            return combined
        except Exception as e:
            print(f"AI languages enhancement failed: {e}")
            return rule_based_langs

    def enhance_education(self, description: str, rule_based_edu: list) -> list:
        """Enhance education extraction using AI"""
        if not self.ai_available:
            return rule_based_edu

        try:
            result = self._call_ai_function(
                "education_level", description
            )  # Changed to "education_level"
            ai_edu = result.get("education_level", "")

            if isinstance(ai_edu, str) and ai_edu:
                ai_edu = [ai_edu]
            elif not isinstance(ai_edu, list):
                ai_edu = []

            combined = list(set(rule_based_edu + ai_edu))
            return combined if combined else rule_based_edu
        except Exception as e:
            print(f"AI education enhancement failed: {e}")
            return rule_based_edu

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
                timeout=30,
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


class HybridJobAnalyzer:
    """Combined rule-based and AI-enhanced analysis"""

    def __init__(self):
        from .base_analyzer import BaseJobAnalyzer

        self.rule_analyzer = BaseJobAnalyzer()
        self.ai_analyzer = AIAnalyzer()

    def analyze_job(self, description: str) -> Dict[str, Any]:
        """Analyze job using rule-based + AI methods"""

        # Rule-based extraction
        analysis = self.rule_analyzer.analyze_job(description)

        # AI enhancement (Conditional)

        # 1. Job Type
        if not analysis.get("job_type"):
            analysis["job_type"] = self.ai_analyzer.enhance_job_type(
                description, analysis.get("job_type", [])
            )

        # 2. Language - Extract required list for AI enhancement
        required_langs = analysis["language"].get("required", [])
        advantage_langs = analysis["language"].get("advantage", [])

        if not required_langs and not advantage_langs:
            # Combine both lists for AI enhancement
            all_langs = required_langs + advantage_langs
            enhanced_langs = self.ai_analyzer.enhance_languages(description, all_langs)
            # Put enhanced languages back in required
            analysis["language"]["required"] = enhanced_langs

        # 3. Experience Level
        if analysis["experience_level"] == "unknown":
            analysis["experience_level"] = self.ai_analyzer.enhance_experience_level(
                description, analysis["experience_level"]
            )

        # 4. Education Level
        if not analysis["education_level"]:
            analysis["education_level"] = self.ai_analyzer.enhance_education(
                description, analysis["education_level"]
            )

        # 5. Skills
        has_skills = any(analysis["skill_type"].values())
        if not has_skills:
            analysis["skill_type"] = self.ai_analyzer.enhance_skills(
                description, analysis["skill_type"]
            )

        # 6. Responsibilities
        if not analysis["responsibilities"]:
            analysis["responsibilities"] = self.ai_analyzer.enhance_responsibilities(
                description, analysis["responsibilities"]
            )

        # Add analysis metadata
        analysis["_metadata"] = {
            "ai_enhanced": self.ai_analyzer.ai_available,
            "analysis_method": (
                "hybrid" if self.ai_analyzer.ai_available else "rule_based"
            ),
        }

        return analysis
