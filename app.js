(() => {
  const VERSION = 'v1.0.0';
  console.log('[TH] travelholic-ha bundle', VERSION);

  // Utility: wait for an element to appear, useful for SPA pages
  const waitFor = (selector, timeout = 10000) =>
    new Promise((resolve, reject) => {
      const found = document.querySelector(selector);
      if (found) return resolve(found);

      const observer = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) {
          observer.disconnect();
          resolve(el);
        }
      });

      observer.observe(document.documentElement, { childList: true, subtree: true });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout waiting for ${selector}`));
      }, timeout);
    });

  async function init() {
    try {
      console.log('[TH] init start');

      const currentHost = window.location.hostname;
      const currentURL = window.location.href;
      const currentPath = (window.location.pathname || '/').toLowerCase();
      console.log('[TH] Host:', currentHost);
      console.log('[TH] URL:', currentURL);
      console.log('[TH] Path:', currentPath);

      const isRoot = currentPath === '/' || currentPath === '' || currentPath === '/index.html';

      if (currentHost === 'book.travelholiceg.com' && isRoot) {
        console.log('[TH] Redirecting root to https://travelholiceg.com/');
        window.location.replace('https://travelholiceg.com/');
        return;
      } else if (currentHost === 'book.travelholiceg.com') {
        console.log('[TH] On booking subdomain (non-root) — no redirect.');
      } else {
        console.log('[TH] Not on book.travelholiceg.com — no redirect.');
      }

      // Mark the page as ready for custom styling/logic
      document.documentElement.classList.add('th-ready');
      console.log('[TH] th-ready class added');

      // Set up Google Translate (en/ar) - DISABLED (now in header via Top banner script)
      // setupCleanGoogleTranslate();

      // Fix map X button position - push it down below header
      injectMapButtonFix();
    } catch (err) {
      console.error('[TH] init error', err);
      document.documentElement.classList.remove('th-ready');
    }
  }

  // Hook for SPA-like internal route changes if needed later
  window.TH = window.TH || {};
  window.TH.onRouteChange = path => {
    // Re-run logic if needed per internal route
    // init();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // OLD VERSION - KEPT FOR REFERENCE
  function setupGoogleTranslate() {
    try {
      // Ensure body exists before injecting container
      const ensureBody = document.body
        ? Promise.resolve()
        : new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));

      ensureBody.then(() => {
        const targetId = 'google_translate_element';
        let container = document.getElementById(targetId);
        if (!container) {
          container = document.createElement('div');
          container.id = targetId;
          container.style.position = 'fixed';
          container.style.top = '10px';
          container.style.right = '10px';
          container.style.zIndex = '9999';
          container.style.background = 'rgba(255,255,255,0.9)';
          container.style.padding = '6px 10px';
          container.style.borderRadius = '6px';
          container.style.boxShadow = '0 2px 6px rgba(0,0,0,0.12)';
          container.style.fontSize = '12px';
          container.style.fontFamily = 'Arial, sans-serif';
          container.setAttribute('aria-label', 'Language selector');
          document.body.appendChild(container);
          console.log('[TH] Google Translate container injected');
        } else {
          console.log('[TH] Google Translate container already present');
        }

        // Avoid double-loading
        if (!document.querySelector('script[data-th-google-translate]')) {
          window.googleTranslateElementInit = window.googleTranslateElementInit || function () {
            try {
              /* global google */
              new google.translate.TranslateElement(
                {
                  pageLanguage: 'en',
                  includedLanguages: 'en,ar',
                  layout: google.translate.TranslateElement.InlineLayout.HORIZONTAL,
                },
                targetId
              );
              console.log('[TH] Google Translate initialized');
            } catch (err) {
              console.error('[TH] googleTranslateElementInit error', err);
            }
          };

          const s = document.createElement('script');
          s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
          s.defer = true;
          s.dataset.thGoogleTranslate = '1';
          s.onerror = err => console.error('[TH] Google Translate script load error', err);
          document.head.appendChild(s);
          console.log('[TH] Google Translate script requested');
        } else {
          console.log('[TH] Google Translate script already requested/loaded');
        }
      });
    } catch (err) {
      console.error('[TH] setupGoogleTranslate error', err);
    }
  }

  // Fix map X button position - move it below the header
  function injectMapButtonFix() {
    try {
      // Check if style already exists
      if (document.getElementById('th-map-button-fix')) {
        console.log('[TH] Map button fix already applied');
        return;
      }

      // Create style element
      const style = document.createElement('style');
      style.id = 'th-map-button-fix';
      style.textContent = `
        /* Push map close button down below header */
        .sc-377dba68-1.hoJYXA {
          top: 90px !important;
          position: absolute !important;
        }

        .sc-377dba68-2.keqDuY {
          z-index: 10000 !important;
        }

        /* Alternative selector for map close buttons */
        div[class*="sc-377dba68-1"] {
          top: 90px !important;
        }

        /* Ensure all map controls are below header */
        .leaflet-top {
          top: 80px !important;
        }
      `;

      document.head.appendChild(style);
      console.log('[TH] Map button fix injected');
    } catch (err) {
      console.error('[TH] Error injecting map button fix:', err);
    }
  }

  // NEW CLEAN VERSION - Better positioned, less intrusive
  function setupCleanGoogleTranslate() {
    try {
      const ensureBody = document.body
        ? Promise.resolve()
        : new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));

      ensureBody.then(() => {
        // Create toggle button (small, clean, bottom-right)
        const toggleButton = document.createElement('button');
        toggleButton.id = 'th-translate-toggle';
        toggleButton.innerHTML = '🌐';
        toggleButton.setAttribute('aria-label', 'Toggle language selector');
        toggleButton.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: rgb(36, 54, 148);
          color: white;
          border: none;
          font-size: 24px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 9998;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        `;

        // Hover effect
        toggleButton.onmouseover = () => {
          toggleButton.style.transform = 'scale(1.1)';
          toggleButton.style.boxShadow = '0 6px 16px rgba(36, 54, 148, 0.3)';
        };
        toggleButton.onmouseout = () => {
          toggleButton.style.transform = 'scale(1)';
          toggleButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        };

        // Create container for Google Translate widget (hidden by default)
        const targetId = 'google_translate_element';
        const container = document.createElement('div');
        container.id = targetId;
        container.style.cssText = `
          position: fixed;
          bottom: 80px;
          right: 20px;
          background: white;
          padding: 12px 16px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 9999;
          display: none;
          font-size: 14px;
          font-family: Arial, sans-serif;
        `;
        container.setAttribute('aria-label', 'Language selector');

        // Toggle visibility
        let isVisible = false;
        toggleButton.onclick = () => {
          isVisible = !isVisible;
          container.style.display = isVisible ? 'block' : 'none';
          toggleButton.style.transform = isVisible ? 'rotate(90deg)' : 'rotate(0deg)';
        };

        // Add to DOM
        document.body.appendChild(toggleButton);
        document.body.appendChild(container);
        console.log('[TH] Clean translate button added');

        // Load Google Translate script
        if (!document.querySelector('script[data-th-google-translate]')) {
          window.googleTranslateElementInit = window.googleTranslateElementInit || function () {
            try {
              /* global google */
              new google.translate.TranslateElement(
                {
                  pageLanguage: 'en',
                  includedLanguages: 'en,ar',
                  layout: google.translate.TranslateElement.InlineLayout.HORIZONTAL,
                },
                targetId
              );
              console.log('[TH] Google Translate initialized');
            } catch (err) {
              console.error('[TH] googleTranslateElementInit error', err);
            }
          };

          const s = document.createElement('script');
          s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
          s.defer = true;
          s.dataset.thGoogleTranslate = '1';
          s.onerror = err => console.error('[TH] Google Translate script load error', err);
          document.head.appendChild(s);
          console.log('[TH] Google Translate script requested');
        }
      });
    } catch (err) {
      console.error('[TH] setupCleanGoogleTranslate error', err);
    }
  }

  // =======================
