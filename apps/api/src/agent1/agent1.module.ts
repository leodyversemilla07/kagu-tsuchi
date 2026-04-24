import { Module } from '@nestjs/common';
import { Agent1Service } from './agent1.service';
import { Agent1Controller } from './agent1.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [Agent1Controller],
  providers: [Agent1Service],
  exports: [Agent1Service],
})
export class Agent1Module {}
