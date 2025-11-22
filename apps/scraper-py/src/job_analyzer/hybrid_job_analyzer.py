"""Pure hybrid job analysis engine - terminal output only"""

from typing import Any, Dict


class HybridJobAnalyzer:
    """Two-stage analysis: Base analyzer foundation + AI override enhancement"""

    def __init__(self):
        from .base_analyzer import BaseJobAnalyzer
        from .pure_ai_analyzer import PureAIJobAnalyzer

        self.base_analyzer = BaseJobAnalyzer()
        self.ai_analyzer = PureAIJobAnalyzer()

    def analyze_job(self, job: Dict[str, Any]) -> Dict[str, Any]:
        """Two-stage analysis with AI override

        Process:
        1. Base analyzer (regex) - fast foundation
        2. AI analyzer (machine learning) - enhancement layer
        3. Merge: AI results override base results

        Benefits:
        - Base provides quick, reliable baseline
        - AI enhances with superior accuracy and fills gaps
        - Simple override: no complex merger logic
        """
        print(f"🔍 Analyzing: {job.get('title', 'Unknown')}")

        # Stage 1: Base analysis foundation
        base_result = self.base_analyzer.analyze_job(job.copy())
        print(
            f"   🔧 Base: job_type={len(base_result.get('job_type', []))}"
            f"   🔧 Base: education={len(base_result.get('education_level', []))}"
            f"   🔧 Base: experience={base_result.get('experience_level', '')}"
            f"   🔧 Base: languages={
                sum(len(v) for v in base_result.get('language', {}).values())}"
            f"   🔧 Base: skills={
                sum(len(v) for v in base_result.get('skill_type', {}).values())}"
        )

        # Stage 2: AI analysis enhancement
        ai_result = self.ai_analyzer.analyze_job(job.copy())
        print(
            f"   🤖 AI: job_type={
                len(ai_result.get('job_type', []))}"
            f"   🤖 AI: education={
                len(ai_result.get('education_level', []))}"
            f"   🤖 AI: experience={
                ai_result.get('experience_level', '')}"
            f"   🤖 AI: languages={
                sum(len(v) for v in ai_result.get('language', {}).values())}"
            f"   🤖 AI: skills={
                sum(len(v) for v in ai_result.get('skill_type', {}).values())}"
        )

        # Merge with AI override: base first, AI on top
        # {**base_result, **ai_result} means AI fields replace base fields
        merged = {**base_result, **ai_result}

        # Ensure original job data is preserved in merge
        merged.update(job)  # Put original job fields on top

        # Enhanced metadata tracking both stages
        merged["_metadata"] = {
            "combined_analysis": True,
            "rule_based_used": True,
            "ai_used": self.ai_analyzer.ai_analyzer.ai_available,
            "merge_strategy": "ai_override",
            "pipeline_version": "hybrid_base_ai_v1",
            "base_stage": {
                "job_type_detected": len(base_result.get("job_type", [])) > 0,
                "experience_known": base_result.get("experience_level") != "",
                "skills_found": any(base_result.get("skill_type", {}).values()),
            },
            "ai_stage": {
                "enhanced_job_type": len(ai_result.get("job_type", [])) > 0,
                "enhanced_languages": any(ai_result.get("language", {}).values()),
                "enhanced_skills": any(ai_result.get("skill_type", {}).values()),
            },
        }

        return merged

    def analyze_batch(self, jobs: list[Dict[str, Any]]) -> list[Dict[str, Any]]:
        """Analyze multiple jobs, terminal output only"""
        print(f"\n🔄 Processing {len(jobs)} jobs with hybrid engine...")

        processed_jobs = []
        for job_index, job in enumerate(jobs):
            enhanced_job = self.analyze_job(job)
            processed_jobs.append(enhanced_job)

        print(f"✅ Analysis complete - {len(processed_jobs)} jobs processed")

        return processed_jobs
