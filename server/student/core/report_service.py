from models.schemas import QuestionReport, FinalReportResponse, UserSummaryResponse, SessionStats
from typing import List, Dict
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

class ReportService:
    def __init__(self, supabase, groq_service):
        self.supabase = supabase
        self.groq_service = groq_service

    def generate_final_report(self, session_id: str) -> FinalReportResponse:
        logger.info(f"Generating final report for session_id: {session_id}")
        try:
            # Check if the session exists
            logger.debug(f"Fetching session with id: {session_id}")
            session = self.supabase.table("mock_interview_sessions").select("*").eq("id", session_id).execute()
            if not session.data:
                logger.error(f"No session found with session_id: {session_id}")
                raise Exception(f"No session found with session_id: {session_id}")
            session_data = session.data[0]

            # Fetch questions
            logger.debug(f"Fetching questions for session_id: {session_id}")
            questions = self.supabase.table("mock_interview_questions").select("*").eq("session_id", session_id).order("question_number").execute()
            if not questions.data:
                logger.error(f"No questions found for session_id: {session_id}")
                raise Exception(f"No questions found for session_id: {session_id}")
            logger.debug(f"Fetched {len(questions.data)} questions")

            # Fetch stress data
            logger.debug(f"Fetching stress data for session_id: {session_id}")
            stress_data = self.supabase.table("mock_interview_stress_analysis").select("*").eq("session_id", session_id).execute()
            stress_dict = {entry["question_number"]: entry for entry in stress_data.data} if stress_data.data else {}
            stress_scores = [entry["stress_score"] for entry in stress_data.data if entry["stress_score"] is not None] if stress_data.data else []
            average_stress = sum(stress_scores) / len(stress_scores) if stress_scores else 0.0
            average_stress_level = "High Stress" if average_stress > 60 else "Moderate Stress" if average_stress > 30 else "Low Stress"
            logger.info(f"Average stress for session {session_id}: {average_stress} ({average_stress_level})")

            # Fetch answers
            logger.debug(f"Fetching answers for session_id: {session_id}")
            answers = self.supabase.table("mock_interview_answers").select("*").eq("session_id", session_id).execute()
            answers_dict = {entry["question_number"]: entry for entry in answers.data} if answers.data else {}
            logger.debug(f"Fetched {len(answers.data)} answers")

            # Generate question reports
            question_reports: List[QuestionReport] = []
            answer_scores = []
            for question in questions.data:
                question_number = question["question_number"]
                answer = answers_dict.get(question_number, {})
                stress = stress_dict.get(question_number, {})
                
                question_report = QuestionReport(
                    question_number=question_number,
                    question_text=question["question_text"],
                    category=question["category"],
                    answer_text=answer.get("answer_text", "No answer provided"),
                    audio_url=answer.get("audio_url", None),
                    score=answer.get("score", None),
                    feedback=answer.get("feedback", "No feedback available"),
                    stress_score=stress.get("stress_score", None),
                    stress_level=stress.get("stress_level", "Not analyzed")
                )
                question_reports.append(question_report)
                if answer.get("score") is not None:
                    answer_scores.append(answer["score"])

            # Calculate final score with stress adjustment
            avg_answer_score = sum(answer_scores) / len(answer_scores) if answer_scores else 5.0
            final_score = avg_answer_score
            if average_stress > 60:
                final_score *= 0.8  # 20% penalty for high stress
            elif average_stress > 30:
                final_score *= 0.9  # 10% penalty for moderate stress
            logger.info(f"Final score for session {session_id}: {final_score} (base: {avg_answer_score}, adjusted for stress: {average_stress})")

            # Generate summary and recommendation using Groq
            logger.debug(f"Generating summary and recommendation for session_id: {session_id}")
            summary_prompt = f"""
You are an AI interviewer summarizing a mock interview session for a Software Engineer role.

Session Details:
- Average Stress: {average_stress} ({average_stress_level})
- Average Answer Score: {avg_answer_score if answer_scores else 'N/A'}
- Questions Answered: {len(answers_dict)} out of {len(questions.data)}

Provide a 2-3 sentence summary of the candidate's performance, focusing on their stress levels and answer quality.
"""
            recommendation_prompt = f"""
Based on the following session details:
- Average Stress: {average_stress} ({average_stress_level})
- Average Answer Score: {avg_answer_score if answer_scores else 'N/A'}
- Questions Answered: {len(answers_dict)} out of {len(questions.data)}

Provide a 1-2 sentence recommendation for the candidate to improve their interview performance.
"""
            summary_completion = self.groq_service.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a helpful AI assistant that summarizes interview performance."},
                    {"role": "user", "content": summary_prompt}
                ],
                model="llama3-8b-8192",
                max_tokens=150  # Increased for more detailed responses
            )
            recommendation_completion = self.groq_service.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a helpful AI assistant that provides interview recommendations."},
                    {"role": "user", "content": recommendation_prompt}
                ],
                model="llama3-8b-8192",
                max_tokens=150
            )
            overall_summary = summary_completion.choices[0].message.content.strip()
            recommendation = recommendation_completion.choices[0].message.content.strip()
            logger.info(f"Generated summary: {overall_summary}")
            logger.info(f"Generated recommendation: {recommendation}")

            # Insert the report into the database with upsert to avoid duplicates
            logger.debug(f"Upserting report into mock_interview_reports for session_id: {session_id}")
            self.supabase.table("mock_interview_reports").upsert({
                "session_id": session_id,
                "overall_summary": overall_summary,
                "final_score": final_score,
                "recommendation": recommendation
            }, on_conflict="session_id").execute()

            logger.info(f"Successfully generated final report for session_id: {session_id}")
            return FinalReportResponse(
                session_id=session_id,
                questions=question_reports,
                average_stress=average_stress,
                average_stress_level=average_stress_level,
                overall_summary=overall_summary,
                final_score=final_score,
                recommendation=recommendation
            )

        except Exception as e:
            logger.error(f"Failed to generate final report for session_id {session_id}: {str(e)}")
            raise Exception(f"Failed to generate final report: {str(e)}")

    def generate_user_summary(self, mock_user_id: str) -> UserSummaryResponse:
        """Generate a summary of a user's interview performance across all sessions."""
        logger.info(f"Generating user summary for mock_user_id: {mock_user_id}")
        try:
            # Fetch all sessions for the user
            sessions = self.supabase.table("mock_interview_sessions").select("*").eq("user_id", mock_user_id).order("start_time").execute()
            if not sessions.data:
                logger.info(f"No sessions found for mock_user_id: {mock_user_id}")
                return UserSummaryResponse(
                    mock_user_id=mock_user_id,
                    total_sessions=0,
                    average_stress_trend=[],
                    weakest_question_types={},
                    progress_over_time={}
                )

            total_sessions = len(sessions.data)
            session_stats = []
            average_stress_trend = []
            category_data = {}  # To track scores and counts per question type
            progress_over_time = {"stress": [], "answer_score": []}

            for session in sessions.data:
                session_id = session["id"]
                start_time = session["start_time"]

                # Fetch questions, answers, and stress data for the session
                questions = self.supabase.table("mock_interview_questions").select("*").eq("session_id", session_id).order("question_number").execute()
                total_questions = len(questions.data) if questions.data else 0

                answers = self.supabase.table("mock_interview_answers").select("*").eq("session_id", session_id).execute()
                questions_attempted = len(answers.data) if answers.data else 0

                stress_data = self.supabase.table("mock_interview_stress_analysis").select("*").eq("session_id", session_id).execute()
                stress_scores = [entry["stress_score"] for entry in stress_data.data if entry["stress_score"] is not None] if stress_data.data else []
                average_stress = sum(stress_scores) / len(stress_scores) if stress_scores else 0.0
                average_stress_trend.append(average_stress)

                answer_scores = [entry["score"] for entry in answers.data if entry["score"] is not None]
                average_answer_score = sum(answer_scores) / len(answer_scores) if answer_scores else None

                # Track performance by question category
                for question in questions.data:
                    category = question["category"]
                    question_number = question["question_number"]
                    answer = next((a for a in answers.data if a["question_number"] == question_number), None)
                    stress = next((s for s in stress_data.data if s["question_number"] == question_number), None)

                    # Use stress score if available, otherwise use inverted answer score
                    score = stress["stress_score"] if stress and stress["stress_score"] is not None else (10 - answer["score"] if answer and answer["score"] is not None else 5.0)
                    
                    # Update category data
                    if category not in category_data:
                        category_data[category] = {"total_score": 0.0, "count": 0}
                    category_data[category]["total_score"] += score
                    category_data[category]["count"] += 1

                session_stats.append(SessionStats(
                    session_id=session_id,
                    created_at=start_time,
                    average_stress=average_stress,
                    average_answer_score=average_answer_score,
                    questions_attempted=questions_attempted,
                    total_questions=total_questions
                ))
                progress_over_time["stress"].append(average_stress)
                if average_answer_score is not None:
                    progress_over_time["answer_score"].append(average_answer_score)

            # Compute weakest question types with additional context
            weakest_question_types = {
                category: {
                    "average_score": data["total_score"] / data["count"],
                    "question_count": data["count"]
                }
                for category, data in category_data.items()
            }

            # Compute progress over time (difference between first and last session)
            progress = {}
            if len(progress_over_time["stress"]) > 1:
                progress["stress_improvement"] = progress_over_time["stress"][0] - progress_over_time["stress"][-1]
            else:
                progress["stress_improvement"] = 0.0
            if len(progress_over_time["answer_score"]) > 1:
                progress["answer_score_improvement"] = progress_over_time["answer_score"][-1] - progress_over_time["answer_score"][0]
            else:
                progress["answer_score_improvement"] = 0.0

            logger.info(f"Successfully generated user summary for mock_user_id: {mock_user_id}")
            return UserSummaryResponse(
                mock_user_id=mock_user_id,
                total_sessions=total_sessions,
                average_stress_trend=average_stress_trend,
                weakest_question_types=weakest_question_types,
                progress_over_time=progress
            )

        except Exception as e:
            logger.error(f"Failed to generate user summary for mock_user_id {mock_user_id}: {str(e)}")
            raise Exception(f"Failed to generate user summary: {str(e)}")