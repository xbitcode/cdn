/**
 * Enhanced Ad Block Detection Script
 * Detects various ad blockers and ad bypassing extensions
 */

// Cookie functions
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = 'expires=' + d.toUTCString();
    document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
}

function getCookie(cname) {
    var name = cname + '=';
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return '';
}

// Enhanced ad block detection
function checkAdblockUser() {
    if (getCookie('ab') === '1') {
        return;
    }
    document.cookie = 'ab=2; path=/';

    var adBlockDetected = false;
    
    // Method 1: Check for hidden ad banner
    var adBanner = document.getElementById('ad-banner');
    if (adBanner) {
        var adBannerRect = adBanner.getBoundingClientRect();
        if (adBannerRect.height === 0 || adBannerRect.width === 0 || 
            window.getComputedStyle(adBanner).display === 'none' ||
            window.getComputedStyle(adBanner).visibility === 'hidden') {
            adBlockDetected = true;
        }
    }
    
    // Method 2: Check jQuery elements if available
    if (typeof $ !== 'undefined') {
        var $adBlock = $('#ad-banner');
        if ($adBlock.length > 0) {
            if ($adBlock.filter(':visible').length === 0 ||
                $adBlock.filter(':hidden').length > 0 ||
                $adBlock.height() === 0 ||
                $adBlock.width() === 0) {
                adBlockDetected = true;
            }
        }
    }
    
    // Method 3: Check for common ad block patterns
    var testAd = document.createElement('div');
    testAd.className = 'adsbox adsbygoogle advertisement ads ad-banner';
    testAd.style.position = 'absolute';
    testAd.style.left = '-9999px';
    testAd.style.width = '1px';
    testAd.style.height = '1px';
    document.body.appendChild(testAd);
    
    setTimeout(function() {
        var testAdRect = testAd.getBoundingClientRect();
        if (testAdRect.height === 0 || testAdRect.width === 0 || 
            window.getComputedStyle(testAd).display === 'none') {
            adBlockDetected = true;
        }
        document.body.removeChild(testAd);
        
        if (adBlockDetected) {
            document.cookie = 'ab=1; path=/';
            handleAdBlockDetection();
        }
    }, 100);
    
    // Method 4: Try to load a fake ad script
    var fakeAdScript = document.createElement('script');
    fakeAdScript.src = '/ads.js?' + Math.random();
    fakeAdScript.onerror = function() {
        document.cookie = 'ab=1; path=/';
        handleAdBlockDetection();
    };
    document.head.appendChild(fakeAdScript);
}

function handleAdBlockDetection() {
    if (typeof app_vars !== 'undefined' && app_vars['force_disable_adblock'] === '1') {
        var adblock_message = '<div class="alert alert-danger text-center" style="margin: 20px; padding: 20px; border-radius: 5px;">' +
            '<h4><i class="fa fa-exclamation-triangle" style="color: #d9534f;"></i> Ad Blocker Detected</h4>' +
            '<p>' + (app_vars['please_disable_adblock'] || 'Please disable your ad blocker to continue.') + '</p>' +
            '</div>';

        // Replace content based on page type
        if (typeof $ !== 'undefined') {
            $('#link-view').replaceWith(adblock_message);
            $('.banner-page a.get-link').replaceWith(adblock_message);
            $('.interstitial-page div.skip-ad').replaceWith(adblock_message);
            $('#form-continue').replaceWith(adblock_message);
        } else {
            // Fallback for vanilla JS
            var linkView = document.getElementById('link-view');
            if (linkView) {
                linkView.innerHTML = adblock_message;
            }
            
            var skipAd = document.querySelector('.skip-ad');
            if (skipAd) {
                skipAd.innerHTML = adblock_message;
            }
            
            var formContinue = document.getElementById('form-continue');
            if (formContinue) {
                formContinue.innerHTML = adblock_message;
            }
        }
    }
}

function checkAdsbypasserUser() {
    if (getCookie('ab') === '1') {
        return;
    }
    
    // Check for known ad bypassing extensions
    var ads_bypassers = ['AdsBypasser', 'SafeBrowse', 'LinkBypasser', 'Universal Bypasser'];
    var title_words = document.title.split(' ');
    var user_agent = navigator.userAgent;
    
    document.cookie = 'ab=2; path=/';
    
    // Check title for bypasser signatures
    for (var i = 0; i < ads_bypassers.length; i++) {
        if (title_words.indexOf(ads_bypassers[i]) >= 0) {
            document.cookie = 'ab=1; path=/';
            handleAdBlockDetection();
            return;
        }
    }
    
    // Check for common bypasser patterns in user agent
    var bypasser_patterns = ['bypass', 'skipper', 'automator'];
    var ua_lower = user_agent.toLowerCase();
    for (var j = 0; j < bypasser_patterns.length; j++) {
        if (ua_lower.indexOf(bypasser_patterns[j]) >= 0) {
            document.cookie = 'ab=1; path=/';
            handleAdBlockDetection();
            return;
        }
    }
}

function checkPrivateMode() {
    if (typeof Promise === 'function') {
        new Promise(function(resolve) {
            var db,
                on = function() { resolve(true); },
                off = function() { resolve(false); },
                tryls = function tryls() {
                    try {
                        localStorage.length
                            ? off()
                            : (localStorage.x = 1, localStorage.removeItem('x'), off());
                    } catch (e) {
                        navigator.cookieEnabled ? on() : off();
                    }
                };

            // Enhanced browser detection
            if (window.webkitRequestFileSystem) {
                // Blink (Chrome & Opera)
                webkitRequestFileSystem(0, 0, off, on);
            } else if ('MozAppearance' in document.documentElement.style) {
                // Firefox
                db = indexedDB.open('test');
                db.onerror = on;
                db.onsuccess = off;
            } else if (/constructor/i.test(window.HTMLElement)) {
                // Safari
                tryls();
            } else if (!window.indexedDB && (window.PointerEvent || window.MSPointerEvent)) {
                // IE10+ & Edge
                on();
            } else {
                // Rest
                off();
            }
        }).then(function(isPrivateMode) {
            if (getCookie('ab') === '1') {
                return;
            }
            document.cookie = 'ab=2; path=/';
            if (isPrivateMode) {
                document.cookie = 'ab=1; path=/';
                // Private mode users might be trying to bypass ads
                // You can customize this behavior as needed
            }
        });
    }
}

// Initialize ad block detection
function initAdBlockDetection() {
    // Set initial cookie
    document.cookie = 'ab=0; path=/';
    
    // Check for ad bypassers immediately
    checkAdsbypasserUser();
    
    // Check for ad blockers after a delay to ensure DOM is ready
    setTimeout(function() {
        checkAdblockUser();
    }, 1000);
    
    // Check private mode
    checkPrivateMode();
    
    // Additional check after page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(checkAdblockUser, 2000);
        });
    } else {
        setTimeout(checkAdblockUser, 2000);
    }
}

// Export functions for global use
window.AdBlockDetection = {
    init: initAdBlockDetection,
    checkAdblock: checkAdblockUser,
    checkBypasser: checkAdsbypasserUser,
    checkPrivateMode: checkPrivateMode,
    setCookie: setCookie,
    getCookie: getCookie
};

// Auto-initialize if not already done
if (typeof window.adBlockDetectionInitialized === 'undefined') {
    window.adBlockDetectionInitialized = true;
    
    // Initialize immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdBlockDetection);
    } else {
        initAdBlockDetection();
    }
}
