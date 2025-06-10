import * as express from 'express';
import * as cors from 'cors';
import * as dotenv from 'dotenv';
import authRoutes from './auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});