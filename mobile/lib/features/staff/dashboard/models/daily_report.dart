/// Daily KPI report returned by `GET /staff/reports/daily`.
class DailyReport {
  final String date;
  final double totalRevenue;
  final int totalOrders;
  final int completedOrders;
  final double avgOrderValue;
  final List<TopProduct> topProducts;

  const DailyReport({
    required this.date,
    required this.totalRevenue,
    required this.totalOrders,
    required this.completedOrders,
    required this.avgOrderValue,
    required this.topProducts,
  });

  factory DailyReport.fromJson(Map<String, dynamic> json) {
    return DailyReport(
      date: json['date'] as String,
      totalRevenue: (json['totalRevenue'] as num).toDouble(),
      totalOrders: (json['totalOrders'] as num).toInt(),
      completedOrders: (json['completedOrders'] as num).toInt(),
      avgOrderValue: (json['avgOrderValue'] as num).toDouble(),
      topProducts: (json['topProducts'] as List<dynamic>)
          .map((e) => TopProduct.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class TopProduct {
  final String productName;
  final String variantName;
  final int totalQuantity;
  final double totalRevenue;

  const TopProduct({
    required this.productName,
    required this.variantName,
    required this.totalQuantity,
    required this.totalRevenue,
  });

  factory TopProduct.fromJson(Map<String, dynamic> json) {
    return TopProduct(
      productName: json['productName'] as String,
      variantName: json['variantName'] as String,
      totalQuantity: (json['totalQuantity'] as num).toInt(),
      totalRevenue: (json['totalRevenue'] as num).toDouble(),
    );
  }
}
