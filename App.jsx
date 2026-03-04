import { useState, useEffect, useCallback, useMemo } from "react";

// No predefined allergens — users type their own

// Location-based price adjustments (multiplier relative to Germany average)
const REGION_COST = {
  // Germany cities
  "munich": 1.15, "münchen": 1.15, "berlin": 1.0, "hamburg": 1.05,
  "düsseldorf": 1.05, "dusseldorf": 1.05, "frankfurt": 1.10, "cologne": 1.03, "köln": 1.03,
  "stuttgart": 1.08, "dortmund": 0.95, "essen": 0.95, "leipzig": 0.90, "dresden": 0.90,
  // Countries / regions
  "germany": 1.0, "deutschland": 1.0, "austria": 1.05, "österreich": 1.05,
  "switzerland": 1.55, "schweiz": 1.55, "netherlands": 1.10, "belgium": 1.05,
  "france": 1.08, "paris": 1.20, "italy": 1.0, "spain": 0.85, "portugal": 0.80,
  "uk": 1.05, "london": 1.25, "usa": 1.0, "new york": 1.30, "los angeles": 1.15,
  "poland": 0.65, "czech": 0.70, "greece": 0.85, "turkey": 0.55,
  "sweden": 1.20, "norway": 1.45, "denmark": 1.25, "finland": 1.15,
  "japan": 1.10, "tokyo": 1.20, "australia": 1.15, "canada": 1.05,
};

const getLocationMultiplier = (location) => {
  if (!location) return 1.0;
  const loc = location.toLowerCase().trim();
  for (const [key, mult] of Object.entries(REGION_COST)) {
    if (loc.includes(key)) return mult;
  }
  return 1.0;
};

// Store/market price multipliers (relative to average)
const STORE_COST = {
  "lidl": 0.82, "aldi": 0.80, "netto": 0.83, "penny": 0.84, "norma": 0.85,
  "rewe": 1.05, "edeka": 1.10, "kaufland": 0.92, "real": 0.95,
  "dm": 1.0, "rossmann": 1.0, "tegut": 1.08, "globus": 0.95, "hit": 1.05,
  "nahkauf": 1.02, "nah und gut": 1.03, "cap": 0.98, "combi": 0.98,
  "famila": 0.95, "marktkauf": 0.96, "e center": 1.08,
  "spar": 1.0, "billa": 1.02, "hofer": 0.80, "migros": 1.15, "coop": 1.18,
  "carrefour": 0.95, "tesco": 0.90, "asda": 0.85, "sainsbury": 1.0,
  "walmart": 0.82, "costco": 0.78, "whole foods": 1.25, "trader joe": 0.90,
  "albert heijn": 1.05, "jumbo": 0.95, "colruyt": 0.88,
};

const getStoreMultiplier = (store) => {
  if (!store) return 1.0;
  const s = store.toLowerCase().trim();
  for (const [key, mult] of Object.entries(STORE_COST)) {
    if (s.includes(key)) return mult;
  }
  return 1.0;
};

