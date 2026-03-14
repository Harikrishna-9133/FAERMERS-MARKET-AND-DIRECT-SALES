/* script.js - unified app logic for users, products, cart, payments */

/* storage helpers (only used for cart now) */
const DB = {
  cartKey: "fm_cart_v1",
  loadCart(){ try { return JSON.parse(localStorage.getItem(this.cartKey) || "[]"); } catch { return []; } },
  saveCart(c){ localStorage.setItem(this.cartKey, JSON.stringify(c)); }
};

/* simple API wrapper */
const API = {
  // If the page is opened via file:// or origin is missing, fall back to localhost backend
  base: (location && location.origin && location.origin.startsWith('http')) ? location.origin : 'http://localhost:5000',
  async request(path, options = {}) {
    const url = path.startsWith("http") ? path : `${this.base}${path}`;
    const headers = options.headers || {};
    const session = Session.get();
    if (session && session.token) {
      headers["Authorization"] = "Bearer " + session.token;
    }
    if (options.body && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(options.body);
    }
    console.log(`[API] ${options.method || 'GET'} ${path}`, options.body ? JSON.parse(options.body) : '');
    const res = await fetch(url, { ...options, headers });
    // attempt to parse JSON only if there is a body
    let data;
    const text = await res.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.warn('API: response not valid JSON', text);
        data = text;
      }
    } else {
      data = null;
    }
    console.log(`[API Response] ${res.status}`, data);
    if (!res.ok) {
      const msg = data && data.message ? data.message : res.statusText;
      throw new Error(msg);
    }
    return data;
  }
};

/* session helpers (store token + user)**/
const Session = {
  key: "fm_session",
  set(data){ localStorage.setItem(this.key, JSON.stringify(data)); },
  get(){ try { return JSON.parse(localStorage.getItem(this.key) || "null"); } catch { return null; } },
  clear(){ localStorage.removeItem(this.key); }
};

// cache for products pulled from API
let productsCache = [];

// convenience wrapper
async function loadProductsForFarmer(){
  await fetchProducts();
  await renderFarmerProducts();
}


