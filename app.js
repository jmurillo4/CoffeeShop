
// Array of your customer image filenames
const customerPool = [
    { name: "Paul", file: "images/customers/Customer1.png" },
    { name: "Rick", file: "images/customers/Customer2.png" },
    { name: "Rainbow Dash", file: "images/customers/Customer3.png" },
    { name: "Goku", file: "images/customers/Customer4.png" }
];

let gameData = {
    day: 1,
    cash: 100.00,
    inventory: { beans: 15, milk: 15, cups: 15 },
    costs: { beans: 0.50, milk: 0.30, cups: 0.10 },
    prices: { coffee: 4.00 }
};

// State variables tracking the active 60-second shifts
let shiftTimer = null;
let secondsRemaining = 0;
let dailyStats = { customersAttracted: 0, actualSales: 0, revenue: 0 };

function updateUI() {
    document.getElementById('day-display').innerText = gameData.day;
    document.getElementById('cash-display').innerText = gameData.cash.toFixed(2);
    document.getElementById('beans-display').innerText = gameData.inventory.beans;
    document.getElementById('milk-display').innerText = gameData.inventory.milk;
    document.getElementById('cups-display').innerText = gameData.inventory.cups;

    checkStockAlert('item-beans', gameData.inventory.beans);
    checkStockAlert('item-milk', gameData.inventory.milk);
    checkStockAlert('item-cups', gameData.inventory.cups);
}

function checkStockAlert(elementId, stockValue) {
    let element = document.getElementById(elementId);
    if (!element) return;
    if (stockValue === 0) {
        element.className = "shelf-item critical";
    } else if (stockValue <= 5) {
        element.className = "shelf-item warning";
    } else {
        element.className = "shelf-item";
    }
}

function buyItem(item, quantity) {
    // Prevent restocking mid-shift to avoid messy inputs
    if (shiftTimer !== null) {
        document.getElementById('speech-bubble').innerText = "I'm too busy serving customers to restock right now!";
        return;
    }
    
    let totalCost = gameData.costs[item] * quantity;
    if (gameData.cash >= totalCost) {
        gameData.cash -= totalCost;
        gameData.inventory[item] += quantity;
        updateUI();
    } else {
        document.getElementById('speech-bubble').innerText = "I don't have enough money for that supply order!";
    }
}

// --- REAL-TIME SHIFT CORE ENGINE ---

function startShift() {
    if (shiftTimer !== null) return; // Prevent clicking multiple times during an active shift

    // 1. Setup Shift Variables
    gameData.prices.coffee = parseFloat(document.getElementById('coffee-price-input').value) || 4.00;
    secondsRemaining = 40; 
    dailyStats = { customersAttracted: 0, actualSales: 0, revenue: 0 };
    
    // Disable inputs & buttons during the active shift
    document.getElementById('start-day-btn').disabled = true;
    document.getElementById('start-day-btn').innerText = "🕒 SHIFT IN PROGRESS...";
    document.getElementById('results-log').classList.add('hidden');

    // 2. Start the Master Clock (Runs every 1 second)
    shiftTimer = setInterval(() => {
        secondsRemaining--;
        
        // Update the display to show the ticking timer countdown
        document.getElementById('speech-bubble').innerText = `⏱️ Shift Ends in: ${secondsRemaining}s`;

        // 3. Roll a random chance for a customer to walk up (e.g., 25% chance every second)
        if (secondsRemaining > 0 && Math.random() < 0.25) {
            triggerCustomerVisit();
        }

        // 4. End Shift Conditions
        if (secondsRemaining <= 0) {
            endShift();
        }
    }, 1000);
}

function triggerCustomerVisit() {
    dailyStats.customersAttracted++;
    
    // 1. Pick a random customer profile from your folder pool
    let randomCustomer = customerPool[Math.floor(Math.random() * customerPool.length)];
    
    // 2. Target the sprite image layer and push the new PNG path into it
    let sprite = document.getElementById('customer-sprite');
    sprite.src = randomCustomer.file;
    sprite.classList.remove('hidden'); // Reveal the customer

    const marketPrice = 4.00;
    let priceRatio = gameData.prices.coffee / marketPrice;
    let buyChance = priceRatio <= 1.0 ? (0.95 - (priceRatio * 0.15)) : (0.80 / Math.pow(priceRatio, 3));

    if (Math.random() < buyChance) {
        if (gameData.inventory.beans > 0 && gameData.inventory.milk > 0 && gameData.inventory.cups > 0) {
            gameData.inventory.beans--;
            gameData.inventory.milk--;
            gameData.inventory.cups--;
            gameData.cash += gameData.prices.coffee;
            dailyStats.actualSales++;
            dailyStats.revenue += gameData.prices.coffee;
            
            document.getElementById('speech-bubble').innerText = `"${randomCustomer.name} says: Thanks! $${gameData.prices.coffee.toFixed(2)} is a fair deal."`;
            updateUI();
        } else {
            document.getElementById('speech-bubble').innerText = `"${randomCustomer.name} says: What do you mean you're out of ingredients?!"`;
        }
    } else {
        document.getElementById('speech-bubble').innerText = `"${randomCustomer.name} says: $${gameData.prices.coffee.toFixed(2)}? No way, that's too expensive."`;
    }

    // Clear customer from station window when they leave after 2 seconds
    setTimeout(() => {
        if (secondsRemaining > 0) {
            sprite.classList.add('hidden'); // Fade customer out
        }
    }, 2000);
}

