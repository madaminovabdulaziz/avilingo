/**
 * AviLingo Landing Page — JavaScript
 * Handles language switching, form interactions, survey, and Telegram notifications
 */

// ============================================
// CONFIGURATION - Update these values
// ============================================
const CONFIG = {
    // Telegram Bot Token
    TELEGRAM_BOT_TOKEN: '8241628696:AAGEH1pQ8-lrSHNJyDT4Rizvp397kVzKxUY',
    // Telegram Chat ID
    TELEGRAM_CHAT_ID: '5069131343',
    // Formspree form ID (optional, for email backup)
    FORMSPREE_ID: 'YOUR_FORM_ID'
};

// Store user email for survey submission
let currentUserEmail = '';

document.addEventListener('DOMContentLoaded', () => {
    initLanguageToggle();
    initFormHandling();
    initCounterAnimation();
    initSurveyHandling();
    initModalControls();
});

/**
 * Counter Animation
 */
function initCounterAnimation() {
    const counter = document.querySelector('.counter-number');
    if (!counter) return;

    const target = parseInt(counter.dataset.target) || 250;
    const duration = 2000; // 2 seconds
    const startTime = performance.now();
    let hasAnimated = false;

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth deceleration
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(easeOut * target);

        counter.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            counter.textContent = target;
        }
    }

    // Start animation when element is in view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !hasAnimated) {
                hasAnimated = true;
                requestAnimationFrame(animate);
            }
        });
    }, { threshold: 0.5 });

    observer.observe(counter);
}

/**
 * Language Toggle System
 */
function initLanguageToggle() {
    const langButtons = document.querySelectorAll('.lang-btn');
    const translatableElements = document.querySelectorAll('[data-en]');
    const emailInputs = document.querySelectorAll('input[type="email"]');

    // Check for saved language preference
    const savedLang = localStorage.getItem('avilingo-lang') || 'en';
    setLanguage(savedLang);

    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            setLanguage(lang);
            localStorage.setItem('avilingo-lang', lang);
        });
    });

    function setLanguage(lang) {
        // Update buttons
        langButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        // Update all translatable text
        translatableElements.forEach(el => {
            const text = el.dataset[lang];
            if (text) {
                // Check if element has a span child (like AI badge with icon)
                const span = el.querySelector('span');
                if (span && el.classList.contains('ai-badge')) {
                    span.textContent = text;
                } else {
                    el.textContent = text;
                }
            }
        });

        // Update email placeholders
        emailInputs.forEach(input => {
            const placeholder = input.dataset[`placeholder${lang.charAt(0).toUpperCase() + lang.slice(1)}`];
            if (placeholder) {
                input.placeholder = placeholder;
            }
        });

        // Update HTML lang attribute
        document.documentElement.lang = lang;
    }
}

/**
 * Form Handling - Show survey after successful submission
 */
function initFormHandling() {
    const forms = document.querySelectorAll('.email-form');

    forms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const button = form.querySelector('button');
            const input = form.querySelector('input[type="email"]');
            const originalText = button.textContent;
            const currentLang = localStorage.getItem('avilingo-lang') || 'en';

            // Loading state
            button.textContent = currentLang === 'ru' ? 'Отправка...' : 'Sending...';
            button.disabled = true;

            // Store email for survey
            currentUserEmail = input.value;

            try {
                // Send to Formspree (backup)
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: new FormData(form),
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    // Send initial notification to Telegram
                    await sendToTelegram({
                        type: 'email_signup',
                        email: currentUserEmail,
                        source: form.querySelector('input[name="source"]')?.value || 'hero'
                    });

                    // Success state
                    button.textContent = currentLang === 'ru' ? 'Готово! ✓' : 'Done! ✓';
                    input.value = '';

                    // Show survey modal
                    setTimeout(() => {
                        showModal('survey-modal');
                        button.textContent = originalText;
                        button.disabled = false;
                    }, 500);
                } else {
                    throw new Error('Form submission failed');
                }
            } catch (error) {
                console.error('Form error:', error);

                // Still show survey even if Formspree fails
                // (Telegram is the primary notification)
                await sendToTelegram({
                    type: 'email_signup',
                    email: currentUserEmail,
                    source: form.querySelector('input[name="source"]')?.value || 'hero'
                });

                showModal('survey-modal');
                button.textContent = originalText;
                button.disabled = false;
            }
        });
    });
}

/**
 * Survey Form Handling
 */
function initSurveyHandling() {
    const surveyForm = document.getElementById('survey-form');
    if (!surveyForm) return;

    surveyForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(surveyForm);
        const surveyData = {
            type: 'survey_response',
            email: currentUserEmail,
            icao_level: formData.get('icao_level'),
            test_timeline: formData.get('test_timeline'),
            budget: formData.get('budget'),
            country: formData.get('country')
        };

        // Send to Telegram
        await sendToTelegram(surveyData);

        // Close survey, show thank you
        hideModal('survey-modal');
        showModal('thankyou-modal');
    });
}

/**
 * Modal Controls
 */
function initModalControls() {
    // Skip survey button
    const skipBtn = document.getElementById('skip-survey');
    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            hideModal('survey-modal');
            showModal('thankyou-modal');
        });
    }

    // Close thank you modal
    const closeBtn = document.getElementById('close-thankyou');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            hideModal('thankyou-modal');
        });
    }

    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal(modal.id);
            }
        });
    });
}

/**
 * Show Modal
 */
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Hide Modal
 */
function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Send Data to Telegram Bot
 */
async function sendToTelegram(data) {
    // Skip if token not configured
    if (CONFIG.TELEGRAM_BOT_TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN') {
        console.log('Telegram not configured. Data:', data);
        return;
    }

    const currentLang = localStorage.getItem('avilingo-lang') || 'en';
    let message = '';

    if (data.type === 'email_signup') {
        message = `🛫 *New AviLingo Signup!*\n\n` +
            `📧 Email: \`${data.email}\`\n` +
            `📍 Source: ${data.source}\n` +
            `🌐 Language: ${currentLang.toUpperCase()}\n` +
            `⏰ Time: ${new Date().toISOString()}`;
    } else if (data.type === 'survey_response') {
        message = `📋 *Survey Response*\n\n` +
            `📧 Email: \`${data.email}\`\n` +
            `✈️ ICAO Level: ${data.icao_level || 'Not provided'}\n` +
            `📅 Next Test: ${data.test_timeline || 'Not provided'}\n` +
            `💰 Budget: ${data.budget || 'Not provided'}\n` +
            `🌍 Country: ${data.country || 'Not provided'}\n` +
            `⏰ Time: ${new Date().toISOString()}`;
    }

    try {
        const response = await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: CONFIG.TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        if (!response.ok) {
            console.error('Telegram API error:', await response.text());
        }
    } catch (error) {
        console.error('Failed to send to Telegram:', error);
    }
}

/**
 * Smooth scroll for anchor links (if needed)
 */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
