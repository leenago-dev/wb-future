'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface RegionDropdownState {
  sidoList: string[];
  sigunguList: string[];
  selectedSido: string | undefined;
  selectedSigungu: string | undefined;
  regionCd5: string | undefined;
  isLoadingSido: boolean;
  isLoadingSigungu: boolean;
  isLoadingRegionCd5: boolean;
}

export interface UseRegionDropdownReturn {
  sidoList: string[];
  sigunguList: string[];
  selectedSido: string | undefined;
  selectedSigungu: string | undefined;
  regionCd5: string | undefined;
  isLoadingSido: boolean;
  isLoadingSigungu: boolean;
  isLoadingRegionCd5: boolean;
  setSelectedSido: (sido: string | undefined) => void;
  setSelectedSigungu: (sigungu: string | undefined) => void;
}

export function useRegionDropdown(): UseRegionDropdownReturn {
  const [sidoList, setSidoList] = useState<string[]>([]);
  const [sigunguList, setSigunguList] = useState<string[]>([]);
  const [selectedSido, setSelectedSido] = useState<string | undefined>(undefined);
  const [selectedSigungu, setSelectedSigungu] = useState<string | undefined>(undefined);
  const [regionCd5, setRegionCd5] = useState<string | undefined>(undefined);
  const [isLoadingSido, setIsLoadingSido] = useState(false);
  const [isLoadingSigungu, setIsLoadingSigungu] = useState(false);
  const [isLoadingRegionCd5, setIsLoadingRegionCd5] = useState(false);

  useEffect(() => {
    const fetchSidoList = async () => {
      setIsLoadingSido(true);
      try {
        const { data, error } = await supabase
          .from('bjd_code')
          .select('city')
          .not('city', 'is', null);

        if (error) {
          console.error('시도 목록 조회 실패:', error);
          return;
        }

        const distinctSidoList = Array.from(
          new Set(data.map((item) => item.city).filter((city): city is string => city !== null))
        ).sort();

        setSidoList(distinctSidoList);
      } catch (error) {
        console.error('시도 목록 조회 중 오류:', error);
      } finally {
        setIsLoadingSido(false);
      }
    };

    fetchSidoList();
  }, []);

  useEffect(() => {
    if (!selectedSido) {
      setSigunguList([]);
      setSelectedSigungu(undefined);
      setRegionCd5(undefined);
      return;
    }

    const fetchSigunguList = async () => {
      setIsLoadingSigungu(true);
      try {
        const { data, error } = await supabase
          .from('bjd_code')
          .select('district')
          .eq('city', selectedSido)
          .not('district', 'is', null);

        if (error) {
          console.error('시군구 목록 조회 실패:', error);
          return;
        }

        const distinctSigunguList = Array.from(
          new Set(data.map((item) => item.district).filter((district): district is string => district !== null))
        ).sort();

        setSigunguList(distinctSigunguList);
      } catch (error) {
        console.error('시군구 목록 조회 중 오류:', error);
      } finally {
        setIsLoadingSigungu(false);
      }
    };

    fetchSigunguList();
  }, [selectedSido]);

  useEffect(() => {
    if (!selectedSido || !selectedSigungu) {
      setRegionCd5(undefined);
      return;
    }

    const fetchRegionCd5 = async () => {
      setIsLoadingRegionCd5(true);
      try {
        const { data, error } = await supabase
          .from('bjd_code')
          .select('region_cd_5')
          .eq('city', selectedSido)
          .eq('district', selectedSigungu)
          .not('region_cd_5', 'is', null)
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('법정동코드 조회 실패:', error);
          return;
        }

        if (data && data.region_cd_5) {
          setRegionCd5(data.region_cd_5);
        } else {
          setRegionCd5(undefined);
        }
      } catch (error) {
        console.error('법정동코드 조회 중 오류:', error);
      } finally {
        setIsLoadingRegionCd5(false);
      }
    };

    fetchRegionCd5();
  }, [selectedSido, selectedSigungu]);

  const handleSetSelectedSido = useCallback((sido: string | undefined) => {
    setSelectedSido(sido);
    setSelectedSigungu(undefined);
    setRegionCd5(undefined);
  }, []);

  return {
    sidoList,
    sigunguList,
    selectedSido,
    selectedSigungu,
    regionCd5,
    isLoadingSido,
    isLoadingSigungu,
    isLoadingRegionCd5,
    setSelectedSido: handleSetSelectedSido,
    setSelectedSigungu,
  };
}
