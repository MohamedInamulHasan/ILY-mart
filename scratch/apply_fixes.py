import os
import re

print("--- 1. Updating App.jsx ---")
with open('src/App.jsx', 'r', encoding='utf-8') as f:
    app_content = f.read()

# Replace bg-red-600 with bg-[#2E5A2E] in floating delivery badge
app_content = re.sub(
    r'(className="[^"]*rounded-l-2xl py-2 px-3 flex flex-col items-center shadow-lg border-2 border-r-0 border-white text-center )bg-red-600(")',
    r'\1bg-[#2E5A2E]\2',
    app_content
)
with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(app_content)
print("Updated App.jsx successfully.")

print("--- 2. Updating Checkout.jsx ---")
with open('src/pages/Checkout.jsx', 'r', encoding='utf-8') as f:
    co_content = f.read()

# A. Update useEffect for slot selection so it does NOT auto-select slots[0]
old_slot_effect = """    useEffect(() => {
        if (availableDeliverySlots.length > 0 && (!selectedTimeSlot || !availableDeliverySlots.includes(selectedTimeSlot))) {
            setSelectedTimeSlot(availableDeliverySlots[0]);
        }
    }, [selectedDatePeriod, availableDeliverySlots, selectedTimeSlot]);"""

new_slot_effect = """    useEffect(() => {
        if (selectedTimeSlot && !availableDeliverySlots.includes(selectedTimeSlot)) {
            setSelectedTimeSlot('');
        }
    }, [selectedDatePeriod, availableDeliverySlots, selectedTimeSlot]);"""

if old_slot_effect in co_content:
    co_content = co_content.replace(old_slot_effect, new_slot_effect)
    print("Replaced slot auto-selection effect.")
else:
    print("Warning: old_slot_effect not found verbatim, checking regex...")
    co_content = re.sub(
        r'useEffect\(\(\) => \{\s*if \(availableDeliverySlots\.length > 0 && \(!selectedTimeSlot \|\| !availableDeliverySlots\.includes\(selectedTimeSlot\)\)\) \{\s*setSelectedTimeSlot\(availableDeliverySlots\[0\]\);\s*\}\s*\}, \[selectedDatePeriod, availableDeliverySlots, selectedTimeSlot\]\);',
        new_slot_effect,
        co_content
    )

# B. Add deliveryTimeRef
if 'const deliveryTimeRef = useRef(null);' not in co_content:
    co_content = co_content.replace(
        'const cityRef = useRef(null);',
        'const cityRef = useRef(null);\n    const deliveryTimeRef = useRef(null);'
    )
    print("Added deliveryTimeRef.")

# C. In handleSubmit, validate delivery time slot
old_submit_validation = """        if (!formData.location) errors.location = true;

        if (Object.keys(errors).length > 0) {"""

new_submit_validation = """        if (!formData.location) errors.location = true;
        if (settings?.deliveryTimingType !== 'instant' && !selectedTimeSlot) {
            errors.deliveryTime = true;
        }

        if (Object.keys(errors).length > 0) {"""

if old_submit_validation in co_content:
    co_content = co_content.replace(old_submit_validation, new_submit_validation)
    print("Added delivery timing validation to handleSubmit.")

# D. In handleSubmit scroll logic, handle errors.deliveryTime
old_scroll_logic = """                else if (errors.location) locationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });"""

new_scroll_logic = """                else if (errors.location) locationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                else if (errors.deliveryTime) deliveryTimeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });"""

if old_scroll_logic in co_content:
    co_content = co_content.replace(old_scroll_logic, new_scroll_logic)
    print("Added deliveryTimeRef scroll logic.")

# E. Remove pincode from read-only address display (line 445)
old_addr_display = "{formData.address}{formData.city ? `, ${formData.city}` : ''}{formData.zip ? ` - ${formData.zip}` : ''}"
new_addr_display = "{formData.address}{formData.city ? `, ${formData.city}` : ''}"
if old_addr_display in co_content:
    co_content = co_content.replace(old_addr_display, new_addr_display)
    print("Removed pincode from address display.")

# F. Remove ZIP Code input block from address form
old_zip_input_pattern = re.compile(
    r'\s*<div>\s*<label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1\.5">\{t\(\'ZIP Code\'\)\}</label>\s*<input\s+type="text"\s+name="zip"[^>]*/>\s*</div>',
    re.MULTILINE
)
co_content = old_zip_input_pattern.sub('', co_content)
print("Removed ZIP Code form input block.")

