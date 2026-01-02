import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto, ListUsersDto, ArchiveUserDto } from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ProfileType } from '@gurokonekt/models';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const user = await this.prisma.db.user.create({
      data: createUserDto,
    });

    // If a profile type is specified, create an empty profile
    if (createUserDto.profileType === ProfileType.MENTEE) {
      await this.prisma.db.menteeProfile.create({
        data: {
          userId: user.id,
          shortBio: '',
          learningGoals: '',
          areasOfInterest: [],
          preferredSessionType: 'online',
          completed: false,
        },
      });
    } else if (createUserDto.profileType === ProfileType.MENTOR) {
      await this.prisma.db.mentorProfile.create({
        data: {
          userId: user.id,
          expertiseAreas: [],
          yearsOfExperience: 0,
          linkedInUrl: '',
          professionalBio: '',
          additionalSkills: [],
          isProfileCompleted: false,
        },
      });
    }

    return user;
  }

  async findAll(listUsersDto?: ListUsersDto) {
    const { limit = 10, offset = 0, search, includeArchived = false, sortBy = 'createdAt', sortOrder = 'DESC' } = listUsersDto || {};
    
    const where: Prisma.UserWhereInput = {};
    
    if (!includeArchived) {
      where.isArchived = false;
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.db.user.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
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

  async archive(id: string, archiveUserDto?: ArchiveUserDto) {
    await this.ensureExistsAndNotArchived(id);

    const data: Prisma.UserUpdateInput = {
      isArchived: archiveUserDto?.isArchived ?? true,
    };
    
    if (archiveUserDto?.archivedAt) {
      data.archivedAt = archiveUserDto.archivedAt;
    } else if (archiveUserDto?.isArchived) {
      data.archivedAt = new Date();
    }

    return this.prisma.db.user.update({
      where: { id },
      data,
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