const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const randomBtn = document.getElementById("random-btn");
const leftoverBtn = document.getElementById("leftover-btn");
const categoryFilter = document.getElementById("category-filter");
const recipesContainer = document.getElementById("recipes-container");
const modal = document.getElementById("recipe-modal");
const closeBtn = document.querySelector(".close-btn");
const modalRecipeDetails = document.getElementById("modal-recipe-details");
const cookingView = document.getElementById("cooking-view");
const cookingRecipeTitle = document.getElementById("cooking-recipe-title");
const currentStepDisplay = document.getElementById("current-step");
const prevStepBtn = document.getElementById("prev-step");
const nextStepBtn = document.getElementById("next-step");
const startTimerBtn = document.getElementById("start-timer");
const timerDisplay = document.getElementById("display-timer");
const exitCookingBtn = document.getElementById("exit-cooking-mode");
const caloriesDisplay = document.getElementById("calories-display");

// Global Variables
let currentRecipe = null;
let currentStep = 0;
let timerInterval = null;
let seconds = 0;

// Event Listeners
searchBtn.addEventListener("click", searchRecipes);
randomBtn.addEventListener("click", getRandomRecipe);
leftoverBtn.addEventListener("click", handleLeftoverSearch);
closeBtn.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
});
exitCookingBtn.addEventListener("click", exitCookingMode);

// Initialize
window.addEventListener("DOMContentLoaded", () => {
    fetchIndianRecipes();
});

// Main Functions
async function fetchIndianRecipes() {
    try {
        const response = await fetch(
            "https://www.themealdb.com/api/json/v1/1/filter.php?a=Indian"
        );
        const data = await response.json();
        if (data.meals) {
            displayRecipes(data.meals);
        } else {
            showError("No Indian recipes found. Try again later.");
        }
    } catch (error) {
        console.error("Error fetching recipes:", error);
        showError("Failed to load recipes. Check your connection.");
    }
}

async function searchRecipes() {
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) return;

    try {
        const response = await fetch(
            `https://www.themealdb.com/api/json/v1/1/search.php?s=${searchTerm}`
        );
        const data = await response.json();
        if (data.meals) {
            displayRecipes(data.meals);
        } else {
            showError(`No recipes found for "${searchTerm}". Try another search.`);
        }
    } catch (error) {
        console.error("Error searching recipes:", error);
        showError("Search failed. Try again later.");
    }
}

async function getRandomRecipe() {
    try {
        const response = await fetch(
            "https://www.themealdb.com/api/json/v1/1/random.php"
        );
        const data = await response.json();
        showRecipeDetails(data.meals[0]);
    } catch (error) {
        console.error("Error fetching random recipe:", error);
        showError("Couldn't load a random recipe. Try again.");
    }
}

async function handleLeftoverSearch() {
    const ingredients = prompt("Enter ingredients you have (comma separated):\nExample: chicken, rice, tomatoes");
    if (ingredients) {
        findRecipesByIngredients(ingredients.split(',').map(i => i.trim()));
    }
}

async function findRecipesByIngredients(ingredients) {
    try {
        const response = await fetch(
            `https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredients.join(',')}`
        );
        const data = await response.json();
        if (data.meals) {
            // Filter for Indian recipes or those without area specified
            const filtered = data.meals.filter(meal => 
                !meal.strArea || meal.strArea.toLowerCase() === 'indian'
            );
            if (filtered.length > 0) {
                displayRecipes(filtered);
            } else {
                showError("No Indian recipes found with those ingredients.");
            }
        } else {
            showError("No recipes found with those ingredients.");
        }
    } catch (error) {
        console.error("Error searching by ingredients:", error);
        showError("Search failed. Try again later.");
    }
}

// Display Functions
function displayRecipes(recipes) {
    recipesContainer.innerHTML = "";
    
    if (!recipes || recipes.length === 0) {
        showError("No recipes found.");
        return;
    }
    
    recipes.forEach(recipe => {
        const recipeCard = document.createElement("div");
        recipeCard.className = "recipe-card";
        recipeCard.innerHTML = `
            <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" loading="lazy">
            <div class="recipe-info">
                <h3>${recipe.strMeal}</h3>
                <button class="view-recipe-btn" onclick="getRecipeDetails('${recipe.idMeal}')">
                    View Recipe
                </button>
                <button class="cook-now-btn" onclick="getRecipeDetails('${recipe.idMeal}', true)">
                    <i class="fas fa-utensils"></i> Cook Now
                </button>
            </div>
        `;
        recipesContainer.appendChild(recipeCard);
    });
}

async function getRecipeDetails(mealId, startCooking = false) {
    try {
        const response = await fetch(
            `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`
        );
        const data = await response.json();
        currentRecipe = data.meals[0];
        
        if (startCooking) {
            startCookingMode(currentRecipe);
        } else {
            showRecipeDetails(currentRecipe);
        }
    } catch (error) {
        console.error("Error fetching recipe details:", error);
        showError("Couldn't load recipe details. Try again.");
    }
}

