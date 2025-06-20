import { createPublicClient, createWalletClient, custom, http } from "viem";
import { createBundlerClient, createPaymasterClient, paymasterActions } from "viem/account-abstraction";
import { baseSepolia as chain } from "viem/chains";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { createConfig } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { QueryClient } from "@tanstack/react-query";

const pimlicoURL =
  "https://api.pimlico.io/v2/84532/rpc?apikey=pim_XtLsyQnWz9gWf16j1X4PUi";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export const publicClient = createPublicClient({
  chain,
  transport: http(),
});

export const bundlerClient = createBundlerClient({
  client: publicClient,
  transport: http(pimlicoURL),
});

export const pimilicoClient = createPimlicoClient({
  transport: http(pimlicoURL),
}).extend(paymasterActions);

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
});

export const localWalletClient = createWalletClient({
  chain,
  transport: custom(window.ethereum!),
});

export const paymasterClient = createPaymasterClient({
  transport: http(pimlicoURL)
})
