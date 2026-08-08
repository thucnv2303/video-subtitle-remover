from pathlib import Path
import hashlib
import sys

EXPECTED = {
    '.ai/current_state.md': '29cdb4357a5f339a4826bb6a7be1c267bf7f148e',
    '.ai/task_current.md': '07a8e6c3dcd88cc38f213c05638834d829361266',
    '.ai/handoff.md': '793026f262859719e96080e18cb4d7fb32835016',
}

TASK = 'RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035'
NEXT = 'RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A'
SOURCE = 'ea9521f6fe957e24e49cc5d090e275511d91141d'
EVIDENCE = '.ai/audits/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-PM-VERIFIED.md'


def fail(msg):
    print('STOP — AUDIT035 PM CLOSEOUT PRECONDITION FAILED: ' + msg, file=sys.stderr)
    raise SystemExit(2)


def blob(data):
    return hashlib.sha1((f'blob {len(data)}\0').encode('ascii') + data).hexdigest()


def split(line):
    if line.endswith(b'\r\n'):
        return line[:-2], b'\r\n'
    if line.endswith(b'\n'):
        return line[:-1], b'\n'
    if line.endswith(b'\r'):
        return line[:-1], b'\r'
    return line, b''


def find(lines, text, start=0, end=None, label=None):
    if end is None:
        end = len(lines)
    target = text.encode('utf-8')
    matches = []
    for i in range(start, end):
        body, eol = split(lines[i])
        if body == target:
            matches.append((i, eol))
    if len(matches) != 1:
        fail((label or text) + f': expected 1 match, got {len(matches)}')
    return matches[0]


def section(lines, start_header, end_header):
    s, _ = find(lines, start_header, label='section ' + start_header)
    e, _ = find(lines, end_header, start=s + 1, label='section ' + end_header)
    if e <= s:
        fail('invalid section order')
    return s, e


def repl(lines, start, end, old, new, label):
    i, eol = find(lines, old, start=start, end=end, label=label)
    lines[i] = new.encode('utf-8') + eol


def patch_current(data):
    lines = data.splitlines(keepends=True)
    s, e = section(lines, '## Status', '## Primary Input (OWNER CONFIRMED)')
    repl(lines, s, e,
         'COMPLETED — MERGED — RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2',
         'COMPLETED — PM VERIFIED — ' + TASK,
         'current status')

    s, e = section(lines, '## Active Task / PR', '### Historical: 032/033/034 ancestry')
    pairs = [
        ('- Last completed task: RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2', '- Last completed product task: RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2 — MERGED'),
        ('- PR: #14 — MERGED', '- Last completed audit: ' + TASK + ' — PM VERIFIED'),
        ('- Canonical branch after merge: recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement', '- Accepted PM evidence: ' + EVIDENCE),
        ('- Reviewed source SHA: ' + SOURCE, '- Reviewed application source SHA: ' + SOURCE),
        ('- Owner previous result: Job Card UI PASS / AI provider-model FAIL', '- Executor PR #16: INVALIDATED / CLOSED / NOT MERGED'),
        ('- Owner observation: Owner reported on 2026-08-07: task 34 đã oke', '- Executor PR #17: INVALIDATED / CLOSED / NOT MERGED'),
        ('- Code review: PASS', '- Owner verification: NOT REQUIRED — read-only audit'),
        ('- Owner retest: PASS', '- Documentation synchronization: PASS'),
        ('- Merge: MERGED — edc699930f4537f5f52568e9c0aaa8aeb68fb67b', '- Next implementation candidate: ' + NEXT + ' — NOT AUTHORIZED until a new remote ACTIVE spec is published'),
    ]
    for n, (old, new) in enumerate(pairs, 1):
        repl(lines, s, e, old, new, f'current active {n}')

    s, e = section(lines, '## Verification Gates', '## Security Incident')
    pairs = [
        ('- Automated verification: .\\node_modules\\.bin\\electron.cmd tests\\test_pipeline1_runtime.js exit 0 (115 PASS / 0 FAIL / 0 NOT TESTED), node tests\\test_renderer_dom_structure.js exit 0 (35 PASS / 0 FAIL), node --check src\\renderer\\js\\app.js exit 0, node --check src\\renderer\\js\\pipelines\\pipeline1-ai.js exit 0', '- Audit execution: PASS — PM independently verified canonical GitHub source; executor audit publications were not accepted as proof'),
        ('- Code review: PASS', '- Automated verification: N/A — read-only source audit; no product code changed'),
        ('- Owner: PASS', '- Code review: PASS — PM direct source review'),
        ('- Documentation: PASS', '- Owner: NOT REQUIRED — read-only audit'),
        ('- Merge: PASS — PR #14 merged at edc699930f4537f5f52568e9c0aaa8aeb68fb67b', '- Documentation: PASS'),
        ('- RECOVERY-007E-SOURCE-BASELINE-002: COMPLETED - PASS WITH GIT-NORMALIZED LF', '- Product merge permission: BLOCKED until an implementation task is separately reviewed and approved'),
        ('- RECOVERY-007E-AI-SETTINGS-001: CANDIDATE_FIX — WAITING_PM_REVIEW - OWNER RETEST NOT STARTED', '- Next task authority: ' + NEXT + ' is selected as candidate only; execution requires a separate PM-authored ACTIVE spec'),
    ]
    for n, (old, new) in enumerate(pairs, 1):
        repl(lines, s, e, old, new, f'current gates {n}')
    return b''.join(lines)


