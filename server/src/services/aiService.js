import OpenAI from 'openai';

const apiKey = process.env.AI_API_KEY;
const aiModel = process.env.AI_MODEL || 'gpt-3.5-turbo';

const openai = apiKey ? new OpenAI({ apiKey }) : null;

function parseJsonFromText(text) {
  try {
    const jsonText = text.trim().replace(/^[^{[]+/, '').replace(/[^}\]]+$/, '');
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

function stubEvaluateAnswer({ questionText, userAnswer, speechMetrics = {} }) {
  const trimmed = (userAnswer || '').trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const score = trimmed ? Math.min(10, Math.max(1, Math.round(wordCount / 12 + 3))) : 1;

  const hasSituation = /situation|when|while|during|at my previous|project/i.test(trimmed);
  const hasTask = /task|goal|objective|needed to|assigned|responsibility/i.test(trimmed);
  const hasAction = /action|i implemented|i created|i built|i designed|i solved|i used|i analyzed/i.test(trimmed);
  const hasResult = /result|outcome|improved|increased|decreased|reduced|achieved|percent|%/i.test(trimmed);

  const starScore = {
    situation: trimmed ? (hasSituation ? 8 : 4) : 0,
    task: trimmed ? (hasTask ? 8 : 4) : 0,
    action: trimmed ? (hasAction ? 9 : 5) : 0,
    result: trimmed ? (hasResult ? 9 : 3) : 0
  };

  const technicalScore = trimmed ? Math.min(10, Math.max(3, Math.round(wordCount / 10 + 2))) : 1;
  const communicationScore = trimmed ? Math.min(10, Math.max(4, Math.round(10 - (speechMetrics.fillerWordCount || 0) * 0.5))) : 1;

  const keyMissingPoints = [];
  if (!hasResult) keyMissingPoints.push('Include measurable outcomes or metrics achieved (e.g. 20% latency reduction).');
  if (!hasSituation) keyMissingPoints.push('Set clear context about the situation or business problem.');
  if (wordCount < 30) keyMissingPoints.push('Elaborate with more depth and technical specifics.');

  const criticism = trimmed
    ? wordCount < 25
      ? 'The answer is overly concise and lacks the technical depth expected in senior-level interviews. It mentions general concepts without explaining underlying mechanisms or trade-offs.'
      : 'The answer provides a high-level explanation, but skips important operational details, failure scenarios, and performance trade-offs.'
    : 'No response submitted. In an interview, staying silent or giving an empty answer leaves no opportunity for evaluation.';

  const whatToAdd = [
    'Explain the specific architectural or algorithmic trade-offs (e.g. Time vs Space complexity, CPU vs Memory).',
    'Mention how you handle edge cases, failure recovery, or error logging in production.',
    'Quantify your results with concrete numbers (e.g., "reduced latency by 35%" or "handled 10k req/sec").'
  ];

  const termsList = ['Time Complexity', 'Space Complexity', 'Edge Cases', 'Trade-offs', 'Scalability', 'Metrics'];
  const keyTermsChecklist = termsList.map((term) => ({
    term,
    included: new RegExp(term, 'i').test(trimmed)
  }));

  const recommendedAddition = trimmed
    ? `Add this paragraph to your response: "To optimize this further in production, I evaluated the trade-off between time complexity O(N) and memory consumption. By implementing proper caching and handling edge cases, we reduced response times by 30% while maintaining system stability."`
    : `Include a structured explanation covering problem background, your technical solution, trade-off decisions, and measurable outcomes.`;

  const idealAnswer = trimmed
    ? `In my previous project, we faced a challenge where ${questionText.toLowerCase().includes('compare') ? 'we needed to select the optimal data architecture' : 'we needed a reliable solution'}. I took ownership by analyzing requirements, implementing a structured solution using best practices, and validating edge cases. As a result, system efficiency improved significantly.`
    : `A strong response should clearly define the problem (Situation & Task), outline your individual contribution (Action), and quantify the final impact (Result).`;

  return {
    score,
    strengths: trimmed
      ? 'Good attempt. Your answer covers core principles and demonstrates relevant domain awareness.'
      : 'No answer was provided, so the response cannot be evaluated properly.',
    improvements: trimmed
      ? 'To maximize your impact, structure your answer using the STAR method and provide quantifiable results.'
      : 'Write or record a full response to receive detailed coaching feedback.',
    rubric: {
      technicalScore,
      communicationScore,
      starScore,
      strengths: trimmed ? 'Clear articulation of the primary concept and active problem solving.' : 'N/A',
      improvements: trimmed ? 'Add specific metrics, architectural details, and explicit results.' : 'N/A',
      criticism,
      whatToAdd,
      keyTermsChecklist,
      recommendedAddition,
      keyMissingPoints: keyMissingPoints.length ? keyMissingPoints : ['Add deeper technical edge-case analysis.'],
      idealAnswer
    },
    speechMetrics: {
      wpm: speechMetrics.wpm || 0,
      fillerWordCount: speechMetrics.fillerWordCount || 0,
      fillerWordsFound: speechMetrics.fillerWordsFound || [],
      speakingDurationSeconds: speechMetrics.speakingDurationSeconds || 0
    },
    raw: `Question: ${questionText}\nAnswer: ${trimmed}`
  };
}

function getQuestionTemplates(category, difficulty) {
  const normalizedCategory = (category || 'General').toLowerCase();
  const normalizedDifficulty = (difficulty || 'medium').toLowerCase();

  const pools = {
    'data structures': {
      easy: [
        {
          prompt: 'Compare an array and a linked list. When should you use each one?',
          sampleAnswer: 'Arrays are great for fast indexed access, while linked lists excel at insertions and deletions. Use arrays when you need random access and fixed-size collections; use linked lists for frequent insertions and memory-efficient growth.',
          tags: ['arrays','linked-list']
        },
        {
          prompt: 'Explain how a stack works and give a real-world programming example.',
          sampleAnswer: 'A stack follows LIFO order. It is useful for function call stacks, undo functionality, and depth-first search.',
          tags: ['stack','lifo']
        },
        {
          prompt: 'What is a hash table and why is it useful for lookup operations?',
          sampleAnswer: 'A hash table maps keys to values with near-constant-time lookup. It uses a hash function to place items in buckets, making it great for caches and dictionaries.',
          tags: ['hash-table','lookup']
        }
      ],
      medium: [
        {
          prompt: 'Describe how a binary search tree stores data and how search operates in it.',
          sampleAnswer: 'A BST stores data such that left nodes are smaller and right nodes are larger. Search compares values and traverses left or right accordingly, giving average O(log n) time.',
          tags: ['binary-search-tree','bst']
        },
        {
          prompt: 'Explain the difference between a queue and a deque, and where each is used.',
          sampleAnswer: 'A queue is FIFO, while a deque supports insertion/removal at both ends. Use queues for task scheduling and deques for sliding window problems.',
          tags: ['queue','deque']
        }
      ],
      hard: [
        {
          prompt: 'How does a balanced tree like AVL or red-black tree maintain O(log n) operations?',
          sampleAnswer: 'Balanced trees enforce height constraints and rebalance after insertions/deletions to keep depth logarithmic, ensuring efficient searches.',
          tags: ['avl','red-black-tree']
        },
        {
          prompt: 'Explain how a heap is used to implement a priority queue.',
          sampleAnswer: 'Heaps keep the highest-priority element at the root, allowing insert and remove operations in O(log n). This is ideal for scheduling and Dijkstra’s algorithm.',
          tags: ['heap','priority-queue']
        }
      ]
    },
    algorithms: {
      easy: [
        {
          prompt: 'What is binary search and when would you use it?',
          sampleAnswer: 'Binary search finds an item in a sorted array by repeatedly halving the search range. Use it when the data is sorted and you need fast lookups.',
          tags: ['binary-search','search']
        },
        {
          prompt: 'Describe the difference between linear search and binary search.',
          sampleAnswer: 'Linear search checks each element and is O(n), while binary search halves the search space and runs in O(log n) on sorted data.',
          tags: ['search','comparison']
        }
      ],
      medium: [
        {
          prompt: 'Explain Dijkstra’s algorithm for shortest path problems.',
          sampleAnswer: 'Dijkstra uses a priority queue to find the shortest path from a source to all nodes in a weighted graph with non-negative edges.',
          tags: ['dijkstra','graphs']
        },
        {
          prompt: 'How does dynamic programming improve performance over naive recursion?',
          sampleAnswer: 'Dynamic programming caches results of overlapping subproblems to avoid redundant computation, turning exponential recursion into polynomial time.',
          tags: ['dynamic-programming','optimization']
        }
      ],
      hard: [
        {
          prompt: 'What is the traveling salesman problem and why is it hard?',
          sampleAnswer: 'TSP asks for the shortest round trip through all cities. It is NP-hard, meaning no known polynomial-time solution exists for large instances.',
          tags: ['tsp','np-hard']
        },
        {
          prompt: 'Explain the concept of memoization and how it differs from tabulation.',
          sampleAnswer: 'Memoization caches results top-down during recursion; tabulation builds a table bottom-up. Both are DP techniques, but the approach differs.',
          tags: ['memoization','tabulation']
        }
      ]
    }
  };

  const categoryPool = pools[normalizedCategory] || null;
  if (categoryPool && categoryPool[normalizedDifficulty]) {
    return categoryPool[normalizedDifficulty];
  }

  return [
    {
      prompt: `Describe an important concept from ${category} at ${difficulty} difficulty.`,
      sampleAnswer: `A persuasive answer should be clear, include examples, and explain why the concept matters in real systems.`,
      tags: [normalizedCategory, normalizedDifficulty]
    },
    {
      prompt: `How would you explain a core ${category} idea to someone preparing for interviews?`,
      sampleAnswer: `Focus on the definition, a real-world use case, and the main trade-offs or benefits of the concept.`,
      tags: [normalizedCategory, normalizedDifficulty]
    },
    {
      prompt: `What is one fundamental topic in ${category} at ${difficulty} level and why is it important?`,
      sampleAnswer: `Cover the fundamentals, include a short example, and tie it to how it appears in software development.`,
      tags: [normalizedCategory, normalizedDifficulty]
    }
  ];
}

function stubGenerateInterviewQuestions({ category, difficulty, questionCount }) {
  const templates = getQuestionTemplates(category, difficulty);
  const results = [];
  const seenPrompts = new Set();
  let templateIndex = 0;
  let variationIndex = 1;

  while (results.length < questionCount) {
    const template = templates[templateIndex % templates.length] || {
      prompt: `Describe an important concept from ${category} at ${difficulty} difficulty.`,
      sampleAnswer: `A strong answer should explain the concept clearly, include an example, and mention why it matters in real systems.`,
      tags: [category.toLowerCase(), difficulty]
    };

    let prompt = template.prompt.trim();
    if (seenPrompts.has(prompt)) {
      prompt = `${template.prompt} Explain it in a different way or provide another example.`;
    }
    if (seenPrompts.has(prompt)) {
      prompt = `${template.prompt} Describe another aspect of the concept and how it applies in practice.`;
    }
    while (seenPrompts.has(prompt)) {
      prompt = `${template.prompt} Offer a new use case or compare it with a related idea (${variationIndex}).`;
      variationIndex += 1;
    }

    seenPrompts.add(prompt);
    results.push({
      prompt,
      sampleAnswer: template.sampleAnswer,
      tags: template.tags || [category.toLowerCase(), difficulty]
    });

    templateIndex += 1;
  }

  return results.slice(0, questionCount);
}

export async function evaluateAnswer({ questionText, userAnswer, speechMetrics = {} }) {
  if (!openai) {
    return stubEvaluateAnswer({ questionText, userAnswer, speechMetrics });
  }

  const prompt = `You are an expert interview coach. Evaluate the candidate's answer to: "${questionText}".
Candidate Answer: "${userAnswer}"

Return ONLY a JSON object with:
- score (1-10)
- technicalScore (1-10)
- communicationScore (1-10)
- starScore: { situation (1-10), task (1-10), action (1-10), result (1-10) }
- strengths (concise string)
- improvements (concise string)
- criticism (detailed technical critique highlighting flaws/vagueness)
- whatToAdd (array of strings specifying exact concepts/metrics to add)
- keyTermsChecklist (array of objects with fields: term, included)
- recommendedAddition (concrete 2-3 sentence phrase to add directly to answer)
- keyMissingPoints (array of short strings)
- idealAnswer (short exemplar response based on candidate's points)`;

  try {
    const response = await openai.chat.completions.create({
      model: aiModel,
      messages: [
        { role: 'system', content: 'You are an elite interview coach providing structured feedback.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 650
    });

    const content = response.choices?.[0]?.message?.content?.[0]?.text ?? response.choices?.[0]?.message?.content ?? '';
    const parsed = parseJsonFromText(typeof content === 'string' ? content : JSON.stringify(content));
    if (parsed && typeof parsed.score === 'number') {
      const mainScore = Math.min(10, Math.max(1, Math.round(parsed.score)));
      return {
        score: mainScore,
        strengths: parsed.strengths || 'Shows basic understanding and clear articulation.',
        improvements: parsed.improvements || 'Structure using STAR method and add quantifiable impact.',
        rubric: {
          technicalScore: Math.min(10, Math.max(1, Math.round(parsed.technicalScore || mainScore))),
          communicationScore: Math.min(10, Math.max(1, Math.round(parsed.communicationScore || mainScore))),
          starScore: {
            situation: Math.min(10, Math.max(1, Math.round(parsed.starScore?.situation || 5))),
            task: Math.min(10, Math.max(1, Math.round(parsed.starScore?.task || 5))),
            action: Math.min(10, Math.max(1, Math.round(parsed.starScore?.action || 5))),
            result: Math.min(10, Math.max(1, Math.round(parsed.starScore?.result || 4)))
          },
          strengths: parsed.strengths || 'Solid demonstration of problem-solving approach.',
          improvements: parsed.improvements || 'Focus on concrete metrics and explicit results.',
          criticism: parsed.criticism || 'The response is generic and lacks specific technical trade-offs.',
          whatToAdd: Array.isArray(parsed.whatToAdd) ? parsed.whatToAdd : ['Add specific architectural trade-offs.', 'Include failure recovery details.'],
          keyTermsChecklist: Array.isArray(parsed.keyTermsChecklist) ? parsed.keyTermsChecklist : [],
          recommendedAddition: parsed.recommendedAddition || 'To optimize this solution in production, we evaluated the O(N) complexity trade-off and added edge-case validation.',
          keyMissingPoints: Array.isArray(parsed.keyMissingPoints) ? parsed.keyMissingPoints : ['Add clear measurable results.'],
          idealAnswer: parsed.idealAnswer || 'In my previous experience, I addressed this problem by designing a robust solution, resulting in improved system reliability.'
        },
        speechMetrics: {
          wpm: speechMetrics.wpm || 0,
          fillerWordCount: speechMetrics.fillerWordCount || 0,
          fillerWordsFound: speechMetrics.fillerWordsFound || [],
          speakingDurationSeconds: speechMetrics.speakingDurationSeconds || 0
        },
        raw: content
      };
    }

    return stubEvaluateAnswer({ questionText, userAnswer, speechMetrics });
  } catch (error) {
    console.error('AI evaluation failed:', error?.message || error);
    return stubEvaluateAnswer({ questionText, userAnswer, speechMetrics });
  }
}

export async function generateInterviewQuestions({
  category,
  difficulty,
  questionCount = 5,
  targetRole = 'Software Engineer',
  interviewerPersona = 'faang-lead',
  resumeText = '',
  jobDescription = ''
}) {
  if (!openai) {
    const baseQuestions = stubGenerateInterviewQuestions({ category, difficulty, questionCount });
    if (resumeText || jobDescription) {
      baseQuestions.unshift({
        prompt: `Based on your target role (${targetRole}), describe a complex project you worked on recently and the technical trade-offs you made.`,
        sampleAnswer: `Explain your role, architectural decisions, challenges faced, and measurable outcomes.`,
        tags: [category.toLowerCase(), 'personalized', 'resume']
      });
      return baseQuestions.slice(0, questionCount);
    }
    return baseQuestions;
  }

  const personaMap = {
    'faang-lead': 'A strict FAANG Tech Lead who focuses on deep technical complexity, system trade-offs, and edge cases.',
    'recruiter': 'A friendly, supportive talent acquisition recruiter focusing on culture fit, ownership, and STAR story structure.',
    'startup-founder': 'A fast-paced startup founder focusing on rapid execution, ownership, and practical problem solving.',
    'architect': 'A senior system architect focusing on scalability, distributed systems, caching, and data integrity.'
  };

  const personaPrompt = personaMap[interviewerPersona] || personaMap['faang-lead'];

  const prompt = `You are playing the role of: ${personaPrompt}
Generate ${questionCount} tailored interview questions for candidate applying for '${targetRole}' in category '${category}' at '${difficulty}' difficulty.

${resumeText ? `CANDIDATE RESUME SUMMARY:\n${resumeText.slice(0, 1000)}\n` : ''}
${jobDescription ? `TARGET JOB DESCRIPTION:\n${jobDescription.slice(0, 1000)}\n` : ''}

If resume or job description details are provided, tailor at least 2 questions directly to the candidate's actual projects or required job skills.
Return ONLY a valid JSON array of objects with fields: prompt, sampleAnswer, and tags (array of strings).`;

  try {
    const response = await openai.chat.completions.create({
      model: aiModel,
      messages: [
        { role: 'system', content: 'You are an expert personalized interview question generator.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 750
    });

    const content = response.choices?.[0]?.message?.content?.[0]?.text ?? response.choices?.[0]?.message?.content ?? '';
    const parsed = parseJsonFromText(typeof content === 'string' ? content : JSON.stringify(content));
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item) => ({
        prompt: item.prompt || '',
        sampleAnswer: item.sampleAnswer || '',
        tags: Array.isArray(item.tags) ? item.tags : [category.toLowerCase(), difficulty]
      }));
    }

    return stubGenerateInterviewQuestions({ category, difficulty, questionCount });
  } catch (error) {
    console.error('AI question generation failed:', error?.message || error);
    return stubGenerateInterviewQuestions({ category, difficulty, questionCount });
  }
}

export async function summarizeSession({ questions }) {
  const coveredCount = questions.filter((item) => item.score != null).length;
  const average = questions.length > 0 ? questions.reduce((sum, item) => sum + (item.score || 0), 0) / questions.length : 0;
  return {
    summary: `You completed ${coveredCount} question${coveredCount === 1 ? '' : 's'} with an average score of ${average.toFixed(1)}.`,
    confidenceScore: Math.round(average * 10) / 10
  };
}
