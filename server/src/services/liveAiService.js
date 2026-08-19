import { GoogleGenerativeAI } from '@google/generative-ai';

const geminiModel = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: geminiModel });
}

function parseJsonResponse(text) {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Gemini returned invalid JSON');
  return JSON.parse(match[0]);
}

function getFallbackIntro({ category, difficulty, targetRole, interviewerPersona }) {
  const personaLabel = {
    'faang-lead': 'FAANG-style lead',
    startup: 'startup CTO',
    mentor: 'mentor',
    strict: 'strict interviewer',
    friendly: 'friendly interviewer'
  }[interviewerPersona] || 'technical interviewer';

  return {
    introduction: `Welcome! I’m your ${personaLabel} for this ${difficulty} ${category.toLowerCase()} interview for a ${targetRole} role. Let’s start with a quick conversation and then dive into your approach and trade-offs.`,
    firstQuestion: `For a ${targetRole} role, walk me through how you would approach a challenging ${category.toLowerCase()} problem and explain your reasoning step by step.`
  };
}

function getFallbackCoachingResponse({ currentQuestion, candidateAnswer, speechMetrics = {}, conversationContext = [] }) {
  const answer = (candidateAnswer || '').trim();
  const question = (currentQuestion || '').toLowerCase();
  const answerLower = answer.toLowerCase();
  const fillerCount = speechMetrics.fillerWordCount || 0;
  const wpm = speechMetrics.wpm || 0;
  const answerWords = answer ? answer.split(/\s+/).length : 0;
  const technicalTerms = ['api', 'cache', 'database', 'algorithm', 'complexity', 'scalability', 'testing', 'deployment', 'latency', 'trade-off'];
  const mentionedTerms = technicalTerms.filter(term => answerLower.includes(term));
  const questionTopic = question.includes('system') || question.includes('architecture')
    ? 'system design'
    : question.includes('algorithm') || question.includes('complexity')
      ? 'algorithmic reasoning'
      : question.includes('behavior') || question.includes('experience')
        ? 'your experience'
        : 'your approach';
  const variationSeed = [...answerLower].reduce((total, character) => total + character.charCodeAt(0), conversationContext.length * 17);

  const strengths = [];
  if (answerWords >= 45) strengths.push('You gave enough detail to make your reasoning easy to follow.');
  else if (answerWords >= 20) strengths.push('You covered the main idea and gave the interviewer a useful starting point.');
  if (mentionedTerms.length > 0) strengths.push(`You used relevant ${questionTopic} concepts such as ${mentionedTerms.slice(0, 2).join(' and ')}.`);
  if (wpm > 80 && wpm < 180) strengths.push('Your speaking pace is within a healthy interview range.');
  if (fillerCount === 0) strengths.push('Your answer was clear and confident.');

  const improvements = [];
  if (fillerCount > 0) improvements.push('Reduce filler words by pausing briefly before answering.');
  if (wpm < 80 || wpm > 180) improvements.push('Aim for a steadier pace to improve clarity and confidence.');
  if (answerWords < 30) improvements.push('Add a concrete example, your specific contribution, and the result.');
  if (mentionedTerms.length === 0) improvements.push(`Use one specific technical detail to support your ${questionTopic}.`);

  const nextQuestions = [
    `What was the most important trade-off in your ${questionTopic}, and why did you choose it?`,
    `How would you test or validate that your ${questionTopic} solution works under real constraints?`,
    `What would you change if the scale or requirements increased significantly?`,
    `Can you give a concrete example that shows the impact of your ${questionTopic}?`
  ];
  const signalIndex = answerLower.includes('cach') || answerLower.includes('database')
    ? 0
    : answerLower.includes('test') || answerLower.includes('deploy') || answerLower.includes('failure')
      ? 1
      : null;
  const variationIndex = signalIndex ?? (variationSeed % nextQuestions.length);
  const nextQuestion = nextQuestions[variationIndex];
  const nextResponses = [
    `I heard your main idea. Let us go deeper into the trade-offs behind your ${questionTopic}.`,
    `That gives us a useful starting point. Now let us test how your ${questionTopic} holds up in practice.`,
    `Thanks. I want to connect your answer to measurable impact and real-world constraints.`,
    `Good direction. Let us explore the decision you would make when the requirements change.`
  ];
  const score = Math.min(10, Math.max(3, 4 + Math.round(answerWords / 18) + (mentionedTerms.length > 0 ? 1 : 0)));

  return {
    feedback: answerWords === 0
      ? 'No answer was captured. Please try again and explain your reasoning out loud.'
      : `Your response addressed ${questionTopic} with ${answerWords} words. The next improvement is to make the reasoning more specific and connect it to a concrete outcome.`,
    score,
    strengths: strengths.length ? strengths : ['You were responsive and engaged with the question.'],
    areasForImprovement: improvements.length ? improvements : ['Add clearer examples and tie your answer back to measurable impact.'],
    nextResponse: nextResponses[variationIndex],
    nextQuestion,
    followUpQuestions: [
      nextQuestion,
      nextQuestions[(variationSeed + 1) % nextQuestions.length]
    ],
    technicalScore: Math.min(10, 4 + mentionedTerms.length + Math.min(2, Math.floor(answerWords / 35))),
    communicationScore: Math.max(3, Math.min(10, 8 - fillerCount)),
    relevanceScore: answerWords > 0 ? Math.min(10, 5 + (questionTopic !== 'your approach' ? 1 : 0) + Math.min(2, Math.floor(answerWords / 40))) : 1,
    structureScore: answerWords >= 45 ? 8 : answerWords >= 25 ? 6 : 4,
    success: true
  };
}

