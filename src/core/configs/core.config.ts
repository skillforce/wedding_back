import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { configValidationUtility } from '../helpers/config-validation.utility';

export enum Environments {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TESTING = 'testing',
}

@Injectable()
export class CoreConfig {
  @IsNumber(
    {},
    {
      message: 'Set Env variable PORT, example: 3000',
    },
  )
  port: number;

  @IsEnum(Environments, {
    message: `Set correct NODE_ENV value, available values: ${configValidationUtility.getEnumValues(Environments).join(', ')}`,
  })
  env: Environments;

  @IsBoolean({
    message:
      'Set Env variable IS_SWAGGER_ENABLED to enable/disable Swagger, example: true, false',
  })
  isSwaggerEnabled: boolean;

  @IsBoolean({
    message:
      'Set Env variable INCLUDE_TESTING_MODULE to enable/disable Dangerous for production TestingModule, example: true, false, 0, 1',
  })
  includeTestingModule: boolean;

  @IsNotEmpty({
    message: 'Set Env variable EXCHANGE_RATE_API_KEY, get it from https://www.exchangerate-api.com/',
  })
  exchangeRateApiKey: string;

  @IsNotEmpty({
    message: 'Set Env variable EXCHANGE_RATE_BASE_URL, example: https://v6.exchangerate-api.com/v6',
  })
  exchangeRateBaseUrl: string;

  @IsNotEmpty({
    message: 'Set Env variable EXCHANGE_RATE_BASE_CURRENCY, example: USD',
  })
  exchangeRateBaseCurrency: string;

  constructor(private configService: ConfigService<object, true>) {
    this.port = Number(this.configService.get('PORT'));
    this.env = this.configService.get('NODE_ENV');

    this.isSwaggerEnabled = configValidationUtility.convertToBoolean(
      this.configService.get('IS_SWAGGER_ENABLED'),
    ) as boolean;
    this.includeTestingModule = configValidationUtility.convertToBoolean(
      this.configService.get('INCLUDE_TESTING_MODULE'),
    ) as boolean;

    this.exchangeRateApiKey = this.configService.get('EXCHANGE_RATE_API_KEY');
    this.exchangeRateBaseUrl = this.configService.get('EXCHANGE_RATE_BASE_URL');
    this.exchangeRateBaseCurrency = this.configService.get('EXCHANGE_RATE_BASE_CURRENCY');

    // Validate after all assignments
    configValidationUtility.validateConfig(this);
  }
}
