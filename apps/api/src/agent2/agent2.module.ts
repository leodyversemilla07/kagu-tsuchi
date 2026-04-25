import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Agent2Controller } from "./agent2.controller";
import { Agent2Service } from "./agent2.service";

@Module({
  imports: [ConfigModule],
  controllers: [Agent2Controller],
  providers: [Agent2Service],
  exports: [Agent2Service],
})
export class Agent2Module {}
