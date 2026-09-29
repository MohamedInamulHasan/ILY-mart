import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

import nodemailer from 'nodemailer';

// Lazy initialization of transporter to ensure env vars are loaded
let transporter = null;

export const formatOrderDeliveryTime = (order) => {
    const rawDeliveryTime = order.scheduledDeliveryTime || order.deliveryTime || order.shippingAddress?.deliveryTime;
    if (!rawDeliveryTime) return 'Instant Delivery';
    const strTime = String(rawDeliveryTime).toLowerCase();
    if (strTime.includes('instant')) return 'Instant Delivery';

    if (typeof rawDeliveryTime === 'string' && rawDeliveryTime.includes('|')) {
        const parts = rawDeliveryTime.split('|');
        const [hours, minutes] = parts[1].split(':');
        const hStart = parseInt(hours, 10);
        if (!isNaN(hStart)) {
            const formatShortTime = (h, m) => {
                const ampm = h >= 12 ? 'PM' : 'AM';
                const h12 = h % 12 || 12;
                const mStr = parseInt(m, 10) === 0 ? '' : `:${m}`;
                return `${h12}${mStr}${ampm}`;
            };
            return `${formatShortTime(hStart, minutes)} - ${formatShortTime((hStart + 1) % 24, minutes)}`;
        }
        return rawDeliveryTime;
    }

    const date = new Date(rawDeliveryTime);
    if (!isNaN(date.getTime())) {
        const istTimeString = date.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit' });
        const [hours, minutes] = istTimeString.split(':');
        const hStart = parseInt(hours, 10);
        const formatShortTime = (h, m) => {
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            const mStr = parseInt(m, 10) === 0 ? '' : `:${m}`;
            return `${h12}${mStr} ${ampm}`;
        };
        return `${formatShortTime(hStart, minutes)} - ${formatShortTime((hStart + 1) % 24, minutes)}`;
    }

    return String(rawDeliveryTime);
};

const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
            port: process.env.SMTP_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }
    return transporter;
};

export const sendPasswordResetEmail = async (email, resetUrl) => {
    try {
        const mailOptions = {
            from: `"ILY mart Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset Request',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Password Reset Request</h2>
                    <p>You requested to reset your password. Click the button below to reset it:</p>
                    <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">Reset Password</a>
                    <p>If you didn't request this, please ignore this email.</p>
                    <p style="color: #666; font-size: 12px;">This link will expire in 1 hour.</p>
                </div>
            `
        };

        const info = await getTransporter().sendMail(mailOptions);
        console.log('✅ Password reset email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Failed to send password reset email:', error);
        throw error;
    }
};

export const sendOTPEmail = async (email, otp) => {
    try {
        const mailOptions = {
            from: `"ILY mart Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your ILY mart Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
                    <h2 style="color: #2E5A2E; text-align: center;">ILY mart Verification Code</h2>
                    <p style="font-size: 16px; color: #333;">Hello,</p>
                    <p style="font-size: 16px; color: #333;">Please use the following 6-digit verification code to sign in/up to your account. This code is valid for 5 minutes:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2E5A2E; background-color: #f3f4f6; padding: 12px 24px; border-radius: 8px; border: 1px solid #e5e7eb;">${otp}</span>
                    </div>
                    <p style="font-size: 14px; color: #666; text-align: center;">If you did not request this verification code, please ignore this email.</p>
                    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
                    <p style="font-size: 12px; color: #999; text-align: center;">© ${new Date().getFullYear()} ILY mart. All rights reserved.</p>
                </div>
            `
        };

        const info = await getTransporter().sendMail(mailOptions);
        console.log('✅ OTP email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Failed to send OTP email:', error);
        throw error;
    }
};

