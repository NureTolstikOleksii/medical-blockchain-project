import { Wallet } from 'ethers';
import { contract } from "../config/blockchain.js";

export function generateUserWalletAddress() {
    const wallet = Wallet.createRandom();
    return wallet.address;
}

export async function registerDoctorOnChain(wallet) {
    return contract.registerDoctor(wallet);
}

export async function registerPatientOnChain(wallet) {
    return contract.registerPatient(wallet);
}

export async function setDoctorAccess(walletPatient, walletDoctor, access) {
    return contract.setDoctorAccess(walletPatient, walletDoctor, access);
}