// PAYMENT BUTTON LOGIC
// =======================

function setButtonLoading(button, isLoading) {
  if (isLoading) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.innerHTML = `
      <span style="display: inline-flex; align-items: center; gap: 0.5rem;">
        <svg style="animation: spin 1s linear infinite; width: 1rem; height: 1rem;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle style="opacity: 0.25;" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path style="opacity: 0.75;" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Processing...
      </span>
    `;
    button.style.cursor = 'not-allowed';
    button.style.opacity = '0.7';

    // Add spinner animation
    const style = document.createElement('style');
    style.id = 'th-spinner-style';
    if (!document.getElementById('th-spinner-style')) {
      style.textContent = `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || 'Proceed to Secure Payment';
    button.style.cursor = 'pointer';
    button.style.opacity = '1';
  }
}

function showPaymentModal(iframeUrl, merchantOrderId) {
  console.log('[TH] Creating payment modal...');

  // Create modal overlay
  const modal = document.createElement('div');
  modal.id = 'th-payment-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;

  // Create modal content container
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    position: relative;
    width: 100%;
    max-width: 500px;
    height: 95vh;
    max-height: 800px;
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
  `;

  // Add mobile responsive styles
  if (window.innerWidth <= 768) {
    modalContent.style.cssText = `
      position: relative;
      width: 100%;
      height: 100vh;
      max-height: 100vh;
      background: white;
      border-radius: 0;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
      display: flex;
      flex-direction: column;
    `;
  }

  // Create header with close button
  const header = document.createElement('div');
  header.style.cssText = `
    padding: 20px;
    background: rgb(36, 54, 148);
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;

  const title = document.createElement('h3');
  title.textContent = 'Secure Payment';
  title.style.cssText = 'margin: 0; font-size: 18px; font-weight: 600;';

  const closeButton = document.createElement('button');
  closeButton.innerHTML = '×';
  closeButton.style.cssText = `
    background: transparent;
    border: none;
    color: white;
    font-size: 32px;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  `;

  closeButton.onclick = () => {
    if (confirm('Are you sure you want to cancel the payment?')) {
      document.body.removeChild(modal);
      console.log('[TH] Payment modal closed by user');
    }
  };

  header.appendChild(title);
  header.appendChild(closeButton);

  // Create iframe container
  const iframeContainer = document.createElement('div');
  iframeContainer.style.cssText = `
    flex: 1;
    overflow: hidden;
    position: relative;
  `;

  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.src = iframeUrl;
  iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
  `;
  iframe.setAttribute('allow', 'payment');

  // Create loading indicator
  const loadingDiv = document.createElement('div');
  loadingDiv.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
  `;
  loadingDiv.innerHTML = `
    <div style="font-size: 16px; color: #666;">Loading payment form...</div>
  `;

  iframe.onload = () => {
    loadingDiv.style.display = 'none';
    console.log('[TH] Payment iframe loaded');
  };

  iframeContainer.appendChild(loadingDiv);
  iframeContainer.appendChild(iframe);

  // Assemble modal
  modalContent.appendChild(header);
  modalContent.appendChild(iframeContainer);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  console.log('[TH] Payment modal created and displayed');

  // Listen for payment completion (SuperPay might redirect or send postMessage)
  // You can enhance this based on SuperPay's actual behavior
  window.addEventListener('message', function(event) {
    // Check if message is from SuperPay domain
    if (event.origin.includes('super-pay.com')) {
      console.log('[TH] Message from SuperPay:', event.data);

      // Handle payment success/failure
      if (event.data.status === 'success' || event.data.status === 'SUCCESS') {
        handlePaymentSuccess(modal, merchantOrderId);
      } else if (event.data.status === 'failed' || event.data.status === 'FAILED') {
        handlePaymentFailure(modal);
      }
    }
  });
}

function handlePaymentSuccess(modal, merchantOrderId) {
  console.log('[TH] Payment successful!');

  // Remove modal
  document.body.removeChild(modal);

  // Show success message
  const successMsg = document.createElement('div');
  successMsg.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 40px;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    z-index: 999999;
    text-align: center;
    max-width: 400px;
  `;
  successMsg.innerHTML = `
    <div style="font-size: 48px; margin-bottom: 20px;">✅</div>
    <h3 style="margin: 0 0 10px 0; color: #059669;">Payment Successful!</h3>
    <p style="margin: 0; color: #666;">Your booking has been confirmed. You will receive a confirmation email shortly.</p>
  `;
  document.body.appendChild(successMsg);

  // Redirect after 3 seconds
  setTimeout(() => {
    window.location.href = 'https://travelholiceg.com/booking-success';
  }, 3000);
}

function handlePaymentFailure(modal) {
  console.log('[TH] Payment failed');

  // Remove modal
  document.body.removeChild(modal);

  // Show error message
  const errorMsg = document.createElement('div');
  errorMsg.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 40px;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    z-index: 999999;
    text-align: center;
    max-width: 400px;
  `;
  errorMsg.innerHTML = `
    <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
    <h3 style="margin: 0 0 10px 0; color: #dc2626;">Payment Failed</h3>
    <p style="margin: 0 0 20px 0; color: #666;">Your payment could not be processed. Please try again.</p>
    <button onclick="this.parentElement.remove()" style="
      background: rgb(36, 54, 148);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 600;
    ">Try Again</button>
  `;
  document.body.appendChild(errorMsg);
}

function clearValidationErrors() {
  // Remove all existing error messages
  document.querySelectorAll('.th-error-message').forEach(el => el.remove());

  // Remove error styling from inputs
  document.querySelectorAll('.th-error-input').forEach(input => {
    input.classList.remove('th-error-input');
    input.style.borderColor = '';
  });
}

function showFieldError(input, message) {
  if (!input) return;

  // Add error styling to input
  input.classList.add('th-error-input');
  input.style.borderColor = '#dc2626';
  input.style.borderWidth = '2px';

  // Create error message element
  const errorEl = document.createElement('div');
  errorEl.className = 'th-error-message';
  errorEl.textContent = message;
  errorEl.style.cssText = `
    color: #dc2626;
    font-size: 0.875rem;
    margin-top: 0.25rem;
    margin-bottom: 0.5rem;
    font-weight: 500;
  `;

  // Insert error message after the input
  input.parentNode.insertBefore(errorEl, input.nextSibling);
}

function validateBookingForm() {
  // Clear previous errors
  clearValidationErrors();

  let isValid = true;

  // Check for required fields
  const firstNameInput = document.querySelector('input[name*="first" i], input[placeholder*="first" i]');
  const lastNameInput = document.querySelector('input[name*="last" i], input[placeholder*="last" i]');
  const emailInput = document.querySelector('input[type="email"], input[name*="email" i]');
  const phoneInput = document.querySelector('input[type="tel"], input[name*="phone" i]');

  // Validate first name
  if (!firstNameInput || !firstNameInput.value.trim() || firstNameInput.value.trim().length < 2) {
    showFieldError(firstNameInput, 'First name is required (min 2 characters)');
    isValid = false;
  }

  // Validate last name
  if (!lastNameInput || !lastNameInput.value.trim() || lastNameInput.value.trim().length < 2) {
    showFieldError(lastNameInput, 'Last name is required (min 2 characters)');
    isValid = false;
  }

  // Validate email
  if (!emailInput || !emailInput.value.trim()) {
    showFieldError(emailInput, 'Email is required');
    isValid = false;
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value.trim())) {
      showFieldError(emailInput, 'Please enter a valid email address');
      isValid = false;
    }
  }

  // Validate phone
  if (!phoneInput || !phoneInput.value.trim() || phoneInput.value.trim().length < 5) {
    showFieldError(phoneInput, 'Phone number is required');
    isValid = false;
  }

  // Check for any HTML5 validation errors
  const allInputs = document.querySelectorAll('input, textarea, select');
  allInputs.forEach(input => {
    if (input.validity && !input.validity.valid && !input.classList.contains('th-error-input')) {
      showFieldError(input, input.validationMessage || 'This field is invalid');
      isValid = false;
    }
  });

  return isValid;
}

function extractBookingInfo() {
  const info = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    guest: {},
    booking: {},
    property: {},
    pricing: {}
  };

  try {
    // Extract all input fields
    const inputs = document.querySelectorAll('input, textarea, select');
    const formData = {};

    inputs.forEach(input => {
      const name = input.name || input.id || input.placeholder;
      const value = input.value || input.textContent;

      if (name && value) {
        formData[name] = value;

        // Categorize common fields
        const nameLower = name.toLowerCase();

        // Guest information
        if (nameLower.includes('name') || nameLower.includes('first') || nameLower.includes('last')) {
          info.guest.name = (info.guest.name || '') + ' ' + value;
        }
        if (nameLower.includes('email')) {
          info.guest.email = value;
        }
        if (nameLower.includes('phone') || nameLower.includes('mobile')) {
          info.guest.phone = value;
        }
        if (nameLower.includes('address')) {
          info.guest.address = value;
        }
        if (nameLower.includes('city')) {
          info.guest.city = value;
        }
        if (nameLower.includes('country')) {
          info.guest.country = value;
        }
        if (nameLower.includes('zip') || nameLower.includes('postal')) {
          info.guest.zipCode = value;
        }

        // Booking details
        if (nameLower.includes('checkin') || nameLower.includes('check-in') || nameLower.includes('arrival')) {
          info.booking.checkIn = value;
        }
        if (nameLower.includes('checkout') || nameLower.includes('check-out') || nameLower.includes('departure')) {
          info.booking.checkOut = value;
        }
        if (nameLower.includes('adult')) {
          info.booking.adults = value;
        }
        if (nameLower.includes('child')) {
          info.booking.children = value;
        }
        if (nameLower.includes('guest') && nameLower.includes('number')) {
          info.booking.numberOfGuests = value;
        }
        if (nameLower.includes('special') || nameLower.includes('request') || nameLower.includes('note')) {
          info.booking.specialRequests = value;
        }
      }
    });

    // Store all form data
    info.formData = formData;

    // Extract pricing information from visible text - IMPROVED with multiple methods
    console.log('[TH] Extracting pricing...');

    // Method 1: Look for elements with "total" in class or text
    const priceElements = document.querySelectorAll('[class*="price"], [class*="total"], [class*="cost"], [class*="amount"]');
    priceElements.forEach(el => {
      const text = el.textContent.trim();
      const label = el.previousElementSibling?.textContent || el.getAttribute('aria-label') || '';

      if (text.match(/\$|€|£|[0-9]+\.[0-9]{2}/)) {
        const labelLower = (label + text).toLowerCase();

        if (labelLower.includes('total')) {
          info.pricing.total = text;
          console.log('[TH] Found total (method 1):', text);
        } else if (labelLower.includes('subtotal')) {
          info.pricing.subtotal = text;
        } else if (labelLower.includes('tax')) {
          info.pricing.tax = text;
        } else if (labelLower.includes('fee')) {
          info.pricing.fees = text;
        } else if (labelLower.includes('discount')) {
          info.pricing.discount = text;
        }
      }
    });

    // Method 2: Fallback - look for any text that says "Total" followed by a price
    if (!info.pricing.total) {
      const allText = document.body.innerText;
      const totalMatch = allText.match(/Total\s*[:\$]?\s*\$?([0-9,]+\.?[0-9]{0,2})/i);
      if (totalMatch) {
        info.pricing.total = '$' + totalMatch[1].replace(/,/g, '');
        console.log('[TH] Found total (method 2):', info.pricing.total);
      }
    }

    // Method 3: Fallback - extract from URL if available
    if (!info.pricing.total) {
      const urlParams = new URL(info.url).searchParams;
      const priceParam = urlParams.get('price') || urlParams.get('total') || urlParams.get('amount');
      if (priceParam) {
        info.pricing.total = '$' + priceParam;
        console.log('[TH] Found total (method 3 - URL):', info.pricing.total);
      }
    }

    // Log final pricing
    console.log('[TH] Final pricing:', info.pricing);

    // Extract property/listing name
    const headings = document.querySelectorAll('h1, h2, h3, [class*="title"], [class*="property"], [class*="listing"]');
    headings.forEach(h => {
      const text = h.textContent.trim();
      if (text && text.length > 3 && text.length < 100 && !info.property.name) {
        info.property.name = text;
      }
    });

    // Extract dates from visible elements if not found in inputs
    if (!info.booking.checkIn || !info.booking.checkOut) {
      const dateElements = document.querySelectorAll('[class*="date"], [class*="check"]');
      dateElements.forEach(el => {
        const text = el.textContent.trim();
        const dateMatch = text.match(/\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/);

        if (dateMatch) {
          const label = el.getAttribute('aria-label') || el.previousElementSibling?.textContent || '';
          if (label.toLowerCase().includes('in') || label.toLowerCase().includes('arrival')) {
            info.booking.checkIn = info.booking.checkIn || dateMatch[0];
          } else if (label.toLowerCase().includes('out') || label.toLowerCase().includes('departure')) {
            info.booking.checkOut = info.booking.checkOut || dateMatch[0];
          }
        }
      });
    }

    // Clean up guest name
    if (info.guest.name) {
      info.guest.name = info.guest.name.trim();
    }

    console.log('[TH] Extraction complete:', info);

  } catch (error) {
    console.error('[TH] Error extracting booking info:', error);
    info.error = error.message;
  }

  return info;
}

 function modifyCheckoutPage() {
  console.log('[TH] Looking for Finalize booking button...');
  
  // Find "Finalize booking" button
  const finalizeButton = Array.from(document.querySelectorAll('button')).find(
    btn => btn.textContent.includes('Finalize booking')
  );

  if (!finalizeButton) {
    console.log('[TH] Finalize booking button not found');
    return false;
  }

  console.log('[TH] Found Finalize booking button!');

  // Check if custom button already exists
  if (document.getElementById('th-payment-button')) {
    console.log('[TH] Custom button already exists');
    return true;
  }

  // Hide original button
  finalizeButton.style.display = 'none';

  // Create custom button
  const customButton = document.createElement('button');
  customButton.id = 'th-payment-button';
  customButton.type = 'button';
  customButton.textContent = 'Proceed to Secure Payment';
  customButton.style.cssText = `
    border: 0.0625rem solid rgb(36, 54, 148);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    line-height: 1.25rem;
    user-select: none;
    text-decoration: none;
    font-size: 1rem;
    height: 3.25rem;
    padding: 0px 1.5rem;
    border-radius: 2.5rem;
    background-color: rgb(36, 54, 148);
    color: rgb(255, 255, 255);
    width: 100%;
    max-width: 100%;
    transition: all 0.2s ease;
  `;

  customButton.onmouseover = () => {
    customButton.style.transform = 'translateY(-2px)';
    customButton.style.boxShadow = '0 4px 12px rgba(36, 54, 148, 0.3)';
  };

  customButton.onmouseout = () => {
    customButton.style.transform = 'translateY(0)';
    customButton.style.boxShadow = 'none';
  };

  customButton.onclick = async () => {
    console.log('[TH] Payment button clicked - validating form...');

    // Validate form first
    const isValid = validateBookingForm();

    if (!isValid) {
      console.error('[TH] Form validation failed - please check fields with errors');
      // Scroll to first error
      const firstError = document.querySelector('.th-error-input');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus();
      }
      return;
    }

    console.log('[TH] ✅ Form validation passed - extracting booking info...');

    // Show loading state
    setButtonLoading(customButton, true);

    try {
      const bookingInfo = extractBookingInfo();
      console.log('[TH] Extracted booking info:', bookingInfo);

      // Call Worker API to create booking and get payment URL
      const WORKER_URL = 'https://travelholic-payment.tech-a49.workers.dev';

      console.log('[TH] Calling Worker API...');
      const response = await fetch(`${WORKER_URL}/api/create-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingInfo)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[TH] Worker API error:', errorText);
        throw new Error(`Failed to create booking: ${response.status}`);
      }

      const data = await response.json();
      console.log('[TH] Worker response:', data);

      if (data.success && data.iframeUrl) {
        console.log('[TH] ✅ Opening payment modal...');
        // Show payment iframe in modal popup
        showPaymentModal(data.iframeUrl, data.merchantOrderId);
      } else {
        throw new Error(data.error || 'Failed to get payment URL');
      }

    } catch (error) {
      console.error('[TH] Error processing payment:', error);
      alert('Error processing payment. Please try again.');
    } finally {
      // Reset button state
      setButtonLoading(customButton, false);
    }
  };

  // Insert custom button right before the original button
  finalizeButton.parentNode.insertBefore(customButton, finalizeButton);
  
  console.log('[TH] ✅ Custom payment button added!');
  return true;
}

