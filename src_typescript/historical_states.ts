/**
 * Historical states module for the Tessie API.
 *
 * This module contains all functions related to retrieving historical vehicle
 * states and consumption data.
 *
 * @module historical_states
 */

import { TessieClient } from "./TessieClient";
import {
  GetHistoricalStatesParams,
  GetLastIdleStateParams,
  GetConsumptionSinceChargeParams,
} from "./types";

/**
 * Retrieves historical states for a vehicle over a time period.
 *
 * This function returns snapshots of the vehicle's state at regular intervals
 * during the specified time range, useful for tracking changes over time.
 *
 * @summary Get historical states
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {GetHistoricalStatesParams} params - Parameters including VIN, time range, interval, and format options
 * @returns {Promise<any>} Historical state data
 * @throws {Error} If the API request fails
 * @see GET /{vin}/states
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const states = await getHistoricalStates(client, {
 *   vin: 'YOUR_VIN',
 *   from: 1609459200,
 *   to: 1609545600,
 *   interval: 3600,  // One hour intervals
 *   condense: true
 * });
 * ```
 */
export async function getHistoricalStates(
  client: TessieClient,
  params: GetHistoricalStatesParams
): Promise<any> {
  return await client.request("GET", "/{vin}/states", params);
}

/**
 * Retrieves the last recorded idle state for a vehicle.
 *
 * This function returns the most recent state snapshot from when the
 * vehicle was last parked and idle.
 *
 * @summary Get last idle state
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {GetLastIdleStateParams} params - Parameters including VIN
 * @returns {Promise<any>} Last idle state data
 * @throws {Error} If the API request fails
 * @see GET /{vin}/last_idle_state
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const idleState = await getLastIdleState(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function getLastIdleState(
  client: TessieClient,
  params: GetLastIdleStateParams
): Promise<any> {
  return await client.request("GET", "/{vin}/last_idle_state", params);
}

/**
 * Retrieves energy consumption since the last charge.
 *
 * This function returns detailed consumption statistics for the current
 * charge cycle, tracking energy usage since the last charging session.
 *
 * @summary Get consumption since last charge
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {GetConsumptionSinceChargeParams} params - Parameters including VIN
 * @returns {Promise<any>} Consumption data
 * @throws {Error} If the API request fails
 * @see GET /{vin}/consumption_since_charge
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const consumption = await getConsumptionSinceCharge(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function getConsumptionSinceCharge(
  client: TessieClient,
  params: GetConsumptionSinceChargeParams
): Promise<any> {
  return await client.request("GET", "/{vin}/consumption_since_charge", params);
}
