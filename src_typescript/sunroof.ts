/**
 * Sunroof control module for the Tessie API.
 *
 * This module contains all functions related to controlling the
 * vehicle's sunroof.
 *
 * @module sunroof
 */

import { TessieClient } from "./TessieClient";
import { VentSunroofParams, CloseSunroofParams } from "./types";

/**
 * Vents the sunroof to a partially open position.
 *
 * This function opens the sunroof to the vent position for ventilation
 * while maintaining some weather protection.
 *
 * @summary Vent sunroof
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {VentSunroofParams} params - Parameters including VIN and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/vent_sunroof
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await ventSunroof(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function ventSunroof(
  client: TessieClient,
  params: VentSunroofParams
): Promise<any> {
  return await client.request("GET", "/{vin}/command/vent_sunroof", params);
}

/**
 * Closes the sunroof completely.
 *
 * This function closes the sunroof to its fully closed position.
 *
 * @summary Close sunroof
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {CloseSunroofParams} params - Parameters including VIN and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/close_sunroof
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await closeSunroof(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function closeSunroof(
  client: TessieClient,
  params: CloseSunroofParams
): Promise<any> {
  return await client.request("GET", "/{vin}/command/close_sunroof", params);
}
