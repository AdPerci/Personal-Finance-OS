"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LIABILITY_TYPES, getLiabilityLabel } from "@/types/taxonomy";

export function LiabilityForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [liabilityType, setLiabilityType] = useState("");
  const [balance, setBalance] = useState("");
  const [interestRate, setInterestRate] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/liabilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          liability_type: liabilityType,
          current_balance: parseFloat(balance) || 0,
          interest_rate: interestRate ? parseFloat(interestRate) : undefined,
          currency: "GBP",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "Failed to create liability");
      }

      toast.success("Liability added");
      setOpen(false);
      setName("");
      setLiabilityType("");
      setBalance("");
      setInterestRate("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create liability");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Liability</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Liability</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="liability-name">Name</Label>
            <Input
              id="liability-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Car Loan"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="liability-type">Type</Label>
            <Select value={liabilityType} onValueChange={setLiabilityType} required>
              <SelectTrigger id="liability-type">
                <SelectValue placeholder="Select liability type" />
              </SelectTrigger>
              <SelectContent>
                {LIABILITY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {getLiabilityLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="liability-balance">Current Balance</Label>
              <Input
                id="liability-balance"
                type="number"
                min="0"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="liability-rate">Interest Rate (%)</Label>
              <Input
                id="liability-rate"
                type="number"
                min="0"
                step="0.01"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adding…" : "Add Liability"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
