/**
 * Type definitions for the Tessie API TypeScript client.
 *
 * This module contains all type definitions, enums, and interfaces used
 * throughout the Tessie API client library. Each interface corresponds to
 * the parameters required for a specific API operation.
 *
 * @module types
 */

/**
 * Map style options for location map visualization.
 * @enum {string}
 */
export enum MapStyle {
  /** Light theme map style */
  LIGHT = "light",
  /** Dark theme map style */
  DARK = "dark"
}

/**
 * Distance format for measurements.
 * @enum {string}
 */
export enum DistanceFormat {
  /** Miles */
  MI = "mi",
  /** Kilometers */
  KM = "km"
}

/**
 * Temperature format for climate measurements.
 * @enum {string}
 */
export enum TemperatureFormat {
  /** Celsius */
  C = "c",
  /** Fahrenheit */
  F = "f"
}

/**
 * Response format for API results.
 * @enum {string}
 */
export enum Format {
  /** JSON format */
  JSON = "json",
  /** CSV format */
  CSV = "csv"
}

/**
 * Vehicle seat positions.
 * @enum {string}
 */
export enum Seat {
  /** All seats */
  ALL = "all",
  /** Front left seat */
  FRONT_LEFT = "front_left",
  /** Front right seat */
  FRONT_RIGHT = "front_right",
  /** Rear left seat */
  REAR_LEFT = "rear_left",
  /** Rear center seat */
  REAR_CENTER = "rear_center",
  /** Rear right seat */
  REAR_RIGHT = "rear_right",
  /** Third row left seat */
  THIRD_ROW_LEFT = "third_row_left",
  /** Third row right seat */
  THIRD_ROW_RIGHT = "third_row_right"
}

/**
 * Climate keeper mode options.
 * @enum {number}
 */
export enum ClimateKeeperMode {
  /** Disable climate keeper */
  DISABLE = 0,
  /** Keep mode - maintains temperature */
  KEEP_MODE = 1,
  /** Dog mode - keeps climate for pets */
  DOG_MODE = 2,
  /** Camp mode - maintains climate for camping */
  CAMP_MODE = 3
}

// ============================================================================
// Battery
// ============================================================================

/**
 * Parameters for getting battery information.
 * @interface GetBatteryParams
 */
export interface GetBatteryParams {
  /** Vehicle Identification Number */
  vin: string;
}

// ============================================================================
// Battery Health
// ============================================================================

/**
 * Parameters for getting battery health information.
 * @interface GetBatteryHealthParams
 */
export interface GetBatteryHealthParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Start timestamp (Unix) */
  from: number;
  /** End timestamp (Unix) */
  to: number;
  /** Distance format (miles or kilometers) */
  distance_format?: DistanceFormat;
}

// ============================================================================
// Boombox
// ============================================================================

/**
 * Parameters for triggering remote boombox.
 * @interface BoomboxParams
 */
export interface BoomboxParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: string;
}

// ============================================================================
// Charging
// ============================================================================

/**
 * Parameters for starting charging.
 * @interface StartChargingParams
 */
export interface StartChargingParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

/**
 * Parameters for stopping charging.
 * @interface StopChargingParams
 */
export interface StopChargingParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

/**
 * Parameters for setting charge limit.
 * @interface SetChargeLimitParams
 */
export interface SetChargeLimitParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Charge limit percentage */
  percent: number;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

/**
 * Parameters for setting charging amps.
 * @interface SetChargingAmpsParams
 */
export interface SetChargingAmpsParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Charging amperage */
  amps: number;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

/**
 * Parameters for opening and unlocking charge port.
 * @interface OpenUnlockChargePortParams
 */
export interface OpenUnlockChargePortParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

/**
 * Parameters for closing charge port.
 * @interface CloseChargePortParams
 */
export interface CloseChargePortParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

// ============================================================================
// Charges
// ============================================================================

/**
 * Parameters for getting charging history.
 * @interface GetChargesParams
 */
export interface GetChargesParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Origin latitude coordinate */
  origin_latitude: number;
  /** Origin longitude coordinate */
  origin_longitude: number;
  /** Radius around origin in meters */
  origin_radius: number;
  /** Start timestamp (Unix) */
  from: number;
  /** End timestamp (Unix) */
  to: number;
  /** Minimum energy added in kWh */
  minimum_energy_added: number;
  /** Distance format (miles or kilometers) */
  distance_format?: DistanceFormat;
  /** Response format */
  format?: Format;
  /** Filter for superchargers only */
  superchargers_only?: boolean;
  /** Exclude charges at origin */
  exclude_origin?: boolean;
  /** Timezone for timestamps */
  timezone?: string;
}

