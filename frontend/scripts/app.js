const API_BASE_URL = "/api";

const products = [
  {
    id: "blush-conch",
    item_name: "Blush Conch",
    price: 12,
    image: "assets/shells/blush-conch.png",
    tag: "WARM WATER",
    mood: "Bold & romantic",
    story: "A rosy conch with a dramatic curl, found where warm water meets the palest sand. Hold it close and it almost sounds like a tiny summer storm."
  },
  {
    id: "seafoam-whisper",
    item_name: "Seafoam Whisper",
    price: 14,
    image: "assets/shells/seafoam-whisper.png",
    tag: "QUIET FIND",
    mood: "Soft & curious",
    story: "Sea-glass color, gentle ridges, and the calm energy of an empty beach before breakfast. This one is for collectors who notice little things."
  },
  {
    id: "moon-pearl",
    item_name: "Moon Pearl",
    price: 16,
    image: "assets/shells/moon-pearl.png",
    tag: "NIGHT TIDE",
    mood: "Dreamy & luminous",
    story: "A pearly spiral polished by a patient tide. It catches silver light beautifully and has been known to make bedside tables feel slightly magical."
  },
  {
    id: "sunset-spiral",
    item_name: "Sunset Spiral",
    price: 18,
    image: "assets/shells/sunset-spiral.png",
    tag: "GOLDEN HOUR",
    mood: "Sunny & fearless",
    story: "Warm coral tones captured at the very last minute of daylight. A cheerful shell for desks, shelves, and anyone who refuses to be subtle."
  },
  {
    id: "mermaids-secret",
    item_name: "Mermaid's Secret",
    price: 20,
    image: "assets/shells/mermaids-secret.png",
    tag: "RARE CURRENT",
    mood: "Mysterious & wild",
    story: "Deep violet edges and an unusual silhouette make this the shore's best-kept secret. The tide will not tell us exactly where it came from."
  },
  {
    id: "starlight-keeper",
    item_name: "Starlight Keeper",
    price: 22,
    image: "assets/shells/starlight-keeper.png",
    tag: "AFTER DARK",
    mood: "Calm & celestial",
    story: "Pale blue, smooth, and cool like the first star over the water. Keep it somewhere quiet and let it look after your smallest wishes."
  }
];

const productByName = new Map(products.map(product => [product.item_name, product]));
const cart = loadCart();
let activeProduct = null;
let pearlCount = 0;
let toastTimer = null;
let purchasing = false;
let hiddenPearlSlot = -1;
let pearlGameReady = false;
let waveGameRunning = false;
let currentWave = 0;
let waveScore = 0;
let waveTimers = [];

const shellGrid = document.getElementById("shell-grid");
const cartDrawer = document.getElementById("cart-drawer");
const cartList = document.getElementById("cart-list");
const message = document.getElementById("message");
const shellDialog = document.getElementById("shell-dialog");
const toast = document.getElementById("toast");

function loadCart() {
  try {
    const savedCart = JSON.parse(sessionStorage.getItem("yam's-shell-cart"));
    return Array.isArray(savedCart) ? savedCart : [];
  } catch (error) {
    return [];
  }
}

function saveCart() {
  try {
    sessionStorage.setItem("yams-shell-cart", JSON.stringify(cart));
  } catch (error) {
    // The shop still works when browser storage is unavailable.
  }
}

function renderProducts() {
  shellGrid.innerHTML = products.map((product, index) => `
    <article class="shell-card reveal" data-product="${product.id}">
      <div class="shell-photo">
        <img src="${product.image}" alt="${product.item_name}, a realistic shell resting by the sea">
      </div>
      <div class="shell-shade" aria-hidden="true"></div>
      <div class="shell-shine" aria-hidden="true"></div>
      <span class="shell-number">${String(index + 1).padStart(2, "0")}</span>
      <span class="shell-tag">${product.tag}</span>
      <div class="shell-content">
        <div>
          <small>${product.mood}</small>
          <h3>${product.item_name}</h3>
          <p class="shell-price">${product.price} kisses</p>
        </div>
        <div class="shell-actions">
          <button class="shell-story" type="button" data-action="story" data-product="${product.id}" aria-label="Read the story of ${product.item_name}">↗</button>
          <button class="shell-add" type="button" data-action="add" data-product="${product.id}" aria-label="Add ${product.item_name} to the shell bag">+</button>
        </div>
      </div>
    </article>
  `).join("");

  setupCardTilt();
  observeReveals();
}

