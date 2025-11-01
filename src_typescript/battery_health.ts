/**
 * Battery health module for the Tessie API.
 *
 * This module contains all functions related to battery health and degradation
 * monitoring, allowing you to track battery performance over time.
 *
 * @module battery_health
 */

import { TessieClient } from "./TessieClient";
import { GetBatteryHealthParams } from "./types";

/**
 * Retrieves battery health information for a vehicle over a time period.
 *
 * This function returns detailed battery health metrics including degradation
 * data, capacity trends, and performance statistics over the specified time range.
 *
 * @summary Get battery health information
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {GetBatteryHealthParams} params - Parameters including VIN, time range, and distance format
 * @returns {Promise<any>} Battery health information object with degradation metrics
 * @throws {Error} If the API request fails
 * @see GET /{vin}/battery_health
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const health = await getBatteryHealth(client, {
 *   vin: 'YOUR_VIN',
 *   from: 1609459200,  // Unix timestamp
 *   to: 1640995200,    // Unix timestamp
 *   distance_format: DistanceFormat.MI
 * });
 * console.log(health);
 * ```
 */
export async function getBatteryHealth(
  client: TessieClient,
  params: GetBatteryHealthParams
): Promise<any> {
  return await client.request("GET", "/{vin}/battery_health", params);
}
