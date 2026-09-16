package com.trilhadosaber.app

import android.app.Activity
import android.os.Bundle
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import com.google.ads.mediation.admob.AdMobAdapter
import com.google.android.gms.ads.*

/**
 * ============================================================================
 * GERENCIADOR NATIVO DO GOOGLE ADMOB - APLICATIVO "TRILHA DO SABER"
 * ============================================================================
 *
 * Cumpre integralmente os requisitos da Política para Famílias do Google Play:
 * 1. Tratamento dirigido a crianças (COPPA / TFCD)
 * 2. Menores de idade com consentimento protegido (TFUA)
 * 3. Classificação máxima de conteúdo de anúncios: "G" para crianças
 * 4. Sem publicidade personalizada para crianças (NPA = 1)
 * 5. Não transmissão de identificadores de publicidade (GAID/AAID)
 * 6. Sem anúncios em telas de provas ou exercícios
 * ============================================================================
 */
object AdMobManager {

    private const val TAG = "AdMobManager"

    // ========================================================================
    // BLOCO DE IDENTIFICADORES DO ADMOB
    // ========================================================================
    // ID Oficial de Teste do Google AdMob para Banner Android:
    private const val TEST_BANNER_AD_UNIT_ID = "ca-app-pub-3940256099942544/6300978111"

    // ------------------------------------------------------------------------
    // 📌 BLOCO DE ANÚNCIOS DO USUÁRIO: "Banner_principal"
    // Ad Unit ID: ca-app-pub-8922902046490534/7288943940
    // (IS_TEST_MODE = true mantém os anúncios de teste ativos durante o desenvolvimento
    // para evitar cliques ou impressões inválidas na conta do AdMob).
    // ------------------------------------------------------------------------
    private const val PRODUCTION_BANNER_AD_UNIT_ID = "ca-app-pub-8922902046490534/7288943940"
    private const val IS_TEST_MODE = true

    private var adView: AdView? = null
    private var isAdVisible = false

    /**
     * Retorna o Banner Ad Unit ID ativo
     */
    fun getActiveBannerAdUnitId(): String {
        return if (IS_TEST_MODE || PRODUCTION_BANNER_AD_UNIT_ID.isBlank()) {
            TEST_BANNER_AD_UNIT_ID
        } else {
            PRODUCTION_BANNER_AD_UNIT_ID
        }
    }

    /**
     * Inicializa o Google Mobile Ads SDK no Android
     */
    fun initialize(activity: Activity, onInitialized: (() -> Unit)? = null) {
        MobileAds.initialize(activity) { initializationStatus ->
            Log.d(TAG, "Google Mobile Ads SDK Inicializado: $initializationStatus")
            onInitialized?.invoke()
        }
    }

    /**
     * Configura as regras da Política para Famílias de acordo com a faixa etária:
     * - "crianca" ou "nao_informada": TFCD=true, TFUA=true, maxRating=G, npa=1
     * - "adolescente": TFCD=false, TFUA=true, maxRating=PG, npa=1
     * - "adulto": TFCD=false, TFUA=false, maxRating=PG
     *
     * @param ageGroup: "crianca" | "adolescente" | "adulto" | "nao_informada"
     */
    fun applyFamilyPolicyRequestConfiguration(ageGroup: String) {
        val requestConfigBuilder = RequestConfiguration.Builder()

        when (ageGroup) {
            "crianca", "nao_informada" -> {
                // REGRA 5 & 6: Tratamento dirigido a crianças e Classificação G
                requestConfigBuilder
                    .setTagForChildDirectedTreatment(RequestConfiguration.TAG_FOR_CHILD_DIRECTED_TREATMENT_TRUE)
                    .setTagForUnderAgeOfConsent(RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE)
                    .setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_G)
                Log.d(TAG, "AdMob configurado com proteção infantil máxima (G, TFCD=true, TFUA=true)")
            }
            "adolescente" -> {
                requestConfigBuilder
                    .setTagForChildDirectedTreatment(RequestConfiguration.TAG_FOR_CHILD_DIRECTED_TREATMENT_FALSE)
                    .setTagForUnderAgeOfConsent(RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE)
                    .setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_PG)
                Log.d(TAG, "AdMob configurado para adolescente (TFUA=true)")
            }
            "adulto" -> {
                requestConfigBuilder
                    .setTagForChildDirectedTreatment(RequestConfiguration.TAG_FOR_CHILD_DIRECTED_TREATMENT_FALSE)
                    .setTagForUnderAgeOfConsent(RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_FALSE)
                    .setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_PG)
                Log.d(TAG, "AdMob configurado para adulto")
            }
        }

        MobileAds.setRequestConfiguration(requestConfigBuilder.build())
    }

    /**
     * Constrói uma AdRequest respeitando o bloqueio de publicidade personalizada
     * e o bloqueio de identificadores de publicidade para crianças.
     */
    fun buildAdRequest(ageGroup: String): AdRequest {
        val isChildOrTeen = ageGroup == "crianca" || ageGroup == "nao_informada" || ageGroup == "adolescente"
        val builder = AdRequest.Builder()

        if (isChildOrTeen) {
            // REGRA 7: Anúncios Não-Personalizados (npa: 1) para crianças e adolescentes
            val extras = Bundle().apply {
                putString("npa", "1")
            }
            builder.addNetworkExtrasBundle(AdMobAdapter::class.java, extras)
        }

        return builder.build()
    }

    /**
     * Carrega e exibe um banner discreto na parte inferior da tela,
     * sem cobrir botões de navegação nem conteúdo de estudo.
     */
    fun showBottomBanner(activity: Activity, rootContainer: ViewGroup, ageGroup: String) {
        if (adView != null) {
            adView?.visibility = View.VISIBLE
            isAdVisible = true
            return
        }

        applyFamilyPolicyRequestConfiguration(ageGroup)

        val newAdView = AdView(activity).apply {
            adUnitId = getActiveBannerAdUnitId()
            setAdSize(AdSize.BANNER) // 320x50 padrão discreto
        }

        val layoutParams = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
            bottomMargin = 140 // Espaçamento para NÃO cobrir a BottomNavBar
        }

        newAdView.layoutParams = layoutParams
        newAdView.adListener = object : AdListener() {
            override fun onAdLoaded() {
                Log.d(TAG, "Banner carregado com sucesso (Bloco: ${getActiveBannerAdUnitId()})")
            }

            override fun onAdFailedToLoad(loadAdError: LoadAdError) {
                Log.w(TAG, "Falha ao carregar anúncio de teste: ${loadAdError.message}")
            }
        }

        val adRequest = buildAdRequest(ageGroup)
        newAdView.loadAd(adRequest)

        rootContainer.addView(newAdView)
        adView = newAdView
        isAdVisible = true
    }

    /**
     * REGRA 11 & 12: Oculta o banner imediatamente quando o usuário entra em
     * telas de simulado, provas, desafios ou resolução de questões.
     */
    fun hideBanner() {
        adView?.visibility = View.GONE
        isAdVisible = false
        Log.d(TAG, "Banner ocultado para proteger foco educacional.")
    }

    /**
     * Libera recursos
     */
    fun destroy() {
        adView?.destroy()
        adView = null
        isAdVisible = false
    }
}
