# JobAio

A comprehensive job search platform.

## Quick Start

### Prerequisites

**Required Software:**
- **Node.js 20+** (LTS recommended)
- **pnpm** (monorepo package manager)
- **Git** (version control)
- **Python 3.11+** (for scraping)

### Installation guide

**Windows:**
```powershell
# Node.js via Chocolatey

choco install nodejs-lts

# pnpm
npm install -g pnpm

# Python (if not installed)
winget install Python.Python.3.11
```

**macOS:**
```bash
# Node.js via Homebrew
brew install node

# pnpm
npm install -g pnpm

# Python (if not installed)
brew install python
```

**Linux (Ubuntu/Debian):**
```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpm
npm install -g pnpm

# Python (usually pre-installed)
sudo apt install python3 python3-pip
```

### Project Setup

```bash
git clone https://github.com/Lion504/JobAio
```
```bash
cd JobAio

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local

# Start development
pnpm dev
```

## Project Structure

```
JobAio/
├── apps/
│   ├── web/                    # Next.js frontend
│   ├── api/                    # Node.js API service
│   └── scraper-py/             # Python scraping service
├── packages/
│   ├── db/                     # Database schema & client
│   ├── shared/                 # Shared types & utilities
│   ├── ai/                     # AI processing & translation
│   └── search/                 # Search logic & adapters
├── .github/workflows/          # CI/CD pipelines
└── [config files]              # Monorepo configuration
```

## Development command

```bash
# Install dependencies
pnpm install

# Start all services
pnpm dev

# Run linting
pnpm lint

# Run type checking
pnpm typecheck

# Run tests
pnpm test

# Build all packages
pnpm build
```

## Environment Setup

Copy `.env.example` to `.env.local` and configure:

- **Database**: 
- **AI Services**: 

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Ensure tests pass: `pnpm test`
4. Submit a pull request

See [Instruction.md](./Instruction.md) for detailed development guidelines.

## Tech Stack

- **Frontend**:
- **Backend**:
- **Database**:
- **AI/ML**:
- **Scraping**: 
- **Monorepo**: pnpm workspaces, Turborepo
- **Deployment**: Docker, cloud platforms

## License

[Add your license here]
