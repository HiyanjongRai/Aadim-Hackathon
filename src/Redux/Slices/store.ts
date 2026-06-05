import { configureStore } from "@reduxjs/toolkit";
import loginSlice from "./loginSlice.ts";
import PollSlice from "./Cp.ts";
import BusTrackerSlice from "./Bus.ts";
import ScholarshipApiSlice from "./ScholarshipApiSlice.ts";
import HackDriveSlice from "./HackDriveSlice.ts";
import { authApi } from "./AuthSlice.ts";

const store = configureStore({
  reducer: {
    [loginSlice.reducerPath]: loginSlice.reducer,
    [PollSlice.reducerPath]: PollSlice.reducer,
    [BusTrackerSlice.reducerPath]: BusTrackerSlice.reducer,

    [ScholarshipApiSlice.reducerPath]: ScholarshipApiSlice.reducer,
    [HackDriveSlice.reducerPath]: HackDriveSlice.reducer,
    [authApi.reducerPath]: authApi.reducer,


  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      loginSlice.middleware,
         PollSlice.middleware,
 authApi.middleware,
 BusTrackerSlice.middleware,

 ScholarshipApiSlice.middleware,
 HackDriveSlice.middleware,


      ),
});
export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;

export default store;