/**
 * Detect filler words in transcribed text
 */
export function detectFillerWords(text) {
  const fillerWords = [
    'um', 'uh', 'like', 'you know', 'actually', 'basically', 'obviously',
    'literally', 'essentially', 'I mean', 'at the end of the day', 'sort of',
    'kind of', 'so', 'well', 'anyway', 'hmm', 'err', 'erm'
  ];

  const found = [];
  let count = 0;
  const lowerText = text.toLowerCase();

  fillerWords.forEach(filler => {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      count += matches.length;
      found.push(...matches.map(m => m.toLowerCase()));
    }
  });

  return {
    fillerWordCount: count,
    fillerWordsFound: [...new Set(found)],
    density: text.split(/\s+/).length > 0 ? (count / text.split(/\s+/).length) * 100 : 0
  };
}

/**
 * Calculate speech metrics from transcribed text and timing
 */
export function calculateSpeechMetrics(text, durationSeconds) {
  const wordCount = text.trim().split(/\s+/).length;
  const wpm = durationSeconds > 0 ? Math.round((wordCount / durationSeconds) * 60) : 0;

  const fillerAnalysis = detectFillerWords(text);

  // Calculate confidence score based on various factors
  let confidenceScore = 100;

  // Penalize for filler words
  confidenceScore -= Math.min(fillerAnalysis.density * 5, 20);

  // Penalize for too slow or too fast speech
  if (wpm < 100) confidenceScore -= 15; // Too slow
  if (wpm > 180) confidenceScore -= 10; // Too fast

  // Penalize for very short responses
  if (wordCount < 20) confidenceScore -= 20;

  confidenceScore = Math.max(0, Math.min(100, confidenceScore));

  return {
    wpm,
    wordCount,
    durationSeconds,
    fillerWordCount: fillerAnalysis.fillerWordCount,
    fillerWordsFound: fillerAnalysis.fillerWordsFound,
    fillerDensity: fillerAnalysis.density.toFixed(2),
    confidenceScore: Math.round(confidenceScore),
    speakingDurationSeconds: durationSeconds
  };
}

/**
 * Generate real-time coaching response
 */
