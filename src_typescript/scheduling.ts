/**
 * Scheduling module for the Tessie API.
 *
 * This module contains all functions related to charging and departure
 * scheduling features.
 *
 * @module scheduling
 */

import { TessieClient } from "./TessieClient";
import {
  SetScheduledChargingParams,
  SetScheduledDepartureParams,
} from "./types";

/**
 * Sets scheduled charging for the vehicle.
 *
 * This function configures the vehicle to start charging at a specific
 * time, useful for taking advantage of off-peak electricity rates.
 *
 * @summary Set scheduled charging
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {SetScheduledChargingParams} params - Parameters including VIN, time, enable flag, and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/set_scheduled_charging
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await setScheduledCharging(client, {
 *   vin: 'YOUR_VIN',
 *   time: 120,  // 2:00 AM (120 minutes after midnight)
 *   enable: true
 * });
 * ```
 */
export async function setScheduledCharging(
  client: TessieClient,
  params: SetScheduledChargingParams
): Promise<any> {
  return await client.request(
    "GET",
    "/{vin}/command/set_scheduled_charging",
    params
  );
}

/**
 * Sets scheduled departure for the vehicle.
 *
 * This function configures preconditioning and charging schedules to ensure
 * the vehicle is ready at a specific departure time.
 *
 * @summary Set scheduled departure
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {SetScheduledDepartureParams} params - Parameters including VIN, departure time, off-peak settings, and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/set_scheduled_departure
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await setScheduledDeparture(client, {
 *   vin: 'YOUR_VIN',
 *   departure_time: 480,  // 8:00 AM
 *   end_off_peak_time: 360,  // 6:00 AM
 *   enable: true,
 *   preconditioning_enabled: true,
 *   preconditioning_weekdays_only: true,
 *   off_peak_charging_enabled: true,
 *   off_peak_charging_weekdays_only: false
 * });
 * ```
 */
export async function setScheduledDeparture(
  client: TessieClient,
  params: SetScheduledDepartureParams
): Promise<any> {
  return await client.request(
    "GET",
    "/{vin}/command/set_scheduled_departure",
    params
  );
}
