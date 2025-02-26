// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCwmRrr4xWRIlFqzenQmFwGFbKHumDzCgw",
    authDomain: "recipe-organizer-7ee80.firebaseapp.com",
    projectId: "recipe-organizer-7ee80",
    storageBucket: "recipe-organizer-7ee80.firebasestorage.app",
    messagingSenderId: "28821848017",
    appId: "1:28821848017:web:4dd05637da5cdf3c5c2af0",
    measurementId: "G-ZRN52WS1PX"
};
  
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
  
// Add after Firebase initialization
firebase.auth().signInAnonymously().catch(error => {
    console.error("Anonymous auth error:", error);
});
// Global variable to track authentication status
let isAuthenticated = false;
  
// DOM Elements
const loginBtn = document.getElementById('login-btn');
const chatBtn = document.getElementById('chat-btn');
const recipeForm = document.getElementById('recipe-form');
const recipeList = document.getElementById('recipe-list');
const editModal = document.getElementById('edit-modal');
const chatModal = document.getElementById('chat-modal');
const closeButtons = document.querySelectorAll('.close');
const categoryFilter = document.getElementById('category-filter');
const ingredientFilter = document.getElementById('ingredient-filter');
const clearFiltersBtn = document.getElementById('clear-filters-btn');
const chatInput = document.getElementById('chat-input');
const sendChatBtn = document.getElementById('send-chat-btn');
const chatMessages = document.getElementById('chat-messages');
  
// Event Listeners
if (loginBtn) loginBtn.addEventListener('click', authenticateUser);
if (chatBtn) chatBtn.addEventListener('click', openChatModal);
if (recipeForm) recipeForm.addEventListener('submit', handleAddRecipe);
if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', clearFilters);
if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
if (ingredientFilter) ingredientFilter.addEventListener('input', applyFilters);
if (sendChatBtn) sendChatBtn.addEventListener('click', sendChatMessage);
if (chatInput) chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') sendChatMessage();
});
  
// Close modal when clicking the X
closeButtons.forEach(button => {
    button.addEventListener('click', function() {
        editModal.style.display = 'none';
        chatModal.style.display = 'none';
    });
});
  
// Close modal when clicking outside of it
window.addEventListener('click', function(event) {
    if (event.target === editModal) {
        editModal.style.display = 'none';
    }
    if (event.target === chatModal) {
        chatModal.style.display = 'none';
    }
});
  
// Setup edit form submit handler
const editRecipeForm = document.getElementById('edit-recipe-form');
if (editRecipeForm) {
    editRecipeForm.addEventListener('submit', handleUpdateRecipe);
}
  
// Biometric Authentication Functions
  
// Check if WebAuthn is supported by the browser
function isBiometricsSupported() {
    return window.PublicKeyCredential && 
           navigator.credentials && 
           typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';
}
  
// Convert string to ArrayBuffer for WebAuthn
function str2ab(str) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0; i < str.length; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}
  
// Convert ArrayBuffer to Base64 string for storage
function ab2base64(buf) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(buf)));
}
  
// Convert Base64 string to ArrayBuffer
function base642ab(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}
  
// Helper function to show notifications
function showNotification(message, isError = false) {
    console.log(isError ? 'Error: ' : 'Success: ', message);
      
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '5px';
        notification.style.zIndex = '1000';
        document.body.appendChild(notification);
    }
      
    notification.textContent = message;
    notification.style.backgroundColor = isError ? '#f44336' : '#4CAF50';
    notification.style.color = 'white';
    notification.style.display = 'block';
      
    setTimeout(() => { 
        notification.style.display = 'none'; 
    }, 3000);
}
  