/**
 * Parameters for setting charge session cost.
 * @interface SetChargeCostParams
 */
export interface SetChargeCostParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Charge session ID */
  charge_id: number;
  /** Cost of charge session */
  cost: number;
}

// ============================================================================
// Climate
// ============================================================================

/**
 * Parameters for starting climate preconditioning.
 * @interface StartClimatePreconditioningParams
 */
export interface StartClimatePreconditioningParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

/**
 * Parameters for stopping climate.
 * @interface StopClimateParams
 */
export interface StopClimateParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

/**
 * Parameters for setting temperature.
 * @interface SetTemperatureParams
 */
export interface SetTemperatureParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Target temperature */
  temperature: number;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

/**
 * Parameters for setting seat heat.
 * @interface SetSeatHeatParams
 */
export interface SetSeatHeatParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Seat position to heat */
  seat: Seat;
  /** Heat level (0-3) */
  level?: number;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

/**
 * Parameters for setting seat cooling.
 * @interface SetSeatCoolParams
 */
export interface SetSeatCoolParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Seat position to cool */
  seat: Seat;
  /** Cooling level (0-3) */
  level?: number;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

/**
 * Parameters for starting defrost.
 * @interface StartDefrostParams
 */
export interface StartDefrostParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

/**
 * Parameters for stopping defrost.
 * @interface StopDefrostParams
 */
export interface StopDefrostParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

/**
 * Parameters for starting steering wheel heater.
 * @interface StartSteeringWheelHeaterParams
 */
export interface StartSteeringWheelHeaterParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

/**
 * Parameters for stopping steering wheel heater.
 * @interface StopSteeringWheelHeaterParams
 */
export interface StopSteeringWheelHeaterParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

/**
 * Parameters for setting bioweapon defense mode.
 * @interface SetBioweaponDefenseModeParams
 */
export interface SetBioweaponDefenseModeParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

/**
 * Parameters for setting climate keeper mode.
 * @interface SetClimateKeeperModeParams
 */
export interface SetClimateKeeperModeParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Climate keeper mode to set */
  mode: ClimateKeeperMode;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

/**
 * Parameters for setting cabin overheat protection.
 * @interface SetCabinOverheatProtectionParams
 */
export interface SetCabinOverheatProtectionParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Enable or disable cabin overheat protection */
  on: boolean;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

// ============================================================================
// State
// ============================================================================

/**
 * Parameters for getting current state.
 * @interface GetStateParams
 */
export interface GetStateParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Whether to use cached state */
  use_cache?: boolean;
}

/**
 * Parameters for getting state of all vehicles.
 * @interface GetStateOfAllVehiclesParams
 */
export interface GetStateOfAllVehiclesParams {
  /** Filter for only active vehicles */
  only_active?: boolean;
}

/**
 * Parameters for getting vehicle location.
 * @interface GetLocationParams
 */
export interface GetLocationParams {
  /** Vehicle Identification Number */
  vin: string;
}

/**
 * Parameters for getting weather at vehicle location.
 * @interface GetWeatherParams
 */
export interface GetWeatherParams {
  /** Vehicle Identification Number */
  vin: string;
}

/**
 * Parameters for getting vehicle location map.
 * @interface GetMapParams
 */
export interface GetMapParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Map width in pixels */
  width?: number;
  /** Map height in pixels */
  height?: number;
  /** Map zoom level */
  zoom?: number;
  /** Marker size in pixels */
  marker_size?: number;
  /** Map style theme */
  style?: MapStyle;
}

// ============================================================================
// Doors
// ============================================================================

/**
 * Parameters for locking vehicle doors.
 * @interface LockParams
 */
export interface LockParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

/**
 * Parameters for unlocking vehicle doors.
 * @interface UnlockParams
 */
export interface UnlockParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

// ============================================================================
// Drives
// ============================================================================

/**
 * Parameters for getting drive history.
 * @interface GetDrivesParams
 */
