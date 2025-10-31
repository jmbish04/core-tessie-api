/**
 * Lights control module for the Tessie API.
 *
 * This module contains all functions related to controlling the
 * vehicle's external lights.
 *
 * @module lights
 */

import { TessieClient } from "./TessieClient";
import { FlashLightsParams } from "./types";

/**
 * Flashes the vehicle's lights.
 *
 * This function activates a brief flashing of the vehicle's external
 * lights, useful for locating the vehicle in a parking area.
 *
 * @summary Flash lights
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {FlashLightsParams} params - Parameters including VIN and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/flash
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await flashLights(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function flashLights(
  client: TessieClient,
  params: FlashLightsParams
): Promise<any> {
  return await client.request("GET", "/{vin}/command/flash", params);
}