function endShift() {
    clearInterval(shiftTimer);
    shiftTimer = null;

    // Reset layout interactive components
    document.getElementById('start-day-btn').disabled = false;
    document.getElementById('start-day-btn').innerText = "BREW & OPEN SHOP";
    document.getElementById('customer-visual').innerText = "💤";
    document.getElementById('speech-bubble').innerText = "The day is done! Check the CRT screen monitor for logs.";
    document.getElementById('customer-sprite').classList.add('hidden');

    // Output dynamic results logging inside terminal display box
    let resultsBox = document.getElementById('results-log');
    resultsBox.classList.remove('hidden');
    document.getElementById('results-content').innerHTML = `
        <p>📋 SHIFT COMPLETE REPORT</p>
        <p>-------------------------</p>
        <p>• TOTAL TRAFFIC:  ${dailyStats.customersAttracted} people</p>
        <p>• TOTAL COFFEES SOLD:  ${dailyStats.actualSales} cups</p>
        <p>• SHIFT REVENUE:  +$${dailyStats.revenue.toFixed(2)}</p>
        <p>• NET BALANCES:   $${gameData.cash.toFixed(2)}</p>
    `;

    gameData.day++;
    updateUI();
}

function toggleTheme() {
    let bodyElement = document.body;
    let themeBtn = document.getElementById('theme-toggle-btn');
    
    // Toggle the .pink-theme class on the <body> tag
    bodyElement.classList.toggle('pink-theme');
    
    // Dynamically switch the button text so players know what click action happens next
    if (bodyElement.classList.contains('pink-theme')) {
        themeBtn.innerText = "🪵 Back to Wood Theme";
        themeBtn.style.background = "#4e342e";
        themeBtn.style.color = "#fff";
    } else {
        themeBtn.innerText = "✨ Make It Pink";
        themeBtn.style.background = "#f8bbd0";
        themeBtn.style.color = "#880e4f";
    }
}

// Phone Control Tracking Variables
const CORRECT_PIN = "0228"; 
let enteredPin = "";

function openPhone() {
    // Reveal the hidden overlay container window
    document.getElementById('phone-modal').classList.remove('hidden-modal');
    clearPin(); // Always fresh wipe input entries when opening phone
    
    // Default show PIN entry pad screen first
    document.getElementById('phone-pin-screen').classList.remove('hidden-element');
    document.getElementById('phone-content-screen').classList.add('hidden-element');
}

function closePhone() {
    document.getElementById('phone-modal').classList.add('hidden-modal');
}

function pressPinKey(num) {
    if (enteredPin.length >= 4) return; // Cap maximum character space inputs
    
    enteredPin += num;
    updatePinDots();
    
    // Auto-verify once code length requirement reaches exactly 4 numbers
    if (enteredPin.length === 4) {
        verifyPin();
    }
}

function updatePinDots() {
    for (let i = 0; i < 4; i++) {
        let dot = document.getElementById(`dot-${i}`);
        if (i < enteredPin.length) {
            dot.classList.add('filled');
        } else {
            dot.classList.remove('filled');
        }
    }
}

function clearPin() {
    enteredPin = "";
    updatePinDots();
}

function verifyPin() {
    if (enteredPin === CORRECT_PIN) {
        // Success: Transition between internal visual frames
        document.getElementById('phone-pin-screen').classList.add('hidden-element');
        document.getElementById('phone-content-screen').classList.remove('hidden-element');
    } else {
        // Fail: flash dots crimson color indication warning before clear action reset
        alert("🚨 INCORRECT DEVICE PASSPHRASE 🚨");
        clearPin();
    }
}

// Connect Event Actions on Document Mounting
document.getElementById('start-day-btn').addEventListener('click', startShift);
updateUI();