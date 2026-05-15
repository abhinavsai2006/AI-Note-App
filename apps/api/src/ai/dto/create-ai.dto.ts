import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

type ChatRole = 'system' | 'user' | 'assistant';

export class CreateAiMessageDto {
	@IsString()
	role!: ChatRole;

	@IsString()
	content!: string;
}

export class CreateAiDto {
	@IsOptional()
	@IsString()
	prompt?: string;

	@IsOptional()
	@IsString()
	model?: string;

	@IsOptional()
	@IsString()
	system?: string;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Max(2)
	temperature?: number;

	@IsOptional()
	@IsBoolean()
	stream?: boolean;

	@IsOptional()
	@IsArray()
	messages?: CreateAiMessageDto[];
}
