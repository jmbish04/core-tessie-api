/**
 * HomeLink control module for the Tessie API.
 *
 * This module contains all functions related to triggering HomeLink
 * devices such as garage doors.
 *
 * @module homelink
 */

import { TessieClient } from "./TessieClient";
import { TriggerHomelinkParams } from "./types";

/**
 * Triggers HomeLink to activate a connected device.
 *
 * This function sends a signal to activate HomeLink-compatible devices
 * such as garage door openers near the vehicle's current location.
 *
 * @summary Trigger HomeLink
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {TriggerHomelinkParams} params - Parameters including VIN and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/trigger_homelink
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await triggerHomelink(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function triggerHomelink(
  client: TessieClient,
  params: TriggerHomelinkParams
): Promise<any> {
  return await client.request("GET", "/{vin}/command/trigger_homelink", params);
}
