import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { CatalogModule } from './catalog/catalog.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { PaymentsModule } from './payments/payments.module';
import { PromotionsModule } from './promotions/promotions.module';
import { LoyaltyModule } from './loyalty/loyalty.module';

import { MailModule } from './mail/mail.module';
import { StaffPosModule } from './staff-pos/staff-pos.module';
import { StaffInventoryModule } from './staff-inventory/staff-inventory.module';
import { StaffOrdersModule } from './staff-orders/staff-orders.module';
import { StoresModule } from './stores/stores.module';
import { ChatModule } from './chat/chat.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AiModule } from './ai/ai.module';
import { FavoritesModule } from './favorites/favorites.module';
import { AddressesModule } from './addresses/addresses.module';
import { GHNModule } from './ghn/ghn.module';
import { ShippingModule } from './shipping/shipping.module';
import { BannersModule } from './banners/banners.module';
import { JournalsModule } from './journals/journals.module';
import { NotificationsModule } from './notifications/notifications.module';
import { QuizModule } from './quiz/quiz.module';
import { ReturnsModule } from './returns/returns.module';
import { AiPreferencesModule } from './ai-preferences/ai-preferences.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    CatalogModule,
    CloudinaryModule,
    PaymentsModule,
    PromotionsModule,
    LoyaltyModule,
    MailModule,
    StaffPosModule,
    StaffInventoryModule,
    StaffOrdersModule,
    StoresModule,
    ChatModule,
    ReviewsModule,
    AiModule,
    FavoritesModule,
    AddressesModule,
    GHNModule,
    ShippingModule,
    BannersModule,
    JournalsModule,
    NotificationsModule,
    QuizModule,
    ReturnsModule,
    AiPreferencesModule,
    AnalyticsModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
