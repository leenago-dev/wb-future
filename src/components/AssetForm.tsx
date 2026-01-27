'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { AssetCategory, Asset, AssetOwner, LoanType, RepaymentType } from '@/types';
import { getStockName, getStockCountry } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { OWNER_FORM_OPTIONS, OWNER_LABELS, DEFAULT_OWNER, COUNTRIES, LOAN_TYPES, REPAYMENT_TYPES } from '@/config/app';
import { supabase } from '@/lib/supabase';
import { useRegionDropdown } from '@/hooks/useRegionDropdown';
import { useApartmentSearch } from '@/hooks/useApartmentSearch';

interface Props {
  onSave: (asset: Omit<Asset, 'id' | 'updated_at' | 'user_id' | 'created_at'>) => void;
  onClose: () => void;
  initialData?: Asset;
}

const GRID_LAYOUT_CLASSES = 'grid grid-cols-2 gap-4';

const TICKER_CATEGORIES = [
  AssetCategory.PENSION,
  AssetCategory.STOCK,
  AssetCategory.VIRTUAL_ASSET,
] as const;

const COUNTRY_CATEGORIES = [
  AssetCategory.PENSION,
  AssetCategory.STOCK,
] as const;



const isTickerCategory = (category: AssetCategory): boolean => {
  return TICKER_CATEGORIES.includes(category as typeof TICKER_CATEGORIES[number]);
};

const isCountryCategory = (category: AssetCategory): boolean => {
  return COUNTRY_CATEGORIES.includes(category as typeof COUNTRY_CATEGORIES[number]);
};

// 국가 코드 기반 통화 매핑 (Fallback용)
const DEFAULT_CURRENCY_MAP: Record<string, string> = {
  'KR': 'KRW',
  '한국': 'KRW',
  'US': 'USD',
  '미국': 'USD',
  'CN': 'CNY',
  'CNH': 'CNY',
  '중국': 'CNY',
  'JP': 'JPY',
  '일본': 'JPY',
  '기타': 'USD',
};

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  labelSuffix?: React.ReactNode;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  children,
  labelSuffix,
  className = '',
}) => (
  <div className={className}>
    <Label className="mb-1">
      {label}
      {required && <span className="text-destructive ml-1">*</span>}
      {labelSuffix}
    </Label>
    {children}
  </div>
);

interface TextInputProps<T extends string | number = string | number> {
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  required?: boolean;
  type?: 'text' | 'number';
  step?: string;
  className?: string;
  transform?: (value: string) => string;
  autoFocus?: boolean;
  readOnly?: boolean;
}