export const sendOrderNotificationEmail = async (order) => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
        console.log('📧 Preparing query to send email to:', adminEmail);

        if (!adminEmail) {
            console.error('❌ No Admin Email defined!');
            return;
        }

        // Extract shipping address fields
        const shippingAddr = order.shippingAddress || {};
        const customerName = shippingAddr.name || order.user?.name || 'Customer';
        const customerMobile = shippingAddr.mobile || 'N/A';
        const customerAddress = shippingAddr.street || 'N/A';
        const customerCity = shippingAddr.city || 'N/A';
        const customerZip = shippingAddr.zip || '';
        // PRIORITIZE SHIPPING LOCATION
        const customerLocation = shippingAddr.location || order.user?.location || '';

        // Format phone number for WhatsApp (remove all non-digits, ensure it starts with country code)
        let whatsappNumber = customerMobile.replace(/[^0-9]/g, '');
        // If number doesn't start with country code and is 10 digits, assume India (+91)
        if (whatsappNumber.length === 10) {
            whatsappNumber = '91' + whatsappNumber;
        }

        const mailOptions = {
            from: `"ILY mart Orders" <${process.env.EMAIL_USER}>`,
            to: adminEmail,
            subject: `New Order #${order._id.toString().slice(-8).toUpperCase()}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2563eb; margin-bottom: 20px;">🎉 New Order Received!</h2>
                    
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <p style="margin: 5px 0;"><strong>Order ID:</strong> #${order._id.toString().slice(-8).toUpperCase()}</p>
                        <p style="margin: 5px 0;"><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                        <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #f59e0b;">${order.status}</span></p>
                    </div>
                    
                    <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="margin-top: 0; color: #1f2937;">Customer Details</h3>
                        <p style="margin: 5px 0;"><strong>Name:</strong> ${customerName}</p>
                        <p style="margin: 5px 0;"><strong>Mobile:</strong> ${customerMobile}</p>
                        <p style="margin: 5px 0;"><strong>Mobile:</strong> ${customerMobile}</p>
                        <p style="margin: 5px 0;"><strong>Address:</strong> ${customerAddress}</p>
                        ${order.user?.address ? `<p style="margin: 5px 0;"><strong>Registered Address:</strong> ${order.user.address.street || ''}, ${order.user.address.city || ''}</p>` : ''}
                        <p style="margin: 5px 0;"><strong>City:</strong> ${customerCity}</p>
                        ${customerLocation ? `<p style="margin: 5px 0;"><strong>GPS Coordinates:</strong> ${customerLocation}</p>` : ''}
                    </div>
                    
                    <h3 style="color: #1f2937;">Order Items</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <thead>
                            <tr style="background-color: #f3f4f6;">
                                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
                                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
                                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map(item => `
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                                        <strong>${item.name || item.title || 'Product'} ${item.unit ? `(${item.unit})` : ''}</strong>
                                        ${item.isFromAd ? '<span style="background-color: #fee2e2; color: #dc2626; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-left: 5px; font-weight: bold;">OFFER 🔥</span>' : ''}
                                        ${item.storeId?.name ? `<br><small style="color: #6b7280;">Store: ${item.storeId.name}</small>` : ''}
                                    </td>
                                    <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb;">${item.quantity}</td>
                                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb;">₹${(item.price * item.quantity).toFixed(0)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <table style="width: 100%;">
                            <tr>
                                <td style="padding: 5px 0;"><strong>Subtotal:</strong></td>
                                <td style="padding: 5px 0; text-align: right;">₹${(order.subtotal || 0).toFixed(0)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px 0;"><strong>Delivery Charge:</strong></td>
                                <td style="padding: 5px 0; text-align: right;">
                                    ${order.shipping === 0
                    ? (order.items.some(i => i.isGold)
                        ? '<span style="color: #ca8a04; font-weight: bold;">FREE (Gold Benefit)</span>'
                        : '<span style="color: #10b981;">FREE (Coin Applied)</span>')
                    : `₹${(order.shipping || 0).toFixed(0)}`}
                                </td>
                            </tr>
                            ${order.discount > 0 ? `
                            <tr>
                                <td style="padding: 5px 0;"><strong>Discount:</strong></td>
                                <td style="padding: 5px 0; text-align: right; color: #10b981;">-₹${order.discount.toFixed(0)}</td>
                            </tr>
                            ` : ''}
                            <tr style="border-top: 2px solid #e5e7eb;">
                                <td style="padding: 10px 0;"><strong style="font-size: 18px;">Total:</strong></td>
                                <td style="padding: 10px 0; text-align: right;"><strong style="font-size: 18px; color: #2563eb;">₹${order.total.toFixed(0)}</strong></td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${order.paymentMethod?.type || 'Cash on Delivery'}</p>
                        <p style="margin: 5px 0;"><strong>Delivery Time:</strong> ${formatOrderDeliveryTime(order)}</p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <p style="margin-bottom: 15px;"><strong>Contact Customer:</strong></p>
                        <a href="https://wa.me/${whatsappNumber}?text=Hello%20${encodeURIComponent(customerName)}%21%0A%0AYour%20order%20has%20been%20received%20from%20Ily%20Mart.%0A%0A*Order%20Details%3A*%0AOrder%20ID%3A%20%23${order._id.toString().slice(-8).toUpperCase()}%0ATotal%20Amount%3A%20₹${order.total.toFixed(0)}%0ADelivery%20Time%3A%20${encodeURIComponent(formatOrderDeliveryTime(order))}%0ADelivery%20Charge%3A%20${order.shipping === 0 ? (order.items.some(i => i.isGold) ? 'FREE%20(Gold%20Member)' : 'FREE%20(Coin%20Applied)') : `₹${(order.shipping || 0).toFixed(0)}`}%0APayment%3A%20${encodeURIComponent(order.paymentMethod?.type || 'Cash on Delivery')}%0A%0A*Delivery%20Address%3A*%0A${encodeURIComponent(customerAddress)}${customerLocation ? `%20(${encodeURIComponent(customerLocation)})` : ''}%2C%20${encodeURIComponent(customerCity)}%20-%20${customerZip}%0A%0A*Items%20Ordered%3A*%0A${order.items.map((item, idx) => `${idx + 1}.%20${encodeURIComponent(item.name || item.title || 'Product')}%20x${item.quantity}%20-%20₹${(item.price * item.quantity).toFixed(0)}`).join('%0A')}%0A%0AYour%20order%20is%20being%20processed%20and%20will%20be%20delivered%20soon.%20Thank%20you%20for%20shopping%20with%20Ily%20Mart%21" 
                           style="display: inline-block; padding: 12px 24px; background-color: #25D366; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-bottom: 20px;">
                            📱 Contact via WhatsApp
                        </a>
                        <br/>
                        <br/>
                        ${(customerLocation) ? `
                        <a href="${(customerLocation.startsWith('http') ? customerLocation : `https://www.google.com/maps?q=${customerLocation.replace(/\s/g, '')}`)}" 
                           style="display: inline-block; padding: 12px 24px; background-color: #4285F4; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                            📍 View on Google Maps
                        </a>` : ''}
                    </div>
                </div>
            `
        };

        console.log('📧 Preparing to send email...');
        console.log('📧 Recipient:', adminEmail);
        console.log('📧 SMTP Config:', {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            user: process.env.SMTP_USER,
            hasPass: !!process.env.SMTP_PASS
        });

        const info = await getTransporter().sendMail(mailOptions);
        console.log('✅ Order notification email sent successfully!');
        console.log('✅ Message ID:', info.messageId);
        console.log('✅ Response:', info.response);

        // Also notify delivery boys who are on duty
        await notifyDeliveryBoysEmail(order);

        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Failed to send order notification email:', error);
        console.error('❌ Error details:', {
            message: error.message,
            code: error.code,
            command: error.command
        });
        throw error;
    }
};

