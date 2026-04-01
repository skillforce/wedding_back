import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserProfilesRepository } from '../../infra/user-profiles.repository';
import { UpdateProfileInputDto } from '../../api/input-dto/update-profile.input-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { ProfileViewDto } from '../../api/view-dto/profile.view-dto';

export class UpdateProfileCommand {
  constructor(
    public readonly userId: number,
    public readonly dto: UpdateProfileInputDto,
  ) {}
}

@CommandHandler(UpdateProfileCommand)
export class UpdateProfileUseCase
  implements ICommandHandler<UpdateProfileCommand, ProfileViewDto>
{
  constructor(
    private readonly userProfilesRepository: UserProfilesRepository,
  ) {}

  async execute({ userId, dto }: UpdateProfileCommand): Promise<ProfileViewDto> {
    const profile = await this.userProfilesRepository.findByUserId(userId);

    if (!profile) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'profile not found',
      });
    }

    const fields: Parameters<UserProfilesRepository['update']>[1] = {};

    if (dto.invitationUrl !== undefined) fields.invitationUrl = dto.invitationUrl;
    if (dto.weddingDate !== undefined) fields.weddingDate = new Date(dto.weddingDate);
    if (dto.phoneNumber !== undefined) fields.phoneNumber = dto.phoneNumber;
    if (dto.email !== undefined) fields.email = dto.email;

    await this.userProfilesRepository.update(userId, fields);

    const updated = await this.userProfilesRepository.findByUserId(userId);
    return ProfileViewDto.mapToViewDto(updated!);
  }
}