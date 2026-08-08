import os
import sys
import tempfile
import hashlib
import json
import shutil
from fractions import Fraction

# Ensure api directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from api.p1_artifacts import (
    P1ArtifactError, get_jobs_root, validate_job_id, compute_source_fingerprint,
    compute_timebase, get_p1_dir, get_manifest_path, init_p1_job, load_manifest,
    save_raw_srt, update_tts_artifacts
)

def run_tests():
    fails = 0

    def assert_eq(a, b, msg):
        nonlocal fails
        if a != b:
            print(f"FAIL: {msg} (expected {b!r}, got {a!r})")
            fails += 1

    def assert_raises(exc_type, error_code, func, *args):
        nonlocal fails
        try:
            func(*args)
            print(f"FAIL: Expected {exc_type.__name__} with code {error_code}, but got none")
            fails += 1
        except exc_type as e:
            if getattr(e, 'code', None) != error_code:
                print(f"FAIL: Expected code {error_code}, got {getattr(e, 'code', None)}")
                fails += 1
        except Exception as e:
            print(f"FAIL: Expected {exc_type.__name__}, got {type(e).__name__}: {e}")
            fails += 1

    # 1. jobs-root environment override resolves exactly
    os.environ['VIDEO_SUBTITLE_REMOVER_JOBS_ROOT'] = '/tmp/fake_jobs_root'
    assert_eq(get_jobs_root(), os.path.abspath('/tmp/fake_jobs_root'), "jobs-root env override")
    del os.environ['VIDEO_SUBTITLE_REMOVER_JOBS_ROOT']

    # 2. safe job ids are accepted; empty, traversal (../x), slash/backslash, whitespace and >128 chars are rejected with P1_INVALID_JOB_ID
    validate_job_id('valid_job-id-123')
    
    assert_raises(P1ArtifactError, 'P1_INVALID_JOB_ID', validate_job_id, '')
    assert_raises(P1ArtifactError, 'P1_INVALID_JOB_ID', validate_job_id, '../traversal')
    assert_raises(P1ArtifactError, 'P1_INVALID_JOB_ID', validate_job_id, 'with slash/id')
    assert_raises(P1ArtifactError, 'P1_INVALID_JOB_ID', validate_job_id, 'with backslash\\id')
    assert_raises(P1ArtifactError, 'P1_INVALID_JOB_ID', validate_job_id, 'with whitespace')
    assert_raises(P1ArtifactError, 'P1_INVALID_JOB_ID', validate_job_id, 'a' * 129)

    # 3. known fake source bytes produce exact sha256:<hex> full-file fingerprint
    with tempfile.NamedTemporaryFile(delete=False) as f:
        f.write(b"fake source bytes")
        f.flush()
        fp = compute_source_fingerprint(f.name)
        expected_hash = hashlib.sha256(b"fake source bytes").hexdigest()
        assert_eq(fp, f"sha256:{expected_hash}", "fingerprint of known bytes")
        
        # 4. 4 MiB streaming path handles a file larger than one chunk
        large_bytes = b"0" * (5 * 1024 * 1024)
        f.seek(0)
        f.write(large_bytes)
        f.truncate()
        f.flush()
        fp_large = compute_source_fingerprint(f.name)
        expected_hash_large = hashlib.sha256(large_bytes).hexdigest()
        assert_eq(fp_large, f"sha256:{expected_hash_large}", "fingerprint of >4MiB file")
    os.unlink(f.name)

    # 5. metadata 30 fps -> timebase 1/30
    assert_eq(compute_timebase(30.0), '1/30', "timebase for 30fps")

    # 6. metadata approximately 29.97002997 fps -> timebase 1001/30000
    assert_eq(compute_timebase(29.97002997), '1001/30000', "timebase for 29.97fps")

    # Tests using real tmp jobs dir
    jobs_dir = tempfile.mkdtemp()
    os.environ['VIDEO_SUBTITLE_REMOVER_JOBS_ROOT'] = jobs_dir
    try:
        job_id = 'test_job_1'
        with tempfile.NamedTemporaryFile(delete=False) as sf:
            sf.write(b"source data")
            sf.flush()
            sf_name = sf.name
            sf_fp = compute_source_fingerprint(sf_name)
        
        # 7. base manifest has exact required schema/version and null artifact entries
        manifest = init_p1_job(job_id, sf_name, 30.0, 300)
        assert_eq(manifest['artifact_version'], '1', "base manifest version")
        assert_eq(manifest['job_id'], job_id, "base manifest job_id")
        assert_eq(manifest['source_fingerprint'], sf_fp, "base manifest fingerprint")
        assert_eq(manifest['timebase'], '1/30', "base manifest timebase")
        assert_eq(manifest['timebase_source'], 'fps-derived-v1', "base manifest timebase_source")
        assert_eq(manifest['artifacts']['raw_srt'], None, "base manifest artifacts.raw_srt")
        
        m_path = get_manifest_path(job_id)
        with open(m_path, 'r') as mf:
            disk_manifest = json.load(mf)
            assert_eq(disk_manifest, manifest, "disk manifest matches")

        # 8. raw SRT persistence writes raw.srt, updates manifest, leaves no raw.srt.tmp/manifest.json.tmp
        srt_content = "1\n00:00:00,000 --> 00:00:01,000\nHello\n"
        save_raw_srt(job_id, srt_content)
        p1_dir = get_p1_dir(job_id)
        assert_eq(os.path.exists(os.path.join(p1_dir, 'raw.srt')), True, "raw.srt written")
        assert_eq(os.path.exists(os.path.join(p1_dir, 'raw.srt.tmp')), False, "no raw.srt.tmp left")
        assert_eq(os.path.exists(os.path.join(p1_dir, 'manifest.json.tmp')), False, "no manifest.json.tmp left")
        disk_manifest2 = load_manifest(job_id)
        assert_eq(disk_manifest2['artifacts']['raw_srt'], 'raw.srt', "manifest updated for raw.srt")

        # 9. same job + same source is idempotent
        manifest2 = init_p1_job(job_id, sf_name, 30.0, 300)
        assert_eq(manifest2['artifacts']['raw_srt'], 'raw.srt', "idempotent init retains artifacts")

        # 10. same job + different source fingerprint raises P1_SOURCE_IDENTITY_MISMATCH and preserves original manifest bytes
        with open(m_path, 'rb') as f:
            orig_manifest_bytes = f.read()

        with tempfile.NamedTemporaryFile(delete=False) as sf2:
            sf2.write(b"different source data")
            sf2_name = sf2.name
        
        assert_raises(P1ArtifactError, 'P1_SOURCE_IDENTITY_MISMATCH', init_p1_job, job_id, sf2_name, 30.0, 300)
        
        with open(m_path, 'rb') as f:
            new_manifest_bytes = f.read()
        assert_eq(new_manifest_bytes, orig_manifest_bytes, "manifest preserved after identity mismatch")
        os.unlink(sf2_name)

        # 11. TTS artifact manifest update records only relative tts.mp3, tts.srt, optional karaoke.ass names
        update_tts_artifacts(job_id, 'tts.mp3', 'tts srt content')
        disk_manifest3 = load_manifest(job_id)
        assert_eq(disk_manifest3['artifacts']['tts_audio'], 'tts.mp3', "relative tts_audio")
        assert_eq(disk_manifest3['artifacts']['tts_srt'], 'tts.srt', "relative tts_srt")
        
        # 12. manifest loader rejects malformed/incompatible manifest rather than silently replacing it
        with open(m_path, 'w') as mf:
            mf.write("not valid json")
        try:
            load_manifest(job_id)
            print("FAIL: Expected JSONDecodeError for malformed manifest")
            fails += 1
        except json.JSONDecodeError:
            pass

    finally:
        shutil.rmtree(jobs_dir)
        try:
            os.unlink(sf_name)
        except:
            pass

    if fails > 0:
        print(f"FAIL: {fails} assertions failed.")
        sys.exit(1)
    else:
        print("PASS")
        sys.exit(0)

if __name__ == '__main__':
    run_tests()
