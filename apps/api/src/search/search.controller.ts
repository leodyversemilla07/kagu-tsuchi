import {
  Body,
  Controller,
  Header,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from "@nestjs/common";
import { Observable } from "rxjs";
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

  @Post("stream")
  @HttpCode(HttpStatus.OK)
  @Header("Content-Type", "text/event-stream")
  conductResearchStream(@Body() queryDto: QueryDto): Observable<string> {
    this.logger.log(
      `Received streaming research request for: ${queryDto.query}`
    );
    return this.searchService.conductResearchStream(queryDto);
  }
}
