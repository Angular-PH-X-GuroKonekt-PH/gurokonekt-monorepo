import { Injectable } from '@nestjs/common';

@Injectable()
export class UtilsService {
  getUserCredentialsSelect() {
    return {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      suffix: true,
      email: true,
      phoneNumber: true,
      country: true,
      language: true,
      timezone: true,
      isProfileComplete: true,
      isMentorApproved: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      updatedBy: { select: { id: true, firstName: true, lastName: true } }
    };
  }
}