function showRecipeDetails(recipe) {
    const ingredients = getIngredientsList(recipe);
    const nutrition = estimateNutrition(recipe);
    
    modalRecipeDetails.innerHTML = `
        <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" loading="lazy">
        <h2>${recipe.strMeal}</h2>
        
        <div class="recipe-meta">
            <div><i class="fas fa-clock"></i> ${recipe.strCategory || 'N/A'}</div>
            <div><i class="fas fa-globe-asia"></i> ${recipe.strArea || 'Indian'}</div>
            <div><i class="fas fa-utensils"></i> ${getDifficulty(recipe)}</div>
            <div><i class="fas fa-fire"></i> ${nutrition.calories} kcal</div>
        </div>
        
        <div class="nutrition-chart">
            <div class="nutrition-bar" style="height: ${nutrition.protein}%; left: 0%; background: #3498db;" title="Protein"></div>
            <div class="nutrition-bar" style="height: ${nutrition.carbs}%; left: 26%; background: #e67e22;" title="Carbs"></div>
            <div class="nutrition-bar" style="height: ${nutrition.fat}%; left: 52%; background: #9b59b6;" title="Fat"></div>
            <div class="nutrition-bar" style="height: ${nutrition.fiber}%; left: 78%; background: #2ecc71;" title="Fiber"></div>
        </div>
        
        <div class="ingredients-list">
            <h3><i class="fas fa-carrot"></i> Ingredients</h3>
            <ul>${ingredients}</ul>
        </div>
        
        <div class="instructions-list">
            <h3><i class="fas fa-list-ol"></i> Instructions</h3>
            <ol>
                ${recipe.strInstructions
                    .split('\r\n')
                    .filter(step => step.trim() !== '')
                    .map(step => `<li>${step}</li>`)
                    .join('')}
            </ol>
        </div>
        
        <button onclick="shareRecipe('${recipe.strMeal}')" class="share-btn">
            <i class="fab fa-whatsapp"></i> Share Recipe
        </button>
    `;
    
    modal.style.display = "block";
}

// Cooking Mode Functions
function startCookingMode(recipe) {
    currentStep = 0;
    seconds = 0;
    clearInterval(timerInterval);
    
    const steps = recipe.strInstructions
        .split('\r\n')
        .filter(step => step.trim() !== '');
    
    cookingRecipeTitle.textContent = recipe.strMeal;
    updateStepDisplay(steps);
    updateNutritionDisplay(recipe);
    
    prevStepBtn.addEventListener("click", () => navigateStep(-1, steps));
    nextStepBtn.addEventListener("click", () => navigateStep(1, steps));
    startTimerBtn.addEventListener("click", startTimer);
    
    cookingView.style.display = "flex";
}

function updateStepDisplay(steps) {
    currentStepDisplay.innerHTML = `
        <h3>Step ${currentStep + 1}/${steps.length}</h3>
        <p>${steps[currentStep]}</p>
    `;
    
    prevStepBtn.disabled = currentStep === 0;
    nextStepBtn.disabled = currentStep === steps.length - 1;
}

function navigateStep(direction, steps) {
    currentStep = Math.max(0, Math.min(steps.length - 1, currentStep + direction));
    updateStepDisplay(steps);
}

function startTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        startTimerBtn.textContent = "⏱️ Start Timer";
    } else {
        timerInterval = setInterval(() => {
            seconds++;
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }, 1000);
        startTimerBtn.textContent = "⏸️ Pause Timer";
    }
}

function updateNutritionDisplay(recipe) {
    const nutrition = estimateNutrition(recipe);
    caloriesDisplay.textContent = nutrition.calories;
}

function exitCookingMode() {
    cookingView.style.display = "none";
    clearInterval(timerInterval);
    timerDisplay.textContent = "00:00";
    seconds = 0;
}

// Helper Functions
function getIngredientsList(recipe) {
    let ingredientsHtml = "";
    for (let i = 1; i <= 20; i++) {
        const ingredient = recipe[`strIngredient${i}`];
        const measure = recipe[`strMeasure${i}`];
        if (ingredient && ingredient.trim() !== "") {
            ingredientsHtml += `<li>${measure} ${ingredient}</li>`;
        }
    }
    return ingredientsHtml;
}

function estimateNutrition(recipe) {
    // Simple estimation - for real data use Edamam API
    const proteinSources = ['chicken', 'fish', 'meat', 'paneer', 'dal', 'lentils'];
    const hasProtein = proteinSources.some(source => 
        JSON.stringify(recipe).toLowerCase().includes(source)
    );
    
    const carbSources = ['rice', 'wheat', 'flour', 'potato', 'bread'];
    const hasCarbs = carbSources.some(source => 
        JSON.stringify(recipe).toLowerCase().includes(source)
    );
    
    return {
        calories: Math.floor(Math.random() * 400) + 200,
        protein: hasProtein ? Math.floor(Math.random() * 20) + 10 : 5,
        carbs: hasCarbs ? Math.floor(Math.random() * 40) + 20 : 10,
        fat: Math.floor(Math.random() * 15) + 5,
        fiber: Math.floor(Math.random() * 10) + 2
    };
}

function getDifficulty(recipe) {
    const time = parseInt(recipe.strTime) || 30;
    const steps = recipe.strInstructions.split('\r\n').filter(s => s.trim()).length;
    
    if (time > 60 || steps > 8) return "Hard";
    if (time > 30 || steps > 4) return "Medium";
    return "Easy";
}

function shareRecipe(recipeName) {
    const url = window.location.href.split('?')[0];
    const text = `Check out this delicious ${recipeName} recipe! ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
}

function showError(message) {
    recipesContainer.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>
    `;
}
