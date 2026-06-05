import { createApi } from "@reduxjs/toolkit/query/react";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import axiosBaseQuery from "./basequery.ts";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  email: string;
  expiresAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  statusCode: number;
}

export interface AuthState {
  token: string | null;
  username: string | null;
  email: string | null;
  expiresAt: string | null;
  isAuthenticated: boolean;
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<LoginResponse>, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        data: credentials,
      }),
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.success && data.data?.token) {
            localStorage.setItem("authToken", data.data.token);
            localStorage.setItem("authUsername", data.data.username);
            localStorage.setItem("authEmail", data.data.email);
            localStorage.setItem("authExpiresAt", data.data.expiresAt);
            window.dispatchEvent(new Event("storage"));
          }
        } catch {
          // handled by component
        }
      },
    }),
  }),
});

export const { useLoginMutation } = authApi;

// ─── Auth Slice ───────────────────────────────────────────────────────────────

function hydrateFromStorage(): AuthState {
  const token = localStorage.getItem("authToken");
  const expiresAt = localStorage.getItem("authExpiresAt");
  const expired = expiresAt ? new Date(expiresAt) < new Date() : true;

  if (token && !expired) {
    return {
      token,
      username: localStorage.getItem("authUsername"),
      email: localStorage.getItem("authEmail"),
      expiresAt,
      isAuthenticated: true,
    };
  }

  localStorage.removeItem("authToken");
  localStorage.removeItem("authUsername");
  localStorage.removeItem("authEmail");
  localStorage.removeItem("authExpiresAt");
  return { token: null, username: null, email: null, expiresAt: null, isAuthenticated: false };
}

const authSlice = createSlice({
  name: "auth",
  initialState: hydrateFromStorage,
  reducers: {
    setCredentials(state, action: PayloadAction<LoginResponse>) {
      state.token = action.payload.token;
      state.username = action.payload.username;
      state.email = action.payload.email;
      state.expiresAt = action.payload.expiresAt;
      state.isAuthenticated = true;
    },
    logout(state) {
      state.token = null;
      state.username = null;
      state.email = null;
      state.expiresAt = null;
      state.isAuthenticated = false;
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUsername");
      localStorage.removeItem("authEmail");
      localStorage.removeItem("authExpiresAt");
      window.dispatchEvent(new Event("storage"));
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;

export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.isAuthenticated;

export const selectCurrentUser = (state: { auth: AuthState }) => ({
  username: state.auth.username,
  email: state.auth.email,
});