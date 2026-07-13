import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateParametresDto } from './dto/update-parametres.dto';

const SINGLETON_ID = 1;

@Injectable()
export class ParametresService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    const existing = await this.prisma.parametrePlateforme.findUnique({
      where: { id: SINGLETON_ID },
    });
    if (existing) return existing;

    return this.prisma.parametrePlateforme.create({
      data: { id: SINGLETON_ID },
    });
  }

  async update(dto: UpdateParametresDto) {
    await this.get(); // s'assure que la ligne existe
    return this.prisma.parametrePlateforme.update({
      where: { id: SINGLETON_ID },
      data: dto,
    });
  }
}
