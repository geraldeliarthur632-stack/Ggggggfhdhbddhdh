/**
 * ============================================================================
 * SERVIÇO DE GERENCIAMENTO DO GOOGLE ADMOB - "TRILHA DO SABER"
 * ============================================================================
 * 
 * Responsabilidades:
 * 1. Gerenciar a faixa etária do usuário sem coletar dados sensíveis nem data de nascimento.
 * 2. Aplicar as diretivas da Política para Famílias do Google Play (TFCD, TFUA, Classificação G).
 * 3. Impedir transmissão de identificadores de publicidade (GAID/AAID) e publicidade
 *    personalizada quando o usuário for tratado como criança.
 * 4. Controlar a exibição de anúncios garantindo que NUNCA apareçam em telas de prova,
 *    simulados ou momentos de resolução de questões educacionais.
 * 5. Comunicação bidirecional com a camada nativa Android (Google Mobile Ads SDK)
 *    quando compilado para Android.
 * ============================================================================
 */

import { AgeGroup, AdMobPrivacySettings, GradeLevel } from '../types';
import {
  getActiveAdMobAppId,
  getActiveBannerAdUnitId,
  buildAdMobPrivacySettings,
  IS_TEST_MODE,
  GOOGLE_TEST_IDS,
} from '../config/adMobConfig';

const STORAGE_KEY_AGE_GROUP = 'estudahud_admob_age_group';
const STORAGE_KEY_ADS_ENABLED = 'estudahud_admob_ads_enabled';

// Telas onde anúncios são TERMINANTEMENTE PROIBIDOS para não atrapalhar o aprendizado
export const EXAM_AND_QUIZ_MODES = [
  'simulado',
  'photo_exam',
  'journey', // Contém questões de prática e teoria ativa
  'caderno',
  'math',
  'times_table',
  'chess',
  'duel',
  'multiplayer',
  'competition',
  'lightning',
  'challenges',
  'memory',
  'wordsearch',
  'puzzle',
  'languages',
  'translator',
  'explainer',
  'researcher',
] as const;

export class AdMobService {
  private static instance: AdMobService;
  private currentAgeGroup: AgeGroup;
  private isInitialized: boolean = false;
  private isNativeAndroidBridgeAvailable: boolean = false;

  private constructor() {
    this.currentAgeGroup = this.loadStoredAgeGroup();
    this.detectAndroidBridge();
  }

  public static getInstance(): AdMobService {
    if (!AdMobService.instance) {
      AdMobService.instance = new AdMobService();
    }
    return AdMobService.instance;
  }