# G. Update delivery time select dropdown UI and add error message
old_delivery_dropdown = """                        {/* Preferred Order Timing & Delivery Slot Selection - Dropdown */}
                        {settings?.deliveryTimingType !== 'instant' && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-[#2E5A2E] dark:text-[#7CA90E]" />
                                    <span className="font-bold text-xs text-gray-900 dark:text-white">{t('Delivery Timing')}</span>
                                </div>

                                {/* Delivery Time Slot Dropdown */}
                                <div className="relative">
                                    <select
                                        value={selectedTimeSlot || ''}
                                        onChange={(e) => setSelectedTimeSlot(e.target.value)}
                                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-0 focus:border-[#2E5A2E] appearance-none cursor-pointer pr-10 transition-colors shadow-none outline-none"
                                    >
                                        {availableDeliverySlots && availableDeliverySlots.length > 0 ? (
                                            availableDeliverySlots.map(slotId => (
                                                <option key={slotId} value={slotId} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white py-2">
                                                    {formatDeliveryRange(slotId)}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled className="bg-white dark:bg-gray-800 text-gray-400">
                                                {t('No delivery slots available')}
                                            </option>
                                        )}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-500 dark:text-gray-400">
                                        <ChevronDown size={18} />
                                    </div>
                                </div>
                            </div>
                        )}"""

new_delivery_dropdown = """                        {/* Preferred Order Timing & Delivery Slot Selection - Dropdown */}
                        {settings?.deliveryTimingType !== 'instant' && (
                            <div ref={deliveryTimeRef} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-[#2E5A2E] dark:text-[#7CA90E]" />
                                    <span className="font-bold text-xs text-gray-900 dark:text-white">{t('Delivery Timing')}</span>
                                </div>

                                {/* Delivery Time Slot Dropdown */}
                                <div className="relative">
                                    <select
                                        value={selectedTimeSlot || ''}
                                        onChange={(e) => {
                                            setSelectedTimeSlot(e.target.value);
                                            setFieldErrors(prev => ({ ...prev, deliveryTime: false }));
                                        }}
                                        className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border ${fieldErrors.deliveryTime ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-gray-600'} rounded-xl text-gray-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-0 focus:border-[#2E5A2E] appearance-none cursor-pointer pr-10 transition-colors shadow-none outline-none`}
                                    >
                                        <option value="" disabled className="bg-white dark:bg-gray-800 text-gray-400">
                                            -- {t('Select Delivery Time Slot')} --
                                        </option>
                                        {availableDeliverySlots && availableDeliverySlots.length > 0 ? (
                                            availableDeliverySlots.map(slotId => (
                                                <option key={slotId} value={slotId} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white py-2">
                                                    {formatDeliveryRange(slotId)}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled className="bg-white dark:bg-gray-800 text-gray-400">
                                                {t('No delivery slots available')}
                                            </option>
                                        )}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-500 dark:text-gray-400">
                                        <ChevronDown size={18} />
                                    </div>
                                </div>
                                {fieldErrors.deliveryTime && (
                                    <div className="relative mt-2 bg-white dark:bg-gray-855 border border-red-300 dark:border-red-600 rounded-lg px-3 py-2 text-red-600 dark:text-red-400 text-[13px] italic font-medium flex items-center gap-2.5 w-fit shadow-md z-10">
                                        <div className="w-5 h-5 rounded bg-red-500 text-white flex items-center justify-center text-[12px] font-black flex-shrink-0">!</div>
                                        <span>{language === 'ta' ? 'தயவுசெய்து டெலிவரி நேரத்தைத் தேர்ந்தெடுக்கவும்.' : 'Please select a delivery time slot.'}</span>
                                    </div>
                                )}
                            </div>
                        )}"""

if old_delivery_dropdown in co_content:
    co_content = co_content.replace(old_delivery_dropdown, new_delivery_dropdown)
    print("Updated delivery time dropdown with validation & placeholder.")
else:
    print("Warning: old_delivery_dropdown not found verbatim!")

with open('src/pages/Checkout.jsx', 'w', encoding='utf-8') as f:
    f.write(co_content)
print("Updated Checkout.jsx successfully.")

print("--- 3. Updating Services.jsx with Blinkit Shimmer ---")
with open('src/pages/Services.jsx', 'r', encoding='utf-8') as f:
    serv_content = f.read()

# Replace list view skeleton
old_services_skeleton = """                            {servicesLoading ? (
                                [...Array(6)].map((_, i) => (
                                    <div key={i} className="bg-white dark:bg-gray-800 rounded-[2rem] aspect-[16/9] animate-pulse shadow-sm border border-gray-100 dark:border-gray-700/50" />
                                ))
                            ) :"""

