/**
 * Boombox control module for the Tessie API.
 *
 * This module contains all functions related to controlling the vehicle's
 * boombox feature, which allows playing custom sounds through external speakers.
 *
 * @module boombox
 */

import { TessieClient } from "./TessieClient";
import { BoomboxParams } from "./types";

/**
 * Triggers the remote boombox on a vehicle.
 *
 * This function activates the vehicle's boombox feature, playing sounds
 * through the external speakers. The command can wait for completion or
 * return immediately.
 *
 * @summary Trigger remote boombox
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {BoomboxParams} params - Parameters including VIN and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/remote_boombox
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await boombox(client, {
 *   vin: 'YOUR_VIN',
 *   retry_duration: 40,
 *   wait_for_completion: 'true'
 * });
 * console.log(result);
 * ```
 */
export async function boombox(
  client: TessieClient,
  params: BoomboxParams
): Promise<any> {
  return await client.request("GET", "/{vin}/command/remote_boombox", params);
}
