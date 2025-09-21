import { AlchemyProvider, Wallet, Contract, ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs/promises'; 
dotenv.config();

const rawData = await fs.readFile(
  new URL('../artifacts/contracts/PaymentContract.sol/PaymentContract.json', import.meta.url)
);
const contractJson = JSON.parse(rawData);  
const abi = contractJson.abi;  


const { API_KEY, PRIVATE_KEY, CONTRACT_ADDRESS } = process.env;


const provider = new AlchemyProvider('sepolia', API_KEY);
const signer = new Wallet(PRIVATE_KEY, provider);

const contract = new Contract(CONTRACT_ADDRESS, abi, signer);


export const sendPayment = async (receiver, amountInEth, isEscrow) => {
  try {
    console.log("Service");
    const amount = ethers.parseEther(amountInEth);  
    const tx = await contract.makePayment(receiver, amount, isEscrow, {
      value: amount,
    });
    await tx.wait();
    console.log(`Payment sent: ${tx.hash}`);
    return tx.hash;
  } catch (error) {
    console.error('Error sending payment:', error);
    throw error;
  }
};


export const releaseEscrow = async (paymentIndex) => {
  try {
    const tx = await contract.releaseEscrow(paymentIndex);
    await tx.wait();
    console.log(`Escrow released: ${tx.hash}`);
    return tx.hash;
  } catch (error) {
    console.error('Error releasing escrow:', error);
    throw error;
  }
};
