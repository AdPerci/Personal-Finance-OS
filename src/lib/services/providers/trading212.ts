import type {
  FinanceProvider,
  ProviderConnectionContext,
  SyncResult,
  Trading212Credentials,
} from "./types";

const BASE_URLS = {
  live: "https://live.trading212.com/api/v0",
  demo: "https://demo.trading212.com/api/v0",
};

interface T212AccountSummary {
  id: number;
  currency: string;
  totalValue: number;
  cash: {
    availableToTrade: number;
    reservedForOrders: number;
    inPies: number;
  };
  investments: {
    currentValue: number;
    unrealizedProfitLoss: number;
  };
}

interface T212Position {
  instrument: {
    ticker: string;
    name: string;
    isin: string;
    currency: string;
  };
  quantity: number;
  averagePricePaid: number;
  currentPrice: number;
  walletImpact: {
    currentValue: number;
    unrealizedProfitLoss: number;
    currency: string;
  };
}

function getAuthHeader(credentials: Trading212Credentials): string {
  const encoded = Buffer.from(
    `${credentials.apiKey}:${credentials.apiSecret}`
  ).toString("base64");
  return `Basic ${encoded}`;
}

async function t212Fetch<T>(
  baseUrl: string,
  path: string,
  credentials: Trading212Credentials
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      Authorization: getAuthHeader(credentials),
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Trading 212 API error (${response.status}): ${text}`);
  }

  return response.json() as Promise<T>;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const trading212Provider: FinanceProvider = {
  id: "trading212",

  async sync(
    credentials: Trading212Credentials,
    context: ProviderConnectionContext
  ): Promise<SyncResult> {
    const baseUrl = BASE_URLS[context.environment];

    const summary = await t212Fetch<T212AccountSummary>(
      baseUrl,
      "/equity/account/summary",
      credentials
    );

    await delay(1100);

    const positions = await t212Fetch<T212Position[]>(
      baseUrl,
      "/equity/positions",
      credentials
    );

    const cashBalance =
      summary.cash.availableToTrade +
      summary.cash.reservedForOrders +
      summary.cash.inPies;

    const subtypeLabel =
      context.subtype === "isa"
        ? "ISA"
        : context.subtype === "invest"
          ? "Invest"
          : context.subtype.toUpperCase();

    return {
      account: {
        externalId: String(summary.id),
        name: `Trading 212 ${subtypeLabel} — ${context.label}`,
        currency: summary.currency,
        cashBalance,
        investmentValue: summary.investments.currentValue,
        totalValue: summary.totalValue,
      },
      holdings: positions.map((pos) => ({
        symbol: pos.instrument.ticker,
        name: pos.instrument.name,
        isin: pos.instrument.isin ?? null,
        quantity: pos.quantity,
        averageCost: pos.averagePricePaid,
        currentPrice: pos.currentPrice,
        marketValue: pos.walletImpact.currentValue,
        currency: pos.walletImpact.currency,
        unrealizedPnl: pos.walletImpact.unrealizedProfitLoss,
      })),
    };
  },
};

export async function validateTrading212Credentials(
  credentials: Trading212Credentials,
  environment: "live" | "demo"
): Promise<boolean> {
  const baseUrl = BASE_URLS[environment];
  await t212Fetch(baseUrl, "/equity/account/summary", credentials);
  return true;
}
