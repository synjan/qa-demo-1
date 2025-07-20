# Troubleshooting Guide

Complete guide to resolving common issues with QA Test Manager.

## 🚨 Common Issues

### Installation Problems

#### Node.js Version Issues

**Problem**: Application fails to start with Node.js version errors
```bash
Error: Node.js version 16.x is not supported
```

**Solution**:
1. **Check current version**:
   ```bash
   node --version
   ```

2. **Update Node.js** (choose one method):
   ```bash
   # Method 1: Download from nodejs.org
   # Visit https://nodejs.org and download latest LTS
   
   # Method 2: Using nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   nvm use 18
   
   # Method 3: Using package manager
   # macOS with Homebrew
   brew install node@18
   
   # Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Verify installation**:
   ```bash
   node --version  # Should show 18.x or higher
   npm --version   # Should show 8.x or higher
   ```

#### Dependency Installation Failures

**Problem**: `npm install` fails with permission errors
```bash
Error: EACCES: permission denied, mkdir '/usr/local/lib/node_modules'
```

**Solution**:
```bash
# Option 1: Use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install node

# Option 2: Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Option 3: Use yarn instead
npm install -g yarn
yarn install
```

**Problem**: Package installation fails with network errors
```bash
Error: request failed, reason: connect ECONNREFUSED
```

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Set registry
npm config set registry https://registry.npmjs.org/

# Try with increased timeout
npm install --timeout=60000

# Use different network or VPN if behind corporate firewall
```

### Environment Configuration Issues

#### Environment Variables Not Loading

**Problem**: Environment variables from `.env.local` are not recognized

**Checklist**:
1. **File location**: Ensure `.env.local` is in project root
   ```bash
   ls -la .env.local  # Should exist in project root
   ```

2. **File format**: Check syntax
   ```env
   # Correct format
   NEXTAUTH_SECRET=your-secret-here
   
   # Incorrect format (avoid spaces around =)
   NEXTAUTH_SECRET = your-secret-here
   ```

3. **Variable names**: Ensure correct naming
   ```env
   # Public variables (available to browser)
   NEXT_PUBLIC_APP_NAME=QA Test Manager
   
   # Server-only variables
   NEXTAUTH_SECRET=your-secret
   GITHUB_CLIENT_SECRET=your-secret
   ```

4. **Restart development server** after changes:
   ```bash
   # Stop server (Ctrl+C) and restart
   npm run dev
   ```

#### NextAuth Configuration Issues

**Problem**: `NEXTAUTH_SECRET` or `NEXTAUTH_URL` errors
```bash
Error: Please define a `NEXTAUTH_SECRET` environment variable
```

**Solution**:
1. **Generate secure secret**:
   ```bash
   # Method 1: OpenSSL
   openssl rand -base64 32
   
   # Method 2: Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   
   # Method 3: Online generator
   # Visit: https://generate-secret.vercel.app/32
   ```

2. **Add to `.env.local`**:
   ```env
   NEXTAUTH_SECRET=your-generated-secret-here
   NEXTAUTH_URL=http://localhost:3000
   ```

3. **For production**, update `NEXTAUTH_URL`:
   ```env
   NEXTAUTH_URL=https://your-production-domain.com
   ```

### GitHub Integration Problems

#### OAuth Application Issues

**Problem**: GitHub authentication redirects fail
```bash
Error: redirect_uri_mismatch
```

