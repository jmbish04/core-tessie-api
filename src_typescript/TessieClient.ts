/**
 * Central Tessie API client for making authenticated HTTP requests.
 *
 * This module provides the core TessieClient class that handles all HTTP
 * communication with the Tessie API, including authentication, request
 * serialization, and error handling.
 *
 * @module TessieClient
 */

/**
 * Configuration options for the Tessie API client.
 * @interface TessieClientConfig
 */
export interface TessieClientConfig {
  /** Tessie API key for authentication */
  apiKey: string;
  /** Base URL for the Tessie API (defaults to https://api.tessie.com) */
  baseUrl?: string;
}

/**
 * Central client for interacting with the Tessie API.
 *
 * This class manages authentication and HTTP communication with the Tessie API.
 * It provides a private request method used by all module functions to make
 * authenticated API calls with proper header injection and parameter serialization.
 *
 * @class TessieClient
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const state = await getState(client, { vin: 'YOUR_VIN' });
 * ```
 */
export class TessieClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  /**
   * Creates a new TessieClient instance.
   *
   * @param {TessieClientConfig} config - Configuration object containing API key and optional base URL
   * @throws {Error} If apiKey is not provided
   */
  constructor(config: TessieClientConfig) {
    if (!config.apiKey) {
      throw new Error("API key is required");
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://api.tessie.com";
  }

  /**
   * Makes an authenticated HTTP request to the Tessie API.
   *
   * This private method handles:
   * - Path parameter substitution (e.g., {vin} in URL paths)
   * - Query parameter serialization
   * - Authorization header injection
   * - Request body serialization for POST requests
   * - Error handling and response parsing
   *
   * @param {string} method - HTTP method (GET or POST)
   * @param {string} path - API endpoint path (may contain path parameters like {vin})
   * @param {Record<string, any>} params - Parameters object containing path, query, and body parameters
   * @returns {Promise<any>} Parsed JSON response from the API
   * @throws {Error} If the API request fails or returns an error status
   *
   * @private
   */
  async request(
    method: string,
    path: string,
    params: Record<string, any> = {}
  ): Promise<any> {
    // Substitute path parameters (e.g., {vin} -> actual VIN value)
    let url = path;
    const pathParams: Record<string, any> = {};
    const queryParams: Record<string, any> = {};
    const bodyParams: Record<string, any> = {};

    // Identify path parameters by looking for {param} patterns in the path
    const pathParamMatches = path.match(/\{([^}]+)\}/g);
    const pathParamNames = pathParamMatches
      ? pathParamMatches.map((match) => match.slice(1, -1))
      : [];

    // Separate parameters into path, query, and body categories
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;

      if (pathParamNames.includes(key)) {
        pathParams[key] = value;
      } else if (method === "POST" && ["drives", "tag"].includes(key)) {
        // Special handling for POST request body parameters
        bodyParams[key] = value;
      } else {
        queryParams[key] = value;
      }
    }

    // Replace path parameters in URL
    for (const [key, value] of Object.entries(pathParams)) {
      url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
    }

    // Build query string from query parameters
    const queryString = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      queryString.append(key, String(value));
    }

    // Construct full URL with base URL and query string
    const fullUrl = `${this.baseUrl}${url}${
      queryString.toString() ? `?${queryString.toString()}` : ""
    }`;

    // Prepare request options
    const options: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    };

    // Add body for POST requests
    if (method === "POST" && Object.keys(bodyParams).length > 0) {
      options.body = JSON.stringify(bodyParams);
    }

    // Execute the request
    const response = await fetch(fullUrl, options);

    // Handle error responses
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Tessie API request failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    // Parse and return JSON response
    // Some endpoints may return empty responses
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    } else {
      const text = await response.text();
      return text || null;
    }
  }

  /**
   * Gets the configured API key.
   *
   * @returns {string} The API key
   * @internal
   */
  getApiKey(): string {
    return this.apiKey;
  }

  /**
   * Gets the configured base URL.
   *
   * @returns {string} The base URL
   * @internal
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}
