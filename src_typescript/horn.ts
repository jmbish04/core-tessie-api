/**
 * Horn control module for the Tessie API.
 *
 * This module contains all functions related to controlling the
 * vehicle's horn.
 *
 * @module horn
 */

import { TessieClient } from "./TessieClient";
import { HonkParams } from "./types";

/**
 * Honks the vehicle's horn.
 *
 * This function activates the vehicle's horn, useful for locating
 * the vehicle or getting attention.
 *
 * @summary Honk horn
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {HonkParams} params - Parameters including VIN and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/honk
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await honk(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function honk(
  client: TessieClient,
  params: HonkParams
): Promise<any> {
  return await client.request("GET", "/{vin}/command/honk", params);
}
