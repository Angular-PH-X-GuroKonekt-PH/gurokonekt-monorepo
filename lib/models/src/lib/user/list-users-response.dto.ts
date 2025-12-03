import { User } from './user-response.dto';

export interface ListUsersResponseDto {
  users: User[];
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}