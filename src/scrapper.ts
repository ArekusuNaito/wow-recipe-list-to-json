import axios from 'axios';
const fs = require('fs');


export function scrapListViewSpells(searchURL: string):Promise<any>
{
  return new Promise((resolve:FunctionStringCallback,reject)=>
  {
    axios.get(searchURL)
    .then(response => {
      console.log(`Looking for recipes in WoWHead's html: ${searchURL}`);
      
      let htmlContents: string = response.data;
      // ,frommerge:1 is something that messes up the json format, its on the spellList array
      // yet, it does't have quotations, so I'm removing that in every coicidence using the g/global option
      htmlContents = htmlContents.replace(/,frommerge:1/g, '');

      //Finally from the whole html find the "listviewspells" variable that holds the search from wowhead's database
      const match = htmlContents.match(/listviewspells = (.*);/);
      if(!match)
      {
        reject(`The wowhead webpage you want to scrap, doesn't have any valid recipes`);
      }
      else
      {
        const recipes = match[1]; //=> the captured array
        //
        console.log("All set!");
        resolve(recipes);
      }
      

    })
  })

    
}


