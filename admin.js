// SUPABASE CONNECTION

const SUPABASE_URL = "https://cxcbdkthywspiknkvcgz.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_tqQkW4ebZpKkGyNo1mQ5VA_td1YEyoM";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

// AUTHORISED ADMIN USER

const ADMIN_USER_ID = "89234274-970f-4fa0-b3c7-ebe4af7fd06f";
// ADMIN LOGIN

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const loginBtn = document.getElementById("loginBtn");

loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value;

    loginBtn.disabled = true;
    loginBtn.textContent = "Signing in...";
    loginMessage.textContent = "";

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            throw error;
        }

        // Check whether this is the authorised admin
        if (data.user.id !== ADMIN_USER_ID) {
            await supabaseClient.auth.signOut();
            throw new Error("Access denied. You are not authorised to access this dashboard.");
        }

        // Show dashboard
        document.getElementById("loginSection").hidden = true;
        document.getElementById("dashboardSection").hidden = false;
        await loadProductStats();
        await loadProducts();
    } catch (error) {
        loginMessage.textContent = error.message;
        loginMessage.style.color = "red";
    }

    loginBtn.disabled = false;
    loginBtn.textContent = "Sign In";
});

// ADMIN LOGOUT

const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", async function () {

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        alert("Unable to log out. Please try again.");
        return;
    }

    // Return to login page
    document.getElementById("dashboardSection").hidden = true;
    document.getElementById("loginSection").hidden = false;

    // Clear login fields
    document.getElementById("adminEmail").value = "";
    document.getElementById("adminPassword").value = "";
    loginMessage.textContent = "";
});

// LOAD PRODUCT STATISTICS

async function loadProductStats() {

    const { data, error } = await supabaseClient
        .from("products")
        .select("id, in_stock");

    if (error) {
        console.error("Error loading products:", error.message);
        return;
    }

    const total = data.length;

    const available = data.filter(product => product.in_stock === true).length;

    const outOfStock = data.filter(product => product.in_stock === false).length;

    document.getElementById("totalProducts").textContent = total;

    document.getElementById("availableProducts").textContent = available;

    document.getElementById("outOfStock").textContent = outOfStock;
}

// LOAD PRODUCTS

