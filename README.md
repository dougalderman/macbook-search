##Macbook Search

This is a web scraper searching KSL classifieds for all Macbook pros between $800 and $1000, and >= 256 GB hard drive space. It utilizes Casperjs on top of Phantomjs. Script name is getMacs.js. It write relevant listings to a local file with a current date/time filename in the output folder. 

This script utilizes the KSL classified filter to find keyword 'Macbook pro' and the price range $800 and $1000. 

Since detailed description was on a separate product page, a forEach loop was coded to open all detail product page and save the description to an array:

```javascript
// Get detailed descriptions for all ads
    hrefs.forEach(function(elem, indx, arr) {
        casper.thenOpen('http://www.ksl.com/' + elem).then(function() {
            detailedDescriptions[indx] =   this.fetchText('div.productContentText'); // detail product description
        });
    });
```

###Important user defined functions
####getMacInfo()
Gets the title, price, url, and brief description for all listings from the main listings page.
Here is code to get prices from the page and process the data to allow for future file save in human readable form:
```javascript
// Get prices for all ads
    var prices_str = this.fetchText('div.priceBox');
    var prices_arr = prices_str.split('\n');
    prices_arr = prices_arr.filter(function(item) {
                     return item.indexOf('$') !== -1;
                });

    for (var i = 0; i < prices_arr.length; i++) {
        prices_arr[i] = prices_arr[i].trim(); // remove whitespace
        prices_arr[i] = prices_arr[i].replace(',', '') // remove comma
        prices_arr[i] = (Number(prices_arr[i].slice(1)) / 100).toFixed(2);
    }

    prices.extend(prices_arr);
```

####getHardDriveSizes()
takes in an a string and looks for hard drive size based on keywords such as gb, gigabyte, ssd, etc. This function first does a regex string search for /gb|gigabyte|gig|ssd|hhd|hdd/. It then looks backward from the offset of the keyword for numbers that would indicate hard drive size. Any number <= 32 is considered to be RAM and rejected. It returns an array of hard drive sizes.

The script first passes in the title as an argument to this function. If no hard drive size is found in the title, then the script passes in the brief description, then the detailed description. All products with no hard drize size specified or too small a size are rejected. 

