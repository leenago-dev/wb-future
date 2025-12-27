'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AssetCategory, Asset, AssetOwner, LoanType, RepaymentType } from '@/types';
import { quoteCache } from '@/services/quoteCache';

interface Props {
  onSave: (asset: Omit<Asset, 'id' | 'updated_at' | 'user_id' | 'created_at'>) => void;
  onClose: () => void;
  initialData?: Asset;
}

const COUNTRIES = ['한국', '미국', '중국', '일본', '기타'];

const INPUT_BASE_CLASSES = 'w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold';
const INPUT_FOCUS_CLASSES = 'focus:ring-2 focus:ring-blue-500 outline-none';
const LABEL_BASE_CLASSES = 'block text-xs font-black text-gray-400 mb-1';
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
    <label className={LABEL_BASE_CLASSES}>
      {label}
      {labelSuffix}
    </label>
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
}: TextInputProps<T>) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = transform ? transform(e.target.value) : e.target.value;
    const processedValue = (type === 'number' ? Number(newValue) : newValue) as T;
    onChange(processedValue);
  };

  return (
    <input
      required={required}
      type={type}
      step={step}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={`${INPUT_BASE_CLASSES} ${INPUT_FOCUS_CLASSES} ${className}`}
    />
  );
};

interface SelectInputProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  className?: string;
}

const SelectInput: React.FC<SelectInputProps> = ({
  value,
  onChange,
  options,
  required,
  className = '',
}) => (
  <select
    required={required}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`${INPUT_BASE_CLASSES} ${INPUT_FOCUS_CLASSES} ${className}`}
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

