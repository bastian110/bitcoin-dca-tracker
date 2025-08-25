# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Bitcoin DCA (Dollar Cost Averaging) tracker - a privacy-first, open-source web application that allows users to track their Bitcoin purchase performance after moving funds to cold storage. The app processes CSV purchase history and optionally uses xpub/addresses to show portfolio metrics without requiring private keys.

## Architecture

The project is designed as a **Next.js application** with the following key principles:

- **Privacy-first**: All calculations happen client-side, no sensitive data stored on servers
- **Read-only operations**: Never requests private keys or seeds, only public data (xpub/addresses)
- **Serverless deployment**: Designed for Vercel deployment with minimal server-side processing

### Core Components (Planned)

- **CSV Parser**: Client-side parsing of Bitcoin purchase history using papaparse
- **Blockchain Integration**: Fetches balance data via public APIs (Mempool.space/Blockstream)
- **Price APIs**: Real-time and historical Bitcoin prices via CoinGecko
- **Performance Calculator**: Computes average cost basis (PMA), unrealized P&L, and portfolio metrics
- **Data Visualization**: Charts showing portfolio performance over time

### Tech Stack

- **Framework**: Next.js with App Router
- **Project Manager**: bun
- **Deploiment**: Serverless on Vercel
- **Styling**: Tailwind CSS (potentially with shadcn/ui components)
- **CSV Processing**: papaparse library for client-side parsing
- **Validation**: zod for input and CSV validation
- **Charts**: Chart.js or Recharts for data visualization
- **APIs**: CoinGecko (prices), Mempool.space/Blockstream (blockchain data)

## Development Approach

Since this is a new project with only a README.md currently present:

1. **Security Focus**: Always prioritize privacy and security - never handle private keys
2. **Client-side First**: Keep sensitive operations in the browser 
3. **Progressive Enhancement**: Start with core CSV upload and basic calculations, then add blockchain integration
4. **Always Think simply**: Always use the simplest sufficient approach, don't overegineer solutions

## Key Features to Implement

- CSV upload form with validation
- Bitcoin purchase history parsing and analysis
- Optional xpub/address input for live balance tracking
- Portfolio performance metrics (cost basis, P&L, current value)
- Simple dashboard with tables and charts
- Privacy disclaimers and security best practices in UI

## Security Requirements

- Enforce HTTPS-only with proper CSP headers
- Never log or store xpub/address data on servers
- Include clear UI disclaimers about read-only nature
- No third-party tracking or analytics scripts
- Make code open-source and build process transparent