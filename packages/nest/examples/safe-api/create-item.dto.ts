import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsString, MaxLength, Min, MinLength } from "class-validator";

export class CreateItemDto {
  @ApiProperty({ example: "widget" })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(0)
  quantity!: number;
}