new_services_skeleton = """                            {servicesLoading ? (
                                [...Array(6)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="bg-white dark:bg-gray-800 rounded-[2rem] overflow-hidden aspect-[16/9] md:aspect-[3/2] lg:aspect-[4/3] w-full shadow-sm border border-gray-100 dark:border-gray-700/50 relative flex flex-col justify-between"
                                    >
                                        {/* Top Tag Placeholder */}
                                        <div className="p-4 z-10">
                                            <div className="h-6 w-24 rounded-full blinkit-shimmer" />
                                        </div>

                                        {/* Middle Area */}
                                        <div className="absolute inset-0 blinkit-shimmer opacity-40" />

                                        {/* Bottom Content Bar */}
                                        <div className="relative z-10 bg-white dark:bg-gray-800 py-3 px-4 border-t border-gray-50 dark:border-gray-700/60 flex items-center justify-between">
                                            <div className="space-y-2 flex-1 min-w-0 pr-4">
                                                <div className="h-4 w-3/4 rounded-md blinkit-shimmer" />
                                                <div className="h-3 w-1/2 rounded-md blinkit-shimmer" />
                                            </div>
                                            <div className="w-8 h-8 rounded-full blinkit-shimmer flex-shrink-0" />
                                        </div>
                                    </div>
                                ))
                            ) :"""

if old_services_skeleton in serv_content:
    serv_content = serv_content.replace(old_services_skeleton, new_services_skeleton)
    print("Replaced services list skeleton with Blinkit shimmer.")
else:
    print("Warning: old_services_skeleton not matched verbatim!")

# Replace detail view items skeleton
old_items_skeleton = """                            {itemsLoading ? (
                                // Enhanced Skeleton for items
                                [...Array(8)].map((_, i) => (
                                    <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl aspect-square shadow-sm overflow-hidden">
                                        <div className="relative h-full">
                                            {/* Image skeleton */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 animate-pulse" />
                                            {/* Content skeleton */}
                                            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                                                <div className="h-5 w-3/4 bg-white/40 rounded animate-pulse" />
                                                <div className="h-4 w-1/2 bg-white/30 rounded animate-pulse" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) :"""

new_items_skeleton = """                            {itemsLoading ? (
                                // Blinkit-style Sub-services Skeleton
                                [...Array(8)].map((_, i) => (
                                    <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl aspect-square shadow-sm overflow-hidden relative flex flex-col justify-between p-3 border border-gray-100 dark:border-gray-700/50">
                                        <div className="absolute inset-0 blinkit-shimmer opacity-50" />
                                        <div className="relative z-10 flex justify-between">
                                            <div className="h-4 w-16 rounded-full blinkit-shimmer" />
                                        </div>
                                        <div className="relative z-10 space-y-1.5 bg-black/20 backdrop-blur-sm p-2 rounded-xl">
                                            <div className="h-3.5 w-3/4 rounded-md blinkit-shimmer" />
                                            <div className="h-3 w-1/2 rounded-md blinkit-shimmer" />
                                        </div>
                                    </div>
                                ))
                            ) :"""

if old_items_skeleton in serv_content:
    serv_content = serv_content.replace(old_items_skeleton, new_items_skeleton)
    print("Replaced service items skeleton with Blinkit shimmer.")
else:
    print("Warning: old_items_skeleton not matched verbatim!")

with open('src/pages/Services.jsx', 'w', encoding='utf-8') as f:
    f.write(serv_content)
print("Updated Services.jsx successfully.")

print("--- 4. Updating DeliveryDashboard.jsx with Blinkit Shimmer ---")
with open('src/pages/admin/DeliveryDashboard.jsx', 'r', encoding='utf-8') as f:
    del_content = f.read()

old_del_skeleton = """                            {isLoading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 animate-pulse border border-gray-100 dark:border-gray-700 h-48" />
                                    ))}
                                </div>
                            ) :"""

new_del_skeleton = """                            {isLoading ? (
                                <div className="grid grid-cols-1 gap-4 lg:gap-6 w-full">
                                    {[1, 2, 3].map(i => (
                                        <div
                                            key={i}
                                            className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700/60 overflow-hidden flex flex-col justify-between p-5 space-y-4 shadow-sm"
                                        >
                                            {/* Delivery charge & customer details skeleton */}
                                            <div className="flex flex-col items-center space-y-2 py-2">
                                                <div className="h-3 w-28 rounded-full blinkit-shimmer" />
                                                <div className="h-10 w-24 rounded-xl blinkit-shimmer" />
                                                <div className="h-3 w-36 rounded-full blinkit-shimmer mt-1" />
                                                <div className="h-4 w-44 rounded-md blinkit-shimmer mt-2" />
                                                <div className="h-3 w-56 rounded-md blinkit-shimmer" />
                                            </div>
                                            {/* Bottom action button skeleton */}
                                            <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60">
                                                <div className="h-12 w-full rounded-full blinkit-shimmer" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) :"""

if old_del_skeleton in del_content:
    del_content = del_content.replace(old_del_skeleton, new_del_skeleton)
    print("Replaced delivery dashboard skeleton with Blinkit shimmer.")
else:
    print("Warning: old_del_skeleton not matched verbatim!")

with open('src/pages/admin/DeliveryDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(del_content)
print("Updated DeliveryDashboard.jsx successfully.")

