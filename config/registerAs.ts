import { Logger } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ConfigFactory, ConfigObject, registerAs } from '@nestjs/config';

export type ClassType<T> = new (...args: any[]) => T;

const validator = <T extends Object>(
  content: any,
  schema: ClassType<T>,
  name: string,
) => {
  const exception = new ValidationPipe().createExceptionFactory();
  const logger = (errorList: string[]) => {
    errorList.unshift(`Environment variables group ${name.toUpperCase()} \n`);

    Logger.error(errorList.join(`\n ===>  `), 'ENV Validator');
  };

  const validatedConfig = plainToInstance(schema, content, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const { message } = (exception(errors) as any).response;

    logger(message);
    process.exit();
  }
};

export default <T extends Object>(
  name: string,
  schema: ClassType<T>,
  configFactory: ConfigFactory<ConfigObject>,
) => {
  return registerAs(name, () => {
    const config = configFactory();

    validator(config, schema, name);
    return config;
  });
};
