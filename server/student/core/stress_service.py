from typing import Dict

class StressService:
    def __init__(self, whisper_service):
        self.whisper_service = whisper_service

    def analyze_stress(self, audio_path: str, duration: float = 60.0) -> Dict:
        """
        Analyze stress based on uploaded audio file and provided duration.
        - audio_path: path to the audio file (uploaded from frontend)
        - duration: duration in seconds (optionally from video or frontend; default 60s)
        """
        try:
            # 1. Transcribe audio
            transcription = self.whisper_service.transcribe_audio(audio_path)
            word_count = len(transcription.split())

            # 2. Calculate speaking speed (words per minute)
            if duration < 2.0:
                duration = 60.0  # fallback to 1 minute if duration unreliable
            speaking_speed = (word_count / duration) * 60

            # 3. Calculate audio-based stress score (based on speaking speed)
            # Normal speaking speed: 120-150 WPM
            audio_stress_score = 30.0  # Base score
            if speaking_speed > 150:
                audio_stress_score += (speaking_speed - 150) * 0.5  # Increase stress for fast speech
            elif speaking_speed < 120:
                audio_stress_score += (120 - speaking_speed) * 0.5  # Increase stress for slow speech
            audio_stress_score = min(audio_stress_score, 100.0)  # Cap at 100

            # 4. (Optional) Video-based stress score is deprecated here
            # If you want to use it, provide a value from elsewhere; else, set to None or 0
            video_stress_score = None

            # 5. Final score (audio-only)
            final_stress_score = audio_stress_score
            stress_level = (
                "High Stress" if final_stress_score > 60 else
                "Moderate Stress" if final_stress_score > 30 else
                "Low Stress"
            )

            return {
                "score": final_stress_score,
                "level": stress_level,
                "individual_scores": [
                    {"metric": "audio_speaking_speed", "score": audio_stress_score},
                    # {"metric": "video_duration", "score": video_stress_score},  # Uncomment if used
                ]
            }
        except Exception as e:
            raise Exception(f"Error analyzing stress: {str(e)}")
