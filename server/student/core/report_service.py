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
            # Validate session_id format (must be a valid UUID)
            import uuid
            try:
                uuid.UUID(session_id)
            except ValueError:
                logger.error(f"Invalid session_id format: {session_id}")
                raise ValueError("Invalid session_id format. Must be a valid UUID.")

            # Check if the session exists and fetch user details
            logger.debug(f"Fetching session with id: {session_id}")
            session = self.supabase.table("mock_interview_sessions").select(
                "*, user_id:mock_interview_users(user_id:users(user_id, name, email, role))"
            ).eq("id", session_id).execute()
            if not session.data:
                logger.error(f"No session found with session_id: {session_id}")
                raise Exception(f"No session found with session_id: {session_id}")
            session_data = session.data[0]
            user_data = session_data.get("user_id", {})
            user_name = user_data.get("name", "Unknown User") if user_data else "Unknown User"
            user_role = user_data.get("role", "candidate") if user_data else "candidate"

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
            if not stress_data.data:
                logger.warning(f"No stress analysis data found for session_id: {session_id}")
                stress_dict = {}
                stress_scores = []
                average_stress = 0.0
                average_stress_level = "Not Analyzed"
            else:
                stress_dict = {entry["question_number"]: entry for entry in stress_data.data}
                stress_scores = [entry["stress_score"] for entry in stress_data.data if entry["stress_score"] is not None]
                average_stress = sum(stress_scores) / len(stress_scores) if stress_scores else 0.0
                average_stress_level = "High Stress" if average_stress > 60 else "Moderate Stress" if average_stress > 30 else "Low Stress"
            logger.info(f"Average stress for session {session_id}: {average_stress} ({average_stress_level})")

            # Fetch answers
            logger.debug(f"Fetching answers for session_id: {session_id}")
            answers = self.supabase.table("mock_interview_answers").select("*").eq("session_id", session_id).execute()
            answers_dict = {entry["question_number"]: entry for entry in answers.data} if answers.data else {}
            logger.debug(f"Fetched {len(answers.data) if answers.data else 0} answers")

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

            # Generate summary and recommendation using Grok with detailed prompts
            logger.debug(f"Generating summary and recommendation for session_id: {session_id}")
            # Prepare detailed data for the prompt
            question_summary = "\n".join([
                f"- Question {qr.question_number} ({qr.category}): Score {qr.score if qr.score is not None else 'N/A'}, "
                f"Stress {qr.stress_score if qr.stress_score is not None else 'N/A'} ({qr.stress_level})"
                for qr in question_reports
            ])
            summary_prompt = f"""
You are an AI interviewer summarizing a mock interview session for a Software Engineer role.

Candidate Details:
- Name: {user_name}
- Role: {user_role}

Session Details:
- Total Questions: {len(questions.data)}
- Questions Answered: {len(answers_dict)}
- Average Stress: {average_stress:.1f} ({average_stress_level})
- Average Answer Score: {avg_answer_score:.1f}
- Final Score (adjusted for stress): {final_score:.1f}

Performance Breakdown:
{question_summary}

Provide a concise 2-3 sentence summary of the candidate's performance. Highlight their strengths in answer quality, 
areas impacted by stress, and overall readiness for a Software Engineer role.
"""
            recommendation_prompt = f"""
You are an AI interviewer providing actionable feedback for a mock interview candidate.

Candidate Details:
- Name: {user_name}
- Role: {user_role}

Session Details:
- Total Questions: {len(questions.data)}
- Questions Answered: {len(answers_dict)}
- Average Stress: {average_stress:.1f} ({average_stress_level})
- Average Answer Score: {avg_answer_score:.1f}
- Final Score (adjusted for stress): {final_score:.1f}

Performance Breakdown:
{question_summary}

Provide a 1-2 sentence actionable recommendation to help the candidate improve their interview performance. 
Focus on stress management or answer quality based on their performance.
"""
            # Default values in case Grok API fails
            overall_summary = "Performance summary could not be generated due to an error."
            recommendation = "Recommendation could not be generated due to an error."
            try:
                # Attempt summary generation with Grok
                summary_completion = self.groq_service.client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "You are a helpful AI assistant that summarizes interview performance."},
                        {"role": "user", "content": summary_prompt}
                    ],
                    model="llama3-8b-8192",
                    max_tokens=150,
                    temperature=0.7
                )
                overall_summary = summary_completion.choices[0].message.content.strip()
                logger.info(f"Generated summary: {overall_summary}")
            except Exception as e:
                logger.error(f"Failed to generate summary via Grok API: {str(e)}")
                overall_summary = f"{user_name} completed {len(answers_dict)} out of {len(questions.data)} questions with an average answer score of {avg_answer_score:.1f}. Stress levels were {average_stress_level.lower()} (average stress: {average_stress:.1f})."

            try:
                # Attempt recommendation generation with Grok
                recommendation_completion = self.groq_service.client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "You are a helpful AI assistant that provides interview recommendations."},
                        {"role": "user", "content": recommendation_prompt}
                    ],
                    model="llama3-8b-8192",
                    max_tokens=150,
                    temperature=0.7
                )
                recommendation = recommendation_completion.choices[0].message.content.strip()
                logger.info(f"Generated recommendation: {recommendation}")
            except Exception as e:
                logger.error(f"Failed to generate recommendation via Grok API: {str(e)}")
                if average_stress > 60:
                    recommendation = "Consider practicing stress management techniques, such as deep breathing, to reduce high stress during interviews."
                elif avg_answer_score < 6:
                    recommendation = "Focus on improving answer quality by practicing common Software Engineer interview questions and structuring your responses clearly."
                else:
                    recommendation = "Continue practicing to maintain your performance, and consider mock interviews to further reduce stress."

            # Insert the report into the database with upsert to avoid duplicates
            logger.debug(f"Upserting report into mock_interview_reports for session_id: {session_id}")
            report_data = {
                "session_id": session_id,
                "overall_summary": overall_summary,
                "final_score": final_score,
                "recommendation": recommendation,
                "average_stress_score": average_stress,
                "average_stress_level": average_stress_level,
                "created_at": datetime.utcnow().isoformat()
            }
            try:
                # Attempt upsert with all fields
                self.supabase.table("mock_interview_reports").upsert(
                    report_data,
                    on_conflict=["session_id"]
                ).execute()
                logger.info(f"Successfully upserted report to mock_interview_reports for session_id: {session_id}")
            except Exception as e:
                logger.error(f"Upsert failed: {str(e)}")
                # Fallback: Try upsert without stress columns if they are missing in schema
                if "column" in str(e).lower() and ("average_stress_score" in str(e).lower() or "average_stress_level" in str(e).lower()):
                    logger.warning(f"Columns average_stress_score/average_stress_level not found in mock_interview_reports, saving without them")
                    reduced_report_data = {
                        "session_id": session_id,
                        "overall_summary": overall_summary,
                        "final_score": final_score,
                        "recommendation": recommendation,
                        "created_at": datetime.utcnow().isoformat()
                    }
                    self.supabase.table("mock_interview_reports").upsert(
                        reduced_report_data,
                        on_conflict=["session_id"]
                    ).execute()
                    logger.info(f"Successfully upserted report (without stress columns) for session_id: {session_id}")
                else:
                    logger.error(f"Failed to upsert report into mock_interview_reports: {str(e)}")
                    raise Exception(f"Failed to save report to database: {str(e)}")

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
            # Validate mock_user_id format (must be a valid UUID)
            import uuid
            try:
                uuid.UUID(mock_user_id)
            except ValueError:
                logger.error(f"Invalid mock_user_id format: {mock_user_id}")
                raise ValueError("Invalid mock_user_id format. Must be a valid UUID.")

            # Fetch user details to verify role
            user = self.supabase.table("mock_interview_users").select(
                "*, user_id:users(user_id, name, email, role)"
            ).eq("user_id", mock_user_id).execute()
            if not user.data:
                logger.info(f"No user found for mock_user_id: {mock_user_id}")
                return UserSummaryResponse(
                    mock_user_id=mock_user_id,
                    total_sessions=0,
                    average_stress_trend=[],
                    weakest_question_types={},
                    progress_over_time={}
                )
            user_data = user.data[0]
            user_role = user_data.get("user_id", {}).get("role", "student")

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