const TextInput = <T extends string | number = string | number>({
  value,
  onChange,
  placeholder,
  required,
  type = 'text',
  step,
  className = '',
  transform,
  autoFocus,
  readOnly,
}: TextInputProps<T>) => {
  const getInitialValue = (): string => {
    if (type === 'number') {
      const numValue = value as number;
      if (numValue === 0) return '';
      return numValue.toLocaleString('ko-KR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 20,
      });
    }
    return String(value);
  };

  const [inputValue, setInputValue] = useState<string>(getInitialValue());
  const prevValueRef = useRef<T>(value);
  const isUserInputtingRef = useRef<boolean>(false);

  useEffect(() => {
    if (isUserInputtingRef.current) {
      isUserInputtingRef.current = false;
      return;
    }

    if (prevValueRef.current !== value) {
      if (type === 'number') {
        const numValue = value as number;
        if (numValue === 0) {
          setInputValue('');
        } else {
          const formatted = numValue.toLocaleString('ko-KR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 20,
          });
          setInputValue(formatted);
        }
      } else {
        setInputValue(String(value));
      }
      prevValueRef.current = value;
    }
  }, [value, type]);

  const isValidNumberInput = (str: string): boolean => {
    const cleaned = str.replace(/,/g, '').trim();
    if (cleaned === '' || cleaned === '-') return true;
    if (cleaned === '.') return true;
    const numberRegex = /^-?\d*\.?\d*$/;
    return numberRegex.test(cleaned);
  };

  const parseNumberFromString = (str: string): number => {
    const cleaned = str.replace(/,/g, '').trim();
    if (cleaned === '' || cleaned === '-' || cleaned === '.') return 0;
    const parsed = Number(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    if (transform) {
      newValue = transform(newValue);
    }

    isUserInputtingRef.current = true;

    if (type === 'number') {
      if (isValidNumberInput(newValue)) {
        setInputValue(newValue);
        const cleaned = newValue.replace(/,/g, '').trim();
        if (cleaned === '' || cleaned === '-' || cleaned === '.') {
          onChange(0 as T);
        } else {
          const numValue = parseNumberFromString(newValue);
          onChange(numValue as T);
        }
      }
    } else {
      setInputValue(newValue);
      onChange(newValue as T);
    }
  };

  const handleBlur = () => {
    if (type === 'number') {
      isUserInputtingRef.current = false;
      const numValue = parseNumberFromString(inputValue);
      const formatted = numValue === 0 ? '' : numValue.toLocaleString('ko-KR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 20,
      });
      setInputValue(formatted);
      onChange(numValue as T);
      prevValueRef.current = numValue as T;
    }
  };

  const displayValue = inputValue;

  return (
    <Input
      required={required}
      type="text"
      step={step}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
      autoFocus={autoFocus}
      readOnly={readOnly}
      inputMode={type === 'number' ? 'numeric' : undefined}
    />
  );
};

