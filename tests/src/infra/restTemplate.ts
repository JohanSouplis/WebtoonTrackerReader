import axios from "axios";
import * as cheerio from "cheerio";
import { CallToWebsite } from "../calll_to_website.interface";

export class RestTemplate implements CallToWebsite {
  recupererInformationsWebtoon = async function(url: string): Promise<string> {
    try {
  
      const response = await axios.get(url);
      
   
      const $ = cheerio.load(response.data);
      
  
      const titre = $("title").text();
  
      return titre; 
    } catch (error) {
      console.error(error); 
    }
  }
}