import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Agent3Service } from "./agent3.service";

@Module({
  imports: [ConfigModule],
  providers: [Agent3Service],
  exports: [Agent3Service],
})
export class Agent3Module {}
