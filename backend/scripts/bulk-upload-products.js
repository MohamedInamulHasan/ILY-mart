import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import connectDB from '../src/config/database.js';
import Product from '../src/models/Product.js';
import Store from '../src/models/Store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload an image (local file path or web URL) to Cloudinary
 * Returns the secure Cloudinary URL (https://res.cloudinary.com/...)
 */
async function uploadToCloudinary(imageSource, baseDir) {
    if (!imageSource || typeof imageSource !== 'string') return '';
    const trimmed = imageSource.trim();
    if (!trimmed) return '';

    // If already on our Cloudinary, keep it as is
    if (trimmed.includes('cloudinary.com') && trimmed.includes(process.env.CLOUDINARY_CLOUD_NAME || '')) {
        return trimmed;
    }

    try {
        let uploadTarget = trimmed;

        // Check if it's a local file
        const isRemoteUrl = /^https?:\/\//i.test(trimmed);
        if (!isRemoteUrl) {
            // Check direct path or relative to baseDir or backend/data/images/
            const candidatePaths = [
                path.resolve(baseDir, trimmed),
                path.resolve(process.cwd(), trimmed),
                path.resolve(__dirname, '../data/images', trimmed),
                path.resolve(__dirname, '../data', trimmed)
            ];

            const found = candidatePaths.find(p => fs.existsSync(p));
            if (found) {
                uploadTarget = found;
            } else {
                console.warn(`   ⚠️ Local image file not found: "${trimmed}" (checked candidate paths)`);
                return trimmed; // fallback
            }
        }

        console.log(`   ☁️ Uploading to Cloudinary: ${trimmed}...`);
        const result = await cloudinary.uploader.upload(uploadTarget, {
            folder: 'homly_products',
            resource_type: 'image',
            quality: 'auto',
            fetch_format: 'auto'
        });

        console.log(`   ✅ Cloudinary URL generated: ${result.secure_url}`);
        return result.secure_url;
    } catch (err) {
        console.error(`   ❌ Failed to upload "${imageSource}" to Cloudinary:`, err.message);
        return trimmed; // fallback to original string
    }
}

function parseCSV(content) {
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = [];
        let inQuotes = false;
        let currentValue = '';

        for (let c = 0; c < line.length; c++) {
            const char = line[c];
            if (char === '"' || char === "'") {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(currentValue.trim().replace(/^["']|["']$/g, ''));
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim().replace(/^["']|["']$/g, ''));

        if (values.length === headers.length) {
            const obj = {};
            headers.forEach((header, idx) => {
                obj[header] = values[idx];
            });
            rows.push(obj);
        }
    }

    return rows;
}

async function bulkUpload() {
    try {
        await connectDB();

        const inputArg = process.argv[2];
        let filePath = inputArg 
            ? path.resolve(process.cwd(), inputArg)
            : path.join(__dirname, '../data/products-import.csv');

        if (!fs.existsSync(filePath)) {
            const jsonPath = filePath.replace(/\.csv$/i, '.json');
            if (fs.existsSync(jsonPath)) {
                filePath = jsonPath;
            } else {
                console.error(`❌ Input file not found: ${filePath}`);
                console.log(`\n💡 Please create your CSV file at:`);
                console.log(`   ${path.join(__dirname, '../data/products-import.csv')}`);
                process.exit(1);
            }
        }

        const baseDir = path.dirname(filePath);
        console.log(`\n==================================================`);
        console.log(`📦 ILY-MART BULK PRODUCT IMPORTER`);
        console.log(`📂 Reading: ${filePath}`);
        console.log(`☁️ Cloudinary Account: ${process.env.CLOUDINARY_CLOUD_NAME || 'configured'}`);
        console.log(`==================================================\n`);

        const rawData = fs.readFileSync(filePath, 'utf-8');
        const items = filePath.endsWith('.json') ? JSON.parse(rawData) : parseCSV(rawData);

        if (!Array.isArray(items) || items.length === 0) {
            console.log('⚠️ No products found in file.');
            process.exit(0);
        }

        console.log(`🔍 Found ${items.length} products to process.\n`);

        // Cache stores for quick name matching
        const allStores = await Store.find({});
        const storeMap = new Map();
        allStores.forEach(s => storeMap.set(s.name.toLowerCase().trim(), s._id));

        let insertedCount = 0;
        let skippedCount = 0;
        const docs = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const title = (item.title || item.name || '').trim();
            const price = Number(item.price || 0);
            const category = (item.category || '').trim();
            const rawImage = (item.image || item.imageUrl || item.image_url || '').trim();

            console.log(`[${i + 1}/${items.length}] Processing product: "${title || 'Untitled'}"`);

            if (!title || !price || !category || !rawImage) {
                console.warn(`   ⚠️ Skipped: Missing title, price, category, or image.\n`);
                skippedCount++;
                continue;
            }

            // Upload image to Cloudinary (if local path, filename, or web URL)
            const cloudinaryUrl = await uploadToCloudinary(rawImage, baseDir);

            // Match store
            let storeId = null;
            if (item.storeId && mongoose.isValidObjectId(item.storeId)) {
                storeId = item.storeId;
            } else if (item.storeName) {
                storeId = storeMap.get(item.storeName.toLowerCase().trim()) || null;
            }

            // Subcategory
            let subcategory = [];
            if (item.subcategory) {
                if (Array.isArray(item.subcategory)) subcategory = item.subcategory;
                else if (typeof item.subcategory === 'string') {
                    subcategory = item.subcategory.split(';').map(s => s.trim()).filter(Boolean);
                }
            }

            docs.push({
                title,
                description: item.description || title,
                price,
                category,
                subcategory,
                image: cloudinaryUrl,
                images: [cloudinaryUrl],
                stock: item.stock !== undefined && item.stock !== '' ? Number(item.stock) : 100,
                unit: item.unit || '1 pc',
                mention: item.mention || '',
                featured: item.featured === true || item.featured === 'true',
                isAvailable: item.isAvailable !== false && item.isAvailable !== 'false',
                storeId,
                salesCount: 0
            });

            console.log(`   ✔️ Ready for database insertion.\n`);
        }

        if (docs.length > 0) {
            console.log(`⏳ Inserting ${docs.length} products into MongoDB...`);
            const result = await Product.insertMany(docs, { ordered: false });
            insertedCount = result.length;
            console.log(`\n🎉 Successfully inserted ${insertedCount} products into database!`);
        }

        console.log(`\n==================================================`);
        console.log(`📊 FINAL SUMMARY:`);
        console.log(`   Total rows: ${items.length}`);
        console.log(`   Successfully imported to DB: ${insertedCount}`);
        console.log(`   Skipped: ${skippedCount}`);
        console.log(`==================================================\n`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Bulk upload failed:', err);
        process.exit(1);
    }
}

bulkUpload();