/* small utils */
function uid(prefix="id"){ return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function money(v){ return Number(v).toFixed(2); }

// global logout helper
function logout(){
  Session.clear();
  window.location.href = 'login.html';
}
window.logout = logout;

/* NAV update */
function updateNavUI(){
  const session = Session.get();
  const loggedIn = session && session.user;
  document.querySelectorAll(".nav-login").forEach(el=> el.style.display = loggedIn ? "none" : "");
  document.querySelectorAll(".nav-register").forEach(el=> el.style.display = loggedIn ? "none" : "");
  document.querySelectorAll(".nav-dashboard").forEach(el=> el.style.display = loggedIn ? "" : "none");
  document.querySelectorAll(".nav-logout").forEach(el=> el.style.display = loggedIn ? "" : "none");
  document.querySelectorAll(".nav-user").forEach(el=> el.textContent = loggedIn ? `${session.user.name} (${session.user.role})` : "");
}

/* ---------- PAGE INITIALIZERS ---------- */
// fetch all products from backend and cache
async function fetchProducts(){
  try{
    productsCache = await API.request("/api/products");
  } catch(err){ console.error("Failed to fetch products:", err); }
  return productsCache;
}

document.addEventListener("DOMContentLoaded", async ()=> {
  updateNavUI();
  await fetchProducts();

  // Home small grid
  if(document.getElementById("homeGrid")) renderHomeGrid();

  // products page
  if(document.getElementById("productList")) await renderProductsPage();

  // login page (tabs)
  if(document.getElementById("loginTabs")) initLoginPage();
  // legacy signup/login forms (email/mobile) without tabs
  const signupForm = document.getElementById('signupForm');
  if(signupForm){
    signupForm.addEventListener('submit', async e=>{
      e.preventDefault();
      const data = {
        name: signupForm.signupName.value.trim(),
        email: signupForm.signupEmail ? signupForm.signupEmail.value.trim() : '',
        mobile: signupForm.signupMobile ? signupForm.signupMobile.value.trim() : undefined,
        password: signupForm.signupPassword.value,
        role: signupForm.signupRole ? signupForm.signupRole.value : 'customer'
      };
      if(!data.email || !data.password || !data.name){
        alert('Please fill name, email and password');
        return;
      }
      try{
        const user = await API.request('/api/users/register',{method:'POST',body:data});
        // login after register
        const loginResp = await API.request('/api/users/login',{method:'POST',body:{
          email: data.email,
          mobile: data.mobile,
          password: data.password
        }});
        Session.set({token:loginResp.token, user});
        updateNavUI();
        // redirect based on role
        window.location.href = user.role === 'farmer' ? 'dashboard.html' : 'products.html';
      } catch(err){ alert(err.message); }
    });
  }
  const loginForm = document.getElementById('loginForm');
  if(loginForm){
    loginForm.addEventListener('submit', async e=>{
      e.preventDefault();
      const email = loginForm.loginEmail ? loginForm.loginEmail.value.trim() : '';
      const mobile = loginForm.loginMobile ? loginForm.loginMobile.value.trim() : '';
      const password = loginForm.loginPassword.value;
      if((!email && !mobile) || !password){ alert('Please enter email/mobile and password'); return; }
      try{
        const loginResp = await API.request('/api/users/login',{method:'POST',body:{email, mobile, password}});
        // decode token to get user info
        const payload = JSON.parse(atob(loginResp.token.split('.')[1]));
        const user = {id: payload.id, name: payload.name, role: payload.role, mobile: payload.mobile, email: payload.email};
        Session.set({token:loginResp.token, user});
        updateNavUI();
        window.location.href = user.role === 'farmer' ? 'dashboard.html' : 'products.html';
      } catch(err){ alert(err.message); }
    });
  }

  // dashboard page (farmer)
  if(document.getElementById("dashboardWelcome")) initDashboardPage();

  // cart page
  if(document.getElementById("cartItems")) renderCartPage();

  // contact form (simple)
  if(document.getElementById("contactForm")) {
    document.getElementById("contactForm").addEventListener("submit", (e)=>{ e.preventDefault(); alert("Message sent. We'll contact you soon."); e.target.reset(); });
  }
});

/* ---------- AUTH (register & login unified) ---------- */
function initLoginPage(){
  // tab buttons
  const tabFarmerBtn = document.getElementById("tabFarmer");
  const tabCustomerBtn = document.getElementById("tabCustomer");
  const farmerTab = document.getElementById("farmerTab");
  const customerTab = document.getElementById("customerTab");

  function activate(tab){
    if(tab === "farmer"){
      farmerTab.style.display = ""; customerTab.style.display = "none";
      tabFarmerBtn.classList.add("active"); tabCustomerBtn.classList.remove("active");
    } else {
      farmerTab.style.display = "none"; customerTab.style.display = "";
      tabCustomerBtn.classList.add("active"); tabFarmerBtn.classList.remove("active");
    }
  }
  // default farmer
  activate("farmer");

  tabFarmerBtn.addEventListener("click", ()=> activate("farmer"));
  tabCustomerBtn.addEventListener("click", ()=> activate("customer"));

  // helper to persist login data
  function saveSession(token, user){
    Session.set({ token, user });
    updateNavUI();
  }

  // farmer register
  const farmerForm = document.getElementById("farmerForm");
  farmerForm.addEventListener("submit", async (e)=> {
    e.preventDefault();
    const data = {
      role: "farmer",
      name: farmerForm.fname.value.trim(),
      farmName: farmerForm.farmName.value.trim(),
      area: farmerForm.area.value.trim(),
      district: farmerForm.district.value.trim(),
      state: farmerForm.state.value.trim(),
      pincode: farmerForm.pincode.value.trim(),
      mobile: farmerForm.mobile.value.trim(),
      password: farmerForm.password.value
    };
    if(!data.name || !data.mobile || !data.password){ alert("Please fill name, mobile and password"); return; }
    try{
      const user = await API.request("/api/users/register", { method: "POST", body: data });
      const loginResp = await API.request("/api/users/login", { method: "POST", body: { mobile: data.mobile, password: data.password } });
      saveSession(loginResp.token, user);
      window.location.href = "dashboard.html";
    } catch(err){ alert(err.message); }
  });

  // farmer login (existing)
  const farmerLoginForm = document.getElementById("farmerLoginForm");
  farmerLoginForm.addEventListener("submit", async (e)=> {
    e.preventDefault();
    const mobile = farmerLoginForm.loginMobile.value.trim();
    const password = farmerLoginForm.loginPassword.value;
    try{
      const loginResp = await API.request("/api/users/login", { method: "POST", body: { mobile, password } });
      // fetch user profile from token payload
      const payload = JSON.parse(atob(loginResp.token.split(".")[1]));
      saveSession(loginResp.token, { id: payload.id, name: payload.name, role: payload.role, mobile: payload.mobile });
      // clear form fields so previous user details aren't left visible
      farmerLoginForm.reset();
      window.location.href = "dashboard.html";
    } catch(err){ alert(err.message); }
  });

  // customer register
  const customerForm = document.getElementById("customerForm");
  customerForm.addEventListener("submit", async (e)=> {
    e.preventDefault();
    const data = {
      role: "customer",
      name: customerForm.cname.value.trim(),
      area: customerForm.carea.value.trim(),
      district: customerForm.cdistrict.value.trim(),
      state: customerForm.cstate.value.trim(),
      pincode: customerForm.cpincode.value.trim(),
      address: customerForm.caddress.value.trim(),
      mobile: customerForm.cmobile.value.trim(),
      password: customerForm.cpassword.value
    };
    if(!data.name || !data.mobile || !data.password){ alert("Please fill name, mobile and password"); return; }
    try{
      const user = await API.request("/api/users/register", { method: "POST", body: data });
      const loginResp = await API.request("/api/users/login", { method: "POST", body: { mobile: data.mobile, password: data.password } });
      saveSession(loginResp.token, user);
      window.location.href = "products.html";
    } catch(err){ alert(err.message); }
  });

  // customer login
  const customerLoginForm = document.getElementById("customerLoginForm");
  customerLoginForm.addEventListener("submit", async (e)=> {
    e.preventDefault();
    const mobile = customerLoginForm.cLoginMobile.value.trim();
    const password = customerLoginForm.cLoginPassword.value;
    try{
      console.log('[LOGIN] Attempting customer login with mobile:', mobile);
      const loginResp = await API.request("/api/users/login", { method: "POST", body: { mobile, password } });
      console.log('[LOGIN] Success, token received');
      const payload = JSON.parse(atob(loginResp.token.split(".")[1]));
      console.log('[LOGIN] Token payload:', payload);
      saveSession(loginResp.token, { id: payload.id, name: payload.name, role: payload.role, mobile: payload.mobile });
      // clear input so details aren't persistently visible
      customerLoginForm.reset();
      window.location.href = "products.html";
    } catch(err){ alert("Login error: " + err.message); console.error('LOGIN ERROR:', err); }
  });
}

/* ---------- DASHBOARD (farmer add/edit/delete) ---------- */
async function initDashboardPage(){
  const session = Session.get();
  if(!session || !session.user){ alert("Please login as farmer"); window.location.href = "login.html"; return; }
  document.getElementById("dashboardWelcome").textContent = `Welcome, ${session.user.name} (${session.user.role})`;

  if(session.user.role === "farmer"){
    document.getElementById("farmerArea").style.display = "";
    document.getElementById("customerArea").style.display = "none";
    document.getElementById("addProductForm").addEventListener("submit", onAddProduct);
    await loadProductsForFarmer();
  } else {
    document.getElementById("farmerArea").style.display = "none";
    document.getElementById("customerArea").style.display = "";
  }
}

/* Farmer add product */
async function onAddProduct(e){
  e.preventDefault();
  const name = document.getElementById("pname").value.trim();
  const type = document.getElementById("ptype").value.trim();
  const price = parseFloat(document.getElementById("pprice").value);
  const qty = parseFloat(document.getElementById("pqty").value);
  const unit = document.getElementById("punit").value;
  if(!name || isNaN(price) || isNaN(qty)){ alert("Please fill product fields correctly"); return; }
  try{
    console.log('[ADD PRODUCT] Sending:', { name, type, price, quantity: qty, unit });
    const prod = await API.request("/api/products", { method: "POST", body: { name, type, price, quantity: qty, unit } });
    console.log('[ADD PRODUCT] Successfully saved:', prod);
    productsCache.push(prod);
    e.target.reset();
    await renderFarmerProducts();
    refreshProductsWhereNeeded();
    alert(`✓ Product "${name}" added successfully! ID: ${prod._id}`);
  } catch(err){ 
    console.error('[ADD PRODUCT ERROR]:', err);
    alert("Error adding product: " + err.message); 
  }
}

/* render farmer's products */
async function renderFarmerProducts(){
  const session = Session.get();
  if(!session || !session.user) return;
  const all = productsCache;
  const mine = all.filter(p => p.farmer === session.user.id);
  const div = document.getElementById("farmerProducts");
  if(!div) return;
  if(mine.length === 0) { div.innerHTML = "<p class='muted'>No products yet. Add one above.</p>"; return; }
  div.innerHTML = mine.map(p => `
    <div class="farmer-card">
      <h4>${p.name}</h4>
      <p class="muted">${p.type || ""} — ₹${money(p.price)} / ${p.unit}</p>
      <p>Available: <strong>${p.quantity} ${p.unit}</strong></p>
      <div style="margin-top:8px" class="actions">
        <button class="btn edit" onclick="startEditProduct('${p._id || p.id}')">Edit</button>
        <button class="btn delete" onclick="deleteProduct('${p._id || p.id}')">Delete</button>
      </div>
    </div>
  `).join("");
}

/* edit flow */
function startEditProduct(id){
  const p = productsCache.find(x => (x._id || x.id) === id);
  if(!p) return alert("Product not found");
  document.getElementById("pname").value = p.name;
  document.getElementById("ptype").value = p.type || "";
  document.getElementById("pprice").value = p.price;
  document.getElementById("pqty").value = p.quantity;
  document.getElementById("punit").value = p.unit;
  document.getElementById("editingId").value = id;
  document.getElementById("addBtn").textContent = "Save Changes";
  const form = document.getElementById("addProductForm");
  form.removeEventListener("submit", onAddProduct);
  form.addEventListener("submit", onSaveEdit);
}

async function onSaveEdit(e){
  e.preventDefault();
  const id = document.getElementById("editingId").value;
  try{
    const body = {
      name: document.getElementById("pname").value.trim(),
      type: document.getElementById("ptype").value.trim(),
      price: parseFloat(document.getElementById("pprice").value),
      quantity: parseFloat(document.getElementById("pqty").value),
      unit: document.getElementById("punit").value
    };
    const updated = await API.request(`/api/products/${id}`, { method: "PUT", body });
    // update cache
    productsCache = productsCache.map(p => (p._id === id || p.id === id) ? updated : p);
    // reset form
    document.getElementById("addProductForm").reset();
    document.getElementById("editingId").value = "";
    document.getElementById("addBtn").textContent = "Add Product";
    const form = document.getElementById("addProductForm");
    form.removeEventListener("submit", onSaveEdit);
    form.addEventListener("submit", onAddProduct);
    await renderFarmerProducts();
    refreshProductsWhereNeeded();
  } catch(err){ alert(err.message); }
}

/* delete product */
async function deleteProduct(id){
  if(!confirm("Delete this product?")) return;
  try{
    await API.request(`/api/products/${id}`, { method: "DELETE" });
    productsCache = productsCache.filter(p => (p._id || p.id) !== id);
    await renderFarmerProducts();
    refreshProductsWhereNeeded();
  } catch(err){ alert(err.message); }
}

/* ---------- PRODUCTS PAGE (customer) ---------- */
async function renderProductsPage(){
  if(productsCache.length === 0) await fetchProducts();
  const products = productsCache;
  const wrap = document.getElementById("productList");
  if(!wrap) return;
  if(products.length === 0){ wrap.innerHTML = "<p class='muted'>No products available yet.</p>"; return; }
  wrap.innerHTML = products.map(p=> `
    <div class="card">
      <h3>${p.name}</h3>
      <p class="muted">${p.type || ""} • Farmer: ${p.farmerName}</p>
      <p>Price: ₹${money(p.price)} / ${p.unit}</p>
      <p>Available: ${p.quantity} ${p.unit}</p>
      <div class="row" style="margin-top:8px;">
        <input id="qty_${p._id || p.id}" type="number" min="1" max="${p.quantity}" placeholder="Qty" style="width:90px;" />
        <button class="btn cart" onclick="addToCart('${p._id || p.id}')">Add to Cart</button>
      </div>
    </div>
  `).join("");
}

/* small home grid */
function renderHomeGrid(){
  const products = productsCache;
  const wrap = document.getElementById("homeGrid");
  if(!wrap) return;
  if(products.length === 0) { wrap.innerHTML = "<p class='muted'>No products yet</p>"; return; }
  wrap.innerHTML = products.slice(0,6).map(p => `
    <div class="card">
      <h3>${p.name}</h3>
      <p class="muted">${p.type || ""} • ${p.farmerName}</p>
      <p>₹${money(p.price)} • ${p.quantity} ${p.unit}</p>
    </div>
  `).join("");
}

/* ---------- CART ---------- */
function addToCart(productId){
  const qtyEl = document.getElementById(`qty_${productId}`);
  const qty = qtyEl && Number(qtyEl.value) || 1;
  if(qty <= 0) return alert("Quantity must be at least 1");
  const p = productsCache.find(x => (x._id || x.id) === productId);
  if(!p) return alert("Product not found");
  if(qty > p.quantity) return alert(`Only ${p.quantity} ${p.unit} available`);
  let cart = DB.loadCart();
  // if same product already in cart, increase qty
  const existing = cart.find(c => c.productId === productId);
  if(existing){
    existing.qty += qty;
  } else {
    cart.push({ id: uid("cart"), productId, name: p.name, price: p.price, qty, unit: p.unit, farmerName: p.farmerName, farmerId: p.farmer });
  }
  DB.saveCart(cart);
  alert(`${p.name} added to cart`);
}

/* render cart page */
function renderCartPage(){
  let cart = DB.loadCart();
  const wrap = document.getElementById("cartItems");
  const totalElem = document.getElementById("cartTotal");
  if(!wrap || !totalElem) return;
  if(cart.length === 0){ wrap.innerHTML = "<p class='muted'>Your cart is empty.</p>"; totalElem.textContent = "Total: ₹0.00"; return; }
  let total = 0;
  wrap.innerHTML = cart.map((c, idx) => {
    const subtotal = c.qty * c.price;
    total += subtotal;
    return `
      <div class="cart-item">
        <div>
          <strong>${c.name}</strong>
          <div class="muted">Farmer: ${c.farmerName} • ${c.qty} ${c.unit} × ₹${money(c.price)}</div>
        </div>
        <div style="text-align:right;">
          <div>₹${money(subtotal)}</div>
          <div style="margin-top:8px;">
            <button class="btn ghost" onclick="changeCartQty('${c.id}', -1)">-</button>
            <span style="padding:0 8px">${c.qty}</span>
            <button class="btn ghost" onclick="changeCartQty('${c.id}', +1)">+</button>
            <button class="btn delete" onclick="removeCartItem('${c.id}')" style="margin-left:8px">Remove</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
  totalElem.textContent = `Total: ₹${money(total)}`;
}

/* change qty */
function changeCartQty(cartId, delta){
  let cart = DB.loadCart();
  const idx = cart.findIndex(c => c.id === cartId);
  if(idx === -1) return;
  cart[idx].qty = Math.max(1, cart[idx].qty + delta);
  // check stock
  const prod = productsCache.find(p => (p._id || p.id) === cart[idx].productId);
  if(prod && cart[idx].qty > prod.quantity){ cart[idx].qty = prod.quantity; alert("Reached max available quantity"); }
  DB.saveCart(cart);
  renderCartPage();
}

/* remove item */
function removeCartItem(cartId){
  let cart = DB.loadCart();
  cart = cart.filter(c => c.id !== cartId);
  DB.saveCart(cart);
  renderCartPage();
}

/* ---------- PAYMENT (form-based) ---------- */
function showPaymentForm(){
  const payWrap = document.getElementById("paymentArea");
  if(!payWrap) return;
  // create form
  payWrap.innerHTML = `
    <h3>Choose payment & enter details</h3>
    <div class="payment-options">
      <label><input type="radio" name="paymethod" value="UPI" checked> UPI (GooglePay / PhonePe)</label>
      <label><input type="radio" name="paymethod" value="Card"> Card (enter details)</label>
      <label><input type="radio" name="paymethod" value="COD"> Cash on Delivery</label>
    </div>

    <div id="payDetails" style="margin-top:8px"></div>
    <div style="text-align:right; margin-top:10px;">
      <button class="btn" onclick="submitPayment()">Pay & Place Order</button>
    </div>
  `;
  // init change listener
  payWrap.querySelectorAll("input[name='paymethod']").forEach(r => r.addEventListener("change", renderPayDetails));
  renderPayDetails();
}

function renderPayDetails(){
  const sel = document.querySelector("input[name='paymethod']:checked").value;
  const details = document.getElementById("payDetails");
  if(sel === "UPI"){
    details.innerHTML = `<input class="input" id="upiId" placeholder="Enter UPI ID (eg: name@upi)">`;
  } else if(sel === "Card"){
    details.innerHTML = `<input class="input" id="cardNumber" placeholder="Card Number"><input class="input" id="cardName" placeholder="Name on Card"><input class="input" id="cardExp" placeholder="MM/YY"><input class="input" id="cardCvv" placeholder="CVV">`;
  } else {
    details.innerHTML = `<p class="muted">You will pay on delivery. Please ensure your delivery address is correct.</p>`;
  }
}

/* finalize payment and create order */
async function submitPayment(){
  const cart = DB.loadCart();
  if(cart.length === 0) return alert("Cart empty");
  // compute total
  let total = 0;
  for(const c of cart) total += c.qty * c.price;
  // basic validation for card / upi if required
  const method = document.querySelector("input[name='paymethod']:checked").value;
  if(method === "UPI"){
    const upi = document.getElementById("upiId").value.trim();
    if(!upi) return alert("Enter UPI ID");
  } else if(method === "Card"){
    const num = document.getElementById("cardNumber").value.trim();
    const name = document.getElementById("cardName").value.trim();
    const exp = document.getElementById("cardExp").value.trim();
    const cvv = document.getElementById("cardCvv").value.trim();
    if(!num || !name || !exp || !cvv) return alert("Complete card details");
  }
  // send order to server
  try{
    const items = cart.map(c => ({ productId: c.productId, name: c.name, quantity: c.qty, price: c.price, farmerId: c.farmerId }));
    await API.request("/api/orders", { method: "POST", body: { items, totalPrice: total } });
    // refresh products cache (stock updated by server)
    await fetchProducts();
    // clear cart
    DB.saveCart([]);
    renderCartPage();
    refreshProductsWhereNeeded();
    alert("Payment successful — order placed! Thank you.");
    window.location.href = "index.html";
  } catch(err){ alert(err.message); }
}

/* ---------- small utilities & helpers ---------- */
function refreshProductsWhereNeeded(){
  if(document.getElementById("productList")) renderProductsPage();
  if(document.getElementById("homeGrid")) renderHomeGrid();
  if(document.getElementById("farmerProducts")) renderFarmerProducts();
}

function logout(){
  Session.clear();
  updateNavUI();
  window.location.href = "index.html";
}

/* expose global functions used by inline handlers */
window.addToCart = addToCart;
window.renderCartPage = renderCartPage;
window.removeCartItem = removeCartItem;
window.changeCartQty = changeCartQty;
window.showPaymentForm = showPaymentForm;
window.submitPayment = submitPayment;
window.logout = logout;
window.logoutUser = logout; // alias used on login page
window.startEditProduct = startEditProduct;
window.deleteProduct = deleteProduct;
window.onAddProduct = onAddProduct;
