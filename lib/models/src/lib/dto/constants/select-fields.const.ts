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
      title: true,
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

  static getMenteeProfileOnlySelect() {
    return {
      id: true,
      bio: true,
      learningGoals: true,
      areasOfInterest: true,
      preferredSessionType: true,
      updatedAt: true,
      updatedBy: { select: { id: true, firstName: true, lastName: true } },
    };
  }

  static getMentorProfileOnlySelect() {
    return {
      id: true,
      title: true,
      areasOfExpertise: true,
      yearsOfExperience: true,
      linkedInUrl: true,
      bio: true,
      skills: true,
      sessionRate: true,
      sessionDurationMinutes: true,
      availability: true,
      isFeatured: true,
      featuredAt: true,
      updatedAt: true,
      updatedBy: { select: { id: true, firstName: true, lastName: true } },
    };
  }

  /** Every column of an inquiry. There are no sensitive fields to withhold. */
  static getInquirySelect() {
    return {
      id: true,
      fullName: true,
      email: true,
      topic: true,
      message: true,
      createdAt: true,
    };
  }

  /**
   * Fields for the PUBLIC featured-mentors endpoint.
   *
   * Rooted at `MentorProfile` rather than `User` because the query orders by
   * `featuredAt`, and Prisma cannot order a `User` query by a scalar on the
   * to-many `mentorProfiles` relation.
   *
   * This feeds an UNAUTHENTICATED response — do not add email, phone, country,
   * timezone, session rate, availability, LinkedIn URL, or status flags here.
   */
  static getFeaturedMentorSelect() {
    return {
      title: true,
      bio: true,
      areasOfExpertise: true,
      skills: true,
      featuredAt: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarAttachments: { select: this.getAvatarAttachmentSelect() },
        },
      },
    };
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
          title: true,
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