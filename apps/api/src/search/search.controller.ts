import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from "@nestjs/common";
import { QueryDto } from "../agent1/dto/query.dto";
import { SearchService } from "./search.service";

@Controller("search")
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
