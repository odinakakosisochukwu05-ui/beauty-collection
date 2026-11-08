const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const closeSidebar = document.getElementById("closeSidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

// OPEN SIDEBAR
if (menuToggle && sidebar && sidebarOverlay) {
    menuToggle.addEventListener("click", () => {
        sidebar.classList.add("active");
        sidebarOverlay.classList.add("active");
    });
}

// CLOSE SIDEBAR
function closeMenu() {
    if (sidebar) {
        sidebar.classList.remove("active");
    }

    if (sidebarOverlay) {
        sidebarOverlay.classList.remove("active");
    }
}

if (closeSidebar) {
    closeSidebar.addEventListener("click", closeMenu);
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", closeMenu);
}

// CLOSE WHEN A LINK IS CLICKED
document.querySelectorAll(".sidebar a").forEach(link => {
    link.addEventListener("click", closeMenu);
});

// CLOSE WITH ESCAPE KEY
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeMenu();
    }
});

// HERO IMAGE SLIDESHOW

// ==============================
// HERO IMAGE SLIDESHOW
// ==============================

const heroSlides = document.querySelectorAll(".hero-slide");
const heroIndicators = document.querySelectorAll(".indicator");

let currentSlide = 0;

function showHeroSlide(index) {

    heroSlides.forEach(slide => {
        slide.classList.remove("active");
    });

    heroIndicators.forEach(indicator => {
        indicator.classList.remove("active");
    });

    heroSlides[index].classList.add("active");

    if (heroIndicators[index]) {
        heroIndicators[index].classList.add("active");
    }
}

function nextHeroSlide() {

    currentSlide = (currentSlide + 1) % heroSlides.length;

    showHeroSlide(currentSlide);
}

// Automatically change images every 6 seconds
if (heroSlides.length > 1) {
    setInterval(nextHeroSlide, 5000);
}

// ==============================
// BEAUTY COLLECTIONS CART SYSTEM
// ==============================

// Get the cart from localStorage
let cart = JSON.parse(localStorage.getItem("beautyCart")) || [];

// Get cart counter
const cartCount = document.querySelector(".cart-count");

// Update cart counter
function updateCartCount() {
    if (cartCount) {
        const totalItems = cart.reduce((total, item) => {
            return total + item.quantity;
        }, 0);

        cartCount.textContent = totalItems;
    }
}

// Save cart
function saveCart() {
    localStorage.setItem("beautyCart", JSON.stringify(cart));
    updateCartCount();
}

// Add products to cart
document.querySelectorAll(".add-cart-btn").forEach(button => {

    button.addEventListener("click", () => {

        const productCard = button.closest(".product-card");

        const productName = productCard.querySelector("h3").textContent;
        const productPrice = productCard.querySelector(".product-price").textContent;
        const productImage = productCard.querySelector("img").getAttribute("src");

        // Check if product already exists
        const existingProduct = cart.find(item => {
            return item.name === productName;
        });

        if (existingProduct) {
            existingProduct.quantity++;
        } else {

            cart.push({
                name: productName,
                price: productPrice,
                image: productImage,
                quantity: 1
            });

        }

        saveCart();

        // Button feedback
        const originalText = button.textContent;

        button.textContent = "ADDED ✓";
        button.style.background = "#8a735f";

        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = "";
        }, 1200);

    });

});

// Update counter when page loads
updateCartCount();

// ==============================
// SHOPPING CART PAGE
// ==============================

const cartItemsContainer = document.getElementById("cartItems");

if (cartItemsContainer) {

    function displayCart() {

        const savedCart = JSON.parse(
            localStorage.getItem("beautyCart")
        ) || [];

        cartItemsContainer.innerHTML = "";

        let subtotal = 0;
        let totalItems = 0;

        if (savedCart.length === 0) {

            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <h3>Your cart is empty</h3>
                    <p>You haven't added any beautiful items yet.</p>
                </div>
            `;

        } else {

            savedCart.forEach((item, index) => {

                const price = Number(
                    item.price.replace(/[₦,]/g, "")
                );

                subtotal += price * item.quantity;
                totalItems += item.quantity;

                cartItemsContainer.innerHTML += `
                    <div class="cart-item">

                        <img src="${item.image}" alt="${item.name}">

                        <div class="cart-item-details">

                            <h3>${item.name}</h3>

                            <p class="cart-item-price">
                                ${item.price}
                            </p>

                            <div class="quantity-controls">

                                <button onclick="changeQuantity(${index}, -1)">−</button>

                                <span>${item.quantity}</span>

                                <button onclick="changeQuantity(${index}, 1)">+</button>

                            </div>

                            <button class="remove-item"
                                onclick="removeItem(${index})">
                                REMOVE
                            </button>

                        </div>

                    </div>
                `;

            });

        }

        document.getElementById("cartItemsCount").textContent = totalItems;

        document.getElementById("cartSubtotal").textContent =
            "₦" + subtotal.toLocaleString("en-NG");

        document.getElementById("cartTotal").textContent =
            "₦" + subtotal.toLocaleString("en-NG");

        updateCartCount();
    }

    function changeQuantity(index, amount) {

        let savedCart = JSON.parse(
            localStorage.getItem("beautyCart")
        ) || [];

        savedCart[index].quantity += amount;

        if (savedCart[index].quantity <= 0) {
            savedCart.splice(index, 1);
        }

        localStorage.setItem(
            "beautyCart",
            JSON.stringify(savedCart)
        );

        cart = savedCart;

        displayCart();
    }

    function removeItem(index) {

        let savedCart = JSON.parse(
            localStorage.getItem("beautyCart")
        ) || [];

        savedCart.splice(index, 1);

        localStorage.setItem(
            "beautyCart",
            JSON.stringify(savedCart)
        );

        cart = savedCart;

        displayCart();
    }

    displayCart();
    
// ==============================
// WHATSAPP CHECKOUT
// ==============================

const checkoutBtn = document.getElementById("checkoutBtn");

if (checkoutBtn) {

    checkoutBtn.addEventListener("click", () => {

        const savedCart = JSON.parse(
            localStorage.getItem("beautyCart")
        ) || [];

        // Check if cart is empty
        if (savedCart.length === 0) {
            alert("Your cart is empty!");
            return;
        }

        let subtotal = 0;

        // Collect product details
        const orderDetails = savedCart.map((item, index) => {

            const price = Number(
                item.price.replace(/[₦,]/g, "")
            );

            subtotal += price * item.quantity;

            return `${index + 1}. ${item.name}
Quantity: ${item.quantity}
Price: ${item.price}`;

        }).join("\n\n");

        // Prepare WhatsApp message
        const message = `
Hello Beauty Collections! ❤️

I'd like to place an order.

MY ORDER:

${orderDetails}

------------------------
TOTAL: ₦${subtotal.toLocaleString("en-NG")}
------------------------

Please confirm my order and provide delivery details.

Thank you!
        `;

        // Your WhatsApp number
        const whatsappNumber = "2348101606640";

        // Open WhatsApp
        const whatsappURL =
            `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

        window.open(whatsappURL, "_blank");

    });

}
}