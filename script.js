// ═══════════════════════════════════════════
//   IKCO STORE — script.js (نسخه اصلاح‌شده)
// ═══════════════════════════════════════════

// ── داده‌های محصولات (یکپارچه با HTML) ──
const products = [
  { id: 1,  name: "پژو پارس سال",      price: 1850000000, discountPrice: 1572500000, emoji: "🚗", cat: "sedan",    discount: 15, badge: "hot",      badgeText: "🔥 پرفروش",    img: "images/pars.jpg" },
  { id: 2,  name: "پژو ۲۰۷ اتوماتیک", price: 1850000000, discountPrice: 1850000000, emoji: "🚙", cat: "sedan",    discount: 0,  badge: "new",      badgeText: "✨ جدید",       img: "images/207.jpg" },
  { id: 3,  name: "دنا پلاس توربو",    price: 2100000000, discountPrice: 1890000000, emoji: "🚐", cat: "suv",      discount: 10, badge: "sale",     badgeText: "۱۰٪ تخفیف",    img: "images/denaplusturbo.webp" },
  { id: 4,  name: "پژو ۴۰۵ SLX",       price: 1400000000, discountPrice: 1302000000, emoji: "🏎️", cat: "sedan",    discount: 7,  badge: "hot",      badgeText: "🔥 محدود",      img: "images/405slx.jpg" },
  { id: 5,  name: "رانا پلاس",          price: 1550000000, discountPrice: 1472500000, emoji: "🚕", cat: "hatch",   discount: 5,  badge: "new",      badgeText: "✨ مدل ۱۴۰۴",   img: "images/ranaplus.jpg" },
  { id: 6,  name: "تارا الکتریک",       price: 2300000000, discountPrice: 1978000000, emoji: "⚡", cat: "electric", discount: 14, badge: "pre",      badgeText: "پیش‌فروش",     img: "images/taraelectric.webp" },
];

const TON_RATE = 298500;

// ── وضعیت برنامه ──
let cart = [];
let currentUser = null;
let notifTimer = null;
let cartCount = 0;

// ═══════════════════════════════════════════
//   LOADER
// ═══════════════════════════════════════════
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
  }, 2000);
});

// ═══════════════════════════════════════════
//   TICKER
// ═══════════════════════════════════════════
const tickerMessages = [
  '☀️ جشنواره تابستانی: تخفیف تا ۱۵٪ روی تمام خودروها',
  '💎 اکنون می‌توانید با TON Coin خرید کنید',
  '🚗 تارا الکتریک: پیش‌فروش آغاز شد',
  '📋 سامان ۲۰۰۰ توربو: ثبت‌نام پیش‌فروش باز است',
  '🎁 ارسال رایگان به تمام نقاط ایران',
  '🛡️ گارانتی ۳ ساله برای تمام محصولات',
  '💳 اقساط ۶۰ ماهه با سود رقابتی',
];

function initTicker() {
  const ticker = document.getElementById('tickerInner');
  if (!ticker) return;
  const allMsgs = [...tickerMessages, ...tickerMessages];
  ticker.innerHTML = allMsgs.map(m =>
    `<span class="ticker-item">${m} <span class="ticker-sep">●</span></span>`
  ).join('');
}

// ═══════════════════════════════════════════
//   CURSOR GLOW
// ═══════════════════════════════════════════
document.addEventListener('mousemove', e => {
  const g = document.getElementById('cursorGlow');
  if (!g) return;
  g.style.left = e.clientX + 'px';
  g.style.top = e.clientY + 'px';
});

// ═══════════════════════════════════════════
//   SCROLL REVEAL
// ═══════════════════════════════════════════
function initReveal() {
  const reveals = document.querySelectorAll('.reveal');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  reveals.forEach(r => obs.observe(r));
}

