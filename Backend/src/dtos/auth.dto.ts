export interface RegisterRequestDto {
  name: string;
  surname?: string;
  email: string;
  username: string;
  password: string;
}

export interface LoginRequestDto {
  email?: string;
  username?: string;
  password: string;
}

export interface RefreshRequestDto {
  refreshToken: string;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUserDto {
  id: string;
  name: string;
  surname?: string | null;
  email: string;
  username: string;
  avatarSeed?: string | null;
  roles: string[];
}

export interface AuthResponseDto {
  user: AuthUserDto;
  tokens: AuthTokensDto;
}



