
import { Asset, AssetCategory, UserProfile } from '@/types';

export const fetchCurrentPrice = async (ticker: string): Promise<number> => {
  const mockPrices: Record<string, number> = {
    '005930.KS': 72000 + (Math.random() * 1000),
    'AAPL': 185 + (Math.random() * 5),
    'TSLA': 175 + (Math.random() * 10),
    'QQQ': 440 + (Math.random() * 5),
    'VOO': 500 + (Math.random() * 5),
    'BTC': 95000000 + (Math.random() * 1000000),
    'ETH': 3500000 + (Math.random() * 50000),
  };

  await new Promise(resolve => setTimeout(resolve, 500));
  return mockPrices[ticker] || 10000 + (Math.random() * 1000);
};

const STORAGE_KEY = 'wealth_dash_assets';
const PROFILE_KEY = 'wealth_dash_profile';

export const getAssets = (): Asset[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveAsset = (asset: Asset) => {
  const assets = getAssets();
  const index = assets.findIndex(a => a.id === asset.id);
  if (index >= 0) {
    assets[index] = asset;
  } else {
    assets.push(asset);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
};

export const deleteAsset = (id: string) => {
  const assets = getAssets().filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
};

export const getUserProfile = (): UserProfile => {
  const data = localStorage.getItem(PROFILE_KEY);
  return data ? JSON.parse(data) : { annual_income: 60000000 };
};

export const saveUserProfile = (profile: UserProfile) => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};
