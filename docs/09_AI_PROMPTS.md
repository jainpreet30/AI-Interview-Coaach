# AI Integration and Prompt Design

## AI Use Cases
- Generate interview questions based on category and difficulty
- Evaluate candidate answers and generate improvement feedback
- Provide coaching tips, resume advice, and confidence-building guidance
- Suggest follow-up questions for skill reinforcement

## Integration Architecture
- The backend acts as the orchestrator for AI requests
- Prompt templates are stored in code or configuration
- Each session request sends user context and question details to the AI provider
- AI responses are parsed and persisted as feedback

## Prompt Engineering
### Example: Generate a technical question
Prompt:
```
You are an interview coach for software engineering students. Create one technical interview question for a candidate practicing data structures and algorithms at the intermediate level. Provide the question, difficulty, and a short context description.
```

### Example: Evaluate an answer
Prompt:
```
A student answered the following interview question:
Question: Explain the difference between a stack and a queue.
Answer: [student answer here]
Please evaluate the answer, highlight strengths, identify mistakes, and suggest how to improve. Provide a score from 1 to 10.
```

## Data Sent to AI
- question text
- candidate answer
- desired rubric or evaluation criteria
- expected topic area and difficulty level

## AI Provider Configuration
- Store `AI_API_KEY` in environment variables for the backend server
- Optionally set `AI_MODEL` to control the OpenAI model used by the AI service
- Use secure secrets management in production

## Response Handling
- Normalize AI output into structured fields: score, strengths, improvements
- Store the original AI feedback and an optional condensed summary
- Display user-facing feedback in the frontend with clear sections

## Safety and Quality
- Keep prompts specific and focused on interview coaching
- Avoid sending sensitive user data to the AI provider
- Use validation to ensure AI output contains expected fields
- Add fallback messaging when AI responses are incomplete or ambiguous

## GTU Report Material
Document how AI prompt design supports the system and include sample prompts and responses in the Implementation chapter.
