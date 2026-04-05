import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/payment_method.dart';

const _kPrefKey = 'preferred_payment_method_id';

/// All available hardcoded payment methods – no API call needed.
final _allPaymentMethods = [
  PaymentMethod(
    id: 'cod',
    type: PaymentMethodType.cod,
    label: 'Thanh toán khi nhận hàng',
    description: 'Thanh toán khi nhận sản phẩm',
    isDefault: false,
  ),
  PaymentMethod(
    id: 'payos',
    type: PaymentMethodType.payos,
    label: 'Chuyển khoản / PayOS',
    description: 'Quét mã QR hoặc chuyển khoản ngân hàng',
    isDefault: false,
  ),
];

final paymentMethodsProvider =
    NotifierProvider<PaymentMethodsNotifier, List<PaymentMethod>>(
      PaymentMethodsNotifier.new,
    );

final selectedPaymentMethodProvider = Provider<PaymentMethod?>((ref) {
  final methods = ref.watch(paymentMethodsProvider);
  if (methods.isEmpty) return null;

  for (final method in methods) {
    if (method.isDefault) return method;
  }

  return methods.first;
});

final paymentMethodUpdatingIdProvider = StateProvider<String?>((ref) => null);

final updatePaymentMethodProvider = Provider<UpdatePaymentMethodController>((
  ref,
) {
  return UpdatePaymentMethodController(ref);
});

class PaymentMethodsNotifier extends Notifier<List<PaymentMethod>> {
  @override
  List<PaymentMethod> build() {
    // Start with COD as default, then load the persisted selection.
    _loadPersistedSelection();
    return _allPaymentMethods
        .map((m) => m.copyWith(isDefault: m.id == 'cod'))
        .toList();
  }

  Future<void> _loadPersistedSelection() async {
    final prefs = await SharedPreferences.getInstance();
    final savedId = prefs.getString(_kPrefKey);
    if (savedId != null) {
      state = state.map((m) => m.copyWith(isDefault: m.id == savedId)).toList();
    }
  }

  void setOptimisticDefault(String methodId) {
    state = state
        .map((item) => item.copyWith(isDefault: item.id == methodId))
        .toList();
    // Persist to disk.
    SharedPreferences.getInstance().then(
      (prefs) => prefs.setString(_kPrefKey, methodId),
    );
  }

  void restore(List<PaymentMethod> methods) {
    state = methods;
  }
}

class UpdatePaymentMethodController {
  final Ref _ref;

  UpdatePaymentMethodController(this._ref);

  void setDefault(PaymentMethod method) {
    if (_ref.read(paymentMethodUpdatingIdProvider) != null) {
      return;
    }

    final notifier = _ref.read(paymentMethodsProvider.notifier);
    _ref.read(paymentMethodUpdatingIdProvider.notifier).state = method.id;
    notifier.setOptimisticDefault(method.id);
    _ref.read(paymentMethodUpdatingIdProvider.notifier).state = null;
  }
}
