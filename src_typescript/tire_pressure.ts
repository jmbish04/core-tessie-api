/**
 * Tire pressure module for the Tessie API.
 *
 * This module contains all functions related to retrieving tire
 * pressure information.
 *
 * @module tire_pressure
 */

import { TessieClient } from "./TessieClient";
import { GetTirePressureParams } from "./types";

/**
 * Retrieves tire pressure information for a vehicle.
 *
 * This function returns current tire pressure readings for all tires,
 * helping monitor tire health and safety.
 *
 * @summary Get tire pressure
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {GetTirePressureParams} params - Parameters including VIN
 * @returns {Promise<any>} Tire pressure data for all tires
 * @throws {Error} If the API request fails
 * @see GET /{vin}/tire_pressure
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const tirePressure = await getTirePressure(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function getTirePressure(
  client: TessieClient,
  params: GetTirePressureParams
): Promise<any> {
  return await client.request("GET", "/{vin}/tire_pressure", params);
}
