import express from 'express';
import cors from 'cors';
import paymentRoutes from './routes/paymentRoutes.js';  

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());  
app.use(express.json());  

app.use('/api/payments', paymentRoutes);

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
