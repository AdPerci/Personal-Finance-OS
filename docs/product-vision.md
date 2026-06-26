# Adam Finance — Product Vision

Adam Finance is a full personal finance OS, not just an investment dashboard.

## Information Architecture

```
Adam Finance
├── Trading212
│   ├── ISA
│   ├── Invest
│   └── CFD (read-only if available)
├── Pensions
│   ├── Trading212 SIPP
│   └── NEST
├── Cash
│   ├── Trading212 Cash ISA
│   ├── Bank accounts
│   └── Emergency fund
├── Property
├── Liabilities
│   ├── Car loan
│   ├── Credit card
│   └── Student loan
└── Analytics
    ├── Net worth
    ├── FIRE date
    ├── Asset allocation
    ├── Monthly progress
    └── Dividend forecast
```

## Phased Roadmap

| Phase | Scope |
|-------|-------|
| **MVP** | Auth, dashboard, manual accounts/liabilities, T212 ISA+Invest sync, snapshots, charts |
| **Phase 2** | Pensions (SIPP, NEST), bank accounts, property UI |
| **Phase 3** | FIRE projection, dividend forecast, monthly progress |
| **Phase 4** | T212 CFD, Moneybox, additional brokers |

## Design Principles

- Minimal, premium, dashboard-first interface
- Mobile-first, desktop-optimised
- Neutral palette with configurable accent colour
- Light and dark mode from day one
- 8px spacing system
- Subtle borders over heavy shadows
- WCAG AA accessibility
