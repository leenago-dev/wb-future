import { UserProfile } from '@/types';

const PROFILE_KEY = 'wealth_dash_profile';

export const getUserProfile = (): UserProfile => {
  const data = localStorage.getItem(PROFILE_KEY);
  return data ? JSON.parse(data) : { annual_income: 60000000 };
};

export const saveUserProfile = (profile: UserProfile) => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};
