#!/usr/bin/env python3
"""
Unit tests for Pure AI Job Analyzer
Tests encoding handling and subprocess mocking
"""

import json
import os
import subprocess
import unittest
from unittest.mock import patch, MagicMock
from pathlib import Path

# Add src directory to path
import sys
import os

# Add the src directory to Python path
src_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src"))
sys.path.insert(0, src_path)

# Import directly to avoid package issues
import importlib.util

pure_ai_analyzer_path = os.path.join(src_path, "job_analyzer", "pure_ai_analyzer.py")
spec = importlib.util.spec_from_file_location("pure_ai_analyzer", pure_ai_analyzer_path)
pure_ai_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pure_ai_module)
AIAnalyzer = pure_ai_module.AIAnalyzer
PureAIJobAnalyzer = pure_ai_module.PureAIJobAnalyzer


class TestAIAnalyzer(unittest.TestCase):
    """Test AIAnalyzer class with mocked subprocess calls"""

    def setUp(self):
        """Set up test fixtures"""
        self.analyzer = AIAnalyzer()
        # Mock the AI script path check
        with patch("os.path.exists", return_value=True):
            self.analyzer.ai_available = True

    @patch("subprocess.run")
    def test_call_batch_analysis_success(self, mock_run):
        """Test successful batch analysis with proper encoding"""
        # Mock successful subprocess result with UTF-8 content
        mock_result = MagicMock()
        mock_result.returncode = 0
        mock_result.stdout = json.dumps(
            [
                {
                    "job_type": ["full-time"],
                    "language": {
                        "languages": {"required": ["English"], "advantage": ["Finnish"]}
                    },
                    "experience_level": {"level": "junior"},
                    "education_level": ["bachelor"],
                    "skill_type": {
                        "skills": {
                            "technical": ["Python", "JavaScript"],
                            "soft_skills": ["Communication"],
                        }
                    },
                    "responsibilities": ["Develop software", "Write tests"],
                }
            ]
        )
        mock_result.stderr = ""
        mock_run.return_value = mock_result

        jobs = [{"description": "Test job description"}]
        result = self.analyzer._call_batch_analysis(jobs)

        # Verify subprocess.run was called with correct parameters
        mock_run.assert_called_once()
        call_args = mock_run.call_args
        self.assertIn("env", call_args.kwargs)
        env = call_args.kwargs["env"]
        self.assertEqual(env["PYTHONIOENCODING"], "utf-8")
        self.assertEqual(call_args.kwargs["encoding"], "utf-8")
        self.assertTrue(call_args.kwargs["text"])

        # Verify result parsing
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["job_type"], ["full-time"])

    @patch("subprocess.run")
    def test_call_batch_analysis_unicode_content(self, mock_run):
        """Test batch analysis with Unicode characters (emojis, special chars)"""
        # Mock result with Unicode content
        unicode_response = [
            {
                "job_type": ["full-time"],
                "language": {
                    "languages": {
                        "required": ["English"],
                        "advantage": ["中文", "Español"],
                    }
                },
                "experience_level": {"level": "senior"},
                "education_level": ["master"],
                "skill_type": {
                    "skills": {
                        "technical": ["Python", "React", "Node.js"],
                        "soft_skills": ["Team collaboration", "Problem solving 🚀"],
                    }
                },
                "responsibilities": [
                    "Lead development team",
                    "Mentor junior developers",
                    "Code reviews 📋",
                ],
            }
        ]

        mock_result = MagicMock()
        mock_result.returncode = 0
        mock_result.stdout = json.dumps(unicode_response, ensure_ascii=False)
        mock_result.stderr = ""
        mock_run.return_value = mock_result

        jobs = [
            {"description": "Senior developer role with leadership responsibilities 🚀"}
        ]
        result = self.analyzer._call_batch_analysis(jobs)

        # Verify Unicode handling
        self.assertEqual(len(result), 1)
        self.assertIn("中文", result[0]["language"]["languages"]["advantage"])
        self.assertIn("🚀", result[0]["skill_type"]["skills"]["soft_skills"][1])
        self.assertIn("📋", result[0]["responsibilities"][2])

    @patch("subprocess.run")
    def test_call_batch_analysis_empty_response(self, mock_run):
        """Test handling of empty response from subprocess"""
        mock_result = MagicMock()
        mock_result.returncode = 0
        mock_result.stdout = ""  # Empty response
        mock_result.stderr = ""
        mock_run.return_value = mock_result

        jobs = [{"description": "Test job"}]
        result = self.analyzer._call_batch_analysis(jobs)

        self.assertEqual(result, [])

    @patch("subprocess.run")
    def test_call_batch_analysis_invalid_json(self, mock_run):
        """Test handling of invalid JSON response"""
        mock_result = MagicMock()
        mock_result.returncode = 0
        mock_result.stdout = "invalid json response"
        mock_result.stderr = ""
        mock_run.return_value = mock_result

        jobs = [{"description": "Test job"}]
        result = self.analyzer._call_batch_analysis(jobs)

        self.assertEqual(result, [])

    @patch("subprocess.run")
    def test_call_batch_analysis_subprocess_error(self, mock_run):
        """Test handling of subprocess errors"""
        mock_result = MagicMock()
        mock_result.returncode = 1
        mock_result.stdout = ""
        mock_result.stderr = "Node.js error: missing API key"
        mock_run.return_value = mock_result

        jobs = [{"description": "Test job"}]
        result = self.analyzer._call_batch_analysis(jobs)

        self.assertEqual(result, [])

    def test_analyze_pure_ai_success(self):
        """Test successful pure AI analysis"""
        with patch.object(self.analyzer, "_call_batch_analysis") as mock_batch:
            mock_batch.return_value = [
                {
                    "job_type": ["full-time"],
                    "language": {
                        "languages": {"required": ["English"], "advantage": []}
                    },
                    "experience_level": {"level": "mid"},
                    "education_level": ["bachelor"],
                    "skill_type": {
                        "skills": {"technical": ["Python"], "soft_skills": []}
                    },
                    "responsibilities": ["Write code", "Test software"],
                }
            ]

            result = self.analyzer.analyze_pure_ai("Test description")

            self.assertEqual(result["job_type"], ["full-time"])
            self.assertEqual(
                result["language"], {"required": ["English"], "advantage": []}
            )
            self.assertEqual(result["experience_level"], "mid")
            self.assertEqual(result["education_level"], ["bachelor"])
            self.assertEqual(result["skill_type"]["technical"], ["Python"])
            self.assertEqual(
                result["responsibilities"], ["Write code", "Test software"]
            )

    def test_analyze_pure_ai_batch_failure(self):
        """Test pure AI analysis when batch analysis fails"""
        with patch.object(self.analyzer, "_call_batch_analysis", return_value=[]):
            result = self.analyzer.analyze_pure_ai("Test description")

            self.assertEqual(result, {"error": "Batch analysis failed"})

    def test_analyze_pure_ai_not_available(self):
        """Test pure AI analysis when AI is not available"""
        self.analyzer.ai_available = False
        result = self.analyzer.analyze_pure_ai("Test description")

        self.assertEqual(result, {"error": "AI not available"})


