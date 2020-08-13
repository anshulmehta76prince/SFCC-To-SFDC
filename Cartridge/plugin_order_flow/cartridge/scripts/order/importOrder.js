var ArrayList = require('dw/util/ArrayList');
var Status = require('dw/system/Status');
var File = require('dw/io/File');
var FileReader = require('dw/io/FileReader');
var HookMgr = require('dw/system/HookMgr');
var Logger = require('dw/system/Logger');
var Order = require('dw/order/Order');
var OrderMgr = require('dw/order/OrderMgr');
var XMLStreamConstants = require('dw/io/XMLStreamConstants');
var XMLStreamReader = require('dw/io/XMLStreamReader');
var Transaction = require('dw/system/Transaction');

exports.OrderImport = function(args) {
    Logger.info('Start importing orders');
    var fileList = new ArrayList(); // : List
    var filesDir = new File(File.IMPEX + '/' + args.FilesPath); // : File

    fileList.addAll(filesDir.listFiles(function (file) {
        return file.isFile();
    }));

    var processedFilesCounter = 0;
    var numberOfFiles = fileList.length;

    Logger.info('Found {0} orders in {1}', numberOfFiles, args.FilesPath);

    for (var i = 0; i < fileList.length; i++) {

        var file = fileList[i];

        var fileReader = new FileReader(file, 'UTF-8'); // : FileReader
        var xmlStreamReader = new XMLStreamReader(fileReader); // : XMLStreamReader

        while (xmlStreamReader.hasNext()) {
            if (xmlStreamReader.next() == XMLStreamConstants.START_ELEMENT) {
                var localElementName = xmlStreamReader.getLocalName(); // : String
                if (localElementName == 'order') {
                    // Read single "order" as XML
                    var ns = new Namespace(xmlStreamReader.getNamespaceURI());
                    var xmlOrder = xmlStreamReader.getXMLObject().removeNamespace(ns); // : XML

                    // Get Order
                    var xmlOrderId = xmlOrder.attribute('order-no');
                    var order = OrderMgr.getOrder(xmlOrderId);

                    // Skip cycle if cannot retrieve order with orderId
                    if (!order) {
                        continue;
                    }

                    var _ = function (name) {
                        return new QName(ns, name);
                    }

                    // Get Order Data from XML: Status, Custom Attributes
                    var xmlOrderStatus = xmlOrder.child(_('status')).child(_('order-status')).text().replace('_', '').toUpperCase();
                    var xmlShippingStatus = xmlOrder.child(_('status')).child(_('shipping-status')).text().replace('_', '').toUpperCase();
                    var customAttributes = xmlOrder.child(_('custom-attributes')).child(_('custom-attribute'));

                    // Always handle Order custom attributes updates
                    for (var k = 0; k < customAttributes.length(); k++) {
                        var attributeName = customAttributes.attributes()[k];
                        var attributeValue = customAttributes[k];

                        if (order.custom[attributeName] != attributeValue) {
                            order.custom[attributeName] = attributeValue;
                        }
                    }

                    // PRODUCT LINE ITEMS
                    var needsRecalculation = false;
                    var xmlProductLineitems = xmlOrder.child(_('product-lineitems')).child(_('product-lineitem'));

                    // Run check for each product line item
                    for (var j = 0; j < xmlProductLineitems.length(); j++) {
                        var xmlProductLineitem = xmlProductLineitems[j];

                        var relativeOrderProduct = order.getAllProductLineItems().toArray().filter(function (productLineitem) {
                            return productLineitem.productID == xmlProductLineitem.child(_('product-id'));
                        })[0];

                        var productCustomAttributes = xmlProductLineitem.child(_('custom-attributes')).child(_('custom-attribute'));

                        // Always handle Order custom attributes updates
                        for (var y = 0; y < productCustomAttributes.length(); y++) {
                            var productAttributeName = productCustomAttributes.attributes()[y];
                            var productAttributeValue = productCustomAttributes[y];

                            if (relativeOrderProduct.custom[productAttributeName] != productAttributeValue) {
                                relativeOrderProduct.custom[productAttributeName] = productAttributeValue;
                            }
                        }

                        // Handle Order with product quantities that need to be changed if they still can be changed
                        if (
                            (order.getStatus().value == Order.ORDER_STATUS_OPEN || order.getStatus().value == Order.ORDER_STATUS_NEW) &&
                            order.getShippingStatus().value == Order.SHIPPING_STATUS_NOTSHIPPED
                        ) {
                            if (parseInt(relativeOrderProduct.quantity.value) > parseInt(xmlProductLineitem.child(_('quantity')))) {
                                if (parseInt(xmlProductLineitem.child(_('quantity')))) {
                                    relativeOrderProduct.setQuantityValue(parseInt(xmlProductLineitem.child(_('quantity'))));
                                } else {
                                    order.removeProductLineItem(relativeOrderProduct);
                                }
                                needsRecalculation = true;
                            }
                        }
                    }

                    if (needsRecalculation) {
                        HookMgr.callHook('dw.ocapi.shop.basket.calculate', 'calculate', order);
                        order.custom.Adyen_value = (order.totalGrossPrice.value * 100).toFixed();
                    }

                    // Update Order Status and Order Shipping Status
                    if ((xmlOrderStatus) && (xmlOrderStatus != order.getStatus().toString())) {
                        Transaction.begin();
                        try {
                            order.setStatus(Order['ORDER_STATUS_' + xmlOrderStatus]);
                            order.trackOrderChange('Changed status to: ORDER_STATUS_' + xmlOrderStatus);
                        } catch (error) {
                            Transaction.rollback();
                            return new Status(Status.ERROR, 'ERROR', 'Is impossible to change the order status for the order: {0}', xmlOrderId);
                        }
                        Transaction.commit();

                    }

                    if ((xmlShippingStatus) && (xmlShippingStatus != order.getShippingStatus().toString()) && (xmlShippingStatus.replace('_', '') != order.getShippingStatus().toString())) {
                        Transaction.begin();
                        try {
                            order.setShippingStatus(Order['SHIPPING_STATUS_' + xmlShippingStatus.replace('_', '')]);
                            order.trackOrderChange('Changed status to: SHIPPING_STATUS_' + xmlShippingStatus.replace('_', ''));
                        } catch (error) {
                            Transaction.rollback();
                            return new Status(Status.ERROR, 'ERROR', 'Is impossible to change the shipping status for the order: {0}', xmlOrderId);
                        }
                        Transaction.commit();
                    }
                }
            }
        }

        xmlStreamReader.close();
        fileReader.close();

        processedFilesCounter++;

        var dateTimeStamp = new Date().getTime();
        var archivedFile = new File(File.IMPEX + args.ArchiveFilesPath + file.name.substring(0, file.name.length - 4) + '-' + dateTimeStamp + file.name.substring(file.name.length - 4)); // : File
        file.copyTo(archivedFile);
        file.remove();

        Logger.info('Processed correctly order file number {0}', i);

    }

    Logger.info('Processed correctly {0} of {1} order files', processedFilesCounter, numberOfFiles);
}
