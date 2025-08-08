import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';

export const DATABASE_CONFIG: TypeOrmModuleAsyncOptions = {
  useFactory: (configService: ConfigService) => ({
    type: 'mariadb',
    host: configService.getOrThrow('DB_HOST'),
    port: parseInt(configService.getOrThrow('DB_PORT')),
    username: configService.getOrThrow('DB_USERNAME'),
    password: configService.getOrThrow('DB_PASSWORD'),
    database: configService.getOrThrow('DB_DATABASE'),
    entities: [
      __dirname.includes('dist')
        ? 'dist/**/*.entity{.ts,.js}'
        : '**/*.entity{.ts,.js}',
    ],
    synchronize: true,
  }),
  inject: [ConfigService],
};
