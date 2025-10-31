/**
 * Share data module for the Tessie API.
 *
 * This module contains all functions related to sharing data to the
 * vehicle, such as navigation destinations or media.
 *
 * @module share
 */

import { TessieClient } from "./TessieClient";
import { ShareParams } from "./types";

/**
 * Shares data to the vehicle.
 *
 * This function sends data (such as navigation destinations, addresses,
 * or other information) to the vehicle's display system.
 *
 * @summary Share data to vehicle
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {ShareParams} params - Parameters including VIN, value to share, locale, and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/share
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await share(client, {
 *   vin: 'YOUR_VIN',
 *   value: '1 Apple Park Way, Cupertino, CA',
 *   locale: 'en-US'
 * });
 * ```
 */
export async function share(
  client: TessieClient,
  params: ShareParams
): Promise<any> {
  return await client.request("GET", "/{vin}/command/share", params);
}
