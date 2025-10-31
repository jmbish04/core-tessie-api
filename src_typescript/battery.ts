/**
 * Battery information module for the Tessie API.
 *
 * This module contains all functions related to vehicle battery information,
 * including retrieving current battery status and statistics.
 *
 * @module battery
 */

import { TessieClient } from "./TessieClient";
import { GetBatteryParams } from "./types";

/**
 * Retrieves battery information for a vehicle.
 *
 * This function returns detailed information about the vehicle's battery,
 * including charge level, capacity, and health metrics.
 *
 * @summary Get battery information
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {GetBatteryParams} params - Parameters containing the vehicle VIN
 * @returns {Promise<any>} Battery information object
 * @throws {Error} If the API request fails
 * @see GET /{vin}/battery
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const batteryInfo = await getBattery(client, { vin: 'YOUR_VIN' });
 * console.log(batteryInfo);
 * ```
 */
export async function getBattery(
  client: TessieClient,
  params: GetBatteryParams
): Promise<any> {
  return await client.request("GET", "/{vin}/battery", params);
}
