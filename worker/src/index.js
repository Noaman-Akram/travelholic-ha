/**
 * Travelholic Payment Worker
 * Cloudflare Worker for Hostaway + Superpay Integration
 */

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  }
};

async function handleRequest(request, env) {
  // CORS headers for frontend requests
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);

  try {
    // Health check endpoint
    if (url.pathname === '/health') {
      return jsonResponse({
        status: 'ok',
        time: new Date().toISOString(),
        service: 'Travelholic Payment Worker'
      }, corsHeaders);
    }

    // Main endpoint: Create booking + get payment URL
    if (url.pathname === '/api/create-booking' && request.method === 'POST') {
      return await handleCreateBooking(request, env, corsHeaders);
    }

    // Superpay webhook endpoint
    if (url.pathname === '/api/superpay-webhook' && request.method === 'POST') {
      return await handleSuperpayWebhook(request, env, corsHeaders);
    }

    // 404 for unknown endpoints
    return new Response('Not Found', { status: 404, headers: corsHeaders });

  } catch (error) {
    console.error('Worker Error:', error);
    return jsonResponse({
      success: false,
      error: error.message
    }, corsHeaders, 500);
  }
}

/**
 * Main endpoint: Generate Superpay payment URL (NO Hostaway reservation yet)
 * Flow: Payment first, then create reservation in webhook if successful
 */
async function handleCreateBooking(request, env, corsHeaders) {
  const data = await request.json();
  console.log('📥 Received booking request:', JSON.stringify(data, null, 2));

  // Extract data from frontend
  const {
    guest = {},
    booking = {},
    pricing = {},
    formData = {}
  } = data;

  // Parse dates and guests from URL params or form data
  const urlParams = new URL(data.url || '').searchParams;
  const arrivalDate = booking.checkIn || urlParams.get('start') || formData.arrivalDate;
  const departureDate = booking.checkOut || urlParams.get('end') || formData.departureDate;
  const numberOfGuests = booking.numberOfGuests || urlParams.get('numberOfGuests') || formData.numberOfGuests || '1';

  // Extract listing ID from URL (e.g., /checkout/248413)
  const listingMatch = (data.url || '').match(/\/checkout\/(\d+)/);
  const listingMapId = listingMatch ? listingMatch[1] : null;

  // Extract price (remove currency symbols and parse)
  console.log('[Worker] Raw pricing data:', pricing);
  const totalPrice = parseFloat((pricing.total || '0').replace(/[^0-9.]/g, '')) || 0;
  console.log('[Worker] Parsed total price:', totalPrice);

  // Validate required fields
  if (!listingMapId) {
    throw new Error('Listing ID not found in URL');
  }
  if (!arrivalDate || !departureDate) {
    throw new Error('Check-in and check-out dates are required');
  }
  if (!guest.email) {
    throw new Error('Guest email is required');
  }
  if (totalPrice <= 0) {
    console.error('[Worker] Price validation failed. Pricing object:', pricing, 'Parsed price:', totalPrice);
    throw new Error(`Valid price is required. Received pricing: ${JSON.stringify(pricing)}, Parsed: ${totalPrice}`);
  }

  console.log('✅ Validation passed:', {
    listingMapId,
    arrivalDate,
    departureDate,
    numberOfGuests,
    totalPrice
  });

  // Step 1: Generate temporary merchantOrderId (no Hostaway reservation yet)
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const merchantOrderId = `TEMP-${timestamp}-${random}`;
  console.log('🆔 Generated temp merchantOrderId:', merchantOrderId);

  // Step 2: Store booking data in KV for webhook retrieval
  const bookingData = {
    listingMapId: parseInt(listingMapId),
    arrivalDate,
    departureDate,
    numberOfGuests: parseInt(numberOfGuests) || 1,
    guestName: guest.name || `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || 'Guest',
    guestEmail: guest.email,
    guestPhone: guest.phone || formData.phone || '',
    totalPrice: totalPrice,
    timestamp: new Date().toISOString(),
    originalData: data  // Store full data for reference
  };

  console.log('💾 Storing booking data in KV...');
  await env.BOOKING_DATA.put(merchantOrderId, JSON.stringify(bookingData), {
    expirationTtl: 3600  // Expire after 1 hour
  });
  console.log('✅ Booking data stored');

  // Step 3: Generate Superpay payment URL
  console.log('💳 Generating Superpay payment URL...');

  const signature = await generateSuperpaySignature(
    merchantOrderId,           // temp merchantOrderId
    totalPrice,                // amount
    'EGP',                     // currency
    env.SUPERPAY_SECRET_KEY    // secretKey
  );

  const superpayPayload = {
    merchant: {
      code: env.SUPERPAY_MERCHANT_CODE,
      apiKey: env.SUPERPAY_API_KEY
    },
    order: {
      merchantOrderId: merchantOrderId,
      amount: parseFloat(totalPrice),
      currency: 'EGP'
    },
    signature: signature
  };

  // Optional: Add clientId if email exists
  if (guest.email) {
    superpayPayload.clientId = guest.email;
  }

  console.log('📤 Superpay payload:', JSON.stringify(superpayPayload, null, 2));

  const superpayResponse = await fetch(`${env.SUPERPAY_BASE_URL}/ordertransaction/api/1/sts/iframe/url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(superpayPayload)
  });

  if (!superpayResponse.ok) {
    const errorText = await superpayResponse.text();
    console.error('❌ Superpay error:', errorText);
    throw new Error(`Failed to generate payment URL: ${errorText}`);
  }

  const superpayData = await superpayResponse.json();
  console.log('✅ Superpay response:', JSON.stringify(superpayData, null, 2));

  // Extract iframe URL (Superpay might return different field names)
  const iframeUrl = superpayData.iframeUrl ||
                    superpayData.url ||
                    superpayData.paymentUrl ||
                    superpayData.data?.iframeUrl;

  if (!iframeUrl) {
    console.error('❌ No iframe URL in response:', superpayData);
    throw new Error('Failed to get payment URL from Superpay');
  }

  console.log('🎉 Success! Returning iframe URL');

  return jsonResponse({
    success: true,
    merchantOrderId,
    iframeUrl,
    message: 'Payment URL generated. Complete payment to create reservation.'
  }, corsHeaders);
}

