import { TFNSW_API_KEY } from "./config.js";

const BASE_URL = "https://api.transport.nsw.gov.au/v1/tp/";

const COMMON_PARAMS: Record<string, string> = {
  outputFormat: "rapidJSON",
  coordOutputFormat: "EPSG:4326",
};

export class TfNSWClient {
  private apiKey: string;

  constructor() {
    this.apiKey = TFNSW_API_KEY!;
  }

  async request(
    endpoint: string,
    params: Record<string, string | number | boolean>
  ): Promise<unknown> {
    const url = new URL(endpoint, BASE_URL);

    for (const [key, value] of Object.entries({
      ...COMMON_PARAMS,
      ...params,
    })) {
      url.searchParams.set(key, String(value));
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `apikey ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          `Authentication failed (${response.status}). Check your TFNSW_API_KEY.`
        );
      }
      throw new Error(
        `TfNSW API error: ${response.status} ${response.statusText}${body ? ` - ${body}` : ""}`
      );
    }

    return response.json();
  }
}
