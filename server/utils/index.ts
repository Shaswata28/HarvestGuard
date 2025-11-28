export {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  AuthenticationError,
  handleZodError,
  handleDatabaseError,
  formatErrorResponse,
  logError
} from './errors';

export type { ErrorResponse } from './errors';

export { hashPassword, verifyPassword } from './password';

export {
  OpenWeatherClient,
  OpenWeatherError,
  getOpenWeatherClient,
  resetOpenWeatherClient
} from './openweather.client';

export type {
  OpenWeatherClientConfig,
  OpenWeatherCurrentResponse,
  OpenWeatherForecastResponse,
  OpenWeatherCoordinates,
  OpenWeatherMain,
  OpenWeatherWeather,
  OpenWeatherWind,
  OpenWeatherClouds,
  OpenWeatherRain,
  OpenWeatherSnow,
  OpenWeatherSys,
  OpenWeatherForecastItem,
  OpenWeatherErrorResponse
} from './openweather.client';

export {
  isValidBangladeshCoordinates,
  getCoordinatesForLocation,
  roundCoordinates,
  validateAndSanitizeCoordinates,
  getAvailableDivisions,
  getDistrictsForDivision,
  getUpazilasForDistrict,
  generateLocationCacheKey
} from './location';

export type { Coordinates } from '../data/bangladesh-locations';

export {
  validateImage,
  compressImage,
  convertToBase64,
  processImageForAPI,
  SUPPORTED_FORMATS,
  MAX_IMAGE_SIZE,
  TARGET_COMPRESSED_SIZE
} from './imageProcessing';

export type { ImageValidationResult } from './imageProcessing';
