// Import the required libraries
import fetch from 'node-fetch';
import { ethers } from 'ethers';
import fs from 'fs';
import readline from 'readline';
import chalk from 'chalk';

// API URLs
const verifyApiUrl = 'https://referralapi.layeredge.io/api/referral/verify-referral-code';

// Headers for the requests
const headers = {
  'Accept': 'application/json, text/plain, */*',
  'Accept-Encoding': 'gzip, deflate, br, zstd',
  'Accept-Language': 'en-US,en;q=0.9',
  'Content-Type': 'application/json',
  'Origin': 'https://dashboard.layeredge.io',
  'Referer': 'https://dashboard.layeredge.io/',
  'Sec-CH-UA': '"Not A(Brand";v="8", "Chromium";v="132", "Microsoft Edge";v="132"',
  'Sec-CH-UA-Mobile': '?0',
  'Sec-CH-UA-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-site',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 Edg/132.0.0.0'
};

// Load existing wallet data or initialize an empty array
const configFilePath = './config.json';
let walletData = [];

if (fs.existsSync(configFilePath)) {
  walletData = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
}

// Function to create a new wallet
function createNewWallet() {
  const wallet = ethers.Wallet.createRandom();

  const walletDetails = {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase
  };

  walletData.push(walletDetails);

  // Save wallet data to config.json
  fs.writeFileSync(configFilePath, JSON.stringify(walletData, null, 2));

  return walletDetails;
}

// Function to verify the referral code
async function verifyReferralCode(reffcode) {
  const response = await fetch(verifyApiUrl, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ invite_code: reffcode })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return response.json();
}

// Function to register the wallet
async function registerWallet(reffcode, walletAddress) {
  const registerWalletApiUrl = `https://referralapi.layeredge.io/api/referral/register-wallet/${reffcode}`;
  const response = await fetch(registerWalletApiUrl, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ walletAddress })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return response.json();
}

// Input and loop logic
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


rl.question(chalk.cyan('Enter referral code: '), (reffcode) => {
  rl.question(chalk.cyan('Enter number of wallets to create: '), async (loopCount) => {
    const count = parseInt(loopCount, 10);

    if (isNaN(count) || count <= 0) {
      console.error(chalk.red('[✖] Invalid number of wallets!'));
      rl.close();
      return;
    }

    console.log(chalk.yellowBright(`\n[→] Creating ${count} wallets one by one...\n`));

    for (let i = 0; i < count; i++) {
      console.log(chalk.yellow(`Processing wallet ${i + 1} of ${count}`));

      try {
        const walletDetails = createNewWallet();
        await verifyReferralCode(reffcode);
        await registerWallet(reffcode, walletDetails.address);
        console.log(chalk.green(`[✔] Wallet ${i + 1} processed successfully!`));
      } catch (error) {
        console.error(chalk.red(`[✖] Error processing wallet ${i + 1}: ${error.message}`));
        break; // Stop on error
      }
    }

    console.log(chalk.greenBright('\n[✔] Process completed!'));
    rl.close();
  });
});
