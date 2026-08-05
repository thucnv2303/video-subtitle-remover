# QA Checklist

## Owner Manual App Verification (RECOVERY-007-OWNER-VERIFY-001)
- [ ] Owner launches the existing application using the normal known launch procedure.
- [ ] No dependencies, packages or environment components are installed or upgraded.
- [ ] Owner imports a representative Chinese product-review source video.
- [ ] Owner starts Pipeline 1 only.
- [ ] Pipeline 1 uses the selected original video.
- [ ] Pipeline 1 ASR returns SRT/text.
- [ ] The returned result is associated with the correct job.
- [ ] The Step 1 editor displays the returned text/SRT.
- [ ] No Pipeline 2 subtitle-removal or inpaint operation starts during Pipeline 1.
- [ ] No unintended *_ocr_tmp.mp4 file is generated.
- [ ] Pipeline 1 does not time out while waiting for OCR/ASR/SRT.
- [ ] Error and progress states are visible and understandable.
- [ ] After the Pipeline 1 observation is recorded, owner runs a separate existing Pipeline 2 regression check.
- [ ] Pipeline 2 still produces the expected clean-video result.
- [ ] Owner records exact observed PASS/FAIL, error text, visible state and output filenames.
- [ ] AI provider/model discovery is explicitly excluded because RECOVERY-007E is NOT IMPLEMENTED.
