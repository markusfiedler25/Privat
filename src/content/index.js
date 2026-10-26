// Content registry. All learning content lives in JSON files next to this one.
// Add a stage: write modules/<stage-id>.json (three case-type modules + a stage BA exercise),
// import it below and add it to STAGE_FILES.
import stagesData from './stages.json';
import referral from './modules/referral.json';
import scheduling from './modules/scheduling.json';
import vocabData from './german/vocab.json';
import grammarData from './german/grammar.json';
import careers from './careers.json';
import architecture from './architecture.json';
import radar from './radar.json';
import useToday from './usetoday.json';
import boss from './boss.json';

const STAGE_FILES = [referral, scheduling];

export const CASE_TYPES = stagesData.caseTypes;
export const CASE_BY_ID = Object.fromEntries(CASE_TYPES.map(c => [c.id, c]));
export const STAGES = stagesData.stages.slice().sort((a, b) => a.order - b.order);
export const STAGE_BY_ID = Object.fromEntries(STAGES.map(s => [s.id, s]));

// Modules = one lesson per stage and case type, in journey order.
export const MODULES = STAGES.flatMap(stage => {
  const file = STAGE_FILES.find(f => f.stage === stage.id);
  if (!file) return [];
  return CASE_TYPES
    .map(ct => file.modules.find(m => m.caseType === ct.id))
    .filter(Boolean)
    .map(m => ({ ...m, stage: stage.id, stageTitle: stage.title }));
});
export const MODULE_BY_ID = Object.fromEntries(MODULES.map(m => [m.id, m]));
export const STAGE_BA = Object.fromEntries(STAGE_FILES.filter(f => f.ba).map(f => [f.stage, f.ba]));
export const READY_STAGES = new Set(STAGE_FILES.map(f => f.stage));

export const CARDS = vocabData.cards;
export const CARD_BY_ID = Object.fromEntries(CARDS.map(c => [c.id, c]));
export const SUBLEVELS = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2', 'B2.1', 'B2.2', 'C1.1', 'C1.2', 'C2'];
export const DRILL_LIST = grammarData.drills.slice().sort((a, b) => SUBLEVELS.indexOf(a.sub) - SUBLEVELS.indexOf(b.sub));
export const DRILLS = Object.fromEntries(DRILL_LIST.map(d => [d.id, d]));

export const CAREERS = careers;
export const ARCH = architecture;
export const RADAR = radar.items.slice().sort((a, b) => a.date.localeCompare(b.date));
export const RADAR_BY_ID = Object.fromEntries(RADAR.map(r => [r.id, r]));
export const RADAR_CHECKED_ON = radar.checkedOn;
export const UT_TEMPLATES = useToday.templates;
export const UT_TYPES = useToday.types;
export const BOSSES = boss.challenges;