export async function generateCoachingResponse(options) {
  const gemini = getGeminiModel();
  if (!gemini) {
    return getFallbackCoachingResponse(options);
  }

  const {
    currentQuestion,
    candidateAnswer,
    speechMetrics = {},
    interviewerPersona = 'faang-lead',
    targetRole = 'Software Engineer',
    conversationContext = [],
    category = 'General',
    difficulty = 'medium',
    resumeText = '',
    jobDescription = ''
  } = options;

  const personaPrompts = {
    'faang-lead': 'You are an experienced FAANG engineering leader conducting a technical interview.',
    'startup': 'You are a startup CTO conducting a technical interview, focusing on speed and pragmatism.',
    'mentor': 'You are a friendly mentor helping the candidate succeed, providing supportive feedback.',
    'strict': 'You are a rigorous interviewer who expects detailed, precise answers.',
    'friendly': 'You are a friendly interviewer who makes candidates feel comfortable while maintaining standards.'
  };

  const personaDescription = personaPrompts[interviewerPersona] || personaPrompts['faang-lead'];

  const prompt = `${personaDescription}

You are conducting a ${difficulty} ${category} interview for a ${targetRole} role.
Adapt your language and depth to the persona, role, domain, and difficulty.

${resumeText ? `Candidate resume context:\n${resumeText.slice(0, 3000)}` : 'No resume was provided.'}
${jobDescription ? `\nTarget job description:\n${jobDescription.slice(0, 3000)}` : 'No job description was provided.'}

Question asked: "${currentQuestion}"
Candidate's answer: "${candidateAnswer}"

${
  speechMetrics.wpm
    ? `\nSpeech metrics:
- Words per minute: ${speechMetrics.wpm}
- Filler words found: ${speechMetrics.fillerWordsFound?.join(', ') || 'none'}
- Confidence score: ${speechMetrics.confidenceScore}%`
    : ''
}

${
  conversationContext.length > 0
    ? `\nConversation so far:\n${conversationContext.map(c => `${c.speaker}: ${c.text}`).join('\n')}`
    : ''
}

Provide only valid JSON with this structure. Ask one adaptive next question based on the answer; do not generate a batch of questions:
{
  "feedback": "Brief evaluation of the answer (2-3 sentences)",
  "score": <score from 1-10>,
  "strengths": ["strength1", "strength2"],
  "areasForImprovement": ["area1", "area2"],
  "nextResponse": "Short spoken feedback before the next question",
  "nextQuestion": "One adaptive follow-up or next question",
  "followUpQuestions": ["question1", "question2"],
  "technicalScore": 1,
  "communicationScore": 1,
  "relevanceScore": 1,
  "structureScore": 1
}`;

  try {
    const response = await gemini.generateContent(prompt);
    const responseText = response.response.text();
    const coachingData = parseJsonResponse(responseText);

    return {
      feedback: coachingData.feedback || '',
      score: coachingData.score || 5,
      strengths: coachingData.strengths || [],
      areasForImprovement: coachingData.areasForImprovement || [],
      nextResponse: coachingData.nextResponse || 'Thank you. Let us build on that answer.',
      nextQuestion: coachingData.nextQuestion || coachingData.followUpQuestions?.[0] || 'Tell me more about your approach.',
      followUpQuestions: coachingData.followUpQuestions || [],
      technicalScore: coachingData.technicalScore || coachingData.score || 5,
      communicationScore: coachingData.communicationScore || coachingData.score || 5,
      relevanceScore: coachingData.relevanceScore || coachingData.score || 5,
      structureScore: coachingData.structureScore || coachingData.score || 5,
      success: true
    };
  } catch (error) {
    console.error('Coaching generation error:', error);
    return {
      ...getFallbackCoachingResponse(options),
      error: error.message,
      usedFallback: true
    };
  }
}

/**
 * Generate initial coaching introduction
 */
export async function generateCoachingIntroduction(options) {
  const gemini = getGeminiModel();
  if (!gemini) {
    const fallback = getFallbackIntro(options);
    return {
      ...fallback,
      success: true
    };
  }

  const {
    category = 'General',
    difficulty = 'medium',
    targetRole = 'Software Engineer',
    interviewerPersona = 'faang-lead',
    resumeText = '',
    jobDescription = ''
  } = options;

  const personaPrompts = {
    'faang-lead': 'You are an experienced FAANG engineering leader.',
    'startup': 'You are a startup CTO.',
    'mentor': 'You are a friendly mentor.',
    'strict': 'You are a rigorous interviewer.',
    'friendly': 'You are a friendly interviewer.'
  };

  const personaDescription = personaPrompts[interviewerPersona] || personaPrompts['faang-lead'];

  const prompt = `${personaDescription} You are about to conduct a live ${difficulty} ${category} interview with a candidate for a ${targetRole} role.

${resumeText ? `Resume context:\n${resumeText.slice(0, 3000)}` : ''}
${jobDescription ? `Job description:\n${jobDescription.slice(0, 3000)}` : ''}

Generate a friendly introduction and opening remarks that:
1. Welcome the candidate
2. Explain the interview format
3. Ask the first technical question

Keep it concise (2-3 sentences for introduction + 1 question). Respond with valid JSON only:
{
  "introduction": "Welcome message",
  "firstQuestion": "Your first interview question"
}`;

  try {
    const response = await gemini.generateContent(prompt);
    const coachingData = parseJsonResponse(response.response.text());

    return {
      introduction: coachingData.introduction || 'Welcome to your live interview session.',
      firstQuestion: coachingData.firstQuestion || 'Tell me about yourself and your experience.',
      success: true
    };
  } catch (error) {
    console.error('Introduction generation error:', error);
    return {
      introduction: 'Welcome to your live interview session. Let\'s get started.',
      firstQuestion: 'Tell me about yourself and your experience.',
      error: error.message,
      success: false
    };
  }
}
