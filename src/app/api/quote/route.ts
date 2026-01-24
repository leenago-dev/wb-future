import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

type StockPriceRow = {
  symbol: string;
  close_price: string | number;
  currency: string | null;
  name: string | null;
  change_percent: string | number | null;
};

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
    const normalizedSymbol = symbol.trim().toUpperCase();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase 환경변수가 설정되어 있지 않습니다.' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase
      .from('stock_prices')
      .select('symbol, close_price, currency, name, change_percent')
      .eq('symbol', normalizedSymbol)
      .order('date', { ascending: false })
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          error: '주식 정보를 가져오는 중 오류가 발생했습니다.',
          details: error.message,
        },
        { status: 500 }
      );
    }

    const row = (data?.[0] as StockPriceRow | undefined) ?? undefined;

    // Supabase에 데이터가 없으면 Yahoo Finance API 직접 호출
    if (!row) {
      console.log(`[Quote API] Supabase에 ${normalizedSymbol} 데이터 없음, Yahoo Finance API 호출`);

      try {
        const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${normalizedSymbol}?interval=1d&range=1d`;
        const yahooResponse = await fetch(yahooUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        if (!yahooResponse.ok) {
          return NextResponse.json(
            { error: '데이터를 가져올 수 없습니다.', symbol: normalizedSymbol },
            { status: 404 }
          );
        }

        const yahooData = await yahooResponse.json();
        const result = yahooData?.chart?.result?.[0];

        if (!result) {
          return NextResponse.json(
            { error: '데이터를 가져올 수 없습니다.', symbol: normalizedSymbol },
            { status: 404 }
          );
        }

        const meta = result.meta;
        const price = meta?.regularMarketPrice ?? meta?.previousClose;

        if (!price || !Number.isFinite(price) || price <= 0) {
          return NextResponse.json(
            { error: '가격 정보를 찾을 수 없습니다.', symbol: normalizedSymbol },
            { status: 404 }
          );
        }

        const responseData = {
          symbol: meta?.symbol ?? normalizedSymbol,
          price,
          currency: meta?.currency ?? 'USD',
          name: meta?.longName ?? meta?.shortName ?? undefined,
          changePercent: undefined, // Yahoo API에서 변동률 계산 가능하면 추가
        };

        return NextResponse.json(responseData, {
          status: 200,
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
          },
        });
      } catch (yahooError) {
        console.error(`[Quote API] Yahoo Finance API 호출 실패:`, yahooError);
        return NextResponse.json(
          { error: '데이터를 가져올 수 없습니다.', symbol: normalizedSymbol },
          { status: 404 }
        );
      }
    }

    const price = Number(row.close_price);
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { error: '가격 정보를 찾을 수 없습니다.', symbol: normalizedSymbol },
        { status: 404 }
      );
    }

    const rawChangePercent = row.change_percent ?? undefined;
    const parsedChangePercent =
      rawChangePercent === undefined ? undefined : Number(rawChangePercent);
    const changePercent =
      parsedChangePercent !== undefined && Number.isFinite(parsedChangePercent)
        ? parsedChangePercent
        : undefined;

    const responseData = {
      symbol: row.symbol ?? normalizedSymbol,
      price,
      currency: row.currency ?? undefined,
      name: row.name ?? undefined,
      changePercent,
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        // 캐시 시간을 늘려서(5분) DB 조회 횟수를 줄입니다.
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    console.error(`[API Error] Symbol: ${symbol}`, message);
    return NextResponse.json(
      {
        error: '주식 정보를 가져오는 중 오류가 발생했습니다.',
        details: message,
      },
      { status: 500 }
    );
  }
}
