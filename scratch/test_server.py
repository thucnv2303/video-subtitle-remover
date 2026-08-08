import unittest
from unittest.mock import patch, MagicMock
import os
import tempfile
from fastapi.testclient import TestClient
from api.server import app, ExtractSrtReq, api_extract_srt

class TestServer(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    @patch("subprocess.run")
    @patch("tempfile.mkstemp")
    def test_failed_ffmpeg_cleanup(self, mock_mkstemp, mock_run):
        # Create a dummy temp file
        fd, temp_audio_path = tempfile.mkstemp(suffix=".wav")
        os.close(fd)
        # Ensure it exists
        with open(temp_audio_path, 'w') as f:
            f.write("dummy")
            
        mock_mkstemp.return_value = (fd, temp_audio_path)
        
        # Mock subprocess to fail
        mock_result = MagicMock()
        mock_result.returncode = 1
        mock_run.return_value = mock_result
        
        req = ExtractSrtReq(video_path="dummy.mp4")
        
        # Ensure video_path exists check passes
        with patch("os.path.exists", side_effect=lambda p: True if p == "dummy.mp4" or p == temp_audio_path else False):
            # We don't want os.remove to be mocked, we want it to actually delete the file!
            result = api_extract_srt(req)
            
        self.assertEqual(result["status"], "error")
        # Verify the file was removed
        self.assertFalse(os.path.exists(temp_audio_path))

    @patch("api.server.api_extract_srt")
    def test_mocked_route_success(self, mock_extract):
        mock_extract.return_value = {
            "status": "ok",
            "srt_content": "1\n00:00:00,000 --> 00:00:01,000\nHello"
        }
        
        resp = self.client.post("/api/p1/extract-text", json={
            "job_id": "test-job-456",
            "video_path": "dummy.mp4",
            "extraction_mode": "asr",
            "language": "zh"
        })
        
        data = resp.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["job_id"], "test-job-456")
        self.assertEqual(data["extraction_mode_used"], "asr")
        self.assertEqual(data["srt_content"], "1\n00:00:00,000 --> 00:00:01,000\nHello")

if __name__ == "__main__":
    unittest.main()
