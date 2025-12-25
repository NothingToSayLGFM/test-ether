import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const [, , privateKey, amount, recipient] = process.argv;
  if (!privateKey || !amount || !recipient) {
    console.log("Usage: node index.js <privateKey> <amount> <recipient>");
    process.exit(1);
  }
  try {
    const provider = new ethers.JsonRpcProvider(
      `https://sepolia.infura.io/v3/${process.env.KEY}`
    );

    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`Sender: ${wallet.address}`);
    console.log(`Recipient: ${recipient}`);
    console.log(`Sum: ${amount} ETH`);

    const balance = await provider.getBalance(wallet.address);
    const balanceInEth = ethers.formatEther(balance);
    console.log(`Sender balance: ${balanceInEth} ETH`);

    if (parseFloat(balanceInEth) < parseFloat(amount)) {
      throw new Error("Insufficient funds on the balance sheet");
    }

    const tx = {
      to: recipient,
      value: ethers.parseEther(amount.toString()),
    };

    console.log("Sending a transaction...");
    const transaction = await wallet.sendTransaction(tx);

    console.log(`TX Hash: ${transaction.hash}`);
    console.log(
      `Explorer: https://sepolia.etherscan.io/tx/${transaction.hash}`
    );

    console.log("Waiting for confirmation...");
    const receipt = await transaction.wait();

    console.log(`Transaction confirmed in the block: ${receipt.blockNumber}`);
    console.log(`Gas used: ${receipt.gasUsed.toString()}`);

    return {
      hash: transaction.hash,
      blockNumber: receipt.blockNumber,
      status: receipt.status === 1 ? "success" : "failed",
    };
  } catch (error) {
    console.error("Error:");

    if (error.code === "INSUFFICIENT_FUNDS") {
      console.error("Insufficient funds to pay gas");
    } else if (error.code === "INVALID_ARGUMENT") {
      console.error("Invalid address or amount format");
    } else if (error.code === "NETWORK_ERROR") {
      console.error("Network connection error");
    } else {
      console.error(error.message);
    }

    throw error;
  }
}

main()
  .then((result) => {
    console.log("Success:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed");
    process.exit(1);
  });
