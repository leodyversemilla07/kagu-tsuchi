import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Agent1Controller } from "./agent1.controller";
import { Agent1Service } from "./agent1.service";

@Module({
  imports: [ConfigModule],
  controllers: [Agent1Controller],
  providers: [Agent1Service],
  exports: [Agent1Service],
})
export class Agent1Module {}
