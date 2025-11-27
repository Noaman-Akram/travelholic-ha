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
  console.log('[TH] Looking for checkout payment section...');
  
  // Find "Payment Information" heading
  const paymentHeading = Array.from(document.querySelectorAll('h2')).find(
    h => h.textContent.includes('Payment Information')
  );
  
  if (!paymentHeading) {
    console.log('[TH] Payment heading not found');
    return false;
  }

  // Get the entire payment section (the div that contains Payment Information)
  const paymentSection = paymentHeading.parentElement;
  
  // Hide the ENTIRE payment section
  paymentSection.style.display = 'none';
  console.log('[TH] ✅ Hidden entire payment section!');

  // Hide the blue "Finalize booking" button
  const finalizeButton = Array.from(document.querySelectorAll('button')).find(
    btn => btn.textContent.includes('Finalize booking')
  );
  if (finalizeButton) {
    finalizeButton.style.display = 'none';
    console.log('[TH] ✅ Hidden Finalize booking button!');
  }

  // Add ONE custom button (check if already added)
  if (document.getElementById('th-payment-button')) {
    console.log('[TH] Button already added, skipping');
    return true;
  }

  const customButton = document.createElement('button');
  customButton.id = 'th-payment-button';
  customButton.type = 'button';
  customButton.textContent = '🔒 Proceed to Secure Payment';
  customButton.style.cssText = `
    width: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 18px 32px;
    border-radius: 12px;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    margin: 30px 0;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    transition: transform 0.2s;
  `;

  customButton.onmouseover = () => {
    customButton.style.transform = 'translateY(-2px)';
  };
  customButton.onmouseout = () => {
    customButton.style.transform = 'translateY(0)';
  };

  customButton.onclick = () => {
    alert('✅ Payment button clicked!\n\nNext: We will extract booking data and redirect to payment page.');
  };

  // Insert button where "Finalize booking" was
  if (finalizeButton) {
    finalizeButton.parentElement.appendChild(customButton);
  } else {
    paymentSection.parentElement.appendChild(customButton);
  }
  
  console.log('[TH] ✅ Custom payment button added!');
  return true;
}

// Run ONCE when checkout page loads
if (window.location.href.includes('/checkout') || window.location.href.includes('/book/')) {
  console.log('[TH] Checkout page detected!');
  
  // Wait for page to load, then run ONCE
  setTimeout(() => {
    if (!document.getElementById('th-payment-button')) {
      modifyCheckoutPage();
    }
  }, 2000);
}
  
})();
