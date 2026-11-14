// All mock data for the demo lives here. Nothing is fetched or generated.

export type ProfileId = "standard" | "adhd" | "dyslexia" | "autism";
export type Interest = "trains" | "football";

export const profiles: {
  id: ProfileId;
  label: string;
  short: string;
  promise: string;
  adaptations: string[];
}[] = [
  {
    id: "adhd",
    label: "ADHD",
    short: "Short sprints, instant feedback",
    promise: "Five-minute sprints, one idea at a time, and a check after every card so you know it stuck.",
    adaptations: ["5-minute sprints with a timer", "One concept per card", "Instant feedback", "Missed a day? Rescheduled, no guilt"],
  },
  {
    id: "dyslexia",
    label: "Dyslexia",
    short: "Audio first, readable layouts",
    promise: "Listen first, then read. Bigger text, calmer spacing, short sentences and key terms explained in plain English.",
    adaptations: ["Play button on every section", "Larger text, wider spacing", "Short sentences", "Plain-English term definitions"],
  },
  {
    id: "autism",
    label: "Autism",
    short: "Predictable structure, interest-based examples",
    promise: "The same layout every time. You see what you will learn and what comes next, in literal words, with examples from what you love.",
    adaptations: ["Fixed, numbered layout", "What you'll learn / what's next", "Literal, unambiguous wording", "Examples from your interests"],
  },
  {
    id: "standard",
    label: "Standard",
    short: "Clean notes, flashcards, quiz",
    promise: "Well-structured notes, flashcards and a quiz.",
    adaptations: ["Structured notes", "Flashcards", "Quiz"],
  },
];

export const interests: { id: Interest; label: string }[] = [
  { id: "trains", label: "Trains" },
  { id: "football", label: "Football" },
];

// ---------- Onboarding check ----------

export type Answer = { label: string; weights: Partial<Record<ProfileId, number>>; trait: string };

export const checkQuestions: { q: string; answers: Answer[] }[] = [
  {
    q: "When you sit down to study, what usually happens?",
    answers: [
      { label: "I start, then drift to something else within minutes", weights: { adhd: 2 }, trait: "Short sprints" },
      { label: "I re-read the same line a few times", weights: { dyslexia: 2 }, trait: "Audio first" },
      { label: "I need to know the plan before I can begin", weights: { autism: 2 }, trait: "Clear structure" },
      { label: "I get going fine once I'm set up", weights: { standard: 2 }, trait: "Steady focus" },
    ],
  },
  {
    q: "Long paragraphs feel…",
    answers: [
      { label: "Like a wall. I skim and miss things", weights: { dyslexia: 2, adhd: 1 }, trait: "Short sentences" },
      { label: "Fine, if they're clearly organised", weights: { autism: 1, standard: 1 }, trait: "Clear structure" },
      { label: "Boring. I want the point first", weights: { adhd: 2 }, trait: "Point first" },
      { label: "Fine. I like detail", weights: { standard: 2 }, trait: "Full notes" },
    ],
  },
  {
    q: "Do you prefer listening or reading?",
    answers: [
      { label: "Listening, by a long way", weights: { dyslexia: 2 }, trait: "Audio first" },
      { label: "Both together: hear it while I read", weights: { dyslexia: 1, adhd: 1 }, trait: "Read-along audio" },
      { label: "Reading, at my own pace", weights: { autism: 1, standard: 1 }, trait: "Self-paced reading" },
    ],
  },
  {
    q: "How long can you focus before drifting?",
    answers: [
      { label: "About 5 minutes", weights: { adhd: 3 }, trait: "Short sprints" },
      { label: "15 to 20 minutes", weights: { adhd: 1, standard: 1 }, trait: "Medium sessions" },
      { label: "Longer, if the topic grabs me", weights: { autism: 2 }, trait: "Deep-dive sessions" },
      { label: "An hour or more", weights: { standard: 2 }, trait: "Long sessions" },
    ],
  },
  {
    q: "Do surprises in layout or routine bother you?",
    answers: [
      { label: "Yes. I want things in the same place every time", weights: { autism: 3 }, trait: "Predictable layout" },
      { label: "A little", weights: { autism: 1, standard: 1 }, trait: "Consistent layout" },
      { label: "No. Variety keeps me awake", weights: { adhd: 2 }, trait: "Varied formats" },
    ],
  },
  {
    q: "What keeps you going?",
    answers: [
      { label: "Streaks and quick wins", weights: { adhd: 2 }, trait: "Quick wins" },
      { label: "Seeing my progress fill up", weights: { standard: 1, dyslexia: 1 }, trait: "Visible progress" },
      { label: "Topics I genuinely love", weights: { autism: 2 }, trait: "Interest-based examples" },
    ],
  },
];

