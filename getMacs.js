var casper = require('casper').create(
/*    {
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

    this.echo('in getHardDriveSize()');
    this.echo('str = ' + str);
    str = str.toLowerCase();

    // check for terabyte. If any mention of terabyte, it's big enough.
    if (str.search(/terabyte/) !== -1) {
        hd_sizes.push(1024);
        return hd_sizes;
    }

    this.echo('after terabyte check');
    // for some reason, string match isn't working for me, so I'm doing a workaround here using search to get all matched elements.
    while ((offset = str.substr(start).search(/gb|gigabyte|gig|ssd|hhd|hdd/)) !== -1) {         hd_gbunits_loc.push(start + offset);
        start += offset + 1;
    }   
    this.echo('hd_gbunits_loc.length = ' + hd_gbunits_loc.length);
      
    for (var j = 0; j < hd_gbunits_loc.length; j++) {
        this.echo('j: ' + j);
        this.echo('hd_gbunits_loc: ' + hd_gbunits_loc[j]);
        hd_size = 0;
        var foundNumber = false;
        for (var k = hd_gbunits_loc[j] - 1; k > 0; k--) {
            this.echo('k: ' + k);
             // retrieve hard drive size
            if (!foundNumber) {
                if ((str.charAt(k) >= '0') &&
                    (str.charAt(k) <= '9' )) {
                    hd_size_end = k;
                    this.echo('hd_size_end: ' + hd_size_end);
                    foundNumber = true;
                }
                else if ((str.charAt(k) >= 'a') &&
                    (str.charAt(k) <= 'z' )) { // if alpha to left of units
                    this.echo('alpha to left of units');
                    break; // ignore
                }
            }
            else {  // if foundNumber, find first non-numeric character to left of number
               if ((str.charAt(k) < '0') ||
                   (str.charAt(k) > '9' )) {
                    hd_size_start = k + 1;
                    this.echo('hd_size_start: ' + hd_size_start);
                    break;
                } 
            }
        } // k loop
        
        if (hd_size_end) {
            hd_size = Number(str.substring(hd_size_start, hd_size_end + 1));
            this.echo('hd_size before ternary op: ' + hd_size);
            hd_size = (hd_size > 32) && (hd_size < 2000) ? hd_size : 0; // Must be greater than 32 gb to be a valid hard drive size (versus RAM size). Must be less than 2000 or assume it's a typo.
            this.echo('hd_size after ternary op: ' + hd_size);
        }

        if (hd_size !== 0) { // if nonzero hard drive size in string
            this.echo('pushing ' + hd_size + ' into array');
            hd_sizes.push(hd_size); // add to array of hd_sizes
        }
        
    } // j loop

    return hd_sizes;
}  // getHardDriveSizes

function getMacInfo() {
    // save off url
    curr_url = this.getCurrentUrl();
    this.echo('curr_url: ' + curr_url);

    // Get titles for all ads
    var titles_arr = this.getElementsInfo('a.listlink').map(function(e){
    return e.html;
});
    for (var i = titles_arr.length - 1; i >= 0; i--) {
        // remove 'more...' elements
        if (titles_arr[i] === 'more...')
            titles_arr.splice(i, 1);
    }

    this.echo('titles_arr_length after removing more... elements: ' + titles_arr.length);

    for (var i = 0; i < titles_arr.length; i++) {
        this.echo('titles_arr[' + i + ']: ' + titles_arr[i]);
    }
    
    titles.extend(titles_arr);
    this.echo('titles.length after extend: ' + titles.length);

    // Get hrefs for all ads
    var hrefs_arr = this.getElementsAttribute('span.adTitle a.listlink', 'href');
    for (var i = 0; i < hrefs_arr.length; i++) {
        this.echo('hrefs_arr[' + i + ']: ' + hrefs_arr[i]);
    }

    hrefs.extend(hrefs_arr);
    this.echo('hrefs.length after extend: ' + hrefs.length);


    // Get prices for all ads
    var prices_str = this.fetchText('div.priceBox');
    this.echo('prices_str: ' + prices_str);
    var prices_arr = prices_str.split('\n');
    prices_arr = prices_arr.filter(function(item) {
                     return item.indexOf('$') !== -1;
                });

    this.echo('prices_arr.length: ' + prices_arr.length);
    for (var i = 0; i < prices_arr.length; i++) {
        this.echo('prices_arr[' + i + '] before formatting: ' + prices_arr[i]);
        prices_arr[i] = prices_arr[i].trim(); // remove whitespace
        prices_arr[i] = prices_arr[i].replace(',', '') // remove comma
        prices_arr[i] = (Number(prices_arr[i].slice(1)) / 100).toFixed(2);
        this.echo('prices_arr[' + i + ']: after formatting: ' + prices_arr[i]);
    }

    prices.extend(prices_arr);
    this.echo('prices.length after extend: ' + prices.length);

    var descriptions_arr = this.getElementsInfo('div.adDesc').map(function(e){
    return e.html;
});
    this.echo('descriptions_arr.length: ' + descriptions_arr.length);
    for (var i = 0; i < descriptions_arr.length; i++) {
        // remove everything starting with <a class="listlink" from description.
        var a_loc = descriptions_arr[i].search('<a class="listlink"');
        if (a_loc > 0)
            descriptions_arr[i] = descriptions_arr[i].slice(0, a_loc);
        this.echo('descriptions_arr[' + i + ']: ' + descriptions_arr[i]);
    }

    descriptions.extend(descriptions_arr);
    this.echo('descriptions.length after extend: ' + descriptions.length);

    var nextPageSelector = 'a.pBox span.productPaginationButton';
    if (this.visible(nextPageSelector)) {
        this.echo('before next page click');
        this.thenClick(nextPageSelector, getMacInfo) // recursively call getMacInfo
    }
}


casper.start('http://www.ksl.com/index.php?nid=231&cat=554&category=16', function() { // KSL classifieds, Apple Laptops / Desktops
    this.echo('Page Title: ' + this.getTitle());

    // Fill out keyword search field and submit
    this.sendKeys('input[name="keyword"]', 'Macbook pro');
    this.thenClick('input[id="searchSubmit"]', function() {
        this.echo('After keyword submit');
         // Fill out min and max search fields and submit (separate submit for price versus keyword. Keyword search still in place)
        this.sendKeys('input[name="min_priceInput"]', '800');
        this.sendKeys('input[name="max_priceInput"]', '1000');
        this.echo('Before price submit');
        this.thenClick('input[id="priceSubmit"]', getMacInfo);
    });
});

casper.then(function() {
 // Filter through title and description for Macbook Pro because original search filter isn't perfect. If no Macbook Pro in title or description remove from array.
    for (var i = titles.length - 1; i >= 0; i--) {
        if (!((titles[i].search(/macbook pro/i) !== -1) ||
           (descriptions[i].search(/macbook pro/i) !== -1))) {
        // if Macbook Pro not found somwhere in title or description, splice from arrays.
            this.echo('splicing element: ' + i)
            titles.splice(i, 1);
            descriptions.splice(i, 1);
            hrefs.splice(i, 1);
            prices.splice(i, 1);
        }
    }

    this.echo('titles.length after splice: ' + titles.length);
    this.echo('descriptions.length after splice: ' + descriptions.length);
    this.echo('hrefs.length after splice: ' + hrefs.length);
    this.echo('prices.length after splice: ' + prices.length);
    for (var i = 0; i < titles.length; i++) {
        this.echo('titles[' + i + ']: ' + titles[i]);
        this.echo('descriptions[' + i + ']: ' + descriptions[i]);
        this.echo('hrefs[' + i + ']: ' + hrefs[i]);
        this.echo('prices[' + i + ']: ' + prices[i]);
    }

    // Get detailed descriptions for all ads
    hrefs.forEach(function(elem, indx, arr) {
        casper.thenOpen('http://www.ksl.com/' + elem).then(function() {
            detailedDescriptions[indx] =   this.fetchText('div.productContentText'); // detail product description
            this.echo('detailedDescriptions[' + indx + ']: ' + detailedDescriptions[indx]);
        });
    });
});

casper.waitFor(function check() {
    return (detailedDescriptions.length === titles.length) && (titles.length !== 0);
}, function then() {


    // Filter through title and description for hard drive size. Want >= 256GB. Handle all the different ways the ad author can specify hard drive size (xxxGB, xxxGigabyte, xxxgig, xxxterabyte, xxxSSD, or xxxHHD). Distinguish between hard drive and memory size by assuming > 32GB refers to hard drive. Delete all ads that don't meet criteria or don't specify hard drive size.

    this.echo('hard drive size search');
    for (var i = 0; i < titles.length; i++) {
        this.echo('i: ' + i);
        this.echo('getHardDriveSizes call for titles[' + i + ']');
        hardDriveSizes[i] = getHardDriveSizes.call(this, (titles[i])); // check titles
        this.echo('hardDriveSizes[' + i + '] length (titles): ' + hardDriveSizes[i].length);
        if (!hardDriveSizes[i].length) { // if didn't return a hard drive length
            this.echo('getHardDriveSizes call for descriptions[' + i + ']');
            hardDriveSizes[i] = getHardDriveSizes.call(this, descriptions[i]); // check description
             this.echo('hardDriveSizes[' + i + '] length (descriptions): ' + hardDriveSizes[i].length);
            if (!hardDriveSizes[i].length) { // if didn't return a hard drive length
                this.echo('getHardDriveSizes call for detailedDesc');
                hardDriveSizes[i] = getHardDriveSizes.call(this, detailedDescriptions[i]);
                this.echo('hardDriveSizes[' + i + '] length (detailed descriptions): ' + hardDriveSizes[i].length);
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
            this.echo('splicing element: ' + i)
            titles.splice(i, 1);
            descriptions.splice(i, 1);
            hrefs.splice(i, 1);
            prices.splice(i, 1);
            detailedDescriptions.splice(i, 1);
        }

    } // i loop


    // Write results to file

    this.echo('titles.length: ' + titles.length);
    for (var i = 0; i < titles.length; i++) {
        macbook_pros += 'title: ' + titles[i] + '\nprice: $' + prices[i] + '\nurl: ' + 'http://www.ksl.com/' + hrefs[i] + '\ndescription: ' + detailedDescriptions[i] + '\n-------------------------------------------------------\n';
    }

    this.echo('before write to file');
    var fs = require('fs');
    var date = new Date();
    var fname = 'output/' + date.getFullYear() + '_' + (date.getMonth() + 1) + '_' + date.getDate() + '_' + addZero.call( this, date.getHours())  + addZero.call(this, date.getMinutes()) + '.txt';
    fs.write(fname, macbook_pros, 'w');
    this.echo('after write to file');


}, function timeout() {
    this.echo('timed out waiting ').exit();
}, 600000);  // increase timeout from default (5 secs) to 600 secs

casper.run();