// Register a new biometric credential
async function registerBiometric() {
    try {
        if (!isBiometricsSupported()) {
            showNotification('Biometric authentication is not supported on this device', true);
            return false;
        }
  
        const supported = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (!supported) {
            showNotification('Your device does not have a biometric sensor or it is not available', true);
            return false;
        }
  
        // Generate a random challenge
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
  
        // Create a credential creation options
        const publicKeyCredentialCreationOptions = {
            challenge: challenge,
            rp: {
                name: "Recipe Organizer App",
                id: window.location.hostname
            },
            user: {
                id: str2ab('user-' + Date.now()),
                name: 'user@recipeorganizer.com',
                displayName: 'Recipe User'
            },
            pubKeyCredParams: [
                { type: "public-key", alg: -7 }, // ES256
                { type: "public-key", alg: -257 } // RS256
            ],
            authenticatorSelection: {
                authenticatorAttachment: "platform",
                userVerification: "required",
                requireResidentKey: false
            },
            timeout: 60000,
            attestation: "none"
        };
  
        const credential = await navigator.credentials.create({
            publicKey: publicKeyCredentialCreationOptions
        });
  
        // Store the credential for later use
        const credentialId = credential.id;
        const credentialPublicKey = ab2base64(credential.response.getPublicKey());
          
        // Store in localStorage for this demo - in a real app, send to server
        localStorage.setItem('credentialId', credentialId);
        localStorage.setItem('credentialPublicKey', credentialPublicKey);
  
        showNotification('Biometric registration successful!');
        isAuthenticated = true;
        
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-fingerprint"></i> ✓ Authenticated';
            loginBtn.disabled = true;
            loginBtn.classList.add('authenticated');
        }
        
        return true;
    } catch (error) {
        console.error('Error during biometric registration:', error);
        showNotification('Biometric registration failed: ' + error.message, true);
        return false;
    }
}
  
// Authenticate using previously registered biometric
async function authenticateWithBiometric() {
    try {
        if (!isBiometricsSupported()) {
            showNotification('Biometric authentication is not supported on this device', true);
            return false;
        }
  
        // Check if credential exists
        const credentialId = localStorage.getItem('credentialId');
        if (!credentialId) {
            // No credential found, register instead
            return registerBiometric();
        }
  
        // Generate a random challenge
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
  
        // Create assertion options
        const publicKeyCredentialRequestOptions = {
            challenge: challenge,
            allowCredentials: [{
                id: base642ab(credentialId),
                type: 'public-key',
                transports: ['internal']
            }],
            timeout: 60000,
            userVerification: "required"
        };
  
        const assertion = await navigator.credentials.get({
            publicKey: publicKeyCredentialRequestOptions
        });
  
        if (assertion) {
            isAuthenticated = true;
            if (loginBtn) {
                loginBtn.innerHTML = '<i class="fas fa-fingerprint"></i> ✓ Authenticated';
                loginBtn.disabled = true;
                loginBtn.classList.add('authenticated');
            }
            showNotification('Biometric authentication successful!');
            return true;
        } else {
            showNotification('Authentication failed: No assertion returned', true);
            return false;
        }
    } catch (error) {
        console.error('Error during biometric authentication:', error);
        showNotification('Authentication failed: ' + error.message, true);
        return false;
    }
}
  
// Main authentication function to call from button click
function authenticateUser() {
    if (isAuthenticated) {
        showNotification('You are already authenticated');
        return;
    }
      
    // Check if we have credentials stored
    if (localStorage.getItem('credentialId')) {
        authenticateWithBiometric();
    } else {
        // First-time user, register biometric
        registerBiometric();
    }
}
  
// Recipe CRUD Functions
  
// Handle form submission to add a new recipe
function handleAddRecipe(e) {
    e.preventDefault();
    
    // Verify authentication before allowing recipe addition
    if (!isAuthenticated) {
        showNotification('Please authenticate using biometrics before adding recipes', true);
        return;
    }
      
    const name = document.getElementById('recipe-name').value;
    const category = document.getElementById('recipe-category').value;
    const ingredientsText = document.getElementById('recipe-ingredients').value;
    const instructions = document.getElementById('recipe-instructions').value;
    const prepTime = parseInt(document.getElementById('recipe-preptime').value);
    const favorite = document.getElementById('recipe-favorite').checked;
      
    // Convert ingredients text to array
    const ingredients = ingredientsText.split('\n')
        .map(ingredient => ingredient.trim())
        .filter(ingredient => ingredient !== '');
      
    const recipe = {
        name,
        category,
        ingredients,
        instructions,
        prepTime,
        favorite,
        createdAt: firebase.firestore.Timestamp.fromDate(new Date())
    };
      
    addRecipe(recipe)
        .then(() => {
            showNotification('Recipe added successfully!');
            recipeForm.reset();
            loadRecipes(); // Refresh the recipe list
        })
        .catch(error => {
            showNotification('Error adding recipe: ' + error.message, true);
        });
}
  
