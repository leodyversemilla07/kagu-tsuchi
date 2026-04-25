import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class SearchQueryDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  queries: string[];

  @IsNumber()
  @Min(1)
  @Max(20)
  maxSearches: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  priorityDomains?: string[];

  @IsOptional()
  deepThink?: boolean;

  @IsOptional()
  @IsString()
  pastContext?: string;
}

export class SearchResultDto {
  @IsString()
  title: string;

  @IsString()
  url: string;

  @IsString()
  snippet: string;

  @IsOptional()
  @IsString()
  publishedDate?: string;

  @IsOptional()
  @IsNumber()
  score?: number;
}
