import { trading212Provider } from "./trading212";
import type { FinanceProvider } from "./types";

const providers: Record<string, FinanceProvider> = {
  trading212: trading212Provider,
};

export function getProvider(id: string): FinanceProvider {
  const provider = providers[id];
  if (!provider) {
    throw new Error(`Unknown provider: ${id}`);
  }
  return provider;
}
