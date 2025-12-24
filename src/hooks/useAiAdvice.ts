'use client';

import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Asset, DashboardStats, AssetOwner } from '@/types';
import { ViewType } from './useAssets';

export function useAiAdvice() {
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isAiThinking, setIsAiThinking] = useState(false);

  const getAiAdvice = async (
    filteredAssets: Asset[],
    stats: DashboardStats,
    selectedOwner: 'Total' | AssetOwner,
    currentView: ViewType
  ) => {
    setIsAiThinking(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        setAiAdvice('API 키가 설정되지 않았습니다.');
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      const summary = filteredAssets.map(a => `${a.category}: ${a.name} (${a.owner})`).join(', ');
      const viewPrompt = currentView !== 'dashboard' ? `${currentView} 관점에서의 분석을 포함해줘.` : '';
      const prompt = `현재 ${selectedOwner}의 재무 상태: 총자산 ${stats.totalAssets}원, 부채 ${stats.totalLiabilities}원, 순자산 ${stats.netWorth}원, 투자 수익률 ${stats.totalRoi.toFixed(2)}%. 구성: ${summary}. ${viewPrompt} 전문 재무 설계사로서 조언을 한국어 3줄로 해줘.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setAiAdvice(response.text || '조언을 가져오지 못했습니다.');
    } catch (e) {
      setAiAdvice('AI 조언 생성 중 오류가 발생했습니다.');
    } finally {
      setIsAiThinking(false);
    }
  };

  return {
    aiAdvice,
    isAiThinking,
    getAiAdvice,
  };
}
