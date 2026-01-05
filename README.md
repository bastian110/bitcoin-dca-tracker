# Bitcoin DCA Tracker

A privacy-first, open-source web application for tracking Bitcoin Dollar-Cost Averaging (DCA) performance. Upload your purchase history and monitor your investment metrics without sharing sensitive data.

## Features

- **CSV Upload & Parsing** – Import your Bitcoin purchase history directly in the browser
- **Performance Metrics** – Track average cost basis, unrealized P&L, and portfolio value
- **Real-time Pricing** – Fetch current and historical Bitcoin prices via CoinGecko
- **Portfolio Analytics** – Visualize performance with interactive charts and detailed breakdowns
- **Portfolio Comparison** – Compare your portfolio performance across different time periods
- **Data Export** – Export your analysis results in multiple formats
- **Multi-currency Support** – View metrics in your preferred currency
- **Time-based Filtering** – Analyze performance across different time ranges
- **100% Client-side** – All calculations happen in your browser, nothing is stored on servers
- **Read-only Blockchain Lookup** (Optional) – View live balances using public xpub/addresses without ever sharing private keys

## Security & Privacy

This application is built with privacy as a core principle:

- ✅ **No Private Key Storage** – We never ask for or handle private keys or seeds
- ✅ **Client-side Processing** – All Bitcoin purchase analysis happens locally in your browser
- ✅ **No Server Storage** – Your data never reaches our servers
- ✅ **Read-only Blockchain Access** – Only public data (xpub/addresses) used for balance verification
- ✅ **Open Source** – Full source code available for security auditing
- ✅ **No Tracking** – No analytics, no cookies, no third-party scripts

**Important:** This tool is designed for viewing and analysis only. It cannot perform transactions or access any private keys. Always validate data from public sources independently, especially for large holdings.

## Getting Started

### Requirements

- Node.js 18+ or Bun runtime
- Modern web browser with JavaScript enabled

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/bitcoin-dca-tracker.git
   cd bitcoin-dca-tracker
   ```

2. **Install dependencies:**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Run the development server:**
   ```bash
   bun dev
   # or
   npm run dev
   ```

4. **Open in your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
bun run build
bun start
```

## How to Use

### 1. Upload Your Purchase History

1. Prepare a CSV file with your Bitcoin purchases. Required columns:
   - `Date` – Purchase date (format: YYYY-MM-DD)
   - `Amount` – Bitcoin amount purchased
   - `Price` – Price paid per Bitcoin

2. Click **"Upload CSV"** on the landing page and select your file
3. The app will validate and process your data immediately in the browser

### 2. View Your Portfolio

Once imported, you'll see:
- **Cost Basis** – Total amount spent and average cost per Bitcoin
- **Current Value** – Portfolio value at current Bitcoin price
- **Unrealized P&L** – Profit/loss based on current market prices
- **Historical Performance** – Charts showing portfolio value over time

### 3. Filter by Time Period

Use the time filter controls to analyze performance over specific periods:
- All time
- Year-to-date
- Last 30/90/180 days
- Custom date ranges

### 4. Change Currency Display

Click the currency settings to view metrics in different fiat currencies (USD, EUR, GBP, etc.)

### 5. Export Your Data

Use the export feature to download your analysis in CSV or JSON format for further analysis.

### 6. Optional: Monitor Live Balance (Coming Soon)

To track live portfolio balance using a public blockchain API:
1. Get your public **xpub** or **address** from your hardware wallet
2. Enter it in the "Blockchain Monitor" section
3. The app will fetch and display your current Bitcoin balance

**Note:** Only read from public blockchain APIs; your private keys are never shared.

## Data Clearing

Your data is stored locally in your browser's storage. To clear all stored data:
- Use the **"Clear All Data"** button in the app settings
- Or clear your browser's local storage manually

## Technology Stack

- **Framework:** [Next.js 15](https://nextjs.org/) with React 19
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **CSV Parsing:** [Papa Parse](https://www.papaparse.com/)
- **Data Visualization:** [Recharts](https://recharts.org/)
- **Validation:** [Zod](https://zod.dev/)
- **Icons:** [Lucide React](https://lucide.dev/)

## Development

For detailed development guidelines including architecture, branching strategy, and contribution guidelines, see [CLAUDE.md](./CLAUDE.md).

### Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
├── lib/             # Utilities and helpers
│   ├── types.ts          # TypeScript type definitions
│   ├── csv-parser.ts     # CSV parsing logic
│   ├── portfolio-calculator.ts  # Performance metrics
│   ├── bitcoin-price.ts  # Price fetching utilities
│   ├── currency.ts       # Currency conversion
│   └── storage.ts        # Local storage management
└── ...
```

### Key Scripts

- `bun dev` – Start development server with Turbopack
- `bun build` – Build for production
- `bun start` – Start production server
- `bun lint` – Run ESLint

## Deployment

The app is optimized for deployment on [Vercel](https://vercel.com):

```bash
vercel deploy
```

It also works on any platform that supports Node.js (Next.js requires Node.js 18+).

## Roadmap

- [ ] Blockchain balance monitoring with xpub/address integration
- [ ] Support for multiple cryptocurrencies
- [ ] Advanced portfolio allocation analysis
- [ ] Performance benchmarking against market indices
- [ ] Mobile app version

## Contributing

Contributions are welcome! Please:

1. Create a new branch for your feature: `git checkout -b feature/your-feature`
2. Make your changes following the existing code style
3. Test thoroughly
4. Submit a pull request with a clear description

See [CLAUDE.md](./CLAUDE.md) for detailed development guidelines.

## License

This project is open-source and available under the [MIT License](./LICENSE).

## Support

- **Found a bug?** [Open an issue](https://github.com/yourusername/bitcoin-dca-tracker/issues)
- **Have a question?** Check existing issues or start a discussion
- **Security concern?** Please report responsibly to [security contact info]

## Disclaimer

This tool is provided "as-is" for portfolio analysis only. While we prioritize security and privacy:

- Always use HTTPS when accessing this application
- Validate all data against multiple sources before making investment decisions
- Consider having your investment strategy reviewed by a financial professional
- This tool cannot perform transactions; it's for viewing and analysis only

**Not Financial Advice:** This application is a personal finance tracking tool. It does not constitute financial advice, investment recommendations, or endorsements.
