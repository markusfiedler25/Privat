// Content registry. All learning content lives in JSON files next to this one.
// To add a stage: write lessons/<stage>.json, import it below, add it to LESSON_FILES,
// and set its status to "ready" in stages.json.
import stagesData from './stages.json';
import referral from './lessons/referral.json';
import scheduling from './lessons/scheduling.json';
import vocabData from './german/vocab.json';
import grammarData from './german/grammar.json';
import careers from './careers.json';
import architecture from './architecture.json';
import market from './market.json';
import boss from './boss.json';

const LESSON_FILES = [referral, scheduling];

export const STAGES = stagesData.stages.slice().sort((a, b) => a.order - b.order);
export const STAGE_BY_ID = Object.fromEntries(STAGES.map(s => [s.id, s]));

// Flat lesson list in journey order.
export const LESSONS = STAGES.flatMap(stage => {
  const file = LESSON_FILES.find(f => f.stage === stage.id);
  return file ? file.lessons.map((l, i) => ({ ...l, stage: stage.id, stageTitle: stage.title, indexInStage: i, stageCount: file.lessons.length })) : [];
});
export const LESSON_BY_ID = Object.fromEntries(LESSONS.map(l => [l.id, l]));

export const CARDS = vocabData.cards;
export const CARD_BY_ID = Object.fromEntries(CARDS.map(c => [c.id, c]));
export const DRILLS = Object.fromEntries(grammarData.drills.map(d => [d.id, d]));
export const CAREERS = careers;
export const ARCH = architecture;
export const MARKET = market.cards;
export const BOSSES = boss.challenges;
