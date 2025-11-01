/**
 * Drive history module for the Tessie API.
 *
 * This module contains all functions related to drive history, driving paths,
 * and managing drive tags.
 *
 * @module drives
 */

import { TessieClient } from "./TessieClient";
import {
  GetDrivesParams,
  GetDrivingPathParams,
  SetTagParams,
} from "./types";

/**
 * Retrieves drive history for a vehicle.
 *
 * This function returns detailed driving session history based on various
 * filters including origin, destination, time range, driver profile, and more.
 *
 * @summary Get drive history
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {GetDrivesParams} params - Parameters including VIN, locations, time range, and filters
 * @returns {Promise<any>} Drive history data
 * @throws {Error} If the API request fails
 * @see GET /{vin}/drives
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const drives = await getDrives(client, {
 *   vin: 'YOUR_VIN',
 *   from: 1609459200,
 *   toUnix: 1640995200,
 *   origin_latitude: 37.7749,
 *   origin_longitude: -122.4194,
 *   origin_radius: 1000,
 *   destination_latitude: 37.8044,
 *   destination_longitude: -122.2712,
 *   destination_radius: 1000,
 *   tag: 'work',
 *   driver_profile: 'John',
 *   minimum_distance: 5
 * });
 * ```
 */
export async function getDrives(
  client: TessieClient,
  params: GetDrivesParams
): Promise<any> {
  return await client.request("GET", "/{vin}/drives", params);
}

/**
 * Retrieves the driving path for a specific time period.
 *
 * This function returns GPS coordinates tracing the vehicle's path
 * during the specified time range.
 *
 * @summary Get driving path
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {GetDrivingPathParams} params - Parameters including VIN and time range
 * @returns {Promise<any>} Path data with GPS coordinates
 * @throws {Error} If the API request fails
 * @see GET /{vin}/path
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const path = await getDrivingPath(client, {
 *   vin: 'YOUR_VIN',
 *   from: 1609459200,
 *   to: 1609462800
 * });
 * ```
 */
export async function getDrivingPath(
  client: TessieClient,
  params: GetDrivingPathParams
): Promise<any> {
  return await client.request("GET", "/{vin}/path", params);
}

/**
 * Sets a tag for one or more drive sessions.
 *
 * This function allows you to categorize drive sessions by assigning
 * custom tags for organizational purposes.
 *
 * @summary Set tag for drives
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {SetTagParams} params - Parameters including VIN, drive IDs, and tag
 * @returns {Promise<any>} Confirmation response
 * @throws {Error} If the API request fails
 * @see POST /{vin}/drives/set_tag
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await setTag(client, {
 *   vin: 'YOUR_VIN',
 *   drives: [12345, 12346, 12347],
 *   tag: 'business'
 * });
 * ```
 */
export async function setTag(
  client: TessieClient,
  params: SetTagParams
): Promise<any> {
  return await client.request("POST", "/{vin}/drives/set_tag", params);
}
