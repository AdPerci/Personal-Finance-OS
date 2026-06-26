export interface Trading212Credentials {
  apiKey: string;
  apiSecret: string;
}

export interface SyncedHolding {
  symbol: string;
  name: string;
  isin: string | null;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  currency: string;
  unrealizedPnl: number;
}

export interface SyncResult {
  account: {
    externalId: string;
    name: string;
    currency: string;
    cashBalance: number;
    investmentValue: number;
    totalValue: number;
  };
  holdings: SyncedHolding[];
}

export interface ProviderConnectionContext {
  environment: "live" | "demo";
  subtype: "isa" | "invest" | "cfd" | "sipp";
  label: string;
}

export interface FinanceProvider {
  readonly id: string;
  sync(
    credentials: Trading212Credentials,
    context: ProviderConnectionContext
  ): Promise<SyncResult>;
}
