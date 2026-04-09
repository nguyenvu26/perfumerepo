import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

// Keys for SharedPreferences
const String _themeKey = 'theme_mode';
const String _localeKey = 'language_code';

final sharedPreferencesProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError();
});

class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  final SharedPreferences _prefs;

  ThemeModeNotifier(this._prefs) : super(_loadThemeMode(_prefs));

  static ThemeMode _loadThemeMode(SharedPreferences prefs) {
    final themeStr = prefs.getString(_themeKey);
    if (themeStr == 'dark') return ThemeMode.dark;
    if (themeStr == 'system') return ThemeMode.system;
    return ThemeMode.light;
  }

  void toggleTheme() {
    if (state == ThemeMode.dark) {
      setThemeMode(ThemeMode.light);
    } else {
      setThemeMode(ThemeMode.dark);
    }
  }

  void setThemeMode(ThemeMode mode) {
    state = mode;
    _prefs.setString(_themeKey, mode.name);
  }
}

final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>((
  ref,
) {
  final prefs = ref.watch(sharedPreferencesProvider);
  return ThemeModeNotifier(prefs);
});

class LocaleNotifier extends StateNotifier<Locale> {
  final SharedPreferences _prefs;

  LocaleNotifier(this._prefs) : super(_loadLocale(_prefs));

  static Locale _loadLocale(SharedPreferences prefs) {
    return const Locale('vi');
  }

  void setLocale(Locale locale) {
    state = locale;
    _prefs.setString(_localeKey, locale.languageCode);
  }

  void toggleLocale() {
    if (state.languageCode == 'en') {
      setLocale(const Locale('vi'));
    } else {
      setLocale(const Locale('en'));
    }
  }
}

final localeProvider = StateNotifierProvider<LocaleNotifier, Locale>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider);
  return LocaleNotifier(prefs);
});
