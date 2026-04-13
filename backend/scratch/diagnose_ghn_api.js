
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function diagnose() {
  const id = 'cmnsmm7qd000bc8ogz062hgth';
  const ret = await prisma.returnRequest.findUnique({
    where: { id },
    include: { order: true, items: { include: { variant: { include: { product: true } } } } }
  });

  if (!ret) {
    console.log('Return not found');
    process.exit(1);
  }

  console.log('Return ID:', ret.id);
  console.log('Order Code:', ret.order.code);
  console.log('Origin:', ret.origin);

  // GHN Config from environment (simulating backend config)
  const token = process.env.SHIPPING_GHN_TOKEN || 'MISSING';
  const shopId = process.env.SHIPPING_GHN_SHOP_ID || '0';
  const fromDistrictId = parseInt(process.env.SHIPPING_GHN_FROM_DISTRICT_ID || '0');
  const fromWardCode = process.env.SHIPPING_GHN_FROM_WARD_CODE || '';

  console.log('GHN Config:', { token: token.substring(0, 5) + '...', shopId, fromDistrictId, fromWardCode });

  const payload = {
    payment_type_id: 1,
    required_note: 'KHONGCHOXEMHANG',
    from_name: ret.order.recipientName || 'Khách trả hàng',
    from_phone: ret.order.phone || '',
    from_address: ret.order.shippingAddress || '',
    from_ward_code: ret.order.shippingWardCode || '',
    from_district_id: ret.order.shippingDistrictId || 0,
    to_name: 'Store Refund',
    to_phone: process.env.SHIPPING_GHN_RETURN_PHONE || '0123456789',
    to_address: process.env.SHIPPING_GHN_RETURN_ADDRESS || 'Store Address',
    to_ward_code: fromWardCode,
    to_district_id: fromDistrictId,
    cod_amount: 0,
    content: `Thu hoi don hang ${ret.order.code}`,
    weight: 500,
    length: 20,
    width: 15,
    height: 10,
    service_id: ret.order.shippingServiceId || 53320,
    service_type_id: 2,
    items: ret.items.map(i => ({
      name: i.variant.product.name,
      quantity: i.quantity,
      price: 0
    }))
  };

  try {
    const res = await axios.post('https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/create', payload, {
      headers: { Token: token, ShopId: String(shopId) }
    });
    console.log('GHN Success:', res.data);
  } catch (err) {
    console.log('GHN Error:', err.message);
    if (err.response) {
      console.log('GHN Response:', JSON.stringify(err.response.data, null, 2));
    }
  }
  process.exit(0);
}

diagnose();
