
import { useEffect } from 'react';

export function useGameDebugger() {
  useEffect(() => {
    // Initialize debugger if needed
    if (typeof window !== 'undefined' && !(window as any).debuggerCore) {
      console.log('[GameDebugger] Initializing...');
    }
  }, []);
}

// Re-export GameDebugger component from the correct location
export { default as GameDebugger } from '@/components/debug/GameDebugger';

export default useGameDebugger;
