import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Deploy ConfidentialDisperse, wiring it to the official Sepolia singletons.
// cToken + announcer addresses are read from addresses.sepolia.json - fill them
// (cToken from the Zama Wrappers Registry, announcer = ERC-5564 singleton) first.
async function main() {
  const file = path.join(__dirname, "..", "addresses.sepolia.json");
  const cfg = JSON.parse(fs.readFileSync(file, "utf8"));

  if (!cfg.cToken || !cfg.erc5564Announcer) {
    throw new Error(
      "Set `cToken` and `erc5564Announcer` in addresses.sepolia.json before deploying."
    );
  }

  const [deployer] = await ethers.getSigners();
  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${await deployer.getAddress()}`);

  const factory = await ethers.getContractFactory("ConfidentialDisperse");
  const disperse = await factory.deploy(cfg.cToken, cfg.erc5564Announcer);
  await disperse.waitForDeployment();
  const addr = await disperse.getAddress();
  console.log(`ConfidentialDisperse deployed: ${addr}`);

  cfg.confidentialDisperse = addr;
  fs.writeFileSync(file, JSON.stringify(cfg, null, 2) + "\n");
  console.log(`Wrote address back to ${path.basename(file)}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
