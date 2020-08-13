'use strict';

/* API Includes */
importPackage(dw.io);
importPackage(dw.util);
importPackage(dw.system);

var OrderMgr = require('dw/order/OrderMgr');
var Money = require('dw/value/Money');
var Logger = require('dw/system/Logger');

function weeklyorderreport(parameters, stepExecution) {
    var csvWriter : CSVStreamWriter = null;
    var directory = new File(File.IMPEX + File.SEPARATOR + "src" + File.SEPARATOR + "customreports" + File.SEPARATOR + "order" + File.SEPARATOR + "weekly");

    if (!directory.exists()) { // checks whether the destination directory exists; if not, creates it
        if (!directory.mkdirs()) {
            return PIPELET_ERROR;
        }
    }

    fileName = Site.getCurrent().name + "_" + StringUtils.formatCalendar(System.getCalendar(), 'yyyyMMdd_HHmmss') + ".csv";
    fileHandler = new File(directory, fileName);

    if (!fileHandler.exists()) {
        if (!fileHandler.createNewFile()) {
            return PIPELET_ERROR;
        }
    }

    try {
        // find the most recent Sunday
        var endDate = new Calendar();
        var dayOfWeek = endDate.get(Calendar.DAY_OF_WEEK);
        
        endDate.set(Calendar.HOUR, 11);
        endDate.set(Calendar.MINUTE, 59);
        endDate.set(Calendar.SECOND, 59);
        endDate.set(Calendar.AM_PM, 1);
        
        endDate.add(Calendar.DATE, (-1 * (dayOfWeek - 1)));
        
        var endTime = endDate.getTime();

        // find the proceeding Monday
        var startDate = new Calendar();
        
        startDate.set(Calendar.HOUR, 0);
        startDate.set(Calendar.MINUTE, 0);
        startDate.set(Calendar.SECOND, 0);
        startDate.set(Calendar.AM_PM, 0);
        
        startDate.add(Calendar.DATE, (-1 * ((dayOfWeek - 2) + 7)));

        var startTime = startDate.getTime();
        
        //var queryString : String = "creationDate >= {0} and creationDate <= {1}";
        //var orders = OrderMgr.queryOrders(queryString, "orderNo ASC", [startTime, endTime]);
        Logger.info('Here I am');
        var query = 'confirmationStatus={0}';
        var queryArgs = [
            Order.CONFIRMATION_STATUS_CONFIRMED
        ];
        var orders = OrderMgr.searchOrders(query, 'creationDate asc', queryArgs);
        if (empty(orders)) {
            Logger.info('WARNING: No Orders ');
        }
        else{
            Logger.info('Orders ');
        }

        csvWriter = new CSVStreamWriter(new FileWriter(fileHandler, true)); // open the file in append mode

        csvWriter.writeNext([
            "Sales - " + 
            StringUtils.formatCalendar(Calendar(startDate), 'EEEE MMMM d h:mm:ssa').replace(/\b\w/g, function(c){ return c.toUpperCase() }) + 
            " through " + 
            StringUtils.formatCalendar(Calendar(endDate), 'EEEE MMMM d h:mm:ssa').replace(/\b\w/g, function(c){ return c.toUpperCase() })
        ]);
        
        csvWriter.writeNext([""]);
        csvWriter.writeNext(["Sale Date", "Time of Sale", "Order Number", "Source", "Model Number", "Qty", "Price", "Promo Code", "City", "State", "Zip"]);
        
        var qtyTotal = 0;
        var priceTotal : Money = new Money(0, Site.getCurrent().defaultCurrency);

        Logger.info('While Order');
        while(orders.hasNext()) {

            let order = orders.next();
            var orderNo = order.getOrderNo();
            Logger.info('Order  {0}.', orderNo);
        	
        	if(order.status != order.ORDER_STATUS_FAILED){
	        	// we only want the first product line item (website currently restricts orders to 1 line item)
	        	let productLine = order.getAllProductLineItems()[0];
	        	let productLineQty = productLine.quantity;
	        	let orderBasePrice = productLine.getAdjustedPrice();
	        	let productBasePrice = orderBasePrice.divide(parseInt(productLineQty));
	        	let channel = (order.getChannelType()) ? order.getChannelType() : 'Website';
	        	let couponCode = order.getCouponLineItems().length > 0 ? order.getCouponLineItems()[0].couponCode : 'None';
	        	let shippingState = (order.getDefaultShipment().shippingAddress.stateCode) ? order.getDefaultShipment().shippingAddress.stateCode : '';
	        	let shippingPostalCode = (order.getDefaultShipment().shippingAddress.postalCode) ? order.getDefaultShipment().shippingAddress.postalCode : '';
	            
	        	qtyTotal += productLineQty;
	        	priceTotal = priceTotal.add(orderBasePrice);
	        	
	            csvWriter.writeNext([
	                StringUtils.formatCalendar(Calendar(order.creationDate), 'M/d/yy'),		// creation date
	                StringUtils.formatCalendar(Calendar(order.creationDate), 'h:mm:ssa'),   // creation time
	                order.orderNo,                                                          // order number
	                channel,                                                                // channel type (should always be storefront)
	                productLine.productID,                                                  // product ID
	                productLineQty,                                                   		// product line item quantity
	                productBasePrice.toString(),                                            // product total (base price)
	                couponCode,                                                             // coupon code (if available)
	                order.getDefaultShipment().shippingAddress.city,						// shipping city
	                shippingState,															// shipping state
	                shippingPostalCode														// shipping postal code
	            ]);
        	}
        }

        csvWriter.writeNext(["", "", "", "", "Total", qtyTotal, priceTotal.toString(), "", "", "", ""]);
        csvWriter.close();
    } catch(ex) {
        var i = ex;
        Logger.debug("[exception caught] " + ex);
       
        return {"error": true};
    } finally {

    }
   
   return {"error": false};
}

module.exports = {
    weeklyOrderReport: weeklyorderreport
}