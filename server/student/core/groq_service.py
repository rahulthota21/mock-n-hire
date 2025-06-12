from groq import Groq
from config.settings import settings
import re

class GroqService:
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)

    def generate_interview_questions(self, resume_text: str) -> list:
        """Generate interview questions based on resume text."""
        prompt = f"""
You are an AI interviewer conducting an interview for a candidate.

The candidate's details:
- Resume Content: {resume_text}
- Job Role: Software Engineer
- Company: Mock Interview Inc.
- Industry: Technology

Based on this information, generate exactly:
🔹 **3 Technical Questions** specific to the job role and skills.
🔹 **3 HR Questions** to assess cultural fit and behavioral aspects.
🔹 **2 Situational/Scenario-Based Questions** to evaluate problem-solving.
🔹 **1 Surprise Question** (creative or unexpected to test adaptability).

Format each section with the following headings and numbered questions:
- **Technical:**
  1. [Your question here]
  2. [Your question here]
  3. [Your question here]
- **HR:**
  1. [Your question here]
  2. [Your question here]
  3. [Your question here]
- **Situational:**
  1. [Your question here]
  2. [Your question here]
- **Surprise:**
  1. [Your question here]

Ensure each question starts with a number, followed by a period and a space (e.g., "1. "), and do not include any additional text outside of the specified format.
"""
        completion = self.client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful AI assistant that generates interview questions based on resumes."},
                {"role": "user", "content": prompt}
            ],
            model="llama3-8b-8192",
            max_tokens=500
        )
        response_text = completion.choices[0].message.content

        # Parse the response to extract questions
        lines = response_text.split("\n")
        questions = []
        current_category = None

        for line in lines:
            line = line.strip()
            if not line:
                continue
            if line.startswith("**Technical:**"):
                current_category = "technical"
                continue
            elif line.startswith("**HR:**"):
                current_category = "hr"
                continue
            elif line.startswith("**Situational:**"):
                current_category = "situational"
                continue
            elif line.startswith("**Surprise:**"):
                current_category = "surprise"
                continue
            if current_category and not line.startswith("**"):
                cleaned_line = re.sub(r"^\d+\.\s*|\d+\s", "", line)
                if cleaned_line:
                    questions.append({"text": cleaned_line, "category": current_category})

        return questions

    def evaluate_answer(self, question_text: str, answer_text: str) -> dict:
        """Evaluate a candidate's answer using Groq API and return a score and feedback."""
        prompt = f"""
You are an AI interviewer evaluating a candidate's answer for a Software Engineer role.

Question:
{question_text}

Candidate's Answer:
{answer_text}

Evaluate this candidate answer based on communication, clarity, and depth. Provide:
- A score from 1 to 10 (integer).
- Feedback (2-3 sentences explaining the score).

Format your response as:
Score: [number]
Feedback: [your feedback]
"""
        try:
            completion = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a helpful AI assistant that evaluates interview answers."},
                    {"role": "user", "content": prompt}
                ],
                model="llama3-8b-8192",
                max_tokens=150
            )
            response_text = completion.choices[0].message.content.strip()

            # Parse the response
            score_match = re.search(r"Score: (\d+)", response_text)
            feedback_match = re.search(r"Feedback: (.+)", response_text, re.DOTALL)

            if not score_match or not feedback_match:
                raise ValueError("Failed to parse score or feedback from Groq response")

            score = int(score_match.group(1))
            feedback = feedback_match.group(1).strip()

            if score < 1 or score > 10:
                raise ValueError("Score must be between 1 and 10")

            return {"score": score, "feedback": feedback}
        except Exception as e:
            raise Exception(f"Error evaluating answer with Groq: {str(e)}")