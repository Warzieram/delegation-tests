import {
  createCaveatBuilder,
  createDelegation,
  createExecution,
  DelegationFramework,
  getDeleGatorEnvironment,
  Implementation,
  SINGLE_DEFAULT_MODE,
  SINGLE_TRY_MODE,
  toMetaMaskSmartAccount,
  type Delegation,
  type ExecutionMode,
  type ExecutionStruct,
  type ToMetaMaskSmartAccountReturnType,
} from "@metamask/delegation-toolkit";
import { ethers, ZeroAddress } from "ethers";
import { useState } from "react";
import {
  bundlerClient,
  paymasterClient,
  pimilicoClient,
  publicClient,
} from "./config";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { useAccount, useWalletClient } from "wagmi";
import { createWalletClient, parseEther } from "viem";
import { baseSepolia } from "viem/chains";

function App() {
  const { address } = useAccount();
  const { data: mainAccount } = useWalletClient();
  const [delegateSmartAccount, setDelegateSmartAccount] =
    useState<ToMetaMaskSmartAccountReturnType<Implementation.Hybrid>>();
  const [delegatorSmartAccount, setDelegatorSmartAccount] =
    useState<ToMetaMaskSmartAccountReturnType<Implementation.Hybrid>>();
  const [delegation, setDelegation] = useState<Delegation>();
  const [signature, setSignature] = useState<`0x${string}`>();
  const [signedDelegation, setSignedDelegation] = useState();
  const [redeemOperationHash, setRedeemOperationHash] =
    useState<`0x${string}`>();
  const [deployOperationHash, setDeployOperationHash] =
    useState<`0x${string}`>();

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
    }

    await mainAccount?.requestAddresses();
  };
  const createDelegatorAccount = async () => {
    if (mainAccount) {
      const delegator = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [address, [], [], []],
        deploySalt: "0x",
        signatory: { account: mainAccount },
      });
      setDelegatorSmartAccount(delegator);
    }
  };

  const createDelegateAccount = async () => {
    if (delegatorSmartAccount) {
      const privateKey = generatePrivateKey();
      const account = privateKeyToAccount(privateKey);

      const delegateSA = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [account.address as `0x${string}`, [], [], []],
        deploySalt: "0x",
        signatory: { account },
      });
      setDelegateSmartAccount(delegateSA);
    }
  };

  const createDel = async () => {
    if (delegateSmartAccount && delegatorSmartAccount) {
      const caveats = createCaveatBuilder(
        delegatorSmartAccount.environment,
      ).addCaveat("limitedCalls", 10);

      const _delegation = createDelegation({
        to: delegateSmartAccount.address,
        from: delegatorSmartAccount.address,
        caveats: [],
      });

      setDelegation(_delegation);
    }
  };

  const signDel = async () => {
    if (delegation && delegatorSmartAccount) {
      const _signature = await delegatorSmartAccount.signDelegation({
        delegation,
      });
      console.log(_signature);

      const _signedDelegation = {
        ...delegation,
        signature,
      };

      localStorage.setItem("delegation", JSON.stringify(_signedDelegation));
      setSignedDelegation(_signedDelegation);
    }
  };

  const redeemDel = async () => {
    if (delegation && delegatorSmartAccount && delegateSmartAccount) {
 //     const mode: ExecutionMode = SINGLE_DEFAULT_MODE;
      const delegations = [delegation];

      //const executions = createExecution()

      const executions: ExecutionStruct[] = [
        {
          target: "0x26d35A9684A8AFCCf078FBa1c887b33feAE76c79",
          value: 420000000000000n,
          callData: "0x",
        },
      ];

      const redeemDelegationCallData =
        DelegationFramework.encode.redeemDelegations({
          delegations: [delegations],
          modes: [SINGLE_TRY_MODE],
          executions: [executions],
        });

      const { fast: fee } = await pimilicoClient.getUserOperationGasPrice();
      console.log(fee)

      const _userOperationHash = await bundlerClient.sendUserOperation({
        account: delegateSmartAccount,
        calls: [
          {
            to: getDeleGatorEnvironment(baseSepolia.id).DelegationManager,
            data: redeemDelegationCallData,
          },
        ],
        //callGasLimit: parseEther("0.1"),
        //verificationGasLimit: parseEther("0.1"),
        paymaster: paymasterClient,
        ...fee,
      });

      setRedeemOperationHash(_userOperationHash);
    }
  };

  return (
    <>
      <button onClick={connectWallet}>Connect With Metamask</button>

      {mainAccount && (
        <div>
          <p>{address}</p>
          <button onClick={createDelegatorAccount}>
            Create Delegator Smart Account
          </button>
        </div>
      )}

      {delegatorSmartAccount && (
        <>
          <p> Delegator: {delegatorSmartAccount.address}</p>
          <button onClick={createDelegateAccount}>
            {" "}
            Create Delegate Account{" "}
          </button>
        </>
      )}

      {delegateSmartAccount && (
        <>
          <p> Delegate: {delegateSmartAccount.address}</p>
          <button onClick={createDel}> Create Delegation </button>
        </>
      )}

      {delegation && (
        <>
          <p>Delegation: {JSON.stringify(delegation)} </p>
          <button onClick={signDel}> Sign Delegation </button>
        </>
      )}

      {signedDelegation && (
        <>
          <p>Signed Delegation : {JSON.stringify(signedDelegation)}</p>
          <button onClick={redeemDel}> Redeem Delegation </button>
        </>
      )}

      {redeemOperationHash && (
        <>
          <p> Operation Hash: {redeemOperationHash} </p>
        </>
      )}
    </>
  );
}

export default App;
