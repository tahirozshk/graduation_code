import { NextResponse } from 'next/server';

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────

type Subject =
  | 'math'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'history'
  | 'english'
  | 'turkish'
  | 'default';

interface QuizRequestBody {
  topic: string;        // lecture topic title  e.g. "Fractions, Decimals, and Percentages"
  courseName?: string;  // course name          e.g. "Math 101 (trh121)"
  courseCode?: string;  // course code          e.g. "MATH101"
  courseLanguage?: string;
  resources?: unknown;
  weakPoints?: string;
}

interface GeneratedQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  visual?: {
    type: 'formula' | 'graph' | 'image' | 'text';
    value: string;
    label?: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Subject detection
//  Checks topic title + course name + course code so that a topic like
//  "Fractions, Decimals, and Percentages" inside "Math 101" is reliably
//  identified as math even when the topic words alone are ambiguous.
// ─────────────────────────────────────────────────────────────────────────────

const SUBJECT_KEYWORDS: Record<Subject, string[]> = {
  math: [
    'math', 'matematik', 'calculus', 'analiz', 'algebra', 'cebir',
    'geometry', 'geometri', 'trigonometry', 'trigonometri', 'statistics',
    'istatistik', 'differential', 'türev', 'integral', 'matrix', 'matris',
    'linear', 'lineer', 'probability', 'olasılık', 'limit', 'series',
    'dizi', 'fraction', 'kesir', 'decimal', 'ondalık', 'percentage',
    'yüzde', 'exponent', 'üs', 'radical', 'kök', 'polynomial', 'polinom',
    'equation', 'denklem', 'inequality', 'eşitsizlik', 'function',
    'fonksiyon', 'number', 'sayı', 'arithmetic', 'aritmetik',
    'factoring', 'scientific notation', 'problem solving', 'reasoning',
  ],
  physics: [
    'physics', 'fizik', 'mechanics', 'mekanik', 'thermodynamics',
    'termodinamik', 'electromagnetism', 'elektromanyetizma', 'optics',
    'optik', 'quantum', 'relativity', 'kinematics', 'kinematik',
    'dynamics', 'dinamik', 'force', 'kuvvet', 'energy', 'enerji',
    'wave', 'dalga', 'motion', 'hareket', 'momentum', 'gravity',
    'yerçekimi', 'fluid', 'akışkan', 'electric', 'elektrik',
    'magnetic', 'manyetik', 'circuit', 'devre',
  ],
  chemistry: [
    'chemistry', 'kimya', 'organic', 'organik', 'inorganic', 'anorganik',
    'biochemistry', 'biyokimya', 'reaction', 'reaksiyon', 'equilibrium',
    'denge', 'stoichiometry', 'stokiyometri', 'acid', 'asit', 'base',
    'baz', 'electrochemistry', 'elektrokimya', 'periodic', 'periyodik',
    'molecule', 'molekül', 'bond', 'bağ', 'thermochemistry',
    'element', 'compound', 'bileşik', 'solution', 'çözelti',
  ],
  biology: [
    'biology', 'biyoloji', 'genetics', 'genetik', 'cell', 'hücre',
    'ecology', 'ekoloji', 'evolution', 'evrim', 'anatomy', 'anatomi',
    'physiology', 'fizyoloji', 'microbiology', 'mikrobiyoloji', 'dna',
    'rna', 'protein', 'enzyme', 'enzim', 'metabolism', 'metabolizma',
    'mitosis', 'meiosis', 'mitoz', 'mayoz', 'photosynthesis',
    'fotosentez', 'organism', 'organizma', 'tissue', 'doku',
  ],
  history: [
    'history', 'tarih', 'historical', 'tarihi', 'civilization',
    'medeniyet', 'war', 'savaş', 'revolution', 'devrim', 'empire',
    'imparatorluk', 'ottoman', 'osmanlı', 'republic', 'cumhuriyet',
    'ancient', 'antik', 'medieval', 'ortaçağ', 'dynasty', 'hanedan',
    'treaty', 'antlaşma', 'reform', 'colonial', 'sömürge',
  ],
  english: [
    'english', 'grammar', 'vocabulary', 'reading', 'writing',
    'literature', 'comprehension', 'toefl', 'ielts', 'essay',
    'linguistics', 'syntax', 'semantics', 'phonology', 'morphology',
    'discourse', 'composition', 'rhetoric',
  ],
  turkish: [
    'türkçe', 'turkish language', 'edebiyat', 'dilbilgisi',
    'şiir', 'roman', 'hikaye', 'yazın', 'divan', 'tanzimat',
    'cumhuriyet dönemi', 'ses olayları', 'cümle', 'sözcük türleri',
    'noktalama', 'ek', 'fiil', 'isim',
  ],
  default: [],
};

function detectSubject(topic: string, courseName = '', courseCode = ''): Subject {
  const haystack = `${topic} ${courseName} ${courseCode}`.toLowerCase();
  for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS) as [Subject, string[]][]) {
    if (subject === 'default') continue;
    if (keywords.some((kw) => haystack.includes(kw))) return subject;
  }
  return 'default';
}

