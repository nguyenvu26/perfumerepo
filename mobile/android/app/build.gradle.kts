plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

import java.util.Properties

android {
    namespace = "com.perfumegpt.perfume_gpt_app"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_11.toString()
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.perfumegpt.perfume_gpt_app"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName

        // Read .env file
        val envFile = project.rootProject.file("../../assets/.env")
        val env = Properties()
        if (envFile.exists()) {
            envFile.inputStream().use { env.load(it) }
        }

        val facebookAppId = env.getProperty("FACEBOOK_APP_ID") ?: ""
        val facebookClientToken = env.getProperty("FACEBOOK_CLIENT_TOKEN") ?: ""

        // Inject into strings resources
        resValue("string", "facebook_app_id", facebookAppId)
        resValue("string", "fb_login_protocol_scheme", "fb$facebookAppId")
        resValue("string", "facebook_client_token", facebookClientToken)
    }

    buildTypes {
        release {
            // TODO: Add your own signing config for the release build.
            // Signing with the debug keys for now, so `flutter run --release` works.
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

flutter {
    source = "../.."
}