// ═══════════════════════════════════════════
//   NOTIFICATION (یکپارچه — فقط یک تابع)
// ═══════════════════════════════════════════
function showNotif(text, icon = '✅') {
  const n = document.getElementById('notification');
  if (!n) return;
  document.getElementById('notifText').textContent = text;
  document.getElementById('notifIcon').textContent = icon;
  n.classList.add('show');
  clearTimeout(notifTimer);
  notifTimer = setTimeout(() => n.classList.remove('show'), 3000);
}

// showToast از showNotif استفاده میکنه (یکپارچه)
function showToast(msg, icon = 'ℹ️') {
  showNotif(msg, icon);
}

// ═══════════════════════════════════════════
//   MODAL — مودال خرید (modal-overlay)
// ═══════════════════════════════════════════
function openPurchaseModal(name, emoji, price) {
  document.getElementById('modalName').textContent = name;
  document.getElementById('modalEmoji').textContent = emoji;
  document.getElementById('modalPrice').textContent = price + ' تومان';
  document.getElementById('modal').classList.add('open');
}

function closePurchaseModal() {
  document.getElementById('modal').classList.remove('open');
}

// کلیک خارج از مودال
const modalOverlay = document.getElementById('modal');
if (modalOverlay) {
  modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) closePurchaseModal();
  });
}

// ── مودال Auth/Cart (modal با display flex) ──
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'flex';
}
function closeModal(id) {
  // اگر id نداشت، مودال خرید رو ببند
  if (!id) { closePurchaseModal(); return; }
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}
window.openModal = openModal;
window.closeModal = closeModal;

// ── انتخاب روش پرداخت ──
function selectPayment(el) {
  document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
  el.classList.add('selected');
}

function confirmPurchase() {
  closePurchaseModal();
  showNotif('در حال انتقال به درگاه پرداخت...', '💳');
}

// ═══════════════════════════════════════════
//   PRODUCTS FILTER
// ═══════════════════════════════════════════
function filterProducts(btn, cat) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.product-card').forEach(card => {
    if (cat === 'all' || card.dataset.cat === cat) {
      card.style.display = '';
      card.style.animation = 'fadeInUp 0.4s ease both';
    } else {
      card.style.display = 'none';
    }
  });
}

// ═══════════════════════════════════════════
//   CART — سبد خرید
// ═══════════════════════════════════════════
function addToCartById(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.discountPrice, quantity: 1 });
  }
  updateCartBadge();
  showNotif(`${product.name} به سبد خرید اضافه شد`, '🛒');
  saveCartToLocal();
}

function updateCartBadge() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.getElementById('cartBadge');
  if (badge) badge.textContent = totalItems;
}

function renderCartModal() {
  const container = document.getElementById('cartItemsList');
  if (!container) return;
  if (cart.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:#888">سبد خرید شما خالی است 🛒</div>';
    document.getElementById('cartTotalAmount').innerHTML = 'جمع کل: ۰ تومان';
    return;
  }
  let html = '';
  let total = 0;
  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    html += `<div class="cart-item">
      <div><strong>${item.name}</strong><br><small>${item.price.toLocaleString()} تومان</small></div>
      <div style="display:flex;align-items:center;gap:8px;">
        <button onclick="changeQuantity(${item.id}, -1)" style="width:28px;height:28px;border-radius:50%;border:1px solid #ccc;cursor:pointer;background:#f5f5f5">-</button>
        <span>${item.quantity}</span>
        <button onclick="changeQuantity(${item.id}, 1)" style="width:28px;height:28px;border-radius:50%;border:1px solid #ccc;cursor:pointer;background:#f5f5f5">+</button>
        <button onclick="removeFromCart(${item.id})" style="background:#e31e24;color:white;border:none;border-radius:20px;padding:4px 10px;cursor:pointer;font-size:0.8rem">حذف</button>
      </div>
      <div style="font-weight:700">${itemTotal.toLocaleString()} تومان</div>
    </div>`;
  });
  container.innerHTML = html;
  document.getElementById('cartTotalAmount').innerHTML = `جمع کل: <strong>${total.toLocaleString()}</strong> تومان`;
}

