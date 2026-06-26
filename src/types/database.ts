import type { AccountCategory, LiabilityType } from "./taxonomy";

export interface Profile {
  id: string;
  display_name: string | null;
  default_currency: string;
  created_at: string;
}

export interface ProviderConnection {
  id: string;
  user_id: string;
  provider: "trading212" | "nest" | "moneybox" | "bank";
  label: string;
  environment: "live" | "demo";
  credentials_ciphertext: string;
  subtype: "isa" | "invest" | "cfd" | "sipp" | null;
  last_synced_at: string | null;
  last_sync_status: "success" | "error" | "pending" | null;
  last_sync_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  category: AccountCategory;
  subtype: string;
  source: "manual" | "trading212" | "nest" | "moneybox" | "bank";
  provider_connection_id: string | null;
  external_id: string | null;
  currency: string;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AccountBalance {
  id: string;
  account_id: string;
  recorded_at: string;
  balance: number;
  source: "manual" | "sync";
}

export interface Holding {
  id: string;
  account_id: string;
  symbol: string;
  name: string;
  isin: string | null;
  quantity: number;
  average_cost: number | null;
  current_price: number | null;
  market_value: number;
  currency: string;
  unrealized_pnl: number | null;
  synced_at: string;
}

export interface Liability {
  id: string;
  user_id: string;
  name: string;
  liability_type: LiabilityType;
  current_balance: number;
  interest_rate: number | null;
  minimum_payment: number | null;
  currency: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NetWorthSnapshot {
  id: string;
  user_id: string;
  snapshot_date: string;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  assets_by_category: Record<string, number>;
  assets_by_subtype: Record<string, number>;
  assets_by_account: Record<string, number>;
  created_at: string;
}

type TableDef<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: TableDef<Profile>;
      provider_connections: TableDef<ProviderConnection>;
      accounts: TableDef<Account>;
      account_balances: TableDef<AccountBalance>;
      holdings: TableDef<Holding>;
      liabilities: TableDef<Liability>;
      net_worth_snapshots: TableDef<NetWorthSnapshot>;
      financial_goals: TableDef<{
        id: string;
        user_id: string;
        name: string;
        target_amount: number;
        current_amount: number;
        target_date: string | null;
        category: string | null;
        created_at: string;
      }>;
      transactions: TableDef<{
        id: string;
        account_id: string;
        external_id: string | null;
        transaction_date: string;
        type: string;
        amount: number;
        currency: string;
        description: string | null;
        created_at: string;
      }>;
      user_financial_profile: TableDef<{
        user_id: string;
        annual_expenses: number | null;
        annual_savings: number | null;
        target_retirement_age: number | null;
        safe_withdrawal_rate: number | null;
        updated_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
