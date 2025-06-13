import {
  Delegation,
  DelegationFramework,
  MetaMaskSmartAccount,
  SINGLE_DEFAULT_MODE,
  createCaveatBuilder,
  createDelegation,
  createExecution,
} from "@metamask/delegation-toolkit";
import { Address, Hex } from "viem";

export function prepareRootDelegation(delegator: MetaMaskSmartAccount, delegate: Address): Delegation {
  // The following caveat is a simple example of a caveat that limits
  // the number of executions the delegate can perform on the delegator's
  // behalf.

  // You can add more caveats to the delegation as needed to restrict
  // the delegate's actions. Checkout delegation-toolkit docs for more
  // information on restricting delegate's actions.

  // Restricting a delegation:
  // https://docs.gator.metamask.io/how-to/create-delegation/restrict-delegation
  const caveats = createCaveatBuilder(delegator.environment).addCaveat("limitedCalls", 1);

  return createDelegation({
    to: delegate as `0x${string}`,
    from: delegator.address as `0x${string}`,
    caveats: caveats,
  });
}

export function prepareRedeemDelegationData(delegation: Delegation): Hex {
  const execution = createExecution();
  const data = DelegationFramework.encode.redeemDelegations({
    delegations: [[delegation]],
    modes: [SINGLE_DEFAULT_MODE],
    executions: [[execution]],
  });

  return data;
}
