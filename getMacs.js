var casper = require('casper').create();
var classname = 'reload-' + (new Date().getTime());

 function getHardDriveSizes(str) {
    var hd_size = 0;
    var hd_sizes = []; // return array of sizes because author may have multiple hard drives
    var hd_gbunits_loc = [];
    var start = 0;
    var offset = 0;
    
    this.echo('in checkHardDriveSize()');
    this.echo('str = ' + str);
    // for some reason, string match isn't working for me, so I'm doing a workaround here using search to get all matched elements.
    while((offset = str.substr(start).search(/gb|gigabyte|gig|ssd|hhd|hdd/i)) !== -1) {   
        this.echo('offset = ' + offset)
        hd_gbunits_loc.push(start + offset);
        start += offset + 1;
    }   
    this.echo('hd_gbunits_loc.length = ' + hd_gbunits_loc.length); 
      
    for (var j = 0; j < hd_gbunits_loc.length; j++) {
        this.echo('j: ' + j);
        this.echo('hd_gbunits_loc: ' + hd_gbunits_loc[j]);
        var hd_size_start = 0;
        var hd_size_end = 0;
        var foundNumber = false;
        for (var k = hd_gbunits_loc[j]; k > 0; k--) {
            this.echo('k: ' + k);
             // retrieve hard drive size
            if (!foundNumber) {
                if ((str.charAt(k) >= '0') ||
                    (str.charAt(k) <= '9' )) {
                    hd_size_end = k;
                    this.echo('hd_size_end: ' + hd_size_end);
                    foundNumber = true;
                }
            }
            else {
               if ((str.charAt(k) < '0') ||
                   (str.charAt(k) > '9' )) {
                    hd_size_start = k + 1;
                    this.echo('hd_size_start: ' + hd_size_start);
                    break;
                } 
            }
        } // k loop

        hd_size = Number(str.substring(hd_size_start, hd_size_end));
        this.echo('hd_size before ternary op: ' + hd_size);
        hd_size = hd_size > 32 ? hd_size : 0; // Must be greater than 32 gb to be a valid hard drive size (versus RAM size).
        this.echo('hd_size after ternary op: ' + hd_size);

        if (hd_size) { // if hard drive size in string
            hd_sizes.push(hd_size); // add to array of hd_sizes
        } 
        else {
            // check for terabyte. If any mention of terabyte, it's big enough.
            if (str.search(/tb|terabyte/i) !== -1) {
                hd.sizes.push(1024); 
            }
        }
    } // j loop
    
    return hd_sizes; 
}

casper.start('http://www.ksl.com/index.php?nid=231&cat=554&category=16', function() { // KSL classifieds, Apple Laptops / Desktops
    this.echo('Apple Laptops / Desktops: ' + this.getTitle());
    
    // Fill out keyword search field and submit
    this.sendKeys('input[name="keyword"]', 'Macbook pro');
    this.click('input[id="searchSubmit"]');
    this.echo('After keyword submit');
});

// It happens when they change something...
casper.evaluate(function(classname){
  document.body.className += ' ' + classname;
}, classname);

casper.waitWhileSelector('body.' + classname, function() {
     this.capture('./screenshots/after_keyword_search.jpg', undefined, {
        format: 'jpg',
        quality: 75
    });
    this.echo('After screenshot');
    
     // Fill out min and max search fields and submit (separate submit for price versus keyword. Keyword search still in place)
    this.sendKeys('input[name="min_priceInput"]', '800');
    this.sendKeys('input[name="max_priceInput"]', '1000');
    this.echo('After price submit');
    this.click('input[id="priceSubmit"]');
}); 

// It happens when they change something...
casper.evaluate(function(classname){
  document.body.className += ' ' + classname;
}, classname);

