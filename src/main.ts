import { scrapListViewSpells } from "./scrapper";
import WoWAPI from './wow-api';
import { interval as ObservableInterval, from, Observable} from 'rxjs';
import { take, zip} from 'rxjs/operators';
const fs = require('fs');


//> node recipes.js <url>
// <url> is [2]
let url = process.argv[2]; 
//You need an HTML that has a table with recipes
//It will look for a variable in the html file called: listviewspells
// The following commented url is where you can pretty much get every recipe from every expansion in the game
// url = "https://www.wowhead.com/cooking-recipe-spells"


const wow = new WoWAPI(process.env.blizzard);


scrapListViewSpells(url).then(spellRecipes=>
{   
    const jsonRecipes = JSON.parse(spellRecipes);
    var recipes = GetRecipeListFromJSON(jsonRecipes);
    console.log(`${recipes.length} from WoWHead`);
    recipes = RemoveDuplicatedCreations(recipes);
    console.log(`${recipes.length} from WoWhead after removing duplicates`);
    // let everyUniqueReagentID = GetReagentItemIDsFromRecipesFromJSON(jsonRecipes);
    // let everyUniqueCreation = GetCreationItemIDsFromRecipesFromJSON(jsonRecipes);    
    wowRecipeItems(recipes,wow,(itemsFromAPI)=>
    {   
        console.log(`${itemsFromAPI.length} from Blizzard, WowHead recipes: ${recipes.length}`);
        console.log("Writing files in disk!");
        fs.writeFileSync('API Items from Recipe.json', JSON.stringify(itemsFromAPI), 'utf8');
        fs.writeFileSync('Recipe list with reagents.json', JSON.stringify(recipes), 'utf8');

    });

})
.catch(reason=>
{
    console.log(reason);
})

function RemoveDuplicatedCreations(recipes:any[]):any[]
{
    var hashSet = {};
    var nonDuplicatedItems:any[] = [];
    recipes.forEach(recipe=>hashSet[recipe.creates.id]=recipe)
    for(var id in hashSet)
    {
        nonDuplicatedItems.push(hashSet[id]);
    }
    return nonDuplicatedItems;
}


function wowRecipeItems(recipeList:any[],wowAPI:WoWAPI,whenCompleted:(recipes:object[])=>void )
{
    var intervalInMilliseconds = 101;
    var totalRequests = recipeList.length;
    var requestsMade = 0;
    var everyItemStream = from(recipeList);
    var requestInterval = ObservableInterval(intervalInMilliseconds)
        .pipe(take(totalRequests));

    

    //You could say zip makes a corresponde 1 to 1
    //The new hybrid emition will have an array like this [0,2558]
    //But the zip will end once the first stream completes
    //This is useful because we will emit interval as many recipes as we have
    var oneToOneStream = requestInterval.pipe(
        zip(everyItemStream)
    );
    //
    var recipeAPIItems:object[] = [];
    
    //All of this problem came because we need to respect
    //that we cannot make more than 100 requests to blizzard's api
    //So we are using an interval of time to ask them
    //It could be easily be done with axios.all/axios.spread and once are completed
    //we would just make the callback
    var subscription = oneToOneStream.subscribe(intervalRecipe => 
    {
        const requestNumber = intervalRecipe[0]; //this is the interval emission
        const recipe: any = intervalRecipe[1]; //this is the actual recipe object
        wowAPI.getItem(recipe.creates.id).then(response=>
            {
                var blizzardItem = response.data;
                //I want to find a better way to do this,
                //rather than counting how many requests have been completed
                //Perhaps another stream? 🤔
                //Yet is a bit difficult, since promises execute when they are called
                //They are eager, not lazy...
                requestsMade++;
                if(requestsMade==totalRequests)
                {
                    subscription.unsubscribe();
                    // whenCompleted(recipeAPIItems);
                    whenCompleted(recipeAPIItems);
                }
                recipeAPIItems.push(blizzardItem);
            }).catch(errorReason=>
            {
                console.log(errorReason.response.data);
                
                requestsMade++;
                if (requestsMade == totalRequests) 
                {
                    subscription.unsubscribe();
                    // whenCompleted(recipeAPIItems);
                    whenCompleted(recipeAPIItems);
                }
            })
    })
    
}


function GetRecipeListFromJSON(jsonRecipes:any[]):any[]
{

    let everyRecipe = []
    
    
    jsonRecipes
    .filter(recipe => recipe.reagents || recipe.creates) //There could be recipes without reagents/creates, these are not actually real recipes
    .map(recipe => 
    {
        // console.log(recipe.name);
        // console.log(recipe.id); 
        // console.log(recipe.reagents);
        // console.log(recipe.creates)
        
        let newRecipe:any={};
        newRecipe.id = recipe.id;
        newRecipe.name = `Recipe: ${recipe.name.substring(1)}`; //remove that '7' at the beggining of each scrapped recipe
        newRecipe.reagents = [];
        recipe.reagents.forEach(reagent => {
            newRecipe.reagents.push({ id: reagent[0], quantity: reagent[1] });
        })

        newRecipe.creates = { id: recipe.creates[0], quantity: recipe.creates[1] };
        everyRecipe.push(newRecipe);
        // everyRecipe[recipe.id]=newRecipe;
    })
    return everyRecipe;
}


//##############################################################################
//
//Parameter: an array of recipes from wowhead's scrapping
//Returns: An object containing the reagentIDs as keys and values
//The recipe objects are taken from wow-head
function GetReagentItemIDsFromRecipesFromJSON(recipeList:any[]):object
{
    var everyUniqueReagent = {}
    recipeList
    .filter(recipe => recipe.reagents)
    .forEach(recipe => 
    {
        recipe.reagents.forEach(reagent => 
        {
            var item = reagent[0]; //0 = reagentID, 1 = Quantity Needed for the recipe
            everyUniqueReagent[item] = item;
        });

    })
    //Non duplicated IDs
    return everyUniqueReagent;
}



function GetCreationItemIDsFromRecipesFromJSON(recipeList:any[]):object 
{
    var everyUniqueCreation = {}

    recipeList
    .filter(recipe=>recipe.creates)
    .forEach(recipe => 
    {
        var itemIDCreatedByRecipe = recipe.creates[0]; //0=ID, 1 = Quantity
        everyUniqueCreation[itemIDCreatedByRecipe] = itemIDCreatedByRecipe;
    })
    return everyUniqueCreation;
}

