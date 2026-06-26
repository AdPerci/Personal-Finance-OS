export const ACCOUNT_CATEGORIES = [
  "trading212",
  "pensions",
  "cash",
  "property",
  "other",
] as const;

export type AccountCategory = (typeof ACCOUNT_CATEGORIES)[number];

export const ACCOUNT_SUBTYPES: Record<AccountCategory, readonly string[]> = {
  trading212: ["isa", "invest", "cfd"],
  pensions: ["sipp", "nest"],
  cash: ["cash_isa", "bank", "emergency_fund"],
  property: ["property"],
  other: ["other"],
};

export const LIABILITY_TYPES = [
  "car_loan",
  "credit_card",
  "student_loan",
  "mortgage",
  "other",
] as const;

export type LiabilityType = (typeof LIABILITY_TYPES)[number];

const CATEGORY_LABELS: Record<AccountCategory, string> = {
  trading212: "Trading 212",
  pensions: "Pensions",
  cash: "Cash",
  property: "Property",
  other: "Other",
};

const SUBTYPE_LABELS: Record<string, string> = {
  isa: "ISA",
  invest: "Invest",
  cfd: "CFD",
  sipp: "SIPP",
  nest: "NEST",
  cash_isa: "Cash ISA",
  bank: "Bank Account",
  emergency_fund: "Emergency Fund",
  property: "Property",
  other: "Other",
};

const LIABILITY_LABELS: Record<LiabilityType, string> = {
  car_loan: "Car Loan",
  credit_card: "Credit Card",
  student_loan: "Student Loan",
  mortgage: "Mortgage",
  other: "Other",
};

export function getCategoryLabel(category: AccountCategory): string {
  return CATEGORY_LABELS[category];
}

export function getSubtypeLabel(subtype: string): string {
  return SUBTYPE_LABELS[subtype] ?? subtype;
}

export function getLiabilityLabel(type: LiabilityType): string {
  return LIABILITY_LABELS[type];
}

export function isValidSubtype(
  category: AccountCategory,
  subtype: string
): boolean {
  return (ACCOUNT_SUBTYPES[category] as readonly string[]).includes(subtype);
}

export const MANUAL_ACCOUNT_OPTIONS = ACCOUNT_CATEGORIES.flatMap((category) =>
  ACCOUNT_SUBTYPES[category].map((subtype) => ({
    category,
    subtype,
    label: `${getCategoryLabel(category)} — ${getSubtypeLabel(subtype)}`,
  }))
);
