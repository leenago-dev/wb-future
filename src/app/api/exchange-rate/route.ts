import { NextResponse } from 'next/server';
import { EXCHANGE_RATE_API, EXCHANGE_RATE } from '@/config/app';
import { createClient } from '@supabase/supabase-js';

type ExchangeRateRow = {
  close_price: string | number;
};

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          rate: EXCHANGE_RATE.DEFAULT_USD_KRW,
          symbol: EXCHANGE_RATE_API.SYMBOL,
          timestamp: Date.now(),
          error: 'Supabase 환경변수가 설정되어 있지 않아 기본 환율 사용',
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
          },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase
      .from('exchange_rates')
      .select('close_price')
      .eq('symbol', EXCHANGE_RATE_API.SYMBOL)
      .order('date', { ascending: false })
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          rate: EXCHANGE_RATE.DEFAULT_USD_KRW,
          symbol: EXCHANGE_RATE_API.SYMBOL,
          timestamp: Date.now(),
          error: '환율 조회 실패, 기본 환율 사용',
          details: error.message,
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
          },
        }
      );
    }

    const row = (data?.[0] as ExchangeRateRow | undefined) ?? undefined;
    const rate = row ? Number(row.close_price) : undefined;

    if (!rate || !Number.isFinite(rate)) {
      return NextResponse.json(
        {
          rate: EXCHANGE_RATE.DEFAULT_USD_KRW,
          symbol: EXCHANGE_RATE_API.SYMBOL,
          timestamp: Date.now(),
          error: '환율 정보를 찾을 수 없어 기본 환율 사용',
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
          },
        }
      );
    }

    return NextResponse.json(
      {
        rate,
        symbol: EXCHANGE_RATE_API.SYMBOL,
        timestamp: Date.now(),
      },
      {
        status: 200,
        headers: {
          // 1시간(3600초) 캐싱
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('환율 조회 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';

    // 오류 발생 시 기본 환율 반환
    return NextResponse.json(
      {
        rate: EXCHANGE_RATE.DEFAULT_USD_KRW,
        symbol: EXCHANGE_RATE_API.SYMBOL,
        timestamp: Date.now(),
        error: '환율 조회 실패, 기본 환율 사용',
        details: errorMessage,
      },
      {
        status: 200, // 기본값을 반환하므로 200 OK
        headers: {
          // 오류 시에도 짧은 시간 캐싱 (5분)
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    );
  }
}
