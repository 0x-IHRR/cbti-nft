/**
 * Fetch wrapper with timeout and retry support.
 *
 * - Timeout: 10 seconds per request
 * - Retries: up to 2 retries (3 total attempts)
 */
export default async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: { timeout?: number; retries?: number }
): Promise<Response> {
  const timeout = options?.timeout ?? 10000;
  const maxRetries = options?.retries ?? 2;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      lastError =
        err instanceof Error ? err : new Error("Network request failed");

      // Don't retry if it's not a network/timeout error
      if (
        lastError.name !== "AbortError" &&
        lastError.message !== "Network request failed" &&
        !lastError.message.includes("fetch")
      ) {
        throw lastError;
      }

      // Wait before retrying (exponential backoff: 500ms, 1000ms)
      if (attempt < maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, 500 * (attempt + 1))
        );
      }
    }
  }

  throw lastError ?? new Error("Network request failed after retries");
}
