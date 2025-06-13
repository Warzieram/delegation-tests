import {
    createCaveatBuilder,
  createDelegation,
  Implementation,
  toMetaMaskSmartAccount,
  type Delegation,
  type ToMetaMaskSmartAccountReturnType,
} from "@metamask/delegation-toolkit";
import type { JsonRpcSigner } from "ethers";
import { ethers, parseEther } from "ethers";
import { useState } from "react";
import { bundlerClient, publicClient } from "./config";
import { generatePrivateKey, privateKeyToAccount, type Account } from "viem/accounts";
import { createWalletClient, custom, stringToHex, type WalletClient } from "viem";
import { baseSepolia } from "viem/chains";
import { useWalletClient } from "wagmi";

function App() {
  const [mainAccount, setMainAccount] = useState<WalletClient>();
  const [delegateSmartAccount, setDelegateSmartAccount] =
    useState<ToMetaMaskSmartAccountReturnType<Implementation.MultiSig>>();
  const [delegatorSmartAccount, setDelegatorSmartAccount] =
    useState<ToMetaMaskSmartAccountReturnType<Implementation.MultiSig>>();
  const [delegation, setDelegation] = useState<Delegation>();
  const [signature, setSignature] = useState<`0x${string}`>();
  const [signedDelegation, setSignedDelegation] = useState<any>();

  const connectWallet = async () => {
    //if (typeof window.ethereum !== "undefined") {
    //  await window.ethereum.request({ method: "eth_requestAccounts" });
    //  const provider = new ethers.BrowserProvider(window.ethereum);
    //  setMainAccount(await provider.getSigner());
    //}
    
    const walletClient = createWalletClient({
      chain: baseSepolia,
      transport: custom(window.ethereum!)
    })
    await walletClient.request({method: "eth_requestAccounts"})
    
    setMainAccount(walletClient)

    //console.log(walletClient)

    //setMainAccount(walletClient)

    //const privateKey = generatePrivateKey();
    //const s = privateKeyToAccount(privateKey);
    //setSigner(s);
  };

  const createSignerSmartAccount = async () => {
    const threshold = parseEther("0.00001");

    if (mainAccount) {
      const privateKey = generatePrivateKey();
      const delegateAccount = privateKeyToAccount(privateKey)

      const signers = await mainAccount.getAddresses()
      console.log(signers)

      const delegatorSA = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.MultiSig,
        deployParams: [signers, threshold],
        deploySalt: "0x",
        signatory: [{account: mainAccount.account}]
      })
      const delegateSA = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.MultiSig,
        deployParams: [signers, threshold ],
        deploySalt: "0x",
        signatory: [{ account: delegateAccount}],
      });



      setDelegateSmartAccount(delegateSA);
      setDelegatorSmartAccount(delegatorSA);
    }
  };

  const createSignerDelegation = async () => {
    if (mainAccount && delegateSmartAccount) {
      const caveats = createCaveatBuilder(delegateSmartAccount.environment).addCaveat("limitedCalls", 1)
      const d = createDelegation({
        to: delegateSmartAccount?.address,
        from: delegatorSmartAccount?.address as `0x${string}`,
        caveats
      });

      console.log(d)

      setDelegation(d);
    }
  };

  const sign = async () => {
    const userOperationHash = await bundlerClient.sendUserOperation({
      account: delegateSmartAccount,
      calls: [{
        to: "0x5c219A41Ae7277fe1d7bCA0Bc2E02eA2d6244D58",
        value: parseEther("0.0001")
      }],
    })
    setSignature(userOperationHash)
    const _signedDelegation = {
      ...delegation,
      signature
    }
    setSignedDelegation(_signedDelegation)

    
  };

  return (
    <>
      <button onClick={connectWallet}>Connect With Metamask</button>
      {mainAccount && (
        <div>
          <p>{mainAccount?.account?.address}</p>
          <button onClick={createSignerSmartAccount}>
            Create Signer Smart Account
          </button>
        </div>
      )}
      {delegateSmartAccount && (
        <>
          <p> Delegator: {delegatorSmartAccount?.address}</p>
          <p> Delegate: {delegateSmartAccount.address}</p>
          <button onClick={createSignerDelegation}> Create Delegation </button>
        </>
      )}
      {delegation && (
        <>
          <p> Delegator : {delegation.delegator}</p>
          <p> Delegate : {delegation.delegate}</p>
          <button onClick={sign}>Sign Delegation</button>
        </>
      )}

      {signature && delegation && (
        <>
          <p>Signature: {signature}</p>
          <p>Signature from delegation: {delegation.signature}</p>
        </>
      )

      }
    </>
  );
}

export default App;
