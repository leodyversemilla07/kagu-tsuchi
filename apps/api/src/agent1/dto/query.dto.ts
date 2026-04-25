import { IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class QueryDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  maxSearches?: number;

  @IsOptional()
  deepThink?: boolean;
}
