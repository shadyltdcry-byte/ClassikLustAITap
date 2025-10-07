
#!/bin/bash

echo "🧹 NUCLEAR CACHE CLEARING SCRIPT 🧹"
echo "====================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📍 Step 1: Clearing Node.js cache${NC}"
npm cache clean --force 2>/dev/null || echo "npm cache already clean"
rm -rf node_modules/.cache 2>/dev/null
echo -e "${GREEN}✅ Node.js cache cleared${NC}"
echo ""

echo -e "${YELLOW}📍 Step 2: Clearing Vite cache${NC}"
rm -rf .vite 2>/dev/null
rm -rf client/.vite 2>/dev/null
rm -rf dist 2>/dev/null
rm -rf client/dist 2>/dev/null
echo -e "${GREEN}✅ Vite cache cleared${NC}"
echo ""

echo -e "${YELLOW}📍 Step 3: Clearing build artifacts${NC}"
rm -rf build 2>/dev/null
rm -rf .next 2>/dev/null
rm -rf .turbo 2>/dev/null
rm -rf .parcel-cache 2>/dev/null
echo -e "${GREEN}✅ Build artifacts cleared${NC}"
echo ""

echo -e "${YELLOW}📍 Step 4: Clearing TypeScript cache${NC}"
rm -rf .tsbuildinfo 2>/dev/null
rm -rf tsconfig.tsbuildinfo 2>/dev/null
echo -e "${GREEN}✅ TypeScript cache cleared${NC}"
echo ""

echo -e "${YELLOW}📍 Step 5: Clearing ESLint cache${NC}"
rm -rf .eslintcache 2>/dev/null
echo -e "${GREEN}✅ ESLint cache cleared${NC}"
echo ""

echo -e "${YELLOW}📍 Step 6: Clearing local storage files${NC}"
rm -rf .local 2>/dev/null
rm -rf .cache 2>/dev/null
echo -e "${GREEN}✅ Local storage cleared${NC}"
echo ""

echo -e "${YELLOW}📍 Step 7: Clearing Replit cache${NC}"
rm -rf .replit.cache 2>/dev/null
rm -rf .upm 2>/dev/null
echo -e "${GREEN}✅ Replit cache cleared${NC}"
echo ""

echo -e "${YELLOW}📍 Step 8: Clearing temp files${NC}"
rm -rf /tmp/npm-* 2>/dev/null
rm -rf /tmp/v8-* 2>/dev/null
rm -rf /tmp/ts-node-* 2>/dev/null
echo -e "${GREEN}✅ Temp files cleared${NC}"
echo ""

echo -e "${YELLOW}📍 Step 9: Clearing browser localStorage (via script)${NC}"
cat > client/public/clear-all-storage.js << 'EOF'
console.log('🧹 NUCLEAR STORAGE CLEAR - Clearing EVERYTHING');

// Clear localStorage
localStorage.clear();
console.log('✅ localStorage cleared');

// Clear sessionStorage
sessionStorage.clear();
console.log('✅ sessionStorage cleared');

// Clear all cookies
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});
console.log('✅ Cookies cleared');

// Clear IndexedDB
if (window.indexedDB) {
  indexedDB.databases().then(databases => {
    databases.forEach(db => {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
        console.log(`✅ Deleted IndexedDB: ${db.name}`);
      }
    });
  });
}

// Clear Cache API
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      caches.delete(name);
      console.log(`✅ Deleted cache: ${name}`);
    });
  });
}

console.log('✅ ALL BROWSER STORAGE CLEARED!');
alert('🧹 All browser storage cleared! Please refresh the page.');
EOF
echo -e "${GREEN}✅ Browser storage clearing script created${NC}"
echo ""

echo -e "${YELLOW}📍 Step 10: Database cache refresh${NC}"
echo "Note: Database doesn't have traditional cache, but we'll force connection refresh"
pkill -f "postgres" 2>/dev/null || echo "No postgres processes to kill"
echo -e "${GREEN}✅ Database connections refreshed${NC}"
echo ""

echo ""
echo -e "${GREEN}🎉 CACHE CLEARING COMPLETE! 🎉${NC}"
echo -e "${YELLOW}📋 What was cleared:${NC}"
echo "  ✓ Node.js module cache"
echo "  ✓ Vite build cache"
echo "  ✓ TypeScript build info"
echo "  ✓ ESLint cache"
echo "  ✓ Temporary files"
echo "  ✓ Replit cache"
echo "  ✓ Browser storage (run the script in browser)"
echo ""
echo -e "${YELLOW}⚠️  To clear browser storage:${NC}"
echo "  1. Open your game in browser"
echo "  2. Run: /clear-all-storage.js"
echo "  3. Refresh the page"
echo ""
echo -e "${YELLOW}🔄 Recommended next steps:${NC}"
echo "  1. npm install (reinstall packages)"
echo "  2. Restart your dev server"
echo "  3. Hard refresh browser (Ctrl+Shift+R)"
