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
  // UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
// import { JwtGuardGuard } from '../jwt-guard/jwt-guard.guard';
import { BookingService } from './booking.service';
import {
  ApproveBookingDto,
  BookingStatus,
  CreateBookingDto,
  MentorBookingsQueryDto,
  ResponseDto,
  SWAGGER_DOCUMENTATION,
  UpdateBookingDto,
} from '@gurokonekt/models';

@ApiTags('Bookings')
@ApiBearerAuth()
// @UseGuards(JwtGuardGuard)
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  // ====================================================
  // POST - Create Booking
  // ====================================================

  @Post()
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.CREATE_BOOKING.summary,
    description: SWAGGER_DOCUMENTATION.CREATE_BOOKING.description,
  })
  @ApiBody({
    type: CreateBookingDto,
    examples: {
      default: { summary: 'Book a mentor session', value: SWAGGER_DOCUMENTATION.CREATE_BOOKING.bodyExample },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Booking created successfully with status PENDING.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 201,
        message: 'Booking created successfully',
        data: {
          id: 'c9d0e1f2-a3b4-5678-cdef-012345678901',
          mentorId: 'b8b1f7c2-3a21-4c9b-9c3a-7e3d7a9d9a21',
          menteeId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          status: 'PENDING',
          sessionDateTime: '2026-04-15T10:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error — missing or invalid fields.' })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
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
  @ApiOperation({
    summary: 'Get all bookings (admin / internal use)',
    description: 'Returns every booking record in the system regardless of user. Intended for admin dashboards only.',
  })
  @ApiResponse({
    status: 200,
    description: 'All bookings retrieved successfully.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Bookings retrieved successfully',
        data: [],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  async findAll() {
    return this.bookingService.findAll();
  }

  // ====================================================
  // GET - Get Mentor's Own Bookings (from JWT)
  // NOTE: declared before :id and user/:userId to prevent route conflict
  // ====================================================

  @Get('mentor')
  @ApiOperation({
    summary: 'Get bookings for the authenticated mentor',
    description: 'Returns all bookings assigned to the mentor identified by the JWT. Optionally filter by status.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: BookingStatus,
    description: 'Filter by booking status',
    example: BookingStatus.PENDING,
  })
  @ApiResponse({
    status: 200,
    description: 'Mentor bookings retrieved successfully.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Mentor bookings retrieved successfully',
        data: [],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  @ApiResponse({ status: 403, description: 'Access denied.' })
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
  @ApiOperation({
    summary: 'Get all bookings for a user (as mentee or mentor)',
    description: 'Returns all non-deleted bookings where the given user is either the mentee or the mentor. Requester must be the same user or an admin.',
  })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'UUID of the user',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'User bookings retrieved successfully.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Bookings retrieved successfully',
        data: [],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  @ApiResponse({ status: 403, description: 'Access denied — you can only view your own bookings.' })
  async findByUserId(
    @Param('userId') userId: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.bookingService.findByUserId(userId, req.user?.id ?? userId);
  }

  // ====================================================
  // GET - Get Booking By ID
  // ====================================================

  @Get(':id')
  @ApiOperation({
    summary: 'Get a single booking by ID',
    description: 'Returns the full details of one booking. Only the mentee or mentor involved in the booking can access it.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID of the booking',
    example: 'c9d0e1f2-a3b4-5678-cdef-012345678901',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking retrieved successfully.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Booking retrieved successfully',
        data: {
          id: 'c9d0e1f2-a3b4-5678-cdef-012345678901',
          status: 'APPROVED',
          sessionDateTime: '2026-04-15T10:00:00.000Z',
          sessionLink: 'https://meet.google.com/abc-defg-hij',
          notes: 'Discuss career transition.',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  @ApiResponse({ status: 403, description: 'Access denied — booking does not belong to you.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
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
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.APPROVE_BOOKING.summary,
    description: SWAGGER_DOCUMENTATION.APPROVE_BOOKING.description,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID of the booking to approve',
    example: 'c9d0e1f2-a3b4-5678-cdef-012345678901',
  })
  @ApiBody({
    type: ApproveBookingDto,
    examples: {
      default: { summary: 'Approve with Google Meet link', value: SWAGGER_DOCUMENTATION.APPROVE_BOOKING.bodyExample },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Booking approved. Status changed to APPROVED. Session link stored.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Booking approved successfully',
        data: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition — booking is not in PENDING state.' })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  @ApiResponse({ status: 403, description: 'Access denied — you are not the mentor for this booking.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
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
  @ApiOperation({
    summary: 'Reject a pending booking (mentor only) — PENDING → REJECTED',
    description: 'Rejects a booking request. Only the mentor assigned to the booking can reject it. The booking must be in PENDING status.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID of the booking to reject',
    example: 'c9d0e1f2-a3b4-5678-cdef-012345678901',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking rejected. Status changed to REJECTED.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Booking rejected successfully',
        data: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition — booking is not in PENDING state.' })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  @ApiResponse({ status: 403, description: 'Access denied — you are not the mentor for this booking.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
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
  @ApiOperation({
    summary: 'Mark an approved booking as completed (mentor only) — APPROVED → COMPLETED',
    description: 'Marks a session as completed after it has taken place. Only the mentor can complete it. The booking must be in APPROVED status and the sessionDateTime must be in the past.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID of the booking to complete',
    example: 'c9d0e1f2-a3b4-5678-cdef-012345678901',
  })
  @ApiResponse({
    status: 200,
    description: 'Session marked as completed. Status changed to COMPLETED.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Session marked as completed',
        data: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition — booking is not APPROVED, or session has not yet occurred.' })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  @ApiResponse({ status: 403, description: 'Access denied — you are not the mentor for this booking.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
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
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.UPDATE_BOOKING.summary,
    description: SWAGGER_DOCUMENTATION.UPDATE_BOOKING.description,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID of the booking',
    example: 'c9d0e1f2-a3b4-5678-cdef-012345678901',
  })
  @ApiBody({
    type: UpdateBookingDto,
    examples: {
      reschedule: { summary: 'Reschedule session', value: SWAGGER_DOCUMENTATION.UPDATE_BOOKING.bodyExample },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Booking updated successfully.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Booking updated successfully',
        data: null,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  @ApiResponse({ status: 403, description: 'Access denied — booking does not belong to you.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
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
  @ApiOperation({
    summary: 'Soft-delete a booking',
    description: 'Sets isDeleted=true and status=DELETED on the booking. The record is retained in the database for audit purposes but will not appear in normal queries.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID of the booking to delete',
    example: 'c9d0e1f2-a3b4-5678-cdef-012345678901',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking soft-deleted successfully.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Booking deleted successfully',
        data: null,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  @ApiResponse({ status: 403, description: 'Access denied — booking does not belong to you.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  async softDelete(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.bookingService.softDelete(id, req.user.id);
  }
}
