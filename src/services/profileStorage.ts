import { UserProfile } from '@/types';
import { STORAGE_KEYS, USER } from '@/config/app';

const PROFILE_KEY = STORAGE_KEYS.PROFILE;

export const getUserProfile = (): UserProfile => {
  const data = localStorage.getItem(PROFILE_KEY);
  return data ? JSON.parse(data) : { annual_income: USER.DEFAULT_ANNUAL_INCOME };
};

export const saveUserProfile = (profile: UserProfile) => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};
