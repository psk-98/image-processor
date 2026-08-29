type ApiErrorPayload = {
  message?: string;
  detail?: string;
  errors?: Record<string, string[]>;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields: Record<string, string[]> = {},
  ) {
    super(message);
  }
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`/api/backend/${path.replace(/^\//, "")}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });
  const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload &
    T;

  if (!response.ok) {
    throw new ApiError(
      payload.message ??
        payload.detail ??
        "Something went wrong. Please try again.",
      response.status,
      payload.errors,
    );
  }

  return payload as T;
}
