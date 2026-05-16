export class CreateNoteDto {
	title?: string;
	content?: string;
	userEmail?: string;
	userName?: string;
	isArchived?: boolean;
	isPublic?: boolean;
	tags?: string[];
}
