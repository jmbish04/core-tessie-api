/**
 * Climate control module for the Tessie API.
 *
 * This module contains all functions related to controlling vehicle climate,
 * including HVAC, seat heating/cooling, defrost, and climate keeper modes.
 *
 * @module climate
 */

import { TessieClient } from "./TessieClient";
import {
  StartClimatePreconditioningParams,
  StopClimateParams,
  SetTemperatureParams,
  SetSeatHeatParams,
  SetSeatCoolParams,
  StartDefrostParams,
  StopDefrostParams,
  StartSteeringWheelHeaterParams,
  StopSteeringWheelHeaterParams,
  SetBioweaponDefenseModeParams,
  SetClimateKeeperModeParams,
  SetCabinOverheatProtectionParams,
} from "./types";

/**
 * Starts climate preconditioning for the vehicle.
 *
 * This function activates the vehicle's HVAC system to precondition the
 * cabin to the desired temperature before driving.
 *
 * @summary Start climate preconditioning
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {StartClimatePreconditioningParams} params - Parameters including VIN and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/start_climate
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await startClimatePreconditioning(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function startClimatePreconditioning(
  client: TessieClient,
  params: StartClimatePreconditioningParams
): Promise<any> {
  return await client.request("GET", "/{vin}/command/start_climate", params);
}

/**
 * Stops the climate control system.
 *
 * This function turns off the vehicle's HVAC system, stopping all climate
 * control operations.
 *
 * @summary Stop climate
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {StopClimateParams} params - Parameters including VIN and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/stop_climate
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await stopClimate(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function stopClimate(
  client: TessieClient,
  params: StopClimateParams
): Promise<any> {
  return await client.request("GET", "/{vin}/command/stop_climate", params);
}

/**
 * Sets the target cabin temperature.
 *
 * This function adjusts the vehicle's climate control system to achieve
 * the specified target temperature.
 *
 * @summary Set temperature
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {SetTemperatureParams} params - Parameters including VIN, temperature, and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/set_temperatures
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await setTemperature(client, {
 *   vin: 'YOUR_VIN',
 *   temperature: 22  // In Celsius
 * });
 * ```
 */
export async function setTemperature(
  client: TessieClient,
  params: SetTemperatureParams
): Promise<any> {
  return await client.request("GET", "/{vin}/command/set_temperatures", params);
}

/**
 * Sets the heating level for a specific seat.
 *
 * This function controls the heated seat feature for the specified seat
 * position, with adjustable heat levels.
 *
 * @summary Set seat heat
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {SetSeatHeatParams} params - Parameters including VIN, seat position, heat level, and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/set_seat_heat
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await setSeatHeat(client, {
 *   vin: 'YOUR_VIN',
 *   seat: Seat.FRONT_LEFT,
 *   level: 3  // Maximum heat
 * });
 * ```
 */
export async function setSeatHeat(
  client: TessieClient,
  params: SetSeatHeatParams
): Promise<any> {
  return await client.request("GET", "/{vin}/command/set_seat_heat", params);
}

/**
 * Sets the cooling level for a specific seat.
 *
 * This function controls the ventilated seat feature for the specified seat
 * position, with adjustable cooling levels.
 *
 * @summary Set seat cooling
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {SetSeatCoolParams} params - Parameters including VIN, seat position, cooling level, and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/set_seat_cool
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await setSeatCool(client, {
 *   vin: 'YOUR_VIN',
 *   seat: Seat.FRONT_RIGHT,
 *   level: 2
 * });
 * ```
 */
export async function setSeatCool(
  client: TessieClient,
  params: SetSeatCoolParams
): Promise<any> {
  return await client.request("GET", "/{vin}/command/set_seat_cool", params);
}