// ---------- Dashboard ----------

export const user = { name: "Maya", streak: 6 };

export type Lecture = { slug: string; title: string; minutes: number; done: boolean; isNew?: boolean };
export type Module = { id: string; title: string; code: string; progress: number; lectures: Lecture[] };

export const modules: Module[] = [
  {
    id: "cardiology",
    title: "Cardiology",
    code: "MED2041",
    progress: 62,
    lectures: [
      { slug: "heart-failure", title: "Heart failure", minutes: 12, done: false },
      { slug: "heart-failure", title: "Atrial fibrillation", minutes: 10, done: true },
      { slug: "heart-failure", title: "Acute coronary syndrome", minutes: 14, done: true },
    ],
  },
  {
    id: "respiratory",
    title: "Respiratory",
    code: "MED2043",
    progress: 38,
    lectures: [
      { slug: "heart-failure", title: "Asthma and COPD", minutes: 11, done: true },
      { slug: "heart-failure", title: "Pneumonia", minutes: 9, done: false },
    ],
  },
  {
    id: "pharmacology",
    title: "Pharmacology",
    code: "MED2050",
    progress: 21,
    lectures: [
      { slug: "heart-failure", title: "Diuretics", minutes: 8, done: false },
      { slug: "heart-failure", title: "Beta-blockers", minutes: 7, done: false },
    ],
  },
];

export const todaysPlan = [
  { title: "Heart failure: causes", minutes: 5, module: "Cardiology" },
  { title: "Heart failure: diagnosis", minutes: 4, module: "Cardiology" },
  { title: "Diuretics: flashcards", minutes: 3, module: "Pharmacology" },
];

export const processingSteps = ["Reading your slides", "Finding key concepts", "Adapting to your profile"];

// ---------- Lecture: heart failure (written once, rendered four ways) ----------

export type Term = { term: string; def: string };
export type Check = { q: string; options: string[]; answer: number; why: string };
export type Section = {
  id: string;
  title: string;
  /** Standard notes: full prose. */
  body: string;
  /** Short sentences: used by ADHD cards and dyslexia view. */
  points: string[];
  /** Literal, unambiguous version for the autism view. */
  literal: string[];
  terms: Term[];
  check: Check;
  minutes: number;
};

