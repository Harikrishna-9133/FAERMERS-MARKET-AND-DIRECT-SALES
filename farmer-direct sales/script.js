/* script.js - unified app logic for users, products, cart, payments */

/* storage helpers */
const DB = {
  usersKey: "fm_users_v1",
  productsKey: "fm_products_v1",
  cartKey: "fm_cart_v1",
  ordersKey: "fm_orders_v1",

  loadUsers() { try { return JSON.parse(localStorage.getItem(this.usersKey) || "[]"); } catch { return []; } },
  saveUsers(u){ localStorage.setItem(this.usersKey, JSON.stringify(u)); },

  loadProducts(){ try { return JSON.parse(localStorage.getItem(this.productsKey) || "[]"); } catch { return []; } },
  saveProducts(p){ localStorage.setItem(this.productsKey, JSON.stringify(p)); },

  loadCart(){ try { return JSON.parse(localStorage.getItem(this.cartKey) || "[]"); } catch { return []; } },
  saveCart(c){ localStorage.setItem(this.cartKey, JSON.stringify(c)); },

  loadOrders(){ try { return JSON.parse(localStorage.getItem(this.ordersKey) || "[]"); } catch { return []; } },
  saveOrders(o){ localStorage.setItem(this.ordersKey, JSON.stringify(o)); }
};

/* session helpers (simple) */
const Session = {
  key: "fm_session",
  set(user){ localStorage.setItem(this.key, JSON.stringify(user)); },
  get(){ try { return JSON.parse(localStorage.getItem(this.key) || "null"); } catch { return null; } },
  clear(){ localStorage.removeItem(this.key); }
};

