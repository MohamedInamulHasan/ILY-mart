import os

new_card_code = """            // --- BUILD THE CARD VIEW PROGRAMMATICALLY (EXACT SAME AS IN-APP CARD) ---
            LinearLayout cardLayout = new LinearLayout(this);
            cardLayout.setOrientation(LinearLayout.VERTICAL);

            // Card background: Rounded White Card with elevation
            GradientDrawable cardBg = new GradientDrawable();
            cardBg.setColor(Color.WHITE);
            cardBg.setCornerRadius(dp(24));
            cardBg.setStroke(dp(1), Color.parseColor("#E5E7EB"));
            cardLayout.setBackground(cardBg);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                cardLayout.setElevation(dp(28));
            }

            // Top Header: Pure white background with Time & ID on left, X on right
            LinearLayout headerLayout = new LinearLayout(this);
            headerLayout.setOrientation(LinearLayout.HORIZONTAL);
            headerLayout.setGravity(Gravity.CENTER_VERTICAL);
            headerLayout.setPadding(dp(18), dp(14), dp(18), dp(10));

            GradientDrawable headerBg = new GradientDrawable();
            headerBg.setColor(Color.WHITE);
            float r = dp(24);
            headerBg.setCornerRadii(new float[]{r, r, r, r, 0, 0, 0, 0});
            headerLayout.setBackground(headerBg);

            // Format order time (e.g. Nov 3, 1.09 AM)
            String formattedTime = "";
            try {
                String rawDate = order.optString("createdAt", order.optString("date", ""));
                if (!rawDate.isEmpty()) {
                    java.text.SimpleDateFormat isoFormat = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US);
                    isoFormat.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
                    java.util.Date parsed = isoFormat.parse(rawDate);
                    if (parsed != null) {
                        java.text.SimpleDateFormat bannerFormat = new java.text.SimpleDateFormat("MMM d, h.mm a", java.util.Locale.US);
                        bannerFormat.setTimeZone(java.util.TimeZone.getDefault());
                        formattedTime = bannerFormat.format(parsed);
                    }
                }
            } catch (Exception ignored) {}
            if (formattedTime.isEmpty()) {
                java.text.SimpleDateFormat fallbackFormat = new java.text.SimpleDateFormat("MMM d, h.mm a", java.util.Locale.US);
                formattedTime = fallbackFormat.format(new java.util.Date());
            }

            // Left: Time & ID (same thickness and grey color)
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
            headerLayout.addView(closeBtn);

            cardLayout.addView(headerLayout);

            // 2px horizontal light grey divider line matching green dot line
            View headDivider = new View(this);
            GradientDrawable lineBg = new GradientDrawable();
            lineBg.setColor(Color.parseColor("#D1D5DB"));
            lineBg.setCornerRadius(dp(2));
            headDivider.setBackground(lineBg);
            LinearLayout.LayoutParams divParams = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    dp(2)
            );
            divParams.setMargins(dp(18), 0, dp(18), 0);
            cardLayout.addView(headDivider, divParams);

            // Content Container
            LinearLayout bodyLayout = new LinearLayout(this);
            bodyLayout.setOrientation(LinearLayout.VERTICAL);
            bodyLayout.setPadding(dp(18), dp(14), dp(18), dp(18));

            // Delivery Charge Header in Center Thick
            TextView chargeLabel = new TextView(this);
            chargeLabel.setText("DELIVERY CHARGE");
            chargeLabel.setTextColor(Color.parseColor("#000000"));
            chargeLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
            chargeLabel.setTypeface(Typeface.DEFAULT_BOLD);
            chargeLabel.setGravity(Gravity.CENTER);
            bodyLayout.addView(chargeLabel);

            TextView chargeAmount = new TextView(this);
            chargeAmount.setText(deliveryChargeStr);
            chargeAmount.setTextColor(Color.parseColor("#000000"));
            chargeAmount.setTextSize(TypedValue.COMPLEX_UNIT_SP, 38);
            chargeAmount.setTypeface(Typeface.DEFAULT_BOLD);
            chargeAmount.setGravity(Gravity.CENTER);
            bodyLayout.addView(chargeAmount);

            // Thin divider below charge
            View chargeDiv = new View(this);
            chargeDiv.setBackgroundColor(Color.parseColor("#F3F4F6"));
            LinearLayout.LayoutParams cDivParams = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    dp(1)
            );
            cDivParams.setMargins(dp(10), dp(4), dp(10), dp(10));
            bodyLayout.addView(chargeDiv, cDivParams);

            // Route Timeline: Green dot before Name -> Grey line -> Green dot before Time
            LinearLayout routeRow = new LinearLayout(this);
            routeRow.setOrientation(LinearLayout.HORIZONTAL);
            routeRow.setGravity(Gravity.TOP);
            LinearLayout.LayoutParams routeRowParams = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
            );
            routeRowParams.setMargins(0, dp(4), 0, dp(14));
            routeRow.setLayoutParams(routeRowParams);

            // Timeline dots column
            LinearLayout dotsCol = new LinearLayout(this);
            dotsCol.setOrientation(LinearLayout.VERTICAL);
            dotsCol.setGravity(Gravity.CENTER_HORIZONTAL);
            dotsCol.setLayoutParams(new LinearLayout.LayoutParams(dp(16), LinearLayout.LayoutParams.MATCH_PARENT));

            // Top green dot
            View topDot = new View(this);
            GradientDrawable topDotBg = new GradientDrawable();
            topDotBg.setShape(GradientDrawable.OVAL);
            topDotBg.setColor(Color.parseColor("#10B981"));
            topDot.setBackground(topDotBg);
            LinearLayout.LayoutParams dotParams = new LinearLayout.LayoutParams(dp(10), dp(10));
            dotParams.setMargins(0, dp(4), 0, 0);
            topDot.setLayoutParams(dotParams);
            dotsCol.addView(topDot);

            // Connecting vertical line
            View vLine = new View(this);
            vLine.setBackgroundColor(Color.parseColor("#D1D5DB"));
            LinearLayout.LayoutParams lineParams = new LinearLayout.LayoutParams(dp(2), 0, 1f);
            lineParams.setMargins(0, dp(2), 0, dp(2));
            vLine.setLayoutParams(lineParams);
            dotsCol.addView(vLine);

            // Bottom green dot
            View bottomDot = new View(this);
            GradientDrawable bottomDotBg = new GradientDrawable();
            bottomDotBg.setShape(GradientDrawable.OVAL);
            bottomDotBg.setColor(Color.parseColor("#10B981"));
            bottomDot.setBackground(bottomDotBg);
            LinearLayout.LayoutParams bottomDotParams = new LinearLayout.LayoutParams(dp(10), dp(10));
            bottomDotParams.setMargins(0, 0, 0, dp(4));
            bottomDot.setLayoutParams(bottomDotParams);
            dotsCol.addView(bottomDot);

            routeRow.addView(dotsCol);

            // Details column
            LinearLayout detailsCol = new LinearLayout(this);
            detailsCol.setOrientation(LinearLayout.VERTICAL);
            LinearLayout.LayoutParams detailsParams = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
            detailsParams.setMargins(dp(10), 0, 0, 0);
            detailsCol.setLayoutParams(detailsParams);

            // 1. Customer Name (bold black matching app)
            TextView nameView = new TextView(this);
            nameView.setText(customerName);
            nameView.setTextColor(Color.parseColor("#111827"));
            nameView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
            nameView.setTypeface(Typeface.DEFAULT_BOLD);
            detailsCol.addView(nameView);

            // 2. Street (address grey)
            if (!street.isEmpty()) {
                TextView streetView = new TextView(this);
                streetView.setText(street);
                streetView.setTextColor(Color.parseColor("#6B7280"));
                streetView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
                detailsCol.addView(streetView);
            }

            // 3. City (address grey)
            if (!city.isEmpty()) {
                TextView cityView = new TextView(this);
                cityView.setText(city);
                cityView.setTextColor(Color.parseColor("#6B7280"));
                cityView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
                detailsCol.addView(cityView);
            }

            // 4. Items count
            if (itemCount > 0) {
                TextView itemsView = new TextView(this);
                itemsView.setText("📦  " + itemCount + (itemCount == 1 ? " item" : " items"));
                itemsView.setTextColor(Color.parseColor("#6B7280"));
                itemsView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
                itemsView.setTypeface(Typeface.DEFAULT_BOLD);
                LinearLayout.LayoutParams itemsParams = new LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.WRAP_CONTENT,
                        LinearLayout.LayoutParams.WRAP_CONTENT
                );
                itemsParams.setMargins(0, dp(2), 0, 0);
                itemsView.setLayoutParams(itemsParams);
                detailsCol.addView(itemsView);
            }

            // 5. Scheduled Delivery Label (address grey)
            TextView schedLabel = new TextView(this);
            schedLabel.setText("Scheduled Delivery");
            schedLabel.setTextColor(Color.parseColor("#6B7280"));
            schedLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
            LinearLayout.LayoutParams schedLabelParams = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
            );
            schedLabelParams.setMargins(0, dp(10), 0, 0);
            schedLabel.setLayoutParams(schedLabelParams);
            detailsCol.addView(schedLabel);

            // 6. Time Slot (bold black matching name)
            String scheduledTime = order.optString("scheduledDeliveryTime", order.optString("deliveryTime", ""));
            if (shippingAddress != null && scheduledTime.isEmpty()) {
                scheduledTime = shippingAddress.optString("deliveryTime", "");
            }
            if (scheduledTime.isEmpty()) {
                scheduledTime = "Standard Delivery";
            }
            TextView schedTimeView = new TextView(this);
            schedTimeView.setText(scheduledTime);
            schedTimeView.setTextColor(Color.parseColor("#111827"));
            schedTimeView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
            schedTimeView.setTypeface(Typeface.DEFAULT_BOLD);
            detailsCol.addView(schedTimeView);

            routeRow.addView(detailsCol);
            bodyLayout.addView(routeRow);

            // VIEW ORDER Button: Amber / Yellow pill matching the app button
            Button acceptBtn = new Button(this);
            acceptBtn.setText("VIEW ORDER  ➔");
            acceptBtn.setTextColor(Color.WHITE);
            acceptBtn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
            acceptBtn.setTypeface(Typeface.DEFAULT_BOLD);
            GradientDrawable btnBg = new GradientDrawable();
            btnBg.setColor(Color.parseColor("#F59E0B")); // Amber 500
            btnBg.setCornerRadius(dp(26));
            acceptBtn.setBackground(btnBg);
            acceptBtn.setPadding(dp(16), dp(12), dp(16), dp(12));

            acceptBtn.setOnClickListener(v -> {
                stopAlertEffects();
                dismissPorterOrderCardInternal();
                openApp(orderId);
            });

            bodyLayout.addView(acceptBtn);
            cardLayout.addView(bodyLayout);

            orderCardView = cardLayout;"""

def update_service(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    start_marker = "            // --- BUILD THE PORTER CARD VIEW PROGRAMMATICALLY ---"
    end_marker = "            orderCardView = cardLayout;"

    if start_marker in content and end_marker in content:
        start_idx = content.find(start_marker)
        end_idx = content.find(end_marker) + len(end_marker)
        content = content[:start_idx] + new_card_code + content[end_idx:]
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"[{path}] Successfully updated to exact same card!")
    else:
        print(f"[{path}] Markers not found!")

update_service(r'c:\Users\moham\ILAYANGUDI PROJECT\android\app\src\main\java\com\ilayangudimart\app\FloatingLogoService.java')
update_service(r'c:\Users\moham\ILAYANGUDI PROJECT\APP _ homly\homly-mobile\android\app\src\main\java\com\ilayangudimart\app\FloatingLogoService.java')

