import os
from moviepy.editor import VideoFileClip
from typing import List

class StressService:
    def __init__(self, whisper_service):
        self.whisper_service = whisper_service

    def analyze_stress(self, video_path: str) -> dict:
        try:
            # Load the video using MoviePy
            video = VideoFileClip(video_path)
            video_duration = video.duration  # Duration in seconds

            # Extract audio from the video
            audio_path = "temp_audio.wav"
            video.audio.write_audiofile(audio_path)
            video.close()

            # Transcribe audio using Groq's Whisper
            transcription = self.whisper_service.transcribe_audio(audio_path)
            word_count = len(transcription.split())

            # Calculate speaking speed (words per minute)
            speaking_speed = (word_count / video_duration) * 60 if video_duration > 0 else 0

            # Calculate audio-based stress score (based on speaking speed)
            # Normal speaking speed: 120-150 WPM
            audio_stress_score = 30.0  # Base score
            if speaking_speed > 150:
                audio_stress_score += (speaking_speed - 150) * 0.5  # Increase stress for faster speech
            elif speaking_speed < 120:
                audio_stress_score += (120 - speaking_speed) * 0.5  # Increase stress for slower speech
            audio_stress_score = min(audio_stress_score, 100.0)  # Cap at 100

            # Video-based stress score (placeholder from previous step)
            if video_duration < 30:
                video_stress_score = 75.0
            elif video_duration < 60:
                video_stress_score = 50.0
            else:
                video_stress_score = 25.0

            # Combine scores (weighted average: 70% audio, 30% video)
            final_stress_score = (0.7 * audio_stress_score) + (0.3 * video_stress_score)
            stress_level = "High Stress" if final_stress_score > 60 else "Moderate Stress" if final_stress_score > 30 else "Low Stress"

            return {
                "score": final_stress_score,
                "level": stress_level,
                "individual_scores": [
                    {"metric": "audio_speaking_speed", "score": audio_stress_score},
                    {"metric": "video_duration", "score": video_stress_score}
                ]
            }
        except Exception as e:
            raise Exception(f"Error analyzing stress: {str(e)}")
        finally:
            # Clean up temporary files
            if os.path.exists(video_path):
                os.remove(video_path)
            if os.path.exists(audio_path):
                os.remove(audio_path)