// =======================
// SPA NAVIGATION HANDLER
// =======================

let lastUrl = location.href;
let checkoutObserver = null;
let checkInterval = null;

function isCheckoutPage() {
  return window.location.href.includes('/checkout') || window.location.href.includes('/book/');
}

function tryAddCheckoutButton() {
  if (!isCheckoutPage()) {
    console.log('[TH] Not on checkout page, skipping...');
    return;
  }

  if (document.getElementById('th-payment-button')) {
    console.log('[TH] Custom button already exists, skipping...');
    return;
  }

  const success = modifyCheckoutPage();
  if (success) {
    console.log('[TH] ✅ Successfully added custom button on checkout page');
  }
}

// Watch for DOM changes (for React/SPA rendering)
function startCheckoutObserver() {
  if (checkoutObserver) return;

  checkoutObserver = new MutationObserver(() => {
    // Check if we're on checkout and button doesn't exist
    if (isCheckoutPage() && !document.getElementById('th-payment-button')) {
      tryAddCheckoutButton();
    }
  });

  // Observe the entire document for changes
  checkoutObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('[TH] MutationObserver started for checkout page detection');
}

// Watch for URL changes (SPA navigation)
function watchUrlChanges() {
  // Method 1: Override pushState and replaceState
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function() {
    originalPushState.apply(this, arguments);
    handleUrlChange();
  };

  history.replaceState = function() {
    originalReplaceState.apply(this, arguments);
    handleUrlChange();
  };

  // Method 2: Listen for popstate (back/forward navigation)
  window.addEventListener('popstate', handleUrlChange);

  // Method 3: Polling fallback (in case URL changes aren't caught)
  checkInterval = setInterval(() => {
    if (location.href !== lastUrl) {
      handleUrlChange();
    }
  }, 500);

  console.log('[TH] URL change detection activated');
}

