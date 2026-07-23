import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { TenantsModule } from './tenants/tenants.module';
import { EmployeesModule } from './employees/employees.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, TenantsModule, EmployeesModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
