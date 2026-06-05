import { createApi } from "@reduxjs/toolkit/query/react";
import axiosBaseQuery from "./basequery.ts";

/* =======================
   Interfaces
======================= */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
  statusCode?: number;
  error?: { errorCode: number; message: string };
}

// ── Lookups ──
export interface FieldOfStudy {
  fieldId: number;
  fieldName: string;
}

export interface EducationLevel {
  educationLevelId: number;
  levelName: string;
  score: number;
}

// ── Student ──
export interface StudentTrainingDetail {
  studentTrainingId: number;
  fieldId: number;
  fieldName: string;
  experienceYears: number;
  trainingsCompleted: number;
  notes: string | null;
}

export interface StudentEducationDetail {
  studentEducationId: number;
  educationLevelId: number;
  levelName: string;
  score: number;
  institutionName: string | null;
  major: string | null;
  graduationYear: number | null;
  isCurrent: boolean;
}

export interface StudentDashboard {
  studentId: number;
  fullName: string;
  email: string;
  gender: string | null;
  age: number;
  gpa: number;
  familyIncome: number;
  createdDate: string;
  trainings: StudentTrainingDetail[];
  educations: StudentEducationDetail[];
  totalTrainingsCompleted: number;
  totalExperienceYears: number;
  highestEducationLevel: string | null;
  highestEducationScore: number;
}

export interface StudentListItem {
  studentId: number;
  fullName: string;
  email: string;
  gender: string | null;
  age: number;
  gpa: number;
  familyIncome: number;
  createdDate: string;
  trainingFields: string[];
  currentEducation: string | null;
}

export interface StudentTrainingDTO {
  fieldId: number;
  experienceYears: number;
  trainingsCompleted: number;
  notes?: string | null;
}

export interface StudentEducationDTO {
  educationLevelId: number;
  institutionName?: string | null;
  major?: string | null;
  graduationYear?: number | null;
  isCurrent: boolean;
}

// ── Auth ──
export interface LoginRequest   { username: string; Password: string; }
export interface LoginResponse  {
  studentId: number; fullName: string; email: string;
  accessToken: string; tokenExpiration: string;
}
export interface SignupRequest  { FullName: string; Email: string; Password: string; Gender?: string; Age: number; }
export interface SignupResponse { studentId: number; fullName: string; email: string; }

// ── Profile ──
export interface UpdateProfileRequest {
  GPA: number; FamilyIncome: number;
  Trainings: StudentTrainingDTO[];
  Educations: StudentEducationDTO[];
}

export interface FullStudentRequest {
  FullName: string; Email: string; Password: string; Gender?: string; Age: number;
  GPA: number; FamilyIncome: number;
  Trainings?: StudentTrainingDTO[]; Educations?: StudentEducationDTO[];
}

// ── Recommendation ──
export interface ScholarshipRecommendation {
  studentId: number; scholarshipId: number; scholarshipName: string;
  collegeId: number; collegeName: string;
  targetFieldId: number; targetFieldName: string;
  finalScore: number; recommendationLevel: string;
  gpaComponent: number; fieldComponent: number; experienceComponent: number;
  trainingComponent: number; educationComponent: number; incomeComponent: number;
}

// ── CV Upload ──
export interface CvParseResult {
  extractedName: string | null; extractedEmail: string | null; extractedGPA: number | null;
  suggestedTrainings: StudentTrainingDTO[]; suggestedEducations: StudentEducationDTO[];
  rawText: string;
}

// ── College ──
export interface CollegeEducationScope { educationLevelId: number; levelName: string; score: number; }
export interface ScholarshipSummary {
  scholarshipId: number; scholarshipName: string;
  targetFieldName: string; minEducationLevelName: string; isActive: boolean;
}
export interface College {
  collegeId: number; collegeName: string; description: string | null; website: string | null;
  isActive: boolean; educationScopes: CollegeEducationScope[]; totalScholarships: number;
}
export interface CollegeDashboard {
  collegeId: number; collegeName: string; description: string | null; website: string | null;
  isActive: boolean; educationScopes: CollegeEducationScope[]; scholarships: ScholarshipSummary[];
}
export interface CreateCollegeRequest {
  CollegeName: string; Description?: string | null; Website?: string | null; EducationLevelIds: number[];
}
export interface UpdateCollegeRequest {
  CollegeName?: string; Description?: string | null; Website?: string | null;
  IsActive?: boolean; EducationLevelIds?: number[];
}

// ── College Staff ──
export interface StaffRegisterRequest {
  CollegeId: number; FullName: string; Email: string; Password: string; Role?: string;
}
export interface StaffLoginRequest  { Email: string; Password: string; }
export interface StaffLoginResponse {
  staffId: number; collegeId: number; collegeName: string;
  fullName: string; email: string; role: string;
  accessToken: string; tokenExpiration: string;
}
export interface StaffProfile {
  staffId: number; collegeId: number; collegeName: string;
  fullName: string; email: string; role: string | null;
  isActive: boolean; createdDate: string;
}
export interface UpdateStaffRequest {
  FullName?: string; Email?: string; Password?: string; IsActive?: boolean;
}

