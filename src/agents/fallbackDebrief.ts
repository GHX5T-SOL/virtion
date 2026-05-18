import type { DebriefRequest } from './debriefRequest';
import { caseEvaluationInput, type CaseEvaluationInput, type CriterionResult, type VerdictBand } from './customTools';
import type { RubricCriterion, RubricDomain } from '../game/types';

interface BackendFallbackResponse {
  evaluation: unknown;
  provider?: string;
  model?: string;
  degraded?: boolean;
  fallback_trace?: unknown[];
}

function band(ratio: number): VerdictBand {
  if (ratio >= 0.85) return 'excellent';
  if (ratio >= 0.70) return 'good';
  if (ratio >= 0.55) return 'satisfactory';
  if (ratio >= 0.40) return 'borderline';
  return 'clear-fail';
}

function scoreDomain(criteria: Array<CriterionResult & { weight: number }>) {
  const max = criteria.reduce((sum, c) => sum + c.weight, 0);
  const raw = criteria.reduce((sum, c) => {
    if (c.verdict === 'met') return sum + c.weight;
    if (c.verdict === 'partially-met') return sum + c.weight * 0.5;
    return sum;
  }, 0);
  return { raw, max, verdict: band(max > 0 ? raw / max : 0) };
}

function criterionResult(
  criterion: RubricCriterion,
  domain: RubricDomain,
  verdict: CriterionResult['verdict'],
  evidence: string,
): CriterionResult & { weight: number } {
  return {
    criterion_id: criterion.criterion_id,
    domain,
    verdict,
    evidence,
    guideline_ref: criterion.guideline_ref ?? null,
    weight: criterion.weight,
  };
}

export function buildLocalFallbackDebrief(req: DebriefRequest, note = 'Premium AI debrief was unavailable.'): CaseEvaluationInput {
  const asked = req.encounter_log.history_questions_asked;
  const relevantAsked = asked.filter((q) => q.relevant_per_case);
  const treatments = req.encounter_log.treatments_given;
  const critical = treatments.filter((t) => t.was_critical);
  const didManagement =
    req.encounter_log.tests_ordered.length > 0 ||
    treatments.length > 0 ||
    req.encounter_log.prescriptions.length > 0 ||
    req.encounter_log.submitted_diagnosis_id !== null;

  const dataGathering = req.rubric.data_gathering.map((criterion, i) => {
    if (i < relevantAsked.length) {
      return criterionResult(criterion, 'data_gathering', 'met', `Asked: ${relevantAsked[i].question}`);
    }
    if (asked.length > 0) {
      return criterionResult(criterion, 'data_gathering', 'partially-met', 'Some history was gathered, but this rubric item was not clearly evidenced.');
    }
    return criterionResult(criterion, 'data_gathering', 'missed', 'No relevant history was recorded for this rubric item.');
  });

  const clinicalManagement = req.rubric.clinical_management.map((criterion, i) => {
    const label = criterion.label.toLowerCase();
    if (label.includes('diagnos') && req.encounter_log.diagnosis_was_correct) {
      return criterionResult(criterion, 'clinical_management', 'met', 'Submitted diagnosis matched the case gold standard.');
    }
    if (critical.length > 0) {
      const action = critical[Math.min(i, critical.length - 1)];
      return criterionResult(criterion, 'clinical_management', i < critical.length ? 'met' : 'partially-met', `Recorded critical action: ${action.treatment_name}`);
    }
    if (didManagement) {
      return criterionResult(criterion, 'clinical_management', 'partially-met', 'Some management action was recorded, but this criterion was not clearly satisfied.');
    }
    return criterionResult(criterion, 'clinical_management', 'missed', 'No management action was recorded for this criterion.');
  });

  const interpersonal = req.rubric.interpersonal.map((criterion) => (
    asked.length > 0
      ? criterionResult(criterion, 'interpersonal', 'partially-met', 'Encounter activity was present, but no complete transcript was available to score communication fully.')
      : criterionResult(criterion, 'interpersonal', 'missed', 'No transcript or history activity was available to score communication.')
  ));

  const scored = [...dataGathering, ...clinicalManagement, ...interpersonal];
  const domain_scores = {
    data_gathering: scoreDomain(dataGathering),
    clinical_management: scoreDomain(clinicalManagement),
    interpersonal: scoreDomain(interpersonal),
  };
  const totalRaw = domain_scores.data_gathering.raw + domain_scores.clinical_management.raw + domain_scores.interpersonal.raw;
  const totalMax = domain_scores.data_gathering.max + domain_scores.clinical_management.max + domain_scores.interpersonal.max;
  const improvements = [
    !req.encounter_log.diagnosis_was_correct ? 'Confirm the diagnosis against the case evidence before closing.' : null,
    critical.length === 0 && req.rubric.clinical_management.length > 0 ? 'Record the critical management action expected by the rubric.' : null,
    relevantAsked.length < Math.max(1, Math.floor(req.rubric.data_gathering.length / 2)) ? 'Gather more focused history before moving to management.' : null,
  ].filter((item): item is string => Boolean(item)).slice(0, 3);

  return {
    case_id: req.case_id,
    global_rating: band(totalMax > 0 ? totalRaw / totalMax : 0),
    domain_scores,
    criteria: scored.map(({ weight: _weight, ...criterion }) => criterion),
    safety_breach: null,
    highlights: [
      'Fizer preserved the debrief flow through a local deterministic rubric fallback.',
      'Recorded encounter actions were converted into structured domain scores.',
    ],
    improvements: improvements.length ? improvements : ['Rerun the case with premium AI feedback enabled for richer narrative coaching.'],
    narrative: `${note} This local fallback is conservative and scores only from recorded actions: questions, tests, treatments, prescriptions and submitted diagnosis.`,
  };
}

export async function requestFallbackDebrief(req: DebriefRequest, signal?: AbortSignal): Promise<CaseEvaluationInput> {
  const res = await fetch('/agent/debrief/fallback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
    signal,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`fallback debrief failed: ${res.status} ${detail}`);
  }
  const body = (await res.json()) as BackendFallbackResponse;
  const parsed = caseEvaluationInput.safeParse(body.evaluation);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
  }
  return parsed.data;
}
