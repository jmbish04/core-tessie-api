/**
 * Software update module for the Tessie API.
 *
 * This module contains all functions related to managing vehicle
 * software updates.
 *
 * @module software
 */

import { TessieClient } from "./TessieClient";
import {
  ScheduleSoftwareUpdateParams,
  CancelSoftwareUpdateParams,
} from "./types";

/**
 * Schedules a software update for the vehicle.
 *
 * This function schedules a pending software update to be installed
 * after a specified delay.
 *
 * @summary Schedule software update
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {ScheduleSoftwareUpdateParams} params - Parameters including VIN, delay, and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/schedule_software_update
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await scheduleSoftwareUpdate(client, {
 *   vin: 'YOUR_VIN',
 *   in_seconds: 3600  // Install in 1 hour
 * });
 * ```
 */
export async function scheduleSoftwareUpdate(
  client: TessieClient,
  params: ScheduleSoftwareUpdateParams
): Promise<any> {
  return await client.request(
    "GET",
    "/{vin}/command/schedule_software_update",
    params
  );
}

/**
 * Cancels a scheduled software update.
 *
 * This function cancels a previously scheduled software update installation.
 *
 * @summary Cancel software update
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {CancelSoftwareUpdateParams} params - Parameters including VIN and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/cancel_software_update
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await cancelSoftwareUpdate(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function cancelSoftwareUpdate(
  client: TessieClient,
  params: CancelSoftwareUpdateParams
): Promise<any> {
  return await client.request(
    "GET",
    "/{vin}/command/cancel_software_update",
    params
  );
}