async function loadProducts() {

    const productsList = document.getElementById("productsList");

    productsList.textContent = "Loading products...";

    const { data, error } = await supabaseClient
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        productsList.textContent = "Unable to load products.";
        console.error(error.message);
        return;
    }

    if (data.length === 0) {
        productsList.textContent = "No products added yet.";
        return;
    }

    productsList.innerHTML = "";

    data.forEach(product => {

        const productItem = document.createElement("div");
        productItem.className = "admin-product";

        const image = document.createElement("img");
        image.src = product.image_url || "";
        image.alt = product.name;

        const details = document.createElement("div");

        const name = document.createElement("h3");
        name.textContent = product.name;

        const category = document.createElement("p");
        category.textContent = product.category;

        const price = document.createElement("p");
        price.textContent = "₦" + Number(product.price).toLocaleString();

        const stock = document.createElement("p");
        stock.textContent = product.in_stock ? "In Stock" : "Out of Stock";

        // EDIT BUTTON

   const editBtn = document.createElement("button");
editBtn.className = "edit-product-btn";

editBtn.textContent = "Edit";

editBtn.dataset.id = product.id;
editBtn.dataset.name = product.name;
editBtn.dataset.description = product.description || "";
editBtn.dataset.price = product.price;
editBtn.dataset.category = product.category;
editBtn.dataset.inStock = product.in_stock;
editBtn.dataset.imageUrl = product.image_url || "";

        // DELETE BUTTON

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-product-btn";
        deleteBtn.textContent = "Delete";
        deleteBtn.dataset.id = product.id;
        deleteBtn.dataset.imageUrl = product.image_url || "";

        details.append(name, category, price, stock);

        productItem.append(image, details, editBtn, deleteBtn);

        productsList.appendChild(productItem);

    });
}

    
        // TOGGLE ADD PRODUCT FORM

        const addProductBtn = document.getElementById("addProductBtn");
        const addProductForm = document.getElementById("addProductForm");

        addProductBtn.addEventListener("click", function () {

            if (addProductForm.hidden) {
                addProductForm.hidden = false;
                addProductBtn.innerHTML = '<i class="fa-solid fa-times"></i> Close Form';
            } else {
                addProductForm.hidden = true;
                addProductBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add New Product';
            }

        });

        // SAVE NEW PRODUCT

        const saveProductBtn = document.getElementById("saveProductBtn");
        const productMessage = document.getElementById("productMessage");

        addProductForm.addEventListener("submit", async function (e) {

            e.preventDefault();

            const name = document.getElementById("productName").value.trim();
            const description = document.getElementById("productDescription").value.trim();
            const price = Number(document.getElementById("productPrice").value);
            const category = document.getElementById("productCategory").value;
            const imageFile = document.getElementById("productImage").files[0];
            const inStock = document.getElementById("productInStock").checked;

            if (!imageFile) {
                productMessage.textContent = "Please select a product image.";
                productMessage.style.color = "red";
                return;
            }

            if (imageFile.size > 5 * 1024 * 1024) {
                productMessage.textContent = "Image must not exceed 5MB.";
                productMessage.style.color = "red";
                return;
            }

            saveProductBtn.disabled = true;
            saveProductBtn.textContent = "Saving Product...";
            productMessage.textContent = "";

            try {

                // UPLOAD IMAGE

                const extension = imageFile.name.split(".").pop().toLowerCase();
                const imagePath = `${crypto.randomUUID()}.${extension}`;

                const { error: uploadError } = await supabaseClient
                    .storage
                    .from("product-images")
                    .upload(imagePath, imageFile);

                if (uploadError) {
                    throw uploadError;
                }

                // GET PUBLIC IMAGE URL

                const { data: imageData } = supabaseClient
                    .storage
                    .from("product-images")
                    .getPublicUrl(imagePath);

                const imageUrl = imageData.publicUrl;

                // SAVE PRODUCT DETAILS

                const { error: insertError } = await supabaseClient
                    .from("products")
                    .insert({
                        name: name,
                        description: description,
                        price: price,
                        category: category,
                        image_url: imageUrl,
                        in_stock: inStock
                    });

                if (insertError) {
                    throw insertError;
                }

                productMessage.textContent = "Product added successfully!";
                productMessage.style.color = "green";

                addProductForm.reset();

                await loadProductStats();
                await loadProducts();

            } catch (error) {

                console.error("Product saving error:", error);

                productMessage.textContent = error.message || "Unable to save product.";
                productMessage.style.color = "red";

            } finally {

                saveProductBtn.disabled = false;
                saveProductBtn.textContent = "Save Product";

            }

        });

        // DELETE PRODUCT

        document.getElementById("productsList").addEventListener("click", async function (e) {

            const deleteBtn = e.target.closest(".delete-product-btn");

            if (!deleteBtn) return;

            const productId = deleteBtn.dataset.id;
            const imageUrl = deleteBtn.dataset.imageUrl;

            const confirmDelete = confirm("Are you sure you want to delete this product?");

            if (!confirmDelete) return;

            deleteBtn.disabled = true;
            deleteBtn.textContent = "Deleting...";

            try {

                // DELETE PRODUCT FROM DATABASE

                const { error } = await supabaseClient
                    .from("products")
                    .delete()
                    .eq("id", productId);

                if (error) throw error;

                // DELETE PRODUCT IMAGE FROM STORAGE

                if (imageUrl) {

                    const imagePath = imageUrl.split("/product-images/")[1];

                    if (imagePath) {
                        const { error: imageError } = await supabaseClient
                            .storage
                            .from("product-images")
                            .remove([decodeURIComponent(imagePath)]);

                        if (imageError) {
                            console.error("Image deletion error:", imageError.message);
                        }
                    }
                }

                alert("Product deleted successfully!");

                await loadProductStats();
                await loadProducts();

            } catch (error) {

                alert("Unable to delete product: " + error.message);

                deleteBtn.disabled = false;
                deleteBtn.textContent = "Delete";

            }

        });

// OPEN EDIT PRODUCT FORM

const editProductForm = document.getElementById("editProductForm");

document.getElementById("productsList").addEventListener("click", function (e) {

    const editBtn = e.target.closest(".edit-product-btn");

    if (!editBtn) return;

    // Hide Add Product Form if open
    addProductForm.hidden = true;

    addProductBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add New Product';

    // Fill Edit Form with existing product details

    document.getElementById("editProductId").value = editBtn.dataset.id;

    document.getElementById("editProductName").value = editBtn.dataset.name;

    document.getElementById("editProductDescription").value = editBtn.dataset.description;

    document.getElementById("editProductPrice").value = editBtn.dataset.price;

    document.getElementById("editProductCategory").value = editBtn.dataset.category;

    document.getElementById("editProductInStock").checked = editBtn.dataset.inStock === "true";

    // Show Edit Form

    editProductForm.hidden = false;

    editProductForm.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

});

