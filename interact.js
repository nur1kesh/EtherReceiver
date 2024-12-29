const fs = require('fs');
const { Web3 } = require('web3');
require('dotenv').config();

// Read the private key from the .secret file
const privateKey = fs.readFileSync('.secret').toString().trim();

// Ganache Configuration (Local Network)
const ganacheProviderUrl = "http://127.0.0.1:7545";

// Sepolia Configuration (Test Network)
const sepoliaProviderUrl = "https://sepolia.infura.io/v3/d45f026011764712a610bf29e38db3f9";

// Set the network you want to use (Ganache or Sepolia)
const network = "ganache"; // Change to 'sepolia' to use Sepolia

// Set the provider based on the selected network
let providerUrl;
if (network === 'ganache') {
  providerUrl = ganacheProviderUrl;
} else if (network === 'sepolia') {
  providerUrl = sepoliaProviderUrl;
} else {
  console.log("Please select a valid network (ganache or sepolia).");
  process.exit(1);
}

const web3 = new Web3(providerUrl);

// Contract details
const contractAddress = "0x15CEe82C3b5a1ed86bD4A5F317930a0ddF2ADe5c";
const contractABI = require('./build/contracts/EtherReceiver.json').abi;
const contract = new web3.eth.Contract(contractABI, contractAddress);

// Get the account from the private key
const account = web3.eth.accounts.privateKeyToAccount(privateKey);
web3.eth.accounts.wallet.add(account);
const sender = account.address;

// Function to check the contract balance
async function checkBalance() {
  try {
    const balance = await contract.methods.checkBalance().call();
    console.log("Contract Balance: " + web3.utils.fromWei(balance, 'ether') + " ETH");
  } catch (err) {
    console.log("Error checking balance:", err);
  }
}

// Function to withdraw Ether (only by the owner)
async function withdraw() {
  try {
    console.log("Attempting to withdraw from contract...");
    // Estimate gas for the transaction
    const gas = await contract.methods.withdraw().estimateGas({ from: sender });
    
    // Create and sign the transaction
    const tx = {
      from: sender,
      to: contractAddress,
      data: contract.methods.withdraw().encodeABI(),
      gas: gas, // Use estimated gas
      gasPrice: await web3.eth.getGasPrice(), // Dynamic gas price
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    
    console.log("Withdrawal successful:", receipt.transactionHash);
  } catch (err) {
    console.log("Error withdrawing Ether:", err);
  }
}

// Function to send Ether to the contract
async function sendEther() {
  try {
    console.log("Sending Ether to the contract...");
    
    // Estimate the gas for the transaction
    const gas = await web3.eth.estimateGas({
      from: sender,
      to: contractAddress,
      value: web3.utils.toWei('0.1', 'ether'), // Sending 0.1 ETH
    });
    
    // Set gas price dynamically
    const gasPrice = await web3.eth.getGasPrice();

    const transaction = {
      from: sender,
      to: contractAddress,
      value: web3.utils.toWei('0.1', 'ether'), // Sending 0.1 ETH
      gas,  // Estimated gas
      gasPrice,  // Dynamic gas price
    };

    // Sign the transaction
    const signedTx = await web3.eth.accounts.signTransaction(transaction, privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    console.log("Transaction successful:", receipt.transactionHash);
  } catch (err) {
    console.log("Error sending Ether:", err);
  }
}

// Function to check contract balance after sending Ether and withdrawing
async function interactWithContract() {
  try {
    console.log("Interacting with contract...");

    // 1. Check balance before transactions
    await checkBalance();

    // 2. Send Ether to contract
    await sendEther();

    // 3. Check balance after sending Ether
    await checkBalance();

    // 4. Withdraw Ether from contract
    await withdraw();

    // 5. Final check balance after withdrawal
    await checkBalance();
  } catch (err) {
    console.log("Error during interaction:", err);
  }
}

interactWithContract();