/**
 * Fetch with timeout and retry logic
 */

export async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

export async function fetchWithRetry(url, options = {}, retries = 3, timeout = 10000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchWithTimeout(url, options, timeout);
    } catch (error) {
      if (i === retries - 1) throw error;
      
      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, i), 5000);
      console.log(`Retry ${i + 1}/${retries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
