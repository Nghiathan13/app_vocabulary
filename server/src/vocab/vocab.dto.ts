import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class VocabWordDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  word!: string;

  @IsOptional()
  @IsString()
  ipa?: string | null;

  @IsOptional()
  @IsString()
  type?: string | null;

  @IsString()
  meaning_vi!: string;

  @IsOptional()
  @IsString()
  definition?: string | null;

  @IsOptional()
  @IsString()
  example?: string | null;

  @IsOptional()
  @IsString()
  band?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  level?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  wrong_count?: number;

  @IsOptional()
  @IsString()
  last_review?: string | null;

  @IsOptional()
  @IsString()
  next_review?: string | null;

  @IsOptional()
  @IsString()
  updated_at?: string;

  @IsOptional()
  @IsString()
  deleted_at?: string | null;
}

export class SyncVocabularyDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VocabWordDto)
  changes!: VocabWordDto[];
}
