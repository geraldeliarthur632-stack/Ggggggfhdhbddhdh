# ProGuard Rules para o Aplicativo "Trilha do Saber"

# Google Mobile Ads (AdMob)
-keep public class com.google.android.gms.ads.** {
   public *;
}
-keep public class com.google.ads.mediation.** {
   public *;
}
-dontwarn com.google.android.gms.ads.**

# Android WebKit & JavaScript Interface
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Kotlin Coroutines / Reflection
-keepattributes *Annotation*
-dontwarn kotlin.**