function changeQuantity(id, delta) {
  const idx = cart.findIndex(i => i.id === id);
  if (idx !== -1) {
    const newQty = cart[idx].quantity + delta;
    if (newQty <= 0) {
      cart.splice(idx, 1);
    } else {
      cart[idx].quantity = newQty;
    }
    updateCartBadge();
    renderCartModal();
    saveCartToLocal();
  }
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  updateCartBadge();
  renderCartModal();
  saveCartToLocal();
}

function saveCartToLocal() {
  localStorage.setItem('ik_cart', JSON.stringify(cart));
}

function loadCart() {
  const saved = localStorage.getItem('ik_cart');
  if (saved) {
    try { cart = JSON.parse(saved); updateCartBadge(); } catch (e) {}
  }
}

function checkout() {
  if (cart.length === 0) { showNotif('سبد خرید خالی است!', '⚠️'); return; }
  if (!currentUser) {
    showNotif('لطفاً ابتدا وارد حساب خود شوید', '👤');
    closeModal('cartModal');
    openModal('authModal');
    return;
  }
  const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
  showNotif(`سفارش ثبت شد — مبلغ: ${total.toLocaleString()} تومان`, '✅');
  cart = [];
  updateCartBadge();
  closeModal('cartModal');
  saveCartToLocal();
}

// ── دکمه سبد خرید هدر ──
const cartIconBtn = document.getElementById('cartIconBtn');
if (cartIconBtn) {
  cartIconBtn.addEventListener('click', () => { renderCartModal(); openModal('cartModal'); });
}
// دکمه 🛒 در هدر (btn-cart)
const btnCart = document.querySelector('.btn-cart');
if (btnCart) {
  btnCart.onclick = () => { renderCartModal(); openModal('cartModal'); };
}

// ═══════════════════════════════════════════
//   AUTH — ورود / ثبت‌نام
// ═══════════════════════════════════════════
function handleLogin() {
  const phone = document.getElementById('loginPhone').value.trim();
  const pass = document.getElementById('loginPass').value.trim();
  if (!phone || !pass) { showNotif('لطفاً شماره و رمز را وارد کنید', '⚠️'); return; }
  const users = JSON.parse(localStorage.getItem('ik_users') || '[]');
  const user = users.find(u => u.phone === phone && u.password === pass);
  if (user) {
    currentUser = user;
    localStorage.setItem('ik_currentUser', JSON.stringify(currentUser));
    showNotif(`خوش آمدید ${user.name} 👋`, '✅');
    closeModal('authModal');
    updateAuthButton();
  } else {
    showNotif('اطلاعات ورود نادرست است', '❌');
  }
}

function handleRegister() {
  const name = document.getElementById('regName').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const pass = document.getElementById('regPass').value.trim();
  if (!name || !phone || !pass) { showNotif('لطفاً تمام فیلدها را پر کنید', '⚠️'); return; }
  if (!/^09\d{9}$/.test(phone)) { showNotif('شماره موبایل معتبر نیست', '❌'); return; }
  if (pass.length < 6) { showNotif('رمز عبور باید حداقل ۶ کاراکتر باشد', '❌'); return; }
  let users = JSON.parse(localStorage.getItem('ik_users') || '[]');
  if (users.find(u => u.phone === phone)) { showNotif('این شماره قبلاً ثبت‌نام کرده', '⚠️'); return; }
  const newUser = { name, phone, password: pass };
  users.push(newUser);
  localStorage.setItem('ik_users', JSON.stringify(users));
  currentUser = newUser;
  localStorage.setItem('ik_currentUser', JSON.stringify(currentUser));
  showNotif(`ثبت‌نام موفق! خوش آمدید ${name} 🎉`, '✅');
  closeModal('authModal');
  updateAuthButton();
}

