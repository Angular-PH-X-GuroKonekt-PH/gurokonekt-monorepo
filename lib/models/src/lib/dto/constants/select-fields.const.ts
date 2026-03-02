export class SelectFields {
  static getUserCredentialsSelect() {
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
      isMentorProfileComplete: true,
      isMentorApproved: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      avatarAttachments: { select: this.getAvatarAttachmentSelect() },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      updatedBy: { select: { id: true, firstName: true, lastName: true } }
    };
  }

  static getMentorProfileSelect() {
    return {
      id: true,
      areasOfExpertise: true,
      yearsOfExperience: true,
      linkedInUrl: true,
      bio: true,
      skills: true,
      sessionRate: true,
      availability: true,
      updatedAt: true,
      user: { select: this.getUserCredentialsSelect() },
      updatedBy: { select: { id: true, firstName: true, lastName: true } }
    }
  }

  static getMenteeProfileSelect() {
    return {
      id: true,
      bio: true,
      learningGoals: true,
      areasOfInterest: true,
      preferredSessionType: true,
      availability: true,
      updatedAt: true,
      user: { select: this.getUserCredentialsSelect() },
      updatedBy: { select: { id: true, firstName: true, lastName: true } }
    }
  }

  static getAvatarAttachmentSelect() {
    return {
      id: true,
      userId: true,
      bucketName: true,
      storagePath: true,
      publicUrl: true,
      fileType: true,
      fileSize: true,
      fileName: true
    }
  }

  static getDocumentAttachmentSelect() {
    return {
      id: true,
      userId: true,
      bucketName: true,
      storagePath: true,
      publicUrl: true,
      fileType: true,
      fileSize: true,
      fileName: true
    }
  }

  static getMentorSearchSelect() {
    return {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      suffix: true,
      email: true,
      country: true,
      timezone: true,
      language: true,
      isMentorApproved: true,
      isMentorProfileComplete: true,
      createdAt: true,
      avatarAttachments: {
        select: { publicUrl: true, fileName: true },
      },
      mentorProfiles: {
        select: {
          id: true,
          areasOfExpertise: true,
          yearsOfExperience: true,
          bio: true,
          skills: true,
          sessionRate: true,
          availability: true,
          linkedInUrl: true,
          updatedAt: true,
        },
      },
    }
  }
}