export const lecture = {
  slug: "heart-failure",
  module: "Cardiology",
  title: "Heart failure",
  source: "Lecture 6 slides · Dr R. Okafor · 42 slides",
  minutes: 12,
  sections: [
    {
      id: "definition",
      title: "What heart failure is",
      minutes: 2,
      body:
        "Heart failure is a clinical syndrome in which the heart cannot pump enough blood to meet the body's needs, or can only do so at raised filling pressures. It is classified by left ventricular ejection fraction (EF): heart failure with reduced EF (HFrEF, EF 40% or less), mildly reduced EF (HFmrEF, 41–49%) and preserved EF (HFpEF, 50% or more). The term describes a syndrome, not a single disease, and it does not mean the heart has stopped.",
      points: [
        "Heart failure means the heart can't pump enough blood for the body.",
        "The heart has not stopped. It is working, but not well enough.",
        "We group it by ejection fraction: how much blood leaves the heart each beat.",
        "Reduced EF is 40% or less. Preserved EF is 50% or more.",
      ],
      literal: [
        "Heart failure is a condition. In this condition, the heart does not pump enough blood for the body.",
        "Heart failure does not mean the heart has stopped beating.",
        "Doctors measure the ejection fraction (EF). EF is the percentage of blood the left ventricle pushes out in one beat.",
        "There are 3 groups: EF 40% or less (reduced), EF 41–49% (mildly reduced), EF 50% or more (preserved).",
      ],
      terms: [
        { term: "ejection fraction", def: "The share of blood the main pumping chamber pushes out with each beat. Normal is about 55–70%." },
        { term: "syndrome", def: "A group of symptoms that happen together, which can have more than one cause." },
      ],
      check: {
        q: "A patient has an ejection fraction of 35%. Which type of heart failure is this?",
        options: ["Preserved EF", "Mildly reduced EF", "Reduced EF"],
        answer: 2,
        why: "Reduced EF is 40% or less, so 35% is HFrEF.",
      },
    },
    {
      id: "causes",
      title: "Causes",
      minutes: 3,
      body:
        "The most common cause in the UK is ischaemic heart disease, followed by hypertension. Other causes include valve disease, cardiomyopathies, arrhythmias such as atrial fibrillation, and alcohol. Decompensation of known heart failure is often triggered by infection, new arrhythmia, or stopping medication.",
      points: [
        "The top cause in the UK is ischaemic heart disease.",
        "High blood pressure comes second.",
        "Others: valve disease, cardiomyopathy, atrial fibrillation, alcohol.",
        "Flare-ups are often set off by infection, a new arrhythmia, or missed tablets.",
      ],
      literal: [
        "The most common cause in the UK is ischaemic heart disease. This means the heart muscle does not get enough blood.",
        "The second most common cause is high blood pressure (hypertension).",
        "Other causes are: heart valve disease, cardiomyopathy, atrial fibrillation and alcohol.",
        "Heart failure can get suddenly worse. Common triggers are: an infection, a new irregular rhythm, or stopping medicines.",
      ],
      terms: [
        { term: "ischaemic heart disease", def: "Narrowed heart arteries, so the heart muscle gets less blood and oxygen." },
        { term: "cardiomyopathy", def: "A disease of the heart muscle itself that makes it stiff, thick or weak." },
      ],
      check: {
        q: "What is the most common cause of heart failure in the UK?",
        options: ["Alcohol", "Ischaemic heart disease", "Valve disease"],
        answer: 1,
        why: "Ischaemic heart disease is the leading cause, ahead of hypertension.",
      },
    },
    {
      id: "symptoms",
      title: "Symptoms and signs",
      minutes: 2,
      body:
        "Patients typically report breathlessness on exertion, orthopnoea (breathlessness lying flat), paroxysmal nocturnal dyspnoea, fatigue and ankle swelling. On examination look for a raised JVP, bibasal crackles, pitting peripheral oedema and a third heart sound.",
      points: [
        "Breathless when active, and when lying flat.",
        "Waking up gasping at night.",
        "Tired all the time. Swollen ankles.",
        "On exam: raised JVP, crackles at the lung bases, pitting oedema.",
      ],
      literal: [
        "Symptoms are what the patient tells you. Signs are what you find when you examine them.",
        "Symptoms: breathlessness when active, breathlessness when lying flat, waking at night breathless, tiredness, swollen ankles.",
        "Signs: raised jugular venous pressure (JVP), crackles at the bottom of both lungs, pitting oedema, a third heart sound.",
      ],
      terms: [
        { term: "orthopnoea", def: "Feeling breathless when lying flat, eased by sitting up or using more pillows." },
        { term: "JVP", def: "Jugular venous pressure: how high the neck vein fills. Raised when the heart is backed up." },
      ],
      check: {
        q: "A patient sleeps on four pillows because they feel breathless lying flat. What is this called?",
        options: ["Orthopnoea", "Oedema", "Tachycardia"],
        answer: 0,
        why: "Breathlessness when lying flat is orthopnoea.",
      },
    },
    {
      id: "diagnosis",
      title: "Diagnosis",
      minutes: 2,
      body:
        "Measure NT-proBNP first. In NICE guidance, a level above 2000 ng/L warrants specialist assessment and echocardiography within 2 weeks; 400–2000 ng/L within 6 weeks. Echocardiography confirms the diagnosis and measures EF. Also request an ECG, chest X-ray, and bloods including renal function and thyroid function.",
      points: [
        "First test: NT-proBNP, a blood test.",
        "Over 2000 ng/L: echo and specialist within 2 weeks.",
        "400 to 2000 ng/L: within 6 weeks.",
        "Echo confirms it and measures the EF.",
      ],
      literal: [
        "Step 1: do a blood test called NT-proBNP.",
        "Step 2: if NT-proBNP is above 2000 ng/L, the patient needs an echocardiogram and a specialist within 2 weeks. If it is 400–2000 ng/L, within 6 weeks.",
        "Step 3: the echocardiogram confirms heart failure and measures the ejection fraction.",
        "Also do: ECG, chest X-ray, and blood tests including kidney and thyroid function.",
      ],
      terms: [
        { term: "NT-proBNP", def: "A hormone released when the heart walls are stretched. High levels point to heart failure." },
        { term: "echocardiogram", def: "An ultrasound scan of the heart that shows how well it pumps." },
      ],
      check: {
        q: "NT-proBNP is 2600 ng/L. How soon should the patient have an echo and specialist review?",
        options: ["Within 2 weeks", "Within 6 weeks", "No echo needed"],
        answer: 0,
        why: "Above 2000 ng/L means within 2 weeks.",
      },
    },
    {
      id: "treatment",
      title: "Treatment",
      minutes: 3,
      body:
        "Loop diuretics such as furosemide relieve congestion but do not improve survival. In HFrEF, four drug classes reduce mortality: an ACE inhibitor (or ARB, or sacubitril/valsartan), a beta-blocker such as bisoprolol, a mineralocorticoid receptor antagonist such as spironolactone, and an SGLT2 inhibitor such as dapagliflozin. Selected patients benefit from devices (ICD, CRT). Lifestyle advice and vaccination support all patients.",
      points: [
        "Diuretics like furosemide clear fluid. They help symptoms, not survival.",
        "For reduced EF, four drugs help people live longer.",
        "ACE inhibitor, beta-blocker, spironolactone, SGLT2 inhibitor.",
        "Some patients also get a device: ICD or CRT.",
      ],
      literal: [
        "Loop diuretics (for example furosemide) remove extra fluid. They make breathing and swelling better. They do not make people live longer.",
        "For heart failure with reduced EF there are 4 medicine groups that make people live longer.",
        "The 4 groups are: (1) ACE inhibitor, ARB or sacubitril/valsartan, (2) beta-blocker, (3) mineralocorticoid receptor antagonist, (4) SGLT2 inhibitor.",
        "Some patients also need a device: an ICD or CRT.",
      ],
      terms: [
        { term: "SGLT2 inhibitor", def: "A tablet first used for diabetes (e.g. dapagliflozin) that also protects the failing heart." },
        { term: "diuretics", def: "Water tablets. They make the kidneys remove extra fluid." },
      ],
      check: {
        q: "Which of these improves symptoms but NOT survival in heart failure?",
        options: ["Bisoprolol", "Furosemide", "Dapagliflozin"],
        answer: 1,
        why: "Loop diuretics like furosemide treat congestion but don't reduce mortality.",
      },
    },
  ] satisfies Section[],
  analogy: {
    trains: {
      title: "Heart failure, as a railway",
      lines: [
        "Think of the heart as a locomotive pulling carriages of blood around a loop of track.",
        "In heart failure, the locomotive is weaker. The train still runs. It pulls fewer carriages each lap.",
        "Carriages that cannot be pulled wait at the platform behind the engine. This is fluid backing up into the lungs and ankles.",
        "Diuretics are like removing waiting carriages. The four survival drugs are like servicing the engine so it runs for longer.",
      ],
    },
    football: {
      title: "Heart failure, as a football team",
      lines: [
        "Think of the heart as the midfield. Its job is to pass the ball (blood) forward to the rest of the team.",
        "In heart failure, the passes are weaker. Fewer balls reach the forwards each minute.",
        "Balls that are not passed pile up in your own half. This is fluid backing up into the lungs and ankles.",
        "Diuretics are like clearing the extra balls. The four survival drugs are like a training plan that keeps the midfield playing for longer.",
      ],
    },
  } satisfies Record<Interest, { title: string; lines: string[] }>,
  flashcards: [
    { front: "HFrEF ejection fraction cut-off", back: "40% or less" },
    { front: "Most common cause of heart failure in the UK", back: "Ischaemic heart disease" },
    { front: "Breathlessness lying flat", back: "Orthopnoea" },
    { front: "First-line test for suspected heart failure", back: "NT-proBNP" },
    { front: "NT-proBNP > 2000 ng/L", back: "Echo and specialist review within 2 weeks" },
    { front: "Four mortality-reducing drug classes in HFrEF", back: "ACEi/ARB/ARNI, beta-blocker, MRA, SGLT2 inhibitor" },
  ],
};

export type LectureData = typeof lecture;
