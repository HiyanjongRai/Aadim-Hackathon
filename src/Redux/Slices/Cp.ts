import { createApi } from "@reduxjs/toolkit/query/react"
import axiosBaseQuery from "./basequery.ts"

export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string | null
  statusCode?: number
  error?: {
    errorCode: number
    message: string
  }
}

export interface PollRequirement {
  id: string;
  pollId: string;
  minimumAge: number;
  gender: string;
  mustBeVerified: boolean;
  mustBeNepalCitizen: boolean;
}
export interface PoLLOptions{
    id: string,
                pollId: string,
                text:string ,
                count: number
}

export interface Poll {
  id?: string; // Optional for creation
  created_at: string;
  valid_upto: string;
  options: PoLLOptions[];
  question: string;
  requirements: PollRequirement[];
}

export interface CreatePollRequest {
  valid_upto: string;
  options: string[];
  question: string;
  requirements: Omit<PollRequirement, 'id' | 'pollId'>[];
}

export interface UpdatePollRequest {
  id: string;
  valid_upto?: string;
  options?: string[];
  question?: string;
  requirements?: Omit<PollRequirement, 'id' | 'pollId'>[];
}

export interface PollListResponse {
  polls: Poll[];
  
}

export interface PollQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'expired' | 'all';
}

// Helper function to convert PollQueryParams to Record<string, string>
const convertParamsToStringRecord = (params: PollQueryParams): Record<string, string> => {
  const stringParams: Record<string, string> = {};
  
  if (params.page !== undefined) {
    stringParams.page = params.page.toString();
  }
  if (params.limit !== undefined) {
    stringParams.limit = params.limit.toString();
  }
  if (params.search !== undefined) {
    stringParams.search = params.search;
  }
  if (params.status !== undefined) {
    stringParams.status = params.status;
  }
  
  return stringParams;
};

export const PollSlice = createApi({
  reducerPath: "PollApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Poll", "PollList"],
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: (builder) => ({
    // Create a new poll
    createPoll: builder.mutation<ApiResponse<Poll>, CreatePollRequest>({
      query: (pollData) => ({
        url: "poll/create",
        method: "POST",
        data: pollData,
      }),
      invalidatesTags: ["PollList"],
      transformResponse: (response: ApiResponse<Poll>) => {
        if (process.env.NODE_ENV !== "production") {
          console.log("Create Poll API Response:", JSON.stringify(response, null, 2));
        }

        if (!response.success || !response.data) {
          throw new Error(response.message || "Failed to create poll");
        }

        return response;
      },
    }),

    // Get all polls with optional filtering
    getPolls: builder.query<ApiResponse<Poll[]>, void>({
  query: () => ({
    url: "Poll",
    method: "GET",
  }),
  providesTags: ["PollList"],
  transformResponse: (response: ApiResponse<Poll[]>) => {
    if (process.env.NODE_ENV !== "production") {
      console.log("Get Polls API Response:", JSON.stringify(response, null, 2));
    }

    if (!response.success) {
      throw new Error(response.message || "Failed to fetch polls");
    }

    return response;
  },
}),
getPollsByName: builder.query<ApiResponse<Poll[]>, string>({
  query: (id) => ({
    url: "Poll/Name",
    method: "GET",
    params: { name: id },
  }),
  providesTags: ["PollList"],
  transformResponse: (response) => {
    if (!response.success) throw new Error(response.message);
    return response;
  },
}),



    // Get a single poll by ID
    getPollById: builder.query<ApiResponse<Poll>, string>({
      query: (id) => ({
        url: `poll/Byid`,
        method: "GET",
        params: { id: id.toString() },
      }),
      providesTags: (result, error, id) => [{ type: "Poll", id }],
      transformResponse: (response: ApiResponse<Poll>) => {
        if (process.env.NODE_ENV !== "production") {
          console.log("Get Poll By ID API Response:", JSON.stringify(response, null, 2));
        }

        if (!response.success || !response.data) {
          throw new Error(response.message || "Failed to fetch poll");
        }

        return response;
      },
    }),
 
    // Update a poll
 

    // Vote on a poll (if needed)
  voteOnPoll: builder.mutation<ApiResponse<{ message: string }>, { a: string }>({
  query: ({ a }) => ({
    url: `poll/Vote/`, // as query param
    method: "PUT",
    data: { a }, // also in the body
  }),
  invalidatesTags: (result, error, { a }) => [
    { type: "Poll", id: a },
  ],
  transformResponse: (response: ApiResponse<{ message: string }>) => {
    if (process.env.NODE_ENV !== "production") {
      console.log("Vote on Poll API Response:", JSON.stringify(response, null, 2));
    }

    if (!response.success) {
      throw new Error(response.message || "Failed to vote on poll");
    }

    return response;
  },
}),
    getPollsBYUserID: builder.query<ApiResponse<Poll[]>, void>({
  query: () => ({
    url: "Poll/ByUserId",
    method: "GET",
  }),
  providesTags: ["PollList"],
  transformResponse: (response: ApiResponse<Poll[]>) => {
    if (process.env.NODE_ENV !== "production") {
      console.log("Get Polls API Response:", JSON.stringify(response, null, 2));
    }

    if (!response.success) {
      throw new Error(response.message || "Failed to fetch polls");
    }

    return response;
  },
}),
deletePollByName: builder.mutation<ApiResponse<{ message: boolean }>, { a: string }>({
  query: ({ a }) => ({
    url: `poll/delete`, // matches the controller route
    method: "POST",
    data: { a }, // ✅ use 'data' instead of 'body'
  }),
  invalidatesTags: (result, error, { a }) => [
    { type: "Poll", id: a },
  ],
  transformResponse: (response: ApiResponse<{ message: boolean }>) => {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        "Delete Poll API Response:",
        JSON.stringify(response, null, 2)
      );
    }

    if (!response.success) {
      throw new Error(response.message || "Failed to delete poll");
    }

    return response;
  },
}),
  }),
});

// Export the auto-generated hooks
export const {
  useCreatePollMutation,
  useGetPollsQuery,
  useGetPollByIdQuery,
  useGetPollsByNameQuery,
  useGetPollsBYUserIDQuery,
useDeletePollByNameMutation,


  useVoteOnPollMutation,
  useLazyGetPollsQuery,
  useLazyGetPollByIdQuery,
} = PollSlice;

// Export the slice as default
export default PollSlice;