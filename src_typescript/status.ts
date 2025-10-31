/**
 * Vehicle status module for the Tessie API.
 *
 * This module contains all functions related to retrieving vehicle
 * status information.
 *
 * @module status
 */

import { TessieClient } from "./TessieClient";
import { GetStatusParams } from "./types";

/**
 * Retrieves the current status of a vehicle.
 *
 * This function returns general status information about the vehicle,
 * including connectivity and operational status.
 *
 * @summary Get vehicle status
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {GetStatusParams} params - Parameters including VIN
 * @returns {Promise<any>} Vehicle status object
 * @throws {Error} If the API request fails
 * @see GET /{vin}/status
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const status = await getStatus(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function getStatus(
  client: TessieClient,
  params: GetStatusParams
): Promise<any> {
  return await client.request("GET", "/{vin}/status", params);
}
