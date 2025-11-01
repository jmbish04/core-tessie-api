/**
 * Trunk control module for the Tessie API.
 *
 * This module contains all functions related to controlling the
 * vehicle's front and rear trunks.
 *
 * @module trunks
 */

import { TessieClient } from "./TessieClient";
import {
  OpenFrontTrunkParams,
  OpenCloseRearTrunkParams,
} from "./types";

/**
 * Opens the front trunk (frunk).
 *
 * This function activates the front trunk latch to open the frunk.
 * Note that the frunk cannot be closed remotely.
 *
 * @summary Open front trunk
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {OpenFrontTrunkParams} params - Parameters including VIN and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/activate_front_trunk
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await openFrontTrunk(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function openFrontTrunk(
  client: TessieClient,
  params: OpenFrontTrunkParams
): Promise<any> {
  return await client.request(
    "GET",
    "/{vin}/command/activate_front_trunk",
    params
  );
}

/**
 * Opens or closes the rear trunk.
 *
 * This function activates the rear trunk, either opening it if closed
 * or closing it if open (on supported models with power liftgate).
 *
 * @summary Open or close rear trunk
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {OpenCloseRearTrunkParams} params - Parameters including VIN and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/activate_rear_trunk
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await openCloseRearTrunk(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function openCloseRearTrunk(
  client: TessieClient,
  params: OpenCloseRearTrunkParams
): Promise<any> {
  return await client.request(
    "GET",
    "/{vin}/command/activate_rear_trunk",
    params
  );
}
