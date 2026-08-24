const ERROR_MESSAGES: Record<string, string> = {
  INVALID_OTP: "Неверный код — проверьте и попробуйте ещё раз",
  OTP_EXPIRED: "Код истёк — запросите новый",
  OTP_NOT_FOUND: "Код не найден — запросите новый",
  TOO_MANY_ATTEMPTS: "Слишком много попыток — запросите новый код",
  INVALID_PHONE_NUMBER: "Проверьте номер телефона",
  PHONE_NUMBER_NOT_EXIST: "Такой номер не зарегистрирован",
};

export function errorMessage(error: unknown, fallback: string) {
  const code = (error as { code?: string } | null)?.code;
  return (code && ERROR_MESSAGES[code]) ?? fallback;
}
