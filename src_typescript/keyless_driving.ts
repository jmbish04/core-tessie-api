/**
 * Keyless driving module for the Tessie API.
 *
 * This module contains all functions related to enabling keyless
 * driving features.
 *
 * @module keyless_driving
 */

import { TessieClient } from "./TessieClient";
import { EnableKeylessDrivingParams } from "./types";

/**
 * Enables keyless driving for the vehicle.
 *
 * This function activates remote start mode, allowing the vehicle to be
 * driven without a physical key for a limited time period.
 *
 * @summary Enable keyless driving
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {EnableKeylessDrivingParams} params - Parameters including VIN and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/remote_start
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await enableKeylessDriving(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function enableKeylessDriving(
  client: TessieClient,
  params: EnableKeylessDrivingParams
): Promise<any> {
  return await client.request("GET", "/{vin}/command/remote_start", params);
}
