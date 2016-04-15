var casper = require('casper').create();
var classname = 'reload-' + (new Date().getTime());
   

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
    
});

casper.run();