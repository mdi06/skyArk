import Web3 from 'web3';
import contractABI from './skygate_ABI.js';
import fs from 'fs';

// Constants for console colors and total iterations
const settings = {
    GREEN: '\x1b[32m',
    RED: "\x1b[31m",
    BOLD: "\x1b[1m",
    RESET: "\x1b[0m",
    totalIterations: 5,
    rpcUrl: 'https://opbnb.rpc.thirdweb.com',
    contractAddress: '0x9465fe0e8cdf4e425e0c59b7caeccc1777dc6695',
    keysPath: './keys.txt',
    pauseMin: 25000,
    pauseMax: 73000
};

class Web3Manager {
    constructor(web3, contractAddress) {
        this.web3 = web3;
        this.contract = new web3.eth.Contract(contractABI, contractAddress);
    }

    async signAndSendTransaction(account, txData) {
        const { nonce, maxPriorityFeePerGas, maxFeePerGas } = await this.getTransactionSettings(account.address);
        const signedTx = await this.web3.eth.accounts.signTransaction({
            from: account.address,
            to: this.contract.options.address,
            data: txData,
            maxPriorityFeePerGas,
            maxFeePerGas,
            nonce,
            chainId: 204, // Ensure chainId matches your network
            type: '0x2'
        }, account.privateKey);

        return await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    }

    async getTransactionSettings(address) {
        const nonce = await this.web3.eth.getTransactionCount(address);
        const maxPriorityFeePerGas = await this.web3.utils.toWei('0.00001', 'gwei');
        const maxFeePerGas = await this.web3.utils.toWei('0.000010024', 'gwei');
        return { nonce, maxPriorityFeePerGas, maxFeePerGas };
    }
}

class Utility {
    static async signTransactions(web3Manager, keys) {
        for (let i = 0; i < settings.totalIterations; i++) {
            console.log(`${settings.BOLD}Iteration ${i + 1} of ${settings.totalIterations}${settings.RESET}`);
            this.shuffleArray(keys);
            for (let key of keys) {
                const account = web3Manager.web3.eth.accounts.privateKeyToAccount(key);
                const txData = web3Manager.contract.methods.signin('1').encodeABI();
                const receipt = await web3Manager.signAndSendTransaction(account, txData);
                const opBNBscan = `https://opbnbscan.com/tx/${receipt.transactionHash}`;
                console.log(`Transaction from ${account.address} sent. Tx Hash: ${settings.BOLD}${settings.GREEN}${opBNBscan}${settings.RESET}${settings.RESET}`);
                //await this.delay(this.getRandomPauseDuration(settings.pauseMin, settings.pauseMax));
                const pauseDuration = this.getRandomPauseDuration(settings.pauseMin, settings.pauseMax);
                // Log pause duration
                console.log(`Pausing for ${(pauseDuration / 1000).toFixed(2)} seconds...`);
                // Wait for the pause duration
                await this.delay(pauseDuration);
            }
        }
    }

    static shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static getRandomPauseDuration(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
}

// Main execution function
async function main() {
    const web3 = new Web3(settings.rpcUrl);
    const keys = fs.readFileSync(settings.keysPath, 'utf8').split('\n').filter(key => key.trim() !== '');
    
    const web3Manager = new Web3Manager(web3, settings.contractAddress);
    await Utility.signTransactions(web3Manager, keys);
}

main().catch(console.error);