// Add a new recipe to Firestore
function addRecipe(recipeData) {
    return db.collection("recipes").add(recipeData);
}
  
// Load recipes from Firestore
function loadRecipes() {
    const categoryValue = categoryFilter.value;
    const ingredientValue = ingredientFilter.value.toLowerCase();
      
    let query = db.collection("recipes");
      
    // Apply category filter if not "all"
    if (categoryValue !== 'all') {
        query = query.where("category", "==", categoryValue);
    }
      
    query.get()
        .then((querySnapshot) => {
            if (recipeList) {
                recipeList.innerHTML = ''; // Clear the list
                  
                if (querySnapshot.empty) {
                    recipeList.innerHTML = '<p class="no-recipes">No recipes found. Add your first recipe!</p>';
                    return;
                }
                  
                querySnapshot.forEach((doc) => {
                    const recipe = {
                        id: doc.id,
                        ...doc.data()
                    };
                      
                    // Apply ingredient filter client-side
                    if (ingredientValue && !recipe.ingredients.some(ingredient => 
                        ingredient.toLowerCase().includes(ingredientValue))) {
                        return;
                    }
                      
                    // Format the recipe card
                    const recipeCard = createRecipeCard(recipe);
                    recipeList.appendChild(recipeCard);
                });
                  
                // Check if no recipes are visible after filtering
                if (recipeList.children.length === 0) {
                    recipeList.innerHTML = '<p class="no-recipes">No recipes match your filters.</p>';
                }
            }
        })
        .catch((error) => {
            showNotification('Error loading recipes: ' + error.message, true);
        });
}
  
// Create a recipe card element
function createRecipeCard(recipe) {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    if (recipe.favorite) {
        card.classList.add('favorite');
    }
      
    // Convert timestamp to readable date
    const createdAt = recipe.createdAt && recipe.createdAt.toDate ? 
        recipe.createdAt.toDate().toLocaleDateString() : 'Unknown date';
      
    card.innerHTML = `
        <h3>${recipe.name}</h3>
        <div class="recipe-meta">
            <span class="category">${recipe.category}</span>
            <span class="prep-time"><i class="fas fa-clock"></i> ${recipe.prepTime} min</span>
            ${recipe.favorite ? '<span class="favorite-badge"><i class="fas fa-star"></i> Favorite</span>' : ''}
        </div>
        <div class="recipe-ingredients">
            <h4>Ingredients:</h4>
            <ul>
                ${recipe.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
            </ul>
        </div>
        <div class="recipe-instructions">
            <h4>Instructions:</h4>
            <p>${recipe.instructions}</p>
        </div>
        <div class="recipe-footer">
            <span class="date">Added: ${createdAt}</span>
            <div class="recipe-actions">
                <button class="edit-btn" data-id="${recipe.id}"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" data-id="${recipe.id}"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `;
      
    // Add event listeners for edit and delete buttons
    const editBtn = card.querySelector('.edit-btn');
    const deleteBtn = card.querySelector('.delete-btn');
      
    editBtn.addEventListener('click', function() {
        if (!isAuthenticated) {
            showNotification('Please authenticate using biometrics before editing recipes', true);
            return;
        }
        openEditModal(recipe);
    });
      
    deleteBtn.addEventListener('click', function() {
        if (!isAuthenticated) {
            showNotification('Please authenticate using biometrics before deleting recipes', true);
            return;
        }
        if (confirm(`Are you sure you want to delete "${recipe.name}"?`)) {
            deleteRecipe(recipe.id);
        }
    });
      
    return card;
}
  
