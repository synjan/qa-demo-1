#!/bin/bash

# GitHub Wiki Setup Script for QA Test Manager
# This script will populate the GitHub Wiki with comprehensive documentation

echo "🚀 Setting up GitHub Wiki for QA Test Manager..."

# Check if wiki directory exists (user must initialize wiki first)
if [ ! -d "qa-demo-1.wiki" ]; then
    echo "📝 Cloning GitHub Wiki repository..."
    git clone https://github.com/synjan/qa-demo-1.wiki.git
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to clone wiki repository."
        echo "💡 Please initialize the wiki first by:"
        echo "   1. Go to https://github.com/synjan/qa-demo-1/wiki"
        echo "   2. Click 'Create the first page'"
        echo "   3. Create a basic Home page"
        echo "   4. Then run this script again"
        exit 1
    fi
fi

cd qa-demo-1.wiki

echo "📚 Copying wiki documentation files..."

# Copy all wiki files from the main repository
cp ../wiki/*.md .

# Create wiki sidebar for navigation
echo "🔗 Creating wiki navigation sidebar..."
cat > _Sidebar.md << 'EOF'
## 📚 Documentation
* [🏠 Home](Home)
* [📖 Installation Guide](Installation-Guide)
* [📘 User Manual](User-Manual)
* [✨ Features](Features)

## 🛠️ Development
* [🔧 API Reference](API-Reference)
* [🤝 Contributing](Contributing)
* [🚨 Troubleshooting](Troubleshooting)

## 🔗 Quick Links
* [📄 GitHub Pages](https://synjan.github.io/qa-demo-1/)
* [🏠 Main Repository](https://github.com/synjan/qa-demo-1)
* [🚀 Latest Release](https://github.com/synjan/qa-demo-1/releases/latest)

## 🎯 Quick Start
* [Installation Guide](Installation-Guide)
* [User Manual](User-Manual)
* [API Reference](API-Reference)
EOF

# Create wiki footer with additional links
echo "🦶 Creating wiki footer..."
cat > _Footer.md << 'EOF'
---
📖 **[GitHub Pages Documentation](https://synjan.github.io/qa-demo-1/)** | 🏠 **[Main Repository](https://github.com/synjan/qa-demo-1)** | 🚀 **[Latest Release](https://github.com/synjan/qa-demo-1/releases/latest)**

*QA Test Manager - Making manual testing efficient and enjoyable!* 🎉
EOF

echo "📝 Committing wiki content..."

# Configure git user if not set
git config user.name "QA Test Manager Bot" 2>/dev/null || true
git config user.email "noreply@github.com" 2>/dev/null || true

# Add all wiki files
git add *.md

# Commit the changes
git commit -m "📚 Add comprehensive documentation wiki

- Complete installation guide with troubleshooting
- Detailed user manual with all features
- API reference with examples
- Contributing guidelines for developers
- Troubleshooting guide for common issues
- Navigation sidebar and footer

🎉 Generated with QA Test Manager Wiki Setup Script"

# Push to GitHub
echo "⬆️  Pushing wiki content to GitHub..."
git push origin master

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Wiki setup completed successfully!"
    echo ""
    echo "🔗 Your wiki is now available at:"
    echo "   https://github.com/synjan/qa-demo-1/wiki"
    echo ""
    echo "📚 Documentation includes:"
    echo "   • Home page with project overview"
    echo "   • Installation guide with troubleshooting"
    echo "   • Complete user manual"
    echo "   • Features overview"
    echo "   • API reference with examples"
    echo "   • Contributing guidelines"
    echo "   • Troubleshooting guide"
    echo ""
    echo "🎉 Your documentation is now live!"
else
    echo "❌ Failed to push wiki content to GitHub"
    echo "💡 Please check your git credentials and try again"
    exit 1
fi

# Return to main directory
cd ..

echo ""
echo "🚀 Next steps:"
echo "   1. Visit https://synjan.github.io/qa-demo-1/ (GitHub Pages)"
echo "   2. Check https://github.com/synjan/qa-demo-1/wiki (Wiki)"
echo "   3. Review the latest release at https://github.com/synjan/qa-demo-1/releases/latest"
echo ""
echo "📞 Need help? Check the troubleshooting guide or create an issue!"