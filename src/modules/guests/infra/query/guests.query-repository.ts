import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Guest } from '../../domain/enteties/guest.entity';
import { In, Repository } from 'typeorm';
import { GuestsViewDto } from '../../api/view-dto/guests.view-dto';
import { GuestDetailViewDto } from '../../api/view-dto/guest-detail.view-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class GuestsQueryRepository {
  constructor(
    @InjectRepository(Guest)
    private readonly guestsOrmRepository: Repository<Guest>,
  ) {}

  async findOneByIdOrFail(guestId: string) {
    const guest = await this.guestsOrmRepository.findOne({
      where: { id: guestId },
      relations: ['response', 'guestForm'],
    });

    if (!guest) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Guest not found',
      });
    }

    return guest;
  }

  async findAllGuestsByUserId(userId: number): Promise<GuestDetailViewDto[]> {
    const guests = await this.guestsOrmRepository.find({
      where: { user_id: userId },
      relations: ['response', 'guestForm'],
    });
    if (!guests.length) {
      return [];
    }
    return guests.map(GuestDetailViewDto.mapToDetailViewDto);
  }

  async findGuestsById(guestId: string): Promise<GuestsViewDto> {
    const guest = await this.findOneByIdOrFail(guestId);
    return GuestsViewDto.mapToViewDto(guest);
  }

  async findGuestDetailById(guestId: string): Promise<GuestDetailViewDto> {
    const guest = await this.findOneByIdOrFail(guestId);
    return GuestDetailViewDto.mapToDetailViewDto(guest);
  }

  async findGuestDetailsByIds(ids: string[]): Promise<GuestDetailViewDto[]> {
    const guests = await this.guestsOrmRepository.find({
      where: { id: In(ids) },
      relations: ['response', 'guestForm'],
    });
    return guests.map(GuestDetailViewDto.mapToDetailViewDto);
  }
}
