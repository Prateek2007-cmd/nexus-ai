"""LLM Client — Groq API client with auto-failover, fallback, and synthesis."""

from __future__ import annotations
import json
import logging
import os
from typing import Any
import httpx

from app.rag.pipeline import citation_picks

logger = logging.getLogger(__name__)

GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "llama3-8b-8192",
    "gemma2-9b-it",
]

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


class LLMClient:
    """Async Groq LLM client with model cascade and automatic fallback."""

    def __init__(self, api_key: str | None = None) -> None:
        self.api_key = api_key or os.getenv("GROQ_API_KEY", "")
        if not self.api_key:
            logger.warning("GROQ_API_KEY not set. LLM synthesis will use deterministic fallback mode.")

    @property
    def is_available(self) -> bool:
        return bool(self.api_key)

    async def generate(
        self,
        prompt: str,
        system: str | None = None,
        temperature: float = 0.5,
        max_tokens: int = 1024,
    ) -> str:
        """Generate response with automatic model cascading on error/rate-limit."""
        if not self.api_key:
            return ""

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        for model in GROQ_MODELS:
            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(GROQ_API_URL, headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        return data["choices"][0]["message"]["content"]
                    else:
                        logger.warning("groq_model_failed", model=model, status=resp.status_code, body=resp.text[:200])
            except Exception as e:
                logger.warning("groq_model_error", model=model, error=str(e))

        return ""

    async def synthesize(
        self,
        query: str,
        merged_data: dict[str, Any],
        results: list,
        student_profile: dict[str, Any] | None = None,
    ) -> str:
        """Synthesize a dynamic response using LLM or deterministic agent data renderer."""
        profile = student_profile or {}
        st_name = profile.get("name") or "Student"
        st_roll = profile.get("rollNumber") or "Student ID"
        st_cgpa = profile.get("cgpa") if profile.get("cgpa") is not None and profile.get("cgpa") > 0 else 8.0
        st_dept = profile.get("department") or "CSE"
        st_sem = profile.get("semester") or 6
        st_att = profile.get("attendance") if profile.get("attendance") is not None and profile.get("attendance") > 0 else 85.0

        q_clean = query.strip().lower()

        # 1. Greetings & Personal Identity Handling
        if any(q_clean == kw or q_clean.startswith(kw + " ") or q_clean.endswith(" " + kw) for kw in ["hi", "hello", "hey", "greetings", "good morning", "good afternoon", "good evening", "whats up", "sup"]):
            return (
                f"👋 **Hello {st_name}! Welcome to CampusX AI.**\n\n"
                f"How can I help you today? I'm connected to your active profile (`{st_roll}` · {st_dept} Sem {st_sem}).\n\n"
                "You can ask me things like:\n"
                "- 📊 *'What is my CGPA and attendance?'*\n"
                "- 💼 *'Am I eligible for Google or Tesla placement drive?'*\n"
                "- 🎪 *'Tell me about the AI Systems Workshop'*\n"
                "- 📚 *'What are the examination regulations?'*"
            )

        if "name" in q_clean and ("my" in q_clean or "what" in q_clean or "who" in q_clean):
            return f"Your registered student name is **{st_name}** (`{st_roll}`) enrolled in **{st_dept} (Semester {st_sem})** with current CGPA **{st_cgpa}**!"

        if "who are you" in q_clean or "what can you do" in q_clean or "what are you" in q_clean:
            return f"I am **CampusX AI**, your autonomous multi-agent campus assistant. I track your academics, evaluate placement eligibility, register campus workshops, draft emails, and look up campus policies for **{st_name}**."

        if "how are you" in q_clean or "how do you do" in q_clean:
            return f"I'm doing great, **{st_name}**! Ready to assist you with your academics, placement drives, workshops, or campus information. How can I help you right now?"

        # 2. Attempt LLM generation first with explicit student context
        context_parts = [
            f"[Active Student Profile]: Name: {st_name}, Roll No: {st_roll}, CGPA: {st_cgpa}, Branch: {st_dept}, Semester: {st_sem}, Attendance: {st_att}%"
        ]
        for r in results:
            if hasattr(r, "success") and r.success and hasattr(r, "data") and r.data:
                data_str = json.dumps(r.data, default=str)
                sources = ", ".join(r.sources) if hasattr(r, "sources") and r.sources else "campus DB"
                context_parts.append(f"[{r.agent_id} Data]: {data_str} (source: {sources})")

        context = "\n".join(context_parts)

        lang_pref = profile.get("language") or "English"

        system_prompt = f"""You are CampusX AI, the friendly, intelligent multi-agent campus assistant.
Answer the student's question accurately, naturally, and warmly using the student profile and agent data provided.
The active student asking is {st_name} (Roll: {st_roll}, CGPA: {st_cgpa}, Branch: {st_dept}, Attendance: {st_att}%).
Always use the exact dynamic student profile values from the context.
If the student is engaging in casual chat, reply warmly and naturally without rigid grounded document tags.
Format your answer with markdown bolding, bullet points, and markdown tables where appropriate. Be natural, helpful, and concise.

CRITICAL INSTRUCTION: You must output your final response exclusively in the {lang_pref} language. Do not mix languages."""

        prompt = f"""Student question: "{query}"

Real-time agent findings & profile:
{context}

Provide a personalized dynamic response based strictly on the facts above."""

        res = await self.generate(prompt, system=system_prompt, temperature=0.6)
        if res:
            return res

        # 3. Grounded Deterministic Synthesizer Engine (Runs when LLM API rate limits occur)
        sections = []
        
        sorted_results = sorted(results, key=lambda r: 1 if getattr(r, "agent_id", "") == "knowledge" else 0)

        for r in sorted_results:
            if hasattr(r, "success") and r.success and hasattr(r, "data") and r.data:
                agent_id = getattr(r, "agent_id", "Agent")
                agent_name = agent_id.title()
                data = r.data

                summary = data.get("summary") or data.get("answer")
                if summary:
                    sections.append(f"### 📍 {agent_name} Agent\n{summary}")

                if "schedule" in data and isinstance(data["schedule"], list) and data["schedule"]:
                    rows = [f"| {s.get('slot','')} | **{s.get('course','')}** | Room {s.get('room','')} |" for s in data["schedule"]]
                    table = "| Time Slot | Course | Venue |\n| :--- | :--- | :--- |\n" + "\n".join(rows)
                    sections.append(f"**Class Schedule:**\n\n{table}")

                if "courses" in data and isinstance(data["courses"], list) and data["courses"]:
                    rows = [f"| `{c.get('code','')}` | {c.get('name','')} | **{c.get('attendance',0)}%** |" for c in data["courses"]]
                    table = "| Code | Subject | Attendance |\n| :--- | :--- | :--- |\n" + "\n".join(rows)
                    sections.append(f"**Course Attendance Breakdown:**\n\n{table}")

                if "events" in data and isinstance(data["events"], list) and data["events"]:
                    event_rows = [
                        f"| **{e.get('title','')}** | {e.get('org','')} | {e.get('date','')} | {e.get('seats',0)} seats | {e.get('venue','Campus')} |"
                        for e in data["events"]
                    ]
                    if event_rows:
                        table = "| Event Title | Organizer | Date | Availability | Location |\n| :--- | :--- | :--- | :--- | :--- |\n" + "\n".join(event_rows)
                        sections.append(f"**Campus Events & Workshops:**\n\n{table}")

                if "opportunities" in data and isinstance(data["opportunities"], list) and data["opportunities"]:
                    opp_rows = [
                        f"| **{o.get('company','')}** | {o.get('role','')} | {o.get('stipend', o.get('ctc','N/A'))} | Cutoff ≥ {o.get('min_cgpa', 7.0)} | {o.get('deadline','Open')} |"
                        for o in data["opportunities"]
                    ]
                    if opp_rows:
                        table = "| Company | Role | Package / Stipend | Cutoff | Deadline |\n| :--- | :--- | :--- | :--- | :--- |\n" + "\n".join(opp_rows)
                        sections.append(f"**Placement & Internship Drives:**\n\n{table}")

                if agent_id == "knowledge" and "chunks" in data and isinstance(data["chunks"], list) and data["chunks"]:
                    # Prefer regulation-type docs (handbooks/policies/circulars)
                    # over reference textbooks so citations stay on-topic — e.g.
                    # no textbook pages for a "library rules" query. Concept
                    # questions (best match is a textbook) keep the fused order.
                    citation_chunks = citation_picks(data["chunks"])
                    chunk_list = []
                    for c in citation_chunks:
                        doc_title = c.get("doc") or (c.get("metadata", {}).get("document_id") if isinstance(c.get("metadata"), dict) else "Campus Policy")
                        snippet = c.get("text") or c.get("content") or ""
                        if snippet:
                            chunk_list.append(f"- 📄 **{doc_title}**: {snippet}")
                    if chunk_list:
                        sections.append("**Grounded Regulations & Citations:**\n" + "\n".join(chunk_list))

        if sections:
            return "\n\n".join(sections)

        if any(w in q_clean for w in ["cgpa", "grade", "gpa", "attendance", "marks"]):
            return (
                f"### 📊 Academic Summary for **{st_name}** (`{st_roll}`)\n\n"
                f"- **Cumulative Grade Point Average (CGPA)**: `{st_cgpa} / 10.0`\n"
                f"- **Overall Attendance**: `{st_att}%`\n"
                f"- **Current Semester**: Semester {st_sem} ({st_dept})\n"
                f"- **Active Backlogs**: `0`"
            )

        if any(w in q_clean for w in ["eligib", "intern", "job", "drive", "company", "placement"]):
            is_elig = st_cgpa >= 7.5
            return (
                f"### 🎓 Placement Eligibility Report for **{st_name}**\n\n"
                f"- **Student Roll Number**: `{st_roll}`\n"
                f"- **Your CGPA**: `{st_cgpa}`\n"
                f"- **Branch**: {st_dept}\n"
                f"- **Overall Eligibility**: **{'ELIGIBLE ✅' if is_elig else 'NOT ELIGIBLE ❌'}**\n\n"
                f"{'You meet standard tier-1/tier-2 placement cutoffs.' if is_elig else 'Your CGPA is below cutoffs for tier-1 drives.'}"
            )

        return f"Hello **{st_name}**! How can I assist you with your campus activities today?"

    async def classify_intent(self, query: str) -> list[str]:
        """Classify user intent into active agent domains."""
        prompt = f"""Classify this query into 1 to 3 agent domains: academic, placement, events, knowledge, services, communication, notification, calendar.
Query: "{query}"
Output ONLY a comma-separated list of domains."""

        res = await self.generate(prompt, temperature=0.1)
        if res:
            return [d.strip().lower() for d in res.split(",") if d.strip()]
        return ["chat"]

    async def analyze_image(self, base64_data: str, user_prompt: str) -> str:
        """Use Google Gemini 1.5 Flash for Multimodal Vision OCR and Scene Understanding."""
        gemini_key = os.getenv("GOOGLE_API_KEY")
        if not gemini_key:
            return "Vision capability offline (Google API key not found)."

        # Parse data URI (e.g., data:image/png;base64,iVBORw0...)
        mime_type = "image/jpeg"
        data_b64 = base64_data
        if "," in base64_data:
            header, data_b64 = base64_data.split(",", 1)
            if ":" in header and ";" in header:
                mime_type = header.split(":")[1].split(";")[0]

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
        
        payload = {
            "contents": [{
                "parts": [
                    {"text": f"Extract any legible text (OCR) from this image and describe it briefly. Relate it to this query: {user_prompt}"},
                    {"inline_data": {"mime_type": mime_type, "data": data_b64}}
                ]
            }]
        }

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                else:
                    logger.warning("gemini_vision_failed", status=resp.status_code, text=resp.text[:200])
        except Exception as e:
            logger.error("gemini_vision_error", error=str(e))
        
        return ""


_client: LLMClient | None = None


def get_llm_client() -> LLMClient:
    """Get singleton LLM client instance."""
    global _client
    if _client is None:
        _client = LLMClient()
    return _client
