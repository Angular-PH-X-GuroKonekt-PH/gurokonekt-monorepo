import {
  Controller,
  ForbiddenException,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtGuardGuard } from '../jwt-guard/jwt-guard.guard';
import { SearchService } from './search.service';
import {
  ResponseDto,
  SearchMentorDto,
  SearchSortBy,
  SearchSortOrder,
} from '@gurokonekt/models';

@ApiTags('Search')
@ApiBearerAuth()
@UseGuards(JwtGuardGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // ====================================================
  // GET /api/search – Mentor Search
  // ====================================================

  @Get()
  @ApiOperation({
    summary: 'Search for mentors',
    description: `
Returns a paginated list of approved, active mentors.

**Role-based behaviour:**
- Mentee: applies intelligent matching using the mentee's learning goals and areas of interest in addition to any explicit filters.
- Mentor / Admin: applies only the explicit filters (no profile-based matching).

**Filters** are all optional and combinable:
- \`name\` — partial, case-insensitive match on first or last name
- \`skills\` — comma-separated skills (e.g. \`TypeScript,Node.js\`)
- \`expertise\` — comma-separated expertise areas
- \`minSessionRate\` / \`maxSessionRate\` — session rate range
- \`minYearsExperience\` — minimum years of experience
- \`sortBy\` — newest | sessionRate | yearsExperience | name
- \`sortOrder\` — asc | desc
- \`page\` / \`limit\` — pagination (limit max 50)
    `,
  })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'skills', required: false, type: String, description: 'Comma-separated skills' })
  @ApiQuery({ name: 'expertise', required: false, type: String, description: 'Comma-separated expertise areas' })
  @ApiQuery({ name: 'minSessionRate', required: false, type: Number })
  @ApiQuery({ name: 'maxSessionRate', required: false, type: Number })
  @ApiQuery({ name: 'minYearsExperience', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, enum: SearchSortBy })
  @ApiQuery({ name: 'sortOrder', required: false, enum: SearchSortOrder })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Mentors retrieved successfully', type: ResponseDto })
  @ApiResponse({ status: 403, description: 'Access denied' })
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

    return this.searchService.searchMentors(dto, userId, role);
  }
}
