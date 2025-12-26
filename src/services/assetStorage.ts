import { Asset } from '@/types';

const STORAGE_KEY = 'wealth_dash_assets';

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
