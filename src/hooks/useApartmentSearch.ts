'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export interface ApartmentResult {
  apt_name: string;
  locatadd_nm: string;
  lawd_code: string;
}

export interface AreaType {
  area_num: number;
}

export interface UseApartmentSearchReturn {
  apartmentName: string;
  apartmentResults: ApartmentResult[];
  isLoading: boolean;
  areaTypes: AreaType[];
  isLoadingAreaTypes: boolean;
  selectedApartment: ApartmentResult | undefined;
  setApartmentName: (name: string) => void;
  setRegionCd5: (regionCd5: string | undefined) => void;
  setSelectedApartment: (apartment: ApartmentResult | undefined) => void;
  clearResults: () => void;
}

export function useApartmentSearch(): UseApartmentSearchReturn {
  const [apartmentName, setApartmentName] = useState<string>('');
  const [apartmentResults, setApartmentResults] = useState<ApartmentResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [regionCd5, setRegionCd5] = useState<string | undefined>(undefined);
  const [selectedApartment, setSelectedApartment] = useState<ApartmentResult | undefined>(undefined);
  const [areaTypes, setAreaTypes] = useState<AreaType[]>([]);
  const [isLoadingAreaTypes, setIsLoadingAreaTypes] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!apartmentName.trim() || !regionCd5) {
      setApartmentResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('apt_sales')
          .select('apt_name, locatadd_nm, lawd_code')
          .eq('lawd_code', regionCd5)
          .ilike('apt_name', `%${apartmentName.trim()}%`)
          .limit(10);

        if (error) {
          console.error('아파트 검색 실패:', error);
          setApartmentResults([]);
          return;
        }

        const uniqueResults = Array.from(
          new Map(
            (data || []).map((item) => [
              item.apt_name,
              {
                apt_name: item.apt_name,
                locatadd_nm: item.locatadd_nm || '',
                lawd_code: item.lawd_code || '',
              },
            ])
          ).values()
        );

        setApartmentResults(uniqueResults);
      } catch (error) {
        console.error('아파트 검색 중 오류:', error);
        setApartmentResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [apartmentName, regionCd5]);

  useEffect(() => {
    if (!selectedApartment) {
      setAreaTypes([]);
      return;
    }

    const fetchAreaTypes = async () => {
      setIsLoadingAreaTypes(true);
      try {
        const { data, error } = await supabase
          .from('v_apt_area_types')
          .select('area_num')
          .eq('lawd_code', selectedApartment.lawd_code)
          .eq('apt_name', selectedApartment.apt_name)
          .not('area_num', 'is', null);

        if (error) {
          console.error('면적 타입 조회 실패:', error);
          setAreaTypes([]);
          return;
        }

        const distinctAreaTypes = Array.from(
          new Map(
            (data || []).map((item) => [
              item.area_num,
              { area_num: item.area_num },
            ])
          ).values()
        ).sort((a, b) => a.area_num - b.area_num);

        setAreaTypes(distinctAreaTypes);
      } catch (error) {
        console.error('면적 타입 조회 중 오류:', error);
        setAreaTypes([]);
      } finally {
        setIsLoadingAreaTypes(false);
      }
    };

    fetchAreaTypes();
  }, [selectedApartment]);

  const clearResults = useCallback(() => {
    setApartmentResults([]);
    setApartmentName('');
    setSelectedApartment(undefined);
    setAreaTypes([]);
  }, []);

  return {
    apartmentName,
    apartmentResults,
    isLoading,
    areaTypes,
    isLoadingAreaTypes,
    selectedApartment,
    setApartmentName,
    setRegionCd5,
    setSelectedApartment,
    clearResults,
  };
}