const RECIPES = [
  // ===== BREAKFAST (9) =====
  { id:"b1", title:"Egg & Spinach Power Bowl", category:"Breakfast", prepTime:12, servings:1, image:"🥚", allergens:["Eggs"], nutrition:{protein:32,carbs:18,sugar:2,calories:340}, brainBenefits:["Choline","Iron","Folate"], cost:2.8, ingredients:[{name:"Eggs",quantity:3,unit:"pc",category:"Dairy"},{name:"Spinach",quantity:100,unit:"g",category:"Produce"},{name:"Sweet Potato",quantity:150,unit:"g",category:"Produce"},{name:"Olive Oil",quantity:1,unit:"tbsp",category:"Pantry"},{name:"Turmeric",quantity:1,unit:"tsp",category:"Pantry"}], steps:["Dice & microwave sweet potato 5 min.","Sauté spinach in olive oil with turmeric.","Scramble eggs, combine in bowl."] },
  { id:"b2", title:"Greek Yogurt Protein Parfait", category:"Breakfast", prepTime:5, servings:1, image:"🫐", allergens:["Dairy","Nuts"], nutrition:{protein:35,carbs:28,sugar:8,calories:380}, brainBenefits:["Omega-3","Antioxidants","Probiotics"], cost:3.5, ingredients:[{name:"Greek Yogurt (0% fat)",quantity:250,unit:"g",category:"Dairy"},{name:"Walnuts",quantity:30,unit:"g",category:"Pantry"},{name:"Blueberries",quantity:80,unit:"g",category:"Produce"},{name:"Chia Seeds",quantity:1,unit:"tbsp",category:"Pantry"},{name:"Cinnamon",quantity:1,unit:"tsp",category:"Pantry"}], steps:["Layer yogurt in a glass.","Add blueberries & walnuts.","Top with chia seeds & cinnamon."] },
  { id:"b3", title:"Smoked Salmon Omelette", category:"Breakfast", prepTime:10, servings:1, image:"🍳", allergens:["Eggs","Fish"], nutrition:{protein:38,carbs:4,sugar:1,calories:350}, brainBenefits:["Omega-3 DHA","B12","Choline"], cost:5.2, ingredients:[{name:"Eggs",quantity:3,unit:"pc",category:"Dairy"},{name:"Smoked Salmon",quantity:60,unit:"g",category:"Meat"},{name:"Avocado",quantity:0.5,unit:"pc",category:"Produce"},{name:"Dill",quantity:1,unit:"tbsp",category:"Produce"},{name:"Olive Oil",quantity:1,unit:"tsp",category:"Pantry"}], steps:["Whisk eggs, cook in oiled pan.","Fill with salmon & sliced avocado.","Fold, garnish with dill."] },
  { id:"b4", title:"Cottage Cheese & Oat Bowl", category:"Breakfast", prepTime:8, servings:1, image:"🥣", allergens:["Dairy","Gluten"], nutrition:{protein:34,carbs:40,sugar:5,calories:410}, brainBenefits:["B Vitamins","Magnesium","Tryptophan"], cost:2.4, ingredients:[{name:"Cottage Cheese",quantity:200,unit:"g",category:"Dairy"},{name:"Rolled Oats",quantity:50,unit:"g",category:"Pantry"},{name:"Banana",quantity:0.5,unit:"pc",category:"Produce"},{name:"Flaxseed",quantity:1,unit:"tbsp",category:"Pantry"},{name:"Cinnamon",quantity:1,unit:"tsp",category:"Pantry"}], steps:["Cook oats with water.","Top with cottage cheese & sliced banana.","Sprinkle flaxseed & cinnamon."] },
  { id:"b5", title:"Turkey & Avocado Breakfast Wrap", category:"Breakfast", prepTime:8, servings:1, image:"🌯", allergens:["Gluten","Eggs"], nutrition:{protein:36,carbs:32,sugar:3,calories:420}, brainBenefits:["Tryptophan","Healthy Fats","B6"], cost:3.6, ingredients:[{name:"Whole Wheat Tortilla",quantity:1,unit:"pc",category:"Bakery"},{name:"Turkey Breast Slices",quantity:100,unit:"g",category:"Meat"},{name:"Eggs",quantity:2,unit:"pc",category:"Dairy"},{name:"Avocado",quantity:0.5,unit:"pc",category:"Produce"},{name:"Spinach",quantity:30,unit:"g",category:"Produce"}], steps:["Scramble eggs.","Layer turkey, eggs, avocado & spinach on tortilla.","Roll tightly & slice."] },
  { id:"b6", title:"Protein Overnight Oats", category:"Breakfast", prepTime:5, servings:1, image:"🫙", allergens:["Dairy","Gluten","Nuts"], nutrition:{protein:30,carbs:42,sugar:6,calories:400}, brainBenefits:["Omega-3","Fiber","Magnesium"], cost:2.9, ingredients:[{name:"Rolled Oats",quantity:60,unit:"g",category:"Pantry"},{name:"Protein Powder (Whey)",quantity:30,unit:"g",category:"Pantry"},{name:"Almond Milk",quantity:200,unit:"ml",category:"Dairy"},{name:"Almonds",quantity:20,unit:"g",category:"Pantry"},{name:"Chia Seeds",quantity:1,unit:"tbsp",category:"Pantry"}], steps:["Mix oats, protein powder, milk & chia seeds.","Refrigerate overnight.","Top with almonds before eating."] },
  { id:"b7", title:"Sardine Toast with Greens", category:"Breakfast", prepTime:7, servings:1, image:"🐟", allergens:["Fish","Gluten"], nutrition:{protein:28,carbs:22,sugar:2,calories:320}, brainBenefits:["Omega-3 DHA","Calcium","Vitamin D"], cost:3.1, ingredients:[{name:"Whole Grain Bread",quantity:2,unit:"slices",category:"Bakery"},{name:"Sardines (canned)",quantity:120,unit:"g",category:"Pantry"},{name:"Arugula",quantity:40,unit:"g",category:"Produce"},{name:"Lemon",quantity:0.5,unit:"pc",category:"Produce"},{name:"Olive Oil",quantity:1,unit:"tsp",category:"Pantry"}], steps:["Toast bread.","Top with sardines & arugula.","Squeeze lemon, drizzle olive oil."] },
  { id:"b8", title:"Quinoa Egg Scramble", category:"Breakfast", prepTime:15, servings:1, image:"🍲", allergens:["Eggs"], nutrition:{protein:30,carbs:35,sugar:3,calories:390}, brainBenefits:["Complete Protein","Iron","Magnesium"], cost:2.5, ingredients:[{name:"Quinoa",quantity:80,unit:"g",category:"Pantry"},{name:"Eggs",quantity:2,unit:"pc",category:"Dairy"},{name:"Bell Pepper",quantity:1,unit:"pc",category:"Produce"},{name:"Kale",quantity:50,unit:"g",category:"Produce"},{name:"Olive Oil",quantity:1,unit:"tbsp",category:"Pantry"}], steps:["Cook quinoa.","Sauté peppers & kale.","Scramble eggs, mix all together."] },
  { id:"b9", title:"Peanut Butter Banana Smoothie", category:"Breakfast", prepTime:5, servings:1, image:"🥤", allergens:["Nuts","Dairy"], nutrition:{protein:32,carbs:38,sugar:10,calories:420}, brainBenefits:["Potassium","Healthy Fats","Vitamin E"], cost:3.0, ingredients:[{name:"Protein Powder (Whey)",quantity:30,unit:"g",category:"Pantry"},{name:"Peanut Butter (natural)",quantity:2,unit:"tbsp",category:"Pantry"},{name:"Banana",quantity:1,unit:"pc",category:"Produce"},{name:"Milk",quantity:250,unit:"ml",category:"Dairy"},{name:"Spinach",quantity:30,unit:"g",category:"Produce"}], steps:["Blend all ingredients until smooth.","Pour and serve immediately."] },

  // ===== LUNCH (10) =====
  { id:"l1", title:"Grilled Chicken & Quinoa Bowl", category:"Lunch", prepTime:25, servings:2, image:"🍗", allergens:[], nutrition:{protein:42,carbs:38,sugar:4,calories:480}, brainBenefits:["Complete Protein","Iron","B6"], cost:5.5, ingredients:[{name:"Chicken Breast",quantity:300,unit:"g",category:"Meat"},{name:"Quinoa",quantity:150,unit:"g",category:"Pantry"},{name:"Broccoli",quantity:200,unit:"g",category:"Produce"},{name:"Avocado",quantity:1,unit:"pc",category:"Produce"},{name:"Olive Oil",quantity:2,unit:"tbsp",category:"Pantry"},{name:"Lemon",quantity:1,unit:"pc",category:"Produce"}], steps:["Cook quinoa.","Grill seasoned chicken breast 6 min per side.","Steam broccoli.","Assemble bowl, top with avocado & lemon."] },
  { id:"l2", title:"Tuna & Black Bean Salad", category:"Lunch", prepTime:10, servings:2, image:"🥗", allergens:["Fish"], nutrition:{protein:38,carbs:30,sugar:3,calories:390}, brainBenefits:["Omega-3 DHA","Folate","Fiber"], cost:3.8, ingredients:[{name:"Tuna (canned in water)",quantity:200,unit:"g",category:"Pantry"},{name:"Black Beans",quantity:200,unit:"g",category:"Pantry"},{name:"Cherry Tomatoes",quantity:150,unit:"g",category:"Produce"},{name:"Red Onion",quantity:0.5,unit:"pc",category:"Produce"},{name:"Olive Oil",quantity:2,unit:"tbsp",category:"Pantry"},{name:"Lime",quantity:1,unit:"pc",category:"Produce"}], steps:["Drain tuna & beans.","Halve tomatoes, dice onion.","Combine all, dress with olive oil & lime."] },
  { id:"l3", title:"Turkey Lettuce Wraps", category:"Lunch", prepTime:15, servings:2, image:"🥬", allergens:["Soy"], nutrition:{protein:36,carbs:12,sugar:3,calories:310}, brainBenefits:["Tryptophan","B12","Zinc"], cost:4.8, ingredients:[{name:"Ground Turkey",quantity:300,unit:"g",category:"Meat"},{name:"Romaine Lettuce",quantity:1,unit:"head",category:"Produce"},{name:"Carrot",quantity:2,unit:"pc",category:"Produce"},{name:"Soy Sauce (low sodium)",quantity:2,unit:"tbsp",category:"Pantry"},{name:"Garlic",quantity:3,unit:"cloves",category:"Produce"},{name:"Ginger",quantity:1,unit:"pc",category:"Produce"}], steps:["Cook turkey with garlic & ginger.","Add soy sauce & grated carrot.","Spoon into lettuce cups."] },
  { id:"l4", title:"Salmon & Sweet Potato Plate", category:"Lunch", prepTime:25, servings:2, image:"🐟", allergens:["Fish"], nutrition:{protein:40,carbs:35,sugar:5,calories:460}, brainBenefits:["Omega-3 DHA","Beta Carotene","Vitamin D"], cost:7.2, ingredients:[{name:"Salmon Fillet",quantity:2,unit:"pc",category:"Meat"},{name:"Sweet Potato",quantity:300,unit:"g",category:"Produce"},{name:"Asparagus",quantity:200,unit:"g",category:"Produce"},{name:"Olive Oil",quantity:2,unit:"tbsp",category:"Pantry"},{name:"Garlic",quantity:2,unit:"cloves",category:"Produce"}], steps:["Bake sweet potato at 200C for 25 min.","Pan-sear salmon 4 min per side.","Grill asparagus with garlic & oil."] },
  { id:"l5", title:"Chicken & Lentil Soup", category:"Lunch", prepTime:30, servings:3, image:"🍜", allergens:[], nutrition:{protein:38,carbs:36,sugar:4,calories:420}, brainBenefits:["Iron","Folate","B6"], cost:4.2, ingredients:[{name:"Chicken Breast",quantity:250,unit:"g",category:"Meat"},{name:"Red Lentils",quantity:200,unit:"g",category:"Pantry"},{name:"Carrot",quantity:2,unit:"pc",category:"Produce"},{name:"Celery",quantity:2,unit:"stalks",category:"Produce"},{name:"Onion",quantity:1,unit:"pc",category:"Produce"},{name:"Turmeric",quantity:1,unit:"tsp",category:"Pantry"}], steps:["Sauté onion, carrot & celery.","Add lentils, chicken & turmeric with 1L water.","Simmer 25 min, shred chicken."] },
  { id:"l6", title:"Beef & Brown Rice Stir-Fry", category:"Lunch", prepTime:20, servings:2, image:"🥩", allergens:["Soy"], nutrition:{protein:40,carbs:42,sugar:4,calories:500}, brainBenefits:["Iron","Zinc","B12"], cost:5.8, ingredients:[{name:"Lean Beef Strips",quantity:250,unit:"g",category:"Meat"},{name:"Brown Rice",quantity:200,unit:"g",category:"Pantry"},{name:"Broccoli",quantity:150,unit:"g",category:"Produce"},{name:"Bell Pepper",quantity:1,unit:"pc",category:"Produce"},{name:"Soy Sauce (low sodium)",quantity:2,unit:"tbsp",category:"Pantry"},{name:"Sesame Oil",quantity:1,unit:"tbsp",category:"Pantry"}], steps:["Cook brown rice.","Stir-fry beef in sesame oil.","Add vegetables & soy sauce.","Serve over rice."] },
  { id:"l7", title:"Egg & Chickpea Shakshuka", category:"Lunch", prepTime:20, servings:2, image:"🍳", allergens:["Eggs"], nutrition:{protein:28,carbs:30,sugar:6,calories:360}, brainBenefits:["Choline","Folate","Lycopene"], cost:3.2, ingredients:[{name:"Eggs",quantity:4,unit:"pc",category:"Dairy"},{name:"Chickpeas",quantity:200,unit:"g",category:"Pantry"},{name:"Canned Tomatoes",quantity:400,unit:"g",category:"Pantry"},{name:"Onion",quantity:1,unit:"pc",category:"Produce"},{name:"Cumin",quantity:1,unit:"tsp",category:"Pantry"},{name:"Garlic",quantity:2,unit:"cloves",category:"Produce"}], steps:["Sauté onion & garlic with cumin.","Add tomatoes & chickpeas, simmer 10 min.","Make wells, crack in eggs, cover until set."] },
  { id:"l8", title:"Shrimp & Edamame Bowl", category:"Lunch", prepTime:15, servings:2, image:"🦐", allergens:["Shellfish","Soy"], nutrition:{protein:40,carbs:28,sugar:3,calories:400}, brainBenefits:["Omega-3","Selenium","B12"], cost:6.5, ingredients:[{name:"Shrimp",quantity:250,unit:"g",category:"Meat"},{name:"Edamame",quantity:150,unit:"g",category:"Frozen"},{name:"Brown Rice",quantity:150,unit:"g",category:"Pantry"},{name:"Cucumber",quantity:1,unit:"pc",category:"Produce"},{name:"Soy Sauce (low sodium)",quantity:2,unit:"tbsp",category:"Pantry"},{name:"Sesame Seeds",quantity:1,unit:"tbsp",category:"Pantry"}], steps:["Cook rice & edamame.","Sauté shrimp with soy sauce.","Assemble bowl, top with cucumber & sesame."] },
  { id:"l9", title:"Mediterranean Chicken Salad", category:"Lunch", prepTime:15, servings:2, image:"🥗", allergens:["Dairy"], nutrition:{protein:38,carbs:18,sugar:4,calories:380}, brainBenefits:["Polyphenols","Healthy Fats","Vitamin K"], cost:4.8, ingredients:[{name:"Chicken Breast",quantity:250,unit:"g",category:"Meat"},{name:"Mixed Greens",quantity:150,unit:"g",category:"Produce"},{name:"Cherry Tomatoes",quantity:100,unit:"g",category:"Produce"},{name:"Feta Cheese",quantity:50,unit:"g",category:"Dairy"},{name:"Olives",quantity:50,unit:"g",category:"Pantry"},{name:"Olive Oil",quantity:2,unit:"tbsp",category:"Pantry"}], steps:["Grill & slice chicken.","Toss greens, tomatoes & olives.","Top with chicken & feta, drizzle oil."] },
  { id:"l10", title:"Tofu & Vegetable Stir-Fry", category:"Lunch", prepTime:18, servings:2, image:"🥦", allergens:["Soy"], nutrition:{protein:26,carbs:30,sugar:4,calories:340}, brainBenefits:["Isoflavones","Iron","Magnesium"], cost:3.5, ingredients:[{name:"Firm Tofu",quantity:300,unit:"g",category:"Produce"},{name:"Broccoli",quantity:150,unit:"g",category:"Produce"},{name:"Bell Pepper",quantity:1,unit:"pc",category:"Produce"},{name:"Brown Rice",quantity:150,unit:"g",category:"Pantry"},{name:"Soy Sauce (low sodium)",quantity:2,unit:"tbsp",category:"Pantry"},{name:"Garlic",quantity:2,unit:"cloves",category:"Produce"}], steps:["Press & cube tofu, pan-fry until crispy.","Stir-fry vegetables with garlic.","Combine with soy sauce, serve over rice."] },

  // ===== DINNER (9) =====
  { id:"d1", title:"Grilled Salmon & Broccoli", category:"Dinner", prepTime:20, servings:2, image:"🐟", allergens:["Fish"], nutrition:{protein:44,carbs:15,sugar:2,calories:450}, brainBenefits:["Omega-3 DHA","Vitamin D","Selenium"], cost:7.5, ingredients:[{name:"Salmon Fillet",quantity:2,unit:"pc",category:"Meat"},{name:"Broccoli",quantity:300,unit:"g",category:"Produce"},{name:"Lemon",quantity:1,unit:"pc",category:"Produce"},{name:"Olive Oil",quantity:2,unit:"tbsp",category:"Pantry"},{name:"Garlic",quantity:3,unit:"cloves",category:"Produce"}], steps:["Season salmon with lemon, garlic & oil.","Grill 5 min per side.","Steam broccoli, serve together."] },
  { id:"d2", title:"Lean Beef & Sweet Potato Mash", category:"Dinner", prepTime:30, servings:2, image:"🥩", allergens:[], nutrition:{protein:46,carbs:40,sugar:6,calories:520}, brainBenefits:["Iron","B12","Beta Carotene"], cost:7.8, ingredients:[{name:"Lean Beef Steak",quantity:300,unit:"g",category:"Meat"},{name:"Sweet Potato",quantity:400,unit:"g",category:"Produce"},{name:"Green Beans",quantity:200,unit:"g",category:"Produce"},{name:"Olive Oil",quantity:1,unit:"tbsp",category:"Pantry"},{name:"Rosemary",quantity:1,unit:"sprig",category:"Produce"}], steps:["Boil & mash sweet potato.","Grill steak with rosemary to preference.","Steam green beans, plate together."] },
  { id:"d3", title:"Chicken Breast & Brown Rice", category:"Dinner", prepTime:25, servings:2, image:"🍗", allergens:[], nutrition:{protein:44,carbs:42,sugar:3,calories:490}, brainBenefits:["B6","Niacin","Magnesium"], cost:4.9, ingredients:[{name:"Chicken Breast",quantity:300,unit:"g",category:"Meat"},{name:"Brown Rice",quantity:200,unit:"g",category:"Pantry"},{name:"Zucchini",quantity:2,unit:"pc",category:"Produce"},{name:"Olive Oil",quantity:2,unit:"tbsp",category:"Pantry"},{name:"Garlic",quantity:2,unit:"cloves",category:"Produce"},{name:"Lemon",quantity:1,unit:"pc",category:"Produce"}], steps:["Cook brown rice.","Grill chicken with garlic & lemon.","Sauté sliced zucchini, serve together."] },
  { id:"d4", title:"Turkey Meatballs & Lentils", category:"Dinner", prepTime:30, servings:3, image:"🧆", allergens:["Eggs","Gluten"], nutrition:{protein:42,carbs:34,sugar:5,calories:460}, brainBenefits:["Tryptophan","Folate","Iron"], cost:5.2, ingredients:[{name:"Ground Turkey",quantity:400,unit:"g",category:"Meat"},{name:"Green Lentils",quantity:200,unit:"g",category:"Pantry"},{name:"Eggs",quantity:1,unit:"pc",category:"Dairy"},{name:"Breadcrumbs (whole wheat)",quantity:40,unit:"g",category:"Pantry"},{name:"Canned Tomatoes",quantity:400,unit:"g",category:"Pantry"},{name:"Garlic",quantity:3,unit:"cloves",category:"Produce"}], steps:["Mix turkey, egg & breadcrumbs into balls.","Cook lentils.","Simmer meatballs in tomato sauce 15 min.","Serve over lentils."] },
  { id:"d5", title:"Mackerel & Roasted Vegetables", category:"Dinner", prepTime:25, servings:2, image:"🐠", allergens:["Fish"], nutrition:{protein:38,carbs:22,sugar:5,calories:430}, brainBenefits:["Omega-3 DHA/EPA","Vitamin D","Selenium"], cost:5.5, ingredients:[{name:"Mackerel Fillet",quantity:2,unit:"pc",category:"Meat"},{name:"Bell Pepper",quantity:2,unit:"pc",category:"Produce"},{name:"Zucchini",quantity:1,unit:"pc",category:"Produce"},{name:"Red Onion",quantity:1,unit:"pc",category:"Produce"},{name:"Olive Oil",quantity:2,unit:"tbsp",category:"Pantry"},{name:"Thyme",quantity:1,unit:"tsp",category:"Pantry"}], steps:["Roast diced vegetables at 200C for 20 min.","Pan-fry mackerel 3 min per side.","Plate together, drizzle oil & thyme."] },
  { id:"d6", title:"Chicken Thigh & Kale Bowl", category:"Dinner", prepTime:25, servings:2, image:"🥬", allergens:[], nutrition:{protein:40,carbs:30,sugar:3,calories:440}, brainBenefits:["Vitamin K","Lutein","Iron"], cost:4.6, ingredients:[{name:"Chicken Thigh (boneless)",quantity:300,unit:"g",category:"Meat"},{name:"Kale",quantity:150,unit:"g",category:"Produce"},{name:"Quinoa",quantity:150,unit:"g",category:"Pantry"},{name:"Olive Oil",quantity:2,unit:"tbsp",category:"Pantry"},{name:"Lemon",quantity:1,unit:"pc",category:"Produce"},{name:"Garlic",quantity:2,unit:"cloves",category:"Produce"}], steps:["Cook quinoa.","Grill chicken thigh until done.","Massage kale with lemon & oil.","Assemble bowl."] },
  { id:"d7", title:"Baked Cod & Cauliflower Rice", category:"Dinner", prepTime:22, servings:2, image:"🐟", allergens:["Fish"], nutrition:{protein:40,carbs:12,sugar:3,calories:340}, brainBenefits:["Omega-3","Iodine","B12"], cost:6.2, ingredients:[{name:"Cod Fillet",quantity:300,unit:"g",category:"Meat"},{name:"Cauliflower",quantity:1,unit:"head",category:"Produce"},{name:"Cherry Tomatoes",quantity:150,unit:"g",category:"Produce"},{name:"Olive Oil",quantity:2,unit:"tbsp",category:"Pantry"},{name:"Parsley",quantity:2,unit:"tbsp",category:"Produce"},{name:"Lemon",quantity:1,unit:"pc",category:"Produce"}], steps:["Rice the cauliflower, sauté in oil.","Bake cod at 190C for 15 min with tomatoes.","Serve cod over cauliflower rice."] },
  { id:"d8", title:"Pork Tenderloin & Roast Veggies", category:"Dinner", prepTime:30, servings:2, image:"🍖", allergens:[], nutrition:{protein:42,carbs:28,sugar:5,calories:440}, brainBenefits:["Thiamine","B6","Zinc"], cost:5.8, ingredients:[{name:"Pork Tenderloin",quantity:300,unit:"g",category:"Meat"},{name:"Brussels Sprouts",quantity:200,unit:"g",category:"Produce"},{name:"Sweet Potato",quantity:200,unit:"g",category:"Produce"},{name:"Olive Oil",quantity:2,unit:"tbsp",category:"Pantry"},{name:"Garlic",quantity:3,unit:"cloves",category:"Produce"}], steps:["Roast halved sprouts & diced sweet potato at 200C.","Season & sear tenderloin, then bake 15 min.","Rest 5 min, slice & serve."] },
  { id:"d9", title:"High-Protein Egg Fried Rice", category:"Dinner", prepTime:15, servings:2, image:"🍚", allergens:["Eggs","Soy"], nutrition:{protein:32,carbs:44,sugar:3,calories:440}, brainBenefits:["Choline","Selenium","B Vitamins"], cost:3.8, ingredients:[{name:"Eggs",quantity:4,unit:"pc",category:"Dairy"},{name:"Brown Rice (cooked)",quantity:300,unit:"g",category:"Pantry"},{name:"Chicken Breast",quantity:150,unit:"g",category:"Meat"},{name:"Peas",quantity:100,unit:"g",category:"Frozen"},{name:"Soy Sauce (low sodium)",quantity:2,unit:"tbsp",category:"Pantry"},{name:"Sesame Oil",quantity:1,unit:"tbsp",category:"Pantry"}], steps:["Stir-fry diced chicken.","Push aside, scramble eggs.","Add rice, peas & soy sauce.","Toss together, finish with sesame oil."] },
];

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MEAL_TYPES = ["Breakfast","Lunch","Dinner"];

