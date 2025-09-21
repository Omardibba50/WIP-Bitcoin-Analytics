const { sendPayment } = require('../services/paymentService.mjs');

exports.sendPaymentController = async (req, res) => {
  const { receiver, amount } = req.body;
  console.log("BackController");
  try {
    const txHash = await sendPayment(receiver, amount);
    res.json({ status: 'success', txHash });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

