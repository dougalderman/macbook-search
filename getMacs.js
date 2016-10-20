var casper = require('casper').create(
 /*   {
        verbose: true,
        logLevel: 'debug'
    } */
),
    titles = [],
    hrefs = [],
    descriptions = [],
    detailedDescriptions = [],
    prices = [],
    hardDriveSizes = [],
    macbook_pros = '',
    donePaging = false,
    curr_url = '';

Array.prototype.extend = function(other_array) {
    if (other_array.length)
        other_array.forEach(function(v) {this.push(v)}, this);    
};

function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

function getHardDriveSizes(str) {
    var hd_size = 0,
        hd_sizes = [], // return array of sizes because author may have multiple hard drives
        hd_gbunits_loc = [],
        start = 0,
        offset = 0,
        hd_size_start = 0,
        hd_size_end = 0;

    str = str.toLowerCase();

    // check for terabyte. If any mention of terabyte, it's big enough.
    if (str.search(/terabyte/) !== -1) {
        hd_sizes.push(1024);
        return hd_sizes;
    }

    // for some reason, string match isn't working for me, so I'm doing a workaround here using search to get all matched elements.
    while ((offset = str.substr(start).search(/gb|gigabyte|gig|ssd|hhd|hdd/)) !== -1) {         hd_gbunits_loc.push(start + offset);
        start += offset + 1;
    }   
      
    for (var j = 0; j < hd_gbunits_loc.length; j++) {
        hd_size = 0;
        var foundNumber = false;
        for (var k = hd_gbunits_loc[j] - 1; k > 0; k--) {
             // retrieve hard drive size
            if (!foundNumber) {
                if ((str.charAt(k) >= '0') &&
                    (str.charAt(k) <= '9' )) {
                    hd_size_end = k;
                    foundNumber = true;
                }
                else if ((str.charAt(k) >= 'a') &&
                    (str.charAt(k) <= 'z' )) { // if alpha to left of units
                    break; // ignore
                }
            }
            else {  // if foundNumber, find first non-numeric character to left of number
               if ((str.charAt(k) < '0') ||
                   (str.charAt(k) > '9' )) {
                    hd_size_start = k + 1;
                    break;
                } 
            }
        } // k loop
        
        if (hd_size_end) {
            hd_size = Number(str.substring(hd_size_start, hd_size_end + 1));
            hd_size = (hd_size > 32) && (hd_size < 2000) ? hd_size : 0; // Must be greater than 32 gb to be a valid hard drive size (versus RAM size). Must be less than 2000 or assume it's a typo.
        }

        if (hd_size !== 0) { // if nonzero hard drive size in string
            hd_sizes.push(hd_size); // add to array of hd_sizes
        }
        
    } // j loop

    return hd_sizes;
}  // getHardDriveSizes

function getMacInfo() {
    // save off url
    curr_url = this.getCurrentUrl();
    
    // Get titles for all ads
    var titles_arr = this.getElementsInfo('a.listlink').map(function(e){
    return e.html;
});
    for (var i = titles_arr.length - 1; i >= 0; i--) {
        // remove 'more...' elements
        if (titles_arr[i] === 'more...')
            titles_arr.splice(i, 1);
    }

    titles.extend(titles_arr);
    
    // Get hrefs for all ads
    var hrefs_arr = this.getElementsAttribute('span.adTitle a.listlink', 'href');
    
    hrefs.extend(hrefs_arr);
    
    // Get prices for all ads
    var prices_str = this.fetchText('div.priceBox');
	this.echo('prices_str: ' + prices_str);
    var prices_arr = prices_str.split('\n');
    prices_arr = prices_arr.filter(function(item) {
                     return item.indexOf('$') !== -1;
                });

    for (var i = 0; i < prices_arr.length; i++) {
        prices_arr[i] = prices_arr[i].trim(); // remove whitespace
        prices_arr[i] = prices_arr[i].replace(',', '') // remove comma
        prices_arr[i] = (Number(prices_arr[i].slice(1)) / 100).toFixed(2);
    }

	this.echo('prices_arr: ' + prices_arr);
	prices.extend(prices_arr);
	this.echo('prices: ' + prices);
    
    var descriptions_arr = this.getElementsInfo('div.adDesc').map(function(e){
    return e.html;
});
    for (var i = 0; i < descriptions_arr.length; i++) {
        // remove everything starting with <a class="listlink" from description.
        var a_loc = descriptions_arr[i].search('<a class="listlink"');
        if (a_loc > 0)
            descriptions_arr[i] = descriptions_arr[i].slice(0, a_loc);
    }

    descriptions.extend(descriptions_arr);
    
    var nextPageSelector = 'a.pBox span.productPaginationButton';
    if (this.visible(nextPageSelector)) {
        this.thenClick(nextPageSelector, getMacInfo) // recursively call getMacInfo
    }
}


