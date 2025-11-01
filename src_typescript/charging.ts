/**
 * Charging control module for the Tessie API.
 *
 * This module contains all functions related to controlling and managing
 * vehicle charging, including starting/stopping charging, setting charge
 * limits, and managing the charge port.
 *
 * @module charging
 */

import { TessieClient } from "./TessieClient";
import {
  StartChargingParams,
  StopChargingParams,
  SetChargeLimitParams,
  SetChargingAmpsParams,
  OpenUnlockChargePortParams,
  CloseChargePortParams,
} from "./types";

/**
 * Starts charging the vehicle.
 *
 * This function initiates the charging process for a plugged-in vehicle.
 * The command can wait for completion or return immediately based on the
 * wait_for_completion parameter.
 *
 * @summary Start charging
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {StartChargingParams} params - Parameters including VIN and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/start_charging
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await startCharging(client, {
 *   vin: 'YOUR_VIN',
 *   wait_for_completion: true
 * });
 * ```
 */
export async function startCharging(
  client: TessieClient,
  params: StartChargingParams
): Promise<any> {
  return await client.request("GET", "/{vin}/command/start_charging", params);
}

/**
 * Stops charging the vehicle.
 *
 * This function halts the charging process for a vehicle that is currently
 * charging. The command can wait for completion or return immediately.
 *
 * @summary Stop charging
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {StopChargingParams} params - Parameters including VIN and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/stop_charging
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await stopCharging(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function stopCharging(
  client: TessieClient,
  params: StopChargingParams
): Promise<any> {
  return await client.request("GET", "/{vin}/command/stop_charging", params);
}

/**
 * Sets the charge limit for the vehicle battery.
 *
 * This function configures the target charge percentage for the vehicle's
 * battery. The vehicle will stop charging once it reaches this limit.
 *
 * @summary Set charge limit
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {SetChargeLimitParams} params - Parameters including VIN, charge percentage, and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/set_charge_limit
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await setChargeLimit(client, {
 *   vin: 'YOUR_VIN',
 *   percent: 80
 * });
 * ```
 */
export async function setChargeLimit(
  client: TessieClient,
  params: SetChargeLimitParams
): Promise<any> {
  return await client.request("GET", "/{vin}/command/set_charge_limit", params);
}

/**
 * Sets the charging amperage for the vehicle.
 *
 * This function configures the maximum charging current (in amps) that the
 * vehicle will draw during charging, allowing you to control charging speed.
 *
 * @summary Set charging amps
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {SetChargingAmpsParams} params - Parameters including VIN, amperage, and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/set_charging_amps
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await setChargingAmps(client, {
 *   vin: 'YOUR_VIN',
 *   amps: 32
 * });
 * ```
 */
export async function setChargingAmps(
  client: TessieClient,
  params: SetChargingAmpsParams
): Promise<any> {
  return await client.request(
    "GET",
    "/{vin}/command/set_charging_amps",
    params
  );
}

/**
 * Opens and unlocks the charge port.
 *
 * This function opens the vehicle's charge port door and unlocks it,
 * preparing the vehicle for charging.
 *
 * @summary Open and unlock charge port
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {OpenUnlockChargePortParams} params - Parameters including VIN and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/open_charge_port
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await openUnlockChargePort(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function openUnlockChargePort(
  client: TessieClient,
  params: OpenUnlockChargePortParams
): Promise<any> {
  return await client.request("GET", "/{vin}/command/open_charge_port", params);
}

/**
 * Closes the charge port.
 *
 * This function closes the vehicle's charge port door. Note that the charge
 * port can only be closed if no charging cable is connected.
 *
 * @summary Close charge port
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {CloseChargePortParams} params - Parameters including VIN and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/close_charge_port
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await closeChargePort(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function closeChargePort(
  client: TessieClient,
  params: CloseChargePortParams
): Promise<any> {
  return await client.request(
    "GET",
    "/{vin}/command/close_charge_port",
    params
  );
}