export interface GetDrivesParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Start timestamp (Unix) */
  from: number;
  /** End timestamp (Unix) */
  toUnix: number;
  /** Origin latitude coordinate */
  origin_latitude: number;
  /** Origin longitude coordinate */
  origin_longitude: number;
  /** Radius around origin in meters */
  origin_radius: number;
  /** Destination latitude coordinate */
  destination_latitude: number;
  /** Destination longitude coordinate */
  destination_longitude: number;
  /** Radius around destination in meters */
  destination_radius: number;
  /** Filter by tag */
  tag: string;
  /** Filter by driver profile */
  driver_profile: string;
  /** Minimum distance threshold */
  minimum_distance: number;
  /** Distance format (miles or kilometers) */
  distance_format?: DistanceFormat;
  /** Temperature format */
  temperature_format?: TemperatureFormat;
  /** Timezone for timestamps */
  timezone?: string;
  /** Exclude drives starting at origin */
  exclude_origin?: boolean;
  /** Exclude drives ending at destination */
  exclude_destination?: boolean;
  /** Exclude drives with specific tag */
  exclude_tag?: boolean;
  /** Exclude drives by specific driver profile */
  exclude_driver_profile?: boolean;
  /** Response format */
  format?: Format;
}

/**
 * Parameters for getting driving path.
 * @interface GetDrivingPathParams
 */
export interface GetDrivingPathParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Start timestamp (Unix) */
  from: number;
  /** End timestamp (Unix) */
  to: number;
}

/**
 * Parameters for setting tag for drives.
 * @interface SetTagParams
 */
export interface SetTagParams {
  /** Vehicle Identification Number */
  vin: string;
  /** List of drive IDs */
  drives: number[];
  /** Tag to set for the drives */
  tag: string;
}

// ============================================================================
// Historical States
// ============================================================================

/**
 * Parameters for getting historical states.
 * @interface GetHistoricalStatesParams
 */
export interface GetHistoricalStatesParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Start timestamp (Unix) */
  from: number;
  /** End timestamp (Unix) */
  to: number;
  /** Interval between states in seconds */
  interval: number;
  /** Condense results */
  condense?: boolean;
  /** Timezone for timestamps */
  timezone?: string;
  /** Distance format (miles or kilometers) */
  distance_format?: DistanceFormat;
  /** Temperature format */
  temperature_format?: TemperatureFormat;
  /** Response format */
  format?: Format;
}

/**
 * Parameters for getting last idle state.
 * @interface GetLastIdleStateParams
 */
export interface GetLastIdleStateParams {
  /** Vehicle Identification Number */
  vin: string;
}

/**
 * Parameters for getting consumption since last charge.
 * @interface GetConsumptionSinceChargeParams
 */
export interface GetConsumptionSinceChargeParams {
  /** Vehicle Identification Number */
  vin: string;
}

// ============================================================================
// Homelink
// ============================================================================

/**
 * Parameters for triggering HomeLink.
 * @interface TriggerHomelinkParams
 */
export interface TriggerHomelinkParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

// ============================================================================
// Horn
// ============================================================================

/**
 * Parameters for honking horn.
 * @interface HonkParams
 */
export interface HonkParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

// ============================================================================
// Idles
// ============================================================================

/**
 * Parameters for getting idle sessions.
 * @interface GetIdlesParams
 */
export interface GetIdlesParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Start timestamp (Unix) */
  from: number;
  /** End timestamp (Unix) */
  to: string;
  /** Origin latitude coordinate */
  origin_latitude: string;
  /** Origin longitude coordinate */
  origin_longitude: string;
  /** Radius around origin in meters */
  origin_radius: string;
  /** Distance format (miles or kilometers) */
  distance_format?: DistanceFormat;
  /** Response format */
  format?: Format;
  /** Timezone for timestamps */
  timezone?: string;
  /** Exclude idles at origin */
  exclude_origin?: boolean;
}

// ============================================================================
// Keyless Driving
// ============================================================================

/**
 * Parameters for enabling keyless driving.
 * @interface EnableKeylessDrivingParams
 */
export interface EnableKeylessDrivingParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

// ============================================================================
// Lights
// ============================================================================

/**
 * Parameters for flashing lights.
 * @interface FlashLightsParams
 */
export interface FlashLightsParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

// ============================================================================
// Scheduling
// ============================================================================

/**
 * Parameters for setting scheduled charging.
 * @interface SetScheduledChargingParams
 */
export interface SetScheduledChargingParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Time in minutes */
  time: number;
  /** Enable scheduled charging */
  enable?: boolean;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

/**
 * Parameters for setting scheduled departure.
 * @interface SetScheduledDepartureParams
 */
