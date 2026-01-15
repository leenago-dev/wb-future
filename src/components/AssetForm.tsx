'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { AssetCategory, Asset, AssetOwner, LoanType, RepaymentType } from '@/types';
import { quoteCache } from '@/services/quoteCache';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { OWNER_FORM_OPTIONS, OWNER_LABELS, DEFAULT_OWNER, COUNTRIES, LOAN_TYPES, REPAYMENT_TYPES } from '@/config/app';

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

const currencyToCountry = (currency?: string): string => {
  if (!currency) return '한국';

  const currencyUpper = currency.toUpperCase();
  if (currencyUpper === 'KRW') return '한국';
  if (currencyUpper === 'USD') return '미국';
  if (currencyUpper === 'CNY' || currencyUpper === 'CNH') return '중국';
  if (currencyUpper === 'JPY') return '일본';

  return '기타';
};

const isTickerCategory = (category: AssetCategory): boolean => {
  return TICKER_CATEGORIES.includes(category as typeof TICKER_CATEGORIES[number]);
};

const isCountryCategory = (category: AssetCategory): boolean => {
  return COUNTRY_CATEGORIES.includes(category as typeof COUNTRY_CATEGORIES[number]);
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
  const [address, setAddress] = useState(safeMetadata.address || '');
  const [purchasePrice, setPurchasePrice] = useState(safeMetadata.purchase_price || 0);

  const [loanType, setLoanType] = useState<LoanType>(safeMetadata.loan_type || '신용대출');
  const [interestRate, setInterestRate] = useState<number>(safeMetadata.interest_rate || 0);
  const [repaymentType, setRepaymentType] = useState<RepaymentType>(safeMetadata.repayment_type || '만기일시상환');
  const [loanPeriod, setLoanPeriod] = useState<number>(safeMetadata.loan_period || 12);
  const [isDsrExcluded, setIsDsrExcluded] = useState<boolean>(safeMetadata.is_dsr_excluded || false);
  const [isFetchingName, setIsFetchingName] = useState(false);
  const nameFetchedRef = useRef(false);
  const prevTickerRef = useRef(ticker);

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
        const data = await quoteCache.getQuote(tickerAtFetchStart);
        const tickerStillMatches = tickerAtFetchStart === ticker.trim();
        if (data.name && tickerStillMatches && !nameFetchedRef.current) {
          setName(data.name);
          nameFetchedRef.current = true;
        } else if (data.name && tickerStillMatches && nameFetchedRef.current && (!name || name.trim().length === 0)) {
          setName(data.name);
        }
        if (tickerStillMatches && data.currency) {
          const newCountry = currencyToCountry(data.currency);
          if (newCountry !== country) {
            setCountry(newCountry);
          }
        }
      } catch (error) {
        // 에러는 조용히 무시
      } finally {
        setIsFetchingName(false);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [ticker, category, name, country]);

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
    }

    if (category === AssetCategory.REAL_ESTATE) {
      baseMetadata.address = address;
      baseMetadata.purchase_price = purchasePrice;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
                <FormField label="국가">
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              )}
            </>
          )}

          {category === AssetCategory.REAL_ESTATE && (
            <>
              <FormField label="주소" required>
                <TextInput
                  value={address}
                  onChange={setAddress}
                  placeholder="상세주소를 입력해주세요"
                  required
                />
              </FormField>
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
