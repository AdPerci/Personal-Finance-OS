import { decryptCredentials } from "@/lib/crypto";
import type { Trading212Credentials } from "./providers/types";

export const ENV_CREDENTIAL_SENTINEL = "__ENV_CREDENTIALS__";

export function hasTrading212EnvCredentials(): boolean {
  return Boolean(
    process.env.TRADING212_API_KEY && process.env.TRADING212_SECRET_KEY
  );
}

export function getTrading212EnvCredentials(): Trading212Credentials | null {
  const apiKey = process.env.TRADING212_API_KEY;
  const apiSecret = process.env.TRADING212_SECRET_KEY;

  if (!apiKey || !apiSecret) {
    return null;
  }

  return { apiKey, apiSecret };
}

export function getTrading212EnvDefaults() {
  return {
    environment: (process.env.TRADING212_ENVIRONMENT === "demo"
      ? "demo"
      : "live") as "live" | "demo",
    subtype: (process.env.TRADING212_SUBTYPE === "invest" ? "invest" : "isa") as
      | "isa"
      | "invest",
    label: process.env.TRADING212_LABEL ?? "Trading 212",
  };
}

export function usesEnvCredentials(connection: {
  credentials_ciphertext: string;
}): boolean {
  return connection.credentials_ciphertext === ENV_CREDENTIAL_SENTINEL;
}

export function resolveTrading212Credentials(connection: {
  credentials_ciphertext: string;
}): Trading212Credentials {
  if (usesEnvCredentials(connection)) {
    const envCreds = getTrading212EnvCredentials();
    if (!envCreds) {
      throw new Error(
        "TRADING212_API_KEY and TRADING212_SECRET_KEY must be set in environment"
      );
    }
    return envCreds;
  }

  return decryptCredentials<Trading212Credentials>(
    connection.credentials_ciphertext
  );
}
