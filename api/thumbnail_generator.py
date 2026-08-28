import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from typing import Dict, Any, List, Optional

def extract_best_product_frame(
    video_path: str,
    face_free_intervals: Optional[List[Dict[str, Any]]] = None,
    sample_step_sec: float = 0.5
) -> Optional[np.ndarray]:
    """
    Quét qua các khoảng thời gian không có mặt người trong video,
    đo điểm độ nét (Laplacian sharpness) để chọn ra frame chụp sản phẩm đẹp và sắc nét nhất.
    """
    if not os.path.isfile(video_path):
        return None

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return None

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    video_duration = total_frames / fps if total_frames > 0 else 0.0

    # Xác định các mốc thời gian cần quét
    sample_timestamps = []
    if face_free_intervals:
        for interval in face_free_intervals:
            s = float(interval.get("start_sec", 0.0))
            e = float(interval.get("to_sec", s + 2.0))
            t = s + 0.3  # bỏ qua frame đầu dễ bị chuyển cảnh
            while t < e - 0.2:
                sample_timestamps.append(t)
                t += sample_step_sec
    else:
        t = 1.0
        while t < video_duration - 1.0:
            sample_timestamps.append(t)
            t += sample_step_sec

    if not sample_timestamps:
        sample_timestamps = [video_duration * 0.3, video_duration * 0.5, video_duration * 0.7]

    best_score = -1.0
    best_frame = None

    frame_count = 0
    frame_step = max(1, int(fps * sample_step_sec))

    while True:
        if frame_count % frame_step == 0:
            ret, frame = cap.read()
            if not ret or frame is None:
                break
            timestamp = frame_count / fps

            # Kiểm tra nếu timestamp nằm trong khoảng hợp lệ
            is_valid_t = any(abs(timestamp - st) <= (sample_step_sec * 0.6) for st in sample_timestamps)
            if is_valid_t:
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                # Điểm độ nét Laplacian
                lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()
                # Điểm độ tương phản và bão hòa màu
                hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
                sat_mean = np.mean(hsv[:, :, 1])

                score = lap_var * 0.7 + sat_mean * 0.3

                if score > best_score:
                    best_score = score
                    best_frame = frame.copy()
        else:
            ret = cap.grab()
            if not ret:
                break
        frame_count += 1

    cap.release()
    return best_frame

