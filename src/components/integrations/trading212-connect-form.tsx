"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProviderConnection } from "@/types/database";
import { format } from "date-fns";

interface Trading212ConnectFormProps {
  connections: Pick<
    ProviderConnection,
    | "id"
    | "label"
    | "environment"
    | "subtype"
    | "last_synced_at"
    | "last_sync_status"
    | "last_sync_error"
  >[];
  envConfigured: boolean;
  envDefaults: {
    label: string;
    environment: "live" | "demo";
    subtype: "isa" | "invest";
  };
}

export function Trading212ConnectForm({
  connections,
  envConfigured,
  envDefaults,
}: Trading212ConnectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [label, setLabel] = useState(envDefaults.label);
  const [environment, setEnvironment] = useState<"live" | "demo">(
    envDefaults.environment
  );
  const [subtype, setSubtype] = useState<"isa" | "invest">(envDefaults.subtype);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: Record<string, string> = { label, environment, subtype };
      if (!envConfigured) {
        payload.apiKey = apiKey;
        payload.apiSecret = apiSecret;
      }

      const res = await fetch("/api/integrations/trading212/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok && res.status !== 207) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Failed to connect"
        );
      }

      if (data.synced) {
        toast.success("Trading 212 connected and synced");
      } else {
        toast.warning("Connected but sync failed", {
          description: data.error,
        });
      }

      setApiKey("");
      setApiSecret("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSync(connectionId: string) {
    setSyncingId(connectionId);
    try {
      const res = await fetch("/api/integrations/trading212/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId }),
      });

      const data = await res.json();
      const result = data.results?.[0];

      if (result?.status === "success") {
        toast.success("Sync complete");
        router.refresh();
      } else {
        throw new Error(result?.error ?? "Sync failed");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setSyncingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border shadow-none">
        <CardHeader>
          <CardTitle>Connect Trading 212</CardTitle>
          <CardDescription>
            {envConfigured
              ? "API credentials are loaded from server environment variables (TRADING212_API_KEY / TRADING212_SECRET_KEY). Keys are never sent to the browser."
              : "API keys are encrypted and stored securely. Only Invest and Stocks ISA accounts are supported by the Trading 212 API."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {envConfigured && (
            <Badge variant="secondary" className="mb-4">
              Environment credentials configured
            </Badge>
          )}
          <form onSubmit={handleConnect} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="t212-label">Account Label</Label>
              <Input
                id="t212-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. My ISA"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="t212-subtype">Account Type</Label>
                <Select value={subtype} onValueChange={(v) => setSubtype(v as "isa" | "invest")}>
                  <SelectTrigger id="t212-subtype">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="isa">Stocks ISA</SelectItem>
                    <SelectItem value="invest">Invest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="t212-env">Environment</Label>
                <Select
                  value={environment}
                  onValueChange={(v) => setEnvironment(v as "live" | "demo")}
                >
                  <SelectTrigger id="t212-env">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="demo">Demo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {!envConfigured && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="t212-key">API Key</Label>
                  <Input
                    id="t212-key"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    required
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="t212-secret">API Secret</Label>
                  <Input
                    id="t212-secret"
                    type="password"
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    required
                    autoComplete="off"
                  />
                </div>
              </>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? "Connecting…" : envConfigured ? "Connect & Sync" : "Connect & Sync"}
            </Button>
          </form>
          <p className="mt-4 text-xs text-muted-foreground">
            Get your API key from Trading 212 app → Settings → API (Beta).
          </p>
        </CardContent>
      </Card>

      {connections.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-medium">Connected Accounts</h2>
          {connections.map((conn) => (
            <Card key={conn.id} className="border shadow-none">
              <CardContent className="flex items-center justify-between gap-4 pt-6">
                <div>
                  <p className="font-medium">{conn.label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs uppercase">
                      {conn.subtype}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {conn.environment}
                    </Badge>
                    {conn.last_sync_status && (
                      <Badge
                        variant={
                          conn.last_sync_status === "success" ? "default" : "destructive"
                        }
                        className="text-xs"
                      >
                        {conn.last_sync_status}
                      </Badge>
                    )}
                  </div>
                  {conn.last_synced_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Last synced {format(new Date(conn.last_synced_at), "d MMM yyyy, HH:mm")}
                    </p>
                  )}
                  {conn.last_sync_error && (
                    <p className="text-xs text-destructive mt-1">{conn.last_sync_error}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSync(conn.id)}
                  disabled={syncingId === conn.id}
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${syncingId === conn.id ? "animate-spin" : ""}`}
                  />
                  Sync
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
