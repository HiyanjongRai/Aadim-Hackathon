import { createApi } from "@reduxjs/toolkit/query/react";
import axiosBaseQuery from "./basequery.ts";

// ── Types ──────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  statusCode: number;
}

export interface EventConfigDto {
  configId: number; eventName: string; edition: string;
  tagline: string; location: string; format: string;
  teamSizeMin: number; teamSizeMax: number;
}

export interface ThemeDto {
  themeId: number; title: string; subtitle: string;
  focusArea: string; coreQuestion: string; approach: string; scaleNote: string;
}

export interface SponsorDto {
  sponsorId: number; name: string; logo: string;
  color: string; tier: string; sortOrder: number;
  link: string; role: string;
}

export interface ScheduleItemDto {
  itemId: number; icon: string; dayLabel: string;
  timeLabel: string; eventLabel: string; sortOrder: number;
}

export interface RewardDto {
  rewardId: number; icon: string; label: string; value: string; sortOrder: number;
}

export interface RuleDto {
  ruleId: number; icon: string; label: string; value: string; sortOrder: number;
}

export interface MemberDto {
  memberId: number; userName: string;
  phone?: string; email?: string; isLead: boolean;
}

export interface TeamDto {
  teamId: number; teamName: string; registrationId: string;
  registeredAt: string; members: MemberDto[];
}

export interface EventSnapshotDto {
  config: EventConfigDto; theme: ThemeDto;
  sponsors: SponsorDto[]; schedule: ScheduleItemDto[];
  rewards: RewardDto[]; rules: RuleDto[];
}

// ── Payment types ──────────────────────────────────────────────────
export interface PaymentInfoDto {
  amount: number; currency: string;
}

export interface EsewaPaymentDto {
  amount: number; transactionUuid: string; productCode: string;
  signature: string; successUrl: string; failureUrl: string;
  paymentUrl: string; teamName: string;
}

export interface KhaltiPaymentDto {
  pidx: string; paymentUrl: string;
}

export interface PaymentResultDto {
  success: boolean; message: string;
  registrationId?: string; teamName?: string; ticketDownloadUrl?: string;
}

// Member shape used in registration payload (not same as MemberDto which has IDs)
export interface MemberRequest {
  userName: string; phone?: string; email?: string; isLead: boolean;
}

// Sent to /esewa/initiate and /khalti/initiate
export interface PaymentInitiateRequest {
  teamName: string;
  captainEmail?: string; // Khalti customer_info (no team record yet)
  captainPhone?: string;
}

// Sent to /esewa/verify-and-register and /khalti/verify-and-register
export interface VerifyAndRegisterRequest {
  data?: string;   // eSewa base64
  pidx?: string;   // Khalti pidx
  teamName: string;
  members: MemberRequest[];
}