export default function MealCartApp() {
  const [activeTab, setActiveTab] = useState("home");
  const [subView, setSubView] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [selectingSlot, setSelectingSlot] = useState(null);
  const [setupComplete, setSetupComplete] = useState(false);
  const [userName, setUserName] = useState("");
  const [userAllergies, setUserAllergies] = useState([]);
  const [servingSize, setServingSize] = useState(2);
  const [userLocation, setUserLocation] = useState("");
  const [weeklyBudget, setWeeklyBudget] = useState("");
  const [userStore, setUserStore] = useState("");
  const [mealPlan, setMealPlan] = useState({});
  const [weekNumber, setWeekNumber] = useState(1);
  const [pastWeekRecipes, setPastWeekRecipes] = useState([]);
  const [shoppingLists, setShoppingLists] = useState([]);
  const [activeListId, setActiveListId] = useState(null);
  const [newItemName, setNewItemName] = useState("");
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [recipeFilter, setRecipeFilter] = useState("All");
  const [recipeSearch, setRecipeSearch] = useState("");
  const [newAllergyInput, setNewAllergyInput] = useState("");

  const isAllergenIngredient = useCallback((ingredientName) => {
    if (!userAllergies.length) return false;
    const ln = ingredientName.toLowerCase();
    return userAllergies.some(a => ln.includes(a.toLowerCase()));
  }, [userAllergies]);

  const recipeHasAllergen = useCallback((recipe) => {
    if (!userAllergies.length) return false;
    return recipe.ingredients.some(ing => isAllergenIngredient(ing.name));
  }, [userAllergies, isAllergenIngredient]);

  const getMatchedAllergens = useCallback((recipe) => {
    if (!userAllergies.length) return [];
    const matched = new Set();
    recipe.ingredients.forEach(ing => {
      const ln = ing.name.toLowerCase();
      userAllergies.forEach(a => { if (ln.includes(a.toLowerCase())) matched.add(a); });
    });
    return [...matched];
  }, [userAllergies]);

  const addAllergy = () => { const v = newAllergyInput.trim(); if (v && !userAllergies.some(a => a.toLowerCase() === v.toLowerCase())) { setUserAllergies(p => [...p, v]); } setNewAllergyInput(""); };
  const removeAllergy = (a) => setUserAllergies(p => p.filter(x => x !== a));

  const getRecipeById = (id) => RECIPES.find(r => r.id === id);
  const recentlyPurchased = useCallback((n) => { const t = Date.now()-7*24*60*60*1000; return purchaseHistory.some(p => p.name.toLowerCase()===n.toLowerCase() && p.date>t); }, [purchaseHistory]);
  const itemExistsOnOtherList = useCallback((n, eid) => shoppingLists.some(l => l.id!==eid && l.items.some(i => i.name.toLowerCase()===n.toLowerCase() && !i.checked)), [shoppingLists]);

  // Location multiplier
  const costMultiplier = useMemo(() => getLocationMultiplier(userLocation) * getStoreMultiplier(userStore), [userLocation, userStore]);
  const getRecipeCost = useCallback((r) => Math.round(r.cost * costMultiplier * 100) / 100, [costMultiplier]);

  // SMART SUGGESTION — budget-aware, location-adjusted, never repeats
  const suggestWeekPlan = useCallback(() => {
    const shuffle = a => { const b=[...a]; for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];} return b; };
    const budget = weeklyBudget ? parseFloat(weeklyBudget) : Infinity;

    const pick = (cat, n) => {
      const all = RECIPES.filter(r => r.category === cat);
      const fresh = shuffle(all.filter(r => !pastWeekRecipes.includes(r.id)));
      const stale = shuffle(all.filter(r => pastWeekRecipes.includes(r.id)));
      // Sort by cost (cheapest first) if budget is tight
      const sorted = [...fresh, ...stale];
      if (budget < Infinity) sorted.sort((a, b) => a.cost - b.cost);
      return sorted.slice(0, n);
    };

    // Try to fit within budget
    let attempts = 0;
    let bestPlan = null;
    let bestCost = Infinity;

    while (attempts < 10) {
      const b = pick("Breakfast", 7), l = pick("Lunch", 7), d = pick("Dinner", 7);
      const plan = {};
      let totalCost = 0;

      DAYS.forEach((day, i) => {
        const meals = [b[i], l[i], d[i]].filter(Boolean);
        meals.forEach(m => { totalCost += m.cost * costMultiplier; });
        if (b[i]) plan[day + "-Breakfast"] = b[i].id;
        if (l[i]) plan[day + "-Lunch"] = l[i].id;
        if (d[i]) plan[day + "-Dinner"] = d[i].id;
      });

      if (totalCost <= budget) {
        setMealPlan(plan);
        return;
      }

      if (totalCost < bestCost) {
        bestCost = totalCost;
        bestPlan = plan;
      }
      attempts++;
    }

    // If no plan fits budget perfectly, use the cheapest attempt
    // and trim expensive meals to fit
    if (bestPlan && budget < Infinity) {
      const entries = Object.entries(bestPlan);
      let total = entries.reduce((s, [, id]) => s + getRecipeById(id).cost * costMultiplier, 0);
      // Remove most expensive meals until under budget
      const sorted = entries.sort((a, b) => getRecipeById(b[1]).cost - getRecipeById(a[1]).cost);
      const plan = { ...bestPlan };
      for (const [slot, id] of sorted) {
        if (total <= budget) break;
        total -= getRecipeById(id).cost * costMultiplier;
        delete plan[slot];
      }
      setMealPlan(plan);
    } else if (bestPlan) {
      setMealPlan(bestPlan);
    }
  }, [pastWeekRecipes, weeklyBudget, costMultiplier]);

  const finalizeWeek = useCallback(() => {
    setPastWeekRecipes(prev => [...prev, ...Object.values(mealPlan)]);
    setMealPlan({});
    setWeekNumber(prev => prev + 1);
  }, [mealPlan]);

  const generateShoppingList = useCallback(() => {
    const m = {};
    Object.values(mealPlan).forEach(id => { const r=getRecipeById(id); if(!r)return; r.ingredients.forEach(ing => { const k=ing.name.toLowerCase(); if(m[k]) m[k].quantity+=ing.quantity; else m[k]={...ing}; }); });
    const items = Object.values(m).map((ing,i) => ({id:`a-${i}`,name:ing.name,quantity:Math.round(ing.quantity*10)/10,unit:ing.unit,category:ing.category,checked:false}));
    const totalCost = items.reduce((s, item) => s, 0);
    const nl = {id:`list-${Date.now()}`,title:`Week ${weekNumber}${userStore?" · 🏪 "+userStore:""}`,createdAt:Date.now(),isAutoGenerated:true,estimatedCost:Math.round(weeklyNutrition.cost),items:items.sort((a,b)=>a.category.localeCompare(b.category))};
    setShoppingLists(prev => [nl,...prev]); setActiveListId(nl.id); setActiveTab("list");
  }, [mealPlan, weekNumber]);

  const createManualList = () => { const nl={id:`list-${Date.now()}`,title:`Shopping List - ${new Date().toLocaleDateString()}`,createdAt:Date.now(),isAutoGenerated:false,items:[]}; setShoppingLists(p=>[nl,...p]); setActiveListId(nl.id); };
  const toggleItem = (lid,iid) => { setShoppingLists(p=>p.map(l=>{if(l.id!==lid)return l;return{...l,items:l.items.map(i=>{if(i.id!==iid)return i;const c=!i.checked;if(c)setPurchaseHistory(h=>[...h,{name:i.name,date:Date.now()}]);return{...i,checked:c};})};})); };
  const addItemToList = (lid) => { if(!newItemName.trim())return; setShoppingLists(p=>p.map(l=>{if(l.id!==lid)return l;return{...l,items:[...l.items,{id:`i-${Date.now()}`,name:newItemName.trim(),quantity:1,unit:"pc",category:"Other",checked:false}]};})); setNewItemName(""); };
  const removeItem = (lid,iid) => { setShoppingLists(p=>p.map(l=>{if(l.id!==lid)return l;return{...l,items:l.items.filter(i=>i.id!==iid)};})); };
  const deleteList = (lid) => { setShoppingLists(p=>p.filter(l=>l.id!==lid)); if(activeListId===lid) setActiveListId(null); };
  const assignRecipe = (rid) => { if(!selectingSlot)return; setMealPlan(p=>({...p,[selectingSlot]:rid})); setSelectingSlot(null); setSubView(null); };
  const clearSlot = (s) => { setMealPlan(p=>{const n={...p};delete n[s];return n;}); };

  const filteredRecipes = useMemo(() => RECIPES.filter(r => { if(recipeFilter!=="All"&&r.category!==recipeFilter)return false; if(recipeSearch&&!r.title.toLowerCase().includes(recipeSearch.toLowerCase()))return false; return true; }), [recipeFilter, recipeSearch]);
  const weeklyNutrition = useMemo(() => { const t={protein:0,carbs:0,sugar:0,calories:0,meals:0,cost:0}; Object.values(mealPlan).forEach(id=>{const r=getRecipeById(id);if(r){t.protein+=r.nutrition.protein;t.carbs+=r.nutrition.carbs;t.sugar+=r.nutrition.sugar;t.calories+=r.nutrition.calories;t.cost+=getRecipeCost(r);t.meals+=1;}}); return t; }, [mealPlan, getRecipeCost]);
  const activeList = shoppingLists.find(l => l.id === activeListId);
  const mealPlanCount = Object.keys(mealPlan).length;

  const NutritionBadge = ({nutrition, cost, compact}) => {
    if(!nutrition)return null;
    if(compact) return (<div style={S.nutritionRow}><span style={S.nutBadgeP}>💪{nutrition.protein}g</span><span style={S.nutBadgeC}>⚡{nutrition.carbs}g</span><span style={S.nutBadgeS}>🍬{nutrition.sugar}g</span>{cost&&<span style={S.nutBadgeCost}>💰€{cost}</span>}</div>);
    return (<div style={S.nutritionGrid}><div style={S.nutCard}><div style={S.nutVal}>{nutrition.protein}g</div><div style={S.nutLbl}>Protein 💪</div></div><div style={S.nutCard}><div style={S.nutVal}>{nutrition.carbs}g</div><div style={S.nutLbl}>Carbs ⚡</div></div><div style={{...S.nutCard,...(nutrition.sugar<=5?S.nutGreen:nutrition.sugar<=8?S.nutYellow:S.nutOrange)}}><div style={S.nutVal}>{nutrition.sugar}g</div><div style={S.nutLbl}>Sugar 🍬</div></div><div style={S.nutCard}><div style={S.nutVal}>€{cost||"--"}</div><div style={S.nutLbl}>Cost 💰</div></div></div>);
  };
  const BrainBadge = ({benefits}) => { if(!benefits?.length)return null; return (<div style={S.brainRow}><span style={{fontSize:16}}>🧠</span>{benefits.map((b,i)=><span key={i} style={S.brainChip}>{b}</span>)}</div>); };

  // ONBOARDING
  if(!setupComplete) return (
    <div style={S.container}><div style={S.onboarding}><div style={S.onboardingInner}>
      <div style={{fontSize:56,marginBottom:8}}>🛒</div>
      <h1 style={S.onbTitle}>MealCart</h1>
      <p style={S.onbSub}>Fuel your body. Feed your brain. Build muscle.</p>
      <div style={S.inputGroup}><label style={S.label}>Name</label><input style={S.input} value={userName} onChange={e=>setUserName(e.target.value)} placeholder="Enter your name"/></div>
      <div style={S.inputGroup}><label style={S.label}>📍 Location</label><input style={S.input} value={userLocation} onChange={e=>setUserLocation(e.target.value)} placeholder="e.g. Düsseldorf, Germany"/></div>
      <div style={S.inputGroup}><label style={S.label}>🏪 Your Grocery Store</label><input style={S.input} value={userStore} onChange={e=>setUserStore(e.target.value)} placeholder="e.g. Lidl, Rewe, Aldi, Edeka"/></div>
      <div style={S.inputGroup}><label style={S.label}>💰 Weekly Grocery Budget</label><input style={S.input} type="number" value={weeklyBudget} onChange={e=>setWeeklyBudget(e.target.value)} placeholder="e.g. 50, 100, 150"/></div>
      <div style={S.inputGroup}><label style={S.label}>Serving Size</label><div style={S.servRow}>{[1,2,3,4,5,6].map(n=>(<button key={n} style={{...S.servBtn,...(servingSize===n?S.servBtnA:{})}} onClick={()=>setServingSize(n)}>{n}</button>))}</div></div>
      <div style={S.inputGroup}><label style={S.label}>Do you have any food allergies or any food you don't want to include?</label><p style={{fontSize:12,color:"#6A8A6A",marginBottom:8}}>Type any food and press Add</p>
        <div style={S.addItemRow}><input style={S.addItemInput} placeholder="e.g. egg, milk, peanut..." value={newAllergyInput} onChange={e=>setNewAllergyInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addAllergy()}/><button style={S.addItemBtn} onClick={addAllergy}>+</button></div>
        {userAllergies.length>0&&<div style={S.allergenGrid}>{userAllergies.map(a=>(<span key={a} style={S.allergyTag}>⚠️ {a}<button style={S.allergyTagX} onClick={()=>removeAllergy(a)}>✕</button></span>))}</div>}
      </div>
      <button style={{...S.primaryBtn,opacity:userName.trim()?1:0.4}} onClick={()=>userName.trim()&&setSetupComplete(true)}>Get Started 💪</button>
    </div></div></div>
  );

  // RECIPE DETAIL
  if(selectedRecipe){ const r=selectedRecipe; const aw=recipeHasAllergen(r); const matchedA=getMatchedAllergens(r); const ub=pastWeekRecipes.includes(r.id); return (
    <div style={S.container}><div style={S.phone}>
      <div style={S.statusBar}><span style={{fontSize:12,fontWeight:600}}></span><span style={{fontSize:11}}>●●●●● WiFi 🔋</span></div>
      <div style={S.header}><button style={S.backBtn} onClick={()=>setSelectedRecipe(null)}>← Back</button><span style={S.headerTitle}>Recipe</span><div style={{width:60}}/></div>
      <div style={S.scrollArea}>
        <div style={{textAlign:"center",fontSize:64,padding:"12px 0 4px"}}>{r.image}</div>
        <h2 style={S.recipeDetailTitle}>{r.title}</h2>
        {ub && <div style={S.usedBanner}>📅 Used in a previous week</div>}
        <div style={S.recipeMeta}><span style={S.metaChip}>⏱ {r.prepTime} min</span><span style={S.metaChip}>🍽 {r.servings} srv</span><span style={S.metaChip}>📂 {r.category}</span></div>
        {aw && <div style={S.allergenBanner}>⚠️ Contains: {matchedA.join(", ")}</div>}
        <NutritionBadge nutrition={r.nutrition} cost={getRecipeCost(r).toFixed(2)}/>
        <BrainBadge benefits={r.brainBenefits}/>
        {(userLocation||userStore)&&costMultiplier!==1.0&&<div style={{fontSize:11,color:"#6A8A6A",marginBottom:12,textAlign:"center"}}>💰 Price adjusted for {userLocation?`📍 ${userLocation}`:""}{userStore?` · 🏪 ${userStore}`:""} (×{costMultiplier.toFixed(2)})</div>}
        <h3 style={S.sectionTitle}>Ingredients</h3>
        {r.ingredients.map((ing,i)=>{const f=isAllergenIngredient(ing.name);return(<div key={i} style={S.ingredientRow}><span style={{...S.ingredientName,...(f?S.allergenText:{})}}>{f&&"⚠️ "}{ing.name}</span><span style={S.ingredientQty}>{ing.quantity} {ing.unit}</span></div>);})}
        <h3 style={S.sectionTitle}>Steps</h3>
        {r.steps.map((step,i)=>(<div key={i} style={S.stepRow}><div style={S.stepNum}>{i+1}</div><p style={S.stepText}>{step}</p></div>))}
        <h3 style={S.sectionTitle}>📺 Recipe Videos</h3>
        <div style={S.videoSection}>
          {[
            {q:`${r.title} recipe`,label:"Full Recipe Tutorial"},
            {q:`healthy ${r.ingredients[0]?.name||r.title} high protein recipe`,label:"High Protein Version"},
            {q:`${r.title} meal prep easy`,label:"Quick Meal Prep"},
          ].map((v,i)=>(<a key={i} style={S.videoCard} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(v.q)}`} target="_blank" rel="noopener noreferrer">
            <div style={S.videoThumb}><div style={S.playBtn}>▶</div></div>
            <div style={S.videoInfo}><div style={S.videoLabel}>{v.label}</div><div style={S.videoQuery}>{v.q}</div></div>
          </a>))}
        </div>
        {selectingSlot ? <button style={S.primaryBtn} onClick={()=>assignRecipe(r.id)}>Add to {selectingSlot.replace("-"," → ")}</button> : <button style={S.primaryBtn} onClick={()=>{setActiveTab("plan");setSelectedRecipe(null);}}>Go to Meal Plan</button>}
        <div style={{height:24}}/>
      </div>
    </div></div>
  );}

  // MAIN
  return (
    <div style={S.container}><div style={S.phone}>
      <div style={S.statusBar}><span style={{fontSize:12,fontWeight:600}}></span><span style={{fontSize:11}}>●●●●● WiFi 🔋</span></div>

      {/* HOME */}
      {activeTab==="home" && (<>
        <div style={S.headerLarge}><div><p style={S.greeting}>Hello, {userName} 💪</p><h1 style={S.pageTitle}>MealCart</h1></div><div style={S.weekBadge}>Week {weekNumber}</div></div>
        <div style={S.scrollArea}>
          <div style={S.focusBanner}><div style={{fontSize:20}}>🎯</div><div><div style={S.focusTitle}>Muscle & Brain Fuel</div><div style={S.focusSub}>High protein · Low sugar{userStore?` · 🏪 ${userStore} prices`:""}{userLocation?` · 📍 ${userLocation}`:""}</div></div></div>

          {mealPlanCount>0&&(<div style={S.weekNutCard}><div style={S.weekNutTitle}>📊 Week {weekNumber} Overview</div><div style={S.weekNutGrid}><div style={S.weekNutItem}><div style={S.weekNutVal}>{weeklyNutrition.protein}g</div><div style={S.weekNutLbl}>Protein</div></div><div style={S.weekNutItem}><div style={S.weekNutVal}>{weeklyNutrition.carbs}g</div><div style={S.weekNutLbl}>Carbs</div></div><div style={S.weekNutItem}><div style={{...S.weekNutVal,color:"#4ADE80"}}>{weeklyNutrition.sugar}g</div><div style={S.weekNutLbl}>Sugar</div></div><div style={S.weekNutItem}><div style={S.weekNutVal}>€{Math.round(weeklyNutrition.cost)}</div><div style={S.weekNutLbl}>Est. Cost</div></div></div>
            {weeklyBudget&&(<div style={S.budgetBar}><div style={S.budgetBarInner}><div style={{...S.budgetBarFill,width:`${Math.min(100,Math.round(weeklyNutrition.cost/parseFloat(weeklyBudget)*100))}%`,background:weeklyNutrition.cost>parseFloat(weeklyBudget)?"#EF4444":"#22C55E"}}/></div><div style={S.budgetBarText}>€{Math.round(weeklyNutrition.cost)} / €{weeklyBudget} budget {weeklyNutrition.cost>parseFloat(weeklyBudget)?" ⚠️ Over budget":""}</div></div>)}
            {weeklyNutrition.meals>0&&<div style={S.avgLine}>Avg/meal: {Math.round(weeklyNutrition.protein/weeklyNutrition.meals)}g protein · €{(weeklyNutrition.cost/weeklyNutrition.meals).toFixed(1)}/meal</div>}
          </div>)}

          <div style={S.statsRow}><div style={S.statCard}><div style={S.statNum}>{mealPlanCount}</div><div style={S.statLbl}>Planned</div></div><div style={S.statCard}><div style={S.statNum}>{shoppingLists.length}</div><div style={S.statLbl}>Lists</div></div><div style={S.statCard}><div style={S.statNum}>{pastWeekRecipes.length}</div><div style={S.statLbl}>Past Used</div></div></div>

          <button style={S.suggestBtn} onClick={suggestWeekPlan}>✨ Smart Suggest Week {weekNumber}</button>
          <p style={S.suggestHint}>{userLocation?`📍 ${userLocation} `:""}{ userStore?`· 🏪 ${userStore} `:""}{ weeklyBudget?`· €${weeklyBudget} budget `:""}· Never repeats</p>

          <h3 style={S.sectionTitle}>This Week</h3>
          {mealPlanCount===0?(<div style={S.emptyCard}><div style={{fontSize:32}}>📅</div><p style={S.emptyText}>No meals planned yet</p><button style={S.smallBtn} onClick={suggestWeekPlan}>✨ Auto-Suggest</button></div>):(
            <div style={S.weekPreview}>{DAYS.map(day=>{const meals=MEAL_TYPES.map(mt=>({type:mt,recipe:getRecipeById(mealPlan[day+"-"+mt])})).filter(m=>m.recipe);if(!meals.length)return null;return(<div key={day} style={S.dayPreviewCard}><div style={S.dayLbl}>{day}</div>{meals.map((m,i)=>(<div key={i} style={S.miniMeal}><span>{m.recipe.image}</span><span style={S.miniMealText}>{m.recipe.title}</span><span style={S.miniProtein}>💪{m.recipe.nutrition.protein}g</span><span style={S.miniCost}>€{getRecipeCost(m.recipe).toFixed(1)}</span></div>))}</div>);})}</div>
          )}
          {mealPlanCount>0&&(<><button style={S.primaryBtn} onClick={generateShoppingList}>🛒 Generate Shopping List</button><button style={S.secondaryBtn} onClick={finalizeWeek}>✅ Finish Week {weekNumber} → Start Week {weekNumber+1}</button></>)}

          <h3 style={S.sectionTitle}>⚡ High Protein Picks</h3>
          <div style={S.recipeScroll}>{RECIPES.filter(r=>r.nutrition.protein>=38).slice(0,6).map(r=>{const hw=recipeHasAllergen(r);const ub=pastWeekRecipes.includes(r.id);return(<div key={r.id} style={{...S.recipeQuickCard,...(ub?{opacity:0.5}:{})}} onClick={()=>setSelectedRecipe(r)}><div style={{fontSize:28,marginBottom:4}}>{r.image}</div><div style={S.quickTitle}>{r.title}</div><div style={S.quickMeta}>💪 {r.nutrition.protein}g · €{getRecipeCost(r).toFixed(1)}</div>{hw&&<div style={S.allergenDot}>⚠️</div>}{ub&&<div style={{fontSize:9,color:"#FB923C",marginTop:2}}>Used</div>}</div>);})}</div>
          <div style={{height:100}}/>
        </div>
      </>)}

      {/* MEAL PLAN */}
      {activeTab==="plan"&&!subView&&(<>
        <div style={S.header}><button style={S.suggestSmallBtn} onClick={suggestWeekPlan}>✨ Suggest</button><span style={S.headerTitle}>Week {weekNumber}</span><div style={{width:70}}/></div>
        <div style={S.scrollArea}>
          {mealPlanCount>0&&<div style={S.planNutBar}><span>💪 {weeklyNutrition.protein}g</span><span>⚡ {weeklyNutrition.carbs}g</span><span>🍬 {weeklyNutrition.sugar}g</span><span>💰 €{Math.round(weeklyNutrition.cost)}</span></div>}
          {DAYS.map(day=>(<div key={day} style={S.dayCard}><div style={S.dayHeader}>{day}</div>{MEAL_TYPES.map(mt=>{const slot=day+"-"+mt;const recipe=getRecipeById(mealPlan[slot]);const hw=recipe&&recipeHasAllergen(recipe);return(<div key={mt} style={S.mealSlot}><span style={S.mealTypeLbl}>{mt}</span>{recipe?(<div style={S.assignedMeal}><div style={{flex:1}}><span>{recipe.image} {recipe.title}</span>{hw&&<span style={{color:"#EF4444",fontSize:12}}> ⚠️</span>}<div style={{fontSize:10,color:"#6A8A6A",marginTop:1}}>💪{recipe.nutrition.protein}g · €{getRecipeCost(recipe).toFixed(1)}</div></div><button style={S.clearSlotBtn} onClick={()=>clearSlot(slot)}>✕</button></div>):(<button style={S.addMealBtn} onClick={()=>{setSelectingSlot(slot);setSubView("pick-recipe");}}>+ Add</button>)}</div>);})}</div>))}
          {mealPlanCount>0&&(<><button style={S.primaryBtn} onClick={generateShoppingList}>🛒 Generate Shopping List</button><button style={S.secondaryBtn} onClick={finalizeWeek}>✅ Finish Week {weekNumber}</button></>)}
          <div style={{height:100}}/>
        </div>
      </>)}

      {/* PICK RECIPE */}
      {activeTab==="plan"&&subView==="pick-recipe"&&(<>
        <div style={S.header}><button style={S.backBtn} onClick={()=>{setSubView(null);setSelectingSlot(null);}}>← Back</button><span style={S.headerTitle}>Pick Recipe</span><div style={{width:60}}/></div>
        <div style={S.scrollArea}>
          <p style={S.pickLabel}>For: <strong>{selectingSlot?.replace("-"," → ")}</strong></p>
          <div style={S.filterRow}>{["All","Breakfast","Lunch","Dinner"].map(f=>(<button key={f} style={{...S.filterChip,...(recipeFilter===f?S.filterChipA:{})}} onClick={()=>setRecipeFilter(f)}>{f}</button>))}</div>
          {filteredRecipes.map(r=>{const hw=recipeHasAllergen(r);const ub=pastWeekRecipes.includes(r.id);const tw=Object.values(mealPlan).includes(r.id);return(<div key={r.id} style={{...S.recipeListItem,...(ub?{opacity:0.55}:{})}}>
            <div style={S.recipeListMain} onClick={()=>setSelectedRecipe(r)}><span style={{fontSize:28}}>{r.image}</span><div style={{flex:1}}><div style={S.recipeListTitle}>{r.title}{tw&&<span style={{color:"#FB923C",fontSize:11}}> (this week)</span>}</div><div style={S.recipeListSub}>💪 {r.nutrition.protein}g · 💰 €{getRecipeCost(r).toFixed(2)}{hw&&<span style={{color:"#EF4444"}}> · ⚠️</span>}</div>{ub&&<div style={{fontSize:10,color:"#FB923C"}}>Used in previous week</div>}</div></div>
            <button style={S.selectRecipeBtn} onClick={()=>assignRecipe(r.id)}>Select</button>
          </div>);})}
          <div style={{height:100}}/>
        </div>
      </>)}

      {/* SHOPPING LIST */}
      {activeTab==="list"&&(<>
        <div style={S.header}><div style={{width:40}}/><span style={S.headerTitle}>Shopping Lists</span><button style={S.addListBtn} onClick={createManualList}>+ New</button></div>
        <div style={S.scrollArea}>
          {!activeList?(<>{shoppingLists.length===0?(<div style={S.emptyCard}><div style={{fontSize:32}}>🛒</div><p style={S.emptyText}>No shopping lists yet</p><button style={S.smallBtn} onClick={createManualList}>Create List</button></div>):(shoppingLists.map(list=>{const ck=list.items.filter(i=>i.checked).length;return(<div key={list.id} style={S.listCard} onClick={()=>setActiveListId(list.id)}><div><div style={S.listTitle}>{list.isAutoGenerated?"🤖 ":"📝 "}{list.title}</div><div style={S.listSub}>{list.items.length} items · {ck} checked{list.estimatedCost?" · 💰 ~€"+list.estimatedCost:""}</div></div><div style={S.listArrow}>›</div></div>);}))}</>):(
          <>
            <button style={S.backBtnSmall} onClick={()=>setActiveListId(null)}>← All Lists</button>
            <h2 style={S.listDetailTitle}>{activeList.isAutoGenerated?"🤖 ":"📝 "}{activeList.title}</h2>
            {activeList.estimatedCost&&<div style={S.listCostBanner}>💰 Estimated total: ~€{activeList.estimatedCost}{userStore?` at 🏪 ${userStore}`:""}{userLocation?` in 📍 ${userLocation}`:""}</div>}
            <div style={S.addItemRow}><input style={S.addItemInput} placeholder="Add item..." value={newItemName} onChange={e=>setNewItemName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addItemToList(activeList.id)}/><button style={S.addItemBtn} onClick={()=>addItemToList(activeList.id)}>+</button></div>
            {(()=>{const g={};activeList.items.forEach(i=>{const c=i.category||"Other";if(!g[c])g[c]=[];g[c].push(i);});return Object.entries(g).sort(([a],[b])=>a.localeCompare(b)).map(([cat,items])=>(<div key={cat}><div style={S.categoryLabel}>{cat}</div>{items.map(item=>{const fl=isAllergenIngredient(item.name);const dup=itemExistsOnOtherList(item.name,activeList.id);const rec=recentlyPurchased(item.name);return(<div key={item.id} style={{...S.shoppingItem,...(item.checked?S.shoppingItemChecked:{})}}>
              <div style={S.checkArea} onClick={()=>toggleItem(activeList.id,item.id)}><div style={{...S.checkbox,...(item.checked?S.checkboxChecked:{})}}>{item.checked&&"✓"}</div><div><span style={{...S.itemName,...(item.checked?S.itemNameChecked:{}),...(fl?S.allergenText:{})}}>{fl&&"⚠️ "}{item.name}</span>{item.quantity&&<span style={S.itemQty}> · {item.quantity} {item.unit}</span>}</div></div>
              <div style={S.itemActions}>{(dup||rec)&&!item.checked&&<span style={S.dupWarning}>{rec?"Bought recently":"On another list"}</span>}<button style={S.removeBtn} onClick={()=>removeItem(activeList.id,item.id)}>✕</button></div>
            </div>);})}</div>));})()}
            <button style={S.deleteListBtn} onClick={()=>deleteList(activeList.id)}>🗑 Delete List</button>
          </>)}
          <div style={{height:100}}/>
        </div>
      </>)}

      {/* RECIPES */}
      {activeTab==="recipes"&&(<>
        <div style={S.header}><div style={{width:20}}/><span style={S.headerTitle}>Recipes ({RECIPES.length})</span><div style={{width:20}}/></div>
        <div style={S.scrollArea}>
          <input style={S.searchInput} placeholder="🔍 Search recipes..." value={recipeSearch} onChange={e=>setRecipeSearch(e.target.value)}/>
          <div style={S.filterRow}>{["All","Breakfast","Lunch","Dinner"].map(f=>(<button key={f} style={{...S.filterChip,...(recipeFilter===f?S.filterChipA:{})}} onClick={()=>setRecipeFilter(f)}>{f}</button>))}</div>
          {filteredRecipes.map(r=>{const hw=recipeHasAllergen(r);const ub=pastWeekRecipes.includes(r.id);return(<div key={r.id} style={{...S.recipeCard,...(ub?{borderLeft:"3px solid #FB923C"}:{})}} onClick={()=>setSelectedRecipe(r)}>
            <div style={{fontSize:32}}>{r.image}</div>
            <div style={{flex:1}}><div style={S.recipeCardTitle}>{r.title}</div><div style={S.recipeCardSub}>💪 {r.nutrition.protein}g · ⚡ {r.nutrition.carbs}g · 🍬 {r.nutrition.sugar}g · 💰 €{getRecipeCost(r).toFixed(2)}</div>
              <div style={{display:"flex",gap:4,marginTop:3,flexWrap:"wrap"}}>{r.brainBenefits.slice(0,2).map((b,i)=><span key={i} style={S.brainChipSm}>🧠 {b}</span>)}</div>
              {hw&&<div style={S.allergenSmallBanner}>⚠️ {getMatchedAllergens(r).join(", ")}</div>}
              {ub&&<div style={{fontSize:10,color:"#FB923C",marginTop:2}}>Used in a previous week</div>}
            </div><div style={S.listArrow}>›</div>
          </div>);})}
          <div style={{height:100}}/>
        </div>
      </>)}

      {/* PROFILE */}
      {activeTab==="profile"&&(<>
        <div style={S.header}><div style={{width:20}}/><span style={S.headerTitle}>Profile</span><div style={{width:20}}/></div>
        <div style={S.scrollArea}>
          <div style={S.profileSection}><div style={S.profileAvatar}>{userName.charAt(0).toUpperCase()}</div><h2 style={S.profileName}>{userName}</h2>{userLocation&&<div style={S.locationBadge}>📍 {userLocation}</div>}{userStore&&<div style={S.storeBadge}>🏪 {userStore}</div>}{weeklyBudget&&<div style={S.budgetBadge}>💰 €{weeklyBudget}/week</div>}</div>
          <div style={S.settingsCard}><div style={S.settingsLabel}>📍 Current Location</div><input style={S.input} placeholder="e.g. Düsseldorf, Germany" value={userLocation} onChange={e=>setUserLocation(e.target.value)}/></div>
          <div style={S.settingsCard}><div style={S.settingsLabel}>🏪 Grocery Store</div><input style={S.input} placeholder="e.g. Lidl, Rewe, Aldi, Edeka" value={userStore} onChange={e=>setUserStore(e.target.value)}/>{userStore&&getStoreMultiplier(userStore)!==1.0&&<p style={{fontSize:12,color:"#6A8A6A",marginTop:6}}>🏪 {userStore} price level: {getStoreMultiplier(userStore)<1?"💚 Budget-friendly":"🔶 Premium"} (×{getStoreMultiplier(userStore).toFixed(2)})</p>}</div>
          <div style={S.settingsCard}><div style={S.settingsLabel}>💰 Weekly Grocery Budget</div><input style={S.input} type="number" placeholder="e.g. 50, 100, 150" value={weeklyBudget} onChange={e=>setWeeklyBudget(e.target.value)}/>{weeklyBudget&&<p style={{fontSize:13,color:"#4ADE80",marginTop:8,fontWeight:600}}>€{weeklyBudget} / week</p>}</div>
          <div style={S.settingsCard}><div style={S.settingsLabel}>📅 Week Progress</div><p style={{fontSize:14,color:"#E0E8E0",margin:0}}>Week <strong>{weekNumber}</strong> · {pastWeekRecipes.length} recipes used previously</p>{pastWeekRecipes.length>0&&<button style={S.clearHistBtn} onClick={()=>setPastWeekRecipes([])}>Reset Week History</button>}</div>
          <div style={S.settingsCard}><div style={S.settingsLabel}>Servings</div><div style={S.servRow}>{[1,2,3,4,5,6].map(n=>(<button key={n} style={{...S.servBtn,...(servingSize===n?S.servBtnA:{})}} onClick={()=>setServingSize(n)}>{n}</button>))}</div></div>
          <div style={S.settingsCard}><div style={S.settingsLabel}>Do you have any food allergies or any food you don't want to include?</div>
            <div style={S.addItemRow}><input style={S.addItemInput} placeholder="Type allergy e.g. egg, milk..." value={newAllergyInput} onChange={e=>setNewAllergyInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addAllergy()}/><button style={S.addItemBtn} onClick={addAllergy}>+</button></div>
            {userAllergies.length>0?<div style={S.allergenGrid}>{userAllergies.map(a=>(<span key={a} style={S.allergyTag}>⚠️ {a}<button style={S.allergyTagX} onClick={()=>removeAllergy(a)}>✕</button></span>))}</div>:<p style={{fontSize:13,color:"#6A8A6A",margin:0}}>No allergies added</p>}
          </div>
          <div style={{height:100}}/>
        </div>
      </>)}

      {/* TAB BAR */}
      <div style={S.tabBar}>{[{id:"home",icon:"🏠",l:"Home"},{id:"plan",icon:"📅",l:"Plan"},{id:"list",icon:"🛒",l:"Lists"},{id:"recipes",icon:"📖",l:"Recipes"},{id:"profile",icon:"👤",l:"Profile"}].map(t=>(<button key={t.id} style={S.tabBtn} onClick={()=>{setActiveTab(t.id);setSubView(null);if(t.id!=="list")setActiveListId(null);}}><div style={{fontSize:20}}>{t.icon}</div><div style={{fontSize:10,marginTop:2,color:activeTab===t.id?"#4ADE80":"#4A6A4A"}}>{t.l}</div></button>))}</div>
    </div></div>
  );
}

const S = {
  container:{display:"flex",flexDirection:"column",height:"100vh",background:"#0B1A0B",fontFamily:"'SF Pro Display',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",overflow:"hidden"},
  phone:{width:"100%",height:"100%",background:"#0B1A0B",overflow:"hidden",display:"flex",flexDirection:"column",position:"relative"},
  statusBar:{display:"flex",justifyContent:"space-between",padding:"max(env(safe-area-inset-top),14px) 20px 8px",fontSize:14,fontWeight:600,background:"#0F1F0F",color:"#C8D8C8",flexShrink:0},
  onboarding:{width:"100%",height:"100%",background:"#0B1A0B",overflow:"hidden",display:"flex",flexDirection:"column"},
  onboardingInner:{padding:"50px 28px 28px",overflowY:"auto",flex:1},
  onbTitle:{fontSize:32,fontWeight:700,color:"#FFFFFF",margin:"4px 0",letterSpacing:-0.5},
  onbSub:{fontSize:15,color:"#7A947A",marginBottom:24},
  headerLarge:{padding:"4px 20px 12px",background:"#0F1F0F",flexShrink:0,display:"flex",justifyContent:"space-between",alignItems:"flex-end"},
  greeting:{fontSize:14,color:"#7A947A",margin:0},
  pageTitle:{fontSize:28,fontWeight:700,color:"#FFFFFF",margin:"2px 0 0",letterSpacing:-0.5},
  weekBadge:{background:"#1A3A1A",color:"#4ADE80",fontSize:12,fontWeight:700,padding:"4px 12px",borderRadius:12,marginBottom:4},
  header:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 20px 12px",background:"#0F1F0F",flexShrink:0},
  headerTitle:{fontSize:17,fontWeight:600,color:"#FFFFFF"},
  backBtn:{background:"none",border:"none",fontSize:16,color:"#4ADE80",fontWeight:500,cursor:"pointer",padding:0},
  scrollArea:{flex:1,overflowY:"auto",padding:"0 20px 20px"},
  focusBanner:{display:"flex",alignItems:"center",gap:12,background:"linear-gradient(135deg,#0D2B0D,#1A4A1A)",border:"1px solid #2A5A2A",borderRadius:16,padding:"14px 16px",marginTop:12},
  focusTitle:{color:"#4ADE80",fontWeight:700,fontSize:15},
  focusSub:{color:"#5A8A5A",fontSize:11,marginTop:2},
  weekNutCard:{background:"#142214",border:"1px solid #1E3320",borderRadius:16,padding:16,marginTop:12},
  weekNutTitle:{fontSize:14,fontWeight:700,color:"#FFFFFF",marginBottom:10},
  weekNutGrid:{display:"flex",gap:8},
  weekNutItem:{flex:1,textAlign:"center"},
  weekNutVal:{fontSize:18,fontWeight:700,color:"#FFFFFF"},
  weekNutLbl:{fontSize:10,color:"#6A8A6A"},
  avgLine:{fontSize:11,color:"#6A8A6A",marginTop:10,textAlign:"center"},
  budgetBar:{marginTop:12},
  budgetBarInner:{height:8,background:"#1E3320",borderRadius:4,overflow:"hidden"},
  budgetBarFill:{height:"100%",borderRadius:4,transition:"width 0.3s"},
  budgetBarText:{fontSize:11,color:"#6A8A6A",marginTop:4,textAlign:"center"},
  statsRow:{display:"flex",gap:10,margin:"12px 0"},
  statCard:{flex:1,background:"#142214",border:"1px solid #1E3320",borderRadius:16,padding:"14px 12px",textAlign:"center"},
  statNum:{fontSize:24,fontWeight:700,color:"#4ADE80"},
  statLbl:{fontSize:11,color:"#6A8A6A",marginTop:2},
  suggestBtn:{width:"100%",background:"linear-gradient(135deg,#22C55E,#16A34A)",color:"#fff",border:"none",borderRadius:14,padding:"14px 0",fontSize:16,fontWeight:700,cursor:"pointer",marginTop:8,boxShadow:"0 4px 16px rgba(34,197,94,0.25)"},
  suggestSmallBtn:{background:"#22C55E",color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer"},
  suggestHint:{fontSize:11,color:"#5A7A5A",textAlign:"center",margin:"6px 0 0"},
  sectionTitle:{fontSize:18,fontWeight:700,color:"#FFFFFF",margin:"20px 0 10px"},
  emptyCard:{background:"#142214",border:"1px solid #1E3320",borderRadius:16,padding:32,textAlign:"center"},
  emptyText:{color:"#6A8A6A",fontSize:14,margin:"8px 0 16px"},
  smallBtn:{background:"#22C55E",color:"#fff",border:"none",borderRadius:20,padding:"10px 20px",fontSize:14,fontWeight:600,cursor:"pointer"},
  weekPreview:{display:"flex",flexDirection:"column",gap:6},
  dayPreviewCard:{background:"#142214",border:"1px solid #1E3320",borderRadius:12,padding:"10px 14px"},
  dayLbl:{fontSize:12,fontWeight:700,color:"#4ADE80",marginBottom:4,textTransform:"uppercase"},
  miniMeal:{display:"flex",alignItems:"center",gap:6,padding:"2px 0"},
  miniMealText:{fontSize:13,color:"#C8D8C8",flex:1},
  miniProtein:{fontSize:10,color:"#4ADE80",fontWeight:700,background:"#1A3A1A",padding:"2px 6px",borderRadius:8},
  miniCost:{fontSize:10,color:"#60A5FA",fontWeight:600,background:"#0F1F3A",padding:"2px 6px",borderRadius:8},
  recipeScroll:{display:"flex",gap:12,overflowX:"auto",paddingBottom:8},
  recipeQuickCard:{minWidth:130,background:"#142214",border:"1px solid #1E3320",borderRadius:16,padding:"14px 12px",textAlign:"center",cursor:"pointer",position:"relative",flexShrink:0},
  quickTitle:{fontSize:11,fontWeight:600,color:"#E0E8E0"},
  quickMeta:{fontSize:10,color:"#4ADE80",marginTop:2,fontWeight:600},
  allergenDot:{position:"absolute",top:8,right:8,fontSize:12},
  primaryBtn:{width:"100%",background:"#22C55E",color:"#fff",border:"none",borderRadius:14,padding:"14px 0",fontSize:16,fontWeight:600,cursor:"pointer",marginTop:16},
  secondaryBtn:{width:"100%",background:"none",border:"2px solid #22C55E",color:"#4ADE80",borderRadius:14,padding:"12px 0",fontSize:14,fontWeight:600,cursor:"pointer",marginTop:8},
  nutritionGrid:{display:"flex",gap:8,marginBottom:12},
  nutCard:{flex:1,background:"#1A2E1A",borderRadius:10,padding:"8px 4px",textAlign:"center"},
  nutGreen:{background:"#0D2B0D"},nutYellow:{background:"#2B2A0D"},nutOrange:{background:"#2B1A0D"},
  nutVal:{fontSize:16,fontWeight:700,color:"#FFFFFF"},
  nutLbl:{fontSize:10,color:"#6A8A6A"},
  nutritionRow:{display:"flex",gap:6,marginTop:4},
  nutBadgeP:{fontSize:10,fontWeight:700,color:"#4ADE80",background:"#1A3A1A",padding:"2px 6px",borderRadius:6},
  nutBadgeC:{fontSize:10,fontWeight:600,color:"#FB923C",background:"#2B1A0D",padding:"2px 6px",borderRadius:6},
  nutBadgeS:{fontSize:10,fontWeight:600,color:"#C084FC",background:"#1F0D2B",padding:"2px 6px",borderRadius:6},
  nutBadgeCost:{fontSize:10,fontWeight:600,color:"#60A5FA",background:"#0F1F3A",padding:"2px 6px",borderRadius:6},
  brainRow:{display:"flex",alignItems:"center",gap:6,marginBottom:14,flexWrap:"wrap"},
  brainChip:{fontSize:11,color:"#60A5FA",background:"#0F1F3A",padding:"3px 10px",borderRadius:12,fontWeight:500},
  brainChipSm:{fontSize:9,color:"#60A5FA",background:"#0F1F3A",padding:"1px 6px",borderRadius:8,fontWeight:500},
  usedBanner:{textAlign:"center",fontSize:12,color:"#FB923C",background:"#2B1A0D",padding:"6px 12px",borderRadius:8,marginBottom:8},
  dayCard:{background:"#142214",border:"1px solid #1E3320",borderRadius:16,marginBottom:10,overflow:"hidden"},
  dayHeader:{background:"#1A4A1A",color:"#4ADE80",padding:"8px 14px",fontWeight:700,fontSize:14},
  mealSlot:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderBottom:"1px solid #1E3320"},
  mealTypeLbl:{fontSize:13,color:"#6A8A6A",fontWeight:500,minWidth:70},
  assignedMeal:{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#E0E8E0",flex:1,justifyContent:"flex-end"},
  clearSlotBtn:{background:"none",border:"none",color:"#EF4444",fontSize:14,cursor:"pointer",padding:"0 0 0 8px"},
  addMealBtn:{background:"#1A3A1A",border:"1px solid #2A5A2A",borderRadius:8,padding:"6px 14px",fontSize:13,color:"#4ADE80",fontWeight:600,cursor:"pointer"},
  planNutBar:{display:"flex",justifyContent:"space-around",background:"#142214",border:"1px solid #1E3320",borderRadius:10,padding:"8px 4px",marginBottom:10,fontSize:11,fontWeight:600,color:"#C8D8C8"},
  pickLabel:{fontSize:13,color:"#6A8A6A",marginBottom:12},
  filterRow:{display:"flex",gap:8,marginBottom:14,overflowX:"auto"},
  filterChip:{background:"#1A2E1A",border:"1px solid #1E3320",borderRadius:20,padding:"6px 16px",fontSize:13,color:"#8AA88A",cursor:"pointer",whiteSpace:"nowrap",fontWeight:500},
  filterChipA:{background:"#22C55E",color:"#fff",borderColor:"#22C55E"},
  recipeListItem:{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#142214",border:"1px solid #1E3320",borderRadius:12,padding:"12px 14px",marginBottom:8},
  recipeListMain:{display:"flex",alignItems:"center",gap:12,flex:1,cursor:"pointer"},
  recipeListTitle:{fontSize:14,fontWeight:600,color:"#E0E8E0"},
  recipeListSub:{fontSize:11,color:"#6A8A6A"},
  selectRecipeBtn:{background:"#22C55E",color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",fontSize:13,fontWeight:600,cursor:"pointer",flexShrink:0},
  addListBtn:{background:"#22C55E",color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",fontSize:13,fontWeight:600,cursor:"pointer"},
  listCard:{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#142214",border:"1px solid #1E3320",borderRadius:12,padding:"14px 16px",marginBottom:8,cursor:"pointer"},
  listTitle:{fontSize:15,fontWeight:600,color:"#E0E8E0"},
  listSub:{fontSize:12,color:"#6A8A6A",marginTop:2},
  listArrow:{fontSize:22,color:"#3A5A3A",fontWeight:300},
  backBtnSmall:{background:"none",border:"none",fontSize:14,color:"#4ADE80",fontWeight:500,cursor:"pointer",padding:"8px 0"},
  listDetailTitle:{fontSize:20,fontWeight:700,color:"#FFFFFF",margin:"4px 0 8px"},
  listCostBanner:{background:"#1A3A1A",border:"1px solid #2A5A2A",borderRadius:10,padding:"8px 14px",fontSize:12,color:"#4ADE80",fontWeight:600,marginBottom:12,textAlign:"center"},
  addItemRow:{display:"flex",gap:8,marginBottom:16},
  addItemInput:{flex:1,border:"1px solid #1E3320",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",background:"#142214",color:"#E0E8E0"},
  addItemBtn:{background:"#22C55E",color:"#fff",border:"none",borderRadius:10,width:42,fontSize:22,cursor:"pointer",fontWeight:600},
  categoryLabel:{fontSize:12,fontWeight:700,color:"#4ADE80",textTransform:"uppercase",letterSpacing:0.5,padding:"10px 0 4px"},
  shoppingItem:{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#142214",border:"1px solid #1E3320",borderRadius:10,padding:"10px 12px",marginBottom:4},
  shoppingItemChecked:{background:"#0B1A0B",opacity:0.6,borderColor:"#142214"},
  checkArea:{display:"flex",alignItems:"center",gap:10,cursor:"pointer",flex:1},
  checkbox:{width:22,height:22,borderRadius:6,border:"2px solid #3A5A3A",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff",flexShrink:0},
  checkboxChecked:{background:"#22C55E",borderColor:"#22C55E"},
  itemName:{fontSize:14,color:"#E0E8E0",fontWeight:500},
  itemNameChecked:{textDecoration:"line-through",color:"#4A6A4A"},
  itemQty:{fontSize:12,color:"#6A8A6A"},
  itemActions:{display:"flex",alignItems:"center",gap:8,flexShrink:0},
  dupWarning:{fontSize:10,color:"#FB923C",fontWeight:600,background:"#2B1A0D",padding:"2px 8px",borderRadius:6,whiteSpace:"nowrap"},
  removeBtn:{background:"none",border:"none",color:"#EF4444",fontSize:16,cursor:"pointer",padding:0},
  deleteListBtn:{width:"100%",background:"none",border:"1px solid #EF4444",borderRadius:12,padding:"12px 0",fontSize:14,color:"#EF4444",fontWeight:600,cursor:"pointer",marginTop:20},
  allergenText:{color:"#EF4444",fontWeight:700},
  allergenBanner:{background:"#2B0D0D",border:"1px solid #5A1A1A",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#F87171",fontWeight:600,margin:"8px 0 16px"},
  allergenSmallBanner:{fontSize:11,color:"#F87171",fontWeight:600,marginTop:4},
  recipeDetailTitle:{fontSize:22,fontWeight:700,color:"#FFFFFF",textAlign:"center",margin:"0 0 10px"},
  recipeMeta:{display:"flex",gap:8,justifyContent:"center",marginBottom:12,flexWrap:"wrap"},
  metaChip:{background:"#1A3A1A",color:"#4ADE80",fontSize:12,fontWeight:500,padding:"4px 12px",borderRadius:20},
  ingredientRow:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #1E3320"},
  ingredientName:{fontSize:14,color:"#E0E8E0"},
  ingredientQty:{fontSize:13,color:"#6A8A6A"},
  stepRow:{display:"flex",gap:12,alignItems:"flex-start",padding:"10px 0"},
  stepNum:{width:26,height:26,borderRadius:13,background:"#22C55E",color:"#fff",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},
  stepText:{fontSize:14,color:"#C8D8C8",lineHeight:1.5,margin:0},
  searchInput:{width:"100%",border:"1px solid #1E3320",borderRadius:12,padding:"10px 14px",fontSize:14,outline:"none",background:"#142214",color:"#E0E8E0",marginTop:8,marginBottom:12,boxSizing:"border-box"},
  recipeCard:{display:"flex",alignItems:"center",gap:12,background:"#142214",border:"1px solid #1E3320",borderRadius:14,padding:"14px",marginBottom:8,cursor:"pointer"},
  recipeCardTitle:{fontSize:14,fontWeight:600,color:"#E0E8E0"},
  recipeCardSub:{fontSize:11,color:"#6A8A6A",marginTop:2},
  profileSection:{textAlign:"center",padding:"24px 0 16px"},
  profileAvatar:{width:72,height:72,borderRadius:36,background:"linear-gradient(135deg,#22C55E,#16A34A)",color:"#fff",fontSize:32,fontWeight:700,display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:8},
  profileName:{fontSize:22,fontWeight:700,color:"#FFFFFF",margin:0},
  locationBadge:{display:"inline-block",background:"#0F1F3A",color:"#60A5FA",fontSize:13,fontWeight:500,padding:"4px 14px",borderRadius:20,marginTop:8},
  budgetBadge:{display:"inline-block",background:"#1A3A1A",color:"#4ADE80",fontSize:13,fontWeight:500,padding:"4px 14px",borderRadius:20,marginTop:6},
  storeBadge:{display:"inline-block",background:"#2B1A0D",color:"#FB923C",fontSize:13,fontWeight:500,padding:"4px 14px",borderRadius:20,marginTop:6},
  settingsCard:{background:"#142214",border:"1px solid #1E3320",borderRadius:14,padding:"16px",marginBottom:10},
  settingsLabel:{fontSize:14,fontWeight:600,color:"#FFFFFF",marginBottom:10},
  clearHistBtn:{background:"none",border:"1px solid #EF4444",borderRadius:8,padding:"6px 14px",fontSize:12,color:"#EF4444",cursor:"pointer",marginTop:8},
  inputGroup:{marginBottom:18},
  label:{fontSize:14,fontWeight:600,color:"#E0E8E0",marginBottom:6,display:"block"},
  input:{width:"100%",border:"1px solid #1E3320",borderRadius:12,padding:"12px 14px",fontSize:16,outline:"none",boxSizing:"border-box",background:"#142214",color:"#E0E8E0"},
  servRow:{display:"flex",gap:8},
  servBtn:{width:40,height:40,borderRadius:10,border:"1px solid #1E3320",background:"#142214",fontSize:16,fontWeight:600,cursor:"pointer",color:"#8AA88A"},
  servBtnA:{background:"#22C55E",color:"#fff",borderColor:"#22C55E"},

  allergenGrid:{display:"flex",flexWrap:"wrap",gap:6,marginTop:8},
  allergyTag:{display:"inline-flex",alignItems:"center",gap:4,background:"#2B0D0D",border:"1px solid #5A1A1A",borderRadius:20,padding:"6px 12px",fontSize:13,color:"#F87171",fontWeight:600},
  allergyTagX:{background:"none",border:"none",color:"#F87171",fontSize:14,cursor:"pointer",padding:"0 0 0 4px",fontWeight:700},
  tabBar:{display:"flex",justifyContent:"space-around",alignItems:"center",padding:"8px 0 max(env(safe-area-inset-bottom),20px)",background:"#0B1A0B",borderTop:"1px solid #1E3320",flexShrink:0,position:"absolute",bottom:0,left:0,right:0},
  tabBtn:{background:"none",border:"none",cursor:"pointer",textAlign:"center",padding:"4px 8px",minWidth:50},
  videoSection:{display:"flex",flexDirection:"column",gap:8,marginBottom:16},
  videoCard:{display:"flex",alignItems:"center",gap:12,background:"#142214",border:"1px solid #1E3320",borderRadius:14,padding:"12px 14px",textDecoration:"none",cursor:"pointer"},
  videoThumb:{width:52,height:52,borderRadius:12,background:"linear-gradient(135deg,#1A3A1A,#0D2B0D)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:"1px solid #2A5A2A"},
  playBtn:{width:28,height:28,borderRadius:14,background:"#EF4444",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",paddingLeft:2},
  videoInfo:{flex:1,minWidth:0},
  videoLabel:{fontSize:14,fontWeight:600,color:"#E0E8E0",marginBottom:2},
  videoQuery:{fontSize:11,color:"#6A8A6A",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},
};
