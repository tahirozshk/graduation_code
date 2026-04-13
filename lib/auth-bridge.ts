const ACCESS_TOKEN_STORAGE_KEY = 'profdux_practice_access_token';
const SELECTED_COURSE_STORAGE_KEY = 'profdux_practice_course_id';
const MESSAGE_TYPE = 'profdux:practice-auth';

type PracticeBridgePayload = {
  type: string;
  accessToken?: string;
  selectedCourseId?: string;
};

function getConfiguredParentOrigin(): string | null {
  const configuredOrigin = process.env.NEXT_PUBLIC_DUX_ORIGIN?.trim();
  return configuredOrigin || null;
}

function getReferrerOrigin(): string | null {
  if (typeof document === 'undefined' || !document.referrer) {
    return null;
  }

  try {
    return new URL(document.referrer).origin;
  } catch {
    return null;
  }
}

export function isAllowedParentOrigin(origin: string): boolean {
  const configuredOrigin = getConfiguredParentOrigin();
  if (configuredOrigin) {
    return origin === configuredOrigin;
  }

  const referrerOrigin = getReferrerOrigin();
  if (referrerOrigin) {
    return origin === referrerOrigin;
  }

  return true;
}

export function storeBridgePayload(payload: PracticeBridgePayload) {
  if (typeof window === 'undefined') {
    return;
  }

  if (payload.accessToken) {
    window.sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, payload.accessToken);
  }

  if (payload.selectedCourseId) {
    window.sessionStorage.setItem(SELECTED_COURSE_STORAGE_KEY, payload.selectedCourseId);
  }
}

export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function getStoredSelectedCourseId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const courseIdFromUrl = searchParams.get('courseId');
  if (courseIdFromUrl) {
    window.sessionStorage.setItem(SELECTED_COURSE_STORAGE_KEY, courseIdFromUrl);
    return courseIdFromUrl;
  }

  return window.sessionStorage.getItem(SELECTED_COURSE_STORAGE_KEY);
}

export function isPracticeBridgePayload(value: unknown): value is PracticeBridgePayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return (value as PracticeBridgePayload).type === MESSAGE_TYPE;
}