// CANCEL EDITING PRODUCT

const cancelEditBtn = document.getElementById("cancelEditBtn");

cancelEditBtn.addEventListener("click", function () {

    editProductForm.hidden = true;

    editProductForm.reset();

    document.getElementById("editProductMessage").textContent = "";

});

// UPDATE EXISTING PRODUCT

let currentEditingImageUrl = "";

document.getElementById("productsList").addEventListener("click", function (e) {

    const editBtn = e.target.closest(".edit-product-btn");

    if (!editBtn) return;

    currentEditingImageUrl = editBtn.dataset.imageUrl || "";

});

editProductForm.addEventListener("submit", async function (e) {

    e.preventDefault();

    const productId = document.getElementById("editProductId").value;
    const name = document.getElementById("editProductName").value.trim();
    const description = document.getElementById("editProductDescription").value.trim();
    const price = Number(document.getElementById("editProductPrice").value);
    const category = document.getElementById("editProductCategory").value;
    const imageFile = document.getElementById("editProductImage").files[0];
    const inStock = document.getElementById("editProductInStock").checked;

    const updateProductBtn = document.getElementById("updateProductBtn");
    const editProductMessage = document.getElementById("editProductMessage");

    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
        editProductMessage.textContent = "Image must not exceed 5MB.";
        editProductMessage.style.color = "red";
        return;
    }

    updateProductBtn.disabled = true;
    updateProductBtn.textContent = "Updating...";
    editProductMessage.textContent = "";

    let newImagePath = null;

    try {

        let imageUrl = currentEditingImageUrl;

        // UPLOAD NEW IMAGE IF SELECTED

        if (imageFile) {

            const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

            if (!allowedTypes.includes(imageFile.type)) {
                throw new Error("Please select a JPG, PNG or WebP image.");
            }

            const extensions = {
                "image/jpeg": "jpg",
                "image/png": "png",
                "image/webp": "webp"
            };

            newImagePath = `${crypto.randomUUID()}.${extensions[imageFile.type]}`;

            const { error: uploadError } = await supabaseClient
                .storage
                .from("product-images")
                .upload(newImagePath, imageFile);

            if (uploadError) throw uploadError;

            const { data: imageData } = supabaseClient
                .storage
                .from("product-images")
                .getPublicUrl(newImagePath);

            imageUrl = imageData.publicUrl;
        }

        // UPDATE PRODUCT IN DATABASE

        const { error: updateError } = await supabaseClient
            .from("products")
            .update({
                name: name,
                description: description,
                price: price,
                category: category,
                image_url: imageUrl,
                in_stock: inStock
            })
            .eq("id", productId);

        if (updateError) throw updateError;

        // DELETE OLD IMAGE AFTER SUCCESSFUL UPDATE

        if (newImagePath && currentEditingImageUrl) {

            const oldImagePath = currentEditingImageUrl.split("/product-images/")[1];

            if (oldImagePath) {
                const { error: removeError } = await supabaseClient
                    .storage
                    .from("product-images")
                    .remove([decodeURIComponent(oldImagePath)]);

                if (removeError) {
                    console.error("Old image removal error:", removeError.message);
                }
            }
        }

        editProductMessage.textContent = "Product updated successfully!";
        editProductMessage.style.color = "green";

        editProductForm.reset();
        editProductForm.hidden = true;

        await loadProductStats();
        await loadProducts();

    } catch (error) {

        console.error("Product update error:", error);

        // Remove newly uploaded image if the database update failed

        if (newImagePath) {
            await supabaseClient
                .storage
                .from("product-images")
                .remove([newImagePath]);
        }

        editProductMessage.textContent = error.message || "Unable to update product.";
        editProductMessage.style.color = "red";

    } finally {

        updateProductBtn.disabled = false;
        updateProductBtn.textContent = "Update Product";

    }

});

// CHECK EXISTING ADMIN SESSION

async function checkAdminSession() {

    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
        console.error("Session error:", error.message);
        return;
    }

    const session = data.session;

    if (session && session.user.id === ADMIN_USER_ID) {

        document.getElementById("loginSection").hidden = true;
        document.getElementById("dashboardSection").hidden = false;

        await loadProductStats();
        await loadProducts();

    } else if (session) {

        await supabaseClient.auth.signOut();

    }

}

checkAdminSession();
