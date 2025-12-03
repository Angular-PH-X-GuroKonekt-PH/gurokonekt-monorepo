import { User, Session } from '@supabase/supabase-js';

export class AuthResponseDto {
  user: User | null;
  session: Session | null;
  error: Error | null;
}