// ── Slice ──────────────────────────────────────────────────────────
export const HackDriveSlice = createApi({
  reducerPath: "HackDriveSlice",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Snapshot", "Sponsors", "Schedule", "Rewards", "Rules", "Teams"],
  endpoints: (builder) => ({

    // ── Public reads ──────────────────────────────────────────────
    getSnapshot: builder.query<ApiResponse<EventSnapshotDto>, void>({
      query: () => ({ url: "/hackdrive/snapshot", method: "GET" }),
      providesTags: ["Snapshot"],
    }),
    getSponsors: builder.query<ApiResponse<SponsorDto[]>, void>({
      query: () => ({ url: "/hackdrive/sponsors", method: "GET" }),
      providesTags: ["Sponsors"],
    }),
    getSchedule: builder.query<ApiResponse<ScheduleItemDto[]>, void>({
      query: () => ({ url: "/hackdrive/schedule", method: "GET" }),
      providesTags: ["Schedule"],
    }),
    getRewards: builder.query<ApiResponse<RewardDto[]>, void>({
      query: () => ({ url: "/hackdrive/rewards", method: "GET" }),
      providesTags: ["Rewards"],
    }),
    getRules: builder.query<ApiResponse<RuleDto[]>, void>({
      query: () => ({ url: "/hackdrive/rules", method: "GET" }),
      providesTags: ["Rules"],
    }),
    getTeams: builder.query<ApiResponse<TeamDto[]>, void>({
      query: () => ({ url: "/hackdrive/teams", method: "GET" }),
      providesTags: ["Teams"],
    }),

    // ── Admin mutations ───────────────────────────────────────────
    updateConfig: builder.mutation<ApiResponse<EventConfigDto>, EventConfigDto>({
      query: (data) => ({ url: "/hackdrive/config", method: "PUT", data }),
      invalidatesTags: ["Snapshot"],
    }),
    updateTheme: builder.mutation<ApiResponse<ThemeDto>, ThemeDto>({
      query: (data) => ({ url: "/hackdrive/theme", method: "PUT", data }),
      invalidatesTags: ["Snapshot"],
    }),
    createSponsor: builder.mutation<ApiResponse<SponsorDto>, Partial<SponsorDto>>({
      query: (data) => ({ url: "/hackdrive/sponsors", method: "POST", data }),
      invalidatesTags: ["Sponsors", "Snapshot"],
    }),
    updateSponsor: builder.mutation<ApiResponse<SponsorDto>, { id: number; data: Partial<SponsorDto> }>({
      query: ({ id, data }) => ({ url: `/hackdrive/sponsors/${id}`, method: "PUT", data }),
      invalidatesTags: ["Sponsors", "Snapshot"],
    }),
    deleteSponsor: builder.mutation<ApiResponse<string>, number>({
      query: (id) => ({ url: `/hackdrive/sponsors/${id}`, method: "DELETE" }),
      invalidatesTags: ["Sponsors", "Snapshot"],
    }),
    createScheduleItem: builder.mutation<ApiResponse<ScheduleItemDto>, Partial<ScheduleItemDto>>({
      query: (data) => ({ url: "/hackdrive/schedule", method: "POST", data }),
      invalidatesTags: ["Schedule", "Snapshot"],
    }),
    updateScheduleItem: builder.mutation<ApiResponse<ScheduleItemDto>, { id: number; data: Partial<ScheduleItemDto> }>({
      query: ({ id, data }) => ({ url: `/hackdrive/schedule/${id}`, method: "PUT", data }),
      invalidatesTags: ["Schedule", "Snapshot"],
    }),
    deleteScheduleItem: builder.mutation<ApiResponse<string>, number>({
      query: (id) => ({ url: `/hackdrive/schedule/${id}`, method: "DELETE" }),
      invalidatesTags: ["Schedule", "Snapshot"],
    }),
    createReward: builder.mutation<ApiResponse<RewardDto>, Partial<RewardDto>>({
      query: (data) => ({ url: "/hackdrive/rewards", method: "POST", data }),
      invalidatesTags: ["Rewards", "Snapshot"],
    }),
    updateReward: builder.mutation<ApiResponse<RewardDto>, { id: number; data: Partial<RewardDto> }>({
      query: ({ id, data }) => ({ url: `/hackdrive/rewards/${id}`, method: "PUT", data }),
      invalidatesTags: ["Rewards", "Snapshot"],
    }),
    deleteReward: builder.mutation<ApiResponse<string>, number>({
      query: (id) => ({ url: `/hackdrive/rewards/${id}`, method: "DELETE" }),
      invalidatesTags: ["Rewards", "Snapshot"],
    }),
    createRule: builder.mutation<ApiResponse<RuleDto>, Partial<RuleDto>>({
      query: (data) => ({ url: "/hackdrive/rules", method: "POST", data }),
      invalidatesTags: ["Rules", "Snapshot"],
    }),
    updateRule: builder.mutation<ApiResponse<RuleDto>, { id: number; data: Partial<RuleDto> }>({
      query: ({ id, data }) => ({ url: `/hackdrive/rules/${id}`, method: "PUT", data }),
      invalidatesTags: ["Rules", "Snapshot"],
    }),
    deleteRule: builder.mutation<ApiResponse<string>, number>({
      query: (id) => ({ url: `/hackdrive/rules/${id}`, method: "DELETE" }),
      invalidatesTags: ["Rules", "Snapshot"],
    }),

    // ── Teams (admin only — registration now happens via payment) ──
    // useRegisterTeamMutation is REMOVED — teams are created via verify-and-register
    deleteTeam: builder.mutation<ApiResponse<string>, number>({
      query: (id) => ({ url: `/hackdrive/teams/${id}`, method: "DELETE" }),
      invalidatesTags: ["Teams"],
    }),

    // ── Upload ────────────────────────────────────────────────────
    uploadImage: builder.mutation<ApiResponse<string>, FormData>({
      query: (formData) => ({
        url: "/upload/image", method: "POST", data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      }),
    }),

    // ── Payment: initiate ─────────────────────────────────────────
    getPaymentInfo: builder.query<ApiResponse<PaymentInfoDto>, void>({
      query: () => ({ url: "/payment/info", method: "GET" }),
    }),
    initiateEsewa: builder.mutation<ApiResponse<EsewaPaymentDto>, PaymentInitiateRequest>({
      query: (data) => ({ url: "/payment/esewa/initiate", method: "POST", data }),
    }),
    initiateKhalti: builder.mutation<ApiResponse<KhaltiPaymentDto>, PaymentInitiateRequest>({
      query: (data) => ({ url: "/payment/khalti/initiate", method: "POST", data }),
    }),

    // ── Payment: verify + register (replaces old verify GET endpoints) ──
    verifyAndRegisterEsewa: builder.mutation<ApiResponse<PaymentResultDto>, VerifyAndRegisterRequest>({
      query: (data) => ({ url: "/payment/esewa/verify-and-register", method: "POST", data }),
      invalidatesTags: ["Teams"],
    }),
    verifyAndRegisterKhalti: builder.mutation<ApiResponse<PaymentResultDto>, VerifyAndRegisterRequest>({
      query: (data) => ({ url: "/payment/khalti/verify-and-register", method: "POST", data }),
      invalidatesTags: ["Teams"],
    }),
    // Add new query endpoint inside endpoints builder:
getThemes: builder.query<ApiResponse<ThemeDto[]>, void>({
  query: () => ({ url: "/hackdrive/themes", method: "GET" }),
  providesTags: ["Snapshot"],
}),
createTheme: builder.mutation<ApiResponse<ThemeDto>, Partial<ThemeDto>>({
  query: (data) => ({ url: "/hackdrive/themes", method: "POST", data }),
  invalidatesTags: ["Snapshot"],
}),
deleteTheme: builder.mutation<ApiResponse<string>, number>({
  query: (id) => ({ url: `/hackdrive/themes/${id}`, method: "DELETE" }),
  invalidatesTags: ["Snapshot"],
}),
  }),
});