/**
 * Starts maximum defrost mode.
 *
 * This function activates the vehicle's maximum defrost feature, which
 * quickly clears ice and fog from windows.
 *
 * @summary Start defrost
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {StartDefrostParams} params - Parameters including VIN and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/start_max_defrost
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await startDefrost(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function startDefrost(
  client: TessieClient,
  params: StartDefrostParams
): Promise<any> {
  return await client.request("GET", "/{vin}/command/start_max_defrost", params);
}

/**
 * Stops maximum defrost mode.
 *
 * This function deactivates the vehicle's maximum defrost feature.
 *
 * @summary Stop defrost
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {StopDefrostParams} params - Parameters including VIN and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/stop_max_defrost
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await stopDefrost(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function stopDefrost(
  client: TessieClient,
  params: StopDefrostParams
): Promise<any> {
  return await client.request("GET", "/{vin}/command/stop_max_defrost", params);
}

/**
 * Starts the steering wheel heater.
 *
 * This function activates the heated steering wheel feature for
 * improved comfort in cold weather.
 *
 * @summary Start steering wheel heater
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {StartSteeringWheelHeaterParams} params - Parameters including VIN and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/start_steering_wheel_heater
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await startSteeringWheelHeater(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function startSteeringWheelHeater(
  client: TessieClient,
  params: StartSteeringWheelHeaterParams
): Promise<any> {
  return await client.request(
    "GET",
    "/{vin}/command/start_steering_wheel_heater",
    params
  );
}

/**
 * Stops the steering wheel heater.
 *
 * This function deactivates the heated steering wheel feature.
 *
 * @summary Stop steering wheel heater
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {StopSteeringWheelHeaterParams} params - Parameters including VIN and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/stop_steering_wheel_heater
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await stopSteeringWheelHeater(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function stopSteeringWheelHeater(
  client: TessieClient,
  params: StopSteeringWheelHeaterParams
): Promise<any> {
  return await client.request(
    "GET",
    "/{vin}/command/stop_steering_wheel_heater",
    params
  );
}

/**
 * Sets bioweapon defense mode.
 *
 * This function activates the vehicle's bioweapon defense mode, which uses
 * HEPA filtration to provide maximum air quality protection.
 *
 * @summary Set bioweapon defense mode
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {SetBioweaponDefenseModeParams} params - Parameters including VIN and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/set_bioweapon_mode
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await setBioweaponDefenseMode(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function setBioweaponDefenseMode(
  client: TessieClient,
  params: SetBioweaponDefenseModeParams
): Promise<any> {
  return await client.request(
    "GET",
    "/{vin}/command/set_bioweapon_mode",
    params
  );
}

/**
 * Sets the climate keeper mode.
 *
 * This function configures the climate keeper mode, which maintains cabin
 * temperature when the vehicle is parked (Keep Mode, Dog Mode, or Camp Mode).
 *
 * @summary Set climate keeper mode
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {SetClimateKeeperModeParams} params - Parameters including VIN, mode, and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/set_climate_keeper_mode
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await setClimateKeeperMode(client, {
 *   vin: 'YOUR_VIN',
 *   mode: ClimateKeeperMode.DOG_MODE
 * });
 * ```
 */
export async function setClimateKeeperMode(
  client: TessieClient,
  params: SetClimateKeeperModeParams
): Promise<any> {
  return await client.request(
    "GET",
    "/{vin}/command/set_climate_keeper_mode",
    params
  );
}

/**
 * Sets cabin overheat protection.
 *
 * This function enables or disables cabin overheat protection, which
 * automatically cools the cabin when temperatures exceed safe levels.
 *
 * @summary Set cabin overheat protection
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {SetCabinOverheatProtectionParams} params - Parameters including VIN, on/off state, and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/set_cabin_overheat_protection
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await setCabinOverheatProtection(client, {
 *   vin: 'YOUR_VIN',
 *   on: true
 * });
 * ```
 */
export async function setCabinOverheatProtection(
  client: TessieClient,
  params: SetCabinOverheatProtectionParams
): Promise<any> {
  return await client.request(
    "GET",
    "/{vin}/command/set_cabin_overheat_protection",
    params
  );
}
