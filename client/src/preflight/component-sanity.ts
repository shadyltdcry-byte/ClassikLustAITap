// Preflight component sanity check that runs before React mounts
// Writes results to window.__BOOT_PROBE__ and optionally renders an overlay if failures are found.

(function(){
  try {
    const failures = [] as Array<{name:string; path:string; expected:string; actual:string; suggestion:string}>;

    // Utility to push failure with consistent suggestion text
    function fail(name:string, path:string, expected:string, actual:string, suggestion:string){
      failures.push({name, path, expected, actual, suggestion});
    }

    // NOTE: These imports will be resolved by the bundler at build time.
    // Try/catch around each to avoid hard crashes.
    function check(name:string, path:string, kind:'default'|'named'){
      try{
        // dynamic import is async; we use require-style via globalThis.__webpack_require__ or fallback to window for vite.
        // For broad compatibility, rely on eval import which bundlers rewrite.
        // eslint-disable-next-line no-new-func
        const importer = new Function('p', 'return import(p)');
        return importer(path).then((mod:any)=>{
          const value = kind === 'default' ? mod?.default : mod?.[name];
          const actual = typeof value;
          if(actual !== 'function' && actual !== 'object'){ // forwardRef returns function, bad case often 'object'
            fail(name, path, 'function', actual, `Verify export. If file has export default ${name}, import default. If it has export { ${name} }, use named import.`);
          }
          if(actual === 'object'){
            fail(name, path, 'function', 'object', `Flip import style: try import { ${name} } from '${path}' or import ${name} from '${path}'.`);
          }
        }).catch((e:any)=>{
          fail(name, path, 'function', 'error', `Import failed: ${e?.message || e}`);
        });
      }catch(e:any){
        fail(name, path, 'function', 'error', `Import init failed: ${e?.message || e}`);
        return Promise.resolve();
      }
    }

    const checks: Array<Promise<any>> = [];
    // High-priority components used on first paint
    checks.push(check('PlayerStatsPanel', '/client/src/components/game/PlayerStatsPanel.tsx', 'named'));
    checks.push(check('GameTabsPanel', '/client/src/components/game/GameTabsPanel.tsx', 'named'));
    checks.push(check('CharacterGallery', '/client/src/components/CharacterGallery.tsx', 'default'));
    checks.push(check('CharacterDisplay', '/client/src/components/CharacterDisplay.tsx', 'default'));
    checks.push(check('GameProgressPanel', '/client/src/components/game/GameProgressPanel.tsx', 'named'));
    checks.push(check('TasksPanel', '/client/src/components/game/TasksPanel.tsx', 'default'));
    checks.push(check('AchievementsPanel', '/client/src/components/game/AchievementsPanel.tsx', 'default'));
    checks.push(check('FloatingActionIcons', '/client/src/components/ui/FloatingActionIcons.tsx', 'default'));

    Promise.all(checks).then(()=>{
      (window as any).__BOOT_PROBE__ = { ts: Date.now(), failures };
      if(failures.length){
        // Render ultra-light overlay so it shows even if React fails
        const el = document.createElement('div');
        el.style.cssText = 'position:fixed;top:0;right:0;z-index:999999;background:#1a0000;color:#ffd7d7;border:2px solid #ff4d4f;padding:12px;max-width:90vw;max-height:90vh;overflow:auto;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;';
        el.innerHTML = '<div style="font-weight:bold;color:#fff;margin-bottom:8px">Boot Probe Failures</div>' +
          failures.map(f=>`<div style="margin:6px 0;border-bottom:1px dashed #ff6b6b;padding-bottom:6px"><div>❌ <b>${f.name}</b></div><div>Path: ${f.path}</div><div>Expected: ${f.expected}, Actual: ${f.actual}</div><div style="color:#ffe08a">💡 ${f.suggestion}</div></div>`).join('');
        document.body.appendChild(el);
        console.error('[BOOT_PROBE] Failures detected:', failures);
      }else{
        console.log('[BOOT_PROBE] All core components OK');
      }
    });
  } catch(e){
    console.error('[BOOT_PROBE] Fatal preflight error', e);
  }
})();
