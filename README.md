🎯 Project Objective

A privacy-first, open-source web app to let users track the performance of their Bitcoin DCA purchases after moving funds to a cold wallet.
Users upload their purchase history (CSV) + optionally provide a watch-only wallet (xpub/address) → the app shows portfolio value in fiat, average cost basis, and unrealized P&L.

⸻

🔹 Core Features (MVP)
	•	CSV upload: parse user’s BTC purchases (date, amount, fiat).
	•	xpub/address input: fetch live on-chain balance from public API.
	•	Fiat valuation: real-time BTC price (EUR/USD).
	•	Performance metrics: total invested, average cost basis (PMA), current value, unrealized P&L (% and absolute).
	•	Simple UI: upload form + results (table + chart).
	•	Privacy-first: no keys, no custody, calculations client-side.

⸻

🔹 Minimal Tech Stack
	•	Framework: Next.js (React, App Router) → deploy serverless on Vercel.
	•	Styling: Tailwind CSS (or shadcn/ui).
	•	CSV parsing: papaparse (client-side).
	•	Validation: zod (inputs, CSV).
	•	Charts: Chart.js / Recharts.
	•	APIs:
	•	CoinGecko (BTC spot + historical price).
	•	Mempool.space / Blockstream (xpub/address balance).

⸻

🔹 Best Practices (Security & Privacy)
	•	Read-only only: never request seeds/private keys.
	•	Local-first: keep CSV + calculations in browser, not on server.
	•	Minimal API proxying: only for prices and blockchain data, without logging xpub.
	•	HTTPS + CSP: enforce secure headers, HTTPS-only.
	•	Open-source transparency: code and build verifiable on GitHub.
	•	No trackers/ads: zero third-party scripts by default.
	•	UI disclaimer: clear banner “Read-only, we never ask for private keys.”
	•	Auto-hosting option: allow users to self-host for maximum trust