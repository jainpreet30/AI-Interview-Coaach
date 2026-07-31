# Database Design

## Collections

### users
- _id
- name
- email
- passwordHash
- role (student, coach, admin)
- profile { university, department, year, skills }
- createdAt
- updatedAt

### interviewSessions
- _id
- userId -> users._id
- startedAt
- completedAt
- status (in-progress, completed)
- category
- difficulty
- questions: [ { questionId, prompt, userAnswer, aiFeedback, score } ]
- overallScore
- tags
- notes

### questionBank
- _id
- category
- difficulty
- prompt
- sampleAnswer
- tags
- createdBy
- createdAt
- updatedAt

### feedbackReports
- _id
- sessionId -> interviewSessions._id
- userId -> users._id
- summary
- strengths
- improvements
- confidenceScore
- generatedAt

### analytics
- _id
- userId -> users._id
- metrics { sessionsCompleted, averageScore, categoryPerformance }
- updatedAt

## Relationships
- Each interview session belongs to one user.
- Each feedback report belongs to one session and one user.
- Questions may be reused across many sessions.

## Indexes
- email unique index on `users`
- userId index on `interviewSessions`
- category, difficulty indexes on `questionBank`
- sessionId index on `feedbackReports`

## Data Flow
1. User starts a session and selects a topic.
2. The backend fetches or generates interview questions.
3. User answers questions and the AI evaluates each response.
4. The session record updates with scores and feedback.
5. Final performance metrics are stored in analytics and report documents.

## GTU Report Material
Include database diagrams and collection explanations in the Design and Implementation sections of the final report.
