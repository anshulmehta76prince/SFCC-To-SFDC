/**
 * The controller which handles various features on AvaTax settings page of the BM cartridge
 */
'use strict';

// API includes
var dwsite = require('dw/system/Site');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');
var r = require('~/cartridge/scripts/util/Response');

var params = request.httpParameterMap;

/**
 * It is a starting point for this controller and the page
 */
function start() {
	var currentMenuItemId = params.CurrentMenuItemId.value;
	var menuname = params.menuname.value;
	var mainmenuname = params.mainmenuname.value;

	session.privacy.currentMenuItemId = currentMenuItemId;
	session.privacy.menuname = menuname;
	session.privacy.mainmenuname = mainmenuname;

	var viewObj = {
		CurrentMenuItemId: currentMenuItemId,
		menuname: menuname,
		mainmenuname: mainmenuname
	};

	app.getView(viewObj).render('/SFDC/sfdcorders');
}


function saveCustPrefSFDC() {
    try{
        var formData = {
            loginurl: params.LOGIN_URL.value,
            client_id: params.CLIENT_ID.value,
            client_secret: params.CLIENT_SECRET.value,
            username: params.USERNAME.value,
            password: params.PASSWORD.value,
            restservice: params.RESTSERVICE.value
        };
        dw.system.Transaction.wrap(function () {
            dwsite.getCurrent().setCustomPreferenceValue('SFDCSettings', JSON.stringify(formData));    
        });
        r.renderJSON({
            success: true
        });
    }
    catch (e) {
        r.renderJSON({
            success: false,
            message: e.message
        });
    }
}



function ordertoSFDC() {

    try{
    Logger.info('Started Here');
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
    
    var responseBody = JSON.stringify(orderData);
    Logger.info('Data  {0}.', responseBody);

    
        var httpClient = new HTTPClient();
        var message;

        // Getting Access Token
        var LOGINURL = params.LOGIN_URL.value;
        var GRANTTYPE = '/services/oauth2/token?grant_type=password';
        var loginURL = LOGINURL + GRANTTYPE + 
                        '&client_id=' + params.CLIENT_ID.value + 
                        '&client_secret=' + params.CLIENT_SECRET.value + 
                        '&username=' + params.USERNAME.value + 
                        '&password=' + params.PASSWORD.value;

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
            r.renderJSON({
                success: false,
                message: message
            });
        }

        Logger.info('ACCESSTOKEN {0}', ACCESSTOKEN);
        Logger.info('INSTANCEURL {0}', INSTANCEURL);


        // Calling Apex Rest Service
        httpClient.open('POST', 'https://cunning-wolf-pgsl05-dev-ed.my.salesforce.com/services/apexrest/SFCC/orders');
        httpClient.setRequestHeader('Authorization', 'Bearer '+ACCESSTOKEN);
        httpClient.setTimeout(3000);
        httpClient.send(responseBody);
        if (httpClient.statusCode == 200){
            message = 'Success';
            Logger.info('{0}', message);
            r.renderJSON({
                success: true
            });
        }
        else{
            message = "An error occurred for POST Order with status code "+httpClient.statusCode;
            Logger.info('{0}', message);
            r.renderJSON({
                success: false,
                message: message
            });
        }
        
    }
    catch (e) {
        r.renderJSON({
            success: false,
            message: e.message
        });
    }
}



exports.Start = guard.ensure(['https'], start);
exports.Save = guard.ensure(['https'], saveCustPrefSFDC);
//exports.OrderToSFDC = guard.ensure(['https'], ordertoSFDC);