export interface SetScheduledDepartureParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Departure time in minutes */
  departure_time: number;
  /** End off-peak time in minutes */
  end_off_peak_time: number;
  /** Enable scheduled departure */
  enable?: boolean;
  /** Enable preconditioning */
  preconditioning_enabled?: boolean;
  /** Enable preconditioning on weekdays only */
  preconditioning_weekdays_only?: boolean;
  /** Enable off-peak charging */
  off_peak_charging_enabled?: boolean;
  /** Enable off-peak charging on weekdays only */
  off_peak_charging_weekdays_only?: boolean;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

// ============================================================================
// Sentry Mode
// ============================================================================

/**
 * Parameters for enabling sentry mode.
 * @interface EnableSentryModeParams
 */
export interface EnableSentryModeParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

/**
 * Parameters for disabling sentry mode.
 * @interface DisableSentryModeParams
 */
export interface DisableSentryModeParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

// ============================================================================
// Share
// ============================================================================

/**
 * Parameters for sharing data to vehicle.
 * @interface ShareParams
 */
export interface ShareParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Value to share */
  value: string;
  /** Locale setting */
  locale?: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

// ============================================================================
// Software
// ============================================================================

/**
 * Parameters for scheduling software update.
 * @interface ScheduleSoftwareUpdateParams
 */
export interface ScheduleSoftwareUpdateParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Delay in seconds */
  in_seconds: number;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

/**
 * Parameters for canceling software update.
 * @interface CancelSoftwareUpdateParams
 */
export interface CancelSoftwareUpdateParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

// ============================================================================
// Speed Limit
// ============================================================================

/**
 * Parameters for setting speed limit.
 * @interface SetSpeedLimitParams
 */
export interface SetSpeedLimitParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Speed limit in MPH */
  mph: number;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

/**
 * Parameters for enabling speed limit.
 * @interface EnableSpeedLimitParams
 */
export interface EnableSpeedLimitParams {
  /** Vehicle Identification Number */
  vin: string;
  /** PIN for speed limit */
  pin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

/**
 * Parameters for disabling speed limit.
 * @interface DisableSpeedLimitParams
 */
export interface DisableSpeedLimitParams {
  /** Vehicle Identification Number */
  vin: string;
  /** PIN for speed limit */
  pin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

/**
 * Parameters for clearing speed limit PIN.
 * @interface ClearSpeedLimitPinParams
 */
export interface ClearSpeedLimitPinParams {
  /** Vehicle Identification Number */
  vin: string;
  /** PIN to clear */
  pin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

// ============================================================================
// Status
// ============================================================================

/**
 * Parameters for getting vehicle status.
 * @interface GetStatusParams
 */
export interface GetStatusParams {
  /** Vehicle Identification Number */
  vin: string;
}

// ============================================================================
// Sunroof
// ============================================================================

/**
 * Parameters for venting sunroof.
 * @interface VentSunroofParams
 */
export interface VentSunroofParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

/**
 * Parameters for closing sunroof.
 * @interface CloseSunroofParams
 */
export interface CloseSunroofParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

// ============================================================================
// Tire Pressure
// ============================================================================

/**
 * Parameters for getting tire pressure.
 * @interface GetTirePressureParams
 */
export interface GetTirePressureParams {
  /** Vehicle Identification Number */
  vin: string;
}

// ============================================================================
// Trunks
// ============================================================================

/**
 * Parameters for opening front trunk.
 * @interface OpenFrontTrunkParams
 */
export interface OpenFrontTrunkParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

/**
 * Parameters for opening or closing rear trunk.
 * @interface OpenCloseRearTrunkParams
 */
export interface OpenCloseRearTrunkParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

// ============================================================================
// Valet Mode
// ============================================================================

/**
 * Parameters for enabling valet mode.
 * @interface EnableValetModeParams
 */
export interface EnableValetModeParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

/**
 * Parameters for disabling valet mode.
 * @interface DisableValetModeParams
 */
export interface DisableValetModeParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

// ============================================================================
// Wake
// ============================================================================

/**
 * Parameters for waking vehicle.
 * @interface WakeParams
 */
export interface WakeParams {
  /** Vehicle Identification Number */
  vin: string;
}

// ============================================================================
// Windows
// ============================================================================

/**
 * Parameters for venting windows.
 * @interface VentWindowsParams
 */
export interface VentWindowsParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}

/**
 * Parameters for closing windows.
 * @interface CloseWindowsParams
 */
export interface CloseWindowsParams {
  /** Vehicle Identification Number */
  vin: string;
  /** Duration to retry the command in seconds */
  retry_duration?: number;
  /** Whether to wait for command completion */
  wait_for_completion?: boolean;
}
