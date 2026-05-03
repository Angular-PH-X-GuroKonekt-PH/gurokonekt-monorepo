import {
  Controller,
  ForbiddenException,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtGuardGuard } from '../jwt-guard/jwt-guard.guard';
import { SearchService } from './search.service';
import {
  DaysInWeek,
  ResponseDto,
  ResponseStatus,
  SearchMentorDto,
  SearchSortBy,
  SearchSortOrder,
  SWAGGER_DOCUMENTATION,
} from '@gurokonekt/models';

@ApiTags('Search')
@ApiBearerAuth()
@UseGuards(JwtGuardGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // ====================================================
  // GET /api/search/mentor/:mentorId – Mentor Profile Detail
  // NOTE: declared before GET / to prevent route conflict
  // ====================================================

  @Get('mentor/:mentorId')
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.GET_MENTOR_PROFILE.summary,
    description: SWAGGER_DOCUMENTATION.GET_MENTOR_PROFILE.description,
  })
  @ApiParam({
    name: 'mentorId',
    type: String,
    description: 'UUID of the mentor user',
    example: 'b8b1f7c2-3a21-4c9b-9c3a-7e3d7a9d9a21',
  })
  @ApiResponse({
    status: 200,
    description: 'Mentor profile retrieved successfully.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Mentor profile retrieved successfully',
        data: {
          id: 'b8b1f7c2-3a21-4c9b-9c3a-7e3d7a9d9a21',
          firstName: 'Carlos',
          lastName: 'Reyes',
          bio: 'Senior engineer with 7 years in web development.',
          areasOfExpertise: ['Web Development', 'System Design'],
          skills: ['TypeScript', 'Node.js', 'PostgreSQL'],
          yearsOfExperience: 7,
          sessionRate: 50,
          language: 'English',
          avatarUrl: 'https://example.com/avatars/carlos.jpg',
          availability: [
            { day: 'monday', timeFrames: [{ from: '09:00', to: '12:00' }] },
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  @ApiResponse({ status: 404, description: 'Mentor not found or not available (not approved / profile incomplete).' })
  async getMentorProfile(@Param('mentorId') mentorId: string) {
    const response = await this.searchService.getMentorProfileById(mentorId);
    if (response.status === ResponseStatus.Error) {
      throw new HttpException(
        { status: response.status, statusCode: response.statusCode, message: response.message, data: response.data },
        response.statusCode || HttpStatus.BAD_REQUEST,
      );
    }
    return response;
  }

  // ====================================================
  // GET /api/search – Mentor Search
  // ====================================================

  @Get()
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.SEARCH_MENTORS.summary,
    description: SWAGGER_DOCUMENTATION.SEARCH_MENTORS.description,
  })
  @ApiQuery({ name: 'name', required: false, type: String, description: 'Partial, case-insensitive match on mentor first or last name', example: 'Carlos' })
  @ApiQuery({ name: 'skills', required: false, type: String, description: 'Comma-separated list of skills to filter by', example: 'TypeScript,Node.js' })
  @ApiQuery({ name: 'expertise', required: false, type: String, description: 'Comma-separated list of expertise areas to filter by', example: 'Web Development,System Design' })
  @ApiQuery({ name: 'minSessionRate', required: false, type: Number, description: 'Minimum session rate (USD per hour)', example: 20 })
  @ApiQuery({ name: 'maxSessionRate', required: false, type: Number, description: 'Maximum session rate (USD per hour)', example: 100 })
  @ApiQuery({ name: 'minYearsExperience', required: false, type: Number, description: 'Minimum years of professional experience', example: 3 })
  @ApiQuery({ name: 'maxYearsExperience', required: false, type: Number, description: 'Maximum years of professional experience', example: 10 })
  @ApiQuery({ name: 'language', required: false, type: String, description: 'Filter by spoken language (case-insensitive)', example: 'English' })
  @ApiQuery({ name: 'availabilityDay', required: false, enum: DaysInWeek, description: 'Filter mentors available on a specific day of the week', example: DaysInWeek.Monday })
  @ApiQuery({ name: 'sortBy', required: false, enum: SearchSortBy, description: 'Field to sort results by', example: SearchSortBy.NEWEST })
  @ApiQuery({ name: 'sortOrder', required: false, enum: SearchSortOrder, description: 'Sort direction', example: SearchSortOrder.DESC })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (1-based)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of results per page (max 50)', example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Mentor search results retrieved successfully.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Mentors retrieved successfully',
        data: {
          mentors: [
            {
              id: 'b8b1f7c2-3a21-4c9b-9c3a-7e3d7a9d9a21',
              firstName: 'Carlos',
              lastName: 'Reyes',
              areasOfExpertise: ['Web Development', 'System Design'],
              sessionRate: 50,
              yearsOfExperience: 7,
              avatarUrl: 'https://example.com/avatars/carlos.jpg',
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  @ApiResponse({ status: 403, description: 'Access denied — authenticated user required.' })
  async searchMentors(
    @Query() dto: SearchMentorDto,
    @Req() req: Request & { user: { id: string; role: string } },
  ) {
    const { id: userId, role } = req.user;

    // The system must never return mentor results to unauthenticated callers.
    // Admin and mentor roles are permitted to search as well (e.g., admin dashboard).
    // Restricting to only mentee would break admin tooling, so we allow all roles
    // but apply intelligent matching only for mentees.
    if (!userId) {
      throw new ForbiddenException('Authenticated user required');
    }

    const response = await this.searchService.searchMentors(dto, userId, role);
    if (response.status === ResponseStatus.Error) {
      throw new HttpException(
        { status: response.status, statusCode: response.statusCode, message: response.message, data: response.data },
        response.statusCode || HttpStatus.BAD_REQUEST,
      );
    }
    return response;
  }
}
