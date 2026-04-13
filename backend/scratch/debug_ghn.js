
const { PrismaClient } = require('@prisma/client');
const { ShippingService } = require('../src/shipping/shipping.service');
const { ConfigService } = require('@nestjs/config');
const { GHNService } = require('../src/ghn/ghn.service');

// Mock partial NestJS context
const prisma = new PrismaClient();
const config = new ConfigService({
    SHIPPING_GHN_TOKEN: process.env.SHIPPING_GHN_TOKEN,
    SHIPPING_GHN_SHOP_ID: process.env.SHIPPING_GHN_SHOP_ID,
    SHIPPING_GHN_FROM_DISTRICT_ID: process.env.SHIPPING_GHN_FROM_DISTRICT_ID,
    SHIPPING_GHN_FROM_WARD_CODE: process.env.SHIPPING_GHN_FROM_WARD_CODE,
    SHIPPING_GHN_RETURN_ADDRESS: process.env.SHIPPING_GHN_RETURN_ADDRESS,
    SHIPPING_GHN_RETURN_PHONE: process.env.SHIPPING_GHN_RETURN_PHONE,
});

async function testGhn() {
  const ghn = new GHNService(config);
  const shipping = new ShippingService(prisma, config, ghn);
  
  const id = 'cmnsmm7qd000bc8ogz062hgth';
  console.log('Testing GHN pickup for:', id);
  try {
    const res = await shipping.createGhnReturnPickup(id);
    console.log('Success!', res);
  } catch (err) {
    console.error('FAILED:', err.message);
    if (err.response) {
      console.error('Response data:', JSON.stringify(err.response.data, null, 2));
    }
  }
  process.exit(0);
}

testGhn();
