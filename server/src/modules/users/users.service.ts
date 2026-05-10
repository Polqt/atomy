import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UpdateUserDto } from './dto/update-user.dto';

export type SupabaseUserPayload = {
  id: string;
  email?: string | null;
  user_metadata?: {
    name?: unknown;
    avatar_url?: unknown;
  } | null;
};

function readString(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function mergePreferences(
  userMetadata: SupabaseUserPayload['user_metadata'],
  preferences?: Record<string, unknown>,
) {
  const avatarUrl = readString(userMetadata?.avatar_url);
  
  // Start with provided preferences if any
  const merged: Record<string, unknown> = { ...preferences };
  
  // Add avatarUrl from metadata if not already set by user
  if (avatarUrl && !merged.avatarUrl) {
    merged.avatarUrl = avatarUrl;
  }

  // Return undefined if nothing to merge
  if (Object.keys(merged).length === 0) {
    return undefined;
  }

  return merged;
}

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  private buildUpsertPayload(user: SupabaseUserPayload, dto?: UpdateUserDto) {
    const email = readString(user.email);
    if (!email) {
      throw new UnauthorizedException('User email not found');
    }

    const name = readString(dto?.name ?? user.user_metadata?.name);
    const preferences = mergePreferences(user.user_metadata, dto?.preferences);

    return {
      id: user.id,
      email,
      ...(name !== undefined ? { name } : {}),
      ...(preferences !== undefined ? { preferences } : {}),
    };
  }

  async getMe(user: SupabaseUserPayload) {
    const rows = await this.usersRepository.upsert(this.buildUpsertPayload(user));
    return rows[0];
  }

  async updateProfile(user: SupabaseUserPayload, dto: UpdateUserDto) {
    const rows = await this.usersRepository.upsert(this.buildUpsertPayload(user, dto));
    return rows[0];
  }

  async findById(id: string) {
    const rows = await this.usersRepository.findById(id);
    return rows[0] ?? null;
  }
}
