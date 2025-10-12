import { useEffect } from 'react';

export function useGameDebugger() {
  useEffect(() => {
    // Initialize debugger if needed
    if (typeof window !== 'undefined' && !(window as any).debuggerCore) {
      console.log('[GameDebugger] Initializing...');
    }
  }, []);
}

export default useGameDebugger;