**Solution**:
1. **Check OAuth app settings** in GitHub:
   - Go to [GitHub Developer Settings](https://github.com/settings/developers)
   - Select your OAuth app
   - Verify settings:

   | Field | Development | Production |
   |-------|------------|------------|
   | Homepage URL | `http://localhost:3000` | `https://your-domain.com` |
   | Callback URL | `http://localhost:3000/api/auth/callback/github` | `https://your-domain.com/api/auth/callback/github` |

2. **Update environment variables**:
   ```env
   GITHUB_CLIENT_ID=your-actual-client-id
   GITHUB_CLIENT_SECRET=your-actual-client-secret
   ```

3. **Clear browser cache** and try again

#### GitHub API Rate Limiting

**Problem**: GitHub API requests fail with rate limit errors
```bash
Error: API rate limit exceeded for user
```

**Solution**:
1. **Add GitHub Personal Access Token**:
   ```env
   GITHUB_TOKEN=ghp_your-personal-access-token
   ```

2. **Create token** with appropriate scopes:
   - Go to [GitHub Settings > Developer Settings > Personal Access Tokens](https://github.com/settings/tokens)
   - Generate new token with scopes:
     - `repo` (for private repositories)
     - `read:user` (for user information)

3. **Monitor usage** and implement caching if needed

#### Repository Access Issues

**Problem**: Cannot access private repositories
```bash
Error: Not Found (repository may be private)
```

**Solution**:
1. **Update OAuth app permissions**:
   - Ensure OAuth app has `repo` scope
   - User must grant access to private repositories

2. **Check organization settings**:
   - Organization may restrict OAuth app access
   - Contact organization admin to whitelist the app

3. **Use Personal Access Token** for enhanced access:
   ```env
   GITHUB_TOKEN=ghp_your-token-with-repo-access
   ```

### File System Issues

#### Permission Errors

**Problem**: Cannot read/write test case files
```bash
Error: EACCES: permission denied, open 'testcases/tc-001.md'
```

**Solution**:
```bash
# Check current permissions
ls -la testcases/ testplans/ results/

# Fix directory permissions
chmod 755 testcases testplans results

# Fix file permissions (if files exist)
chmod 644 testcases/*.md testplans/*.json results/*.json

# For production, use more restrictive permissions
chmod 750 testcases testplans results
chmod 640 testcases/*.md testplans/*.json results/*.json
```

#### Missing Directories

**Problem**: Application cannot find storage directories
```bash
Error: ENOENT: no such file or directory, scandir 'testcases'
```

**Solution**:
```bash
# Create required directories
mkdir -p testcases testplans results

# Verify directory structure
ls -la
# Should show: testcases/ testplans/ results/

# Set proper permissions
chmod 755 testcases testplans results
```

#### File Format Issues

**Problem**: Test cases fail to load with format errors
```bash
Error: Invalid test case format in tc-001.md
```

**Solution**:
1. **Check Markdown frontmatter format**:
   ```markdown
   ---
   title: "Test Case Title"
   description: "Test description"
   priority: "high"
   tags: ["tag1", "tag2"]
   ---
   
   ## Preconditions
   User account exists
   
   ## Test Steps
   1. **Action**: Navigate to login page
      **Expected Result**: Login form appears
   ```

2. **Validate JSON files**:
   ```bash
   # Check if JSON is valid
   cat testplans/tp-001.json | python -m json.tool
   ```

3. **Fix encoding issues**:
   ```bash
   # Ensure UTF-8 encoding
   file testcases/*.md
   # Should show: UTF-8 Unicode text
   ```

### Application Runtime Issues

#### Port Already in Use

**Problem**: Development server cannot start on port 3000
```bash
Error: Port 3000 is already in use
```

**Solution**:
```bash
# Method 1: Find and kill process using port 3000
lsof -i :3000
kill -9 <PID>

# Method 2: Use different port
npm run dev -- -p 3001

# Method 3: Set PORT environment variable
PORT=3001 npm run dev
```

#### Memory Issues

**Problem**: Application runs out of memory
```bash
Error: JavaScript heap out of memory
```

**Solution**:
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run dev

# Or set in package.json scripts
{
  "scripts": {
    "dev": "NODE_OPTIONS='--max-old-space-size=4096' next dev"
  }
}
```

#### Build Failures

**Problem**: `npm run build` fails with TypeScript errors
```bash
Error: Type 'string | undefined' is not assignable to type 'string'
```

**Solution**:
1. **Fix TypeScript errors**:
   ```typescript
   // Before (error)
   const title: string = process.env.TITLE;
   
   // After (fixed)
   const title: string = process.env.TITLE || 'Default Title';
   ```

2. **Check for missing dependencies**:
   ```bash
   npm install
   ```

3. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   npm run build
   ```

### Browser Issues

#### Authentication Cookies

**Problem**: User gets logged out frequently
```bash
Error: Session expired, please log in again
```

**Solution**:
1. **Check cookie settings** in browser:
   - Allow cookies for the domain
   - Check if third-party cookies are blocked

2. **Clear browser data**:
   - Clear cookies and site data
   - Clear browser cache

3. **Check HTTPS settings** for production:
   ```env
   # Ensure secure cookie settings for production
   NEXTAUTH_URL=https://your-domain.com
   ```

#### CORS Issues (Development)

**Problem**: API requests fail with CORS errors
```bash
Error: Cross-Origin Request Blocked
```

**Solution**:
1. **Ensure API calls use relative URLs**:
   ```javascript
   // Correct
   fetch('/api/testcases')
   
   // Avoid
   fetch('http://localhost:3000/api/testcases')
   ```

2. **Check development server configuration**:
   ```javascript
   // next.config.js
   module.exports = {
     async headers() {
       return [
         {
           source: '/api/(.*)',
           headers: [
             {
               key: 'Access-Control-Allow-Origin',
               value: '*',
             },
           ],
         },
       ];
     },
   };
   ```

### OpenAI Integration Issues

#### API Key Problems

**Problem**: AI test generation fails
```bash
Error: Invalid OpenAI API key
```

**Solution**:
1. **Verify API key format**:
   ```env
   # Correct format
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

2. **Check API key status**:
   - Go to [OpenAI Platform](https://platform.openai.com/account/api-keys)
   - Verify key is active and not expired
   - Check usage limits and billing

3. **Test API key**:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer sk-your-api-key"
   ```

#### Rate Limiting

**Problem**: OpenAI requests fail with rate limits
```bash
Error: Rate limit exceeded for requests
```

**Solution**:
1. **Check usage limits** in OpenAI dashboard
2. **Implement exponential backoff**
3. **Consider upgrading** OpenAI plan
4. **Cache results** to reduce API calls

## 🔧 Diagnostic Tools

### Log Analysis

#### Application Logs

```bash
# View development server logs
npm run dev | tee app.log

# Filter error logs
npm run dev 2>&1 | grep -i error

# Watch logs in real-time
tail -f app.log
```

#### Browser Developer Tools

1. **Console Tab**: Check for JavaScript errors
2. **Network Tab**: Monitor API requests and responses
3. **Application Tab**: Check Local Storage and Cookies
4. **Sources Tab**: Debug client-side code

### Health Checks

#### API Health Check

```bash
# Check if API is responding
curl http://localhost:3000/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2023-01-16T12:00:00Z"
}
```

#### File System Check

```bash
# Verify directory structure
tree -L 2
# Should show:
# .
# ├── testcases/
# ├── testplans/
# ├── results/
# └── ...

# Check file permissions
ls -la testcases/ testplans/ results/
```

#### Environment Variables Check

```bash
# Check if variables are loaded (development)
echo $NEXTAUTH_SECRET
echo $GITHUB_CLIENT_ID

# Or check in Node.js
node -e "console.log(process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set')"
```

### Performance Monitoring

#### Memory Usage

```bash
# Monitor Node.js memory usage
node --inspect npm run dev
# Open chrome://inspect in Chrome

# Check system memory
free -h  # Linux
vm_stat  # macOS
```

#### Network Monitoring

```bash
# Monitor network requests
netstat -an | grep 3000

# Check DNS resolution
nslookup github.com
nslookup api.openai.com
```

## 🆘 Getting Help

### Information to Gather

When reporting issues, include:

1. **Environment Information**:
   ```bash
   # Run this command and include output
   cat > debug-info.txt << EOF
   Node.js version: $(node --version)
   npm version: $(npm --version)
   Operating System: $(uname -a)
   Current directory: $(pwd)
   Git branch: $(git branch --show-current)
   Git commit: $(git rev-parse HEAD)
   EOF
   ```

2. **Error Messages**: Full error messages and stack traces
3. **Steps to Reproduce**: Detailed steps that trigger the issue
4. **Expected vs Actual Behavior**: What should happen vs what happens
5. **Screenshots**: For UI-related issues

### Support Channels

1. **GitHub Issues**: [Create new issue](https://github.com/synjan/qa-demo-1/issues/new)
2. **GitHub Discussions**: [Ask questions](https://github.com/synjan/qa-demo-1/discussions)
3. **Documentation**: [Check wiki](https://github.com/synjan/qa-demo-1/wiki)

### Before Creating Issues

1. **Search existing issues**: Your problem might already be reported
2. **Check recent releases**: Issue might be fixed in latest version
3. **Try latest version**: Update and test if issue persists
4. **Minimal reproduction**: Create smallest possible example

### Emergency Procedures

#### Complete Reset

If nothing else works, try a complete reset:

```bash
# 1. Stop all Node.js processes
pkill -f node

# 2. Clear npm cache
npm cache clean --force

# 3. Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# 4. Clear Next.js cache
rm -rf .next

# 5. Reset environment
cp .env.example .env.local
# Edit .env.local with your values

# 6. Restart development server
npm run dev
```

#### Data Recovery

If test data is corrupted:

```bash
# 1. Stop application
pkill -f node

# 2. Backup current data
cp -r testcases testcases.backup
cp -r testplans testplans.backup
cp -r results results.backup

# 3. Check Git history for recent good state
git log --oneline testcases/ testplans/ results/

# 4. Restore from Git if available
git checkout HEAD~1 -- testcases/ testplans/ results/

# 5. Restart application
npm run dev
```

---

If you can't find a solution here, please [create an issue](https://github.com/synjan/qa-demo-1/issues/new) with detailed information about your problem. We're here to help! 🤝