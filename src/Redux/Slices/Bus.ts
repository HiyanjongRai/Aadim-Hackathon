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

export interface BusCompany {
    companyId: number
    companyName: string
}

export interface Stop {
    stopId: number
    stopName: string
    latitude: number
    longitude: number
}

export interface RouteSequenceDetail {
    sequenceOrder: number
    stopId: number
    stopName: string
    latitude: number
    longitude: number
    travelTimeMinutes?: number
}

export interface Route {
    routeId: number
    routeName: string
    sequence: RouteSequenceDetail[]
}

export interface Bus {
    busId: number
    busNumber: string
    companyName: string
}

export interface BusPosition {
    busId: number
    currentStopId: number
    nextStopId: number
    progress: number
    routeId: number
    currentLatitude: number
    currentLongitude: number
    /** True when bus is travelling the sequence in reverse (returning to start) */
    isReturning: boolean
}

export interface CalculateRouteRequest {
    userLatitude: number
    userLongitude: number
    destinationStopId: number
    companyId?: number
    busPositions: BusPosition[]
}

export interface RouteSegment {
    fromStopId: number
    fromStopName: string
    toStopId: number
    toStopName: string
    distance: number
    travelTimeMinutes: number
}

export interface NearestBus {
    busId: number
    busNumber: string
    companyName: string
    currentStopId: number
    currentStopName: string
    currentLatitude: number
    currentLongitude: number
    etaMinutes: number
    stopsAway: number
    isRecommended: boolean
    /** True when the bus is already at the boarding stop (etaMinutes === 0) */
    isAlreadyHere: boolean
    /** True when this bus is travelling the route in reverse */
    isReturning: boolean
    // Full metrics
    avgSpeed: number
    avgCostPerStop: number
    // Score components (0–1)
    scoreEta: number
    scoreCost: number
    scoreSpeed: number
    totalScore: number   // 0–100
}

export interface BusParkTransfer {
    // Leg 1: user walks to their nearest bus park
    transferStopId: number
    transferStopName: string
    distanceToTransferStop: number

    // Leg 2: feeder bus takes user from bus park toward destination
    feederBusId: number
    feederBusNumber: string
    feederCompanyName: string
    feederEtaMinutes: number
    /** True when the feeder bus is already at the transfer stop */
    feederIsAlreadyHere: boolean

    // Leg 3: onward route from boarding stop (near destination) to destination
    onwardRouteId: number
    onwardRouteName: string
    /** Stop nearest to destination — user alights feeder here and boards onward bus */
    onwardFromStopId: number
    onwardFromStopName: string
    /** Distance (km) from the boarding/onward stop to the final destination */
    boardingStopDistanceToDestination: number

    estimatedTotalMinutes: number
}

export interface CalculateRouteResponse {
    routeId: number
    routeName: string
    nearestStopId: number
    nearestStopName: string
    distanceToNearestStop: number
    routeSegments: RouteSegment[]
    totalRouteDistance: number
    totalTravelTime: number
    availableBuses: NearestBus[]
    routeSequence: RouteSequenceDetail[]
    requiresBusParkTransfer: boolean
    busParkTransfer?: BusParkTransfer
}

export const BusTrackerSlice = createApi({
    reducerPath: "BusTrackerApi",
    baseQuery: axiosBaseQuery(),
    tagTypes: ["Stop", "Route", "Bus", "Company"],
    refetchOnFocus: false,
    refetchOnReconnect: false,

    endpoints: (builder) => ({

        getAllStops: builder.query<ApiResponse<Stop[]>, void>({
            query: () => ({ url: "bustracker/stops", method: "GET" }),
            providesTags: ["Stop"],
            transformResponse: (response: ApiResponse<Stop[]>) => {
                if (!response.success) throw new Error(response.message || "Failed to fetch stops");
                return response;
            },
        }),

        getAllRoutes: builder.query<ApiResponse<Route[]>, void>({
            query: () => ({ url: "bustracker/routes", method: "GET" }),
            providesTags: ["Route"],
            transformResponse: (response: ApiResponse<Route[]>) => {
                if (!response.success) throw new Error(response.message || "Failed to fetch routes");
                return response;
            },
        }),

        getAllBuses: builder.query<ApiResponse<Bus[]>, void>({
            query: () => ({ url: "bustracker/buses", method: "GET" }),
            providesTags: ["Bus"],
            transformResponse: (response: ApiResponse<Bus[]>) => {
                if (!response.success) throw new Error(response.message || "Failed to fetch buses");
                return response;
            },
        }),

        getAllCompanies: builder.query<ApiResponse<BusCompany[]>, void>({
            query: () => ({ url: "bustracker/companies", method: "GET" }),
            providesTags: ["Company"],
            transformResponse: (response: ApiResponse<BusCompany[]>) => {
                if (!response.success) throw new Error(response.message || "Failed to fetch companies");
                return response;
            },
        }),

        calculateRoute: builder.mutation<ApiResponse<CalculateRouteResponse>, CalculateRouteRequest>({
            query: (data) => ({ url: "bustracker/calculate", method: "POST", data }),
            transformResponse: (response: ApiResponse<CalculateRouteResponse>) => {
                if (!response.success || !response.data) throw new Error(response.message || "Failed to calculate route");
                return response;
            },
        }),
    }),
});

export const {
    useGetAllStopsQuery,
    useGetAllRoutesQuery,
    useGetAllBusesQuery,
    useGetAllCompaniesQuery,
    useCalculateRouteMutation,
} = BusTrackerSlice;

export default BusTrackerSlice;