import sys
import os

try:
    import torch
    from paddleocr import TextDetection, PaddleOCR
    import paddle
    import cv2
    import numpy as np
    
    print("CUDA available in torch:", torch.cuda.is_available())
    print("Paddle compiled with CUDA:", paddle.device.is_compiled_with_cuda())
    
    print("Loading TextDetection...")
    detector = TextDetection(
        model_name="ch_PP-OCRv3_det",
        model_dir="models/ch_PP-OCRv3_det_infer",
        device="gpu:0" if paddle.device.is_compiled_with_cuda() else "cpu",
        enable_hpi=False,
    )
    print("Loaded TextDetection!")
    
    print("Loading PaddleOCR...")
    ocr = PaddleOCR(use_angle_cls=False, lang='ch', show_log=False, use_gpu=bool(paddle.device.is_compiled_with_cuda()))
    print("Loaded PaddleOCR!")
    
    # dummy image
    img = np.zeros((100, 100, 3), dtype=np.uint8)
    
    print("Predicting with TextDetection...")
    detector.predict(img)
    
    print("Predicting with PaddleOCR...")
    ocr.ocr(img, cls=False)
    
    print("Done successfully!")
except Exception as e:
    print(f"Error: {e}")
