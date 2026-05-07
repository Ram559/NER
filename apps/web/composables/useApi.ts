export function useApiBase() {
  const config = useRuntimeConfig();
  return process.server ? config.apiInternalBase : config.public.apiBase;
}

import type { ComputedRef, Ref } from "vue";

type ApiPath = string | Ref<string> | ComputedRef<string> | (() => string);

export function useApiFetch<T>(path: ApiPath, options = {}) {
  return useFetch<T>(path as string, {
    baseURL: useApiBase(),
    ...options
  });
}

export async function apiFetch<T>(path: string, options = {}) {
  const config = useRuntimeConfig();
  const baseURL = process.server ? config.apiInternalBase : config.public.apiBase;
  return $fetch<T>(path, { baseURL, ...options });
}
