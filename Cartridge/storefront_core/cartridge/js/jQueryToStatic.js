'use strict'

var fs = require('fs-extra');

// destination will be created or overwritten by default

//jquery
fs.copyFile('./node_modules/jquery/dist/jquery.min.js', './storefront_core/cartridge/static/default/lib/jquery/jquery.min.js', function copy(err) {
    if (err) {
        throw err;
    }
    else {
        console.log('jquery - COPIED');
    }
});

//jquery-ui.min.js
fs.copyFile('./node_modules/jquery-ui-dist/jquery-ui.min.js', './storefront_core/cartridge/static/default/lib/jquery/ui/jquery-ui.min.js', function copy(err) {
    if (err) {
        throw err;
    }
    else {
        console.log('jquery-ui.js - COPIED');
    }
});

//jquery-ui.min.css
fs.copyFile('./node_modules/jquery-ui-dist/jquery-ui.min.css', './storefront_core/cartridge/static/default/lib/jquery/ui/jquery-ui.min.css', function copy(err) {
    if (err) {
        throw err;
    }
    else {
        console.log('jquery-ui.css - COPIED');
    }
});

//jQuery Validate
fs.copyFile('./node_modules/jquery-validation/dist/jquery.validate.min.js',  './storefront_core/cartridge/static/default/lib/jquery/jquery.validate.min.js', function copy(err) {
    if (err) {
        throw err;
    }
    else {
        console.log('jquery-validate - COPIED');
    }
});

// jquery.jcarousel
fs.copyFile('./node_modules/jcarousel/dist/jquery.jcarousel.min.js', './storefront_core/cartridge/static/default/lib/jquery/jquery.jcarousel.min.js', function copy(err) {
    if (err) {
        throw err;
    }
    else {
        console.log('jquery.jcarousel - COPIED');
    }
});

//jquery.zoom
fs.copyFile('./node_modules/jquery-zoom/jquery.zoom.min.js', './storefront_core/cartridge/static/default/lib/jquery/jquery.zoom.min.js', function copy(err) {
    if (err) {
        throw err;
    }
    else {
        console.log('jquery.zoom - COPIED');
    }
});

