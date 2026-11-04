const fs = require('fs');

// 1. categoryController.js
let catCode = fs.readFileSync('backend/src/controllers/categoryController.js', 'utf8');
catCode = catCode.replace('const catObj = cat.toObject();', 'const catObj = cat;');
catCode = catCode.replace('await category.deleteOne();', 'await Category.findByIdAndDelete(req.params.id);');
fs.writeFileSync('backend/src/controllers/categoryController.js', catCode, 'utf8');
console.log('Fixed categoryController.js');

// 2. storeController.js
let storeCode = fs.readFileSync('backend/src/controllers/storeController.js', 'utf8');
storeCode = storeCode.replace('const storeObj = store.toObject();', 'const storeObj = store;');
fs.writeFileSync('backend/src/controllers/storeController.js', storeCode, 'utf8');
console.log('Fixed storeController.js');

// 3. serviceController.js
let serviceCode = fs.readFileSync('backend/src/controllers/serviceController.js', 'utf8');
serviceCode = serviceCode.replace('await service.deleteOne();', 'await Service.findByIdAndDelete(req.params.id);');
fs.writeFileSync('backend/src/controllers/serviceController.js', serviceCode, 'utf8');
console.log('Fixed serviceController.js');
