  /* eslint-disable @typescript-eslint/no-explicit-any */

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-nocheck
  import axiosInstance from "./axios.ts";

  const axiosBaseQuery = () => async ({
    url = "",
    method = "GET",
    data,
    params,
    headers,
    responseType,
  }: {
    url?: string;
    method?: string;
    data?: unknown;
    params?: Record<string, string>;
    headers?: Record<string, string>;
    responseType?: string;
  }) => {
    try {
      const result = await axiosInstance({
        url,
        method,
        data,
        params,
        headers,
        responseType,
      });
      console.log(`Axios Response for ${url}:`, {
        status: result.status,
        headers: result.headers,
        data: responseType === 'blob' ? `Blob [type: ${result.data.type}, size: ${result.data.size}]` : result.data,
      });
      return { data: result.data };
    } catch (axiosError: any) {
      console.error(`Axios Error for ${url}:`, {
        message: axiosError.message,
        response: axiosError.response
          ? {
              status: axiosError.response.status,
              data: axiosError.response.data,
              headers: axiosError.response.headers,
            }
          : null,
      });
      return {
        error: {
          status: axiosError.response?.status || 500,
          data: axiosError.response?.data || { message: axiosError.message },
        },
      };
    }
  };

  export default axiosBaseQuery;