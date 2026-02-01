import { Guest } from '../../domain/enteties/guest.entity';

export class GuestsViewDto {
  id: number;
  name: string;
  preferred_drinks: string[];
  other_preferences?: string;

  static mapToViewDto(guest: Guest): GuestsViewDto {
    const dto = new GuestsViewDto();

    dto.id = guest.id;
    dto.name = guest.guest_name;
    dto.preferred_drinks = guest.preferred_drinks;
    dto.other_preferences = guest.other_preferences;
    return dto;
  }
}
