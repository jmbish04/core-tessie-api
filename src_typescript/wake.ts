/**
 * Wake module for the Tessie API.
 *
 * This module contains all functions related to waking the vehicle
 * from sleep mode.
 *
 * @module wake
 */

import { TessieClient } from "./TessieClient";
import { WakeParams } from "./types";

/**
 * Wakes the vehicle from sleep mode.
 *
 * This function sends a wake command to bring the vehicle out of sleep
 * mode, making it ready to receive commands and report status.
 *
 * @summary Wake vehicle
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {WakeParams} params - Parameters including VIN
 * @returns {Promise<any>} Wake command acknowledgment
 * @throws {Error} If the API request fails
 * @see GET /{vin}/wake
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await wake(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function wake(
  client: TessieClient,
  params: WakeParams
): Promise<any> {
  return await client.request("GET", "/{vin}/wake", params);
}
