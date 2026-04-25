import { Module } from "@nestjs/common";
import { Agent1Module } from "../agent1/agent1.module";
import { Agent2Module } from "../agent2/agent2.module";
import { Agent3Module } from "../agent3/agent3.module";
import { MemoryModule } from "../memory/memory.module";
import { SearchController } from "./search.controller";
import { SearchService } from "./search.service";

@Module({
  imports: [Agent1Module, Agent2Module, Agent3Module, MemoryModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