const AssetForm: React.FC<Props> = ({ onSave, onClose, initialData }) => {
  const [category, setCategory] = useState<AssetCategory>(initialData?.category || AssetCategory.CASH);
  const [owner, setOwner] = useState<AssetOwner>(initialData?.owner || 'Leena');
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
      // fetch 시작 시점의 티커를 저장 (비동기 작업 중 티커가 변경될 수 있음)
      const tickerAtFetchStart = ticker.trim();
      setIsFetchingName(true);
      try {
        const data = await quoteCache.getQuote(tickerAtFetchStart);
        // fetch 완료 시점에 티커가 변경되었는지 확인
        const tickerStillMatches = tickerAtFetchStart === ticker.trim();
        // 티커가 변경되지 않았고, nameFetchedRef가 false인 경우(티커가 변경되어 리셋된 경우) 항상 업데이트
        // nameFetchedRef.current가 false라는 것은 티커가 변경되어 리셋되었다는 의미이므로, name 값과 관계없이 업데이트
        if (data.name && tickerStillMatches && !nameFetchedRef.current) {
          setName(data.name);
          nameFetchedRef.current = true;
        } else if (data.name && tickerStillMatches && nameFetchedRef.current && (!name || name.trim().length === 0)) {
          // nameFetchedRef가 true이지만 이름이 비어있는 경우(초기 로드 등)에만 업데이트
          setName(data.name);
        }
        // currency를 기반으로 국가 자동 설정
        if (tickerStillMatches && data.currency) {
          const newCountry = currencyToCountry(data.currency);
          if (newCountry !== country) {
            setCountry(newCountry);
          }
        }
      } catch (error) {
        // 에러는 조용히 무시 (사용자가 수동으로 입력할 수 있음)
      } finally {
        setIsFetchingName(false);
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(timeoutId);
  }, [ticker, category, name]);

  // 이름을 수동으로 수정하면 자동 가져오기 비활성화
  const handleNameChange = (newName: string) => {
    setName(newName);
    if (newName.trim() !== '') {
      nameFetchedRef.current = true;
    }
  };

  // 티커가 변경되면 자동 가져오기 다시 활성화 및 이름 리셋
  useEffect(() => {
    const tickerChanged = ticker.trim() !== prevTickerRef.current.trim();
    // 티커가 실제로 변경되었을 때만 리셋
    if (tickerChanged) {
      nameFetchedRef.current = false;
      // 티커가 변경되고 새로운 티커가 비어있지 않으면 이름도 리셋
      if (ticker.trim().length > 0) {
        setName('');
      }
      prevTickerRef.current = ticker;
    }
  }, [ticker]);

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
        <div className="px-6 py-5 border-b flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-black text-gray-900">{initialData ? '수정하기' : '항목추가'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[85vh] overflow-y-auto custom-scrollbar">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">소유자</label>
            <div className="flex bg-gray-100 p-1.5 rounded-2xl">
              {['Leena', 'Husband', 'Common'].map(o => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOwner(o as AssetOwner)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${owner === o ? 'bg-white shadow-sm text-blue-600 scale-100' : 'text-gray-400 hover:text-gray-600'}`}
                >{o === 'Common' ? '공통' : o}</button>
              ))}
            </div>
          </div>

          <FormField label="카테고리" className="uppercase tracking-widest">
            <SelectInput
              value={category}
              onChange={(val) => setCategory(val as AssetCategory)}
              options={[
                { value: AssetCategory.CASH, label: '현금성 자산' },
                { value: AssetCategory.PENSION, label: '퇴직연금' },
                { value: AssetCategory.STOCK, label: '주식/ETF' },
                { value: AssetCategory.VIRTUAL_ASSET, label: '가상자산' },
                { value: AssetCategory.REAL_ESTATE, label: '부동산' },
                { value: AssetCategory.LOAN, label: '대출' },
              ]}
              className="text-sm"
            />
          </FormField>



          {isTickerCategory(category) && (
            <>
              <div className={GRID_LAYOUT_CLASSES}>
                <FormField label="티커 (Ticker)" required>
                  <TextInput
                    value={ticker}
                    onChange={setTicker}
                    placeholder={category === AssetCategory.VIRTUAL_ASSET ? "BTC, ETH" : "AAPL, TSLA, 005930.KS"}
                    required
                    transform={(val) => val.toUpperCase()}
                  />
                </FormField>

                <FormField
                  label="이름"
                  required
                  labelSuffix={
                    isFetchingName && (
                      <span className="ml-2 text-[10px] text-blue-500 font-normal">조회 중...</span>
                    )
                  }
                >
                  <TextInput
                    value={name}
                    onChange={handleNameChange}
                    placeholder="예: 미래에셋 퇴직연금, 삼성전자 등"
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
                <FormField label="국가" required>
                  <SelectInput
                    value={country}
                    onChange={setCountry}
                    options={COUNTRIES.map((c) => ({ value: c, label: c }))}
                    className="text-sm"
                  />
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
                  placeholder="서울시..."
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
            <div className="space-y-4 p-5 bg-red-50/50 rounded-3xl border border-red-100">
              <div className={GRID_LAYOUT_CLASSES}>
                <FormField label="대출 종류" className="text-[10px] text-red-400 uppercase">
                  <SelectInput
                    value={loanType}
                    onChange={(val) => setLoanType(val as LoanType)}
                    options={[
                      { value: '신용대출', label: '신용대출' },
                      { value: '주택담보대출', label: '주택담보대출' },
                      { value: '마이너스통장', label: '마이너스통장' },
                    ]}
                    className="p-2 bg-white border-red-100 rounded-xl text-xs"
                  />
                </FormField>
                <FormField label="이율 (%)" required className="text-[10px] text-red-400 uppercase">
                  <TextInput
                    type="number"
                    step="0.01"
                    value={interestRate}
                    onChange={setInterestRate}
                    required
                    className="p-2 bg-white border-red-100 rounded-xl text-xs"
                  />
                </FormField>
              </div>
              <FormField label="상환 방식" className="text-[10px] text-red-400 uppercase">
                <SelectInput
                  value={repaymentType}
                  onChange={(val) => setRepaymentType(val as RepaymentType)}
                  options={[
                    { value: '만기일시상환', label: '만기일시상환' },
                    { value: '원리금균등분할상환', label: '원리금균등분할상환' },
                  ]}
                  className="p-2 bg-white border-red-100 rounded-xl text-xs"
                />
              </FormField>
              <div className={GRID_LAYOUT_CLASSES}>
                <FormField label="기간 (개월)" required className="text-[10px] text-red-400 uppercase">
                  <TextInput
                    type="number"
                    value={loanPeriod}
                    onChange={setLoanPeriod}
                    required
                    className="p-2 bg-white border-red-100 rounded-xl text-xs"
                  />
                </FormField>
                <FormField label="대출 원금" required className="text-[10px] text-red-400 uppercase">
                  <TextInput
                    type="number"
                    value={amount}
                    onChange={setAmount}
                    required
                    className="p-2 bg-white border-red-100 rounded-xl text-xs"
                  />
                </FormField>
              </div>
              <div className="pt-2 border-t border-red-100 mt-2">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-red-500 uppercase">DSR 적용 제외 여부</span>
                    <span className="text-[9px] text-red-300 font-bold leading-tight">전세자금대출 등 제외 시 체크</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isDsrExcluded}
                    onChange={(e) => setIsDsrExcluded(e.target.checked)}
                    className="w-5 h-5 rounded-md border-red-200 text-red-500"
                  />
                </label>
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
              />
            </FormField>
          )}

          <div className="pt-4 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 px-4 bg-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-200 transition-colors">취소</button>
            <button type="submit" className="flex-1 py-3 px-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-colors">저장</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetForm;
