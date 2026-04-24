import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { Agent2Service } from './agent2.service';
import { SearchQueryDto } from './dto/search.dto';
import { SearchExecutionResult } from './interfaces/search-result.interface';

@Controller('agent2')
export class Agent2Controller {
  private readonly logger = new Logger(Agent2Controller.name);

  constructor(private readonly agent2Service: Agent2Service) {}

  @Post('search')
  @HttpCode(HttpStatus.OK)
  async executeSearch(@Body() searchDto: SearchQueryDto): Promise<SearchExecutionResult> {
    this.logger.log(`Received search request with ${searchDto.queries.length} queries`);
    return this.agent2Service.executeSearch(searchDto);
  }
}
