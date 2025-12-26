/**
 * UUID v4 생성 함수
 * crypto.randomUUID()가 지원되지 않는 환경을 위한 폴백
 */
export function generateUUID(): string {
  // 브라우저에서 crypto.randomUUID()가 지원되는 경우 사용
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // 폴백: UUID v4 형식으로 생성
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
