import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from '../domain/entities/user-profile.entity';

@Injectable()
export class UserProfilesRepository {
  constructor(
    @InjectRepository(UserProfile)
    private readonly profilesOrmRepository: Repository<UserProfile>,
  ) {}

  async save(profile: Omit<UserProfile, 'id' | 'user'>): Promise<UserProfile> {
    return this.profilesOrmRepository.save(profile);
  }

  async findByUserId(userId: number): Promise<UserProfile | null> {
    return this.profilesOrmRepository.findOneBy({ userId });
  }

  async update(
    userId: number,
    fields: Partial<
      Pick<
        UserProfile,
        | 'invitationUrl'
        | 'profileImg'
        | 'weddingDate'
        | 'email'
        | 'dailyImageUploadCount'
        | 'imageUploadResetDate'
      >
    >,
  ): Promise<void> {
    await this.profilesOrmRepository.update({ userId }, fields);
  }
}