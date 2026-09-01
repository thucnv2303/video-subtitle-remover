import cv2
import os
from typing import List, Dict, Any

def format_sec_to_hms(seconds: float) -> str:
    s = max(0.0, float(seconds))
    h = int(s // 3600)
    m = int((s % 3600) // 60)
    sc = int(s % 60)
    return f"{h:02d}:{m:02d}:{sc:02d}"

def detect_face_free_intervals(
    video_path: str,
    sample_step_sec: float = 0.35,
    min_clip_sec: float = 1.0,
    face_padding_sec: float = 0.3
) -> Dict[str, Any]:
    """
    Quét video bằng OpenCV Face Detection siêu tốc (dùng cap.grab sequential),
    tìm toàn bộ các khoảng thời gian có khuôn mặt người và trả về các khoảng thời gian KHÔNG có mặt người.
    """
    if not os.path.isfile(video_path):
        return {"status": "error", "error": f"Không tìm thấy video: {video_path}"}

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {"status": "error", "error": f"Không thể mở video bằng OpenCV: {video_path}"}

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    video_duration = total_frames / fps if total_frames > 0 else 0.0

    haar_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    face_cascade = cv2.CascadeClassifier(haar_path)

    frame_step = max(1, int(fps * sample_step_sec))
    face_timestamps: List[float] = []

    frame_count = 0
    while True:
        if frame_count % frame_step == 0:
            ret, frame = cap.read()
            if not ret or frame is None:
                break
            timestamp = frame_count / fps

            # Downscale frame for ultra high FPS face detection
            h, w = frame.shape[:2]
            target_w = 400
            if w > target_w:
                scale = target_w / w
                resized = cv2.resize(frame, (target_w, int(h * scale)), interpolation=cv2.INTER_NEAREST)
            else:
                resized = frame

            gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.2,
                minNeighbors=4,
                minSize=(28, 28)
            )

            if len(faces) > 0:
                face_timestamps.append(timestamp)
        else:
            ret = cap.grab()
            if not ret:
                break

        frame_count += 1

    cap.release()

    # 1. Gom cụm các timestamp có mặt người thành các khoảng [start, end]
    raw_face_intervals = []
    for t in face_timestamps:
        start_t = max(0.0, t - face_padding_sec)
        end_t = min(video_duration, t + sample_step_sec + face_padding_sec)
        if raw_face_intervals and start_t <= raw_face_intervals[-1][1]:
            raw_face_intervals[-1][1] = max(raw_face_intervals[-1][1], end_t)
        else:
            raw_face_intervals.append([start_t, end_t])

    # 2. Tính các khoảng an toàn KHÔNG có mặt người
    face_free_intervals = []
    current_t = 0.0

    for f_start, f_end in raw_face_intervals:
        if f_start - current_t >= min_clip_sec:
            face_free_intervals.append({
                "start": format_sec_to_hms(current_t),
                "to": format_sec_to_hms(f_start),
                "start_sec": round(current_t, 2),
                "to_sec": round(f_start, 2),
                "duration": round(f_start - current_t, 2)
            })
        current_t = max(current_t, f_end)

    if video_duration - current_t >= min_clip_sec:
        face_free_intervals.append({
            "start": format_sec_to_hms(current_t),
            "to": format_sec_to_hms(video_duration),
            "start_sec": round(current_t, 2),
            "to_sec": round(video_duration, 2),
            "duration": round(video_duration - current_t, 2)
        })

    # If no face detected at all, return full video as one single interval
    if not raw_face_intervals and not face_free_intervals and video_duration > 0:
        face_free_intervals.append({
            "start": "00:00:00",
            "to": format_sec_to_hms(video_duration),
            "start_sec": 0.0,
            "to_sec": round(video_duration, 2),
            "duration": round(video_duration, 2)
        })

    formatted_faces = [
        {"start": format_sec_to_hms(s), "to": format_sec_to_hms(e), "duration": round(e - s, 2)}
        for s, e in raw_face_intervals
    ]

    total_free_dur = sum(item["duration"] for item in face_free_intervals)

    return {
        "status": "ok",
        "video_duration": round(video_duration, 2),
        "face_intervals": formatted_faces,
        "face_free_intervals": face_free_intervals,
        "total_face_free_duration": round(total_free_dur, 2)
    }