/**
 * Notifies all on-duty delivery boys via email
 * @param {Object} order - The order object
 */
export const notifyDeliveryBoysEmail = async (order) => {
    try {
        const User = (await import('../models/User.js')).default;
        
        // Find all active delivery boys with emails
        const deliveryBoys = await User.find({
            role: 'delivery_boy',
            'deliverySettings.isActive': true,
            email: { $exists: true, $ne: '' }
        });

        if (deliveryBoys.length === 0) return;

        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        for (const boy of deliveryBoys) {
            const { start, end } = boy.deliverySettings.workTimings;
            if (currentTime >= start && currentTime <= end) {
                console.log(`📧 Sending email alert to delivery boy: ${boy.name} (${boy.email})`);
                
                const shippingAddr = order.shippingAddress || {};
                const customerName = shippingAddr.name || order.user?.name || 'Customer';
                
                const mailOptions = {
                    from: `"ILY mart Orders" <${process.env.EMAIL_USER}>`,
                    to: boy.email,
                    subject: `New Delivery Assignment: Order #${order._id.toString().slice(-8).toUpperCase()}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
                            <h2 style="color: #2563eb; margin-top: 0;">🚚 New Delivery Available</h2>
                            <p>Hello ${boy.name}, a new order is ready for delivery.</p>
                            
                            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p style="margin: 5px 0;"><strong>Order ID:</strong> #${order._id.toString().slice(-8).toUpperCase()}</p>
                                <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${order.total.toFixed(0)}</p>
                            </div>
                            
                            <h3 style="color: #1f2937;">Customer Details</h3>
                            <p style="margin: 5px 0;"><strong>Name:</strong> ${customerName}</p>
                            <p style="margin: 5px 0;"><strong>Phone:</strong> ${shippingAddr.mobile || 'N/A'}</p>
                            <p style="margin: 5px 0;"><strong>Address:</strong> ${shippingAddr.street}, ${shippingAddr.city}</p>
                            
                            <div style="margin-top: 30px; text-align: center;">
                                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin" 
                                   style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                                    View in Admin Panel
                                </a>
                            </div>
                        </div>
                    `
                };

                await getTransporter().sendMail(mailOptions);
            }
        }
    } catch (error) {
        console.error('❌ Failed to send delivery boy email notifications:', error);
    }
};

