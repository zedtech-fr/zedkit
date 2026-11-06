import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";

/** Minimal env validated at boot (tutorial fixture). */
export class TutorialEnv {
  @IsString()
  @MinLength(1)
  TUTORIAL_TOKEN!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  PORT: number = 3000;
}
