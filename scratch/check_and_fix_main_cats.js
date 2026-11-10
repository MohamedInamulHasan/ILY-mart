import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const uri = process.env.MONGODB_URI;

async function run() {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const settingsCol = db.collection('settings');
    const categoriesCol = db.collection('categories');

    const mainCatsSetting = await settingsCol.findOne({ key: 'main_categories' });
    if (!mainCatsSetting) {
        console.log('No main_categories setting found');
        process.exit(0);
    }

    console.log('Current Main Categories:');
    for (const mc of mainCatsSetting.value) {
        console.log(`- ${mc.name}:`, mc.categories);
    }

    // Inspect categories in DB
    const allCategories = await categoriesCol.find({}).toArray();
    console.log('\nAll Categories in DB:');
    for (const c of allCategories) {
        console.log(`- ${c.name} | mainCategory: ${c.mainCategory}`);
    }

    mongoose.disconnect();
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