casper.start('http://www.ksl.com/index.php?nid=231&cat=554&category=16', function() { // KSL classifieds, Apple Laptops / Desktops
	// Check for command line arguments
	
	if (casper.cli.args.length !== 2) {
    	this.echo('Need low price and high price arguments') 
		this.echo('casperjs getMacs.js lowprice highprice')
		.exit();
	}
	else {
		var lowPrice = casper.cli.args[0];
		var highPrice = casper.cli.args[1];
		this.echo('lowPrice: ' + lowPrice);
		this.echo('highPrice: ' + highPrice);
	}
	
	
    // Fill out keyword search field and submit
    this.sendKeys('input[name="keyword"]', 'Macbook pro');
    this.thenClick('input[id="searchSubmit"]');
	this.waitForSelectorTextChange('.listings', function() {
         // Fill out min and max search fields and submit (separate submit for price versus keyword. Keyword search still in place)
		this.echo('in priceSubmit function');
		this.echo('lowPrice (2): ' + lowPrice);
		this.echo('highPrice: (2)' + highPrice);
        this.sendKeys('input[name="min_priceInput"]', lowPrice);
        this.sendKeys('input[name="max_priceInput"]', highPrice);
        this.thenClick('input[id="priceSubmit"]'); this.waitForSelectorTextChange('.listings', getMacInfo);
    });
});

casper.then(function() {
 // Filter through title and description for Macbook Pro because original search filter isn't perfect. If no Macbook Pro in title or description remove from array.
    for (var i = titles.length - 1; i >= 0; i--) {
        if (!((titles[i].search(/macbook pro/i) !== -1) ||
           (descriptions[i].search(/macbook pro/i) !== -1))) {
        // if Macbook Pro not found somwhere in title or description, splice from arrays.
            titles.splice(i, 1);
            descriptions.splice(i, 1);
            hrefs.splice(i, 1);
            prices.splice(i, 1);
        }
    }

    // Get detailed descriptions for all ads
    hrefs.forEach(function(elem, indx, arr) {
        casper.thenOpen('http://www.ksl.com/' + elem).then(function() {
            detailedDescriptions[indx] =   this.fetchText('div.productContentText'); // detail product description
        });
    });
});

casper.waitFor(function check() {
    return (detailedDescriptions.length === titles.length) && (titles.length !== 0);
}, function then() {


    // Filter through title and description for hard drive size. Want >= 256GB. Handle all the different ways the ad author can specify hard drive size (xxxGB, xxxGigabyte, xxxgig, xxxterabyte, xxxSSD, or xxxHHD). Distinguish between hard drive and memory size by assuming > 32GB refers to hard drive. Delete all ads that don't meet criteria or don't specify hard drive size.

    for (var i = 0; i < titles.length; i++) {
        hardDriveSizes[i] = getHardDriveSizes.call(this, (titles[i])); // check titles
        if (!hardDriveSizes[i].length) { // if didn't return a hard drive length
            hardDriveSizes[i] = getHardDriveSizes.call(this, descriptions[i]); // check description
            if (!hardDriveSizes[i].length) { // if didn't return a hard drive length
                hardDriveSizes[i] = getHardDriveSizes.call(this, detailedDescriptions[i]);
            }
        }
    } // i loop

    for (var i = titles.length - 1; i >= 0; i--) {

        var bigEnough = false;

        for (var j = 0; j < hardDriveSizes[i].length; j++) {
            if (hardDriveSizes[i][j] >= 256) { // big enough
                bigEnough = true;
                break;
            }
        }

        if (!bigEnough) {
            titles.splice(i, 1);
            descriptions.splice(i, 1);
            hrefs.splice(i, 1);
            prices.splice(i, 1);
            detailedDescriptions.splice(i, 1);
        }

    } // i loop


    // Write results to file

    for (var i = 0; i < titles.length; i++) {
        macbook_pros += 'title: ' + titles[i] + '\nprice: $' + prices[i] + '\nurl: ' + 'http://www.ksl.com/' + hrefs[i] + '\ndescription: ' + detailedDescriptions[i] + '\n-------------------------------------------------------\n';
    }

    var fs = require('fs');
    var date = new Date();
    var fname = 'output/' + date.getFullYear() + '_' + (date.getMonth() + 1) + '_' + date.getDate() + '_' + addZero.call( this, date.getHours())  + addZero.call(this, date.getMinutes()) + '.txt';
    fs.write(fname, macbook_pros, 'w');
    

}, function timeout() {
    this.echo('timed out waiting ').exit();
}, 600000);  // increase timeout from default (5 secs) to 600 secs

casper.run();