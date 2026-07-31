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

function stubEvaluateAnswer({ questionText, userAnswer }) {
  const trimmed = (userAnswer || '').trim();
  const score = Math.min(10, Math.max(1, Math.round(trimmed.length / 20 + 3)));

  return {
    score,
    strengths: trimmed
      ? 'Good attempt. Your answer covers the key idea and shows understanding of the topic.'
      : 'No answer was provided, so the response cannot be evaluated properly.',
    improvements: trimmed
      ? 'Try adding a concrete example, more structure, and a short conclusion to strengthen your answer.'
      : 'Write a full answer to receive a useful evaluation.',
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
  return Array.from({ length: questionCount }, (_, index) => {
    const template = templates[index % templates.length];

    return {
      prompt: template.prompt,
      sampleAnswer: template.sampleAnswer,
      tags: template.tags || [category.toLowerCase(), difficulty]
    };
  });
}

export async function evaluateAnswer({ questionText, userAnswer }) {
  if (!openai) {
    return stubEvaluateAnswer({ questionText, userAnswer });
  }

  const prompt = `You are an interview coach. Evaluate the candidate's answer to the following question and return only a JSON object with fields: score (integer 1-10), strengths (short text), improvements (short text), and summary (short text).\n\nQuestion: ${questionText}\nAnswer: ${userAnswer}`;

  try {
    const response = await openai.chat.completions.create({
      model: aiModel,
      messages: [
        { role: 'system', content: 'You are a friendly and concise interview coach.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
      max_tokens: 300
    });

    const content = response.choices?.[0]?.message?.content?.[0]?.text ?? response.choices?.[0]?.message?.content ?? '';
    const parsed = parseJsonFromText(typeof content === 'string' ? content : JSON.stringify(content));
    if (parsed && typeof parsed.score === 'number') {
      return {
        score: Math.min(10, Math.max(1, Math.round(parsed.score))),
        strengths: parsed.strengths || 'The answer shows potential and some understanding of the topic.',
        improvements: parsed.improvements || 'Provide more context, structure the response, and include an example.',
        raw: content
      };
    }

    return stubEvaluateAnswer({ questionText, userAnswer });
  } catch (error) {
    console.error('AI evaluation failed:', error?.message || error);
    return stubEvaluateAnswer({ questionText, userAnswer });
  }
}

export async function generateInterviewQuestions({ category, difficulty, questionCount = 5 }) {
  if (!openai) {
    return stubGenerateInterviewQuestions({ category, difficulty, questionCount });
  }

  const prompt = `You are an interview coach. Create ${questionCount} interview questions for category '${category}' at '${difficulty}' difficulty. Return only a JSON array of objects with fields: prompt, sampleAnswer, and tags. Keep the output strictly valid JSON.`;

  try {
    const response = await openai.chat.completions.create({
      model: aiModel,
      messages: [
        { role: 'system', content: 'You are an expert interview coach and content generator.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 600
    });

    const content = response.choices?.[0]?.message?.content?.[0]?.text ?? response.choices?.[0]?.message?.content ?? '';
    const parsed = parseJsonFromText(typeof content === 'string' ? content : JSON.stringify(content));
    if (Array.isArray(parsed)) {
      return parsed.map((item) => ({
        prompt: item.prompt || '',
        sampleAnswer: item.sampleAnswer || '',
        tags: Array.isArray(item.tags) ? item.tags : []
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
