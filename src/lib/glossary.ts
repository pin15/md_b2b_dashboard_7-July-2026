/**
 * Central glossary of every short form used on the dashboard → its full name and
 * a plain-English explanation + formula. Single source of truth so the HintTip
 * tooltips stay consistent and match the in-product guide. Figures here were
 * code-verified against the metric registry / resolvers (b2b migrations).
 *
 * Usage:  <HintTip tip={GLOSSARY.OWI}>OWI vs baseline</HintTip>
 * Keys are the short form as it appears in the UI (also a few aliases).
 */
export const GLOSSARY: Record<string, string> = {
  OWI: "OWI — Organisational Wellbeing Index: a 0–100 headline blending WHO-5 (+), PSS-10 (−) and OLBI (−), weights renormalised. Bands: Green ≥70 · Amber 55–69 · Coral <55.",
  "WHO-5": "WHO-5 — WHO-5 Well-Being Index: a 5-item wellbeing scale, native 0–100 (≤50 screens for low wellbeing).",
  "PSS-10": "PSS-10 — Perceived Stress Scale (10-item): perceived stress; the high band is ≥68 (Cohen). “High stress” = share of respondents in the high band.",
  PSS: "PSS-10 — Perceived Stress Scale (10-item): perceived stress; the high band is ≥68 (Cohen).",
  OBI: "OBI/OLBI — Oldenburg Burnout Inventory: burnout = exhaustion + disengagement. “High burnout” = share at or above the Wave-1 75th percentile.",
  OLBI: "OLBI — Oldenburg Burnout Inventory: burnout = exhaustion + disengagement composite.",
  BRI: "BRI — Burnout Risk Index: burnout level from OLBI; thresholds set after the first full data wave.",
  "MHSF-III": "MHSF-III — Mental Health Screening Form (3rd revision): an aggregate-safe mental-health screen (0–100, higher is better); cohorts flag for review below 65.",
  MHSF: "MHSF — Mental Health Screening Form: an aggregate-safe mental-health / crisis screen.",
  BRS: "BRS — Brief Resilience Scale: the ability to bounce back from stress; aggregated for L2 + L3 cohorts (k≥5).",
  VDI: "VDI — Vulnerability Distribution Index: the share of a group in each clinical band (low/moderate/high/critical) from the worst of PHQ-9 / GAD-7; cells under 5 people are suppressed.",
  "PHQ-9": "PHQ-9 — Patient Health Questionnaire-9: depression severity, 0–27 (≥15 = moderately severe or worse).",
  "GAD-7": "GAD-7 — Generalised Anxiety Disorder-7: anxiety severity, 0–21 (≥15 = severe).",
  DCS: "DCS — Data Confidence Score: geometric mean of participation, validity and representativeness (0–100). Below 60 the reading is “directional”.",
  RQI: "RQI — the automated response-quality check that produces the Response Validity Rate: a response is excluded at ≥2 independent contradiction flags. Target ≥90%.",
  RCI: "RCI — Reliable Change Index (Jacobson–Truax): the WHO-5 gain a member must exceed to count as a reliable clinical improvement (provisional ≥8.0 pts on the 0–100 WHO-5), measured baseline → current. Recovery Yield counts these per 1,000 covered lives.",
  TQ: "TQ — Trust Quotient: participation × validity × (1 − channel divergence) × trust-item × 100. Floor 60, target 70.",
  CI: "CI — Channel Divergence Index: avg(WHO-5, identified) − avg(pulse, anonymous) per department. Bands: ≤5 green · ≤15 amber · >15 coral.",
  "95% CI":
    "95% CI — 95% confidence interval: the range that would contain the true effect size in ~95% of repeated samples, shown as [lower, upper] around the measured effect. A CI that excludes 0 means the change is statistically distinguishable from none; left blank (never fabricated) where a cohort is suppressed or no comparison exists.",
  ORDI: "ORDI — Observed–Reported Divergence Index: the gap between what teams report (psychological safety) and how they actually behave (observed FieldLens signals).",
  eNPS: "eNPS — Employee Net Promoter Score: 100 × (promoters 9–10 − detractors 0–6) ÷ respondents (−100…+100).",
  ENPS: "eNPS — Employee Net Promoter Score: 100 × (promoters 9–10 − detractors 0–6) ÷ respondents (−100…+100).",
  Edmondson:
    "Psychological Safety (Edmondson 7-item): how safe employees feel to speak up, admit mistakes and raise concerns (0–100).",
  PSYCH_SAFETY:
    "Psychological Safety (Edmondson 7-item): how safe employees feel to speak up, admit mistakes and raise concerns (0–100).",
  SDX: "SDX — Safe Disclosure Index: how safe employees feel disclosing distress or seeking help at work (0–100).",
  "WPAI-GH":
    "WPAI-GH — Work Productivity & Activity Impairment: General Health: self-reported presenteeism + absence; feeds Programme ROI and presenteeism cost.",
  WPAI: "WPAI-GH — Work Productivity & Activity Impairment (General Health): self-reported presenteeism + absence.",
  "WLI-5": "WLI-5 — Work-Life Integration Scale (5-item): a self-report of work–life balance, aggregated per level (k≥5).",
  ISI: "ISI — Insomnia Severity Index: sleep / insomnia severity (≥16 ≈ clinical). The Sleep Index is its 0–100 favourability (≥75 thriving · ≥50 steady).",
  UWES: "UWES — Utrecht Work Engagement Scale: work engagement / vigor.",
  RCQ: "RCQ — Recovery Capacity: a self-reported measure of the capacity to recover from strain.",
  DTS: "DTS — Distress Tolerance Scale: the ability to tolerate emotional distress.",
  STIGMA: "Stigma Index: perceived stigma around seeking mental-health help.",
  COPSOQ: "COPSOQ-III — Copenhagen Psychosocial Questionnaire: the psychosocial work environment.",
  JUSTICE: "Organizational Justice (Colquitt): perceived fairness of decisions, processes and treatment at work.",
  CGSS: "CGSS — Future Readiness: a workforce readiness / adaptability index.",
  IWIS: "IWIS — India Work-Life Integration Scale: work–life integration in the India context (k≥5).",
  KCI: "KCI — Key Care Indicators: the clinical-care scorecard (crisis SLA, time-to-first-session SLA, episode completion, recovery rate).",
  D5: "D5 — self-reported evidence tier: the outcome is derived from self-reported instruments (e.g. WPAI-GH), not HRMS-verified records; an HRMS-verified upgrade is optional.",
  k: "k — k-anonymity threshold: the minimum cohort size (5) required to show an aggregate. Below k the cell is suppressed, so you only ever see team-level directions — never who responded or any individual's result.",
  GAS: "GAS — Goal Attainment Scaling: each coaching goal is scaled −2…+2 (baseline at kickoff, re-scored at close). The figure shown is the weighted mean attainment across completed, scored engagements.",
};
