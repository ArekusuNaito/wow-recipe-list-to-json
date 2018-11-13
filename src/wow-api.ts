import axios, { AxiosPromise } from 'axios';

export default class WoWAPI
{
    private baseURL: string = "https://us.api.blizzard.com";
    private iconBaseURL: string = "https://render-us.worldofwarcraft.com"
    constructor(token:string)
    {

        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    getItem(itemID:string):AxiosPromise
    {
        // console.log(`${this.baseURL}/wow/item/${itemID}`);
        return axios.get(`${this.baseURL}/wow/item/${itemID}`);
    }

    getRecipe(recipeID:string): AxiosPromise
    {
        return axios.get(`${this.baseURL}/wow/recipe/${recipeID}`);
    }

    getItemBatch(itemIDs:string[]):AxiosPromise<any>[]
    {
        return itemIDs.map(id=>this.getItem(id))
    }
}

