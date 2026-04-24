import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { Agent1Module } from '../agent1/agent1.module';
import { Agent2Module } from '../agent2/agent2.module';

@Module({
  imports: [Agent1Module, Agent2Module],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