export const sendServiceRequestNotification = async (request) => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

        const mailOptions = {
            from: `"ILY mart Services" <${process.env.EMAIL_USER}>`,
            to: adminEmail,
            subject: `New Service Request: ${request.service.name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">New Service Request!</h2>
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #1f2937;">Service Details</h3>
                        <p><strong>Service:</strong> ${request.service.name}</p>
                        <p><strong>Description:</strong> ${request.service.description}</p>
                        <p><strong>Service Address:</strong> ${request.service.address}</p>
                        <p><strong>Service Mobile:</strong> ${request.service.mobile}</p>
                    </div>
                    <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #1f2937;">Customer Details</h3>
                        <p><strong>Name:</strong> ${request.user.name}</p>
                        <p><strong>Email:</strong> ${request.user.email}</p>
                        <p><strong>Mobile:</strong> ${request.user.mobile}</p>
                        ${request.user.address ? `<p><strong>Registered Address:</strong> ${request.user.address.street || ''}, ${request.user.address.city || ''}</p>` : ''}
                    </div>
                    <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #166534;">Request Location</h3>
                        <p><strong>Address/Location:</strong> ${request.location || 'Not provided'}</p>
                        ${request.coordinates ? `<p style="margin-top:10px;"><a href="https://www.google.com/maps?q=${request.coordinates}" style="color:#2563eb; text-decoration:none;">📍 View on Google Maps</a></p>` : ''}
                    </div>
                    <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Request ID:</strong> ${request._id}</p>
                        <p><strong>Status:</strong> ${request.status}</p>
                        <p><strong>Requested on:</strong> ${new Date(request.createdAt).toLocaleString()}</p>
                    </div>
                    <p style="margin-top: 30px;">Please contact the customer to confirm the service request.</p>
                    <a href="https://wa.me/${request.user.mobile.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(request.user.name)}%2C%20we%20received%20your%20request%20for%20${encodeURIComponent(request.service.name)}.%20We%20will%20contact%20you%20shortly." 
                       style="display: inline-block; padding: 12px 24px; background-color: #25D366; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
                        Contact via WhatsApp
                    </a>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        // Add similar logic for Service Request Email if it exists in the file (it wasn't fully shown in previous view_file, but I see sendServiceRequestNotification imported in controller).
        // Wait, I need to check if `sendServiceRequestNotification` is defined in this file. I only viewed up to line 345 and it ended with sendCustomerOrderConfirmationEmail. 
        // I need to view the file again to find `sendServiceRequestNotification`. 
        // I will skip this chunk for now and view the file first to be safe.
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Failed to send service request notification email:', error);
        throw error;
    }
};

// Send order confirmation email to customer
export const sendCustomerOrderConfirmationEmail = async (order) => {
    try {
        const customerEmail = order.user?.email;

        if (!customerEmail) {
            console.error('❌ No customer email found!');
            return { success: false, error: 'No customer email' };
        }

        console.log('📧 Sending order confirmation to customer:', customerEmail);

        // Extract shipping address fields
        const shippingAddr = order.shippingAddress || {};
        const customerName = shippingAddr.name || order.user?.name || 'Customer';
        const customerMobile = shippingAddr.mobile || 'N/A';
        const customerAddress = shippingAddr.street || 'N/A';
        const customerCity = shippingAddr.city || 'N/A';
        const customerLocation = shippingAddr.location || '';

        const mailOptions = {
            from: `"ILY mart" <${process.env.EMAIL_USER}>`,
            to: customerEmail,
            subject: `Order Confirmed #${order._id.toString().slice(-8).toUpperCase()}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
                    <div style="background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #2563eb; margin-bottom: 10px;">✅ Order Confirmed!</h2>
                        <p style="color: #6b7280; margin-bottom: 30px;">Thank you for your order, ${customerName}!</p>
                        
                        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2563eb;">
                            <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 16px;">Order Details</h3>
                            <p style="margin: 5px 0;"><strong>Order ID:</strong> #${order._id.toString().slice(-8).toUpperCase()}</p>
                            <p style="margin: 5px 0;"><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                            <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${order.total.toFixed(0)}</p>
                            <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${order.paymentMethod?.type || 'Cash on Delivery'}</p>
                            <p style="margin: 5px 0;"><strong>Delivery Time:</strong> ${formatOrderDeliveryTime(order)}</p>
                        </div>

                        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 16px;">Delivery Address</h3>
                            <p style="margin: 5px 0;">${customerAddress}</p>
                            <p style="margin: 5px 0;">${customerCity}</p>
                            <p style="margin: 5px 0;"><strong>Mobile:</strong> ${customerMobile}</p>
                            ${customerLocation ? `<p style="margin: 10px 0 0 0;"><a href="${customerLocation}" style="color: #2563eb; text-decoration: none;">📍 View Location on Map</a></p>` : ''}
                        </div>

                        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 16px;">Order Items</h3>
                            ${order.items.map(item => `
                                <div style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                                    <p style="margin: 5px 0;"><strong>${item.name || item.title || 'Product'} ${item.unit ? `(${item.unit})` : ''}</strong></p>
                                    <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">Quantity: ${item.quantity} × ₹${item.price.toFixed(0)} = ₹${(item.price * item.quantity).toFixed(0)}</p>
                                    ${item.storeId?.name ? `<p style="margin: 5px 0; color: #6b7280; font-size: 12px;">Store: ${item.storeId.name}</p>` : ''}
                                </div>
                            `).join('')}
                        </div>

                        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                            <p style="margin: 5px 0;"><strong>Subtotal:</strong> ₹${(order.total - (order.shipping || 0)).toFixed(0)}</p>
                            <p style="margin: 5px 0;"><strong>Delivery Charge:</strong> ${order.shipping === 0 ? (order.items.some(i => i.isGold) ? 'FREE (Gold Member)' : 'FREE (Coin Applied)') : `₹${(order.shipping || 0).toFixed(0)}`}</p>
                            <p style="margin: 10px 0 0 0; font-size: 18px;"><strong>Total:</strong> <span style="color: #2563eb;">₹${order.total.toFixed(0)}</span></p>
                        </div>

                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                            <p style="color: #6b7280; margin-bottom: 15px;">Your order is being processed and will be delivered soon!</p>
                            <p style="color: #9ca3af; font-size: 12px;">If you have any questions, please contact us.</p>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
                        <p>© ${new Date().getFullYear()} ILY mart. All rights reserved.</p>
                    </div>
                </div>
            `
        };

        const info = await getTransporter().sendMail(mailOptions);
        console.log('✅ Customer order confirmation email sent!');
        console.log('✅ Message ID:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Failed to send customer confirmation email:', error);
        return { success: false, error: error.message };
    }
};


// Send account deletion request email to admin
export const sendDeleteAccountRequestEmail = async (email, reason) => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
        console.log('📧 Preparing data deletion email to send to:', adminEmail);

        if (!adminEmail) {
            console.error('❌ No Admin Email defined!');
            return { success: false, error: 'No Admin Email defined' };
        }

        const mailOptions = {
            from: `"ILY mart Data Deletion" <${process.env.EMAIL_USER}>`,
            to: adminEmail,
            subject: '⚠️ New Account Deletion Request - ILY mart',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #fcfcfc;">
                    <h2 style="color: #dc2626; margin-top: 0;">⚠️ New Account Deletion Request</h2>
                    <p>A user has submitted a request to delete their account and all associated data from ILY mart.</p>
                    
                    <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                        <p style="margin: 5px 0;"><strong>Request Type:</strong> Data Deletion Request</p>
                        <p style="margin: 5px 0;"><strong>User Email:</strong> <a href="mailto:${email}">${email}</a></p>
                        <p style="margin: 5px 0;"><strong>Reason:</strong> ${reason || 'Not specified'}</p>
                        <p style="margin: 5px 0;"><strong>Submitted at:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                    
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <h4 style="margin: 0 0 10px 0; color: #1f2937;">Next Steps for Admin:</h4>
                        <ol style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px;">
                            <li>Verify the user exists in your database (email: ${email}).</li>
                            <li>Export and delete the user's data from active databases and records.</li>
                            <li>Send a confirmation email to <strong>${email}</strong> once completed.</li>
                        </ol>
                    </div>
                    
                    <p style="color: #9ca3af; font-size: 11px; margin-top: 30px; text-align: center;">
                        This is an automated notification from your ILY mart server.
                    </p>
                </div>
            `
        };

        const info = await getTransporter().sendMail(mailOptions);
        console.log('✅ Account deletion request email sent successfully to', adminEmail);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Failed to send account deletion request email:', error);
        throw error;
    }
};