  /**
   * Carrega a faixa etária salva localmente.
   * Não salva idade exata nem data de nascimento, respeitando a privacidade.
   */
  private loadStoredAgeGroup(): AgeGroup {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AGE_GROUP) as AgeGroup | null;
      if (saved && ['crianca', 'adolescente', 'adulto', 'nao_informada'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'nao_informada';
  }

  /**
   * Sugere uma faixa etária inicial com base na série escolar selecionada,
   * sem armazenar idade exata.
   */
  public deduceAgeGroupFromGrade(grade?: GradeLevel): AgeGroup {
    if (!grade) return 'nao_informada';

    // 1º ao 6º ano do Ensino Fundamental: tipicamente 6 a 12 anos (Criança)
    if (['1_fund', '2_fund', '3_fund', '4_fund', '5_fund', '6_fund'].includes(grade)) {
      return 'crianca';
    }

    // 7º ao 9º ano e Ensino Médio: tipicamente 12 a 17 anos (Adolescente)
    if (['7_fund', '8_fund', '9_fund', '1_medio', '2_medio', '3_medio'].includes(grade)) {
      return 'adolescente';
    }

    // Pré-Vestibular / ENEM: Adolescente ou Adulto
    if (grade === 'enem') {
      return 'adolescente';
    }

    return 'nao_informada';
  }

  /**
   * Retorna a faixa etária atual configurada.
   */
  public getAgeGroup(): AgeGroup {
    return this.currentAgeGroup;
  }

  /**
   * Atualiza a faixa etária do usuário.
   * Salva apenas a categoria ('crianca' | 'adolescente' | 'adulto' | 'nao_informada').
   * Dispara evento para atualização imediata dos banners e conformidade.
   */
  public setAgeGroup(ageGroup: AgeGroup): void {
    this.currentAgeGroup = ageGroup;
    try {
      localStorage.setItem(STORAGE_KEY_AGE_GROUP, ageGroup);
    } catch {}

    // Notifica a camada nativa Android se disponível
    this.syncWithAndroidNative();

    // Notifica os componentes React
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('estudahud_admob_age_group_changed', {
          detail: {
            ageGroup,
            privacySettings: this.getPrivacySettings(),
          },
        })
      );
    }
  }

  /**
   * Retorna as diretrizes de privacidade e conformidade calculadas para o usuário.
   */
  public getPrivacySettings(): AdMobPrivacySettings {
    return buildAdMobPrivacySettings(this.currentAgeGroup);
  }

  /**
   * Informa se o usuário atual deve receber tratamento infantil (COPPA/TFCD).
   * Tanto 'crianca' quanto 'nao_informada' recebem o tratamento infantil
   * estrito em conformidade com a Política de Famílias do Google Play.
   */
  public isChildDirected(): boolean {
    return this.currentAgeGroup === 'crianca' || this.currentAgeGroup === 'nao_informada';
  }

  /**
   * Determina se anúncios podem ser exibidos no modo/tela atual.
   * REGRA DE OURO: Telas de prova, simulados e resolução de exercícios NUNCA exibem anúncios.
   */
  public isAdAllowedForMode(currentMode: string): boolean {
    // Apenas na visualização principal das abas ('tabs': Home, Explorar, Progresso, Perfil)
    if (currentMode !== 'tabs') {
      return false;
    }

    // Se estiver em qualquer modo de desafio, prova ou questão, bloqueia completamente
    if (EXAM_AND_QUIZ_MODES.includes(currentMode as any)) {
      return false;
    }

    return true;
  }

  /**
   * Detecta se o aplicativo está rodando dentro de um invólucro Android nativo
   * (Capacitor, Cordova, WebView com JavascriptInterface ou bridge customizada).
   */
  private detectAndroidBridge(): void {
    if (typeof window === 'undefined') return;

    const win = window as any;
    if (win.AndroidAdMobBridge || win.Capacitor?.Plugins?.AdMob) {
      this.isNativeAndroidBridgeAvailable = true;
    }
  }

  /**
   * Inicializa o Google Mobile Ads SDK no Android nativo com as configurações
   * de proteção à família.
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const privacy = this.getPrivacySettings();
    const appId = getActiveAdMobAppId();
    const bannerUnitId = getActiveBannerAdUnitId();

    console.info('[AdMob] Inicializando Google Mobile Ads SDK...', {
      isTestMode: IS_TEST_MODE,
      appId,
      bannerUnitId,
      privacySettings: privacy,
    });

    this.syncWithAndroidNative();
    this.isInitialized = true;
  }

  public async init(): Promise<void> {
    return this.initialize();
  }

  /**
   * Sincroniza as regras da Política para Famílias com o SDK Android Nativo.
   */
  private syncWithAndroidNative(): void {
    if (typeof window === 'undefined') return;

    const win = window as any;
    const privacy = this.getPrivacySettings();
    const bannerUnitId = getActiveBannerAdUnitId();

    // 1. Caso haja interface nativa Android registrada via addJavascriptInterface:
    if (win.AndroidAdMobBridge && typeof win.AndroidAdMobBridge.configurePrivacy === 'function') {
      try {
        win.AndroidAdMobBridge.configurePrivacy(
          JSON.stringify({
            tagForChildDirectedTreatment: privacy.tagForChildDirectedTreatment,
            tagForUnderAgeOfConsent: privacy.tagForUnderAgeOfConsent,
            maxAdContentRating: privacy.maxAdContentRating,
            nonPersonalizedAds: privacy.nonPersonalizedAds,
            bannerUnitId,
            isTestMode: IS_TEST_MODE,
          })
        );
      } catch (err) {
        console.warn('[AdMob Native] Falha ao comunicar com AndroidAdMobBridge', err);
      }
    }

    // 2. Caso haja plugin Capacitor AdMob:
    if (win.Capacitor?.Plugins?.AdMob) {
      try {
        win.Capacitor.Plugins.AdMob.setRequestConfiguration({
          tagForChildDirectedTreatment: privacy.tagForChildDirectedTreatment,
          tagForUnderAgeOfConsent: privacy.tagForUnderAgeOfConsent,
          maxAdContentRating: privacy.maxAdContentRating,
        });
      } catch (err) {
        console.warn('[AdMob Capacitor] Falha ao configurar Capacitor AdMob', err);
      }
    }
  }
}

export const adMobService = AdMobService.getInstance();