casper.waitWhileSelector('body.' + classname, function() {
  
    
    
     this.capture('./screenshots/after_price_search.jpg', undefined, {
        format: 'jpg',
        quality: 75
    });
    this.echo('After screenshot');

    // Use fetchText for retrieving titles because getElementsInfo.map will create separate array elements for 'more...'
    var titles_str = this.fetchText('a.listlink'); // titles
    this.echo('Titles: ' + titles_str); 
    // Split title into array based on /more.../ regex
    var titles = titles_str.split(/more.../);
    // Remove blank last element
    titles.pop();
    
    this.echo('titles.length: ' + titles.length);
    for (var i = 0; i < titles.length; i++) {
        this.echo('titles[' + i + ']: ' + titles[i]);
    }
    
    // Use getElementsInfo for retrieving descriptions because it doesn't create separate array element for 'more...'. Correctly maps array. 
    var descriptions = casper.getElementsInfo('div.adDesc').map(function(e){
    return e.html;
}); 
    this.echo('descriptions.length: ' + descriptions.length);
    for (var i = 0; i < descriptions.length; i++) {
        // remove everything starting with <a class="listlink" from description.
        var a_loc = descriptions[i].search('<a class="listlink"');
        if (a_loc > 0)
            descriptions[i] = descriptions[i].slice(0, a_loc);
        this.echo('descriptions[' + i + ']: ' + descriptions[i]);
    }
    
 // Filter through title and description for Macbook Pro because original search filter isn't perfect. If no Macbook Pro in title or description remove from array.
    for (var i = 0; i < titles.length; i++) {
        if (!((titles[i].search(/macbook pro/i) !== -1) ||
           (descriptions[i].search(/macbook pro/i) !== -1))) {
        // if Macbook Pro not found somwhere in title or description, splice from arrays.
            this.echo('splicing element: ' + i)
            titles.splice(i, 1);
            descriptions.splice(i, 1);
        }
    }
    
    this.echo('titles.length after splice: ' + titles.length);
    this.echo('descriptions.length after splice: ' + descriptions.length);
    for (var i = 0; i < titles.length; i++) {
        this.echo('titles[' + i + ']: ' + titles[i]);
        this.echo('descriptions[' + i + ']: ' + descriptions[i]);
    }
    
    // Filter through title and description for hard drive size. Want >= 256GB. Handle all the different ways the ad author can specify hard drive size (xxxGB, xxxGigabyte, xxxgig, xxxtb, xxxTB, xxxSSD, or xxxHHD). Distinguish between hard drive and memory size by assuming > 32GB refers to hard drive. Delete all ads that don't meet criteria or don't specify hard drive size.
    this.echo('hard drive size search');
    
    for (var i = 0; i < titles.length; i++) {
        this.echo('i: ' + i);
        var hd_sizes = [];
        hd_sizes = getHardDriveSizes.call(this, (titles[i])); // check titles
        this.echo('hd_sizes.length (titles): ' + hd_sizes.length);
        if (!hd_sizes.length) { // if didn't return a hard drive length
            hd_sizes = getHardDriveSizes.call(this, descriptions[i]); // check description
             this.echo('hd_sizes.length (descriptions): ' + hd_sizes.length);
            if (!hd_sizes.length) { // if didn't return a hard drive length
                this.echo('before clickLabel detailed description')
                this.clickLabel('titles[i]', a); // get detailed description
                // It happens when they change something...
                casper.evaluate(function(classname){
                  document.body.className += ' ' + classname;
                }, classname);

                casper.waitWhileSelector('body.' + classname, function() {      
                    var detailedDescription = this.fetchText('div.productContentText'); // detail product description
                    this.echo('detailedDescription: ' + detailedDescription);
                    hd.sizes = getHardDriveSizes.call(this, detailedDescription);
                });
                 this.echo('hd_sizes.length (detailed description): ' + hd_sizes.length);
            }
        }
      
        var bigEnough = false;
        for (var h = 0; h < hd_sizes.length; h++) {
            if (hd_sizes[h] >= 256) { // big enough
                bigEnough = true;
                break;
            }
        }
       
        if (!bigEnough) {
            this.echo('splicing element: ' + i)
            titles.splice(i, 1);
            descriptions.splice(i, 1);
        }
            
    } // i loop
    
          
    
});

casper.run();