const fs = require('fs');
const path = require('path');
const out = path.join(__dirname, 'exports.json');
const { addProduct, getProducts, updateProduct, deleteProduct } = require("./farmer-direct sales/backend/controllers/productController");
fs.writeFileSync(out, JSON.stringify({addProduct: !!addProduct, getProducts: !!getProducts, updateProduct: !!updateProduct, deleteProduct: !!deleteProduct}, null, 2));
console.log('written to', out);
