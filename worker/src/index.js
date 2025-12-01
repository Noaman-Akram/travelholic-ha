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
 * Main endpoint: Create Hostaway reservation + Generate Superpay payment URL
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
  const totalPrice = parseFloat((pricing.total || '0').replace(/[^0-9.]/g, '')) || 0;

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
    throw new Error('Valid price is required');
  }

  console.log('✅ Validation passed:', {
    listingMapId,
    arrivalDate,
    departureDate,
    numberOfGuests,
    totalPrice
  });

  // Step 1: Create reservation in Hostaway
  console.log('📞 Creating Hostaway reservation...');

  const hostawayPayload = {
    channelId: 2000, // Direct booking channel
    listingMapId: parseInt(listingMapId),
    arrivalDate,
    departureDate,
    numberOfGuests: parseInt(numberOfGuests) || 1,
    guestName: guest.name || `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || 'Guest',
    guestEmail: guest.email,
    guestPhone: guest.phone || formData.phone || '',
    totalPrice: totalPrice,
    status: 'new', // Will be updated to 'confirmed' after payment
    notes: `Pending Superpay payment. Booking made at ${new Date().toISOString()}`
  };

  console.log('📤 Hostaway payload:', JSON.stringify(hostawayPayload, null, 2));

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
    console.error('❌ Hostaway error:', errorText);
    throw new Error(`Failed to create reservation: ${errorText}`);
  }

  const reservationData = await reservationResponse.json();
  const reservationId = reservationData.result?.id || reservationData.id;

  if (!reservationId) {
    console.error('❌ No reservation ID in response:', reservationData);
    throw new Error('Failed to get reservation ID from Hostaway');
  }

  console.log('✅ Hostaway reservation created:', reservationId);

  // Step 2: Generate Superpay payment URL
  console.log('💳 Generating Superpay payment URL...');

  const signature = await generateSuperpaySignature(
    env.SUPERPAY_MERCHANT_CODE,
    reservationId.toString(),
    totalPrice.toString(),
    'EGP',
    env.SUPERPAY_API_KEY
  );

  const superpayPayload = {
    merchant: {
      code: env.SUPERPAY_MERCHANT_CODE,
      apiKey: env.SUPERPAY_API_KEY
    },
    order: {
      merchantOrderId: reservationId.toString(),
      amount: totalPrice,
      currency: 'EGP',
      description: `Reservation #${reservationId} - ${hostawayPayload.guestName}`
    },
    clientId: guest.email,
    signature: signature,
    returnUrl: `https://travelholiceg.com/booking-success?reservationId=${reservationId}`,
    callbackUrl: `${new URL(request.url).origin}/api/superpay-webhook`
  };

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
    reservationId,
    iframeUrl,
    message: 'Reservation created successfully. Redirecting to payment...'
  }, corsHeaders);
}

/**
 * Webhook endpoint: Handle payment status from Superpay
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

  // Check if payment was successful
  if (transactionStatus === 'SUCCESS' ||
      transactionStatus === 'PAID' ||
      transactionStatus === 'COMPLETED') {

    console.log(`✅ Payment successful for reservation ${merchantOrderId}`);

    // Update Hostaway reservation to confirmed
    try {
      const updateResponse = await fetch(`https://api.hostaway.com/v1/reservations/${merchantOrderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${env.HOSTAWAY_BEARER_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'confirmed',
          notes: `Payment confirmed via Superpay. Transaction ID: ${transactionId}. Amount: ${amount}`
        })
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('❌ Failed to update reservation:', errorText);
      } else {
        console.log('✅ Reservation updated to confirmed');
      }
    } catch (error) {
      console.error('❌ Error updating reservation:', error);
    }
  } else {
    console.log(`⚠️ Payment not successful. Status: ${transactionStatus}`);
  }

  // Always return success to Superpay
  return jsonResponse({
    success: true,
    message: 'Webhook processed'
  }, corsHeaders);
}

/**
 * Generate HMAC-SHA256 signature for Superpay
 */
async function generateSuperpaySignature(merchantCode, orderId, amount, currency, apiKey) {
  const message = `${merchantCode}|${orderId}|${amount}|${currency}|${apiKey}`;
  console.log('🔐 Generating signature for:', message);

  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const keyData = encoder.encode(apiKey);

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

  console.log('✅ Signature generated');
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
