import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:perfume_gpt_app/l10n/app_localizations.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/theme/app_theme.dart';
import 'core/routing/app_router.dart';
import 'core/providers/settings_provider.dart';
import 'core/config/app_config.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Load environment variables before any provider/widget can touch EnvConfig.
  try {
    await dotenv.load(fileName: '.env');
  } catch (_) {
    // Fallback for current project asset layout.
    await dotenv.load(fileName: 'assets/.env');
  }

  final prefs = await SharedPreferences.getInstance();

  // ============================================
  // DEVELOPMENT MODE - Mock Authentication
  // ============================================
  // Khi AppConfig.useMockAuth = true, app sẽ:
  // - Không cần Supabase connection
  // - Sử dụng mock user data
  // - Cho phép phát triển UI mà không cần backend

  if (!AppConfig.useMockAuth) {
    // Optional: keep Supabase bootstrap for features still relying on it.
    // Dotenv is already loaded above.
    await Supabase.initialize(
      url: dotenv.env['SUPABASE_URL']!,
      anonKey: dotenv.env['SUPABASE_ANON_KEY']!,
    );
  }

  runApp(
    ProviderScope(
      overrides: [sharedPreferencesProvider.overrideWithValue(prefs)],
      child: const MyApp(),
    ),
  );
}

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(themeModeProvider);
    final locale = ref.watch(localeProvider);

    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'Lumina',

      // Theme
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,

      // Localization
      locale: locale,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [Locale('en'), Locale('vi')],

      routerConfig: router,
    );
  }
}