// ── Scholarship ──
export interface Scholarship {
  scholarshipId: number; scholarshipName: string; description: string | null;
  collegeId: number; collegeName: string;
  targetFieldId: number; targetFieldName: string;
  minEducationLevelId: number; minEducationLevelName: string;
  isActive: boolean; createdDate: string;
}
export interface ScholarshipDTO {
  CollegeId: number; ScholarshipName: string; Description?: string | null;
  TargetFieldId: number; MinEducationLevelId: number; IsActive: boolean;
}
export interface UpdateScholarshipDTO {
  ScholarshipName?: string; Description?: string | null;
  TargetFieldId?: number; MinEducationLevelId?: number; IsActive?: boolean;
}

/* =======================
   API Slice
======================= */

export const ScholarshipApiSlice = createApi({
  reducerPath: "ScholarshipApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Student","Scholarship","Field","Education","Recommendation","Auth","College","Staff"],
  refetchOnFocus: false,
  refetchOnReconnect: false,

  endpoints: (builder) => ({

    /* ---------- Student Auth ---------- */
    login: builder.mutation<ApiResponse<LoginResponse>, LoginRequest>({
      query: (credentials) => ({ url: "Students/login", method: "POST", data: credentials }),
      invalidatesTags: ["Auth"],
    }),
    signup: builder.mutation<ApiResponse<SignupResponse>, SignupRequest>({
      query: (payload) => ({ url: "Students/register", method: "POST", data: payload }),
      invalidatesTags: ["Student", "Auth"],
    }),

    /* ---------- College Staff Auth ---------- */
    staffLogin: builder.mutation<ApiResponse<StaffLoginResponse>, StaffLoginRequest>({
      query: (credentials) => ({ url: "CollegeStaff/login", method: "POST", data: credentials }),
      invalidatesTags: ["Auth"],
    }),
    staffRegister: builder.mutation<ApiResponse<StaffProfile>, StaffRegisterRequest>({
      query: (payload) => ({ url: "CollegeStaff/register", method: "POST", data: payload }),
      invalidatesTags: ["Staff"],
    }),
    getStaffById: builder.query<ApiResponse<StaffProfile>, number>({
      query: (id) => ({ url: `CollegeStaff/${id}`, method: "GET" }),
      providesTags: (result, error, id) => [{ type: "Staff", id }],
    }),
    getStaffByCollege: builder.query<ApiResponse<StaffProfile[]>, number>({
      query: (collegeId) => ({ url: `CollegeStaff/college/${collegeId}`, method: "GET" }),
      providesTags: ["Staff"],
    }),
    updateStaff: builder.mutation<ApiResponse<void>, { id: number; data: UpdateStaffRequest }>({
      query: ({ id, data }) => ({ url: `CollegeStaff/${id}`, method: "PUT", data }),
      invalidatesTags: (result, error, { id }) => [{ type: "Staff", id }],
    }),
    deleteStaff: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({ url: `CollegeStaff/${id}`, method: "DELETE" }),
      invalidatesTags: ["Staff"],
    }),

    /* ---------- Students ---------- */
    getAllStudents: builder.query<ApiResponse<StudentListItem[]>, void>({
      query: () => ({ url: "Students", method: "GET" }),
      providesTags: ["Student"],
    }),
    getStudentById: builder.query<ApiResponse<StudentDashboard>, number>({
      query: (id) => ({ url: `Students/${id}`, method: "GET" }),
      providesTags: (result, error, id) => [{ type: "Student", id }],
    }),
    updateStudentProfile: builder.mutation<ApiResponse<void>, { id: number; data: UpdateProfileRequest }>({
      query: ({ id, data }) => ({ url: `Students/${id}/profile`, method: "PUT", data }),
      invalidatesTags: (result, error, { id }) => [{ type: "Student", id }, "Student", "Recommendation"],
    }),
    setCurrentEducation: builder.mutation<
      ApiResponse<{ studentEducationId: number; educationLevelId: number; isCurrent: boolean }>,
      { studentId: number; educationId: number }
    >({
      query: ({ studentId, educationId }) => ({
        url: `Students/${studentId}/current-education/${educationId}`, method: "PATCH",
      }),
      invalidatesTags: (result, error, { studentId }) => [{ type: "Student", id: studentId }],
    }),
    deleteStudent: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({ url: `Students/${id}`, method: "DELETE" }),
      invalidatesTags: ["Student"],
    }),
    uploadCv: builder.mutation<ApiResponse<CvParseResult>, { studentId: number; file: File }>({
      query: ({ studentId, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return { url: `Students/${studentId}/upload-cv`, method: "POST", data: formData,
          headers: { "Content-Type": "multipart/form-data" } };
      },
    }),
    getRecommendationsByStudent: builder.query<ApiResponse<ScholarshipRecommendation[]>, number>({
      query: (studentId) => ({ url: `Students/${studentId}/recommendations`, method: "GET" }),
      providesTags: (result, error, studentId) => [{ type: "Recommendation", id: studentId }],
    }),

    /* ---------- Colleges ---------- */
    getAllColleges: builder.query<ApiResponse<College[]>, void>({
      query: () => ({ url: "Colleges", method: "GET" }),
      providesTags: ["College"],
    }),
    getCollegeById: builder.query<ApiResponse<CollegeDashboard>, number>({
      query: (id) => ({ url: `Colleges/${id}`, method: "GET" }),
      providesTags: (result, error, id) => [{ type: "College", id }],
    }),
    createCollege: builder.mutation<ApiResponse<{ collegeId: number; collegeName: string }>, CreateCollegeRequest>({
      query: (data) => ({ url: "Colleges", method: "POST", data }),
      invalidatesTags: ["College"],
    }),
    updateCollege: builder.mutation<ApiResponse<void>, { id: number; data: UpdateCollegeRequest }>({
      query: ({ id, data }) => ({ url: `Colleges/${id}`, method: "PUT", data }),
      invalidatesTags: (result, error, { id }) => [{ type: "College", id }, "College"],
    }),
    deleteCollege: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({ url: `Colleges/${id}`, method: "DELETE" }),
      invalidatesTags: ["College"],
    }),

    /* ---------- Scholarships (STAFF-ONLY) ---------- */
    // These now automatically send X-Staff-Id from localStorage
    getAllScholarships: builder.query<ApiResponse<Scholarship[]>, void>({
      query: () => ({ url: "Scholarships", method: "GET" }),
      providesTags: ["Scholarship"],
    }),
    getScholarshipById: builder.query<ApiResponse<Scholarship>, number>({
      query: (id) => ({ url: `Scholarships/${id}`, method: "GET" }),
      providesTags: (result, error, id) => [{ type: "Scholarship", id }],
    }),

    createScholarship: builder.mutation<
      ApiResponse<{ scholarshipId: number; scholarshipName: string; collegeId: number }>, ScholarshipDTO
    >({
      query: (data) => ({
        url: "Scholarships",
        method: "POST",
        data,
        headers: { "X-Staff-Id": localStorage.getItem("staffId") || "" },
      }),
      invalidatesTags: ["Scholarship"],
    }),

    updateScholarship: builder.mutation<ApiResponse<void>, { id: number; data: UpdateScholarshipDTO }>({
      query: ({ id, data }) => ({
        url: `Scholarships/${id}`,
        method: "PUT",
        data,
        headers: { "X-Staff-Id": localStorage.getItem("staffId") || "" },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Scholarship", id }, "Scholarship"],
    }),

    deleteScholarship: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `Scholarships/${id}`,
        method: "DELETE",
        headers: { "X-Staff-Id": localStorage.getItem("staffId") || "" },
      }),
      invalidatesTags: ["Scholarship"],
    }),

    toggleScholarshipActive: builder.mutation<ApiResponse<{ scholarshipId: number; isActive: boolean }>, number>({
      query: (id) => ({
        url: `Scholarships/${id}/toggle-active`,
        method: "PATCH",
        headers: { "X-Staff-Id": localStorage.getItem("staffId") || "" },
      }),
      invalidatesTags: (result, error, id) => [{ type: "Scholarship", id }, "Scholarship"],
    }),

    /* ---------- Lookup Data ---------- */
    getAllFields: builder.query<ApiResponse<FieldOfStudy[]>, void>({
      query: () => ({ url: "Scholarships/fields", method: "GET" }),
      providesTags: ["Field"],
    }),
    getAllEducationLevels: builder.query<ApiResponse<EducationLevel[]>, void>({
      query: () => ({ url: "Scholarships/education-levels", method: "GET" }),
      providesTags: ["Education"],
    }),
    resetProfile: builder.mutation<ApiResponse<null>, number>({
    query: (studentId) => ({
        url: `students/${studentId}/profile`,
        method: "DELETE",
    }),
    invalidatesTags: ["Student"],
}),
  }),
});

/* =======================
   Hooks Export
======================= */
export const {
  // Student Auth
  useLoginMutation, useSignupMutation,
  // Staff Auth
  useStaffLoginMutation, useStaffRegisterMutation,
  useGetStaffByIdQuery, useGetStaffByCollegeQuery,
  useUpdateStaffMutation, useDeleteStaffMutation,
  // Students
  useGetAllStudentsQuery, useGetStudentByIdQuery,
  useUpdateStudentProfileMutation, useSetCurrentEducationMutation,
  useDeleteStudentMutation, useUploadCvMutation,
  useGetRecommendationsByStudentQuery,
  // Colleges
  useGetAllCollegesQuery, useGetCollegeByIdQuery,
  useCreateCollegeMutation, useUpdateCollegeMutation, useDeleteCollegeMutation,
  // Scholarships
  useGetAllScholarshipsQuery, useGetScholarshipByIdQuery,
  useCreateScholarshipMutation, useUpdateScholarshipMutation,
  useDeleteScholarshipMutation, useToggleScholarshipActiveMutation,
  // Lookup
  useGetAllFieldsQuery, useGetAllEducationLevelsQuery,
  useResetProfileMutation,
} = ScholarshipApiSlice;

export default ScholarshipApiSlice;