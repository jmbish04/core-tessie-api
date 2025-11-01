/**
 * Window control module for the Tessie API.
 *
 * This module contains all functions related to controlling the
 * vehicle's windows.
 *
 * @module windows
 */

import { TessieClient } from "./TessieClient";
import { VentWindowsParams, CloseWindowsParams } from "./types";

/**
 * Vents all windows to a partially open position.
 *
 * This function opens all windows slightly for ventilation while
 * maintaining some security and weather protection.
 *
 * @summary Vent windows
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {VentWindowsParams} params - Parameters including VIN and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/vent_windows
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await ventWindows(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function ventWindows(
  client: TessieClient,
  params: VentWindowsParams
): Promise<any> {
  return await client.request("GET", "/{vin}/command/vent_windows", params);
}

/**
 * Closes all windows completely.
 *
 * This function closes all vehicle windows to their fully closed position.
 *
 * @summary Close windows
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {CloseWindowsParams} params - Parameters including VIN and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/close_windows
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await closeWindows(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function closeWindows(
  client: TessieClient,
  params: CloseWindowsParams
): Promise<any> {
  return await client.request("GET", "/{vin}/command/close_windows", params);
}
