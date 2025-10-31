/**
 * Vehicle state module for the Tessie API.
 *
 * This module contains all functions related to retrieving current vehicle
 * state and information, including location, weather, and maps.
 *
 * @module state
 */

import { TessieClient } from "./TessieClient";
import {
  GetStateParams,
  GetStateOfAllVehiclesParams,
  GetLocationParams,
  GetWeatherParams,
  GetMapParams,
} from "./types";

/**
 * Retrieves the current state of a vehicle.
 *
 * This function returns comprehensive real-time information about the vehicle
 * including battery level, location, climate status, and more.
 *
 * @summary Get current state
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {GetStateParams} params - Parameters including VIN and cache options
 * @returns {Promise<any>} Current vehicle state object
 * @throws {Error} If the API request fails
 * @see GET /{vin}/state
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const state = await getState(client, {
 *   vin: 'YOUR_VIN',
 *   use_cache: false
 * });
 * ```
 */
export async function getState(
  client: TessieClient,
  params: GetStateParams
): Promise<any> {
  return await client.request("GET", "/{vin}/state", params);
}

/**
 * Retrieves the current state of all vehicles associated with the account.
 *
 * This function returns state information for all vehicles linked to the
 * authenticated account, optionally filtering for only active vehicles.
 *
 * @summary Get state of all vehicles
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {GetStateOfAllVehiclesParams} params - Parameters including active filter
 * @returns {Promise<any>} Array of vehicle state objects
 * @throws {Error} If the API request fails
 * @see GET /vehicles
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const vehicles = await getStateOfAllVehicles(client, {
 *   only_active: true
 * });
 * ```
 */
export async function getStateOfAllVehicles(
  client: TessieClient,
  params: GetStateOfAllVehiclesParams
): Promise<any> {
  return await client.request("GET", "/vehicles", params);
}

/**
 * Retrieves the current location of a vehicle.
 *
 * This function returns the vehicle's current GPS coordinates and
 * heading information.
 *
 * @summary Get vehicle location
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {GetLocationParams} params - Parameters including VIN
 * @returns {Promise<any>} Location data with coordinates
 * @throws {Error} If the API request fails
 * @see GET /{vin}/location
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const location = await getLocation(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function getLocation(
  client: TessieClient,
  params: GetLocationParams
): Promise<any> {
  return await client.request("GET", "/{vin}/location", params);
}

/**
 * Retrieves weather information at the vehicle's location.
 *
 * This function returns current weather conditions at the vehicle's
 * present location.
 *
 * @summary Get weather at vehicle location
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {GetWeatherParams} params - Parameters including VIN
 * @returns {Promise<any>} Weather data object
 * @throws {Error} If the API request fails
 * @see GET /{vin}/weather
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const weather = await getWeather(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function getWeather(
  client: TessieClient,
  params: GetWeatherParams
): Promise<any> {
  return await client.request("GET", "/{vin}/weather", params);
}

/**
 * Retrieves a map image showing the vehicle's location.
 *
 * This function returns a map visualization centered on the vehicle's
 * current location with customizable dimensions and styling.
 *
 * @summary Get vehicle location map
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {GetMapParams} params - Parameters including VIN and map display options
 * @returns {Promise<any>} Map image data
 * @throws {Error} If the API request fails
 * @see GET /{vin}/map
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const map = await getMap(client, {
 *   vin: 'YOUR_VIN',
 *   width: 600,
 *   height: 400,
 *   zoom: 15,
 *   style: MapStyle.DARK
 * });
 * ```
 */
export async function getMap(
  client: TessieClient,
  params: GetMapParams
): Promise<any> {
  return await client.request("GET", "/{vin}/map", params);
}
