import express from 'express';
import cors from 'cors';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import userRouter from './routes/users.js';
import questionRouter from './routes/questions.js';
import sessionRouter from './routes/sessions.js';
import feedbackRouter from './routes/feedback.js';
import analyticsRouter from './routes/analytics.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/v1/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/questions', questionRouter);
app.use('/api/v1/sessions', sessionRouter);
app.use('/api/v1/feedback', feedbackRouter);
app.use('/api/v1/analytics', analyticsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
