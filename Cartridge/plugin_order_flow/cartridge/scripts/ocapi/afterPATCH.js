'use strict';

/* API Includes */
var Order = require('dw/order/Order');
var Transaction = require('dw/system/Transaction');

function afterPATCH (order, object) {
    Transaction.wrap(function () {
        //order.setExportStatus(Order.EXPORT_STATUS_READY);
    });
}

exports.afterPATCH = afterPATCH;