def get_system_font(size: int, bold: bool = True):
    font_paths = [
        "C:\\Windows\\Fonts\\arialbd.ttf" if bold else "C:\\Windows\\Fonts\\arial.ttf",
        "C:\\Windows\\Fonts\\segoeuib.ttf" if bold else "C:\\Windows\\Fonts\\segoeui.ttf",
        "C:\\Windows\\Fonts\\impact.ttf",
        "C:\\Windows\\Fonts\\tahoma.ttf",
    ]
    for p in font_paths:
        if os.path.isfile(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

def create_product_thumbnail(
    video_path: str,
    output_thumbnail_path: str,
    headline: str = "SIÊU PHẨM HOT",
    sub_headline: str = "TIỆN LỢI - HIỆU QUẢ VƯỢT TRỘI",
    badge_text: str = "⚡ BEST SELLER",
    face_free_intervals: Optional[List[Dict[str, Any]]] = None,
    raw_frame_output_path: Optional[str] = None
) -> Dict[str, Any]:
    """
    Tự động trích xuất frame sản phẩm đẹp nhất và tạo ảnh Thumbnail quảng cáo chuyên nghiệp.
    """
    try:
        # 1. Trích xuất best frame
        frame = extract_best_product_frame(video_path, face_free_intervals)
        if frame is None:
            return {"status": "error", "error": "Không thể trích xuất frame từ video"}

        h, w = frame.shape[:2]

        # Lưu ảnh raw nếu cần
        if raw_frame_output_path:
            os.makedirs(os.path.dirname(os.path.abspath(raw_frame_output_path)), exist_ok=True)
            cv2.imwrite(raw_frame_output_path, frame)

        # Chuyển sang PIL Image (RGB)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img = Image.fromarray(rgb_frame)

        # Chuẩn bị vẽ overlay
        draw = ImageDraw.Draw(img, "RGBA")

        # 2. Tạo Gradient đen dưới chân ảnh để làm nổi bật chữ
        grad_height = int(h * 0.45)
        gradient = Image.new("RGBA", (w, grad_height), (0, 0, 0, 0))
        grad_draw = ImageDraw.Draw(gradient)
        for y in range(grad_height):
            alpha = int(220 * (y / grad_height)**1.3)
            grad_draw.line([(0, y), (w, y)], fill=(0, 0, 0, alpha))
        img.paste(gradient, (0, h - grad_height), gradient)

        # Vẽ thêm gradient mỏng ở đỉnh đầu để nổi bật badge
        top_grad_h = int(h * 0.18)
        top_grad = Image.new("RGBA", (w, top_grad_h), (0, 0, 0, 0))
        top_draw = ImageDraw.Draw(top_grad)
        for y in range(top_grad_h):
            alpha = int(140 * (1.0 - (y / top_grad_h)))
            top_draw.line([(0, y), (w, y)], fill=(0, 0, 0, alpha))
        img.paste(top_grad, (0, 0), top_grad)

        # 3. Vẽ Badge nổi bật ở góc trên bên trái
        if badge_text:
            badge_font = get_system_font(int(h * 0.038), bold=True)
            b_pad_x, b_pad_y = int(w * 0.025), int(h * 0.012)
            b_left, b_top = int(w * 0.04), int(h * 0.04)

            # Đo kích thước text
            bbox = draw.textbbox((0, 0), badge_text, font=badge_font)
            bw = (bbox[2] - bbox[0]) + b_pad_x * 2
            bh = (bbox[3] - bbox[1]) + b_pad_y * 2

            # Hộp nền gradient đỏ / vàng cam
            draw.rounded_rectangle(
                [(b_left, b_top), (b_left + bw, b_top + bh)],
                radius=int(bh * 0.35),
                fill=(239, 68, 68, 240),
                outline=(255, 255, 255, 200),
                width=2
            )
            draw.text((b_left + b_pad_x, b_top + b_pad_y - 2), badge_text, fill=(255, 255, 255, 255), font=badge_font)

        # 4. Vẽ Headline chính (Chữ vàng/trắng rực rỡ có viền đen 3D siêu nổi bật)
        clean_hl = headline.strip().upper()
        if clean_hl:
            hl_font_size = max(24, int(w * 0.08))
            hl_font = get_system_font(hl_font_size, bold=True)

            hl_bbox = draw.textbbox((0, 0), clean_hl, font=hl_font)
            hl_w = hl_bbox[2] - hl_bbox[0]
            hl_h = hl_bbox[3] - hl_bbox[1]

            # Canh giữa ngang
            hl_x = max(10, (w - hl_w) // 2)
            hl_y = h - int(h * 0.28)

            # Vẽ viền đen 3D dày xung quanh
            stroke_w = max(3, int(hl_font_size * 0.08))
            for dx in range(-stroke_w, stroke_w + 1):
                for dy in range(-stroke_w, stroke_w + 1):
                    if dx != 0 or dy != 0:
                        draw.text((hl_x + dx, hl_y + dy), clean_hl, font=hl_font, fill=(0, 0, 0, 255))

            # Vẽ chữ màu vàng rực rỡ
            draw.text((hl_x, hl_y), clean_hl, font=hl_font, fill=(253, 224, 71, 255))

        # 5. Vẽ Sub-headline (Chữ trắng viền đen)
        clean_sub = sub_headline.strip()
        if clean_sub:
            sub_font_size = max(16, int(w * 0.045))
            sub_font = get_system_font(sub_font_size, bold=True)

            sub_bbox = draw.textbbox((0, 0), clean_sub, font=sub_font)
            sub_w = sub_bbox[2] - sub_bbox[0]

            sub_x = max(10, (w - sub_w) // 2)
            sub_y = h - int(h * 0.12)

            sub_stroke = max(2, int(sub_font_size * 0.06))
            for dx in range(-sub_stroke, sub_stroke + 1):
                for dy in range(-sub_stroke, sub_stroke + 1):
                    if dx != 0 or dy != 0:
                        draw.text((sub_x + dx, sub_y + dy), clean_sub, font=sub_font, fill=(0, 0, 0, 230))

            draw.text((sub_x, sub_y), clean_sub, font=sub_font, fill=(255, 255, 255, 255))

        # 6. Lưu file Thumbnail chất lượng cao
        os.makedirs(os.path.dirname(os.path.abspath(output_thumbnail_path)), exist_ok=True)
        img.convert("RGB").save(output_thumbnail_path, quality=95)

        return {
            "status": "ok",
            "thumbnail_path": output_thumbnail_path,
            "raw_frame_path": raw_frame_output_path,
            "headline": clean_hl,
            "sub_headline": clean_sub,
            "width": w,
            "height": h
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "error": str(e)}
