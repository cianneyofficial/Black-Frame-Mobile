---
name: Admin/public contract checks
description: Durable testing guidance for products with an admin surface and a public surface sharing browser data.
---

When an admin and public site share browser storage, matching keys and status filters are not enough: the public surface must also use the same currency, thresholds, date, and link formatting rules.

**Why:** A shared record can appear synchronized while still showing incorrect prices or business labels to customers.

**How to apply:** Test the full record lifecycle (available, edited, sold), the shared configuration values, cross-tab refresh behavior, and the customer-facing rendering—not only TypeScript or HTTP responses.