const AssetForm: React.FC<Props> = ({ onSave, onClose, initialData }) => {
  const [category, setCategory] = useState<AssetCategory>(initialData?.category || AssetCategory.CASH);
  const [owner, setOwner] = useState<AssetOwner>(initialData?.owner || DEFAULT_OWNER);
  const [name, setName] = useState(initialData?.name || '');
  const [amount, setAmount] = useState(initialData?.amount || 0);

  const safeMetadata = initialData?.metadata || {};
  const [ticker, setTicker] = useState(safeMetadata.ticker || '');
  const [avgPrice, setAvgPrice] = useState(safeMetadata.avg_price || 0);
  const [country, setCountry] = useState(safeMetadata.country || '한국');
  const [currency, setCurrency] = useState(safeMetadata.currency || 'KRW');
  const [address, setAddress] = useState(safeMetadata.address || '');
  const [purchasePrice, setPurchasePrice] = useState(safeMetadata.purchase_price || 0);
  const [selectedAreaNum, setSelectedAreaNum] = useState<number | undefined>(safeMetadata.area_num);

  const [loanType, setLoanType] = useState<LoanType>(safeMetadata.loan_type || '신용대출');
  const [interestRate, setInterestRate] = useState<number>(safeMetadata.interest_rate || 0);
  const [repaymentType, setRepaymentType] = useState<RepaymentType>(safeMetadata.repayment_type || '만기일시상환');
  const [loanPeriod, setLoanPeriod] = useState<number>(safeMetadata.loan_period || 12);
  const [isDsrExcluded, setIsDsrExcluded] = useState<boolean>(safeMetadata.is_dsr_excluded || false);
  const [isFetchingName, setIsFetchingName] = useState(false);
  const nameFetchedRef = useRef(false);
  const prevTickerRef = useRef(ticker);

  const regionDropdown = useRegionDropdown();
  const apartmentSearch = useApartmentSearch();
  const apartmentSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (category === AssetCategory.REAL_ESTATE) {
      apartmentSearch.setRegionCd5(regionDropdown.regionCd5);
    } else {
      apartmentSearch.setRegionCd5(undefined);
      apartmentSearch.clearResults();
    }
  }, [category, regionDropdown.regionCd5]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        apartmentSearchRef.current &&
        !apartmentSearchRef.current.contains(event.target as Node)
      ) {
        apartmentSearch.clearResults();
      }
    };

    if (apartmentSearch.apartmentResults.length > 0) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [apartmentSearch.apartmentResults.length, apartmentSearch.clearResults]);

  // 티커가 변경되면 자동으로 이름 가져오기 (주식/퇴직연금만)
  useEffect(() => {
    const shouldFetchName =
      isCountryCategory(category) &&
      ticker.trim().length > 0 &&
      !nameFetchedRef.current;

    if (!shouldFetchName) return;

    const timeoutId = setTimeout(async () => {
      const tickerAtFetchStart = ticker.trim();
      setIsFetchingName(true);
      try {
        const data = await getStockName(tickerAtFetchStart);
        const tickerStillMatches = tickerAtFetchStart === ticker.trim();
        if (data && data.name && tickerStillMatches && !nameFetchedRef.current) {
          setName(data.name);
          nameFetchedRef.current = true;
        } else if (data && data.name && tickerStillMatches && nameFetchedRef.current && (!name || name.trim().length === 0)) {
          setName(data.name);
        }
      } catch (error) {
        // 에러는 조용히 무시
      } finally {
        setIsFetchingName(false);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [ticker, category, name]);

  // 티커가 변경되면 자동으로 국가와 통화 가져오기 (주식/퇴직연금만) - 최적화된 하이브리드 방식
  useEffect(() => {
    const shouldFetch =
      isCountryCategory(category) &&
      ticker.trim().length > 0;

    if (!shouldFetch) return;

    const timeoutId = setTimeout(async () => {
      const tickerAtFetchStart = ticker.trim();
      try {
        // Supabase stock_names 테이블에서 국가와 통화를 한 번에 조회
        const { data, error } = await supabase
          .from('stock_names')
          .select('country, currency')
          .eq('symbol', tickerAtFetchStart)
          .maybeSingle();

        const tickerStillMatches = tickerAtFetchStart === ticker.trim();
        if (!error && data && tickerStillMatches) {
          // 국가 설정
          if (data.country && data.country !== country) {
            setCountry(data.country);
          }

          // 통화 설정 (DB에 없으면 국가 기반 fallback)
          const newCurrency = data.currency || DEFAULT_CURRENCY_MAP[data.country] || 'USD';
          if (newCurrency !== currency) {
            setCurrency(newCurrency);
          }
        }
      } catch (error) {
        // 에러는 조용히 무시
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [ticker, category, country, currency]);

  const handleNameChange = (newName: string) => {
    setName(newName);
    if (newName.trim() !== '') {
      nameFetchedRef.current = true;
    }
  };

  useEffect(() => {
    const tickerChanged = ticker.trim() !== prevTickerRef.current.trim();
    if (tickerChanged) {
      nameFetchedRef.current = false;
      if (ticker.trim().length > 0) {
        setName('');
      }
      prevTickerRef.current = ticker;
    }
  }, [ticker]);

  useEffect(() => {
    if (!initialData) {
      setAmount(0);
    }
  }, [category, initialData]);

  const buildMetadata = () => {
    const baseMetadata: Record<string, unknown> = {};

    if (isTickerCategory(category)) {
      baseMetadata.ticker = ticker;
      baseMetadata.avg_price = avgPrice;
    }

    if (isCountryCategory(category)) {
      baseMetadata.country = country;
      baseMetadata.currency = currency;
    }

    if (category === AssetCategory.REAL_ESTATE) {
      baseMetadata.address = address;
      baseMetadata.purchase_price = purchasePrice;
      if (selectedAreaNum !== undefined) {
        baseMetadata.area_num = selectedAreaNum;
      }
    }

    if (category === AssetCategory.LOAN) {
      baseMetadata.loan_type = loanType;
      baseMetadata.interest_rate = interestRate;
      baseMetadata.repayment_type = repaymentType;
      baseMetadata.loan_period = loanPeriod;
      baseMetadata.is_dsr_excluded = isDsrExcluded;
    }

    return baseMetadata;
  };

  const saveTickerToManagedStocks = async () => {
    const trimmedTicker = ticker.trim();

    // 티커가 없거나 티커 카테고리가 아니면 저장하지 않음
    if (!trimmedTicker || !isTickerCategory(category)) {
      return;
    }

    try {
      // 국가가 'KR' 또는 '한국'인 경우 티커 뒤에 '.KS' 추가 (이미 붙어있지 않은 경우만)
      let symbolToSave = trimmedTicker;
      if ((country === 'KR' || country === '한국') && !trimmedTicker.endsWith('.KS')) {
        symbolToSave = `${trimmedTicker}.KS`;
      }

      // symbol 기준으로 중복 체크
      const { data: existingStock, error: selectError } = await supabase
        .from('managed_stocks')
        .select('id')
        .eq('symbol', symbolToSave)
        .maybeSingle();

      if (selectError) {
        console.error('티커 조회 오류:', selectError);
        return;
      }

      // id가 있으면 업데이트하지 않고, 없으면 새로 추가
      if (!existingStock) {
        const { error: insertError } = await supabase
          .from('managed_stocks')
          .insert({
            symbol: symbolToSave,
            name: name.trim() || undefined,
            enabled: true,
            country: country || undefined,
            currency: currency || undefined,
          });

        if (insertError) {
          console.error('티커 저장 오류:', insertError);
        }
      }
    } catch (error) {
      console.error('티커 저장 중 오류 발생:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 티커 저장 (비동기로 실행하되, 완료를 기다리지 않음)
    await saveTickerToManagedStocks();

    onSave({
      category,
      owner,
      name,
      amount,
      metadata: buildMetadata(),
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-3xl max-h-[85vh] overflow-hidden p-0">
        <DialogHeader className="px-6 py-5 border-b bg-muted/50">
          <DialogTitle>{initialData ? '수정하기' : '항목추가'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[calc(85vh-80px)] overflow-y-auto">
          <FormField label="소유자">
            <div className="flex bg-muted p-1.5 rounded-2xl">
              {OWNER_FORM_OPTIONS.map((o) => {
                const ownerValue = o as AssetOwner;
                return (
                  <Button
                    key={o}
                    type="button"
                    variant={owner === ownerValue ? 'default' : 'ghost'}
                    onClick={() => setOwner(ownerValue)}
                    className="flex-1"
                  >
                    {OWNER_LABELS[ownerValue]}
                  </Button>
                );
              })}
            </div>
          </FormField>

          <FormField label="카테고리">
            <Select value={category} onValueChange={(val) => setCategory(val as AssetCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AssetCategory.CASH}>💰 현금성 자산</SelectItem>
                <SelectItem value={AssetCategory.REAL_ESTATE}>🏠 부동산</SelectItem>
                <SelectItem value={AssetCategory.PENSION}>☀️ 퇴직연금</SelectItem>
                <SelectItem value={AssetCategory.STOCK}>📈 주식</SelectItem>
                <SelectItem value={AssetCategory.VIRTUAL_ASSET}>₿ 가상자산</SelectItem>

                <SelectItem value={AssetCategory.LOAN}>🏦 대출</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          {isTickerCategory(category) && (
            <>
              <div className={GRID_LAYOUT_CLASSES}>
                <FormField label="티커 (Ticker)" required>
                  <TextInput
                    value={ticker}
                    onChange={setTicker}
                    placeholder={category === AssetCategory.VIRTUAL_ASSET ? "BTC, ETH" : "AAPL, 005930.KS"}
                    required
                    transform={(val) => val.toUpperCase()}
                  />
                </FormField>

                <FormField
                  label="이름"
                  labelSuffix={
                    isFetchingName && (
                      <span className="ml-2 text-[10px] text-primary font-normal">조회 중...</span>
                    )
                  }
                >
                  <TextInput
                    value={name}
                    onChange={handleNameChange}
                    placeholder="티커 입력 시 자동 조회됩니다."
                    required
                  />
                </FormField>
              </div>

              <div className={GRID_LAYOUT_CLASSES}>
                <FormField label="평단가" required>
                  <TextInput
                    type="number"
                    step="any"
                    value={avgPrice}
                    onChange={setAvgPrice}
                    required
                  />
                </FormField>
                <FormField label="수량" required>
                  <TextInput
                    type="number"
                    step="any"
                    value={amount}
                    onChange={setAmount}
                    required
                  />
                </FormField>
              </div>

              {isCountryCategory(category) && (
                <div className={GRID_LAYOUT_CLASSES}>
                  <FormField label="통화">
                    <TextInput
                      value={currency}
                      onChange={setCurrency}
                      placeholder="티커 입력 시 자동 조회됩니다."
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                  </FormField>
                  <FormField label="국가">
                    <TextInput
                      value={country}
                      onChange={setCountry}
                      placeholder="티커 입력 시 자동 조회됩니다."
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                  </FormField>
                </div>
              )}
            </>
          )}

          {category === AssetCategory.REAL_ESTATE && (
            <>
              <div className={GRID_LAYOUT_CLASSES}>
                <FormField
                  label="시도"
                  required
                  labelSuffix={
                    regionDropdown.isLoadingSido && (
                      <span className="ml-2 text-[10px] text-primary font-normal">조회 중...</span>
                    )
                  }
                >
                  <Select
                    value={regionDropdown.selectedSido || ''}
                    onValueChange={(value) => regionDropdown.setSelectedSido(value || undefined)}
                    disabled={regionDropdown.isLoadingSido}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="시도를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {regionDropdown.sidoList.map((sido) => (
                        <SelectItem key={sido} value={sido}>
                          {sido}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField
                  label="시군구"
                  required
                  labelSuffix={
                    regionDropdown.isLoadingSigungu && (
                      <span className="ml-2 text-[10px] text-primary font-normal">조회 중...</span>
                    )
                  }
                >
                  <Select
                    value={regionDropdown.selectedSigungu || ''}
                    onValueChange={(value) => regionDropdown.setSelectedSigungu(value || undefined)}
                    disabled={!regionDropdown.selectedSido || regionDropdown.isLoadingSigungu}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={regionDropdown.selectedSido ? '시군구를 선택하세요' : '시도를 먼저 선택하세요'} />
                    </SelectTrigger>
                    <SelectContent>
                      {regionDropdown.sigunguList.map((sigungu) => (
                        <SelectItem key={sigungu} value={sigungu}>
                          {sigungu}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              {regionDropdown.selectedSido && regionDropdown.selectedSigungu && (
                <div className="relative" ref={apartmentSearchRef}>
                  <FormField
                    label="아파트명 검색"
                    labelSuffix={
                      apartmentSearch.isLoading && (
                        <span className="ml-2 text-[10px] text-primary font-normal">검색 중...</span>
                      )
                    }
                  >
                    <div className="relative">
                      <TextInput
                        value={apartmentSearch.apartmentName}
                        onChange={apartmentSearch.setApartmentName}
                        placeholder="아파트명을 입력하세요"
                      />
                      {apartmentSearch.apartmentResults.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {apartmentSearch.apartmentResults.map((apt) => {
                            const handleApartmentSelect = (e: React.MouseEvent<HTMLButtonElement>) => {
                              e.preventDefault();
                              const fullAddress = `${apt.locatadd_nm} ${apt.apt_name}`;
                              setAddress(fullAddress);
                              setName(apt.apt_name);
                              apartmentSearch.setSelectedApartment(apt);
                              apartmentSearch.setApartmentName('');
                              setSelectedAreaNum(undefined);
                            };

                            return (
                              <button
                                key={`${apt.lawd_code}-${apt.apt_name}`}
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm border-b last:border-b-0"
                                onMouseDown={handleApartmentSelect}
                              >
                                <div className="font-medium">{apt.apt_name}</div>
                                <div className="text-xs text-muted-foreground">{apt.locatadd_nm}</div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </FormField>
                </div>
              )}

              {apartmentSearch.selectedApartment && (
                <FormField
                  label="면적 타입"
                  labelSuffix={
                    apartmentSearch.isLoadingAreaTypes && (
                      <span className="ml-2 text-[10px] text-primary font-normal">조회 중...</span>
                    )
                  }
                >
                  <Select
                    value={selectedAreaNum?.toString() || ''}
                    onValueChange={(value) => setSelectedAreaNum(value ? Number(value) : undefined)}
                    disabled={apartmentSearch.isLoadingAreaTypes || apartmentSearch.areaTypes.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={apartmentSearch.isLoadingAreaTypes ? '면적 타입 조회 중...' : '면적 타입을 선택하세요'} />
                    </SelectTrigger>
                    <SelectContent>
                      {apartmentSearch.areaTypes.map((areaType) => (
                        <SelectItem key={areaType.area_num} value={areaType.area_num.toString()}>
                          {areaType.area_num}㎡
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              )}

              <div className={GRID_LAYOUT_CLASSES}>
                <FormField label="매입가" required>
                  <TextInput
                    type="number"
                    value={purchasePrice}
                    onChange={setPurchasePrice}
                    required
                  />
                </FormField>
                <FormField label="평가액" required>
                  <TextInput
                    type="number"
                    value={amount}
                    onChange={setAmount}
                    required
                  />
                </FormField>
              </div>
            </>
          )}

          {category === AssetCategory.LOAN && (
            <div className="space-y-4 p-5 bg-destructive/5 rounded-xl border border-destructive/20">
              <div className={GRID_LAYOUT_CLASSES}>
                <FormField label="대출 종류" className="text-[10px] text-destructive/70 uppercase">
                  <Select value={loanType} onValueChange={(val) => setLoanType(val as LoanType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOAN_TYPES.map((loanTypeOption) => (
                        <SelectItem key={loanTypeOption} value={loanTypeOption}>
                          {loanTypeOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="대출명" required className="text-[10px] text-destructive/70 uppercase">
                  <TextInput
                    type="text"
                    value={name}
                    onChange={setName}
                    required
                  />
                </FormField>
              </div>
              <div className={GRID_LAYOUT_CLASSES}>
                <FormField label="이율 (%)" required className="text-[10px] text-destructive/70 uppercase">
                  <TextInput
                    type="number"
                    step="0.01"
                    value={interestRate}
                    onChange={setInterestRate}
                    required
                  />
                </FormField>
                <FormField label="상환 방식" className="text-[10px] text-destructive/70 uppercase">
                  <Select value={repaymentType} onValueChange={(val) => setRepaymentType(val as RepaymentType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REPAYMENT_TYPES.map((repaymentTypeOption) => (
                        <SelectItem key={repaymentTypeOption} value={repaymentTypeOption}>
                          {repaymentTypeOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

              </div>

              <div className={GRID_LAYOUT_CLASSES}>
                <FormField label="기간 (개월)" required className="text-[10px] text-destructive/70 uppercase">
                  <TextInput
                    type="number"
                    value={loanPeriod}
                    onChange={setLoanPeriod}
                    required
                  />
                </FormField>
                <FormField label="대출 원금" required className="text-[10px] text-destructive/70 uppercase">
                  <TextInput
                    type="number"
                    value={amount}
                    onChange={setAmount}
                    required
                  />
                </FormField>
              </div>
              <div className="pt-2 border-t border-destructive/20 mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <Label className="cursor-pointer">DSR 적용 제외 여부</Label>
                    <span className="text-[9px] text-destructive/60 font-bold leading-tight">전세자금대출 등 제외 시 체크</span>
                  </div>
                  <Checkbox
                    checked={isDsrExcluded}
                    onCheckedChange={(checked) => setIsDsrExcluded(checked === true)}
                    className="border-destructive/30 data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
                  />
                </div>
              </div>
            </div>
          )}

          {category === AssetCategory.CASH && (
            <FormField label="금액" required>
              <TextInput
                type="number"
                value={amount}
                onChange={setAmount}
                required
                placeholder="금액을 입력하세요"
                autoFocus
              />
            </FormField>
          )}

          <div className="pt-4 flex gap-4">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1">취소</Button>
            <Button type="submit" className="flex-1">저장</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssetForm;
