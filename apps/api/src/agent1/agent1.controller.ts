import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from "@nestjs/common";
import { Agent1Service } from "./agent1.service";
import { QueryDto } from "./dto/query.dto";
import { QueryAnalysisResult } from "./interfaces/search-plan.interface";

@Controller("agent1")
export class Agent1Controller {
  private readonly logger = new Logger(Agent1Controller.name);

  constructor(private readonly agent1Service: Agent1Service) {}

  @Post("analyze")
  @HttpCode(HttpStatus.OK)
  async analyzeQuery(@Body() queryDto: QueryDto): Promise<QueryAnalysisResult> {
    this.logger.log(`Received analyze request: ${queryDto.query}`);
    return this.agent1Service.analyzeQuery(queryDto);
  }
}
