import express from 'express';  
import { sendPayment, releaseEscrow } from '../services/paymentService.mjs';  

const router = express.Router();

router.post('/sendPayment', async (req, res) => {
  const { receiver, amount, isEscrow } = req.body;
  try {
    const txHash = await sendPayment(receiver, amount, isEscrow);
    res.status(200).json({ transactionHash: txHash });
  } catch (error) {
    console.error('Error sending payment:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/releaseEscrow', async (req, res) => {
  const { paymentIndex } = req.body;
  try {
    const txHash = await releaseEscrow(paymentIndex);
    res.status(200).json({ transactionHash: txHash });
  } catch (error) {
    console.error('Error releasing escrow:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router; 
