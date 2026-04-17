const axios = require('axios');

async function test() {
  try {
    const res = await axios.get('http://localhost:5000/api/v1/products/cmnt44aeu000lc8gkly6kp50r');
    console.log('Product Name:', res.data.name);
    console.log('Scent Analysis:', res.data.scentAnalysis);
  } catch (err) {
    console.error('Error fetching product:', err.message);
  }
}

test();
