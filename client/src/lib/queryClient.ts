import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Request deduplication cache to prevent API spam
const requestCache = new Map<string, Promise<any>>();

// Deduplicated fetch function
export async function deDupeFetch(url: string, options?: RequestInit): Promise<Response> {
  const cacheKey = `${url}-${JSON.stringify(options || {})}`;
  
  // Return existing promise if request is already in flight
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey)!;
  }
  
  // Create new request and cache the promise
  const requestPromise = fetch(url, options).finally(() => {
    // Remove from cache when request completes
    requestCache.delete(cacheKey);
  });
  
  requestCache.set(cacheKey, requestPromise);
  return requestPromise;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const startTime = Date.now();
  
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    
    // Track API call performance
    const responseTime = Date.now() - startTime;
    console.log(`🌐 API: ${method} ${url} → ${res.status} (${responseTime}ms)`);
    
    return res;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ API: ${method} ${url} → ERROR (${responseTime}ms)`, error);
    throw error; // Re-throw to maintain existing behavior
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const startTime = Date.now();
    const url = queryKey.join("/") as string;
    
    try {
      const res = await fetch(url, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      
      // Track query performance
      const responseTime = Date.now() - startTime;
      console.log(`📊 Query: ${url} → ${res.status} (${responseTime}ms)`);
      
      return await res.json();
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`❌ Query: ${url} → ERROR (${responseTime}ms)`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minute cache
      retry: false,
      refetchOnMount: false, // Prevent duplicate calls on component mount
      refetchOnReconnect: false, // Prevent calls on network reconnect
    },
    mutations: {
      retry: false,
    },
  },
});
