const axios = require('axios');
//Don't forget to authenticate with blizzard 😊
axios.defaults.headers.common['Authorization'] = `Bearer ${process.env.blizzard}`;
//Request Setup
const baseURL = "https://us.api.blizzard.com/"
const wowHeadRecipeSearch = `https://www.wowhead.com/cooking-recipe-spells/old-world-recipes-header/old-world-recipes`



const fs = require('fs');
//Eg. The example one is located in "scrap/classic-recipes.json"
const recipesHTML = fs.readFileSync('<PATH TOO YOUR WOWHEAD VARIABLES FILE>','utf8')
const jsonRecipes  = JSON.parse(recipesHTML);
//For now everything  is using only functions
//Can be improved by adding a class and encapsulating more processes into functions
//Legibility can be improved by using type script
let newRecipes = []
let recipeList = GetRecipeListFromJSON(jsonRecipes)
let everyUniqueReagent = GetReagentItemIDsFromRecipesFromJSON(jsonRecipes);
let everyUniqueCreation = GetCreationItemIDsFromRecipesFromJSON(jsonRecipes);
let everyUniqueItem = {...everyUniqueReagent,...everyUniqueCreation};

//This file has a list of every recipe scrapped with the list of reagents/quantity and what it creates/quantity
fs.writeFileSync('classic-recipes.json',JSON.stringify(recipeList),'utf8');

//Convert object to array
let allItems = [];
for (var itemID in everyUniqueItem)
{
  allItems.push(itemID);
}


//Create an interval to make the request to the blizzard API.
//This way we will respect to not make more than 100 requests to blizzarrd 😊
//Let's help blizzard with this
let requestIndex = 0;
let timeUntilNextRequestInMilliseconds = 150;
var everyClassicRecipeItem = [];
var interval = setInterval(()=>
{
  console.log("Request",requestIndex);
  if(requestIndex>=allItems.length)return; //important, so you won't make more requests than the needed ones
  getItemRequest(allItems[requestIndex++])
  .then(result=>
  {
    var item = result.data;
    everyClassicRecipeItem.push(result.data);
  })
},timeUntilNextRequestInMilliseconds)

setTimeout(()=>
{
  clearInterval(interval);
  console.log(`We are done! There were ${allItems.length} different items in the recipes`);
  //This file has the official data from every item by using the blizzard api
  fs.writeFileSync('classic-recipe-item-list.json',JSON.stringify(everyClassicRecipeItem),'utf8');
},timeUntilNextRequestInMilliseconds*(allItems.length+5));


function getItemRequests(itemList,requestLimit)
{
  let itemRequests = []
  let requestCount=0;
  for(const itemID in itemList)
  {
    // console.log(itemID);
    requestCount++;
    itemRequests.push(getItemRequest(itemID));
    if(requestCount>=requestLimit)break
  }
  return itemRequests;
}


function GetRecipeListFromJSON(jsonRecipes)
{

  let everyRecipe = []
  jsonRecipes.forEach(recipe=>
  {
    // console.log(recipe.name);
    // console.log(recipe.id); //get from recipe endpoint
    // console.log(recipe.reagents);
    // console.log(recipe.creates)
    let newRecipe = {};
    newRecipe.id = recipe.id;
    newRecipe.name = `Recipe: ${recipe.name.substring(1)}`;
    newRecipe.reagents = [];
    recipe.reagents.forEach(reagent=>
    {
      newRecipe.reagents.push({id:reagent[0],quantity:reagent[1]});
    })

    newRecipe.creates = {id:recipe.creates[0],quantity:recipe.creates[1]};
    everyRecipe.push(newRecipe);
    // everyRecipe[recipe.id]=newRecipe;
  })
  return everyRecipe;
}

//##############################################################################
//Could improve legibility of this by using type script!
//Parameter: an array of recipes
//Returns: An object containing the reagentIDs as keys and values
//The recipe objects are taken from wow-head
function GetReagentItemIDsFromRecipesFromJSON(recipeList)
{
  var everyUniqueReagent = {}
  recipeList.forEach(recipe=>
  {
    // console.log(recipe.name);
    // console.log(recipe.id); //get from recipe endpoint
    // console.log(recipe.reagents);
    // console.log(recipe.creates)
    recipe.reagents.forEach(reagent=>
    {
      var item = reagent[0]; //0 = reagentID, 1 = Quantity Needed for the recipe
      everyUniqueReagent[item]=item;
    });

  })
  //Here the everyUniqueReagent has been populated
  return everyUniqueReagent;
}

function GetCreationItemIDsFromRecipesFromJSON(recipeList)
{
  var everyUniqueCreation = {}
  recipeList.forEach(recipe=>
  {
    var itemIDCreatedByRecipe = recipe.creates[0]; //1 = Quantity
    everyUniqueCreation[itemIDCreatedByRecipe]=itemIDCreatedByRecipe;
  })
  return everyUniqueCreation;
}

////
function getItemRequest(itemID)
{
  return axios.get(`${baseURL}/wow/item/${itemID}`);
}

function getRecipeRequest(recipeID)
{
  return axios.get(`${baseURL}/wow/recipe/${recipeID}`);
}
