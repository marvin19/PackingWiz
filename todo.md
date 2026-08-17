## To-Do list overview

- [ ] Remove «Shared» as an option if solo travel

- [ ] Consider merge step 2 and 3?

- [ ] Generate packing list / manually create packing list

- [ ] Add previously added trips to the shortcut below destinations

- [ ] If Lærdal for 3 days is selected again, ask if you would like to reuse the one from _date_

- [ ] If Vik for 3 days is selected but tags and weather is similar as Bergen for 3 days another day, ask if reuse from _trip and date_

- [ ] Add a «Back to all trips» button on review trip screen. Make it possible to change stuff from the review trip screen, or at least redirect back to correct screen

- [ ] Rename Trove to PackingWiz
- [ ] Remove labels when clicking an item
- [ ] Remove the shopping part

Version ||

- [ ] Add labels and a setting wheel to packing items where you can rename something or you can label as need to wash or need to buy

---

~~LEGACY~~

## ~~To-Do list overview~~

- [x] ~~Set up MongoDB connection~~
- [x] ~~Set up tooling~~
- [x] ~~Basic UI to test functionality~~
- [x] ~~Implement GET route to fetch all packing list~~
- [x] ~~Create POST route to create new packing list~~
- [x] ~~Create PUT route to add items to packing list~~
- [x] ~~Add DELETE route ro remove items from packing list~~
- [x] ~~Add DELETE route to remove packing lists~~
- [x] ~~Add PUT route to edit items in packing list~~
- [x] ~~Add PUT route to edit trip details~~
- [x] ~~WeatherAPI ? To calculate weather for destination~~
- [ ] ~~Implement AI-functionality~~
- [ ] ~~Functionality for adding more tags~~
- [ ] ~~Mini refactor~~
- [ ] ~~Add unit-testing~~
- [ ] ~~Add integration-testing~~
- [ ] ~~Add end to end testing~~
- [ ] ~~Add staples logic for items you always pack~~
- [ ] ~~Log in functionality~~
- [ ] ~~Create a pretty UI~~

### ~~Pretty UI~~

- [ ] ~~Red and green borders around input fields~~
- [ ] ~~Fix success message for updating items~~

### ~~Smaller To-Dos~~

- [x] ~~Store weather forecast to packing list to use in AI~~
- [x] ~~Store dates to use for packinglist (7 nights gone, makes 8 pair of socks. Might need more if running)~~
- [x] ~~Give results in a list, give default categories and select custom categories~~
- [x] ~~Figure out what is going on at the end of the generated packing list~~
- [x] ~~Add to buttons "Add suggested items to list" or "Tweak with PackingWiz"~~
- [ ] ~~Figure out how to give basic suggestions like passport, wallet, socks, medicine etc~~
- [ ] ~~Figure out how I can train the model~~
- [x] ~~Figure out how I can store all the suggestions in the database so that they appear in the packing list~~
- [ ] ~~Add remove all items button~~
- [ ] ~~Figure out how I can filter out duplicated, and remove AI suggestions, if add suggested items to packing list is clicked~~
- [ ] ~~Create chat interface if you would like to continue tweaking.~~
- [ ] ~~Remove extra weather from DB, storing all 7 days even if trip is 3 days long.~~
- [ ] ~~Remove hardcoding of openWeather API~~

~~--- NICE TO HAVE ----~~

- [ ] ~~Add support for "packed"~~
- [ ] ~~Temporarily remove item name and quantity when editing categories~~
- [ ] ~~Need a box for looking for places where you are going to be able to connect weather api~~
- [ ] ~~Auto generating images for trip list view, based on destination selected? Also possibilites to override with their own image?~~
- [ ] ~~Add functionality for not selecting a endDate that starts before a start date. Add validation if wrong.~~
- [ ] ~~Find smart ways to sort the data. Should it be able to be sorted based on categories, packed, alphabetically?~~
- [ ] ~~Add "Are you sure?" functionality when deleting items and lists (do not want to do this until project is coming to an end)~~

~~--- DONE ---~~

- [x] ~~Make the select component update the category if you change the category~~
- [x] ~~Make adding select new category impossible from the edit category in packing list~~
- [x] ~~Make the select a component so that I can re-use it when editing an item in a packing list and the categories there~~
- [x] ~~Merge default categories together with custom categories~~
- [x] ~~Format dates~~
- [x] ~~Calculate days gone based on date~~
- [x] ~~Avoid duplicate categories~~
- [x] ~~Besides add to categories, add a way to remove categories and a fallback that those items who had a category becomes Uncategoriezed~~
- [x] ~~Focus disappears from new input field when typing one letter~~
- [x] ~~Make category a select, where you can also add new categories~~
- [x] ~~Removing a category or two, results in all the items being stored in "Uncategorized" which is a category that will be created if it happens.~~
- [x] ~~Set messages for "Category edited successfully" under the input field~~
- [x] ~~Error handling for input fields, do not accept numbers or characters for all input fields.~~
- [x] ~~If not selecting a category, set uncategorized but that is not a~~
- [x] ~~Functionality for updating a category and saving~~
- [x] ~~Avoid duplicated when editing categories~~
- [x] ~~Edit default categories (from a login view?)~~
- [x] ~~Add +Add New Category button to select if possible~~
- [x] ~~Alphabetically sort the select if possible~~
- [x] ~~Add functionality for error messaging when adding trips, and item lists~~
- [x] ~~Add default categories to categories~~
- [x] ~~Add quantity default to 1~~
- [x] ~~Add edit item button~~
- [x] ~~Add prettier on save~~
- [x] ~~Properly formatting of dates (also check console warning for this)~~

### ~~Ideas~~

- ~~Add WeatherAPI for trips planned in advance, make use of AI to recheck date when the trip is closer, and suggest e.g Umbrella if there is going to be rain in Barcelona~~
- ~~Add section for upcoming trips and archived trips~~
- ~~Add functionality to detect "staples" in your packing list and always add those items (with categories) when creating a new packing list~~
