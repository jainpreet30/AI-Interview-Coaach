import OpenAI from 'openai';

const apiKey = process.env.AI_API_KEY;
const aiModel = process.env.AI_MODEL || 'gpt-4';

const openai = apiKey ? new OpenAI({ apiKey }) : null;

/**
 * Transcribe audio buffer using OpenAI Whisper
 */
export async function transcribeAudio(audioBuffer) {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    // Convert audio buffer to file-like object
    const file = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' });

    const response = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: file,
      language: 'en'
    });

    return {
      text: response.text,
      success: true
    };
  } catch (error) {
    console.error('Transcription error:', error);
    return {
      text: '',
      error: error.message,
      success: false
    };
  }
}

/**
 * Generate TTS audio for coach response
 */
export async function generateCoachVoice(text) {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova',
      input: text
    });

    // Convert stream to buffer
    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      audioBuffer: buffer,
      success: true
    };
  } catch (error) {
    console.error('TTS error:', error);
    return {
      audioBuffer: null,
      error: error.message,
      success: false
    };
  }
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
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  const {
    currentQuestion,
    candidateAnswer,
    speechMetrics = {},
    interviewerPersona = 'faang-lead',
    targetRole = 'Software Engineer',
    conversationContext = []
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

You are interviewing a candidate for a ${targetRole} role.

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

Provide your response in JSON format with the following structure:
{
  "feedback": "Brief evaluation of the answer (2-3 sentences)",
  "score": <score from 1-10>,
  "strengths": ["strength1", "strength2"],
  "areasForImprovement": ["area1", "area2"],
  "nextResponse": "Your coaching response to continue the interview (1-2 sentences)",
  "followUpQuestions": ["question1", "question2"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: aiModel,
      messages: [
        {
          role: 'system',
          content: 'You are an expert interview coach. Respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const responseText = response.choices[0].message.content.trim();
    
    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON in response');
    }

    const coachingData = JSON.parse(jsonMatch[0]);

    return {
      feedback: coachingData.feedback || '',
      score: coachingData.score || 5,
      strengths: coachingData.strengths || [],
      areasForImprovement: coachingData.areasForImprovement || [],
      nextResponse: coachingData.nextResponse || 'Let me continue with the next question.',
      followUpQuestions: coachingData.followUpQuestions || [],
      success: true
    };
  } catch (error) {
    console.error('Coaching generation error:', error);
    return {
      feedback: 'Unable to generate feedback at this moment.',
      score: 0,
      strengths: [],
      areasForImprovement: [],
      nextResponse: 'Let me continue with the next question.',
      followUpQuestions: [],
      error: error.message,
      success: false
    };
  }
}

/**
 * Generate initial coaching introduction
 */
export async function generateCoachingIntroduction(options) {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  const {
    category = 'General',
    difficulty = 'medium',
    targetRole = 'Software Engineer',
    interviewerPersona = 'faang-lead'
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
    const response = await openai.chat.completions.create({
      model: aiModel,
      messages: [
        {
          role: 'system',
          content: 'You are an expert interview coach. Respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const responseText = response.choices[0].message.content.trim();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Invalid JSON in response');
    }

    const coachingData = JSON.parse(jsonMatch[0]);

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
