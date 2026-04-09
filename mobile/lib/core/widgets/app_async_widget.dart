import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../utils/api_error_mapper.dart';
import 'app_error_widget.dart';
import 'shimmer_loading.dart';

/// Standardized wrapper for rendering [AsyncValue] states.
///
/// Eliminates repeated `.when(loading: ..., error: ..., data: ...)` blocks
/// across screens and ensures every async widget has consistent
/// loading / error / data UX.
///
/// Usage:
/// ```dart
/// final productsAsync = ref.watch(productsProvider);
///
/// AppAsyncWidget<List<Product>>(
///   value: productsAsync,
///   onRetry: () => ref.invalidate(productsProvider),
///   loadingBuilder: () => const ShimmerProductGrid(),
///   dataBuilder: (products) => ProductGrid(products: products),
/// )
/// ```
class AppAsyncWidget<T> extends StatelessWidget {
  /// The [AsyncValue] to observe.
  final AsyncValue<T> value;

  /// Builder called when data is available.
  final Widget Function(T data) dataBuilder;

  /// Optional custom loading widget. Defaults to [ShimmerCard].
  final Widget Function()? loadingBuilder;

  /// Optional custom error widget. Defaults to [AppErrorWidget].
  final Widget Function(Object error, StackTrace? stack)? errorBuilder;

  /// Called on retry tap inside the default [AppErrorWidget].
  /// Ignored if a custom [errorBuilder] is provided.
  final VoidCallback? onRetry;

  const AppAsyncWidget({
    super.key,
    required this.value,
    required this.dataBuilder,
    this.loadingBuilder,
    this.errorBuilder,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return value.when(
      loading: () => loadingBuilder?.call() ?? const ShimmerCard(),
      error: (error, stack) =>
          errorBuilder?.call(error, stack) ??
          AppErrorWidget(message: _fallbackMessage(error), onRetry: onRetry),
      data: dataBuilder,
    );
  }

  /// Delegates to [ApiErrorMapper] for consistent Vietnamese error messages.
  static String _fallbackMessage(Object error) {
    return ApiErrorMapper.toUserMessage(error);
  }
}
