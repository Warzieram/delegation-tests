import { createPublicClient, http } from "viem";
import { createBundlerClient } from "viem/account-abstraction";
import { baseSepolia as chain } from "viem/chains";

export const publicClient = createPublicClient({
  chain,
  transport: http(),
});

export const bundlerClient = createBundlerClient({
  client: publicClient,
  transport: http(
    "https://api.pimlico.io/v2/8453/rpc?apikey=pim_XtLsyQnWz9gWf16j1X4PUi",
  ),
});




