/**
 * Door locks module for the Tessie API.
 *
 * This module contains all functions related to locking and unlocking
 * vehicle doors.
 *
 * @module doors
 */

import { TessieClient } from "./TessieClient";
import { LockParams, UnlockParams } from "./types";

/**
 * Locks the vehicle doors.
 *
 * This function sends a command to lock all vehicle doors. The command
 * can wait for completion or return immediately.
 *
 * @summary Lock vehicle doors
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {LockParams} params - Parameters including VIN and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/lock
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await lock(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function lock(
  client: TessieClient,
  params: LockParams
): Promise<any> {
  return await client.request("GET", "/{vin}/command/lock", params);
}

/**
 * Unlocks the vehicle doors.
 *
 * This function sends a command to unlock all vehicle doors. The command
 * can wait for completion or return immediately.
 *
 * @summary Unlock vehicle doors
 * @param {TessieClient} client - The authenticated Tessie API client instance
 * @param {UnlockParams} params - Parameters including VIN and command options
 * @returns {Promise<any>} Command acknowledgment response
 * @throws {Error} If the API request fails
 * @see GET /{vin}/command/unlock
 *
 * @example
 * ```typescript
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 * const result = await unlock(client, {
 *   vin: 'YOUR_VIN'
 * });
 * ```
 */
export async function unlock(
  client: TessieClient,
  params: UnlockParams
): Promise<any> {
  return await client.request("GET", "/{vin}/command/unlock", params);
}