def patch_task(data):
    lines = data.splitlines(keepends=True)
    s, e = section(lines, '## Task ID', '## Name')
    repl(lines, s, e, 'RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2', TASK, 'task id')
    s, e = section(lines, '## Name', '## Status')
    repl(lines, s, e, 'Pipeline 1 Per-Job AI Provider + Model Selector (REV2)', 'Pipeline 1 Artifact Contract Audit — PM Verified', 'task name')
    s, e = section(lines, '## Status', '## Current PR / Branch / SHA')
    repl(lines, s, e, 'COMPLETED — MERGED', 'COMPLETED — PM VERIFIED', 'task status')

    s, e = section(lines, '## Current PR / Branch / SHA', '## Historical: 032 / 033 ancestry')
    pairs = [
        ('- PR: #14 — MERGED', '- Executor PR #16: INVALIDATED / CLOSED / NOT MERGED'),
        ('- Canonical branch: recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement', '- Executor PR #17: INVALIDATED / CLOSED / NOT MERGED'),
        ('- Reviewed source SHA: ' + SOURCE, '- Canonical branch: recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement'),
        ('- Owner previous result (033 + 034): Job Card UI PASS / AI provider-model FAIL', '- Reviewed application source SHA: ' + SOURCE),
        ('- Owner observation: direct Owner report on 2026-08-07: task 34 đã oke', '- Accepted PM evidence: ' + EVIDENCE),
        ('- Automated verification: PASS', '- Automated verification: N/A — read-only source audit'),
        ('- Code review: PASS', '- Code review: PASS — PM direct source review'),
        ('- Owner manual verification: PASS', '- Owner manual verification: NOT REQUIRED'),
        ('- Documentation synchronization: PASS', '- Documentation synchronization: PASS'),
        ('- Merge: MERGED — edc699930f4537f5f52568e9c0aaa8aeb68fb67b', '- Next task: ' + NEXT + ' — NOT AUTHORIZED until remote ACTIVE publishes its exact implementation spec'),
    ]
    for n, (old, new) in enumerate(pairs, 1):
        repl(lines, s, e, old, new, f'task current {n}')
    return b''.join(lines)


