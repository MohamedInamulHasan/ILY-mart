const fs = require('fs');

// Patch StoreManagement.jsx
{
    const path = 'src/pages/admin/StoreManagement.jsx';
    let content = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

    if (!content.includes('RichDescriptionEditor')) {
        content = "import RichDescriptionEditor from '../../components/RichDescriptionEditor';\n" + content;
    }

    const oldTextarea = `                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Description')}</label>
                            <textarea
                                value={productForm.description}
                                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                                rows="4"
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2E5A2E] outline-none"
                                placeholder={t('Product description...')}
                                required
                            ></textarea>
                        </div>`;

    const newComponent = `                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Description')}</label>
                            <RichDescriptionEditor
                                value={productForm.description}
                                onChange={(val) => setProductForm({ ...productForm, description: val })}
                                placeholder={t('Product description...')}
                            />
                        </div>`;

    if (content.includes(oldTextarea)) {
        content = content.replace(oldTextarea, newComponent);
        fs.writeFileSync(path, content, 'utf8');
        console.log('SUCCESS: patched StoreManagement.jsx with RichDescriptionEditor');
    } else {
        console.log('WARNING: StoreManagement.jsx target textarea not found');
    }
}

// Patch AdminDashboard.jsx
{
    const path = 'src/pages/admin/AdminDashboard.jsx';
    let content = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

    if (!content.includes('RichDescriptionEditor')) {
        content = "import RichDescriptionEditor from '../../components/RichDescriptionEditor';\n" + content;
    }

    const oldTextarea = `                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Description')}</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows="4"
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#7CA90E] outline-none"
                                placeholder={t('Product description...')}
                                required
                            ></textarea>
                        </div>`;

    const newComponent = `                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Description')}</label>
                            <RichDescriptionEditor
                                value={formData.description}
                                onChange={(val) => setFormData({ ...formData, description: val })}
                                placeholder={t('Product description...')}
                            />
                        </div>`;

    if (content.includes(oldTextarea)) {
        content = content.replace(oldTextarea, newComponent);
        fs.writeFileSync(path, content, 'utf8');
        console.log('SUCCESS: patched AdminDashboard.jsx with RichDescriptionEditor');
    } else {
        console.log('WARNING: AdminDashboard.jsx target textarea not found');
    }
}