// Open the edit modal with recipe data
function openEditModal(recipe) {
    document.getElementById('edit-recipe-id').value = recipe.id;
    document.getElementById('edit-recipe-name').value = recipe.name;
    document.getElementById('edit-recipe-category').value = recipe.category;
    document.getElementById('edit-recipe-ingredients').value = recipe.ingredients.join('\n');
    document.getElementById('edit-recipe-instructions').value = recipe.instructions;
    document.getElementById('edit-recipe-preptime').value = recipe.prepTime;
    document.getElementById('edit-recipe-favorite').checked = recipe.favorite;
      
    editModal.style.display = 'block';
}
  
// Handle the update recipe form submission
function handleUpdateRecipe(e) {
    e.preventDefault();
    
    // Verify authentication before allowing recipe update
    if (!isAuthenticated) {
        showNotification('Please authenticate using biometrics before updating recipes', true);
        return;
    }
      
    const id = document.getElementById('edit-recipe-id').value;
    const name = document.getElementById('edit-recipe-name').value;
    const category = document.getElementById('edit-recipe-category').value;
    const ingredientsText = document.getElementById('edit-recipe-ingredients').value;
    const instructions = document.getElementById('edit-recipe-instructions').value;
    const prepTime = parseInt(document.getElementById('edit-recipe-preptime').value);
    const favorite = document.getElementById('edit-recipe-favorite').checked;
      
    // Convert ingredients text to array
    const ingredients = ingredientsText.split('\n')
        .map(ingredient => ingredient.trim())
        .filter(ingredient => ingredient !== '');
      
    const updatedRecipe = {
        name,
        category,
        ingredients,
        instructions,
        prepTime,
        favorite,
        updatedAt: firebase.firestore.Timestamp.fromDate(new Date())
    };
      
    updateRecipe(id, updatedRecipe)
        .then(() => {
            showNotification('Recipe updated successfully!');
            editModal.style.display = 'none';
            loadRecipes(); // Refresh the recipe list
        })
        .catch(error => {
            showNotification('Error updating recipe: ' + error.message, true);
        });
}
  
// Update a recipe in Firestore
function updateRecipe(recipeId, recipeData) {
    return db.collection("recipes").doc(recipeId).update(recipeData);
}
  
// Delete a recipe from Firestore
function deleteRecipe(recipeId) {
    // Verify authentication before allowing recipe deletion
    if (!isAuthenticated) {
        showNotification('Please authenticate using biometrics before deleting recipes', true);
        return;
    }
    
    db.collection("recipes").doc(recipeId).delete()
        .then(() => {
            showNotification('Recipe deleted successfully!');
            loadRecipes(); // Refresh the recipe list
        })
        .catch(error => {
            showNotification('Error deleting recipe: ' + error.message, true);
        });
}
  
// Filter functions
function applyFilters() {
    loadRecipes();
}
  
function clearFilters() {
    categoryFilter.value = 'all';
    ingredientFilter.value = '';
    loadRecipes();
}

// Chat variables
let chatHistory = [];

// Recipe API Configuration
const RECIPE_API_KEY = '2e711f031fd34ceabafe0ca23a6355b1'; // API key for Spoonacular
const RECIPE_API_BASE_URL = 'https://api.spoonacular.com/recipes';

// Open chat modal and initialize
function openChatModal() {
    // Verify authentication before allowing chat
    if (!isAuthenticated) {
        showNotification('Please authenticate using biometrics before using the chat feature', true);
        return;
    }
    
    chatModal.style.display = 'block';
      
    // Add a welcome message if the chat is empty
    if (chatMessages.children.length === 0) {
        addChatMessage('Welcome to Recipe Assistant! How can I help you with your recipes today? You can ask me for any recipe, even if it\'s not in your collection yet!', 'assistant');
    }
      
    // Focus the input field
    chatInput.focus();
}

