export class CreateGuestDto {
  guest_name: string;
  preferred_drinks: string[];
  other_preferences?: string;
}
