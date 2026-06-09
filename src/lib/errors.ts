/** Доменная ошибка с HTTP-статусом. Без зависимостей от Next — безопасна для воркера. */
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
