/**
 * Speed limit module for the Tessie API.
 *
 * This module contains all functions related to managing the vehicle's
 * speed limit feature.
 *
 * @module speed_limit
 */

import { TessieClient } from "./TessieClient";
import {
  SetSpeedLimitParams,
  EnableSpeedLimitParams,
  DisableSpeedLimitParams,
  ClearSpeedLimitPinParams,
} from "./types";

/**
 * Sets the maximum speed limit for the vehicle.
 *
 * This function configures the maximum speed that the vehicle can be
 * driven when speed limit mode is active.
 *
 * @summary Set speed limit
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {SetSpeedLimitParams} params - Parameters including VIN, speed in MPH, and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/set_speed_limit
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await setSpeedLimit(client, {
 *   vin: 'YOUR_VIN',
 *   mph: 65
 * });
 * ```
 */
export async function setSpeedLimit(
  client: TessieClient,
  params: SetSpeedLimitParams
): Promise<any> {
  return await client.request("GET", "/{vin}/command/set_speed_limit", params);
}

/**
 * Enables the speed limit feature.
 *
 * This function activates the speed limit restriction, preventing the
 * vehicle from exceeding the configured speed. Requires a PIN.
 *
 * @summary Enable speed limit
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {EnableSpeedLimitParams} params - Parameters including VIN, PIN, and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/enable_speed_limit
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await enableSpeedLimit(client, {
 *   vin: 'YOUR_VIN',
 *   pin: '1234'
 * });
 * ```
 */
export async function enableSpeedLimit(
  client: TessieClient,
  params: EnableSpeedLimitParams
): Promise<any> {
  return await client.request(
    "GET",
    "/{vin}/command/enable_speed_limit",
    params
  );
}

/**
 * Disables the speed limit feature.
 *
 * This function deactivates the speed limit restriction, allowing normal
 * operation. Requires the correct PIN.
 *
 * @summary Disable speed limit
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {DisableSpeedLimitParams} params - Parameters including VIN, PIN, and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/disable_speed_limit
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await disableSpeedLimit(client, {
 *   vin: 'YOUR_VIN',
 *   pin: '1234'
 * });
 * ```
 */
export async function disableSpeedLimit(
  client: TessieClient,
  params: DisableSpeedLimitParams
): Promise<any> {
  return await client.request(
    "GET",
    "/{vin}/command/disable_speed_limit",
    params
  );
}

/**
 * Clears the speed limit PIN.
 *
 * This function removes the configured PIN for the speed limit feature.
 * Requires the current PIN for verification.
 *
 * @summary Clear speed limit PIN
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {ClearSpeedLimitPinParams} params - Parameters including VIN, current PIN, and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/clear_speed_limit_pin
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await clearSpeedLimitPin(client, {
 *   vin: 'YOUR_VIN',
 *   pin: '1234'
 * });
 * ```
 */
export async function clearSpeedLimitPin(
  client: TessieClient,
  params: ClearSpeedLimitPinParams
): Promise<any> {
  return await client.request(
    "GET",
    "/{vin}/command/clear_speed_limit_pin",
    params
  );
}
