import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DBConfig } from './configs/db.config';
import { CoreConfig } from "./configs/core.config";

@Global()
@Module({
    imports: [CqrsModule],
    exports: [CoreConfig, CqrsModule, DBConfig],
    providers: [CoreConfig, DBConfig],
})
export class CoreModule {}