function updateAuthButton() {
  const btn = document.querySelector('.btn-login');
  if (!btn) return;
  if (currentUser) {
    btn.textContent = `👤 ${currentUser.name}`;
    btn.onclick = () => {
      if (confirm(`${currentUser.name} عزیز، آیا می‌خواهید خارج شوید؟`)) logout();
    };
  } else {
    btn.textContent = 'ورود / ثبت‌نام';
    btn.onclick = () => openModal('authModal');
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem('ik_currentUser');
  updateAuthButton();
  showNotif('با موفقیت خارج شدید', '👋');
}

function loadSession() {
  const savedUser = localStorage.getItem('ik_currentUser');
  if (savedUser) {
    try { currentUser = JSON.parse(savedUser); updateAuthButton(); } catch (e) {}
  }
}

// ── Tabs ورود/ثبت‌نام ──
const loginTab = document.getElementById('loginTabBtn');
const registerTab = document.getElementById('registerTabBtn');
if (loginTab && registerTab) {
  loginTab.addEventListener('click', () => {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
  });
  registerTab.addEventListener('click', () => {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
  });
}

// ── دکمه ورود هدر ──
const btnLogin = document.querySelector('.btn-login');
if (btnLogin) {
  btnLogin.addEventListener('click', () => {
    if (!currentUser) openModal('authModal');
  });
}

// ═══════════════════════════════════════════
//   TON CALCULATOR
// ═══════════════════════════════════════════
function calcTon(val) {
  const num = parseFloat(val.replace(/,/g, '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
  if (isNaN(num) || num <= 0) {
    document.getElementById('tonOutput').value = '';
    return;
  }
  const ton = (num / TON_RATE).toFixed(2);
  document.getElementById('tonOutput').value = ton + ' TON';
}

// ── نرخ TON متحرک ──
let rateBase = TON_RATE;
setInterval(() => {
  rateBase += Math.floor(Math.random() * 100 - 50);
  const el = document.getElementById('tonRate');
  if (el) el.textContent = `۱ TON = ${rateBase.toLocaleString('fa-IR')} تومان`;
}, 3000);

// ═══════════════════════════════════════════
//   TIMER — تایمر جشنواره تابستانی
// ═══════════════════════════════════════════
function initFestivalTimer() {
  let h = 5, m = 34, s = 0;
  setInterval(() => {
    s--;
    if (s < 0) { s = 59; m--; }
    if (m < 0) { m = 59; h--; }
    if (h < 0) { h = 23; }
    const t1h = document.getElementById('t1h');
    const t1m = document.getElementById('t1m');
    if (t1h) t1h.textContent = String(h).padStart(2, '0');
    if (t1m) t1m.textContent = String(m).padStart(2, '0');
  }, 1000);
}

// ── تایمر Hero ──
function updateHeroTimer() {
  const endTime = new Date().getTime() + (12 * 24 * 3600 * 1000) + (5 * 3600 * 1000) + (33 * 60 * 1000);
  const interval = setInterval(() => {
    const diff = endTime - new Date().getTime();
    if (diff < 0) {
      clearInterval(interval);
      ['days','hours','minutes'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = '0';
      });
      return;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const dEl = document.getElementById('days');
    const hEl = document.getElementById('hours');
    const mEl = document.getElementById('minutes');
    if (dEl) dEl.innerText = days;
    if (hEl) hEl.innerText = hours;
    if (mEl) mEl.innerText = minutes;
  }, 1000);
}

// ═══════════════════════════════════════════
//   دکمه‌های خرید فوری روی کارت‌های HTML
// ═══════════════════════════════════════════
function initBuyButtons() {
  // هر دکمه btn-buy که data-id داره
  document.querySelectorAll('.btn-buy[data-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const p = products.find(x => x.id === id);
      if (p) openPurchaseModal(p.name, p.emoji, p.discountPrice.toLocaleString());
    });
  });

  // دکمه‌های ℹ جزئیات
  document.querySelectorAll('.btn-detail[data-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const p = products.find(x => x.id === id);
      if (p) showNotif(`جزئیات ${p.name} بارگذاری شد`, 'ℹ️');
    });
  });
}

// ═══════════════════════════════════════════
//   INIT — اجرا در هنگام لود صفحه
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initTicker();
  initReveal();
  initFestivalTimer();
  updateHeroTimer();
  loadCart();
  loadSession();
  initBuyButtons();
});
