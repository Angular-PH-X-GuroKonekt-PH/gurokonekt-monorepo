import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, ListUsersDto, ArchiveUserDto, UserDto } from '@gurokonekt/models';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully', type: UserDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination and filtering' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of users to return (default: 10)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of users to skip (default: 0)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for firstName, lastName, or email' })
  @ApiQuery({ name: 'includeArchived', required: false, type: Boolean, description: 'Include archived users (default: false)' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Field to sort by (default: createdAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'Sort order (ASC or DESC, default: DESC)' })
  @ApiResponse({ status: 200, description: 'List of users retrieved successfully', type: [UserDto] })
  findAll(@Query() listUsersDto: ListUsersDto) {
    return this.usersService.findAll(listUsersDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully', type: UserDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated successfully', type: UserDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user by ID (soft delete)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully', type: UserDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive or unarchive a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: ArchiveUserDto })
  @ApiResponse({ status: 200, description: 'User archive status updated successfully', type: UserDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'User not found' })
  archive(@Param('id') id: string, @Body() archiveUserDto: ArchiveUserDto) {
    return this.usersService.archive(id, archiveUserDto);
  }
}