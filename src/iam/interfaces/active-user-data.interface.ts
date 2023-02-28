import { Role } from 'src/users/enums';

export interface ActiveUserData {
  sub: number;
  email: string;
  role: Role;
}
