const ERROR_MESSAGES: Record<string, string> = {
  INVALID_OTP: "Неверный код — проверьте и попробуйте ещё раз",
  OTP_EXPIRED: "Код истёк — запросите новый",
  TOO_MANY_ATTEMPTS: "Слишком много попыток — запросите новый код",
};

export function errorMessage(error: unknown, fallback: string) {
  const code = (error as { code?: string } | null)?.code;
  return (code && ERROR_MESSAGES[code]) ?? fallback;
}
