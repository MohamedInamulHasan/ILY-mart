import Order from '../models/Order.js';
import User from '../models/User.js';
import { sendOrderNotificationEmail, sendCustomerOrderConfirmationEmail } from '../services/emailService.js';
import { sendOrderTelegramNotification } from '../services/telegramService.js';
import { sendOrderVoiceAlert } from '../services/voiceService.js';
import { sendOrderNtfyAlert } from '../services/ntfyService.js';
import { sendN8nOrderEvent } from '../services/n8nService.js';
import { getIO } from '../socket.js';



// @desc    Create new order
// @route   POST /api/orders
// @access  Public
export const createOrder = async (req, res, next) => {
    try {
        const {
            items,
            shippingAddress,
            paymentMethod,
            subtotal,
            shipping,
            tax,
            discount,
            total,
            scheduledDeliveryTime,
            orderType
        } = req.body;

        if (!items || items.length === 0) {
            res.status(400);
            throw new Error('No order items');
        }

        console.log('📦 Creating new order for user:', req.user?._id);

        // Check for bonus coins (Free Delivery)
        let finalShipping = shipping;
        let finalTotal = total;

        // Check for Gold Products (Free Delivery) & persist isGold status
        // Verify from DB to ensure integrity
        const productIds = items.map(item => item.product || item.id);
        const dbProducts = await import('../models/Product.js').then(m => m.default.find({ _id: { $in: productIds } }).select('isGold'));

        // Prepare final items with persistent isGold status
        const finalItems = items.map(item => {
            const pId = (item.product || item.id).toString();
            const dbProduct = dbProducts.find(p => p._id.toString() === pId);
            return {
                ...item,
                isGold: dbProduct ? dbProduct.isGold : false,
                // Preserve ad-related fields from frontend
                isFromAd: item.isFromAd || false,
                adTitle: item.adTitle || null,
                storeName: item.storeName || null
            };
        });

        const hasGoldProduct = dbProducts.some(p => p.isGold);

        if (hasGoldProduct) {
            console.log('⚡ Gold Product found in order. Waiving delivery charge.');
            finalShipping = 0;
            // No need to deduct coins if Gold Product is present
            // Recalculate total if shipping was included
            finalTotal = Number(subtotal) + Number(tax) - Number(discount);
        } else if (req.user?._id) {
            // Check for bonus coins (Free Delivery) if NOT Gold
            const user = await User.findById(req.user._id);
            if (user && user.coins > 0 && Number(shipping) > 0) {
                console.log(`💰 User ${user._id} used 1 coin for free delivery. Remaining: ${user.coins - 1}`);
                user.coins -= 1;
                await user.save();

                // Adjust order totals
                finalShipping = 0;
                finalTotal = Number(subtotal) + Number(tax) - Number(discount); // Recalculate total without shipping
            }
        }

        const order = await Order.create({
            user: req.user?._id, // Optional for guest checkout
            items: finalItems,
            shippingAddress,
            paymentMethod,
            subtotal,
            shipping: finalShipping,
            tax,
            discount,
            total: finalTotal,
            scheduledDeliveryTime,
            isPaid: paymentMethod === 'Online',
            paidAt: paymentMethod === 'Online' ? Date.now() : null,
            orderType: orderType || 'Store'
        });

        // PERSISTENCE FIX: Save the location to the user's profile for future orders
        if (req.user?._id && shippingAddress?.location) {
            await User.findByIdAndUpdate(req.user._id, {
                $set: { location: shippingAddress.location }
            });
        }
        // Update user profile with latest shipping address for autofill
        if (req.user?._id) {
            try {
                await User.findByIdAndUpdate(req.user._id, {
                    address: {
                        street: shippingAddress.street,
                        city: shippingAddress.city,
                        state: shippingAddress.state,
                        zip: shippingAddress.zip,
                        zip: shippingAddress.zip,
                        country: shippingAddress.country || 'India',
                        // Save location link to user profile
                        location: shippingAddress.location || ''
                    },
                    location: shippingAddress.location || '' // Save at root level too for easy access because User model has root location field
                });
            } catch (err) {
                console.error('Failed to auto-save user address:', err);
                // Don't fail the order if address save fails
            }
        }

        console.log('✅ Order created successfully:', order._id);

        // Update product sales counts
        try {
            const productUpdates = finalItems.map(item => ({
                updateOne: {
                    filter: { _id: item.product || item.id },
                    update: { $inc: { salesCount: item.quantity || 1 } }
                }
            }));
            const Product = await import('../models/Product.js').then(m => m.default);
            await Product.bulkWrite(productUpdates);
            console.log('📈 Updated product sales counts for order:', order._id);
        } catch (err) {
            console.error('❌ Failed to update product sales counts:', err);
        }

        // Populate store and user details for email
        // We need deep population for store name in items
        await order.populate([
            { path: 'items.storeId', select: 'name' },
            { path: 'user', select: 'name email location address' }
        ]);

        // Send email notification to admin (non-blocking)
        console.log('📧 Calling sendOrderNotificationEmail...');
        sendOrderNotificationEmail(order)
            .then(result => console.log('📧 Email service result:', result))
            .catch(err => console.error('❌ Failed to send email notification:', err));

        // Send email confirmation to customer (non-blocking)
        console.log('📧 Sending order confirmation to customer...');
        sendCustomerOrderConfirmationEmail(order)
            .then(result => console.log('📧 Customer email result:', result))
            .catch(err => console.error('❌ Failed to send customer email:', err));

        // Send Telegram notification to admin (non-blocking)
        console.log('📱 Attempting to send Telegram notification...');
        sendOrderTelegramNotification(order)
            .then(result => console.log('📱 Telegram service result:', result))
            .catch(err => console.error('❌ Failed to send Telegram notification:', err));

        // Send Voice call alert to admin via IFTTT (non-blocking)
        console.log('📞 Attempting to send Voice alert...');
        sendOrderVoiceAlert(order)
            .then(result => console.log('📞 Voice alert service result:', result))
            .catch(err => console.error('❌ Failed to send Voice alert:', err));

        // Send ntfy push notification alert to admin phone (non-blocking)
        console.log('🔔 Sending ntfy push notification...');
        sendOrderNtfyAlert(order)
            .then(result => console.log('🔔 ntfy alert result:', result))
            .catch(err => console.error('❌ Failed to send ntfy alert:', err));

        // Send n8n webhook notification (non-blocking)
        console.log('⚡ Triggering n8n order webhook...');
        sendN8nOrderEvent(order, 'order.created')
            .catch(err => console.error('❌ Failed to send n8n order webhook:', err));

        // Emit real-time event for admin
        getIO().emit('order:created', order);

        res.status(201).json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
export const getOrders = async (req, res, next) => {
    try {
        const roles = Array.isArray(req.user?.role) ? req.user.role : [req.user?.role || 'customer'];
        const isAdmin = roles.includes('admin');
        let query = {};

        // STRICT RBAC: Filter orders based on user role
        if (isAdmin) {
            // Global Admin: Sees all orders
            query = {};
        } else if (roles.includes('delivery_boy')) {
            // Delivery boys need full access to manage pickups, deliveries, and fulfillment history
            query = {};
        } else if (roles.includes('store_admin') && req.user?.storeId) {
            // Store Admin: Sees orders with their products OR their own purchases
            query = {
                $or: [
                    { 'items.storeId': req.user.storeId },
                    { user: req.user._id }
                ]
            };
        } else {
            // Customers / Service Admins: ONLY see their own orders
            if (!req.user?._id) {
                res.status(401);
                throw new Error('User not authenticated');
            }
            query = { user: req.user._id };
        }

        const orders = await Order.find(query)
            .select('items.product items.name items.image items.storeId items.quantity items.price items.isGold items.unit items.isFromAd items.adTitle items.storeName total status createdAt user shippingAddress paymentMethod shipping scheduledDeliveryTime deliveredAt') // Added ad fields
            .populate({
                path: 'items.product',
                select: 'title unit', // Added unit to populate
                model: 'Product', // Explicit model required since Schema is Mixed/No Ref
                options: { lean: true } // Populate efficiently
            })
            .populate({
                path: 'items.storeId',
                select: 'name',
                options: { lean: true }
            })
            .populate({
                path: 'user',
                select: 'name email mobile',
                options: { lean: true }
            })
            .populate({
                path: 'deliveredBy',
                select: 'name mobile',
                options: { lean: true }
            })
            .sort({ createdAt: -1 })
            .lean(); // Convert to plain JavaScript objects

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate({
                path: 'items.product',
                select: 'title price isGold unit',
                model: 'Product'
            })
            .populate('items.storeId', 'name')
            .lean();

        if (!order) {
            res.status(404);
            throw new Error('Order not found');
        }

        // Check if the order belongs to the requesting user
        // Note: With lean(), order.user is an ObjectId, so we use string comparison
        const isOwner = order.user.toString() === req.user._id.toString();
        const roles = Array.isArray(req.user?.role) ? req.user.role : [req.user?.role || 'customer'];
        const isAdmin = roles.includes('admin');
        const isDeliveryBoy = roles.includes('delivery_boy');
        const isStoreAdminRole = roles.includes('store_admin');

        let isStoreAdmin = false;
        if (isStoreAdminRole && req.user.storeId) {
            // Check if any item in the order belongs to this store
            // Note: items.storeId is populated in the query above as an object { _id, name }
            isStoreAdmin = order.items.some(item =>
                item.storeId && (item.storeId._id || item.storeId).toString() === req.user.storeId.toString()
            );
        }

        // Strict single order access control
        let isAuthorized = isAdmin || isOwner;
        
        if (!isAuthorized && roles.includes('delivery_boy')) {
            // Delivery boys can view if they are assigned OR if it's available for pickup
            const isAssigned = order.deliveredBy && order.deliveredBy.toString() === req.user._id.toString();
            const isAvailable = order.status === 'Processing';
            isAuthorized = isAssigned || isAvailable;
        }

        if (!isAuthorized && isStoreAdmin) {
            // Store admins already checked in the loop above
            isAuthorized = true;
        }

        if (!isAuthorized) {
            res.status(403);
            throw new Error('Not authorized to view this order');
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id
// @access  Private/Admin
export const updateOrderStatus = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            res.status(404);
            throw new Error('Order not found');
        }

        // Security Guard: Customers can only cancel if status is 'Processing'
        const roles = Array.isArray(req.user?.role) ? req.user.role : [req.user?.role || 'customer'];
        const isCustomer = roles.includes('customer') || roles.length === 0;
        
        if (isCustomer && !roles.includes('admin') && !roles.includes('store_admin') && !roles.includes('delivery_boy') && req.body.status === 'Cancelled' && order.status !== 'Processing') {
            res.status(403);
            throw new Error(`Order cannot be cancelled once it is ${order.status}`);
        }

        // Check if we are cancelling the order
        if (req.body.status === 'Cancelled' && order.status !== 'Cancelled') {
            console.log(`❌ Cancelling order ${order._id}. Current shipping: ${order.shipping}, Status: ${order.status}`);
            // Check if coins were used (implied by shipping === 0)
            // But verify it wasn't a Gold Order
            const isGoldOrder = order.items.some(item => item.isGold) ||
                (await import('../models/Product.js').then(m => m.default.find({ _id: { $in: order.items.map(i => i.product) } }).select('isGold'))).some(p => p.isGold);

            if (order.shipping === 0 && !isGoldOrder) {
                const user = await User.findById(order.user);
                if (user) {
                    const oldCoins = user.coins || 0;
                    user.coins = oldCoins + 1;
                    await user.save();
                    console.log(`💰 Refunded 1 coin to user ${user._id} | ${oldCoins} -> ${user.coins} | Order: ${order._id}`);
                } else {
                    console.error(`⚠️ User ${order.user} not found for coin refund.`);
                }
            } else {
                console.log(`ℹ️ No coin refund needed (Shipping: ${order.shipping}).`);
            }
        }

        order.status = req.body.status || order.status;
        
        // Handle delivery boy assignment
        if (req.body.deliveredBy) {
            order.deliveredBy = req.body.deliveredBy;
        }

        // If a delivery boy accepts an order, set status to 'Out for Delivery' automatically if it was Processing
        if (roles.includes('delivery_boy') && order.status === 'Processing' && !order.deliveredBy) {
            order.deliveredBy = req.user._id;
            order.status = 'Out for Delivery';
        }

        if (req.body.status === 'Delivered') {
            order.deliveredAt = Date.now();
        }

        const updatedOrder = await order.save();

        // Send n8n webhook notification for status update (non-blocking)
        const eventType = updatedOrder.status === 'Cancelled' ? 'order.cancelled' : 'order.status_updated';
        sendN8nOrderEvent(updatedOrder, eventType)
            .catch(err => console.error('❌ Failed to send n8n order status webhook:', err));

        // Emit real-time event for user
        getIO().emit('order:updated', updatedOrder);

        res.status(200).json({
            success: true,
            data: updatedOrder
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private
export const deleteOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            res.status(404);
            throw new Error('Order not found');
        }

        // Security Guard: Customers can only delete Cancelled or Failed orders
        const roles = Array.isArray(req.user?.role) ? req.user.role : [req.user?.role || 'customer'];
        const isCustomer = roles.includes('customer') || roles.length === 0;
        const restrictedStatuses = ['Processing', 'Out for Delivery', 'Delivered'];
        
        if (isCustomer && !roles.includes('admin') && !roles.includes('store_admin') && restrictedStatuses.includes(order.status)) {
            res.status(403);
            throw new Error(`Active or completed orders cannot be deleted. Current status: ${order.status}`);
        }

        await order.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};
