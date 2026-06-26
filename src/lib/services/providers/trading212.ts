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

/** account/summary: 1 req / 5s — wait at least this long before the next call */
const SUMMARY_COOLDOWN_MS = 5500;

/** positions: 1 req / 1s */
const POSITIONS_COOLDOWN_MS = 1100;

const MAX_RETRIES = 3;

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

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelayMs(response: Response, attempt: number): number {
  const resetHeader = response.headers.get("x-ratelimit-reset");
  if (resetHeader) {
    const resetAt = Number(resetHeader) * 1000;
    const wait = resetAt - Date.now() + 500;
    if (wait > 0) return Math.min(wait, 60_000);
  }
  // Exponential backoff: 5s, 10s, 20s
  return Math.min(5000 * 2 ** attempt, 30_000);
}

export function formatTrading212Error(status: number, body: string): string {
  if (status === 429) {
    return "Trading 212 rate limit reached. Wait a minute and try Sync again.";
  }
  if (status === 401 || status === 403) {
    return "Trading 212 credentials rejected. Check your API key and secret.";
  }
  return `Trading 212 API error (${status}): ${body}`;
}

async function t212Fetch<T>(
  baseUrl: string,
  path: string,
  credentials: Trading212Credentials
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: {
        Authorization: getAuthHeader(credentials),
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (response.ok) {
      return response.json() as Promise<T>;
    }

    const text = await response.text();

    if (response.status === 429 && attempt < MAX_RETRIES) {
      const waitMs = getRetryDelayMs(response, attempt);
      await delay(waitMs);
      continue;
    }

    lastError = new Error(formatTrading212Error(response.status, text));
    break;
  }

  throw lastError ?? new Error("Trading 212 API request failed");
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

    await delay(SUMMARY_COOLDOWN_MS);

    const positions = await t212Fetch<T212Position[]>(
      baseUrl,
      "/equity/positions",
      credentials
    );

    await delay(POSITIONS_COOLDOWN_MS);

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

/** Validates credentials via account/summary — prefer sync() alone to avoid duplicate calls */
export async function validateTrading212Credentials(
  credentials: Trading212Credentials,
  environment: "live" | "demo"
): Promise<boolean> {
  const baseUrl = BASE_URLS[environment];
  await t212Fetch(baseUrl, "/equity/account/summary", credentials);
  return true;
}