function setupCardTilt() {
  if (!window.matchMedia("(pointer: fine)").matches) return;

  document.querySelectorAll(".shell-card").forEach(card => {
    card.addEventListener("pointermove", event => {
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      card.style.setProperty("--ry", `${(x - 0.5) * 5}deg`);
      card.style.setProperty("--rx", `${(0.5 - y) * 5}deg`);
      card.style.setProperty("--shine-x", `${x * 100}%`);
      card.style.setProperty("--shine-y", `${y * 100}%`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--ry", "0deg");
      card.style.setProperty("--rx", "0deg");
    });
  });
}

function productFromId(productId) {
  return products.find(product => product.id === productId);
}

function addToCart(product, trigger) {
  const existingItem = cart.find(item => item.item_name === product.item_name);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      item_name: product.item_name,
      price: product.price,
      quantity: 1
    });
  }

  saveCart();
  renderCart();
  animateToBag(product, trigger);
  showToast(`${product.item_name} joined your shell bag.`);
  message.textContent = `${product.item_name} was picked up by the tide.`;

  const card = document.querySelector(`[data-product="${product.id}"].shell-card`);
  if (card) {
    card.classList.remove("just-added");
    void card.offsetWidth;
    card.classList.add("just-added");
  }
}

function animateToBag(product, trigger) {
  const sourceImage = trigger?.closest(".shell-card")?.querySelector("img") || document.getElementById("dialog-image");
  const bag = document.getElementById("floating-bag");
  if (!sourceImage || !bag || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    bumpBag();
    return;
  }

  const source = sourceImage.getBoundingClientRect();
  const target = bag.getBoundingClientRect();
  const flyingShell = document.createElement("img");
  flyingShell.className = "flying-shell";
  flyingShell.src = product.image;
  flyingShell.alt = "";
  flyingShell.style.left = `${source.left + source.width / 2 - 34}px`;
  flyingShell.style.top = `${source.top + source.height / 2 - 34}px`;
  flyingShell.style.width = "68px";
  flyingShell.style.height = "68px";
  document.body.appendChild(flyingShell);

  requestAnimationFrame(() => {
    flyingShell.style.left = `${target.left + target.width / 2 - 9}px`;
    flyingShell.style.top = `${target.top + target.height / 2 - 9}px`;
    flyingShell.style.width = "18px";
    flyingShell.style.height = "18px";
    flyingShell.style.opacity = "0";
    flyingShell.style.transform = "rotate(220deg)";
  });

  window.setTimeout(() => {
    flyingShell.remove();
    bumpBag();
  }, 680);
}

function bumpBag() {
  const bag = document.getElementById("floating-bag");
  bag.classList.remove("bag-bump");
  void bag.offsetWidth;
  bag.classList.add("bag-bump");
}

function renderCart() {
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const isEmpty = cart.length === 0;

  document.getElementById("floating-count").textContent = itemCount;
  document.getElementById("cart-count").textContent = itemCount;
  document.getElementById("floating-total").textContent = `${totalPrice} kisses`;
  document.getElementById("cart-total").textContent = `${totalPrice} kisses`;
  document.getElementById("clear-cart-button").disabled = isEmpty || purchasing;
  document.getElementById("checkout-button").disabled = isEmpty || purchasing;

  if (isEmpty) {
    cartList.innerHTML = `
      <div class="empty-cart">
        <span aria-hidden="true">◌</span>
        <strong>Only sea breeze in here.</strong>
        <p>Pick a shell from the shore and it will appear in your bag.</p>
      </div>
    `;
    return;
  }

  cartList.innerHTML = cart.map((item, index) => {
    const product = productByName.get(item.item_name);
    return `
      <article class="cart-item" data-cart-index="${index}">
        <img class="cart-thumb" src="${product?.image || ""}" alt="">
        <div>
          <h3>${item.item_name}</h3>
          <p>${item.price * item.quantity} kisses</p>
          <div class="cart-quantity" aria-label="Change ${item.item_name} quantity">
            <button type="button" data-cart-action="decrease" aria-label="Remove one">−</button>
            <span>${item.quantity}</span>
            <button type="button" data-cart-action="increase" aria-label="Add one">+</button>
          </div>
        </div>
        <button class="remove-cart-item" type="button" data-cart-action="remove" aria-label="Remove ${item.item_name}">×</button>
      </article>
    `;
  }).join("");
}

