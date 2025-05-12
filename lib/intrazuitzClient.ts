/**
 * Client for checking if a service is part of the Zuitzerland network
 */
export class IntrazuitzClient {
  private readonly baseUrl: string;
  private readonly timeout: number;

  /**
   * Creates a new IntrazuitzClient
   * @param baseUrl - The base URL to connect to (defaults to INTRAZUITZ_URL)
   * @param timeout - Timeout in milliseconds (defaults to 3000ms)
   */
  constructor(baseUrl: string, timeout: number = 3000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Checks if a service is part of the Zuitzerland network
   * @returns Promise<boolean> - True if the service is part of Zuitzerland
   */
  async isZuitzerland(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(this.baseUrl, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 200) {
        const data = await response.json();
        return data && data.zuitzerland === true;
      }

      return false;
    } catch (error) {
      console.error("Error checking Zuitzerland status:", error);
      return false;
    }
  }
}
