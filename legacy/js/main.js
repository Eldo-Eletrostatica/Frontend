/* ==========================================================================
   Eldo Pintura Eletrostática — comportamento da página
   Monta os links do WhatsApp a partir da configuração abaixo.
   ========================================================================== */

// Ajuste aqui os dados de contato — muda em um lugar só.
const CONFIG = {
  whatsapp: '5561995140000',
  message: 'Olá! Quero um orçamento de pintura eletrostática.',
  ctaLabel: 'Pedir orçamento agora',
};

/**
 * Monta a URL de conversa do WhatsApp (wa.me) com a mensagem pré-preenchida.
 */
function buildWhatsAppHref({ whatsapp, message }) {
  const digits = String(whatsapp).replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

document.addEventListener('DOMContentLoaded', () => {
  const href = buildWhatsAppHref(CONFIG);

  // Todo link marcado com data-wa aponta para o WhatsApp.
  document.querySelectorAll('[data-wa]').forEach((el) => {
    el.href = href;
    el.target = '_blank';
    el.rel = 'noopener';
  });

  // Onde houver data-wa-label, usa o rótulo configurável (mantém o ícone).
  document.querySelectorAll('[data-wa-label]').forEach((el) => {
    const textNode = [...el.childNodes].find(
      (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim()
    );
    if (textNode) textNode.textContent = ` ${CONFIG.ctaLabel}`;
  });
});
