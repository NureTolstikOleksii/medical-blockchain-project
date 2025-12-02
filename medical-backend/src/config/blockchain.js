import { JsonRpcProvider, Wallet, Contract } from 'ethers';
import dotenv from 'dotenv';
import abi from '../../MedicalDataABI.json' with { type: 'json' };

dotenv.config();
const provider = new JsonRpcProvider(process.env.BLOCKCHAIN_RPC);
const adminWallet = new Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

console.log('Blockchain connected as relayer:', adminWallet.address);

const contract = new Contract(
    process.env.CONTRACT_ADDRESS,
    abi,
    adminWallet
);

export { contract, adminWallet, provider };
