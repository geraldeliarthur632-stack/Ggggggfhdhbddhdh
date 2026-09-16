import React, { useState, useEffect } from 'react';
import { adMobService } from '../services/adMobService';
import {
  getActiveBannerAdUnitId,
  getActiveAdMobAppId,
  IS_TEST_MODE,
} from '../config/adMobConfig';
import { AdMobPrivacyModal } from './AdMobPrivacyModal';
import { soundEffects } from '../services/soundEffects';
import {
  ShieldCheck,
  Info,
  Sparkles,
  BookOpen,
  ExternalLink,
} from 'lucide-react';

interface AdMobBannerProps {
  currentMode: string;
  theme?: 'light' | 'dark';
  onOpenAgeSettings?: () => void;
}

export const AdMobBanner: React.FC<AdMobBannerProps> = ({
  currentMode,
  theme = 'light',
  onOpenAgeSettings,
}) => {
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [ageGroup, setAgeGroup] = useState(() => adMobService.getAgeGroup());
  const isLight = theme === 'light';

  // Monitora alterações na faixa etária em tempo real
  useEffect(() => {
    const handleAgeChange = (e: any) => {
      setAgeGroup(e.detail?.ageGroup || adMobService.getAgeGroup());
    };
    window.addEventListener('estudahud_admob_age_group_changed', handleAgeChange);
    return () => {
      window.removeEventListener('estudahud_admob_age_group_changed', handleAgeChange);
    };
  }, []);

  // REGRA DE SEGURANÇA E POLÍTICA DE FAMÍLIAS:
  // Se estiver em modo de estudo, desafio, prova ou simulado, não renderiza nada!
  if (!adMobService.isAdAllowedForMode(currentMode)) {
    return null;
  }

  const isChild = adMobService.isChildDirected();
  const privacy = adMobService.getPrivacySettings();
  const bannerUnitId = getActiveBannerAdUnitId();

  return (
    <>
      {/* 
        Container do Banner do AdMob:
        - Posicionado discretamente logo acima da barra inferior de navegação (BottomNavBar)
        - Não sobrepõe botões, conteúdo educacional ou navegação
        - Respeita largura máxima e safe-area
      */}
      <aside
        className={`w-full max-w-lg md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto px-3 pb-1 pt-0.5 select-none transition-all duration-200 z-30`}
        role="complementary"
        aria-label="Espaço de Anúncio Educacional Google AdMob"
      >
        <div
          className={`w-full max-w-[480px] mx-auto rounded-xl border px-3 py-1.5 shadow-xs flex items-center justify-between gap-2.5 min-h-[50px] transition-all ${
            isLight
              ? 'bg-slate-100/95 border-slate-300/80 text-slate-800'
              : 'bg-[#111625]/95 border-slate-800 text-slate-200'
          }`}
        >
          {/* Badge Oficial do Google AdMob e Tag de Teste */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-blue-600 to-amber-500 p-0.5 shrink-0 flex items-center justify-center shadow-xs">
              <div className="w-full h-full bg-[#0a0f1d] rounded-[6px] flex items-center justify-center text-white text-[10px] font-black">
                Ad
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-wider border border-amber-500/30">
                  {IS_TEST_MODE ? 'AdMob Teste' : 'Google AdMob'}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold border border-emerald-500/20 flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  {isChild ? 'Classificação G (Livre)' : `Classificação ${privacy.maxAdContentRating}`}
                </span>
              </div>

              {/* Mensagem educativa do anúncio de teste oficial */}
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[11px] font-semibold truncate">
                  {isChild
                    ? '📚 Conteúdo para Famílias • Dica de Leitura'
                    : '🎓 Dicas de Estudo & Ferramentas Educativas'}
                </span>
              </div>
            </div>
          </div>

          {/* Botão de Transparência e Política para Famílias */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setIsPrivacyModalOpen(true);
              }}
              className={`p-1.5 rounded-lg text-[10px] font-medium transition flex items-center gap-1 cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title="Informações de Privacidade e Política para Famílias"
              aria-label="Ver política de privacidade do anúncio"
            >
              <Info className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden xs:inline text-[10px]">Privacidade</span>
            </button>
          </div>
        </div>

        {/* Micro legenda indicativa de ID de Teste durante o desenvolvimento */}
        {IS_TEST_MODE && (
          <div className="text-center mt-0.5">
            <span className="text-[8px] text-slate-400 dark:text-slate-500 tracking-tight">
              Google Mobile Ads SDK • Bloco: {bannerUnitId.slice(0, 18)}... (Oficial de Teste)
            </span>
          </div>
        )}
      </aside>

      {/* Modal de Transparência da Política de Famílias */}
      <AdMobPrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        onOpenAgeSettings={onOpenAgeSettings}
        theme={theme}
      />
    </>
  );
};
