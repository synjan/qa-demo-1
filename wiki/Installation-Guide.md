# Installation Guide

Complete step-by-step guide to install and set up QA Test Manager.

## 📋 Prerequisites

Before installing QA Test Manager, ensure you have:

### Required Software
- **Node.js** (version 18.0 or higher)
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify installation: `node --version`
- **npm** or **yarn** package manager
  - npm comes with Node.js
  - Verify installation: `npm --version`
- **Git** for version control
  - Download from [git-scm.com](https://git-scm.com/)
  - Verify installation: `git --version`

### Required Accounts
- **GitHub Account** (for OAuth authentication)
  - Sign up at [github.com](https://github.com)
  - Required for authentication and issue integration
- **OpenAI Account** (optional, for AI test generation)
  - Sign up at [platform.openai.com](https://platform.openai.com/)
  - Create an API key for test case generation

## 🚀 Installation Steps

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/synjan/qa-demo-1.git

# Navigate to the project directory
cd qa-demo-1

# Verify the files
ls -la
```

### 2. Install Dependencies

```bash
# Install all required packages
npm install

# Or if you prefer yarn
yarn install
```

This will install all dependencies including:
- Next.js framework
- shadcn/ui components
- Tailwind CSS
- NextAuth.js
- GitHub integration libraries
- OpenAI SDK

### 3. Environment Configuration

#### Copy Environment Template
```bash
cp .env.example .env.local
```

#### Configure Environment Variables

Edit `.env.local` with your preferred text editor:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-very-secure-secret-key-here

# GitHub OAuth Application
GITHUB_CLIENT_ID=your-github-oauth-app-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-app-client-secret

# OpenAI API (Optional - for AI test case generation)
OPENAI_API_KEY=your-openai-api-key

# GitHub Personal Access Token (Optional - for enhanced GitHub features)
GITHUB_TOKEN=your-github-personal-access-token

# Optional Customization
NEXT_PUBLIC_APP_NAME="QA Test Manager"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. GitHub OAuth Application Setup

#### Create OAuth Application

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the application details:
   
   | Field | Value |
   |-------|-------|
   | Application name | `QA Test Manager` |
   | Homepage URL | `http://localhost:3000` |
   | Application description | `Manual test case management platform` |
   | Authorization callback URL | `http://localhost:3000/api/auth/callback/github` |

4. Click **"Register application"**
5. Copy the **Client ID** and **Client Secret**
6. Add them to your `.env.local` file

#### OAuth Permissions

The application requests these GitHub permissions:
- **read:user** - Access basic user information
- **user:email** - Access user email addresses
- **repo** - Access repository information (if using private repos)

### 5. Generate NextAuth Secret

Generate a secure secret for NextAuth:

```bash
# Method 1: Using OpenSSL
openssl rand -base64 32

# Method 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Method 3: Online generator
# Visit: https://generate-secret.vercel.app/32
```

Copy the generated secret to your `.env.local` file as `NEXTAUTH_SECRET`.

### 6. OpenAI API Setup (Optional)

If you want AI-powered test case generation:

1. Sign up at [OpenAI Platform](https://platform.openai.com/)
2. Navigate to [API Keys](https://platform.openai.com/account/api-keys)
3. Click **"Create new secret key"**
4. Copy the API key to your `.env.local` file
5. Note: API usage will incur charges based on OpenAI pricing

### 7. Create Data Directories

QA Test Manager uses file-based storage:

```bash
# Create storage directories
mkdir -p testcases testplans results

# Verify directory structure
ls -la
```

Your project should now have:
```
qa-demo-1/
├── testcases/    # Test case storage (Markdown files)
├── testplans/    # Test plan storage (JSON files)
├── results/      # Test result storage (JSON files)
└── ...
```

### 8. Start the Development Server

```bash
# Start the development server
npm run dev

# Or with yarn
yarn dev
```

The application will start on [http://localhost:3000](http://localhost:3000).

### 9. Verify Installation

1. **Open your browser** and navigate to `http://localhost:3000`
2. **Check the homepage** loads correctly
3. **Test authentication** by clicking "Sign In"
4. **Verify GitHub OAuth** redirects to GitHub and back
5. **Check data directories** are accessible

## 🔧 Configuration Options

### Database Configuration (Future)

Currently uses file-based storage. Database support planned for:
- PostgreSQL
- MySQL
- SQLite
- MongoDB

### Environment Variables Reference

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `NEXTAUTH_URL` | Yes | Application URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Yes | NextAuth secret key | - |
| `GITHUB_CLIENT_ID` | Yes | GitHub OAuth Client ID | - |
| `GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth Client Secret | - |
| `OPENAI_API_KEY` | No | OpenAI API key for AI features | - |
| `GITHUB_TOKEN` | No | GitHub Personal Access Token | - |
| `NEXT_PUBLIC_APP_NAME` | No | Application display name | `QA Test Manager` |
| `NEXT_PUBLIC_APP_URL` | No | Public application URL | - |

### File Permissions

Ensure the application has read/write permissions:

```bash
# Set directory permissions (Unix/Linux/macOS)
chmod 755 testcases testplans results

# For production, consider more restrictive permissions
chmod 750 testcases testplans results
```

## 🚨 Troubleshooting

### Common Installation Issues

#### Node.js Version Issues
```bash
# Check Node.js version
node --version

# Should be 18.0 or higher
# Update Node.js if needed
```

#### Permission Errors
```bash
# Fix npm permission issues (Unix/Linux/macOS)
sudo npm install -g npm@latest

# Or use a Node version manager like nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

#### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process (replace PID)
kill -9 <PID>

# Or use a different port
npm run dev -- -p 3001
```

#### GitHub OAuth Issues
- Verify callback URL matches exactly
- Check Client ID and Secret are correct
- Ensure OAuth app is not suspended
- Verify environment variables are loaded

#### Environment Variable Issues
```bash
# Check if environment variables are loaded
npm run dev
# Look for startup messages about missing variables

# Verify .env.local exists and has correct format
cat .env.local
```

### Getting Help

If you encounter issues:

1. **Check the [Troubleshooting Guide](Troubleshooting)**
2. **Search existing [GitHub Issues](https://github.com/synjan/qa-demo-1/issues)**
3. **Create a new issue** with:
   - Operating system and version
   - Node.js version
   - Error messages
   - Steps to reproduce

## ✅ Installation Checklist

- [ ] Node.js 18+ installed
- [ ] Git installed and configured
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Environment file created (`.env.local`)
- [ ] GitHub OAuth app created and configured
- [ ] NextAuth secret generated
- [ ] OpenAI API key added (optional)
- [ ] Data directories created
- [ ] Development server starts successfully
- [ ] Application loads in browser
- [ ] GitHub authentication works

## 🎯 Next Steps

After successful installation:

1. **[Read the User Manual](User-Manual)** - Learn how to use all features
2. **[Follow the Quick Start Tutorial](Quick-Start-Tutorial)** - Create your first test case
3. **[Configure GitHub Integration](GitHub-Integration)** - Set up issue browsing
4. **[Explore the Dashboard](Dashboard-Analytics)** - Understand the analytics

## 🔄 Updating

To update QA Test Manager:

```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm install

# Restart development server
npm run dev
```

---

**Congratulations!** You've successfully installed QA Test Manager. 🎉