function handleUrlChange() {
  const currentUrl = location.href;

  if (currentUrl !== lastUrl) {
    console.log('[TH] URL changed from:', lastUrl);
    console.log('[TH] URL changed to:', currentUrl);
    lastUrl = currentUrl;

    // Check if we navigated to checkout page
    if (isCheckoutPage()) {
      console.log('[TH] ✅ Navigated to checkout page!');
      // Try immediately
      setTimeout(tryAddCheckoutButton, 500);
      // And try again after React finishes rendering
      setTimeout(tryAddCheckoutButton, 1500);
      setTimeout(tryAddCheckoutButton, 3000);
    }
  }
}

// Initialize checkout monitoring
function initCheckoutMonitoring() {
  console.log('[TH] Initializing checkout monitoring...');

  // Start watching for URL changes
  watchUrlChanges();

  // Start watching for DOM changes
  if (document.body) {
    startCheckoutObserver();
  } else {
    document.addEventListener('DOMContentLoaded', startCheckoutObserver);
  }

  // Try immediately if already on checkout page
  if (isCheckoutPage()) {
    console.log('[TH] Already on checkout page, attempting to add button...');
    setTimeout(tryAddCheckoutButton, 1000);
    setTimeout(tryAddCheckoutButton, 2000);
    setTimeout(tryAddCheckoutButton, 3000);
  }
}

// Start monitoring
initCheckoutMonitoring();

})();
