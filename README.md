# WoW Recipe List to JSON


![](https://trello-attachments.s3.amazonaws.com/54d96ae8cd8a263bf8dd70e9/58a0583c279a6110be1355d0/a7b637438dda91ad590e31be419c6063/Made_with_Love.gif)

## Description

A system that by scraping the html code from Wowhead and using the official Blizzard WoW API can give you a recipe list and the list of every item used in the recipes. 

This repository uses `typescript`, I use `fuse-box` to cook the scripts. And I use [`Rx Observables`](https://github.com/ReactiveX/rxjs) as well! 😊


## To Use

```bash
# Install dependencies
npm install
# Start the fuse server. To cook the ts files
node fuse
# Once fuse is executed, you can use the bundled js in the dist folder.
node dist/recipes.js <wowhead-url>
# Eg.
node dist/recipes.js https://www.wowhead.com/cooking-recipe-spells/outlandish-dishes-header/outlandish-dishes
```

## This is an example recipe item object
You will find this in `Recipe list with reagents.json`
```js
{
    "id":43779,
    "name":"Recipe: Delicious Chocolate Cake",
    "reagents":
    [
        {"id":30817,"quantity":8},
        {"id":1179,"quantity":4},
        {"id":2678,"quantity":4},
        {"id":6889,"quantity":8},
        {"id":2593,"quantity":1},
        {"id":785,"quantity":3}
    ],
    "creates":{"id":33924,"quantity":1}
}
```

You can then use the Blizzard API to get what you need.
For example, I made a request to every `recipe.creates.id` so it would give me all the official item data from the  `BlizzardAPI`.


## Special Thanks
- WoWHead for their community database
- Blizzard for providing their APIs
