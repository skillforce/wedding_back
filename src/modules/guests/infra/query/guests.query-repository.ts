import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Guest } from '../../domain/enteties/guest.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GuestsQueryRepository {
  constructor(
    @InjectRepository(Guest)
    private readonly guestsOrmRepository: Repository<Guest>,
  ) {}

  async findAllGuests() {
    return this.guestsOrmRepository.find();
  }
}
