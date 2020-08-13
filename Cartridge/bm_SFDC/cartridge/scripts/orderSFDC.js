'use strict';

var Logger = require('dw/system/Logger');
var Order = require('dw/order/Order');
var OrderMgr = require('dw/order/OrderMgr');
var HTTPClient   = require('dw/net/HTTPClient');


function ordertoSFDC(order) {
    Logger.info('Started Here');
    var orderNo = order.getOrderNo();
    Logger.info('Order  {0}.', orderNo);

    var orderData = {'data' : []};
    var data = {}

    var ConfirmationStatus =  order.getConfirmationStatus().toString();
    var PaymentStatus = order.getPaymentStatus().toString();
    var ShippingStatus = order.getShippingStatus().toString();
    var product_total = parseFloat(order.getTotalGrossPrice())-parseFloat(order.getShippingTotalPrice())-parseFloat(order.getTotalTax());
    var TotalTax = order.getTotalTax().toString();
    var ShippingTotalPrice = order.getShippingTotalPrice().toString();
    var TotalGrossPrice = order.getTotalGrossPrice().toString();
        
    data['order_no'] = order.getOrderNo();
    data['site_id'] = dw.system.Site.current.name;
    data['confirmation_status'] = ConfirmationStatus;
    data['payment_status'] = PaymentStatus;
    data['shipping_status'] = ShippingStatus;
        
    data['product_total'] = 'USD '+product_total;
    data['tax_total'] = TotalTax;
    data['shipping_total'] = ShippingTotalPrice;
    data['order_total'] = TotalGrossPrice;
    
    orderData['data'].push(data);

    var responseBody = JSON.stringify(orderData);
    Logger.info('Data  {0}.', responseBody);

    
    
    var sfdcPrefVal = JSON.parse(dw.system.Site.getCurrent().getCustomPreferenceValue('SFDCSettings'));
    
    var httpClient = new HTTPClient();
    var message;

    // Getting Access Token
    var LOGINURL = sfdcPrefVal.loginurl;
    var GRANTTYPE = '/services/oauth2/token?grant_type=password';
    var loginURL = LOGINURL + GRANTTYPE + 
                    '&client_id=' + sfdcPrefVal.client_id + 
                    '&client_secret=' + sfdcPrefVal.client_secret + 
                    '&username=' + sfdcPrefVal.username + 
                    '&password=' + sfdcPrefVal.password;

    var ACCESSTOKEN = '';
    var INSTANCEURL = '';

    httpClient.open('POST', loginURL);
    httpClient.setTimeout(3000);
    httpClient.send();
    if (httpClient.statusCode == 200){
        message = 'Success';
        Logger.info('{0}', message);
        Logger.info('Text {0}', typeof(httpClient.getText()));
        var result = JSON.parse(httpClient.getText());
        ACCESSTOKEN = result['access_token'];
        INSTANCEURL = result['instance_url'];
    }
    else{
        message = "An error occurred for ACCESSTOKEN with status code "+httpClient.statusCode;
        Logger.info('{0}', message);
    }
    Logger.info('ACCESSTOKEN {0}', ACCESSTOKEN);
    Logger.info('INSTANCEURL {0}', INSTANCEURL);

    // Calling Apex Rest Service
    httpClient.open('POST', ''+INSTANCEURL+'/services/apexrest'+sfdcPrefVal.restservice);
    httpClient.setRequestHeader('Authorization', 'Bearer '+ACCESSTOKEN);
    httpClient.setTimeout(3000);
    httpClient.send(responseBody);
    if (httpClient.statusCode == 200){
        message = 'Success';
        Logger.info('{0}', message);
    }
    else{
        message = "An error occurred for POST Order with status code "+httpClient.statusCode;
        Logger.info('{0}', message);
    }

}


exports.OrderToSFDC = ordertoSFDC;

/*
        'https://login.salesforce.com'
        '3MVG97quAmFZJfVzNWpaMN6WcVj.ohYDhOHsiMsrZZWKrq7OKE04tbrm7YvCX0j6NfLQQJYuIiQ=='
        '7CDE14BBE26C7C1DC0AE837CEED26655EC500AFF90AFAA276A9E6E62CA11BE47'
        'rajanshulmehta7@cunning-wolf-pgsl05.com'
        'plm76qaz'+'ClqKzpa1ieGxHGJ1Q34In36q'
        */