// Send user message to chatbot and handle response
async function sendChatMessage() {
    // Verify authentication before allowing chat
    if (!isAuthenticated) {
        showNotification('Please authenticate using biometrics before using the chat feature', true);
        return;
    }
    
    const message = chatInput.value.trim();
    if (!message) return;
      
    // Add user message to chat UI
    addChatMessage(message, 'user');
    chatInput.value = '';
    
    // Add user message to history
    chatHistory.push({ role: "user", content: message });
    
    // Show typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(typingIndicator);
    
    try {
        // Get all user's saved recipes to provide context
        const savedRecipes = await getAllRecipes();
        
        // Process the user's query and generate a relevant response
        const response = await processUserQuery(message, savedRecipes);
        
        // Remove typing indicator
        typingIndicator.remove();
        
        // Add AI response to chat UI
        addChatMessage(response, 'assistant');
        
        // Add to chat history
        chatHistory.push({ role: "assistant", content: response });
        
        // Scroll to the bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
    } catch (error) {
        // Remove typing indicator
        if (typingIndicator.parentNode) {
            typingIndicator.remove();
        }
        
        console.error("Error with chat:", error);
        addChatMessage("I'm sorry, I couldn't process your request. " + error.message, 'assistant error');
    }
}

// Retrieve all recipes from Firestore
async function getAllRecipes() {
    try {
        const snapshot = await db.collection("recipes").get();
        const recipes = [];
        
        snapshot.forEach(doc => {
            recipes.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return recipes;
    } catch (error) {
        console.error("Error getting recipes:", error);
        throw error;
    }
}

// Process the user's query and provide a relevant response
async function processUserQuery(query, savedRecipes) {
    query = query.toLowerCase();
    
    // Check for saved recipes first
    if (savedRecipes.length > 0) {
        // Search for recipes by name or category in saved recipes
        const matchesByName = savedRecipes.filter(recipe => 
            recipe.name.toLowerCase().includes(query) || 
            recipe.category.toLowerCase().includes(query)
        );
        
        // Search for recipes by ingredient in saved recipes
        const matchesByIngredient = savedRecipes.filter(recipe => 
            recipe.ingredients.some(ingredient => 
                ingredient.toLowerCase().includes(query)
            )
        );
        
        // Combine unique matches from saved recipes
        const savedMatches = [...new Set([...matchesByName, ...matchesByIngredient])];
        
        if (savedMatches.length > 0) {
            // Found matches in saved recipes
            return handleSavedRecipeMatches(query, savedMatches);
        }
    }
    
    // Identify recipe query patterns
    const wantsToMake = /how to (make|cook|prepare)|recipe for|want to (make|cook|prepare)/.test(query);
    const askingAboutFood = extractFoodKeywords(query).length > 0;
    const isRecipeQuery = wantsToMake || askingAboutFood;
    
    // For recipe-related queries, try to get from API
    if (isRecipeQuery) {
        try {
            // Extract recipe name from query
            const recipeName = extractRecipeName(query) || extractFoodKeywords(query).join(' ');
            
            if (recipeName) {
                // Search for recipe via API
                const apiRecipes = await searchRecipesByName(recipeName);
                
                if (apiRecipes && apiRecipes.length > 0) {
                    // Get detailed information for the first recipe
                    const recipeDetails = await getRecipeDetails(apiRecipes[0].id);
                    
                    if (recipeDetails) {
                        // Format the API recipe response
                        let response = formatApiRecipeResponse(recipeDetails);
                        
                        // Add option to save this recipe
                        response += "\n\nWould you like me to save this recipe to your collection? Reply with 'save this recipe' if you'd like to add it.";
                        
                        // Store the recipe details for potential saving
                        localStorage.setItem('lastApiRecipe', JSON.stringify(recipeDetails));
                        
                        return response;
                    }
                }
                
                return `I don't have a recipe for ${recipeName} at the moment. Please try asking for a different recipe or check back later.`;
            }
        } catch (error) {
            console.error("Error fetching recipe from API:", error);
            return "I'm having trouble finding that recipe right now. Could you try asking for a different recipe?";
        }
    }
    
    // Handle request to save the last API recipe
    if (query.includes('save this recipe')) {
        const lastApiRecipe = localStorage.getItem('lastApiRecipe');
        
        if (lastApiRecipe) {
            const recipeDetails = JSON.parse(lastApiRecipe);
            const savedRecipe = await saveApiRecipeToFirestore(recipeDetails);
            
            if (savedRecipe) {
                return `I've saved the ${recipeDetails.title} recipe to your collection. You can now find it in your recipe list!`;
            } else {
                return "I couldn't save the recipe. Please try again.";
            }
        } else {
            return "I don't have a recent recipe to save. Please find a recipe first, then ask me to save it.";
        }
    }
    
    // Handle general questions and recommendations
    if (query.includes('recommend') || query.includes('suggestion')) {
        try {
            // Get random recipe recommendations from API
            const recommendations = await getRandomRecipes(3);
            
            if (recommendations && recommendations.length > 0) {
                let response = "Here are some recipe recommendations for you:\n\n";
                
                recommendations.forEach((recipe, index) => {
                    response += `${index + 1}. **${recipe.title}** - Ready in ${recipe.readyInMinutes} minutes\n`;
                });
                
                response += "\nWould you like more details about any of these recipes? Just ask about the one you're interested in.";
                
                return response;
            }
        } catch (error) {
            console.error("Error fetching recommendations:", error);
        }
        
        // Fallback to saved recipes if API fails
        if (savedRecipes.length > 0) {
            const recommended = savedRecipes[Math.floor(Math.random() * savedRecipes.length)];
            return `I recommend trying ${recommended.name}! It takes about ${recommended.prepTime} minutes to prepare.`;
        }
    }
    
    // Basic conversation handling
    if (query.includes('hello') || query.includes('hi ') || query.includes('hey')) {
        return `Hello! I'm your Recipe Assistant. I can help you find recipes, list ingredients, or provide cooking instructions. What would you like to cook today?`;
    }
    
    if (query.includes('thank')) {
        return `You're welcome! Let me know if you need any more help with your recipes.`;
    }
    
    // Fallback response
    return `I'd be happy to help you find a recipe! You can ask something like "How do I make chicken parmesan?" or "Find a recipe for chocolate cake".`;
}

// Handle matches from saved recipes
function handleSavedRecipeMatches(query, matches) {
    // Identify recipe components in query
    const askingAboutIngredients = /what ingredients|ingredients for|ingredients to make/.test(query);
    const askingAboutInstructions = /how do i|how to cook|how to make|steps to|instructions for/.test(query);
    const askingAboutTime = /how long|prep time|cooking time|how much time/.test(query);
    
    if (matches.length === 1) {
        // Only one match found, determine what information to provide
        const recipe = matches[0];
        
        if (askingAboutIngredients) {
            return `To make ${recipe.name}, you'll need these ingredients:\n\n${recipe.ingredients.join('\n')}`;
        }
        
        if (askingAboutInstructions) {
            return `Here's how to make ${recipe.name}:\n\n${recipe.instructions}`;
        }
        
        if (askingAboutTime) {
            return `${recipe.name} takes approximately ${recipe.prepTime} minutes to prepare.`;
        }
        
        // Default response for a single match is the full recipe
        return generateRecipeResponse(recipe);
    } else {
        // Multiple matches, offer a list
        return `I found ${matches.length} recipes in your collection that might match your query: ${matches.map(r => r.name).join(', ')}. Which one would you like to know more about?`;
    }
}

// Search for recipes by name using Spoonacular API
async function searchRecipesByName(query) {
    try {
        const url = `${RECIPE_API_BASE_URL}/complexSearch?apiKey=${RECIPE_API_KEY}&query=${encodeURIComponent(query)}&number=5`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error("Error searching recipes by name:", error);
        throw error;
    }
}

// Get recipe details from Spoonacular API
async function getRecipeDetails(recipeId) {
    try {
        const url = `${RECIPE_API_BASE_URL}/${recipeId}/information?apiKey=${RECIPE_API_KEY}&includeNutrition=false`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error getting recipe details:", error);
        throw error;
    }
}

// Get random recipes from Spoonacular API
async function getRandomRecipes(count = 3) {
    try {
        const url = `${RECIPE_API_BASE_URL}/random?apiKey=${RECIPE_API_KEY}&number=${count}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        return data.recipes || [];
    } catch (error) {
        console.error("Error getting random recipes:", error);
        throw error;
    }
}

// Format API recipe response
function formatApiRecipeResponse(recipe) {
    // Extract ingredients from API response
    const ingredients = recipe.extendedIngredients.map(ing => ing.original);
    
    // Clean up instructions from HTML tags
    const instructions = recipe.instructions 
        ? recipe.instructions.replace(/<[^>]*>/g, '') 
        : "No detailed instructions available. Check the source website for more information.";
    
    return `
**${recipe.title}**

**Prep Time:** ${recipe.readyInMinutes} minutes
**Servings:** ${recipe.servings}

**Ingredients:**
${ingredients.map(ing => `• ${ing}`).join('\n')}

**Instructions:**
${instructions}

${recipe.sourceName ? `Source: ${recipe.sourceName}` : ''}
    `.trim();
}

// Save API recipe to Firestore
async function saveApiRecipeToFirestore(apiRecipe) {
    try {
        // Map the API category to one of your allowed categories
        let category = "dinner"; // Default
        if (apiRecipe.dishTypes && apiRecipe.dishTypes.length > 0) {
            const dishType = apiRecipe.dishTypes[0].toLowerCase();
            if (dishType.includes("breakfast")) category = "breakfast";
            else if (dishType.includes("lunch")) category = "lunch";
            else if (dishType.includes("dinner")) category = "dinner";
            else if (dishType.includes("dessert")) category = "dessert";
            else if (dishType.includes("snack")) category = "snack";
        }
        


                // Get the recipe data from your form
        const recipeData = {
            name: document.getElementById('recipe-name').value,
            category: document.getElementById('recipe-category').value,
            ingredients: getIngredientsArray(), // Make sure this returns an array
            instructions: document.getElementById('recipe-instructions').value,
            prepTime: parseInt(document.getElementById('recipe-time').value),
            favorite: document.getElementById('recipe-favorite').checked,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp() // Add this timestamp
        };
        
        // Update the document with all required fields
        db.collection('recipes').doc(recipeId).update(recipeData)
            .then(() => {
            console.log('Recipe updated successfully');
            })
            .catch((error) => {
            console.error('Error updating recipe:', error);
            });

        // Add the recipe to Firestore
        const docRef = await db.collection("recipes").add(recipeData);
        
        // Clear the stored API recipe
        localStorage.removeItem('lastApiRecipe');
        
        // Refresh the recipe list
        loadRecipes();
        
        return {
            id: docRef.id,
            ...recipeData
        };
        
    } catch (error) {
        console.error("Error saving API recipe:", error);
        showNotification('Error saving recipe: ' + error.message, true);
        return null;
    }
}
// Generate a formatted recipe response for chat
function generateRecipeResponse(recipe) {
    return `
**${recipe.name}**

**Category:** ${recipe.category}
**Prep Time:** ${recipe.prepTime} minutes
${recipe.favorite ? '**⭐ Favorite Recipe**' : ''}

**Ingredients:**
${recipe.ingredients.map(ing => `• ${ing}`).join('\n')}

**Instructions:**
${recipe.instructions}
    `.trim();
}

// Extract recipe name from a user query
function extractRecipeName(query) {
    // Try to match patterns like "how to make X" or "recipe for X"
    const patterns = [
        /how to (make|cook|prepare) (.*?)(\?|$)/i,
        /recipe for (.*?)(\?|$)/i,
        /making (.*?)(\?|$)/i,
        /cooking (.*?)(\?|$)/i,
        /i want to (make|cook|prepare) (.*?)(\?|$)/i
    ];
    
    for (const pattern of patterns) {
        const match = query.match(pattern);
        if (match) {
            // Return the captured group, usually the recipe name
            return match[match.length - 2].trim();
        }
    }
    
    return null;
}

// Extract food keywords from a query
function extractFoodKeywords(query) {
    // Common food categories and ingredients to look for
    const foodWords = [
        'chicken', 'beef', 'pork', 'fish', 'seafood', 'vegetarian', 'vegan',
        'pasta', 'rice', 'potato', 'soup', 'salad', 'sandwich', 'dessert',
        'cake', 'cookie', 'pie', 'bread', 'breakfast', 'dinner', 'lunch',
        'appetizer', 'snack', 'side', 'main course', 'drink', 'beverage'
    ];
    
    // Split query into words
    const words = query.toLowerCase().split(/\s+/);
    
    // Find matches
    return foodWords.filter(food => query.toLowerCase().includes(food));
}

// Add message to chat UI
function addChatMessage(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    // Format message with markdown-like syntax
    const formattedMessage = formatMessageText(message);
    
    messageDiv.innerHTML = formattedMessage;
    chatMessages.appendChild(messageDiv);
    
    // Scroll to the bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Format message text with basic markdown-like styling
function formatMessageText(text) {
    // Convert **bold** to <strong>bold</strong>
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert *italic* to <em>italic</em>
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Convert line breaks to <br>
    text = text.replace(/\n/g, '<br>');
    
    return text;
}

// Clear chat history
function clearChatHistory() {
    chatHistory = [];
    chatMessages.innerHTML = '';
    addChatMessage('Welcome to Recipe Assistant! How can I help you with your recipes today?', 'assistant');
}

// Initialize application
function initApp() {
    // Load recipes when the page loads
    loadRecipes();
    
    // Populate the category filter dropdown
    populateCategoryFilter();
    
    // Check if there's an active user session
    checkAuthStatus();
}


// Modify populateCategoryFilter to use lowercase
function populateCategoryFilter() {
    const categories = [
        'breakfast', 'lunch', 'dinner', 'dessert', 'snack'
    ];
    
    // Add options to select element with display capitalized, but value lowercase
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        categoryFilter.appendChild(option);
    });
}

// Check if user is already authenticated
function checkAuthStatus() {
    // For demo purposes, check localStorage
    const credentialId = localStorage.getItem('credentialId');
    
    if (credentialId) {
        // Update UI to show authenticated status
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-fingerprint"></i> Authenticate';
            loginBtn.classList.remove('authenticated');
        }
    }
}

// Export recipes as JSON file
function exportRecipes() {
    db.collection("recipes").get()
        .then((querySnapshot) => {
            const recipes = [];
            querySnapshot.forEach((doc) => {
                recipes.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Convert to JSON string
            const recipesJson = JSON.stringify(recipes, null, 2);
            
            // Create blob and download link
            const blob = new Blob([recipesJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'my_recipes.json';
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
        })
        .catch((error) => {
            console.error("Error exporting recipes:", error);
            showNotification('Error exporting recipes: ' + error.message, true);
        });
}

// Import recipes from JSON file
function importRecipes(fileContent) {
    try {
        const recipes = JSON.parse(fileContent);
        
        if (!Array.isArray(recipes)) {
            throw new Error("Invalid recipes format");
        }
        
        // Batch add recipes to Firestore
        const batch = db.batch();
        
        recipes.forEach(recipe => {
            // Remove id field if present
            const { id, ...recipeData } = recipe;
            
            // Make sure createdAt is a Firestore timestamp
            if (recipeData.createdAt) {
                recipeData.createdAt = new Date(recipeData.createdAt);
            } else {
                recipeData.createdAt = new Date();
            }
            
            // Create a new document reference
            const newRecipeRef = db.collection("recipes").doc();
            batch.set(newRecipeRef, recipeData);
        });
        
        return batch.commit()
            .then(() => {
                showNotification(`Successfully imported ${recipes.length} recipes!`);
                loadRecipes(); // Refresh the list
                return true;
            });
    } catch (error) {
        console.error("Error importing recipes:", error);
        showNotification('Error importing recipes: ' + error.message, true);
        return false;
    }
}

// Set up import button and file handler
const importBtn = document.getElementById('import-btn');
const exportBtn = document.getElementById('export-btn');
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.json';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

if (importBtn) {
    importBtn.addEventListener('click', () => {
        fileInput.click();
    });
}

if (exportBtn) {
    exportBtn.addEventListener('click', exportRecipes);
}

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        importRecipes(event.target.result);
    };
    reader.readAsText(file);
    
    // Reset file input
    fileInput.value = '';
});

// Initialize the app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);



