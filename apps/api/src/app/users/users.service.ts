import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const user = await this.prisma.db.user.create({
      data: {
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        middleName: createUserDto.middleName,
        lastName: createUserDto.lastName,
        extensionName: createUserDto.extensionName,
        countryOrTimezone: createUserDto.countryOrTimezone,
        preferredLanguage: createUserDto.preferredLanguage,
        acceptedTerms: createUserDto.acceptedTerms,
        emailVerified: false,
      },
    });

    return user;
  }

  async findAll() {
    return this.prisma.db.user.findMany({
      where: {
        isArchived: false,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.db.user.findFirst({
      where: {
        id,
        isArchived: false,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.ensureExistsAndNotArchived(id);

    return this.prisma.db.user.update({
      where: { id },
      data: {
        ...updateUserDto,
      },
    });
  }

  async archive(id: string) {
    await this.ensureExistsAndNotArchived(id);

    return this.prisma.db.user.update({
      where: { id },
      data: {
        isArchived: true,
        archivedAt: new Date(),
      },
    });
  }

  async remove(id: string) {
    // For now, soft delete on remove
    return this.archive(id);
  }

  private async ensureExistsAndNotArchived(id: string) {
    const user = await this.prisma.db.user.findUnique({
      where: { id },
    });

    if (!user || user.isArchived) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
  }
}