/* small utils */
function uid(prefix="id"){ return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function money(v){ return Number(v).toFixed(2); }

/* NAV update */
function updateNavUI(){
  const session = Session.get();
  document.querySelectorAll(".nav-login").forEach(el=> el.style.display = session ? "none" : "");
  document.querySelectorAll(".nav-register").forEach(el=> el.style.display = session ? "none" : "");
  document.querySelectorAll(".nav-dashboard").forEach(el=> el.style.display = session ? "" : "none");
  document.querySelectorAll(".nav-logout").forEach(el=> el.style.display = session ? "" : "none");
  document.querySelectorAll(".nav-user").forEach(el=> el.textContent = session ? `${session.name} (${session.role})` : "");
}

/* ---------- PAGE INITIALIZERS ---------- */
document.addEventListener("DOMContentLoaded", ()=> {
  updateNavUI();
  // Home small grid
  if(document.getElementById("homeGrid")) renderHomeGrid();

  // products page
  if(document.getElementById("productList")) renderProductsPage();

  // login page (tabs)
  if(document.getElementById("loginTabs")) initLoginPage();

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

  // farmer form
  const farmerForm = document.getElementById("farmerForm");
  farmerForm.addEventListener("submit", (e)=> {
    e.preventDefault();
    const data = {
      id: uid("user"),
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
    const users = DB.loadUsers();
    if(users.some(u => u.mobile === data.mobile && u.role === "farmer")){ alert("Farmer with this mobile already registered"); return; }
    users.push(data); DB.saveUsers(users);
    Session.set({ id: data.id, name: data.name, role: data.role, mobile: data.mobile });
    updateNavUI();
    window.location.href = "dashboard.html";
  });

  // farmer login (existing)
  const farmerLoginForm = document.getElementById("farmerLoginForm");
  farmerLoginForm.addEventListener("submit", (e)=> {
    e.preventDefault();
    const mobile = farmerLoginForm.loginMobile.value.trim();
    const password = farmerLoginForm.loginPassword.value;
    const users = DB.loadUsers();
    const u = users.find(x => x.mobile === mobile && x.password === password && x.role === "farmer");
    if(!u){ alert("Invalid credentials"); return; }
    Session.set({ id: u.id, name: u.name, role: u.role, mobile: u.mobile });
    updateNavUI();
    window.location.href = "dashboard.html";
  });

  // customer form
  const customerForm = document.getElementById("customerForm");
  customerForm.addEventListener("submit", (e)=> {
    e.preventDefault();
    const data = {
      id: uid("user"),
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
    const users = DB.loadUsers();
    if(users.some(u => u.mobile === data.mobile && u.role === "customer")){ alert("Customer with this mobile already registered"); return; }
    users.push(data); DB.saveUsers(users);
    Session.set({ id: data.id, name: data.name, role: data.role, mobile: data.mobile });
    updateNavUI();
    window.location.href = "products.html";
  });

  // customer login
  const customerLoginForm = document.getElementById("customerLoginForm");
  customerLoginForm.addEventListener("submit", (e)=> {
    e.preventDefault();
    const mobile = customerLoginForm.cLoginMobile.value.trim();
    const password = customerLoginForm.cLoginPassword.value;
    const users = DB.loadUsers();
    const u = users.find(x => x.mobile === mobile && x.password === password && x.role === "customer");
    if(!u){ alert("Invalid credentials"); return; }
    Session.set({ id: u.id, name: u.name, role: u.role, mobile: u.mobile });
    updateNavUI();
    window.location.href = "products.html";
  });
}

/* ---------- DASHBOARD (farmer add/edit/delete) ---------- */
function initDashboardPage(){
  const session = Session.get();
  if(!session){ alert("Please login as farmer"); window.location.href = "login.html"; return; }
  document.getElementById("dashboardWelcome").textContent = `Welcome, ${session.name} (${session.role})`;

  // if logged in as customer, we still show "customer area" (just link to products)
  if(session.role === "farmer"){
    document.getElementById("farmerArea").style.display = "";
    document.getElementById("customerArea").style.display = "none";
    document.getElementById("addProductForm").addEventListener("submit", onAddProduct);
    renderFarmerProducts();
  } else {
    document.getElementById("farmerArea").style.display = "none";
    document.getElementById("customerArea").style.display = "";
  }
}

/* Farmer add product */
function onAddProduct(e){
  e.preventDefault();
  const name = document.getElementById("pname").value.trim();
  const type = document.getElementById("ptype").value.trim();
  const price = parseFloat(document.getElementById("pprice").value);
  const qty = parseFloat(document.getElementById("pqty").value);
  const unit = document.getElementById("punit").value;
  if(!name || isNaN(price) || isNaN(qty)){ alert("Please fill product fields correctly"); return; }
  const session = Session.get();
  const products = DB.loadProducts();
  const newP = { id: uid("prod"), name, type, price, quantity: qty, unit, farmerId: session.id, farmerName: session.name, createdAt:new Date().toISOString() };
  products.push(newP); DB.saveProducts(products);
  e.target.reset();
  renderFarmerProducts();
  refreshProductsWhereNeeded();
}

/* render farmer's products */
function renderFarmerProducts(){
  const session = Session.get();
  const all = DB.loadProducts();
  const mine = all.filter(p => p.farmerId === session.id);
  const div = document.getElementById("farmerProducts");
  if(!div) return;
  if(mine.length === 0) { div.innerHTML = "<p class='muted'>No products yet. Add one above.</p>"; return; }
  div.innerHTML = mine.map(p => `
    <div class="farmer-card">
      <h4>${p.name}</h4>
      <p class="muted">${p.type || ""} — ₹${money(p.price)} / ${p.unit}</p>
      <p>Available: <strong>${p.quantity} ${p.unit}</strong></p>
      <div style="margin-top:8px" class="actions">
        <button class="btn edit" onclick="startEditProduct('${p.id}')">Edit</button>
        <button class="btn delete" onclick="deleteProduct('${p.id}')">Delete</button>
      </div>
    </div>
  `).join("");
}

/* edit flow */
function startEditProduct(id){
  const products = DB.loadProducts();
  const p = products.find(x=> x.id === id);
  if(!p) return alert("Product not found");
  document.getElementById("pname").value = p.name;
  document.getElementById("ptype").value = p.type || "";
  document.getElementById("pprice").value = p.price;
  document.getElementById("pqty").value = p.quantity;
  document.getElementById("punit").value = p.unit;
  document.getElementById("editingId").value = p.id;
  document.getElementById("addBtn").textContent = "Save Changes";
  const form = document.getElementById("addProductForm");
  form.removeEventListener("submit", onAddProduct);
  form.addEventListener("submit", onSaveEdit);
}

function onSaveEdit(e){
  e.preventDefault();
  const id = document.getElementById("editingId").value;
  const products = DB.loadProducts();
  const idx = products.findIndex(p=> p.id === id);
  if(idx === -1) return alert("Product not found");
  products[idx].name = document.getElementById("pname").value.trim();
  products[idx].type = document.getElementById("ptype").value.trim();
  products[idx].price = parseFloat(document.getElementById("pprice").value);
  products[idx].quantity = parseFloat(document.getElementById("pqty").value);
  products[idx].unit = document.getElementById("punit").value;
  DB.saveProducts(products);
  // reset form
  document.getElementById("addProductForm").reset();
  document.getElementById("editingId").value = "";
  document.getElementById("addBtn").textContent = "Add Product";
  const form = document.getElementById("addProductForm");
  form.removeEventListener("submit", onSaveEdit);
  form.addEventListener("submit", onAddProduct);
  renderFarmerProducts();
  refreshProductsWhereNeeded();
}

/* delete product */
function deleteProduct(id){
  if(!confirm("Delete this product?")) return;
  let products = DB.loadProducts();
  products = products.filter(p => p.id !== id);
  DB.saveProducts(products);
  renderFarmerProducts();
  refreshProductsWhereNeeded();
}

/* ---------- PRODUCTS PAGE (customer) ---------- */
function renderProductsPage(){
  const products = DB.loadProducts();
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
        <input id="qty_${p.id}" type="number" min="1" max="${p.quantity}" placeholder="Qty" style="width:90px;" />
        <button class="btn cart" onclick="addToCart('${p.id}')">Add to Cart</button>
      </div>
    </div>
  `).join("");
}

/* small home grid */
function renderHomeGrid(){
  const products = DB.loadProducts();
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
  let products = DB.loadProducts();
  const p = products.find(x => x.id === productId);
  if(!p) return alert("Product not found");
  if(qty > p.quantity) return alert(`Only ${p.quantity} ${p.unit} available`);
  let cart = DB.loadCart();
  // if same product already in cart, increase qty
  const existing = cart.find(c => c.productId === productId);
  if(existing){
    existing.qty += qty;
  } else {
    cart.push({ id: uid("cart"), productId, name: p.name, price: p.price, qty, unit: p.unit, farmerName: p.farmerName });
  }
  DB.saveCart(cart);
  alert(`${p.name} added to cart`);
  // optionally redirect to cart - leave to user
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
  const prod = DB.loadProducts().find(p => p.id === cart[idx].productId);
  if(cart[idx].qty > prod.quantity){ cart[idx].qty = prod.quantity; alert("Reached max available quantity"); }
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
function submitPayment(){
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
  // reduce quantities from inventory
  const products = DB.loadProducts();
  for(const item of cart){
    const prod = products.find(p => p.id === item.productId);
    if(prod) {
      prod.quantity = Number(prod.quantity) - Number(item.qty);
      if(prod.quantity < 0) prod.quantity = 0;
    }
  }
  DB.saveProducts(products);
  // create order record
  const orders = DB.loadOrders();
  const session = Session.get();
  const order = {
    id: uid("order"),
    userId: session ? session.id : null,
    userName: session ? session.name : "Guest",
    items: cart,
    total,
    paymentMethod: method,
    placedAt: new Date().toISOString(),
    status: "Placed"
  };
  orders.unshift(order);
  DB.saveOrders(orders);
  // clear cart
  DB.saveCart([]);
  // refresh pages
  renderCartPage();
  refreshProductsWhereNeeded();
  alert("Payment successful — order placed! Thank you.");
  window.location.href = "index.html";
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
window.startEditProduct = startEditProduct;
window.deleteProduct = deleteProduct;
window.onAddProduct = onAddProduct;
