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
 * Automatically find a high-resolution public photo for any food/grocery product
 */
export async function autoFindProductImage(productTitle, categoryName = '') {
    const cleanTitle = productTitle.replace(/\(.*?\)/g, '').trim();
    const queries = [
        cleanTitle,
        `${cleanTitle} ${categoryName}`.trim(),
        cleanTitle.split(' ')[0]
    ];

    for (const q of queries) {
        try {
            const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrlimit=1&prop=pageimages&format=json&pithumbsize=800`;
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 6000);
            const res = await fetch(url, { signal: controller.signal }).then(r => r.json());
            clearTimeout(timer);

            const pages = res?.query?.pages;
            if (pages) {
                const page = Object.values(pages)[0];
                const img = page?.thumbnail?.source;
                if (img && typeof img === 'string') {
                    return img;
                }
            }
        } catch (e) {
            // continue fallback
        }
    }

    // Default category fallback images
    const cat = categoryName.toLowerCase();
    if (cat.includes('fruit')) return 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800';
    if (cat.includes('veg')) return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800';
    if (cat.includes('dairy')) return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800';
    if (cat.includes('snack')) return 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=800';
    if (cat.includes('beverage') || cat.includes('tea') || cat.includes('coffee')) return 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800';
    return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800'; // General grocery
}

/**
 * Upload an image (local file path or web URL) to Cloudinary
 * Returns the secure Cloudinary URL (https://res.cloudinary.com/...)
 */
export async function uploadToCloudinary(imageSource, baseDir = process.cwd()) {
    if (!imageSource || typeof imageSource !== 'string') return '';
    const trimmed = imageSource.trim();
    if (!trimmed) return '';

    // If already on our Cloudinary, keep it as is
    if (trimmed.includes('cloudinary.com') && trimmed.includes(process.env.CLOUDINARY_CLOUD_NAME || '')) {
        return trimmed;
    }

    try {
        let uploadTarget = trimmed;

        const isRemoteUrl = /^https?:\/\//i.test(trimmed);
        if (!isRemoteUrl) {
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
                console.warn(`   ⚠️ Local image file not found: "${trimmed}"`);
                return trimmed;
            }
        }

        console.log(`   ☁️ Uploading to Cloudinary: ${trimmed.slice(0, 70)}...`);
        const result = await cloudinary.uploader.upload(uploadTarget, {
            folder: 'homly_products',
            resource_type: 'image',
            quality: 'auto',
            fetch_format: 'auto'
        });

        console.log(`   ✅ Cloudinary URL generated: ${result.secure_url}`);
        return result.secure_url;
    } catch (err) {
        console.error(`   ❌ Failed to upload image to Cloudinary:`, err.message);
        return trimmed;
    }
}

export function parseCSV(content) {
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

export async function processProductsBatch(items, baseDir = process.cwd(), forcedStoreId = null) {
    const allStores = await Store.find({});
    const storeMap = new Map();
    allStores.forEach(s => storeMap.set(s.name.toLowerCase().trim(), s._id));

    let defaultStoreId = forcedStoreId;
    if (!defaultStoreId && allStores.length > 0) {
        defaultStoreId = allStores[0]._id;
    }

    const docs = [];
    let skippedCount = 0;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const title = (item.title || item.name || '').trim();
        const price = Number(item.price || 0);
        const category = (item.category || 'Grocery').trim();
        let rawImage = (item.image || item.imageUrl || item.image_url || '').trim();

        console.log(`[${i + 1}/${items.length}] Processing product: "${title || 'Untitled'}"`);

        if (!title || !price) {
            console.warn(`   ⚠️ Skipped: Missing title or price.\n`);
            skippedCount++;
            continue;
        }

        // If NO image link was provided by user or ChatGPT:
        if (!rawImage || rawImage.toLowerCase() === 'none' || rawImage.toLowerCase() === 'no image') {
            console.log(`   🔍 No image link provided — auto-finding photo for "${title}"...`);
            rawImage = await autoFindProductImage(title, category);
            console.log(`   📸 Found image source: ${rawImage.slice(0, 70)}...`);
        }

        // Upload to Cloudinary
        const cloudinaryUrl = await uploadToCloudinary(rawImage, baseDir);

        // Match store
        let storeId = defaultStoreId;
        if (forcedStoreId) {
            storeId = forcedStoreId;
        } else if (item.storeId && mongoose.isValidObjectId(item.storeId)) {
            storeId = item.storeId;
        } else if (item.storeName && storeMap.has(item.storeName.toLowerCase().trim())) {
            storeId = storeMap.get(item.storeName.toLowerCase().trim());
        }

        docs.push({
            title,
            description: item.description || title,
            price,
            category,
            subcategory: item.subcategory ? (Array.isArray(item.subcategory) ? item.subcategory : [item.subcategory]) : [],
            image: cloudinaryUrl || 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            images: [cloudinaryUrl || 'https://res.cloudinary.com/demo/image/upload/sample.jpg'],
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

    let insertedCount = 0;
    if (docs.length > 0) {
        console.log(`⏳ Inserting ${docs.length} products into MongoDB...`);
        const result = await Product.insertMany(docs, { ordered: false });
        insertedCount = result.length;
    }

    return { total: items.length, inserted: insertedCount, skipped: skippedCount, docs };
}

async function bulkUploadCLI() {
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
                process.exit(1);
            }
        }

        console.log(`\n==================================================`);
        console.log(`📦 ILY-MART BULK PRODUCT IMPORTER (AUTO-IMAGE & CLOUDINARY)`);
        console.log(`📂 Reading: ${filePath}`);
        console.log(`==================================================\n`);

        const rawData = fs.readFileSync(filePath, 'utf-8');
        const items = filePath.endsWith('.json') ? JSON.parse(rawData) : parseCSV(rawData);

        const summary = await processProductsBatch(items, path.dirname(filePath));

        console.log(`\n==================================================`);
        console.log(`📊 FINAL SUMMARY:`);
        console.log(`   Total rows: ${summary.total}`);
        console.log(`   Successfully imported to DB: ${summary.inserted}`);
        console.log(`   Skipped: ${summary.skipped}`);
        console.log(`==================================================\n`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Bulk upload failed:', err);
        process.exit(1);
    }
}

// If run directly from CLI
if (process.argv[1] && process.argv[1].endsWith('bulk-upload-products.js')) {
    bulkUploadCLI();
}
