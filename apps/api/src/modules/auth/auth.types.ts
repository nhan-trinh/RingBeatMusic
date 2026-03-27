export interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    avatarUrl: string | null;
  };
}

export interface ITwoFactorResponse {
  requiresTwoFactor: true;
  tempToken: string;
}
