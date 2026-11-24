import type { ApiFailure } from "@shared/session";

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    /** No answer at all (offline, DNS, timeout). */
    readonly network = false,
  ) {
    super(message);
    this.name = "ApiError";
  }

  toFailure(): ApiFailure {
    return { code: this.code, message: this.message };
  }
}

type GraphqlResponse<T> = {
  data?: T | null;
  errors?: { message: string; extensions?: { code?: string } }[];
};

const TIMEOUT_MS = 60_000;

// GraphQL over fetch with the client key; the caller adds the session.
export class GraphqlClient {
  constructor(
    private readonly apiUrl: string,
    private readonly clientApiKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async request<T>(
    query: string,
    variables: Record<string, unknown> = {},
    accessToken?: string | null,
  ): Promise<T> {
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.apiUrl}/graphql`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-client-api-key": this.clientApiKey,
          ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      throw new ApiError(
        "NETWORK",
        "Não consegui falar com o servidor do Otto. Confira a internet.",
        true,
      );
    }
    const body = (await response
      .json()
      .catch(() => null)) as GraphqlResponse<T> | null;
    const error = body?.errors?.[0];
    if (error) {
      throw new ApiError(error.extensions?.code ?? "UNKNOWN", error.message);
    }
    if (!response.ok || !body?.data) {
      throw new ApiError(
        `HTTP_${response.status}`,
        "O servidor do Otto respondeu com erro. Tente de novo.",
      );
    }
    return body.data;
  }
}
