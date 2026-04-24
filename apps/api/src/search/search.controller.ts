import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { SearchService } from './search.service';
import { QueryDto } from '../agent1/dto/query.dto';

@Controller('research')
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(private readonly searchService: SearchService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async conductResearch(@Body() queryDto: QueryDto) {
    this.logger.log(`Received research request for: ${queryDto.query}`);
    return this.searchService.conductResearch(queryDto);
  }
}
