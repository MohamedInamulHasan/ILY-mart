import os

# 1. Update src/components/IncomingOrderModal.jsx
modal_path = r"c:\Users\moham\ILAYANGUDI PROJECT\src\components\IncomingOrderModal.jsx"
with open(modal_path, "r", encoding="utf-8") as f:
    modal_content = f.read()

target_modal = """                    {/* Top Header Row: Time and ID on Left, X Button on Right */}
                    <div className="px-4 pt-3 pb-2 flex items-center justify-between text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 shrink-0">
                        {/* Left: Time and #Order ID in grey */}
                        <div className="flex items-center gap-2 min-w-0">
                            <Clock size={16} className="text-gray-500 dark:text-gray-400 shrink-0" />
                            <span className="text-sm sm:text-[15px] font-bold text-gray-500 dark:text-gray-400 tracking-wide truncate">
                                {formatOrderBannerTime(order.createdAt || order.date) || formattedOrderTime || t('New Order')}
                            </span>
                            <span className="text-sm sm:text-[15px] font-bold text-gray-500 dark:text-gray-400 font-mono shrink-0">
                                #{orderIdShort}
                            </span>
                        </div>

                        {/* Right: X Button */}
                        <button
                            type="button"
                            onClick={() => {
                                stopIncomingOrderAlertSound();
                                if (onSkip) {
                                    onSkip(order);
                                } else {
                                    handleDismissView();
                                }
                            }}
                            title={t('Close')}
                            className="p-1 -mr-1 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-90 rounded-full text-gray-900 dark:text-white transition-all flex items-center justify-center cursor-pointer shrink-0 ml-2"
                        >
                            <X size={18} className="text-gray-900 dark:text-white stroke-[2.5]" />
                        </button>
                    </div>"""

replacement_modal = """                    {/* Top Header Row: Time Left & ID Right in grey same thickness (matching Order List card, no X icon) */}
                    <div className="px-4 pt-3 pb-2 flex items-center justify-between text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 shrink-0">
                        {/* Left: 🕒 Nov 3, 1.47 PM */}
                        <div className="flex items-center gap-1.5 min-w-0">
                            <Clock size={16} className="text-gray-500 dark:text-gray-400 shrink-0" />
                            <span className="text-sm sm:text-[15px] font-bold text-gray-500 dark:text-gray-400 tracking-wide truncate">
                                {formatOrderBannerTime(order.createdAt || order.date) || formattedOrderTime || t('New Order')}
                            </span>
                        </div>

                        {/* Right: #Order ID (same font-bold thickness and grey color) */}
                        <span className="text-sm sm:text-[15px] font-bold text-gray-500 dark:text-gray-400 font-mono shrink-0">
                            #{orderIdShort}
                        </span>
                    </div>"""

if target_modal in modal_content:
    modal_content = modal_content.replace(target_modal, replacement_modal)
    with open(modal_path, "w", encoding="utf-8") as f:
        f.write(modal_content)
    print("IncomingOrderModal.jsx successfully updated!")
else:
    # Try normalizing line endings
    norm_modal = modal_content.replace("\r\n", "\n")
    norm_target = target_modal.replace("\r\n", "\n")
    if norm_target in norm_modal:
        norm_modal = norm_modal.replace(norm_target, replacement_modal.replace("\r\n", "\n"))
        with open(modal_path, "w", encoding="utf-8") as f:
            f.write(norm_modal)
        print("IncomingOrderModal.jsx successfully updated (normalized line endings)!")
    else:
        print("Error: target_modal not found in IncomingOrderModal.jsx")

# 2. Update both FloatingLogoService.java files
java_paths = [
    r"c:\Users\moham\ILAYANGUDI PROJECT\android\app\src\main\java\com\ilayangudimart\app\FloatingLogoService.java",
    r"c:\Users\moham\ILAYANGUDI PROJECT\APP _ homly\homly-mobile\android\app\src\main\java\com\ilayangudimart\app\FloatingLogoService.java"
]

target_java = """            // Left: Time & ID (same thickness and grey color)
            TextView headerLeft = new TextView(this);
            headerLeft.setText("🕒 " + formattedTime + "   #" + shortId);
            headerLeft.setTextColor(Color.parseColor("#6B7280"));
            headerLeft.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
            headerLeft.setTypeface(Typeface.DEFAULT_BOLD);
            LinearLayout.LayoutParams titleParams = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
            headerLayout.addView(headerLeft, titleParams);

            // Right: Dismiss Button '✕'
            TextView closeBtn = new TextView(this);
            closeBtn.setText("✕");
            closeBtn.setTextColor(Color.parseColor("#374151"));
            closeBtn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 18);
            closeBtn.setTypeface(Typeface.DEFAULT_BOLD);
            closeBtn.setPadding(dp(8), dp(4), dp(8), dp(4));
            closeBtn.setOnClickListener(v -> dismissPorterOrderCard());
            headerLayout.addView(closeBtn);"""

replacement_java = """            // Left: Time with Clock Icon (same font-bold thickness and grey color)
            TextView headerTime = new TextView(this);
            headerTime.setText("🕒 " + formattedTime);
            headerTime.setTextColor(Color.parseColor("#6B7280"));
            headerTime.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
            headerTime.setTypeface(Typeface.DEFAULT_BOLD);
            LinearLayout.LayoutParams timeParams = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
            headerLayout.addView(headerTime, timeParams);

            // Right: #Order ID (same font-bold thickness and grey color, no X icon)
            TextView headerId = new TextView(this);
            headerId.setText("#" + shortId);
            headerId.setTextColor(Color.parseColor("#6B7280"));
            headerId.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
            headerId.setTypeface(Typeface.DEFAULT_BOLD);
            headerLayout.addView(headerId);"""

for p in java_paths:
    if not os.path.exists(p):
        print(f"Skipping {p} (does not exist)")
        continue
    with open(p, "r", encoding="utf-8") as f:
        content = f.read()
    if target_java in content:
        content = content.replace(target_java, replacement_java)
        with open(p, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Successfully updated {p}!")
    else:
        norm_content = content.replace("\r\n", "\n")
        norm_target = target_java.replace("\r\n", "\n")
        if norm_target in norm_content:
            norm_content = norm_content.replace(norm_target, replacement_java.replace("\r\n", "\n"))
            with open(p, "w", encoding="utf-8") as f:
                f.write(norm_content)
            print(f"Successfully updated {p} (normalized line endings)!")
        else:
            print(f"Error: target_java not found in {p}")

