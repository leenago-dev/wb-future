import YahooFinance from 'yahoo-finance2';
import { NextResponse } from 'next/server';

const yahooFinance = new YahooFinance();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json(
      { error: '티커를 입력해주세요.' },
      { status: 400 }
    );
  }

  try {
    // quote는 현재 상태에 대한 요약 정보를 제공해줍니다.
    const quote = await yahooFinance.quote(symbol);

    // quote() 메서드는 직접 regularMarketPrice를 반환합니다
    const regularMarketPrice = quote.regularMarketPrice ?? quote.price?.regularMarketPrice;

    if (!regularMarketPrice) {
      return NextResponse.json(
        {
          error: '가격 정보를 찾을 수 없습니다.',
          symbol,
        },
        { status: 404 }
      );
    }

    // 필요한 데이터만을 이용해서 응답 만들기
    const responseData = {
      symbol: quote.symbol ?? symbol,
      price: regularMarketPrice,
      currency: quote.currency ?? quote.price?.currency,
      name: quote.shortName ?? quote.longName ?? quote.price?.shortName ?? quote.price?.longName,
      changePercent: quote.regularMarketChangePercent ?? quote.price?.regularMarketChangePercent,
    }

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        // s-maxage = 60: 공용 캐시에서 60초간 저장, stale-while-revalidate = 30: 60초가 지나도 30초 동안은 예전 데이터를 보여주며 뒤에서 새 데이터를 받아옴
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    });

  } catch (error) {
    console.error('Yahoo Finance API 오류:', error); // 서버에 에러 로그 기록
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';

    return NextResponse.json(
      {
        error: '주식 정보를 가져오는 중 오류가 발생했습니다.',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
