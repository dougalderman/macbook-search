var casper = require('casper').create();
var classname = 'reload-' + (new Date().getTime());
   

/* casper.start('http://ksl.com', function() {
    this.echo('ksl.com: ' + this.getTitle());
    // Click on Classifieds
    this.clickLabel('Classifieds', a);
    this.echo('Classifieds: ' + this.getTitle());
    // Click on Apple Laptops / Desktops
    this.clickLabel('Apple Laptops/Desktops', a);
    this.echo('Apple Laptops/Desktops: ' + this.getTitle());
}); */

casper.start('http://www.ksl.com/index.php?nid=231&cat=554&category=16', function() { // KSL classifieds, Apple Laptops / Desktops
    this.echo('Apple Laptops / Desktops: ' + this.getTitle());
    
    // Fill out search elements (input fields, no form tag)
    
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
}); 

// It happens when they change something...
casper.evaluate(function(classname){
  document.body.className += ' ' + classname;
}, classname);

casper.waitWhileSelector('body.' + classname, function() {
    this.echo('Titles: ' + this.fetchText('a.listlink')); // title
    this.echo('Brief Descriptions: ' + this.fetchText('div.adDesc')); // brief product description
});

casper.run();