def patch_handoff(data):
    lines = data.splitlines(keepends=True)
    s, e = section(lines, '## Last completed task', '## Active Task')
    repl(lines, s, e,
         'RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2: COMPLETED — PM VERIFIED — MERGED',
         TASK + ': COMPLETED — PM VERIFIED',
         'handoff last')

    s, e = section(lines, '## Active Task', '## Next permitted action')
    repl(lines, s, e, 'NONE — Task 034 merged in PR #14', 'NONE — PM is preparing the exact implementation spec for ' + NEXT, 'handoff active')

    s, e = section(lines, '## Next permitted action', '## Source SHA')
    repl(lines, s, e,
         'No active executor task. Project Manager selects the next task from the merged canonical base. Task 035/036 remain NOT AUTHORIZED until a new remote ACTIVE spec is published.',
         'Project Manager publishes the exact remote ACTIVE/spec for ' + NEXT + '. Anti must not implement it before that publication.',
         'handoff top action')
    repl(lines, s, e,
         'PR #14 merged at edc699930f4537f5f52568e9c0aaa8aeb68fb67b after explicit PM approval.',
         'Audit 035 evidence is PM-verified from canonical source; executor PR #16 and PR #17 were invalidated and closed without merge.',
         'handoff top note')

    s, e = section(lines, '## Next Permitted Action', '## Execution')
    repl(lines, s, e,
         'No active executor task. Project Manager selects the next task from the merged canonical base. Task 035/036 remain NOT AUTHORIZED until a new remote ACTIVE spec is published.',
         'Project Manager publishes the exact remote ACTIVE/spec for ' + NEXT + '. No implementation is authorized before that.',
         'handoff lower action')

    s, e = section(lines, '## Execution', '## Code review')
    repl(lines, s, e, 'PASS (static checks and runtime tests)', 'PASS — PM direct source audit; no product code changed', 'handoff execution')
    s, e = section(lines, '## Code review', '## Automated verification')
    repl(lines, s, e, 'PASS', 'PASS — PM direct source review', 'handoff review')
    s, e = section(lines, '## Automated verification', '## Owner manual app verification')
    repl(lines, s, e,
         'PASS - .\\node_modules\\.bin\\electron.cmd tests\\test_pipeline1_runtime.js exit 0 (115 PASS / 0 FAIL / 0 NOT TESTED), node tests\\test_renderer_dom_structure.js exit 0 (35 PASS / 0 FAIL)',
         'N/A — read-only audit; no app/tests executed for Audit 035',
         'handoff automated')
    s, e = section(lines, '## Owner manual app verification', '## Documentation synchronization')
    repl(lines, s, e, 'PASS (direct Owner report on 2026-08-07: task 34 đã oke)', 'NOT REQUIRED — read-only audit', 'handoff owner')
    s, e = section(lines, '## Documentation synchronization', '## Merge permission')
    repl(lines, s, e, 'PASS', 'PASS', 'handoff docs')
    s, e = section(lines, '## Merge permission', '## PR Tracking Facts')
    repl(lines, s, e,
         'USED — PR #14 merged at edc699930f4537f5f52568e9c0aaa8aeb68fb67b',
         'BLOCKED — no product implementation merge is authorized until ' + NEXT + ' completes all gates',
         'handoff merge')
    return b''.join(lines)

PATCH = {
    '.ai/current_state.md': patch_current,
    '.ai/task_current.md': patch_task,
    '.ai/handoff.md': patch_handoff,
}


def main():
    root = Path.cwd()
    original = {}
    changed = {}
    for rel, expected in EXPECTED.items():
        data = (root / rel).read_bytes()
        if blob(data) != expected:
            fail(rel + ': blob mismatch')
        original[rel] = data
    for rel, fn in PATCH.items():
        before = original[rel]
        after = fn(before)
        if before == after:
            fail(rel + ': no change')
        if before.count(b'\r\n') != after.count(b'\r\n') or before.count(b'\n') != after.count(b'\n'):
            fail(rel + ': line-ending count changed')
        changed[rel] = after
    for rel, data in changed.items():
        (root / rel).write_bytes(data)
        print(f'PATCHED {rel} blob_before={blob(original[rel])} blob_after={blob(data)}')

if __name__ == '__main__':
    main()
