/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
import axios from "axios";
import {
  getAuthToken,
  getRefreshToken,
  logoutUser,
  setAuthTokens,
} from "../../Helper/auth.ts";
import BASE_URL from "./baseUrl.ts";

let isRefreshing = false;
let failedQueue: any[] = [];
const enums = {
  REFRESHEXPIRE: "Refresh Token has Already Refreshed",
};
Object.freeze(enums);

const instance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

const processQueue = (error: unknown, token = null) => {
  failedQueue.forEach((prom) =>
    error ? prom.reject(error) : prom.resolve(token)
  );
  failedQueue = [];
};

instance.interceptors.request.use(
  (config) => {
    // Add IP headers
    const publicIp = localStorage.getItem("publicIp") || "unknown";
    const privateIp = localStorage.getItem("privateIp") || "unknown";

    config.headers["Public-IP"] = publicIp; 

    if (
      privateIp !== "unknown" &&
      (privateIp.startsWith("10.") ||
        privateIp.startsWith("192.168.") ||
        (privateIp.startsWith("172.") &&
          Number(privateIp.split(".")[1]) >= 16 &&
          Number(privateIp.split(".")[1]) <= 31))
    ) {
      config.headers["Private-IP"] = privateIp;
    }

    if (config.url?.includes("/ApplicationUsers/Refresh")) {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        config.headers["Authorization"] = `Bearer ${refreshToken}`;
      }
    } else {
      const accessToken = getAuthToken();
      if (accessToken) {
        config.headers["Authorization"] = `Bearer ${accessToken}`;
      }
    }

    config.headers["Access-Control-Allow-Origin"] = "*";

    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      originalRequest &&
      originalRequest.url === "/ApplicationUsers/Refresh" &&
      [500].indexOf(error?.response?.status ?? 401) === -1
    ) {
      return Promise.reject(error);
    }

    if (originalRequest) {
      if (!originalRequest._retry && error?.response?.status === 401) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
              return axios(originalRequest);
            })
            .catch(Promise.reject);
        }

        originalRequest._retry = true;
        isRefreshing = true;

        return new Promise((resolve, reject) => {
          instance
            .post("/ApplicationUsers/Refresh", {
              accessToken: getAuthToken(),
              refreshToken: getRefreshToken(),
            })
            .then((response) => {
              const newAccessToken = response.data.accessToken;

              setAuthTokens(
                response.data.accessToken,
                response.data.refreshToken
              );
              instance.defaults.headers.common[
                "Authorization"
              ] = `Bearer ${newAccessToken}`;
              originalRequest.headers[
                "Authorization"
              ] = `Bearer ${newAccessToken}`;
              processQueue(null, newAccessToken);
              resolve(axios(originalRequest));
            })
            .catch((err) => {
              processQueue(err, null);
              reject(err);
            })
            .finally(() => {
              isRefreshing = false;
            });
        });
      }
    }

   if (error?.response?.status !== 404) {

}
    return Promise.reject(error);
  }
);

export default instance;