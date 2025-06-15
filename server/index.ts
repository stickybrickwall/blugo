import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import quizRoutes from './routes/quiz';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/quiz', quizRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});