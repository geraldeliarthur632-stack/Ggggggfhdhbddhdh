package com.trilhadosaber.app

import android.annotation.SuppressLint
import android.content.pm.ActivityInfo
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.webkit.*
import android.widget.FrameLayout
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat

/**
 * ============================================================================
 * TRILHA DO SABER - ATIVIDADE PRINCIPAL ANDROID (MAIN ACTIVITY)
 * ============================================================================
 * - Exclusivamente em Orientação Retrato (Portrait)
 * - Container WebView de alto desempenho para o aplicativo "Trilha do Saber"
 * - Integração Nativa com Google AdMob via AdMobManager
 * - Comunicação bidirecional (JavaScript Interface) para Política para Famílias
 * ============================================================================
 */
class MainActivity : AppCompatActivity() {

    private lateinit var rootLayout: FrameLayout
    private lateinit var webView: WebView
    private var currentAgeGroup: String = "nao_informada"

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 1. Forçar orientação retrato conforme especificação
        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT

        // 2. Configurar barra de status e cores do sistema
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.parseColor("#070a12")
        window.navigationBarColor = Color.parseColor("#070a12")

        // 3. Criar Layout Raiz
        rootLayout = FrameLayout(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#070a12"))
        }
        setContentView(rootLayout)

        // 4. Inicializar Google Mobile Ads SDK (AdMob)
        AdMobManager.initialize(this) {
            AdMobManager.applyFamilyPolicyRequestConfiguration(currentAgeGroup)
        }

        // 5. Configurar WebView do Trilha do Saber
        setupWebView()

        // 6. Tratar botão voltar nativo do Android
        setupBackNavigation()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView = WebView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#070a12"))
        }

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            useWideViewPort = true
            loadWithOverviewMode = true
            mediaPlaybackRequiresUserGesture = false
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }

        // Bridge JavaScript para comunicação bidirecional com o app React
        webView.addJavascriptInterface(WebAppBridge(), "AndroidAppBridge")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                return false
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // Notifica o frontend de que está rodando no aplicativo Android nativo
                webView.evaluateJavascript(
                    "window.__IS_ANDROID_APP__ = true; window.__ANDROID_VERSION__ = '1.0.0';",
                    null
                )
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                return true
            }
        }

        rootLayout.addView(webView)

        // Carregar aplicativo local empacotado em assets ou fallback
        loadAppContent()
    }

    private fun loadAppContent() {
        // Tenta carregar os arquivos construídos no APK: assets/dist/index.html
        try {
            val assetList = assets.list("dist")
            if (assetList != null && assetList.contains("index.html")) {
                webView.loadUrl("file:///android_asset/dist/index.html")
                return
            }
        } catch (_: Exception) {
            // Se ainda não estiver empacotado, tenta www/index.html
        }

        try {
            val wwwList = assets.list("www")
            if (wwwList != null && wwwList.contains("index.html")) {
                webView.loadUrl("file:///android_asset/www/index.html")
                return
            }
        } catch (_: Exception) {
            // Prossegue para o index padrão
        }

        // Caso padrão: carrega via file:///android_asset/index.html
        webView.loadUrl("file:///android_asset/index.html")
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    // Executa função de retorno no app React se disponível
                    webView.evaluateJavascript(
                        "if (typeof window.__handleAndroidBackPress === 'function') { window.__handleAndroidBackPress(); } else { 'default'; }",
                    ) { result ->
                        if (result != "\"handled\"") {
                            finish()
                        }
                    }
                }
            }
        })
    }

    /**
     * Bridge JavaScript para integração fluida entre React e o Android nativo
     */
    inner class WebAppBridge {
        @JavascriptInterface
        fun isNativeAndroid(): Boolean = true

        @JavascriptInterface
        fun getAppVersion(): String = "1.0.0"

        @JavascriptInterface
        fun setAgeGroup(ageGroup: String) {
            runOnUiThread {
                currentAgeGroup = ageGroup
                AdMobManager.applyFamilyPolicyRequestConfiguration(ageGroup)
            }
        }

        @JavascriptInterface
        fun showNativeAdBanner(ageGroup: String) {
            runOnUiThread {
                currentAgeGroup = ageGroup
                AdMobManager.showBottomBanner(this@MainActivity, rootLayout, ageGroup)
            }
        }

        @JavascriptInterface
        fun hideNativeAdBanner() {
            runOnUiThread {
                AdMobManager.hideBanner()
            }
        }
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onDestroy() {
        AdMobManager.destroy()
        webView.destroy()
        super.onDestroy()
    }
}
