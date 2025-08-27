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
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
