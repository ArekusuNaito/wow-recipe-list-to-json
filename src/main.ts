import { scrapListViewSpells } from "./scrapper";
import WoWAPI from './wow-api';
import { interval as ObservableInterval, from, Observable, timer, noop} from 'rxjs';
import { take, zip, map, every} from 'rxjs/operators';
import axios, { AxiosPromise, AxiosResponse } from 'axios';
import { debug } from 'util';
const fs = require('fs');


//> node recipes.js <url>
// <url> is [2]
let url = process.argv[2]; 
//You need an HTML that has a table with recipes
//It will look for a variable in the html file called: listviewspells
// The following commented url is where you can pretty much get every recipe from every expansion in the game
// url = "https://www.wowhead.com/cooking-recipe-spells/outlandish-dishes-header/outlandish-dishes"
// url = "https://www.wowhead.com/cooking-recipe-spells/old-world-recipes-header/old-world-recipes"
url = "https://www.wowhead.com/cooking-recipe-spells";
1

const wow = new WoWAPI(process.env.blizzard);
let recipes:any[]=[]
let reagentIDs:any[]=[]
let creationIDs:any[]=[]


scrapListViewSpells(url)
.then(spellRecipes=>
{
    
    recipes = GetRecipeListFromJSON(JSON.parse(spellRecipes));
    reagentIDs = GetReagentIDsFromRecipeList(recipes);
    creationIDs = GetCreationItemIDsFromRecipesFromJSON(recipes);
    
    console.log(`${recipes.length} different recipes, ${reagentIDs.length} different reagents ${creationIDs.length} different creation items`);
    console.log(`Recipe list ready!`);
    
    fs.writeFileSync('recipe-list.json', JSON.stringify(recipes), 'utf8');
    return BatchItemRequestWithInterval(creationIDs)
})
.then(creations=>
{
    console.log("Creations ready!", creations.length);
    fs.writeFileSync('creations.json', JSON.stringify(creations), 'utf8');   
    return BatchItemRequestWithInterval(reagentIDs)
})
.then(reagents=>
{
    console.log("Reagents ready!");
    fs.writeFileSync('reagents.json', JSON.stringify(reagents), 'utf8'); 

    console.log("Thank you and take care! :)");
    
})
.catch(reason=>
{
    console.log(reason);
})


function BatchItemRequestWithInterval(itemIDs: string[], allowedConcurrentRequestsPerInterval: number = 50):Promise<any[]>
{
    
    const timeIntervalInMilliseconds = 1000; //This respects the 100 requests per second from Blizzard's Docs
    const emitTimes = Math.ceil(itemIDs.length / allowedConcurrentRequestsPerInterval);
    let items: any[] = []
    let everyRequest: AxiosPromise<any>[] = []

    return new Promise<any[]>((resolve,reject)=>
    {
        //Make 50 requests every second... 
        //Make batches and when the observable completes this, fulfill the requests 😊
        timer(0, timeIntervalInMilliseconds).pipe(take(emitTimes)).subscribe(requestNumber => {

            const sliceStartIndex = requestNumber * allowedConcurrentRequestsPerInterval;
            const sliceEndIndex = (requestNumber + 1) * allowedConcurrentRequestsPerInterval;
            console.log(`Batch: ${requestNumber + 1}/${emitTimes}, requests from: ${sliceStartIndex}->${sliceEndIndex}, Requesting: ${itemIDs.length} items`);
            var requestBatch = wow.getItemBatch(itemIDs.slice(sliceStartIndex, sliceEndIndex))
            everyRequest = [...everyRequest, ...requestBatch];

        },
            (reason) => reject(),
            () => {
                //When completed...
                //We made the requests already, this is required because we don't want to exceed more than 100 requests per second
                //So we make 50 in a second, then another 50... and so on...

                //calling catch(onRejected) internally calls obj.then(undefined, onRejected)
                axios.all(everyRequest.map(request=>request.catch(response=>response)))
                .then(responses => 
                    {
                        items = responses.filter(response=>response.data).map(response => response.data)
                        resolve(items);
                    })
                .catch(reason => console.log(`Batch request error: ${reason}`));
            })
    });
}

//By using a hashset, it removes duplicated elements
//from an array. You can send a key if you have an object and you have an unique identifier
//For example, for the recipes, you can send "id", it will look for {id:375} in the recipe object
function RemoveDuplicates(elements: any[],key:string=null):any[]
{
    let hashSet = {}
    let nonDuplicatedItems:any[] = [];
    elements.forEach(element=>
    {
        //if key is sent, use it, otherwise it's probably an array of primitives, not an object
        if(key)hashSet[element[key]]=element; 
        else hashSet[element]=element
    });
    for (var id in hashSet) 
    {
        nonDuplicatedItems.push(hashSet[id]);
    }
    return nonDuplicatedItems;
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
        //Create our own recipe object

        let newRecipe:any={};
        newRecipe.id = recipe.id;
        newRecipe.name = `Recipe: ${recipe.name.substring(1)}`; //remove that '7' at the beggining of each scrapped recipe
        newRecipe.reagents = [];
        recipe.reagents.forEach(reagent => {
            newRecipe.reagents.push({ id: reagent[0], quantity: reagent[1] });
        })
        newRecipe.creates = { id: recipe.creates[0], quantity: recipe.creates[1] };
        //Finally, add it to the list
        everyRecipe.push(newRecipe);
        // everyRecipe[recipe.id]=newRecipe;
    })
    // console.log(`${everyRecipe.length} from WoWHead`);
    // console.log(`${everyRecipe.length} from WoWHead without duplicates`);

    return RemoveDuplicates(everyRecipe, "id");;
}


//##############################################################################
//
//Parameter: an array of recipes from wowhead's scrapping
//Returns: An object containing the reagentIDs as keys and values
//The recipe objects are taken from wow-head
function GetReagentIDsFromRecipeList(recipeList:any[]):any[]
{
    // console.log(recipeList);
    recipeList.flat
    let ids:any[]=[];
    recipeList.filter(recipe=>recipe.reagents)
    .map(recipe=>
    {
        return recipe.reagents
    })
    .forEach(array=>
    {
        array.forEach(reagent=>ids.push(reagent.id)) 
    });
    
    
    
    return RemoveDuplicates(ids);;
}



function GetCreationItemIDsFromRecipesFromJSON(recipeList:any[]):any[] 
{
    
    const creationItems=recipeList
    .filter(recipe=>recipe.creates)
    .map(recipe => 
    {   
        return recipe.creates.id;
        
    });
    
    return RemoveDuplicates(creationItems);
}

