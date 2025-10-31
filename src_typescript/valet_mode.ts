/**
 * Valet mode module for the Tessie API.
 *
 * This module contains all functions related to controlling the
 * vehicle's valet mode security feature.
 *
 * @module valet_mode
 */

import { TessieClient } from "./TessieClient";
import {
  EnableValetModeParams,
  DisableValetModeParams,
} from "./types";

/**
 * Enables valet mode for the vehicle.
 *
 * This function activates valet mode, which restricts vehicle access
 * and features when handing the vehicle to a valet service.
 *
 * @summary Enable valet mode
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {EnableValetModeParams} params - Parameters including VIN and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/enable_valet
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await enableValetMode(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function enableValetMode(
  client: TessieClient,
  params: EnableValetModeParams
): Promise<any> {
  return await client.request("GET", "/{vin}/command/enable_valet", params);
}

/**
 * Disables valet mode for the vehicle.
 *
 * This function deactivates valet mode, restoring full vehicle
 * access and features.
 *
 * @summary Disable valet mode
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {DisableValetModeParams} params - Parameters including VIN and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/disable_valet
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await disableValetMode(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function disableValetMode(
  client: TessieClient,
  params: DisableValetModeParams
): Promise<any> {
  return await client.request("GET", "/{vin}/command/disable_valet", params);
}
