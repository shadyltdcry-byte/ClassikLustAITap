// DECISIVE COMPONENT SANITY CHECK - Uses runtime import patterns
// Matches exact GameGUI import statements to eliminate false failures

(function(){
  console.log('🚀 [BOOT-FIXER] Starting decisive component resolution test...');
  
  const results = { successes: [], failures: [], fixes: [] };
  
  // Test components using EXACT import paths from GameGUI.tsx
  const criticalImports = [
    { name: 'CharacterDisplay', path: './CharacterDisplay', style: 'default' },
    { name: 'CharacterGallery', path: './CharacterGallery', style: 'default' },
    { name: 'PlayerStatsPanel', path: './game/PlayerStatsPanel', style: 'named' },
    { name: 'GameTabsPanel', path: './game/GameTabsPanel', style: 'named' },
    { name: 'GameProgressPanel', path: './game/GameProgressPanel', style: 'named' },
    { name: 'TasksPanel', path: './game/TasksPanel', style: 'named' },
    { name: 'AchievementsPanel', path: './game/AchievementsPanel', style: 'named' },
    { name: 'FloatingActionIcons', path: './ui/FloatingActionIcons', style: 'default' }
  ];
  
  async function testComponent(comp) {
    try {
      // Convert relative path to absolute for dynamic import
      let importPath;
      if (comp.path.startsWith('./')) {
        importPath = `/client/src/components/${comp.path.slice(2)}`;
      } else {
        importPath = comp.path;
      }
      
      console.log(`Testing ${comp.name} from ${importPath}...`);
      
      const mod = await import(importPath);
      const component = comp.style === 'default' ? mod?.default : mod?.[comp.name];
      const actualType = typeof component;
      
      if (actualType === 'function') {
        results.successes.push({ name: comp.name, path: comp.path });
        console.log(`✅ ${comp.name}: OK`);
      } else {
        const suggestion = comp.style === 'default' 
          ? `Try: import { ${comp.name} } from "${comp.path}";`
          : `Try: import ${comp.name} from "${comp.path}";`;
          
        results.failures.push({
          name: comp.name,
          path: comp.path,
          expected: 'function',
          actual: actualType,
          suggestion
        });
        
        results.fixes.push({
          name: comp.name,
          currentImport: comp.style === 'default' 
            ? `import ${comp.name} from "${comp.path}";`
            : `import { ${comp.name} } from "${comp.path}";`,
          correctImport: suggestion
        });
        
        console.log(`❌ ${comp.name}: Expected function, got ${actualType}`);
      }
      
    } catch (error) {
      results.failures.push({
        name: comp.name,
        path: comp.path,
        expected: 'function',
        actual: 'error',
        suggestion: `Import failed: ${error.message || error}`
      });
      console.log(`🚨 ${comp.name}: Import error - ${error.message || error}`);
    }
  }
  
  // Test all components
  Promise.all(criticalImports.map(testComponent))
    .then(() => {
      // Store results globally
      (window as any).__BOOT_PROBE__ = {
        ts: Date.now(),
        successes: results.successes,
        failures: results.failures,
        autoRepairSuggestions: results.fixes
      };
      
      console.log(`🎉 [BOOT-FIXER] Complete: ${results.successes.length} OK, ${results.failures.length} failed`);
      
      // If any failures, show decisive overlay with fixes
      if (results.failures.length > 0) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.95);color:#00ff88;font-family:ui-monospace;font-size:12px;z-index:999999;padding:20px;overflow:auto;';
        
        let html = '<div style="text-align:center;font-size:18px;margin-bottom:20px;color:#ff6b6b;">🚨 BOOT BLOCKED - DECISIVE FIXES READY</div>';
        
        if (results.successes.length > 0) {
          html += `<div style="color:#00dd44;margin-bottom:16px;">✅ ${results.successes.length} components working</div>`;
        }
        
        html += `<div style="color:#ff4444;margin-bottom:16px;">❌ ${results.failures.length} components blocked</div>`;
        
        results.failures.forEach(f => {
          html += `<div style="margin:12px 0;padding:12px;border:1px solid #ff6b6b;border-radius:8px;background:#220011;">`;
          html += `<div style="font-weight:bold;color:#ff8888;">🔧 ${f.name}</div>`;
          html += `<div style="color:#aaa;margin:4px 0;font-size:10px;">Path: ${f.path}</div>`;
          html += `<div style="color:#ffaa00;margin:4px 0;">Issue: ${f.suggestion}</div>`;
          html += `</div>`;
        });
        
        if (results.fixes.length > 0) {
          html += '<div style="margin:20px 0;padding:16px;background:#001122;border:2px solid #0066cc;border-radius:8px;">';
          html += '<div style="color:#00dd88;font-weight:bold;margin-bottom:12px;">AUTO-REPAIR READY 🚀</div>';
          
          results.fixes.forEach(fix => {
            html += `<div style="margin:8px 0;padding:8px;background:#002211;border-radius:4px;">`;
            html += `<div style="color:#00dd88;font-weight:bold;">${fix.name}</div>`;
            html += `<div style="color:#ff8888;font-size:10px;margin:2px 0;">Replace: ${fix.currentImport}</div>`;
            html += `<div style="color:#88ff88;font-size:10px;">With: ${fix.correctImport}</div>`;
            html += `</div>`;
          });
          
          html += '<button onclick="window.__applyBootFixes()" style="margin-top:12px;padding:12px 24px;background:#0066cc;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold;font-size:14px;">🚀 APPLY ALL FIXES NOW</button>';
          html += '</div>';
        }
        
        html += '<div style="margin-top:20px;text-align:center;"><button onclick="window.location.reload()" style="padding:8px 16px;background:#444;color:white;border:1px solid #666;border-radius:4px;cursor:pointer;margin:0 8px;">🔄 Reload</button></div>';
        
        overlay.innerHTML = html;
        document.body.appendChild(overlay);
        
        // Wire auto-apply function
        (window as any).__applyBootFixes = async () => {
          const progressDiv = document.createElement('div');
          progressDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#001122;color:#00ff88;border:2px solid #0066cc;padding:20px;border-radius:8px;z-index:9999999;text-align:center;';
          progressDiv.innerHTML = '<div style="font-size:16px;margin-bottom:10px;">🚀 APPLYING FIXES</div><div id="fix-progress">Starting...</div>';
          document.body.appendChild(progressDiv);
          
          const updateProgress = (msg) => {
            const el = document.getElementById('fix-progress');
            if (el) el.textContent = msg;
          };
          
          try {
            updateProgress('Applying component fixes...');
            
            const response = await fetch('/auto-repair/apply-fixes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fixes: results.fixes })
            });
            
            if (response.ok) {
              updateProgress('✅ Fixes applied! Reloading...');
              setTimeout(() => window.location.reload(), 1500);
            } else {
              updateProgress('❌ Auto-repair API failed. Manual fix needed.');
            }
          } catch (error) {
            updateProgress(`❌ Error: ${error.message}`);
          }
        };
      } else {
        // All components working!
        console.log('🎉 [BOOT-FIXER] All components resolved successfully!');
        const successDiv = document.createElement('div');
        successDiv.style.cssText = 'position:fixed;top:20px;right:20px;background:#001122;color:#00ff88;border:2px solid #00aa55;padding:16px;border-radius:8px;z-index:999999;';
        successDiv.innerHTML = '<div style="font-weight:bold;">✅ BOOT SUCCESS</div><div style="font-size:12px;margin-top:4px;">All components resolved</div>';
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
          if (document.body.contains(successDiv)) {
            document.body.removeChild(successDiv);
          }
        }, 3000);
      }
    })
    .catch(error => {
      console.error('🚨 [BOOT-FIXER] Fatal error:', error);
    });
})();
