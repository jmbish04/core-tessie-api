/**
 * Charging history module for the Tessie API.
 *
 * This module contains all functions related to viewing charging history
 * and managing charge session costs.
 *
 * @module charges
 */

import { TessieClient } from "./TessieClient";
import { GetChargesParams, SetChargeCostParams } from "./types";

/**
 * Retrieves charging history for a vehicle.
 *
 * This function returns detailed charging session history based on various
 * filters including location, time range, energy added, and more.
 *
 * @summary Get charging history
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {GetChargesParams} params - Parameters including VIN, location, time range, and filters
 * @returns {Promise<any>} Charging history data
 * @throws {Error} If the API request fails
 * @see GET /{vin}/charges
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const charges = await getCharges(client, {
 *   vin: 'YOUR_VIN',
 *   origin_latitude: 37.7749,
 *   origin_longitude: -122.4194,
 *   origin_radius: 1000,
 *   from: 1609459200,
 *   to: 1640995200,
 *   minimum_energy_added: 5,
 *   superchargers_only: true
 * });
 * ```
 */
export async function getCharges(
  client: TessieClient,
  params: GetChargesParams
): Promise<any> {
  return await client.request("GET", "/{vin}/charges", params);
}

/**
 * Sets the cost for a specific charge session.
 *
 * This function allows you to manually set or update the cost associated
 * with a particular charging session for expense tracking purposes.
 *
 * @summary Set charge session cost
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {SetChargeCostParams} params - Parameters including VIN, charge ID, and cost
 * @returns {Promise<any>} Confirmation response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/charges/{charge_id}/set_cost
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await setChargeCost(client, {
 *   vin: 'YOUR_VIN',
 *   charge_id: 12345,
 *   cost: 1250  // Cost in cents
 * });
 * ```
 */
export async function setChargeCost(
  client: TessieClient,
  params: SetChargeCostParams
): Promise<any> {
  return await client.request(
    "GET",
    "/{vin}/charges/{charge_id}/set_cost",
    params
  );
}
