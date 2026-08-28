import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
from typing import Dict, Any, List, Optional

def extract_best_product_frame(
    video_path: str,
    face_free_intervals: Optional[List[Dict[str, Any]]] = None,
    sample_step_sec: float = 0.4
) -> Optional[np.ndarray]:
    """
    Quét qua các khoảng thời gian không có mặt người trong video,
    đo điểm độ nét (Laplacian clarity) + độ bão hòa màu sắc và độ tương phản
    để chọn ra frame cận cảnh sản phẩm đẹp và sắc nét nhất.
    """
    if not os.path.isfile(video_path):
        return None

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return None

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    video_duration = total_frames / fps if total_frames > 0 else 0.0

    sample_timestamps = []
    if face_free_intervals:
        for interval in face_free_intervals:
            s = float(interval.get("start_sec", 0.0))
            e = float(interval.get("to_sec", s + 2.0))
            t = s + 0.4
            while t < e - 0.3:
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

            is_valid_t = any(abs(timestamp - st) <= (sample_step_sec * 0.6) for st in sample_timestamps)
            if is_valid_t:
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()
                
                # Tính độ bão hòa màu và độ tương phản
                hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
                sat_mean = np.mean(hsv[:, :, 1])
                contrast = gray.std()

                # Điểm tổng hợp ưu tiên độ nét cao và hình ảnh rõ ràng
                score = (lap_var * 0.5) + (contrast * 0.3) + (sat_mean * 0.2)

                if score > best_score:
                    best_score = score
                    best_frame = frame.copy()
        else:
            ret = cap.grab()
            if not ret:
                break
        frame_count += 1

    cap.release()

    # Tăng cường chất lượng frame (Unsharp Masking & Color Enhance)
    if best_frame is not None:
        try:
            blurred = cv2.GaussianBlur(best_frame, (0, 0), 2.0)
            enhanced = cv2.addWeighted(best_frame, 1.35, blurred, -0.35, 0)
            return enhanced
        except Exception:
            return best_frame

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
    headline: str = "ĐẦU VÒI SEN TĂNG ÁP 1000 LỖ",
    sub_headline: str = "NƯỚC PHUN CỰC MẠNH GẤP 5 LẦN",
    badge_text: str = "🔥 TOP 1 BÁN CHẠY 2026",
    features: Optional[List[str]] = None,
    face_free_intervals: Optional[List[Dict[str, Any]]] = None,
    raw_frame_output_path: Optional[str] = None
) -> Dict[str, Any]:
    """
    Tạo ảnh Thumbnail sản phẩm đỉnh cao chuẩn E-Commerce TikTok Shop / Shopee / Facebook Reels:
    - Bắt đúng cận cảnh sản phẩm sắc nét nhất từ video.
    - Tiêu đề 3D nổi bật nhận diện đúng sản phẩm chủ đạo.
    - Dải cam kết tính năng vàng (3 features).
    - Huy hiệu trending tạo độ tin cậy và kích thích bấm xem.
    """
    try:
        # 1. Trích xuất best product frame
        frame = extract_best_product_frame(video_path, face_free_intervals)
        if frame is None:
            return {"status": "error", "error": "Không thể trích xuất frame từ video"}

        h, w = frame.shape[:2]

        if raw_frame_output_path:
            os.makedirs(os.path.dirname(os.path.abspath(raw_frame_output_path)), exist_ok=True)
            cv2.imwrite(raw_frame_output_path, frame)

        # Chuyển đổi sang PIL Image
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img = Image.fromarray(rgb_frame)

        # Tăng nhẹ độ bão hòa màu và độ tương phản tổng thể
        enhancer = ImageEnhance.Color(img)
        img = enhancer.enhance(1.15)
        enhancer_c = ImageEnhance.Contrast(img)
        img = enhancer_c.enhance(1.1)

        draw = ImageDraw.Draw(img, "RGBA")

        # 2. Gradient chân trang và đỉnh đầu để tăng tương phản
        grad_height = int(h * 0.48)
        gradient = Image.new("RGBA", (w, grad_height), (0, 0, 0, 0))
        grad_draw = ImageDraw.Draw(gradient)
        for y in range(grad_height):
            alpha = int(230 * (y / grad_height)**1.2)
            grad_draw.line([(0, y), (w, y)], fill=(5, 10, 20, alpha))
        img.paste(gradient, (0, h - grad_height), gradient)

        top_grad_h = int(h * 0.2)
        top_grad = Image.new("RGBA", (w, top_grad_h), (0, 0, 0, 0))
        top_draw = ImageDraw.Draw(top_grad)
        for y in range(top_grad_h):
            alpha = int(160 * (1.0 - (y / top_grad_h)))
            top_draw.line([(0, y), (w, y)], fill=(5, 10, 20, alpha))
        img.paste(top_grad, (0, 0), top_grad)

        # 3. Huy hiệu Trending ở góc trên
        clean_badge = (badge_text or "🔥 TOP 1 BÁN CHẠY 2026").strip()
        badge_font = get_system_font(max(16, int(h * 0.036)), bold=True)
        b_pad_x, b_pad_y = int(w * 0.03), int(h * 0.014)
        b_left, b_top = int(w * 0.04), int(h * 0.035)

        bbox = draw.textbbox((0, 0), clean_badge, font=badge_font)
        bw = (bbox[2] - bbox[0]) + b_pad_x * 2
        bh = (bbox[3] - bbox[1]) + b_pad_y * 2

        # Vẽ hộp huy hiệu đỏ viền vàng neon
        draw.rounded_rectangle(
            [(b_left, b_top), (b_left + bw, b_top + bh)],
            radius=int(bh * 0.4),
            fill=(220, 38, 38, 245),
            outline=(253, 224, 71, 230),
            width=2
        )
        draw.text((b_left + b_pad_x, b_top + b_pad_y - 2), clean_badge, fill=(255, 255, 255, 255), font=badge_font)

        # 4. Tiêu đề chính (Tên sản phẩm chủ đạo) 3D Viền Đen dày
        clean_hl = headline.strip().upper()
        if not clean_hl:
            clean_hl = "SIÊU PHẨM HOT NHẤT"

        hl_font_size = max(24, int(w * 0.075))
        hl_font = get_system_font(hl_font_size, bold=True)

        hl_bbox = draw.textbbox((0, 0), clean_hl, font=hl_font)
        hl_w = hl_bbox[2] - hl_bbox[0]
        hl_h = hl_bbox[3] - hl_bbox[1]

        # Canh giữa
        hl_x = max(10, (w - hl_w) // 2)
        hl_y = h - int(h * 0.36)

        # Viền đen 3D siêu dày và đổ bóng
        stroke_w = max(4, int(hl_font_size * 0.1))
        for dx in range(-stroke_w, stroke_w + 1):
            for dy in range(-stroke_w, stroke_w + 1):
                if dx != 0 or dy != 0:
                    draw.text((hl_x + dx, hl_y + dy), clean_hl, font=hl_font, fill=(0, 0, 0, 255))

        # Chữ vàng ánh kim rực rỡ
        draw.text((hl_x, hl_y), clean_hl, font=hl_font, fill=(254, 240, 138, 255))

        # 5. Tiêu đề phụ (Lợi ích vượt trội)
        clean_sub = (sub_headline or "PHUN MẠNH GẤP 5 LẦN - TIẾT KIỆM NƯỚC").strip()
        sub_font_size = max(16, int(w * 0.046))
        sub_font = get_system_font(sub_font_size, bold=True)

        sub_bbox = draw.textbbox((0, 0), clean_sub, font=sub_font)
        sub_w = sub_bbox[2] - sub_bbox[0]
        sub_x = max(10, (w - sub_w) // 2)
        sub_y = h - int(h * 0.22)

        sub_stroke = max(3, int(sub_font_size * 0.08))
        for dx in range(-sub_stroke, sub_stroke + 1):
            for dy in range(-sub_stroke, sub_stroke + 1):
                if dx != 0 or dy != 0:
                    draw.text((sub_x + dx, sub_y + dy), clean_sub, font=sub_font, fill=(0, 0, 0, 240))

        draw.text((sub_x, sub_y), clean_sub, font=sub_font, fill=(255, 255, 255, 255))

        # 6. Dải Cam Kết Tính Năng Vàng (3 Feature Tags ở chân ảnh)
        feat_list = features or ["TĂNG ÁP 500%", "LỌC SẠCH CẶN", "TIẾT KIỆM 80%"]
        feat_font_size = max(12, int(w * 0.032))
        feat_font = get_system_font(feat_font_size, bold=True)

        banner_y = h - int(h * 0.10)
        banner_h = int(h * 0.065)
        banner_w = int(w * 0.92)
        banner_x = (w - banner_w) // 2

        # Hộp nền đen mờ viền xanh neon
        draw.rounded_rectangle(
            [(banner_x, banner_y), (banner_x + banner_w, banner_y + banner_h)],
            radius=int(banner_h * 0.35),
            fill=(15, 23, 42, 220),
            outline=(56, 189, 248, 200),
            width=2
        )

        feat_text = "  •  ".join([f"✓ {f.strip()}" for f in feat_list[:3]])
        f_bbox = draw.textbbox((0, 0), feat_text, font=feat_font)
        f_w = f_bbox[2] - f_bbox[0]
        f_h = f_bbox[3] - f_bbox[1]
        f_x = max(banner_x + 6, banner_x + (banner_w - f_w) // 2)
        f_y = banner_y + (banner_h - f_h) // 2 - 2

        draw.text((f_x, f_y), feat_text, fill=(56, 189, 248, 255), font=feat_font)

        # 7. Xuất file Thumbnail chất lượng tối đa
        os.makedirs(os.path.dirname(os.path.abspath(output_thumbnail_path)), exist_ok=True)
        img.convert("RGB").save(output_thumbnail_path, quality=96)

        return {
            "status": "ok",
            "thumbnail_path": output_thumbnail_path,
            "raw_frame_path": raw_frame_output_path,
            "headline": clean_hl,
            "sub_headline": clean_sub,
            "badge": clean_badge,
            "features": feat_list,
            "width": w,
            "height": h
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "error": str(e)}
