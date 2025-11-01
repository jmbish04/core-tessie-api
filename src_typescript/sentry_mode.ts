/**
 * Sentry mode module for the Tessie API.
 *
 * This module contains all functions related to controlling the
 * vehicle's sentry mode security feature.
 *
 * @module sentry_mode
 */

import { TessieClient } from "./TessieClient";
import {
  EnableSentryModeParams,
  DisableSentryModeParams,
} from "./types";

/**
 * Enables sentry mode for the vehicle.
 *
 * This function activates sentry mode, which monitors the vehicle's
 * surroundings and records potential security threats.
 *
 * @summary Enable sentry mode
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {EnableSentryModeParams} params - Parameters including VIN and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/enable_sentry
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await enableSentryMode(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function enableSentryMode(
  client: TessieClient,
  params: EnableSentryModeParams
): Promise<any> {
  return await client.request("GET", "/{vin}/command/enable_sentry", params);
}

/**
 * Disables sentry mode for the vehicle.
 *
 * This function deactivates sentry mode, turning off security monitoring
 * and recording features.
 *
 * @summary Disable sentry mode
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {DisableSentryModeParams} params - Parameters including VIN and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/disable_sentry
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await disableSentryMode(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function disableSentryMode(
  client: TessieClient,
  params: DisableSentryModeParams
): Promise<any> {
  return await client.request("GET", "/{vin}/command/disable_sentry", params);
}
