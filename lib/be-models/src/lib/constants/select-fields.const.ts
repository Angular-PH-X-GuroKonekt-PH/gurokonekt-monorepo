export class SelectFields {
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
      avatarAttachments: {
        select: {
          id: true,
          publicUrl: true,
          fileName: true,
          bucketName: true,
          storagePath: true,
        },
      },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      updatedBy: { select: { id: true, firstName: true, lastName: true } }
    };
  }

  getMentorProfileSelect() {
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

  getMenteeProfileSelect() {
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

  getAvatarAttachmentSelect() {
    return {
      id: true,
      bucketName: true,
      storagePath: true,
      publicUrl: true,
      fileType: true,
      fileSize: true,
      fileName: true,
      user: { select: this.getUserCredentialsSelect() }
    }
  }

  getDocumentAttachmentSelect() {
    return {
      id: true,
      bucketName: true,
      storagePath: true,
      publicUrl: true,
      fileType: true,
      fileSize: true,
      fileName: true,
      user: { select: this.getUserCredentialsSelect() }
    }
  }
}