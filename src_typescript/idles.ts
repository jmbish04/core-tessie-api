/**
 * Idle sessions module for the Tessie API.
 *
 * This module contains all functions related to viewing idle session
 * history and statistics.
 *
 * @module idles
 */

import { TessieClient } from "./TessieClient";
import { GetIdlesParams } from "./types";

/**
 * Retrieves idle sessions for a vehicle.
 *
 * This function returns information about periods when the vehicle was
 * parked and idle, based on location and time filters.
 *
 * @summary Get idle sessions
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {GetIdlesParams} params - Parameters including VIN, location, time range, and filters
 * @returns {Promise<any>} Idle session data
 * @throws {Error} If the API request fails
 * @see GET /{vin}/idles
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const idles = await getIdles(client, {
 *   vin: 'YOUR_VIN',
 *   from: 1609459200,
 *   to: '1640995200',
 *   origin_latitude: '37.7749',
 *   origin_longitude: '-122.4194',
 *   origin_radius: '1000',
 *   exclude_origin: false
 * });
 * ```
 */
export async function getIdles(
  client: TessieClient,
  params: GetIdlesParams
): Promise<any> {
  return await client.request("GET", "/{vin}/idles", params);
}
