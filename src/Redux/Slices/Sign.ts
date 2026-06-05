// import { createApi } from "@reduxjs/toolkit/query/react";
// import axiosBaseQuery from "./basequery.ts";

// export interface ApiResponse<T> {
//   success: boolean;
//   data: T;
//   message: string | null;
//   statusCode?: number;
//   error?: {
//     errorCode: number;
//     message: string;
//   };
// }

// interface SignupRequest {
//   name: string;
//   email: string;
//   password: string;
//   gender: string;
//   age: number;
//   citizenNo?: string | null;
//   captchaCode?: string | null;
// }

// interface User {
//   id: string;
//   name: string;
//   email: string;
//   gender: string;
//   age: number;
// }

// export const authApi = createApi({
//   reducerPath: "authApi",
//   baseQuery: axiosBaseQuery(),
//   tagTypes: ["User"],
//   endpoints: (builder) => ({
//     signup: builder.mutation<ApiResponse<User>, SignupRequest>({
//       query: (payload) => ({
//         url: "/User/createuser",
//         method: "POST",
//         data: payload,
//       }),
//       transformResponse: (response: ApiResponse<User>) => {
//         if (process.env.NODE_ENV !== "production") {
//           console.log("Signup API Response:", response);
//         }
//         if (!response.success || !response.data) {
//           throw new Error(response.message || "Signup failed");
//         }
//         return response;
//       },
//     }),
//   }),
// });

// export const { useSignupMutation } = authApi;