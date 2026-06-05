import { redirect } from "react-router-dom";

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return Boolean(localStorage.getItem("authToken"));
};

// Redirect if the user is authenticated
export const redirectIfUser = async () => {
  return isAuthenticated() ? redirect("/") : null;
};

// Logout user and remove the token
// export const logoutUser = async () => {
//   removeAuthToken(); // Call the function to remove token
//   return redirect("/login");
// };

// Login user by setting the token
export const loginUser = (token: string) => {
  localStorage.setItem("authToken", token);
};

// Function to get the token from local storage
export const getAuthToken = (): string | null => {
  return localStorage.getItem("authToken");
};

// Function to remove the token from local storage
export const removeAuthToken = () => {
  localStorage.removeItem("authToken");
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem("refreshToken");
};

export const setAuthTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem("authToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
};

export const removeRefreshToken = () => {
  localStorage.removeItem("refreshToken");
};

export const clearAuthData = () => {
  removeAuthToken();
  removeRefreshToken();
};
