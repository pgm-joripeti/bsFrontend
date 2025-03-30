// scripts/utilities/spectrumTracking.js
export function initSpectrumTracking() {
    const tLogo = document.querySelector('.logo--spectrum-link--teacher');
    const tTag = document.querySelector('.promoTag--spectrum-link--teacher');
    const sLogo = document.querySelector('.logo--spectrum-link--student');
    const sTag = document.querySelector('.promoTag--spectrum-link--student');
  
    if (tLogo) {
      tLogo.addEventListener('click', () => {
        gtag('event', 'click', {
          event_category: 'Outbound',
          event_label: 'Spectrum Logo in Footer (Teacher)',
          transport_type: 'beacon'
        });
      });
    }
  
    if (tTag) {
      tTag.addEventListener('click', () => {
        gtag('event', 'click', {
          event_category: 'Outbound',
          event_label: 'Spectrum PromoTag in Footer (Teacher)',
          transport_type: 'beacon'
        });
      });
    }
  
    if (sLogo) {
      sLogo.addEventListener('click', () => {
        gtag('event', 'click', {
          event_category: 'Outbound',
          event_label: 'Spectrum Logo in Footer (Student)',
          transport_type: 'beacon'
        });
      });
    }
  
    if (sTag) {
      sTag.addEventListener('click', () => {
        gtag('event', 'click', {
          event_category: 'Outbound',
          event_label: 'Spectrum PromoTag in Footer (Student)',
          transport_type: 'beacon'
        });
      });
    }
  }
  