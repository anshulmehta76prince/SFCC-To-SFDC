importPackage(dw.io);
importPackage(dw.util);
importPackage(dw.system);

var Logger = require('dw/system/Logger');
var Order = require('dw/order/Order');
var OrderMgr = require('dw/order/OrderMgr');
//var jsforce = require('jsforce');
var HTTPClient   = require('dw/net/HTTPClient');



function OrderToSFDC(parameters, stepExecution) {

    Logger.info('Started Here');
    Logger.info('SiteId {0}', dw.system.Site.current.name);
    var query = 'confirmationStatus={0}';
        var queryArgs = [
            Order.CONFIRMATION_STATUS_CONFIRMED
        ];
    var orders = OrderMgr.searchOrders(query, 'creationDate asc', queryArgs);
        
    // check if there are CONFIRMED orders or not
    if (empty(orders)) {
        Logger.info('WARNING: No Orders ');
    }

    var orderData = {'data' : []};
    while (orders.hasNext()) {
        var order = orders.next();
        var orderNo = order.getOrderNo();
        /*ProductQuantityTotal = order.getProductQuantityTotal();
        TotalGrossPrice = order.getTotalGrossPrice();
        TotalTax = order.getTotalTax();
        ShippingTotalPrice = order.getShippingTotalPrice();
        Logger.info('Order  {0}.', orderNo);
        Logger.info('TotalGrossPrice  {0}.', TotalGrossPrice);
        Logger.info('TotalTax  {0}.', TotalTax);
        Logger.info('ShippingTotalPrice  {0}.', ShippingTotalPrice);
        Logger.info('ProductQuantityTotal  {0}.', ProductQuantityTotal);*/
        Logger.info('Order  {0}.', orderNo);

        var data = {}


        var ConfirmationStatus =  order.getConfirmationStatus().toString();
        var PaymentStatus = order.getPaymentStatus().toString();
        var ShippingStatus = order.getShippingStatus().toString();
        var product_total = parseFloat(order.getTotalGrossPrice())-parseFloat(order.getShippingTotalPrice())-parseFloat(order.getTotalTax());
        var TotalTax = order.getTotalTax().toString();
        var ShippingTotalPrice = order.getShippingTotalPrice().toString();
        var TotalGrossPrice = order.getTotalGrossPrice().toString();
        
        
        data['order_no'] = order.getOrderNo();
        data['confirmation_status'] = ConfirmationStatus;
        data['payment_status'] = PaymentStatus;
        data['shipping_status'] = ShippingStatus;
        
        data['product_total'] = 'USD '+product_total;
        data['tax_total'] = TotalTax;
        data['shipping_total'] = ShippingTotalPrice;
        data['order_total'] = TotalGrossPrice;

        orderData['data'].push(data); 

    }
    /*
    var responseBody = JSON.stringify(orderData);
    Logger.info('Data  {0}.', responseBody);

    
        var httpClient = new HTTPClient();
        var message;

        // Getting Access Token
        var LOGINURL = 'https://login.salesforce.com';
        var GRANTTYPE = '/services/oauth2/token?grant_type=password';
        var loginURL = LOGINURL + GRANTTYPE + 
                        '&client_id=' + '3MVG97quAmFZJfVzNWpaMN6WcVj.ohYDhOHsiMsrZZWKrq7OKE04tbrm7YvCX0j6NfLQQJYuIiQ==' + 
                        '&client_secret=' + '7CDE14BBE26C7C1DC0AE837CEED26655EC500AFF90AFAA276A9E6E62CA11BE47' + 
                        '&username=' + 'rajanshulmehta7@cunning-wolf-pgsl05.com' + 
                        '&password=' + 'plm76qaz'+'ClqKzpa1ieGxHGJ1Q34In36q';

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
            message = "An error occurred with status code "+httpClient.statusCode;
            Logger.info('{0}', message);
        }

        Logger.info('ACCESSTOKEN {0}', ACCESSTOKEN);
        Logger.info('INSTANCEURL {0}', INSTANCEURL);


        // Calling Apex Rest Service
        Logger.info('URL Test {0}', ''+INSTANCEURL+'/services/apexrest/SFCC/orders');
        httpClient.open('POST', ''+INSTANCEURL+'/services/apexrest/SFCC/orders');
        httpClient.setRequestHeader('Authorization', 'Bearer '+ACCESSTOKEN);
        httpClient.setTimeout(3000);
        httpClient.send(responseBody);
        if (httpClient.statusCode == 200){
            message = 'Success';
            Logger.info('{0}', message);
        }
        else{
            message = "An error occurred with status code "+httpClient.statusCode;
            Logger.info('{0}', message);
        }
    
    */

}

module.exports = {
    OrderToSFDC: OrderToSFDC
}   

/*
"query" :{ 
        "filtered_query": {
        "query": { "match_all_query": {}},
        "filter": {
            "range_filter": {
                "field": "creation_date",
                "from": "2020-06-16T14:41:43.000Z",
                "to": "2020-06-30T14:41:43.000Z"
               }    
           }
       }      
    },
    */