/**
 * Tessie API TypeScript Client Library
 *
 * A complete, modular TypeScript implementation for the Tessie API.
 * This library provides strongly-typed access to all Tessie API endpoints
 * with comprehensive documentation for AI agent consumption.
 *
 * @module tessie-api
 *
 * @example
 * ```typescript
 * import { TessieClient, getState, startCharging } from './src_typescript';
 *
 * // Initialize the client
 * const client = new TessieClient({ apiKey: 'your-api-key' });
 *
 * // Get vehicle state
 * const state = await getState(client, { vin: 'YOUR_VIN' });
 *
 * // Start charging
 * const result = await startCharging(client, { vin: 'YOUR_VIN' });
 * ```
 */

// Export the main client
export { TessieClient, TessieClientConfig } from "./TessieClient";

// Export all type definitions and enums
export * from "./types";

// Export battery functions
export { getBattery } from "./battery";

// Export battery health functions
export { getBatteryHealth } from "./battery_health";

// Export boombox functions
export { boombox } from "./boombox";

// Export charging functions
export {
  startCharging,
  stopCharging,
  setChargeLimit,
  setChargingAmps,
  openUnlockChargePort,
  closeChargePort,
} from "./charging";

// Export charges functions
export { getCharges, setChargeCost } from "./charges";

// Export climate functions
export {
  startClimatePreconditioning,
  stopClimate,
  setTemperature,
  setSeatHeat,
  setSeatCool,
  startDefrost,
  stopDefrost,
  startSteeringWheelHeater,
  stopSteeringWheelHeater,
  setBioweaponDefenseMode,
  setClimateKeeperMode,
  setCabinOverheatProtection,
} from "./climate";

// Export state functions
export {
  getState,
  getStateOfAllVehicles,
  getLocation,
  getWeather,
  getMap,
} from "./state";

// Export doors functions
export { lock, unlock } from "./doors";

// Export drives functions
export { getDrives, getDrivingPath, setTag } from "./drives";

// Export historical states functions
export {
  getHistoricalStates,
  getLastIdleState,
  getConsumptionSinceCharge,
} from "./historical_states";

// Export homelink functions
export { triggerHomelink } from "./homelink";

// Export horn functions
export { honk } from "./horn";

// Export idles functions
export { getIdles } from "./idles";

// Export keyless driving functions
export { enableKeylessDriving } from "./keyless_driving";

// Export lights functions
export { flashLights } from "./lights";

// Export scheduling functions
export { setScheduledCharging, setScheduledDeparture } from "./scheduling";

// Export sentry mode functions
export { enableSentryMode, disableSentryMode } from "./sentry_mode";

// Export share functions
export { share } from "./share";

// Export software functions
export { scheduleSoftwareUpdate, cancelSoftwareUpdate } from "./software";

// Export speed limit functions
export {
  setSpeedLimit,
  enableSpeedLimit,
  disableSpeedLimit,
  clearSpeedLimitPin,
} from "./speed_limit";

// Export status functions
export { getStatus } from "./status";

// Export sunroof functions
export { ventSunroof, closeSunroof } from "./sunroof";

// Export tire pressure functions
export { getTirePressure } from "./tire_pressure";

// Export trunks functions
export { openFrontTrunk, openCloseRearTrunk } from "./trunks";

// Export valet mode functions
export { enableValetMode, disableValetMode } from "./valet_mode";

// Export wake functions
export { wake } from "./wake";

// Export windows functions
export { ventWindows, closeWindows } from "./windows";
