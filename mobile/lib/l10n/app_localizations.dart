import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_vi.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('vi'),
  ];

  /// No description provided for @appName.
  ///
  /// In en, this message translates to:
  /// **'Lumina'**
  String get appName;

  /// No description provided for @atelierDeParfum.
  ///
  /// In en, this message translates to:
  /// **'ATELIER DE PARFUM'**
  String get atelierDeParfum;

  /// No description provided for @welcomeBack.
  ///
  /// In en, this message translates to:
  /// **'Welcome Back'**
  String get welcomeBack;

  /// No description provided for @emailAddress.
  ///
  /// In en, this message translates to:
  /// **'EMAIL ADDRESS'**
  String get emailAddress;

  /// No description provided for @password.
  ///
  /// In en, this message translates to:
  /// **'PASSWORD'**
  String get password;

  /// No description provided for @forgotPassword.
  ///
  /// In en, this message translates to:
  /// **'FORGOT PASSWORD?'**
  String get forgotPassword;

  /// No description provided for @login.
  ///
  /// In en, this message translates to:
  /// **'LOGIN'**
  String get login;

  /// No description provided for @dontHaveAccount.
  ///
  /// In en, this message translates to:
  /// **'DON\'T HAVE AN ACCOUNT? '**
  String get dontHaveAccount;

  /// No description provided for @createAccount.
  ///
  /// In en, this message translates to:
  /// **'CREATE ACCOUNT'**
  String get createAccount;

  /// No description provided for @or.
  ///
  /// In en, this message translates to:
  /// **'OR'**
  String get or;

  /// No description provided for @google.
  ///
  /// In en, this message translates to:
  /// **'GOOGLE'**
  String get google;

  /// No description provided for @facebook.
  ///
  /// In en, this message translates to:
  /// **'FACEBOOK'**
  String get facebook;

  /// No description provided for @joinTheAtelier.
  ///
  /// In en, this message translates to:
  /// **'Join the Atelier'**
  String get joinTheAtelier;

  /// No description provided for @fullName.
  ///
  /// In en, this message translates to:
  /// **'FULL NAME'**
  String get fullName;

  /// No description provided for @phoneOptional.
  ///
  /// In en, this message translates to:
  /// **'PHONE (OPTIONAL)'**
  String get phoneOptional;

  /// No description provided for @agreeToTerms.
  ///
  /// In en, this message translates to:
  /// **'I AGREE TO THE TERMS AND PRIVACY POLICY'**
  String get agreeToTerms;

  /// No description provided for @registrationSuccessful.
  ///
  /// In en, this message translates to:
  /// **'REGISTRATION SUCCESSFUL. PLEASE VERIFY YOUR EMAIL.'**
  String get registrationSuccessful;

  /// No description provided for @pleaseFillFields.
  ///
  /// In en, this message translates to:
  /// **'PLEASE FILL IN ALL REQUIRED FIELDS'**
  String get pleaseFillFields;

  /// No description provided for @pleaseAcceptTerms.
  ///
  /// In en, this message translates to:
  /// **'PLEASE ACCEPT THE TERMS & CONDITIONS'**
  String get pleaseAcceptTerms;

  /// No description provided for @accessDenied.
  ///
  /// In en, this message translates to:
  /// **'ACCESS DENIED'**
  String get accessDenied;

  /// No description provided for @pleaseProvideCredentials.
  ///
  /// In en, this message translates to:
  /// **'PLEASE PROVIDE CREDENTIALS'**
  String get pleaseProvideCredentials;

  /// No description provided for @dnaScent.
  ///
  /// In en, this message translates to:
  /// **'CREATE YOUR DNA SCENT'**
  String get dnaScent;

  /// No description provided for @onboarding1Title.
  ///
  /// In en, this message translates to:
  /// **'THE ART OF SCENT'**
  String get onboarding1Title;

  /// No description provided for @onboarding1Subtitle.
  ///
  /// In en, this message translates to:
  /// **'Discover your unique fragrance identity through our AI-curated collection.'**
  String get onboarding1Subtitle;

  /// No description provided for @onboarding2Title.
  ///
  /// In en, this message translates to:
  /// **'NEURAL CURATION'**
  String get onboarding2Title;

  /// No description provided for @onboarding2Subtitle.
  ///
  /// In en, this message translates to:
  /// **'Our AI analyzes thousands of scent notes to find your perfect match.'**
  String get onboarding2Subtitle;

  /// No description provided for @onboarding3Title.
  ///
  /// In en, this message translates to:
  /// **'TIMELESS LUXURY'**
  String get onboarding3Title;

  /// No description provided for @onboarding3Subtitle.
  ///
  /// In en, this message translates to:
  /// **'Experience the future of fragrance, crafted with traditional excellence.'**
  String get onboarding3Subtitle;

  /// No description provided for @next.
  ///
  /// In en, this message translates to:
  /// **'NEXT'**
  String get next;

  /// No description provided for @beginJourney.
  ///
  /// In en, this message translates to:
  /// **'BEGIN THE JOURNEY'**
  String get beginJourney;

  /// No description provided for @neuralArchitect.
  ///
  /// In en, this message translates to:
  /// **'NEURAL ARCHITECT'**
  String get neuralArchitect;

  /// No description provided for @describeVision.
  ///
  /// In en, this message translates to:
  /// **'DESCRIBE YOUR VISION...'**
  String get describeVision;

  /// No description provided for @welcomeMessage.
  ///
  /// In en, this message translates to:
  /// **'Welcome to the Atelier. I am your Neural Architect. Tell me, what emotional landscape do you wish to explore through scent today?'**
  String get welcomeMessage;

  /// No description provided for @yourProfile.
  ///
  /// In en, this message translates to:
  /// **'YOUR PROFILE'**
  String get yourProfile;

  /// No description provided for @atelierMember.
  ///
  /// In en, this message translates to:
  /// **'ATELIER MEMBER'**
  String get atelierMember;

  /// No description provided for @theAtelier.
  ///
  /// In en, this message translates to:
  /// **'THE ATELIER'**
  String get theAtelier;

  /// No description provided for @acquisitionHistory.
  ///
  /// In en, this message translates to:
  /// **'ACQUISITION HISTORY'**
  String get acquisitionHistory;

  /// No description provided for @curatedCollection.
  ///
  /// In en, this message translates to:
  /// **'CURATED COLLECTION'**
  String get curatedCollection;

  /// No description provided for @neuralDnaArchive.
  ///
  /// In en, this message translates to:
  /// **'NEURAL DNA ARCHIVE'**
  String get neuralDnaArchive;

  /// No description provided for @system.
  ///
  /// In en, this message translates to:
  /// **'SYSTEM'**
  String get system;

  /// No description provided for @appearance.
  ///
  /// In en, this message translates to:
  /// **'APPEARANCE'**
  String get appearance;

  /// No description provided for @language.
  ///
  /// In en, this message translates to:
  /// **'LANGUAGE'**
  String get language;

  /// No description provided for @concierge.
  ///
  /// In en, this message translates to:
  /// **'CONCIERGE'**
  String get concierge;

  /// No description provided for @disconnectSession.
  ///
  /// In en, this message translates to:
  /// **'DISCONNECT SESSION'**
  String get disconnectSession;

  /// No description provided for @luminaAtelier.
  ///
  /// In en, this message translates to:
  /// **'LUMINA ATELIER'**
  String get luminaAtelier;

  /// No description provided for @intensity.
  ///
  /// In en, this message translates to:
  /// **'INTENSITY'**
  String get intensity;

  /// No description provided for @neuralInsight.
  ///
  /// In en, this message translates to:
  /// **'NEURAL INSIGHT'**
  String get neuralInsight;

  /// No description provided for @scentProfile.
  ///
  /// In en, this message translates to:
  /// **'SCENT PROFILE'**
  String get scentProfile;

  /// No description provided for @theStory.
  ///
  /// In en, this message translates to:
  /// **'THE STORY'**
  String get theStory;

  /// No description provided for @acquireScent.
  ///
  /// In en, this message translates to:
  /// **'ACQUIRE SCENT'**
  String get acquireScent;

  /// No description provided for @topNotes.
  ///
  /// In en, this message translates to:
  /// **'TOP'**
  String get topNotes;

  /// No description provided for @heartNotes.
  ///
  /// In en, this message translates to:
  /// **'HEART'**
  String get heartNotes;

  /// No description provided for @baseNotes.
  ///
  /// In en, this message translates to:
  /// **'BASE'**
  String get baseNotes;

  /// No description provided for @orderAtelier.
  ///
  /// In en, this message translates to:
  /// **'ORDER ATELIER'**
  String get orderAtelier;

  /// No description provided for @yourSelection.
  ///
  /// In en, this message translates to:
  /// **'YOUR SELECTION'**
  String get yourSelection;

  /// No description provided for @shippingAtelier.
  ///
  /// In en, this message translates to:
  /// **'SHIPPING ATELIER'**
  String get shippingAtelier;

  /// No description provided for @change.
  ///
  /// In en, this message translates to:
  /// **'CHANGE'**
  String get change;

  /// No description provided for @paymentMethod.
  ///
  /// In en, this message translates to:
  /// **'Payment Method'**
  String get paymentMethod;

  /// No description provided for @subtotal.
  ///
  /// In en, this message translates to:
  /// **'SUBTOTAL'**
  String get subtotal;

  /// No description provided for @priorityShipping.
  ///
  /// In en, this message translates to:
  /// **'PRIORITY SHIPPING'**
  String get priorityShipping;

  /// No description provided for @complimentary.
  ///
  /// In en, this message translates to:
  /// **'COMPLIMENTARY'**
  String get complimentary;

  /// No description provided for @totalAcquisition.
  ///
  /// In en, this message translates to:
  /// **'TOTAL ACQUISITION'**
  String get totalAcquisition;

  /// No description provided for @confirmOrder.
  ///
  /// In en, this message translates to:
  /// **'CONFIRM ORDER'**
  String get confirmOrder;

  /// No description provided for @acquisitionComplete.
  ///
  /// In en, this message translates to:
  /// **'ACQUISITION COMPLETE'**
  String get acquisitionComplete;

  /// No description provided for @orderCodified.
  ///
  /// In en, this message translates to:
  /// **'Your molecular signature has been codified. Your fragrance is being prepared.'**
  String get orderCodified;

  /// No description provided for @traceOrder.
  ///
  /// In en, this message translates to:
  /// **'TRACE ORDER'**
  String get traceOrder;

  /// No description provided for @returnToAtelier.
  ///
  /// In en, this message translates to:
  /// **'RETURN TO ATELIER'**
  String get returnToAtelier;

  /// No description provided for @shoppingCart.
  ///
  /// In en, this message translates to:
  /// **'SHOPPING CART'**
  String get shoppingCart;

  /// No description provided for @yourCartEmpty.
  ///
  /// In en, this message translates to:
  /// **'YOUR CART IS EMPTY'**
  String get yourCartEmpty;

  /// No description provided for @discoverCollection.
  ///
  /// In en, this message translates to:
  /// **'Discover our curated collection'**
  String get discoverCollection;

  /// No description provided for @exploreCollection.
  ///
  /// In en, this message translates to:
  /// **'EXPLORE COLLECTION'**
  String get exploreCollection;

  /// No description provided for @promoCode.
  ///
  /// In en, this message translates to:
  /// **'PROMO CODE'**
  String get promoCode;

  /// No description provided for @apply.
  ///
  /// In en, this message translates to:
  /// **'APPLY'**
  String get apply;

  /// No description provided for @discount.
  ///
  /// In en, this message translates to:
  /// **'Discount'**
  String get discount;

  /// No description provided for @total.
  ///
  /// In en, this message translates to:
  /// **'TOTAL'**
  String get total;

  /// No description provided for @proceedCheckout.
  ///
  /// In en, this message translates to:
  /// **'PROCEED TO CHECKOUT'**
  String get proceedCheckout;

  /// No description provided for @discountApplied.
  ///
  /// In en, this message translates to:
  /// **'discount applied'**
  String get discountApplied;

  /// No description provided for @invalidPromoCode.
  ///
  /// In en, this message translates to:
  /// **'Invalid promo code'**
  String get invalidPromoCode;

  /// No description provided for @orderHistory.
  ///
  /// In en, this message translates to:
  /// **'ORDER HISTORY'**
  String get orderHistory;

  /// No description provided for @noOrdersYet.
  ///
  /// In en, this message translates to:
  /// **'NO ORDERS YET'**
  String get noOrdersYet;

  /// No description provided for @orderHistoryAppear.
  ///
  /// In en, this message translates to:
  /// **'Your order history will appear here'**
  String get orderHistoryAppear;

  /// No description provided for @startShopping.
  ///
  /// In en, this message translates to:
  /// **'START SHOPPING'**
  String get startShopping;

  /// No description provided for @orderDetails.
  ///
  /// In en, this message translates to:
  /// **'ORDER DETAILS'**
  String get orderDetails;

  /// No description provided for @orderNumber.
  ///
  /// In en, this message translates to:
  /// **'ORDER NUMBER'**
  String get orderNumber;

  /// No description provided for @orderDate.
  ///
  /// In en, this message translates to:
  /// **'ORDER DATE'**
  String get orderDate;

  /// No description provided for @orderTimeline.
  ///
  /// In en, this message translates to:
  /// **'ORDER TIMELINE'**
  String get orderTimeline;

  /// No description provided for @trackingInformation.
  ///
  /// In en, this message translates to:
  /// **'TRACKING INFORMATION'**
  String get trackingInformation;

  /// No description provided for @trackingNumber.
  ///
  /// In en, this message translates to:
  /// **'Tracking Number'**
  String get trackingNumber;

  /// No description provided for @trackShipment.
  ///
  /// In en, this message translates to:
  /// **'TRACK SHIPMENT'**
  String get trackShipment;

  /// No description provided for @items.
  ///
  /// In en, this message translates to:
  /// **'ITEMS'**
  String get items;

  /// No description provided for @shippingAddress.
  ///
  /// In en, this message translates to:
  /// **'SHIPPING ADDRESS'**
  String get shippingAddress;

  /// No description provided for @shippingFee.
  ///
  /// In en, this message translates to:
  /// **'Shipping Fee'**
  String get shippingFee;

  /// No description provided for @free.
  ///
  /// In en, this message translates to:
  /// **'FREE'**
  String get free;

  /// No description provided for @reorder.
  ///
  /// In en, this message translates to:
  /// **'REORDER'**
  String get reorder;

  /// No description provided for @cancelOrder.
  ///
  /// In en, this message translates to:
  /// **'CANCEL ORDER'**
  String get cancelOrder;

  /// No description provided for @cancelOrderConfirm.
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to cancel this order?'**
  String get cancelOrderConfirm;

  /// No description provided for @no.
  ///
  /// In en, this message translates to:
  /// **'NO'**
  String get no;

  /// No description provided for @yesCancelOrder.
  ///
  /// In en, this message translates to:
  /// **'YES, CANCEL'**
  String get yesCancelOrder;

  /// No description provided for @orderCancelled.
  ///
  /// In en, this message translates to:
  /// **'Order cancelled'**
  String get orderCancelled;

  /// No description provided for @orderPlacedSuccess.
  ///
  /// In en, this message translates to:
  /// **'Order placed successfully'**
  String get orderPlacedSuccess;

  /// No description provided for @failedToReorder.
  ///
  /// In en, this message translates to:
  /// **'Failed to reorder'**
  String get failedToReorder;

  /// No description provided for @failedToCancel.
  ///
  /// In en, this message translates to:
  /// **'Failed to cancel'**
  String get failedToCancel;

  /// No description provided for @failedLoadOrders.
  ///
  /// In en, this message translates to:
  /// **'Failed to load orders'**
  String get failedLoadOrders;

  /// No description provided for @failedLoadOrder.
  ///
  /// In en, this message translates to:
  /// **'Failed to load order'**
  String get failedLoadOrder;

  /// No description provided for @retry.
  ///
  /// In en, this message translates to:
  /// **'RETRY'**
  String get retry;

  /// No description provided for @moreItems.
  ///
  /// In en, this message translates to:
  /// **'more items'**
  String get moreItems;

  /// No description provided for @qty.
  ///
  /// In en, this message translates to:
  /// **'Qty'**
  String get qty;

  /// No description provided for @orderNumberCopied.
  ///
  /// In en, this message translates to:
  /// **'Order number copied'**
  String get orderNumberCopied;

  /// No description provided for @orderStatusPending.
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get orderStatusPending;

  /// No description provided for @orderStatusConfirmed.
  ///
  /// In en, this message translates to:
  /// **'Confirmed'**
  String get orderStatusConfirmed;

  /// No description provided for @orderStatusProcessing.
  ///
  /// In en, this message translates to:
  /// **'Processing'**
  String get orderStatusProcessing;

  /// No description provided for @orderStatusShipped.
  ///
  /// In en, this message translates to:
  /// **'Shipped'**
  String get orderStatusShipped;

  /// No description provided for @orderStatusOutForDelivery.
  ///
  /// In en, this message translates to:
  /// **'Out for Delivery'**
  String get orderStatusOutForDelivery;

  /// No description provided for @orderStatusDelivered.
  ///
  /// In en, this message translates to:
  /// **'Delivered'**
  String get orderStatusDelivered;

  /// No description provided for @orderStatusCancelled.
  ///
  /// In en, this message translates to:
  /// **'Cancelled'**
  String get orderStatusCancelled;

  /// No description provided for @orderStatusRefunded.
  ///
  /// In en, this message translates to:
  /// **'Refunded'**
  String get orderStatusRefunded;

  /// No description provided for @orderDescPending.
  ///
  /// In en, this message translates to:
  /// **'Your order is being processed'**
  String get orderDescPending;

  /// No description provided for @orderDescConfirmed.
  ///
  /// In en, this message translates to:
  /// **'Order confirmed and preparing'**
  String get orderDescConfirmed;

  /// No description provided for @orderDescProcessing.
  ///
  /// In en, this message translates to:
  /// **'Packaging your fragrance'**
  String get orderDescProcessing;

  /// No description provided for @orderDescShipped.
  ///
  /// In en, this message translates to:
  /// **'On the way to you'**
  String get orderDescShipped;

  /// No description provided for @orderDescOutForDelivery.
  ///
  /// In en, this message translates to:
  /// **'Arriving today'**
  String get orderDescOutForDelivery;

  /// No description provided for @orderDescDelivered.
  ///
  /// In en, this message translates to:
  /// **'Successfully delivered'**
  String get orderDescDelivered;

  /// No description provided for @orderDescCancelled.
  ///
  /// In en, this message translates to:
  /// **'Order cancelled'**
  String get orderDescCancelled;

  /// No description provided for @orderDescRefunded.
  ///
  /// In en, this message translates to:
  /// **'Refund processed'**
  String get orderDescRefunded;

  /// No description provided for @payment.
  ///
  /// In en, this message translates to:
  /// **'PAYMENT'**
  String get payment;

  /// No description provided for @selectPaymentMethod.
  ///
  /// In en, this message translates to:
  /// **'SELECT PAYMENT METHOD'**
  String get selectPaymentMethod;

  /// No description provided for @vnpay.
  ///
  /// In en, this message translates to:
  /// **'VNPay'**
  String get vnpay;

  /// No description provided for @momo.
  ///
  /// In en, this message translates to:
  /// **'Momo'**
  String get momo;

  /// No description provided for @cod.
  ///
  /// In en, this message translates to:
  /// **'Cash on Delivery'**
  String get cod;

  /// No description provided for @payNow.
  ///
  /// In en, this message translates to:
  /// **'PAY NOW'**
  String get payNow;

  /// No description provided for @processingPayment.
  ///
  /// In en, this message translates to:
  /// **'Processing payment...'**
  String get processingPayment;

  /// No description provided for @paymentSuccess.
  ///
  /// In en, this message translates to:
  /// **'Payment successful'**
  String get paymentSuccess;

  /// No description provided for @paymentFailed.
  ///
  /// In en, this message translates to:
  /// **'Payment failed'**
  String get paymentFailed;

  /// No description provided for @paymentCancelled.
  ///
  /// In en, this message translates to:
  /// **'Payment cancelled'**
  String get paymentCancelled;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'vi'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'vi':
      return AppLocalizationsVi();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
