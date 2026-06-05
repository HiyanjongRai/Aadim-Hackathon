import { createApi } from "@reduxjs/toolkit/query/react";
import axiosBaseQuery from "./basequery.ts";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  statusCode: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  id: string;
  email: string;
  password: string | null;
  username: string;
  roles: string[];
  accessToken: string;
  refreshToken: string;
  accessTokenExpiration: string;
  refreshTokenExpiration: string;
}

export const loginSlice = createApi({
  reducerPath: "LoginApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Auth"],
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<LoginResponse>, LoginRequest>({
      query: (credentials) => ({
        url: "/Jwt/Login",
        method: "POST",
        data: credentials,
      }),
    }),
  }),
});

export const { useLoginMutation } = loginSlice;
export default loginSlice;