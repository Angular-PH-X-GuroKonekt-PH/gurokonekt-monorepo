import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { BookingService } from './booking.service';
import {
  ApproveBookingDto,
  BookingStatus,
  CreateBookingDto,
  MentorBookingsQueryDto,
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
  // GET - Get Mentor's Own Bookings (from JWT)
  // NOTE: declared before :id and user/:userId to prevent route conflict
  // ====================================================

  @Get('mentor')
  @ApiOperation({ summary: 'Get bookings for the authenticated mentor, with optional status filter' })
  @ApiQuery({ name: 'status', required: false, enum: BookingStatus, description: 'Filter by booking status' })
  @ApiResponse({ status: 200, description: 'Bookings retrieved successfully', type: ResponseDto })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async findMentorBookings(
    @Query() query: MentorBookingsQueryDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.bookingService.findMentorBookings(req.user.id, req.user.id, query);
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
  // PATCH - Approve Booking (mentor only, PENDING → APPROVED)
  // NOTE: declared before :id to prevent route conflict
  // ====================================================

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a pending booking (mentor only). Requires session link.' })
  @ApiParam({ name: 'id', type: String, description: 'UUID of the booking', example: 'uuid-booking-id' })
  @ApiResponse({ status: 200, description: 'Booking approved successfully', type: ResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async approveBooking(
    @Param('id') id: string,
    @Body() dto: ApproveBookingDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.bookingService.approveBooking(id, req.user.id, dto);
  }

  // ====================================================
  // PATCH - Reject Booking (mentor only, PENDING → REJECTED)
  // ====================================================

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a pending booking (mentor only)' })
  @ApiParam({ name: 'id', type: String, description: 'UUID of the booking', example: 'uuid-booking-id' })
  @ApiResponse({ status: 200, description: 'Booking rejected successfully', type: ResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async rejectBooking(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.bookingService.rejectBooking(id, req.user.id);
  }

  // ====================================================
  // PATCH - Complete Booking (mentor only, APPROVED → COMPLETED)
  // ====================================================

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark an approved booking as completed (mentor only, session must have already occurred)' })
  @ApiParam({ name: 'id', type: String, description: 'UUID of the booking', example: 'uuid-booking-id' })
  @ApiResponse({ status: 200, description: 'Session marked as completed', type: ResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid status transition or session has not yet occurred' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async completeBooking(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.bookingService.completeBooking(id, req.user.id);
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
