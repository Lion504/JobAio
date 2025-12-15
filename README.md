# 🎯 JobAio

[![Node.js Version](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Python Version](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org/)
[![Bun](https://img.shields.io/badge/Bun-1.1.45-FFDF37.svg)](https://bun.sh/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub Issues](https://img.shields.io/github/issues/Lion504/JobAio.svg)](https://github.com/Lion504/JobAio/issues)
[![GitHub Stars](https://img.shields.io/github/stars/Lion504/JobAio.svg)](https://github.com/Lion504/JobAio/stargazers)

**AI-Powered Job Search Platform** - Discover, analyze, and translate job opportunities with intelligent insights. JobAio combines web scraping, AI analysis, and multi-language support to provide the most comprehensive job search experience.

## 📋 Table of Contents

- [✨ Features](#-features)
- [🏛️ Architecture Overview](#-architecture-overview)
- [🚀 Quick Start](#-quick-start)
- [🤝 Contributing](#-contributing)
  - [🍴 Fork workflow](#fork-workflow-recommended)
  - [🏗️ Project Architecture](#project-architecture)
  - [⚙️ Development Workflow](#development-workflow)
  - [📝 Pull Request Process](#pull-request-process)
- [🛠️ Tech Stack](#️-tech-stack)
- [🐛 Troubleshooting](#-troubleshooting)
- [📄 License](#-license)

## 📊 Screenshots & Demo

![alt text](img\image.png)

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

### 🎨 **Modern Web Experience**

- Responsive React Router frontend with Tailwind CSS
- Dark/light theme support
- Advanced filtering and search capabilities
- Job bookmarking and personalized recommendations

### 🏗️ **Scalable Architecture**

- Monorepo structure with Bun workspaces
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

- **Node.js 18+** (with npm/bun)
- **Python 3.11+**
- **Git**
- **MongoDB** (local or cloud)

### Quick Setup (Recommended)

```bash
# Clone and setup everything automatically
git clone https://github.com/Lion504/JobAio
cd JobAio

# Install all dependencies (handles Python venv automatically)
bun install

# Copy environment configuration
cp .env.example .env

# Configure your API keys and database settings
# Edit .env with your credentials

# Start job scraping pipeline
bun run jobs

# Start all services (frontend + backend)
bun dev

# Open browser
[JobAio(default)](http://localhost:5173)
```

## 🤝 Contributing

JobAio is an open source project and we welcome contributions from everyone! All contributions must go through the fork-and-pull-request workflow.

### Fork workflow (Recommended)

1. **Fork the repository**  
   Click the "Fork" button at the top right of this page to create your own copy.

2. **Clone your fork**

   ```
   git clone https://github.com/YOUR_USERNAME/JobAio.git
   cd JobAio
   ```

3. **Add upstream remote** (to sync with the original repo)

   ```
   git remote add upstream https://github.com/Lion504/JobAio.git
   ```

4. **Create a feature branch**

   ```
   git checkout -b feature/your-feature
   ```

5. **Set up development environment**  
   Follow the Quick Start section above to install dependencies and configure your environment.

6. **Make your changes**

   - Write clean, well-documented code
   - Follow the project's code style

7. **Commit your changes**  
   Use conventional commits (see Commit Conventions below)
8. **Push to your fork**

   ```
   git push origin feature/your-feature
   ```

9. **Open a Pull Request**
   - Go to your fork on GitHub
   - Click "Compare & pull request"
   - Fill out the PR template with a clear title and description
   - Link any related issues

### Project Architecture

#### Project Structure

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

#### API Documentation

**Job Endpoints**

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

## Pull Request Process

**Note**: All PRs require approval before merging.

1. Update documentation for any new features
2. Add tests for new functionality
3. Ensure all tests pass
4. Update CHANGELOG.md if needed
5. Submit PR with detailed description

## 🔄 Keeping Your Fork Updated

If you're working on a long-term feature, sync your fork regularly:

```
# Fetch changes from upstream
git fetch upstream

# Switch to your main branch
git checkout main

# Merge upstream changes
git merge upstream/main

# Push updates to your fork
git push origin main
```

## ⏱️ Review Timeline

- PRs are typically reviewed within 2-3 days
- Complex features may take longer
- Feel free to ping @Lion504 if your PR hasn't been reviewed after a week

### Development Workflow

Once your development environment is set up, use these commands during development:

#### Starting Development Services

```bash
# Start all services (frontend + backend)
bun dev

# Start specific services
bun dev:web       # Frontend only
bun dev:api       # Backend only

# Run job scraping pipeline
bun run jobs
```

#### Testing

```bash
# Run all tests
bun test

# Run specific test suites
bun test:ai       # AI package tests
bun test:py       # Python scraper tests
```

#### Code Quality

```bash
# Linting
bun lint          # Check all packages
bun lint:web      # Frontend only
bun lint:api      # Backend only

# Auto-fix linting issues
bun lint:fix

# Code formatting
bun format        # Format all code
bun format:check  # Check formatting only
```

#### Building & Deployment

```bash
# Clean all node_modules and build artifacts
bun clean
```

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

- **Bun** workspaces for monorepo
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
