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

      // Set up Google Translate (en/ar)
      setupGoogleTranslate();
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

  // =======================
// PAYMENT BUTTON LOGIC
// =======================


  function modifyCheckoutPage() {
  console.log('[TH] Looking for payment section...');
  
  // Find "Payment Information" heading
  const paymentHeading = Array.from(document.querySelectorAll('h2')).find(
    h => h.textContent.includes('Payment Information')
  );
  
  if (!paymentHeading) {
    console.log('[TH] Payment heading not found');
    return false;
  }

  console.log('[TH] Found Payment Information heading!');

  // Hide the entire Payment Information section
  const paymentSection = paymentHeading.parentElement;
  paymentSection.style.display = 'none';
  console.log('[TH] ✅ Hidden Payment Information section!');

  // Find "Special requests" section
  const specialRequestsHeading = Array.from(document.querySelectorAll('h2, h3, div')).find(
    el => el.textContent.includes('Special requests')
  );

  // Find "Finalize booking" button
  const finalizeButton = Array.from(document.querySelectorAll('button')).find(
    btn => btn.textContent.includes('Finalize booking')
  );

  if (!finalizeButton) {
    console.log('[TH] Finalize booking button not found');
    return false;
  }

  console.log('[TH] Found Finalize booking button!');

  // Get the parent container of the button (has button + privacy text)
  const buttonContainer = finalizeButton.parentElement;
  
  // Find the privacy text ("By clicking this button...")
  const privacyText = buttonContainer.querySelector('div, p, span');

  // Check if custom button already exists
  if (document.getElementById('th-payment-button')) {
    console.log('[TH] Custom button already exists');
    return true;
  }

  // Hide original button
  finalizeButton.style.display = 'none';
  console.log('[TH] ✅ Hidden Finalize booking button!');

  // Create custom button
  const customButton = document.createElement('button');
  customButton.id = 'th-payment-button';
  customButton.type = 'button';
  customButton.textContent = 'Finalize booking';
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
    margin-bottom: 20px;
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

  customButton.onclick = () => {
    alert('✅ Payment button clicked!\n\nNext: Extract data and redirect to payment page.');
  };

  // Insert custom button where original button was
  buttonContainer.insertBefore(customButton, finalizeButton);
  
  console.log('[TH] ✅ Custom payment button added!');
  return true;
}

// Run on checkout page
if (window.location.href.includes('/checkout') || window.location.href.includes('/book/')) {
  console.log('[TH] Checkout page detected!');
  
  setTimeout(() => {
    if (!document.getElementById('th-payment-button')) {
      modifyCheckoutPage();
    }
  }, 2000);
}
  
})();