function changeCart(index, action) {
  const item = cart[index];
  if (!item || purchasing) return;

  if (action === "increase") item.quantity += 1;
  if (action === "decrease") item.quantity -= 1;
  if (action === "remove" || item.quantity <= 0) cart.splice(index, 1);

  saveCart();
  renderCart();
}

function openCart() {
  document.body.classList.add("drawer-open");
  cartDrawer.setAttribute("aria-hidden", "false");
  document.getElementById("drawer-close").focus();
}

function closeCart() {
  document.body.classList.remove("drawer-open");
  cartDrawer.setAttribute("aria-hidden", "true");
}

function clearCart() {
  if (purchasing) return;
  cart.length = 0;
  saveCart();
  renderCart();
  message.textContent = "Your shell bag is empty again.";
  showToast("The bag is empty. The beach is still full.");
}

async function buyAll() {
  if (cart.length === 0 || purchasing) return;

  const userId = document.getElementById("user-id").value.trim();
  if (!userId) {
    message.textContent = "Tell us who is collecting before buying.";
    showToast("Add your collector name first.");
    return;
  }

  purchasing = true;
  const checkoutButton = document.getElementById("checkout-button");
  checkoutButton.textContent = "SENDING TO THE TIDE...";
  renderCart();

  try {
    const pendingItems = [...cart];

    for (const item of pendingItems) {
      const purchase = {
        user_id: userId,
        item_name: item.item_name,
        price: item.price,
        quantity: item.quantity
      };

      const response = await fetch(`${API_BASE_URL}/buy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(purchase)
      });

      if (!response.ok) throw new Error("Purchase failed");

      const purchasedIndex = cart.findIndex(cartItem => cartItem.item_name === item.item_name);
      if (purchasedIndex !== -1) cart.splice(purchasedIndex, 1);
      saveCart();
    }

    message.textContent = "Everything is on its way to the treasure log.";
    showToast("Purchased. The sea approves.");
  } catch (error) {
    message.textContent = "The tide paused. Unsent shells stayed safely in your bag.";
    showToast("The servers may be sleeping. Your bag is safe.");
  } finally {
    purchasing = false;
    checkoutButton.textContent = "BUY EVERYTHING";
    renderCart();
  }
}

function openStory(product) {
  activeProduct = product;
  document.getElementById("dialog-image").src = product.image;
  document.getElementById("dialog-image").alt = product.item_name;
  document.getElementById("dialog-number").textContent = `TREASURE ${String(products.indexOf(product) + 1).padStart(2, "0")}`;
  document.getElementById("dialog-name").textContent = product.item_name;
  document.getElementById("dialog-story").textContent = product.story;
  document.getElementById("dialog-mood").textContent = product.mood;
  document.getElementById("dialog-price").textContent = `${product.price} kisses`;
  shellDialog.showModal();
}

function closeStory() {
  if (shellDialog.open) shellDialog.close();
}

function chooseFromTide() {
  const product = products[Math.floor(Math.random() * products.length)];
  const card = document.querySelector(`.shell-card[data-product="${product.id}"]`);
  document.getElementById("oracle-answer").textContent = `The tide chose ${product.item_name}.`;

  document.querySelectorAll(".shell-card.tide-chosen").forEach(item => item.classList.remove("tide-chosen"));
  if (card) {
    card.classList.add("tide-chosen");
    focusChosenCard(card);
    window.setTimeout(() => card.classList.remove("tide-chosen"), 1800);
  }
}

function focusChosenCard(card) {
  const galleryIsHorizontal = shellGrid.scrollWidth > shellGrid.clientWidth + 4;

  if (galleryIsHorizontal) {
    const centeredCard = card.offsetLeft - (shellGrid.clientWidth - card.offsetWidth) / 2;
    shellGrid.scrollTo({
      left: Math.max(0, centeredCard),
      behavior: "smooth"
    });
  }

  const bounds = card.getBoundingClientRect();
  const targetTop = window.scrollY + bounds.top - Math.max(24, (window.innerHeight - bounds.height) / 2);
  window.scrollTo({
    top: Math.max(0, targetTop),
    left: 0,
    behavior: "smooth"
  });
}

function showToast(text) {
  window.clearTimeout(toastTimer);
  toast.textContent = text;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2500);
}

async function getPurchases() {
  const status = document.getElementById("history-status");
  const purchasesElement = document.getElementById("purchases");
  status.textContent = "Looking through the treasure log...";

  try {
    const response = await fetch(`${API_BASE_URL}/purchases`);
    if (!response.ok) throw new Error("Could not fetch purchases");

    const purchases = await response.json();
    if (!Array.isArray(purchases)) throw new Error("Unexpected response");

    purchasesElement.replaceChildren();

    purchases.forEach((purchase, index) => {
      const card = document.createElement("article");
      card.className = "purchase-card";

      const label = document.createElement("small");
      label.textContent = `TREASURE ${String(index + 1).padStart(2, "0")}`;

      const name = document.createElement("h3");
      name.textContent = purchase.item_name || "Unnamed shell";

      const meta = document.createElement("div");
      meta.className = "purchase-meta";

      const collector = document.createElement("span");
      collector.textContent = `Collector: ${purchase.user_id ?? "unknown"}`;

      const quantity = document.createElement("span");
      quantity.textContent = `Quantity: ${purchase.quantity ?? 0}`;

      const total = document.createElement("span");
      total.textContent = `Total: ${purchase.total_price ?? 0} kisses`;

      meta.append(collector, quantity, total);
      card.append(label, name, meta);
      purchasesElement.appendChild(card);
    });

    status.textContent = purchases.length
      ? `${purchases.length} treasures are written in the log.`
      : "The treasure log is clean and ready for its first shell.";
  } catch (error) {
    status.textContent = "The log is hiding. Make sure both Python servers are awake.";
  }
}

function findPearl(button) {
  if (button.classList.contains("found")) return;
  button.classList.add("found");
  pearlCount += 1;
  document.getElementById("pearl-count").textContent = `${pearlCount} / 10`;

  if (pearlCount === 10) celebratePearls();
}

function celebratePearls() {
  const celebration = document.createElement("div");
  celebration.className = "pearl-celebration";

  const message = document.createElement("div");
  message.className = "celebration-message";
  message.innerHTML = "<span>💋</span><strong>10 / 10</strong><small>You found every pearl!</small>";
  celebration.appendChild(message);

  const emojis = ["🎉", "✨", "💋", "🫧", "🌊", "🤍", "🐚"];
  for (let index = 0; index < 52; index += 1) {
    const piece = document.createElement("span");
    piece.className = "celebration-piece";
    piece.textContent = emojis[index % emojis.length];
    piece.style.setProperty("--celebration-x", `${Math.round(Math.random() * 110 - 55)}vw`);
    piece.style.setProperty("--celebration-y", `${Math.round(Math.random() * 110 - 55)}vh`);
    piece.style.setProperty("--celebration-rotate", `${Math.round(Math.random() * 720 - 360)}deg`);
    piece.style.setProperty("--celebration-delay", `${(Math.random() * 0.45).toFixed(2)}s`);
    celebration.appendChild(piece);
  }

  document.body.appendChild(celebration);
  window.setTimeout(() => celebration.remove(), 3300);
}

function shufflePearlGame() {
  const board = document.getElementById("shell-game-board");
  const button = document.getElementById("shuffle-button");
  const gameMessage = document.getElementById("game-message");
  const shells = [...document.querySelectorAll(".game-shell")];

  pearlGameReady = false;
  const previewShell = shells[Math.floor(Math.random() * shells.length)];
  hiddenPearlSlot = Number(previewShell.dataset.gameSlot);
  shells.forEach(shell => {
    shell.disabled = true;
    shell.classList.remove("is-preview", "is-revealed", "is-winner", "is-wrong");
  });

  button.disabled = true;
  button.textContent = "Watch the pearl...";
  gameMessage.textContent = "The pearl starts here. Remember this shell.";
  previewShell.classList.add("is-preview");
  board.classList.remove("is-shuffling");

  window.setTimeout(() => {
    previewShell.classList.remove("is-preview");
    gameMessage.textContent = "Now follow it through the shuffle...";
    button.textContent = "Shuffling...";
    void board.offsetWidth;
    board.classList.add("is-shuffling");

    window.setTimeout(() => {
      const shuffledShells = [...shells].sort(() => Math.random() - 0.5);
      shuffledShells.forEach(shell => board.appendChild(shell));
      board.classList.remove("is-shuffling");
      shells.forEach(shell => { shell.disabled = false; });
      pearlGameReady = true;
      button.disabled = false;
      button.textContent = "Shuffle again";
      gameMessage.textContent = "Choose the shell that carried the pearl.";
    }, 1280);
  }, 950);
}

function chooseGameShell(shell) {
  const gameMessage = document.getElementById("game-message");
  const shells = [...document.querySelectorAll(".game-shell")];

  if (!pearlGameReady) {
    gameMessage.textContent = "Shuffle the shells first.";
    return;
  }

  pearlGameReady = false;
  const chosenSlot = Number(shell.dataset.gameSlot);
  const winningShell = document.querySelector(`.game-shell[data-game-slot="${hiddenPearlSlot}"]`);
  shells.forEach(item => { item.disabled = true; });
  winningShell.classList.add("is-revealed", "is-winner");

  if (chosenSlot === hiddenPearlSlot) {
    gameMessage.textContent = "You found it! The sea sends you a kiss. 💋";
    burstMiniKisses();
  } else {
    shell.classList.add("is-wrong");
    gameMessage.textContent = "The pearl was over there. Shuffle and try again!";
  }
}

function burstMiniKisses() {
  const board = document.getElementById("shell-game-board");
  const emojis = ["💋", "✨", "🫧", "🤍"];

  for (let index = 0; index < 22; index += 1) {
    const kiss = document.createElement("span");
    kiss.className = "mini-kiss";
    kiss.textContent = emojis[index % emojis.length];
    kiss.style.setProperty("--kiss-x", `${Math.round(Math.random() * 440 - 220)}px`);
    kiss.style.setProperty("--kiss-y", `${Math.round(Math.random() * 300 - 150)}px`);
    kiss.style.setProperty("--kiss-rotate", `${Math.round(Math.random() * 540 - 270)}deg`);
    kiss.style.animationDelay = `${(Math.random() * 0.2).toFixed(2)}s`;
    board.appendChild(kiss);
    window.setTimeout(() => kiss.remove(), 1500);
  }
}

function startWaveGame() {
  if (waveGameRunning) return;

  waveTimers.forEach(timer => window.clearTimeout(timer));
  waveTimers = [];
  waveGameRunning = true;
  currentWave = 0;
  waveScore = 0;
  document.getElementById("wave-score").textContent = "0";
  document.getElementById("wave-number").textContent = "0 / 3";

  const startButton = document.getElementById("start-wave-game");
  startButton.disabled = true;
  startButton.textContent = "The tide is coming...";
  hideWaveResult();
  runWave(1);
}

function runWave(waveNumber) {
  const arena = document.getElementById("wave-arena");
  const waveFront = document.getElementById("wave-front");
  const duration = [0, 5600, 5000, 4400][waveNumber];
  const shellCount = [0, 6, 8, 10][waveNumber];

  currentWave = waveNumber;
  document.getElementById("wave-number").textContent = `${waveNumber} / 3`;
  arena.querySelectorAll(".catch-shell").forEach(shell => shell.remove());
  waveFront.classList.remove("is-moving");
  waveFront.style.setProperty("--wave-duration", `${duration}ms`);
  void waveFront.offsetWidth;

  const positions = createWavePositions().slice(0, shellCount);
  positions.forEach((position, index) => {
    const product = products[(index + waveNumber * 2) % products.length];
    const shell = document.createElement("button");
    shell.className = "catch-shell";
    shell.type = "button";
    shell.setAttribute("aria-label", `Catch ${product.item_name}`);
    shell.style.left = `${position.x}%`;
    shell.style.top = `${position.y}%`;
    shell.style.animationDelay = `${index * 0.04}s, ${0.35 + index * 0.04}s`;

    const image = document.createElement("img");
    image.src = product.image;
    image.alt = "";
    shell.appendChild(image);
    arena.appendChild(shell);

    shell.addEventListener("click", () => catchWaveShell(shell));

    const reachProgress = 0.18 + ((88 - position.y) / 44) * 0.62;
    const washTimer = window.setTimeout(() => washWaveShell(shell), duration * reachProgress);
    waveTimers.push(washTimer);
  });

  window.setTimeout(() => waveFront.classList.add("is-moving"), 80);

  const finishTimer = window.setTimeout(() => {
    arena.querySelectorAll(".catch-shell:not(.is-caught)").forEach(shell => washWaveShell(shell));

    if (waveNumber < 3) {
      showWaveResult("🌊", `Wave ${waveNumber} cleared the shore.`, `Get ready for wave ${waveNumber + 1}.`);
      const nextTimer = window.setTimeout(() => {
        hideWaveResult();
        runWave(waveNumber + 1);
      }, 1050);
      waveTimers.push(nextTimer);
    } else {
      finishWaveGame();
    }
  }, duration + 180);

  waveTimers.push(finishTimer);
}

function createWavePositions() {
  const positions = [];
  const columns = [12, 37, 62, 87];
  const rows = [48, 67, 84];

  rows.forEach(y => {
    columns.forEach(x => {
      positions.push({
        x: x + Math.round(Math.random() * 6 - 3),
        y: y + Math.round(Math.random() * 4 - 2)
      });
    });
  });

  for (let index = positions.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [positions[index], positions[swapIndex]] = [positions[swapIndex], positions[index]];
  }

  return positions;
}

function catchWaveShell(shell) {
  if (!waveGameRunning || shell.disabled) return;
  shell.disabled = true;
  shell.classList.add("is-caught");
  waveScore += 1;
  document.getElementById("wave-score").textContent = waveScore;
}

function washWaveShell(shell) {
  if (!shell || shell.disabled) return;
  shell.disabled = true;
  shell.classList.add("is-washed");
}

function showWaveResult(icon, title, subtitle) {
  const result = document.getElementById("wave-result");
  result.querySelector("span").textContent = icon;
  result.querySelector("strong").textContent = title;
  result.querySelector("small").textContent = subtitle;
  result.classList.remove("is-hidden");
}

function hideWaveResult() {
  document.getElementById("wave-result").classList.add("is-hidden");
}

function finishWaveGame() {
  waveGameRunning = false;
  document.getElementById("wave-front").classList.remove("is-moving");
  showWaveResult("💋", `You caught ${waveScore} shells!`, "Three waves survived. The beach is impressed.");

  const startButton = document.getElementById("start-wave-game");
  startButton.disabled = false;
  startButton.textContent = "Play three more waves";
  burstWaveEmojis();
}

function burstWaveEmojis() {
  const arena = document.getElementById("wave-arena");
  const emojis = ["🐚", "💋", "✨", "🫧"];

  for (let index = 0; index < 28; index += 1) {
    const piece = document.createElement("span");
    piece.className = "mini-kiss";
    piece.textContent = emojis[index % emojis.length];
    piece.style.setProperty("--kiss-x", `${Math.round(Math.random() * 700 - 350)}px`);
    piece.style.setProperty("--kiss-y", `${Math.round(Math.random() * 420 - 210)}px`);
    piece.style.setProperty("--kiss-rotate", `${Math.round(Math.random() * 600 - 300)}deg`);
    piece.style.animationDelay = `${(Math.random() * 0.3).toFixed(2)}s`;
    arena.appendChild(piece);
    window.setTimeout(() => piece.remove(), 1700);
  }
}

function observeReveals() {
  const revealItems = document.querySelectorAll(".reveal:not(.is-observed)");
  if (!("IntersectionObserver" in window)) {
    revealItems.forEach(item => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  revealItems.forEach(item => {
    item.classList.add("is-observed");
    observer.observe(item);
  });
}

shellGrid.addEventListener("click", event => {
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  const product = productFromId(actionButton.dataset.product);
  if (!product) return;

  if (actionButton.dataset.action === "add") addToCart(product, actionButton);
  if (actionButton.dataset.action === "story") openStory(product);
});

cartList.addEventListener("click", event => {
  const actionButton = event.target.closest("[data-cart-action]");
  if (!actionButton) return;
  const item = actionButton.closest("[data-cart-index]");
  changeCart(Number(item.dataset.cartIndex), actionButton.dataset.cartAction);
});

document.getElementById("floating-bag").addEventListener("click", openCart);
document.getElementById("drawer-close").addEventListener("click", closeCart);
document.getElementById("drawer-scrim").addEventListener("click", closeCart);
document.getElementById("clear-cart-button").addEventListener("click", clearCart);
document.getElementById("checkout-button").addEventListener("click", buyAll);
document.getElementById("history-button").addEventListener("click", getPurchases);
document.getElementById("tide-pick").addEventListener("click", chooseFromTide);
document.getElementById("shuffle-button").addEventListener("click", shufflePearlGame);
document.getElementById("start-wave-game").addEventListener("click", startWaveGame);

document.querySelectorAll(".game-shell").forEach(shell => {
  shell.addEventListener("click", () => chooseGameShell(shell));
});

document.getElementById("dialog-close").addEventListener("click", closeStory);
document.getElementById("dialog-add").addEventListener("click", event => {
  if (activeProduct) addToCart(activeProduct, event.currentTarget);
  closeStory();
});

shellDialog.addEventListener("click", event => {
  if (event.target === shellDialog) closeStory();
});

document.querySelectorAll(".hidden-pearl").forEach(button => {
  button.addEventListener("click", () => findPearl(button));
});

document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  closeCart();
});

renderProducts();
renderCart();
observeReveals();