function normalizeOutputLanguage(courseLanguage = ''): string {
  const normalized = courseLanguage.toLowerCase().trim();
  if (!normalized) return 'English';
  if (normalized.includes('türk') || normalized.includes('turk')) return 'Turkish';
  if (normalized.includes('english') || normalized.includes('ingiliz')) return 'English';
  if (normalized.includes('arab')) return 'Arabic';
  if (normalized.includes('persian') || normalized.includes('fars')) return 'Persian';
  if (normalized.includes('russian') || normalized.includes('rus')) return 'Russian';
  if (normalized.includes('german') || normalized.includes('alm')) return 'German';
  return courseLanguage;
}

function buildLanguageInstruction(courseLanguage: string): string {
  const outputLanguage = normalizeOutputLanguage(courseLanguage);
  return `
LANGUAGE REQUIREMENT:
- All question stems, options, explanations, and reading passages must be entirely in ${outputLanguage}.
- Do not mix languages unless a proper noun or official course code requires it.
- If the source materials are mixed-language, still produce the final quiz only in ${outputLanguage}.`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
//  Shared JSON schema appended to every prompt
// ─────────────────────────────────────────────────────────────────────────────

const JSON_SCHEMA = `
OUTPUT RULES:
- Output ONLY valid JSON — no markdown fences, no text before or after.
- Return EXACTLY one top-level JSON object with exactly one key: "questions".
- Do not include comments, trailing commas, code fences, analysis, notes, or explanation outside JSON.
- Exactly 5 questions, never truncate.
- Every question: id, text, options (4 strings), correctAnswer (0-3), explanation, difficulty ("beginner"|"intermediate"|"advanced").
- "visual" is optional — include when genuinely useful.
- Every string value must be valid JSON string content with escaped quotes when needed.
- Never leave placeholders like "[...]", "(rest omitted)", "same as above", or unfinished arrays/objects.

QUESTION VARIETY:
- At least 1 question MUST be a real-world word problem (a scenario the student can relate to).
- The remaining questions should mix conceptual, calculation, and analytical types.
- "visual" field is optional. Only include graphs for STEM subjects (math, physics, chemistry, biology). Do NOT include graphs for history, language, or literature subjects.

VISUAL FIELD — GRAPH FORMAT:
When type is "graph", the "value" must be a JSON string describing data points for a simple line/curve plot.
Format: a comma-separated list of x,y coordinate pairs, e.g. "0,180 50,160 100,120 150,80 200,60 250,40 300,20 350,10"
- Coordinates are in SVG space: x from 50 to 350 (left to right), y from 20 to 180 (top = high value, bottom = low value).
- This represents a 2D curve on a 400x200 SVG canvas with axes.
- Use smooth/realistic data — no random noise.
- Add a descriptive "label" like "y = x²" or "Velocity vs Time" or "Supply-Demand Curve".

When type is "formula", put a key formula in plain text (Unicode) in "value".

MATH NOTATION — CRITICAL:
- Write math the way a human would on paper or on a whiteboard.
- Use plain Unicode characters: × (multiply), ÷ (divide), √ (square root), ² ³ (superscripts), ₀ ₁ ₂ (subscripts), ≤ ≥ ≠ ≈ π ∞ Δ Σ ∫.
- Fractions: write as a/b or (a + b)/(c + d). Do NOT use \\frac{}{}.
- Powers: write x² or x³ or x^n. Do NOT use $x^{2}$.
- Square roots: write √x or √(x+1). Do NOT use \\sqrt{}.
- Subscripts: write x₁, x₂, aₙ. If Unicode subscripts are not possible, use x_1, a_n.
- DO NOT use LaTeX commands (\\frac, \\int, \\lim, \\text, \\vec, \\Delta, etc.).
- DO NOT wrap anything in $ signs.
- Keep it simple and human-readable.

Examples of CORRECT notation:
  "7x²y − 4xy² + 3/x − 9"
  "limₓ→₀ sin(x)/x = 1"
  "∫₀¹ x² dx = 1/3"
  "F = m × a"
  "ΔE = mc²"
  "√(b² − 4ac)"

{
  "questions": [
    {
      "id": "string",
      "text": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": 0,
      "explanation": "string",
      "difficulty": "beginner",
      "visual": { "type": "formula|graph", "value": "string", "label": "string" }
    }
  ]
}`.trim();

// ─────────────────────────────────────────────────────────────────────────────
//  Per-subject prompt builders
// ─────────────────────────────────────────────────────────────────────────────

function buildMathPrompt(topic: string, weakPoints: string, resources: unknown, courseName: string, courseLanguage: string): string {
  return `You are an expert university-level mathematics professor.
Course: ${courseName}
Course language: ${normalizeOutputLanguage(courseLanguage)}
Lecture Topic: ${topic}
Student Weaknesses: ${weakPoints}
Resources: ${JSON.stringify(resources)}

TASK: Generate exactly 5 multiple-choice questions that test deep understanding of the topic.

RULES:
- Prioritize multi-step word problems and proof-reasoning over simple recall.
- At least 1 question must be a real-world word problem with a relatable scenario.
- At least 1 question must include a "visual" with type "graph" showing a function curve, data trend, or geometric diagram.
- Write all math in plain human-readable notation (see MATH NOTATION rules above). NO LaTeX, NO $ signs.
- Never hint at the correct answer in the question stem.
- Distractors must reflect real errors: sign mistakes, wrong formula, unit confusion, off-by-one.
- Difficulty spread: 1 easy (concept), 2 medium (single-step), 2 hard (multi-step or proof).
- Explanation: full step-by-step solution using plain readable math notation.
- Add "visual" with type "formula" for key formulas when helpful.
${buildLanguageInstruction(courseLanguage)}

${JSON_SCHEMA}`;
}

function buildPhysicsPrompt(topic: string, weakPoints: string, resources: unknown, courseName: string, courseLanguage: string): string {
  return `You are an expert university-level physics professor.
Course: ${courseName}
Course language: ${normalizeOutputLanguage(courseLanguage)}
Lecture Topic: ${topic}
Student Weaknesses: ${weakPoints}
Resources: ${JSON.stringify(resources)}

TASK: Generate exactly 5 multiple-choice questions testing the topic.

RULES:
- Embed every numerical question in a real-world scenario (projectile, circuit, thermodynamic cycle, etc.).
- At least 1 question must include a "visual" with type "graph" showing a velocity-time, force-displacement, or energy diagram.
- Write all math/physics expressions in plain readable notation: F = m × a, ΔE = mc², v⃗. NO LaTeX, NO $ signs.
- Always specify SI units in the question and in every answer option.
- Never hint at the correct answer in the question stem.
- Distractors: sign errors, wrong component decomposition, unit confusion, formula misapplication.
- Difficulty spread: 1 conceptual (no calculation), 2 single-formula, 2 multi-step derivation.
- Explanation: full solution with intermediate steps and unit analysis.
${buildLanguageInstruction(courseLanguage)}

${JSON_SCHEMA}`;
}

function buildChemistryPrompt(topic: string, weakPoints: string, resources: unknown, courseName: string, courseLanguage: string): string {
  return `You are an expert university-level chemistry professor.
Course: ${courseName}
Course language: ${normalizeOutputLanguage(courseLanguage)}
Lecture Topic: ${topic}
Student Weaknesses: ${weakPoints}
Resources: ${JSON.stringify(resources)}

TASK: Generate exactly 5 multiple-choice questions testing the topic.

RULES:
- Cover reaction mechanisms, equilibrium, thermochemistry, stoichiometry, or electrochemistry as relevant.
- Write chemical notation in plain readable form: ΔH, K_eq, E°_cell, H₂SO₄, CH₃COOH. NO LaTeX, NO $ signs.
- Never hint at the correct answer in the question stem.
- Distractors: wrong stoichiometry, Le Chatelier misapplication, oxidation-state errors, Kp/Kc confusion.
- Organic questions: reaction type, IUPAC naming, or mechanism steps.
- Difficulty spread: 1 recall, 2 calculation/identification, 2 multi-step or mechanism.
- Explanation: include balanced equation, mechanism, or thermodynamic derivation.
${buildLanguageInstruction(courseLanguage)}

${JSON_SCHEMA}`;
}

function buildBiologyPrompt(topic: string, weakPoints: string, resources: unknown, courseName: string, courseLanguage: string): string {
  return `You are an expert university-level biology professor.
Course: ${courseName}
Course language: ${normalizeOutputLanguage(courseLanguage)}
Lecture Topic: ${topic}
Student Weaknesses: ${weakPoints}
Resources: ${JSON.stringify(resources)}

TASK: Generate exactly 5 multiple-choice questions testing the topic.

RULES:
- Go beyond recall: test mechanisms, cause-effect, experimental interpretation, comparative analysis.
- Use correct biological nomenclature; italicize species names (*Escherichia coli*).
- Never hint at the correct answer in the question stem.
- Distractors: confuse mitosis/meiosis stages, misidentify organelles, mix DNA/RNA steps, wrong inheritance ratios.
- Genetics: Punnett square, Hardy-Weinberg (p² + 2pq + q² = 1), or linkage analysis when relevant. NO LaTeX.
- Difficulty spread: 1 terminology/recall, 2 mechanism/process, 2 application or data interpretation.
- Explanation: describe the correct mechanism and name the specific cellular or molecular event.
${buildLanguageInstruction(courseLanguage)}

${JSON_SCHEMA}`;
}

function buildHistoryPrompt(topic: string, weakPoints: string, resources: unknown, courseName: string, courseLanguage: string): string {
  return `You are an expert university-level history professor.
Course: ${courseName}
Course language: ${normalizeOutputLanguage(courseLanguage)}
Lecture Topic: ${topic}
Student Weaknesses: ${weakPoints}
Resources: ${JSON.stringify(resources)}

TASK: Generate exactly 5 multiple-choice questions testing the topic.

RULES:
- Mix types: factual (dates/events), causal (why X happened), comparative (X vs Y), interpretive (source analysis).
- Never hint at the correct answer in the question stem.
- Distractors: real but incorrect historical events, figures, or dates — never fictional options.
- Avoid vague phrases like "most important"; prefer specific, verifiable claims.
- At least 1 question must present a short primary-source excerpt (1–3 sentences) asking about context or significance.
- Difficulty spread: 1 factual recall, 2 causal/analytical, 1 comparative, 1 primary-source interpretation.
- Explanation: provide historical context with date range and significance.
- DO NOT include any "visual" field with graphs or charts — this is a history course.
${buildLanguageInstruction(courseLanguage)}

${JSON_SCHEMA}`;
}

function buildEnglishPrompt(topic: string, weakPoints: string, resources: unknown, courseName: string, courseLanguage: string): string {
  return `You are an expert university-level English language and literature professor.
Course: ${courseName}
Course language: ${normalizeOutputLanguage(courseLanguage)}
Lecture Topic: ${topic}
Student Weaknesses: ${weakPoints}
Resources: ${JSON.stringify(resources)}

TASK: Generate exactly 5 multiple-choice questions testing the topic.

RULES:
- Mix skills: grammar, vocabulary-in-context, reading comprehension, advanced language use.
- Reading questions: embed a 60–100 word passage in the "text" field; ask about main idea, inference, tone, vocabulary, or author's purpose.
- Grammar questions: test conditionals, tense, modal verbs, passive, articles, relative clauses via fill-in-blank or error correction.
- Vocabulary: always provide a sentence context; never ask for a bare definition.
- Never hint at the correct answer in the question stem.
- Distractors: tense confusion, false cognates, preposition misuse, subject-verb agreement, misread inference.
- Difficulty spread: 1 grammar, 1 vocabulary-in-context, 2 reading comprehension, 1 advanced language use or literature.
- Explanation: cite the grammar rule, correct word choice reasoning, or textual evidence.
- DO NOT include any "visual" field with graphs or charts — this is a language course.
${buildLanguageInstruction(courseLanguage)}

${JSON_SCHEMA}`;
}

function buildTurkishPrompt(topic: string, weakPoints: string, resources: unknown, courseName: string): string {
  return `Sen bir üniversite Türk dili ve edebiyatı profesörüsün.
Ders: ${courseName}
Konu: ${topic}
Öğrenci Zayıflıkları: ${weakPoints}
Kaynaklar: ${JSON.stringify(resources)}

GÖREV: Yukarıdaki konuyu test eden tam olarak 5 çoktan seçmeli soru üret.
Tüm soru metinleri, seçenekler ve açıklamalar TÜRKÇE olmalı.

KURALLAR:
- Dil bilgisi, metin analizi, edebi dönemler, yazar bilgisi karışık yer almalı.
- Soru gövdesinde doğru cevabı asla ima etme.
- Metin soruları için "text" alanına kısa alıntı (3–5 cümle) ekle; ana fikir, edebi sanat veya dönem bağlamı sor.
- Dil bilgisi: ses olayları, ek türleri, sözcük türleri, cümle ögeleri, noktalama. Gerçek Türkçe cümleler kullan.
- Edebiyat: edebi akım, dönem özellikleri (Tanzimat, Servet-i Fünun, Milli Edebiyat, Cumhuriyet) veya yazar-eser eşleştirmesi.
- Çeldiriciler: yanlış bağlamdaki edebi kavramlar, benzer ekler, dönem karıştırmaları.
- Zorluk dağılımı: 1 dil bilgisi, 1 yazım/noktalama, 1 metin analizi, 1 edebi dönem/yazar, 1 ileri anlama.
- Açıklama: kural + örnek; edebi sorularda tarihsel/edebi bağlam ekle.
- "visual" alanı kullanma, grafik veya çizelge ekleme — bu bir dil/edebiyat dersi.

${JSON_SCHEMA}`;
}

function buildDefaultPrompt(topic: string, weakPoints: string, resources: unknown, courseName: string, courseLanguage: string): string {
  return `You are an expert university-level professor.
Course: ${courseName}
Course language: ${normalizeOutputLanguage(courseLanguage)}
Lecture Topic: ${topic}
Student Weaknesses: ${weakPoints}
Resources: ${JSON.stringify(resources)}

TASK: Generate exactly 5 multiple-choice questions testing the topic.

RULES:
- Prioritize analytical and application questions over pure recall.
- Never hint at the correct answer in the question stem.
- Distractors must reflect real misconceptions, not obviously wrong answers.
- Difficulty spread: 1 recall, 2 application, 2 analysis/synthesis.
- Explanation: clear and detailed, referencing underlying concepts.
- DO NOT include any "visual" field with graphs — only use "visual" with type "formula" if the subject involves math or science formulas.
${buildLanguageInstruction(courseLanguage)}

${JSON_SCHEMA}`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Prompt router
// ─────────────────────────────────────────────────────────────────────────────

function buildPrompt(
  topic: string,
  weakPoints: string,
  resources: unknown,
  courseName: string,
  courseCode: string,
  courseLanguage: string,
): string {
  const subject = detectSubject(topic, courseName, courseCode);
  const wp = weakPoints || 'None provided';
  switch (subject) {
    case 'math': return buildMathPrompt(topic, wp, resources, courseName, courseLanguage);
    case 'physics': return buildPhysicsPrompt(topic, wp, resources, courseName, courseLanguage);
    case 'chemistry': return buildChemistryPrompt(topic, wp, resources, courseName, courseLanguage);
    case 'biology': return buildBiologyPrompt(topic, wp, resources, courseName, courseLanguage);
    case 'history': return buildHistoryPrompt(topic, wp, resources, courseName, courseLanguage);
    case 'english': return buildEnglishPrompt(topic, wp, resources, courseName, courseLanguage);
    case 'turkish': return buildTurkishPrompt(topic, wp, resources, courseName);
    default: return buildDefaultPrompt(topic, wp, resources, courseName, courseLanguage);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Mock fallback questions (shown when GOOGLE_API_KEY is missing)
// ─────────────────────────────────────────────────────────────────────────────

function getMockQuestions(topic: string, courseName: string, courseCode: string, courseLanguage = ''): object[] {
  const subject = detectSubject(topic, courseName, courseCode);
  const isTurkish = normalizeOutputLanguage(courseLanguage).toLowerCase() === 'turkish';
  const mocks: Record<Subject, object[]> = {
    math: [
      {
        id: 'q1',
        text: isTurkish ? 'limₓ→₀ sin(3x)/x ifadesinin değeri nedir?' : 'What is the value of limₓ→₀ sin(3x)/x?',
        options: isTurkish ? ['0', '1', '3', 'Tanımsız'] : ['0', '1', '3', 'Undefined'],
        correctAnswer: 2,
        explanation: isTurkish
          ? 'limₓ→₀ sin(ax)/x = a kuralını kullanırsak, limit 3 olur.'
          : 'Using limₓ→₀ sin(ax)/x = a, the limit is 3.',
      },
      {
        id: 'q2',
        text: isTurkish
          ? 'Bir dikdörtgenin uzunluğu (2x + 3), genişliği (x − 1) ise x = 4 olduğunda alanı kaçtır?'
          : 'If a rectangle has length (2x + 3) and width (x − 1), what is its area when x = 4?',
        options: ['33', '11', '44', '27'],
        correctAnswer: 0,
        explanation: isTurkish
          ? 'Uzunluk = 2(4) + 3 = 11, Genişlik = 4 − 1 = 3. Alan = 11 × 3 = 33.'
          : 'Length = 11 and width = 3, so the area is 33.',
      },
    ],
    physics: [
      {
        id: 'q1',
        text: 'Bir top 45 m yüksekliğindeki uçurumdan 20 m/s yatay hızla atılıyor. Yatay menzili kaç metredir? (g = 10 m/s²)',
        options: ['60 m', '90 m', '45 m', '30 m'],
        correctAnswer: 0,
        explanation: 'Düşme süresi t = √(2h/g) = √9 = 3 s. Menzil = 20 × 3 = 60 m.',
      },
    ],
    chemistry: [
      {
        id: 'q1',
        text: 'N₂ + 3H₂ ⇌ 2NH₃ tepkimesinde basınç artırılırsa ne olur?',
        options: ['Denge sola kayar', 'Denge sağa kayar', 'Etki etmez', 'Tepkime durur'],
        correctAnswer: 1,
        explanation: 'Sağ tarafta daha az mol gaz var (2 < 4), basınç artınca denge sağa kayar (Le Chatelier ilkesi).',
      },
    ],
    biology: [
      {
        id: 'q1',
        text: 'During which mitosis phase do sister chromatids separate toward opposite poles?',
        options: ['Prophase', 'Metaphase', 'Anaphase', 'Telophase'],
        correctAnswer: 2,
        explanation: 'In anaphase, cohesin is cleaved and spindle fibers pull chromatids to opposite poles.',
      },
    ],
    history: [
      {
        id: 'q1',
        text: 'Which treaty ended World War I and imposed war guilt on Germany?',
        options: ['Treaty of Paris', 'Treaty of Versailles', 'Treaty of Brest-Litovsk', 'Treaty of Westphalia'],
        correctAnswer: 1,
        explanation: 'The Treaty of Versailles (1919), Article 231, assigned war guilt to Germany and imposed heavy reparations.',
      },
    ],
    english: [
      {
        id: 'q1',
        text: 'Choose the grammatically correct sentence:',
        options: [
          'She has went to the store.',
          'She has gone to the store.',
          'She have gone to the store.',
          'She gone to the store.',
        ],
        correctAnswer: 1,
        explanation: '"Has gone" is the correct present perfect (have/has + past participle). "Went" is simple past and cannot follow "has".',
      },
    ],
    turkish: [
      {
        id: 'q1',
        text: '"Kitabı masaya koydum." cümlesinde "kitabı" sözcüğünün görevi nedir?',
        options: ['Özne', 'Belirtili nesne', 'Dolaylı tümleç', 'Yüklem'],
        correctAnswer: 1,
        explanation: '"Kitabı" belirtme hâl eki (-ı) almış olup belirtili nesnedir.',
      },
    ],
    default: [
      {
        id: 'q1',
        text: `Sample question for: "${topic}". Add GOOGLE_API_KEY to generate real questions.`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0,
        explanation: 'Placeholder — real questions are generated when the API key is present.',
      },
    ],
  };
  return mocks[subject] ?? mocks.default;
}

function tryExtractJsonObject(raw: string): string {
  let sanitized = raw
    .replace(/```json\s*/ig, '')
    .replace(/```\s*/ig, '')
    .trim();

  const firstBrace = sanitized.indexOf('{');
  const lastBrace = sanitized.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    sanitized = sanitized.substring(firstBrace, lastBrace + 1);
  }

  return sanitized;
}

function normalizeQuestion(question: unknown, index: number): GeneratedQuestion | null {
  if (!question || typeof question !== 'object') {
    return null;
  }

  const candidate = question as Record<string, unknown>;
  const text =
    typeof candidate.text === 'string'
      ? candidate.text
      : typeof candidate.questionText === 'string'
        ? candidate.questionText
        : '';
  const explanation =
    typeof candidate.explanation === 'string' ? candidate.explanation : '';
  const options = Array.isArray(candidate.options)
    ? candidate.options.filter((item): item is string => typeof item === 'string')
    : [];

  if (!text || !explanation || options.length < 4) {
    return null;
  }

  const normalizedOptions = options.slice(0, 4);
  const difficulty =
    candidate.difficulty === 'beginner' ||
    candidate.difficulty === 'intermediate' ||
    candidate.difficulty === 'advanced'
      ? candidate.difficulty
      : 'intermediate';

  const rawCorrectAnswer =
    typeof candidate.correctAnswer === 'number' ? candidate.correctAnswer : 0;
  const correctAnswer =
    rawCorrectAnswer >= 0 && rawCorrectAnswer < normalizedOptions.length
      ? rawCorrectAnswer
      : 0;

  const visual =
    candidate.visual &&
    typeof candidate.visual === 'object' &&
    typeof (candidate.visual as Record<string, unknown>).type === 'string' &&
    typeof (candidate.visual as Record<string, unknown>).value === 'string'
      ? {
          type: (candidate.visual as Record<string, unknown>).type as GeneratedQuestion['visual']['type'],
          value: (candidate.visual as Record<string, unknown>).value as string,
          label:
            typeof (candidate.visual as Record<string, unknown>).label === 'string'
              ? ((candidate.visual as Record<string, unknown>).label as string)
              : undefined,
        }
      : undefined;

  return {
    id:
      typeof candidate.id === 'string' && candidate.id.trim().length > 0
        ? candidate.id
        : `q${index + 1}`,
    text,
    options: normalizedOptions,
    correctAnswer,
    explanation,
    difficulty,
    ...(visual ? { visual } : {}),
  };
}

function normalizeQuestions(data: unknown): GeneratedQuestion[] {
  if (!data || typeof data !== 'object') {
    return [];
  }

  const questions = (data as { questions?: unknown }).questions;
  if (!Array.isArray(questions)) {
    return [];
  }

  return questions
    .map((question, index) => normalizeQuestion(question, index))
    .filter((question): question is GeneratedQuestion => Boolean(question))
    .slice(0, 5);
}

async function repairJsonWithGemini(apiKey: string, invalidOutput: string): Promise<string | null> {
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
  const repairPrompt = `
You are a JSON repair tool.
Fix the following malformed JSON-like content so that it becomes valid JSON.

REPAIR RULES:
- Output ONLY valid JSON.
- Preserve the intended meaning.
- Return exactly one object with one key: "questions".
- Ensure "questions" is an array of exactly 5 objects when enough data exists.
- Remove any markdown fences, commentary, trailing commas, or broken syntax.

CONTENT TO REPAIR:
${invalidOutput}
`.trim();

  const response = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: repairPrompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        topP: 0.1,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const text: string | undefined = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return text ? tryExtractJsonObject(text) : null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  POST handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body: QuizRequestBody = await request.json();
    const {
      topic,
      courseName = '',
      courseCode = '',
      courseLanguage = '',
      resources = [],
      weakPoints = '',
    } = body;

    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      console.warn('[QUIZ] No GOOGLE_API_KEY — returning mock questions.');
      return NextResponse.json({ questions: getMockQuestions(topic, courseName, courseCode, courseLanguage) });
    }

    const detectedSubject = detectSubject(topic, courseName, courseCode);
    const prompt = buildPrompt(topic, weakPoints, resources, courseName, courseCode, courseLanguage);

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    console.log(`[GEMINI] Subject: "${detectedSubject}" | Course: "${courseName}" | Topic: "${topic}" | Language: "${normalizeOutputLanguage(courseLanguage)}"`);

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[GEMINI ERROR] Status: ${response.status} | Body: ${errorData}`);
      throw new Error(`Gemini API Error: ${response.statusText} — ${errorData}`);
    }

    const geminiData = await response.json();
    const resultString: string | undefined =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultString) {
      console.error('[GEMINI ERROR] Empty response:', JSON.stringify(geminiData));
      throw new Error('Gemini API returned an empty response.');
    }

    let sanitized = tryExtractJsonObject(resultString);

    console.log('[GEMINI PREVIEW]:', sanitized.substring(0, 200) + '...');

    let parsedData: unknown;
    try {
      parsedData = JSON.parse(sanitized);
    } catch {
      console.error('[GEMINI JSON PARSE ERROR] Raw:', resultString);
      const repaired = await repairJsonWithGemini(apiKey, resultString);
      if (!repaired) {
        console.warn('[GEMINI REPAIR] Repair attempt failed, using fallback questions.');
        return NextResponse.json({
          questions: getMockQuestions(topic, courseName, courseCode, courseLanguage),
          fallbackReason: 'invalid-json',
        });
      }

      try {
        parsedData = JSON.parse(repaired);
      } catch {
        console.warn('[GEMINI REPAIR] Repaired JSON still invalid, using fallback questions.');
        return NextResponse.json({
          questions: getMockQuestions(topic, courseName, courseCode, courseLanguage),
          fallbackReason: 'repair-json-invalid',
        });
      }
    }

    const normalizedQuestions = normalizeQuestions(parsedData);

    if (normalizedQuestions.length === 0) {
      console.warn('[GEMINI WARNING] Zero valid normalized questions — using fallback.');
      return NextResponse.json({
        questions: getMockQuestions(topic, courseName, courseCode, courseLanguage),
        fallbackReason: 'normalized-empty',
      });
    }

    if (normalizedQuestions.length < 5) {
      console.warn(
        `[GEMINI WARNING] Only ${normalizedQuestions.length} valid questions after normalization; filling with fallback.`,
      );
      const fallbackQuestions = getMockQuestions(topic, courseName, courseCode, courseLanguage) as GeneratedQuestion[];
      const mergedQuestions = [...normalizedQuestions];
      for (const fallbackQuestion of fallbackQuestions) {
        if (mergedQuestions.length >= 5) break;
        mergedQuestions.push(
          normalizeQuestion(fallbackQuestion, mergedQuestions.length) ||
            fallbackQuestion,
        );
      }

      return NextResponse.json({ questions: mergedQuestions.slice(0, 5) });
    }

    console.log(`[GEMINI SUCCESS] ${normalizedQuestions.length} questions | Subject: ${detectedSubject}`);
    return NextResponse.json({ questions: normalizedQuestions });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('[QUIZ ERROR]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
