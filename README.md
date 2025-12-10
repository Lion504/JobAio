# 🎯 JobAio

[![Node.js Version](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Python Version](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9.15.3-orange.svg)](https://pnpm.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub Issues](https://img.shields.io/github/issues/Lion504/JobAio.svg)](https://github.com/Lion504/JobAio/issues)
[![GitHub Stars](https://img.shields.io/github/stars/Lion504/JobAio.svg)](https://github.com/Lion504/JobAio/stargazers)

**AI-Powered Job Search Platform** - Discover, analyze, and translate job opportunities with intelligent insights. JobAio combines web scraping, AI analysis, and multi-language support to provide the most comprehensive job search experience.

## 📊 Screenshots & Demo

![alt text](image.png)

## ✨ Features

### 🔍 **Smart Job Discovery**

- Automated scraping from multiple Finnish job sites (Duunitori, Jobly)
- Intelligent deduplication and categorization

### 🤖 **AI-Powered Analysis**

- Job description analysis with details extraction
- Industry classification and salary insights
- Multiple AI providers (Google Gemini, OpenAI, Cerebras, Ollama)
- Hybrid analysis engine combining multiple AI models

### 🌍 **Multi-Language Support**

- Automatic translation to multiple languages
- Finnish job postings translated worldwide
- i18n-ready web interface with React i18next

### 🎨 **Modern Web Experience**

- Responsive React Router frontend with Tailwind CSS
- Dark/light theme support
- Advanced filtering and search capabilities
- Job bookmarking and personalized recommendations

### 🏗️ **Scalable Architecture**

- Monorepo structure with pnpm workspaces
- Microservices architecture (Web + API + Scraper)
- MongoDB for flexible data storage
- RESTful API with comprehensive endpoints

## 🏛️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web App       │    │   API Service   │    │  Python Scraper │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (Scrapy)      │
│                 │    │                 │    │                 │
│ • Job Search UI │    │ • REST API      │    │ • Job Scraping  │
│ • Filtering     │    │ • AI Processing │    │ • Deduplication │
│ • Bookmarks     │    │ • Translation   │    │ • Data Cleaning │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   MongoDB       │
                    │   Database      │
                    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

**Modern Development Environment:**

- **Node.js 18+** (with npm/pnpm)
- **Python 3.11+**
- **Git**
- **MongoDB** (local or cloud)

### Quick Setup (Recommended)

```bash
# Clone and setup everything automatically
git clone https://github.com/Lion504/JobAio
cd JobAio

# Install all dependencies (handles Python venv automatically)
pnpm install

# Copy environment configuration
cp .env.example .env

# Configure your API keys and database settings
# Edit .env with your credentials

# Start development
pnpm dev
```

## 🛠️ Development Workflow

### Starting Development Services

```bash
# Start services
pnpm dev:web      # React frontend only
pnpm dev:api      # Node.js API only

# Run job scraping pipeline
pnpm jobs
```

### Testing

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test:ai      # AI package tests
pnpm test:py      # Python scraper tests
```

### Code Quality

```bash
# Linting
pnpm lint         # Check all packages
pnpm lint:web     # Frontend only
pnpm lint:api     # API only

# Auto-fix linting issues
pnpm lint:fix

# Code formatting
pnpm format       # Format all code
pnpm format:check # Check formatting only
```

### Building & Deployment

```bash
# Clean all node_modules and build artifacts
pnpm clean
```

## 📁 Project Structure

```
JobAio/
├── apps/                          # Applications
│   ├── web/                       # React Router frontend
│   ├── api/                       # Node.js API service
│   └── scraper-py/                # Python scraping service
├── packages/                      # Shared packages
│   ├── ai/                        # AI/ML processing
│   ├── db/                        # Database models & client
│   ├── search/                    # Search algorithms
│   └── shared/                    # Common utilities
├── tests/                         # Integration tests
└── [config files]                 # Monorepo configuration
```

## 📡 API Documentation

### Job Endpoints

```bash
# Get jobs
GET /api/jobs

# Get jobs with search and filters
GET /api/jobs?q=searchTerm&filters={"location":"helsinki"}&lang=fi&ai=true

# Get job by ID with optional translation
GET /api/jobs/:id?lang=fi

# Fast autocomplete suggestions
GET /api/jobs/suggestions?q=searchTerm&limit=10&lang=fi

```

## 🤝 Contributing

We welcome contributions!

### Development Setup

1. **Clone the repository**
2. **Create a feature branch:** `git checkout -b feature/your-feature`
3. **Set up development environment** (see Quick Start above)
4. **Make your changes**
5. **Code Quality:** Run `pnpm lint:fix && pnpm format` before committing
6. **Testing:** Run `pnpm test` to ensure everything works
7. **PR write in standard way** (clear title, description, link issues)

### Pull Request Process

1. Update documentation for any new features
2. Add tests for new functionality
3. Ensure all tests pass
4. Update CHANGELOG.md if needed
5. Submit PR with detailed description

### Commit Conventions

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation updates
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

## 🛠️ Tech Stack

### Frontend

- **React 19** with React Router 7
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React i18next** for internationalization
- **Radix UI** for accessible components

### Backend & API

- **Node.js 20+** with Express.js
- **MongoDB** with Mongoose ODM

### AI & ML

- **Google Gemini** (Primary AI provider)
- **OpenAI GPT** (Alternative AI provider)
- **Cerebras** (High-performance inference)
- **Ollama** (Local AI models)

### Scraping & Data

- **Python 3.11+** for scraping
- **BeautifulSoup4** for HTML parsing
- **Requests** for HTTP calls

### DevOps & Tools

- **pnpm** workspaces for monorepo
- **Docker** for containerization
- **Jest** for testing
- **ESLint + Prettier** for code quality
- **GitHub Actions** CI/CD

### Database & Search

- **MongoDB** for document storage

## 🐛 Troubleshooting

### Common Issues

**Python Virtual Environment Issues:**

```bash
# Recreate venv if corrupted
cd apps/scraper-py
rm -rf venv
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

**MongoDB Connection Issues:**

- Ensure MongoDB is running locally or connection string is correct
- Check network connectivity for cloud databases

**AI API Key Issues:**

- Verify API keys are set in `.env`
- Check API quotas and billing status
- Test with different AI providers

**Port Conflicts:**

- Default ports: Web (5173), API (5001), MongoDB (27017)
- Change ports in `.env` if needed

### Getting Help

- Check [Instruction.md](./Instruction.md) for detailed guides (currently not visible)
- Open an issue on GitHub
- Join our Discord community (coming soon)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for job seekers worldwide**

[🌟 Star us on GitHub](https://github.com/Lion504/JobAio) • [📖 Documentation](./Instruction.md) • [🐛 Report Issues](https://github.com/Lion504/JobAio/issues)