export const {
  // Public reads
  useGetSnapshotQuery,
  useGetSponsorsQuery,
  useGetScheduleQuery,
  useGetRewardsQuery,
  useGetRulesQuery,
  useGetTeamsQuery,
useGetThemesQuery,
useCreateThemeMutation,
useDeleteThemeMutation,
  // Admin mutations
  useUpdateConfigMutation,
  useUpdateThemeMutation,
  useCreateSponsorMutation,
  useUpdateSponsorMutation,
  useDeleteSponsorMutation,
  useCreateScheduleItemMutation,
  useUpdateScheduleItemMutation,
  useDeleteScheduleItemMutation,
  useCreateRewardMutation,
  useUpdateRewardMutation,
  useDeleteRewardMutation,
  useCreateRuleMutation,
  useUpdateRuleMutation,
  useDeleteRuleMutation,

  // Teams
  useDeleteTeamMutation,
  // NOTE: useRegisterTeamMutation is gone — registration happens via verify-and-register

  // Upload
  useUploadImageMutation,

  // Payment
  useGetPaymentInfoQuery,
  useInitiateEsewaMutation,
  useInitiateKhaltiMutation,
  useVerifyAndRegisterEsewaMutation,
  useVerifyAndRegisterKhaltiMutation,
} = HackDriveSlice;

export default HackDriveSlice;