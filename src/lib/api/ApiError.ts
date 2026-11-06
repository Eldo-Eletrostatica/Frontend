// The Backend answers errors as { statusCode, message, error }, where message
// is a string or, for validation errors, a list of strings.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const FALLBACK_MESSAGE = "Não foi possível concluir a operação. Tente novamente.";

export async function parseApiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as { message?: unknown };
    const message = Array.isArray(body.message) ? body.message.join(" ") : body.message;
    return new ApiError(response.status, typeof message === "string" && message ? message : FALLBACK_MESSAGE);
  } catch {
    return new ApiError(response.status, FALLBACK_MESSAGE);
  }
}
