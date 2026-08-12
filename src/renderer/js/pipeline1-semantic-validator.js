function normalizeText(value) {
  return String(value || '')
    .toLocaleLowerCase('vi-VN')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsAny(text, terms) {
  const normalized = normalizeText(text);
  return terms.some(term => normalized.includes(normalizeText(term)));
}

function sceneEvidenceText(scene) {
  return [scene?.visual, scene?.speech_context, scene?.purpose].filter(Boolean).join(' ');
}

const PROCESS_RULES = [
  {
    id: 'mold',
    beatTerms: ['khuon', 'dong khuon', 'tao hinh', 'ep khuon', 'mold', 'demold'],
    evidenceTerms: ['mold', 'demold', 'press', 'shape', 'carved', 'khuon', 'tao hinh'],
  },
  {
    id: 'steam',
    beatTerms: ['hap', 'steam'],
    evidenceTerms: ['steam', 'steamer', 'hap', '蒸'],
  },
  {
    id: 'bake',
    beatTerms: ['nuong', 'bake', 'oven'],
    evidenceTerms: ['bake', 'baked', 'oven', 'nuong', '烤'],
  },
  {
    id: 'wash-peel-soak',
    beatTerms: ['rua', 'tach vo', 'boc vo', 'ngam', 'soak', 'wash', 'peel'],
    evidenceTerms: ['wash', 'water', 'skin', 'peel', 'soak', 'vo', 'ngam', 'rua'],
  },
  {
    id: 'mix-syrup',
    beatTerms: ['tron', 'duong', 'siro', 'syrup', 'mix'],
    evidenceTerms: ['mix', 'syrup', 'sugar', 'pour', 'stir', 'duong', 'tron'],
  },
  {
    id: 'cook-stir',
    beatTerms: ['sen', 'xao', 'dao', 'nau', 'cook', 'stir'],
    evidenceTerms: ['cook', 'wok', 'stir', 'paddle', 'flame', 'pan', 'nau', 'dao'],
  },
  {
    id: 'fill',
    beatTerms: ['nhan', 'bao nhan', 'filling', 'fill'],
    evidenceTerms: ['fill', 'filling', 'center', 'inside', 'nhan'],
  },
];

const FINAL_EVIDENCE_TERMS = [
  'finished', 'final product', 'presentation', 'displayed', 'served', 'plate',
  'demold', 'molded cakes', 'texture', 'filling', 'thanh pham', 'hoan thien',
];

const HIGH_RISK_CLAIMS = [
  'de tieu hoa',
  'an toan',
  'tot cho suc khoe',
  'khong pha tap chat',
  'khong chat bao quan',
  'nguyen chat',
  'chua benh',
  'dieu tri',
];

function validateTargetDurations(strategyTarget, beats) {
  const target = Number(strategyTarget) || 0;
  if (!(target > 0)) throw new Error('Semantic Remix: strategy target duration không hợp lệ.');
  const sum = beats.reduce((total, beat) => total + (Number(beat?.target_duration_sec) || 0), 0);
  const tolerance = Math.max(2, target * 0.05);
  if (Math.abs(sum - target) > tolerance) {
    throw new Error(`Semantic Remix: timeline không nhất quán — strategy=${target.toFixed(1)}s nhưng tổng beat=${sum.toFixed(1)}s.`);
  }
  return sum;
}

function validateSceneMeaning(beats, scenes) {
  const sceneMap = new Map(scenes.map(scene => [Number(scene?.index), scene]));
  const lateFinalScenes = scenes.filter((scene) => {
    const index = Number(scene?.index) || 0;
    return index >= Math.floor(scenes.length * 0.6) && containsAny(sceneEvidenceText(scene), FINAL_EVIDENCE_TERMS);
  });

  for (const beat of beats) {
    const beatIndex = Number(beat?.beat_index);
    const refs = Array.isArray(beat?.source_scene_indexes) ? beat.source_scene_indexes.map(Number) : [];
    const referencedScenes = refs.map(index => sceneMap.get(index)).filter(Boolean);
    if (referencedScenes.length !== refs.length || !referencedScenes.length) {
      throw new Error(`Semantic Remix: beat ${beatIndex} có source scene không tồn tại.`);
    }

    const beatText = `${beat?.message || ''} ${beat?.reason || ''}`;
    const evidence = referencedScenes.map(sceneEvidenceText).join(' ');
    for (const rule of PROCESS_RULES) {
      if (containsAny(beatText, rule.beatTerms) && !containsAny(evidence, rule.evidenceTerms)) {
        throw new Error(`Semantic Remix: beat ${beatIndex} nói về ${rule.id} nhưng source scene không có evidence tương ứng.`);
      }
    }

    if (String(beat?.role || '') === 'cta' && lateFinalScenes.length > 0) {
      const hasFinalEvidence = referencedScenes.some(scene => containsAny(sceneEvidenceText(scene), FINAL_EVIDENCE_TERMS));
      if (!hasFinalEvidence) {
        throw new Error(`Semantic Remix: CTA beat ${beatIndex} không map vào cảnh thành phẩm/final evidence dù video có cảnh kết quả.`);
      }
    }
  }
}

function validateUnsupportedClaims(analysis, narrationScript, transcriptSrt, scenes) {
  const hardClaims = [
    narrationScript,
    analysis?.product_profile?.value_proposition,
    ...(Array.isArray(analysis?.product_profile?.features) ? analysis.product_profile.features : []),
    ...(Array.isArray(analysis?.product_profile?.benefits) ? analysis.product_profile.benefits : []),
  ].filter(Boolean).join(' ');
  const evidence = [transcriptSrt, ...scenes.map(sceneEvidenceText)].join(' ');

  for (const claim of HIGH_RISK_CLAIMS) {
    if (containsAny(hardClaims, [claim]) && !containsAny(evidence, [claim])) {
      throw new Error(`Semantic Remix: claim "${claim}" không có evidence nguồn rõ ràng.`);
    }
  }
}

function validateNarrationCoverage(narrationScript, beats, narrationBudget) {
  const estimatedRate = Number(narrationBudget?.estimated_chars_per_sec) || 15;
  const predicted = String(narrationScript || '').length / Math.max(1, estimatedRate);
  const narratedTarget = beats.reduce((total, beat) => total + (Number(beat?.target_duration_sec) || 0), 0);
  const ratio = narratedTarget > 0 ? predicted / narratedTarget : 0;
  if (ratio < 0.70 || ratio > 1.30) {
    throw new Error(
      `Semantic Remix: narration coverage không khớp plan — predicted=${predicted.toFixed(1)}s, narrated_target=${narratedTarget.toFixed(1)}s, ratio=${(ratio * 100).toFixed(1)}%.`
    );
  }
  return { predicted, narratedTarget, ratio };
}

export function validateSemanticRuntimeAnalysis({ analysis, scenes, narrationScript, narrationBudget, transcriptSrt }) {
  const beats = Array.isArray(analysis?.remix_beats) ? analysis.remix_beats : [];
  if (!beats.length) throw new Error('Semantic Remix: remix_beats rỗng.');

  const summedBeatDuration = validateTargetDurations(analysis?.remix_strategy?.target_duration_sec, beats);
  validateSceneMeaning(beats, scenes);
  validateUnsupportedClaims(analysis, narrationScript, transcriptSrt, scenes);
  const narration = validateNarrationCoverage(narrationScript, beats, narrationBudget);

  return {
    summed_beat_duration_sec: Number(summedBeatDuration.toFixed(3)),
    narrated_target_duration_sec: Number(narration.narratedTarget.toFixed(3)),
    predicted_narration_duration_sec: Number(narration.predicted.toFixed(3)),
    predicted_to_narrated_ratio: Number(narration.ratio.toFixed(4)),
  };
}

export { normalizeText };
