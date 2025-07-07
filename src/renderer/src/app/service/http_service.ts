import axios, { AxiosHeaders, AxiosResponse, RawAxiosRequestHeaders } from "axios";

export default class HTTP {
  static baseUrl = "https://jsonplaceholder.typicode.com/";

  static async get(
    endPoint: string,
    query?: unknown,
    headers?: RawAxiosRequestHeaders | AxiosHeaders
  ) {
    try {
      const response = await axios.get(`${this.baseUrl}${endPoint}`, {
        params: query,
        headers: headers
      });
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  static async post(
    endPoint: string,
    query?: unknown,
    body: object = {},
    headers?: RawAxiosRequestHeaders | AxiosHeaders
  ) {
    try {
      const response = await axios.post(`${this.baseUrl}${endPoint}`, body, {
        params: query,
        headers: headers
      });
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  static async put(
    endPoint: string,
    query?: unknown,
    body: object = {},
    headers?: RawAxiosRequestHeaders | AxiosHeaders
  ) {
    try {
      const response = await axios.put(`${this.baseUrl}${endPoint}`, body, {
        params: query,
        headers: headers
      });
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  static async delete(
    endPoint: string,
    query?: unknown,
    headers?: RawAxiosRequestHeaders | AxiosHeaders
  ) {
    try {
      const response = await axios.delete(`${this.baseUrl}${endPoint}`, {
        params: query,
        headers: headers
      });
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  static async download({
    downloadUrl,
    onProgress
  }: {
    downloadUrl: string;
    onProgress?: (progress) => void;
  }): Promise<AxiosResponse> {
    return new Promise((resolve, reject) => {
      try {
        const response = axios.get(downloadUrl, {
          onDownloadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
            onProgress?.(progress);
          }
        });

        response.then((result) => {
          return resolve(result);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  static handleError(error: unknown) {
    console.error("Axio Service Error : " + error);
    throw error;
  }
}