class TestPureAIJobAnalyzer(unittest.TestCase):
    """Test PureAIJobAnalyzer class"""

    def setUp(self):
        """Set up test fixtures"""
        self.analyzer = PureAIJobAnalyzer()

    def test_analyze_job_success(self):
        """Test successful job analysis"""
        # Mock the AIAnalyzer.analyze_pure_ai method directly
        with patch.object(self.analyzer.ai_analyzer, "analyze_pure_ai") as mock_analyze:
            mock_analyze.return_value = {
                "job_type": ["full-time"],
                "language": {"required": ["English"], "advantage": []},
                "experience_level": "junior",
                "education_level": ["bachelor"],
                "skill_type": {"technical": ["Python"], "soft_skills": []},
                "responsibilities": ["Develop software"],
            }

            job = {
                "title": "Software Developer",
                "description": "We are looking for a developer...",
                "company": "Test Corp",
            }

            result = self.analyzer.analyze_job(job)

            # Verify analysis is merged into original job
            self.assertEqual(result["title"], "Software Developer")
            self.assertEqual(result["company"], "Test Corp")
            self.assertEqual(result["job_type"], ["full-time"])
            self.assertEqual(result["language"]["required"], ["English"])

    def test_analyze_job_no_description(self):
        """Test job analysis with missing description"""
        # Mock the AIAnalyzer.analyze_pure_ai method directly
        with patch.object(self.analyzer.ai_analyzer, "analyze_pure_ai") as mock_analyze:
            mock_analyze.return_value = {"error": "No description"}

            job = {"title": "Test Job"}  # No description
            result = self.analyzer.analyze_job(job)

            # Should still merge the analysis result
            self.assertEqual(result["title"], "Test Job")
            self.assertEqual(result["error"], "No description")


if __name__ == "__main__":
    unittest.main()
