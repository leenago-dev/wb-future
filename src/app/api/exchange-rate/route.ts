import YahooFinance from 'yahoo-finance2';
import { NextResponse } from 'next/server';
import { EXCHANGE_RATE_API, EXCHANGE_RATE } from '@/config/app';

const yahooFinance = new YahooFinance();

export async function GET() {
  try {
    // Next.js fetch의 revalidate 옵션을 사용하여 1시간(3600초) 캐싱
    // 이 함수는 서버 사이드에서만 실행되므로 fetch를 직접 사용할 수 없음
    // 대신 Yahoo Finance API를 직접 호출하고, Next.js의 캐싱 헤더를 설정

    const quote = await yahooFinance.quote(EXCHANGE_RATE_API.SYMBOL);
    const rate = quote.regularMarketPrice ?? quote.price?.regularMarketPrice;

    if (!rate) {
      return NextResponse.json(
        {
          error: '환율 정보를 찾을 수 없습니다.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        rate: Number(rate),
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