/**
 * Webhook endpoint: Handle payment status from Superpay
 * Creates Hostaway reservation ONLY if payment is successful
 */
async function handleSuperpayWebhook(request, env, corsHeaders) {
  const webhookData = await request.json();
  console.log('🔔 Webhook received:', JSON.stringify(webhookData, null, 2));

  const {
    merchantOrderId,
    transactionStatus,
    amount,
    transactionId
  } = webhookData;

  // Retrieve booking data from KV
  console.log('🔍 Retrieving booking data from KV...');
  const bookingDataJson = await env.BOOKING_DATA.get(merchantOrderId);

  if (!bookingDataJson) {
    console.error('❌ No booking data found in KV for:', merchantOrderId);
    return jsonResponse({
      success: false,
      message: 'Booking data not found'
    }, corsHeaders);
  }

  const bookingData = JSON.parse(bookingDataJson);
  console.log('✅ Booking data retrieved:', bookingData);

  // Check if payment was successful
  if (transactionStatus === 'SUCCESS' ||
      transactionStatus === 'PAID' ||
      transactionStatus === 'COMPLETED') {

    console.log(`✅ Payment successful! Creating Hostaway reservation...`);

    // NOW create the Hostaway reservation
    try {
      const hostawayPayload = {
        channelId: 2000, // Direct booking channel
        listingMapId: bookingData.listingMapId,
        arrivalDate: bookingData.arrivalDate,
        departureDate: bookingData.departureDate,
        numberOfGuests: bookingData.numberOfGuests,
        guestName: bookingData.guestName,
        guestEmail: bookingData.guestEmail,
        guestPhone: bookingData.guestPhone,
        totalPrice: bookingData.totalPrice,
        status: 'confirmed', // Directly confirmed since payment is done
        notes: `Payment confirmed via Superpay. Transaction ID: ${transactionId}. Amount: ${amount}. Temp ID: ${merchantOrderId}`
      };

      console.log('📤 Creating Hostaway reservation:', JSON.stringify(hostawayPayload, null, 2));

      const reservationResponse = await fetch('https://api.hostaway.com/v1/reservations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.HOSTAWAY_BEARER_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(hostawayPayload)
      });

      if (!reservationResponse.ok) {
        const errorText = await reservationResponse.text();
        console.error('❌ Failed to create Hostaway reservation:', errorText);
        throw new Error(`Hostaway API error: ${errorText}`);
      }

      const reservationData = await reservationResponse.json();
      const reservationId = reservationData.result?.id || reservationData.id;

      console.log('🎉 Hostaway reservation created successfully! ID:', reservationId);

      // Clean up KV entry
      await env.BOOKING_DATA.delete(merchantOrderId);
      console.log('🧹 Cleaned up KV entry');

      return jsonResponse({
        success: true,
        message: 'Reservation created successfully',
        reservationId
      }, corsHeaders);

    } catch (error) {
      console.error('❌ Error creating reservation:', error);
      return jsonResponse({
        success: false,
        message: 'Failed to create reservation',
        error: error.message
      }, corsHeaders, 500);
    }

  } else {
    console.log(`⚠️ Payment not successful. Status: ${transactionStatus}`);
    console.log('🧹 Cleaning up KV entry without creating reservation');

    // Delete KV entry for failed payment
    await env.BOOKING_DATA.delete(merchantOrderId);

    return jsonResponse({
      success: true,
      message: 'Payment failed - no reservation created'
    }, corsHeaders);
  }
}

/**
 * Generate HMAC-SHA256 signature for Superpay
 * Format: HMAC-SHA256(merchantOrderId + amount + currency, SECRET_KEY)
 */
async function generateSuperpaySignature(merchantOrderId, amount, currency, secretKey) {
  // Format amount with 2 decimals
  const amountStr = parseFloat(amount).toFixed(2);

  // Concatenate: merchantOrderId + amount + currency
  const message = `${merchantOrderId}${amountStr}${currency}`;
  console.log('🔐 Generating signature for:', message);

  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const keyData = encoder.encode(secretKey);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, data);

  const hexSignature = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  console.log('✅ Signature generated:', hexSignature);
  return hexSignature;
}

/**
 * Helper: Return JSON response
 */
function jsonResponse(data, headers = {}, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    }
  });
}
