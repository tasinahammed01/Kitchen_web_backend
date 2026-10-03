import { IUser } from '../models/User';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  createdAt: string;
}

/**
 * Safe User serializer - explicitly allowlists only safe fields.
 * Never includes passwordHash or other private fields.
 */
export const toPublicUser = (user: IUser): PublicUser => {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
};
