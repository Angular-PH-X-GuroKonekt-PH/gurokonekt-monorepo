import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtGuardGuard } from '../jwt-guard/jwt-guard.guard';
import { BookingService } from './booking.service';
import {
  CreateBookingDto,
  ResponseDto,
  UpdateBookingDto,
} from '@gurokonekt/models';

@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(JwtGuardGuard)
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  // ====================================================
  // POST - Create Booking
  // ====================================================

  @Post()
  @ApiOperation({ summary: 'Create a new booking (menteeId assigned from JWT)' })
  @ApiResponse({ status: 201, description: 'Booking created successfully', type: ResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(
    @Body() dto: CreateBookingDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.bookingService.create(dto, req.user.id);
  }

  // ====================================================
  // GET - Get All Bookings (admin / internal)
  // ====================================================

  @Get()
  @ApiOperation({ summary: 'Get all bookings (admin / internal use)' })
  @ApiResponse({ status: 200, description: 'Bookings retrieved successfully', type: ResponseDto })
  async findAll() {
    return this.bookingService.findAll();
  }

  // ====================================================
  // GET - Get Bookings By User ID
  // NOTE: declared before :id to prevent route conflict
  // ====================================================

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all bookings for a user (as mentee or mentor)' })
  @ApiParam({ name: 'userId', type: String, description: 'UUID of the user', example: 'uuid-user-id' })
  @ApiResponse({ status: 200, description: 'Bookings retrieved successfully', type: ResponseDto })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async findByUserId(
    @Param('userId') userId: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.bookingService.findByUserId(userId, req.user.id);
  }

  // ====================================================
  // GET - Get Booking By ID
  // ====================================================

  @Get(':id')
  @ApiOperation({ summary: 'Get a single booking by ID' })
  @ApiParam({ name: 'id', type: String, description: 'UUID of the booking', example: 'uuid-booking-id' })
  @ApiResponse({ status: 200, description: 'Booking retrieved successfully', type: ResponseDto })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async findById(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.bookingService.findById(id, req.user.id);
  }

  // ====================================================
  // PATCH - Update Booking
  // ====================================================

  @Patch(':id')
  @ApiOperation({ summary: 'Update booking details or status' })
  @ApiParam({ name: 'id', type: String, description: 'UUID of the booking', example: 'uuid-booking-id' })
  @ApiResponse({ status: 200, description: 'Booking updated successfully', type: ResponseDto })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBookingDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.bookingService.update(id, dto, req.user.id);
  }

  // ====================================================
  // DELETE - Soft Delete Booking
  // ====================================================

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a booking (sets isDeleted=true, status=DELETED)' })
  @ApiParam({ name: 'id', type: String, description: 'UUID of the booking', example: 'uuid-booking-id' })
  @ApiResponse({ status: 200, description: 'Booking deleted successfully', type: ResponseDto })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async softDelete(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.bookingService.softDelete(id, req.user.id);
  }
}
