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
​ 
    fileList.addAll(filesDir.listFiles(function (file) {
        return file.isFile();
    }));
​
    var processedFilesCounter = 0;
    var numberOfFiles = fileList.length;
​
    Logger.info('Found {0} orders in {1}', numberOfFiles, args.FilesPath);
​
    if (!fileList.length) {
        return new Status(Status.OK, 'NO_ORDER_READY_FOR_IMPORT_FOUND', 'No order ready for be Imported');
    }
​
    for (var i = 0; i < fileList.length; i++) {
​
        var file = fileList[i];
​
        var fileReader = new FileReader(file, 'UTF-8'); // : FileReader
        var xmlStreamReader = new XMLStreamReader(fileReader); // : XMLStreamReader
​
        while (xmlStreamReader.hasNext()) {
            if (xmlStreamReader.next() == XMLStreamConstants.START_ELEMENT) {
                var localElementName = xmlStreamReader.getLocalName(); // : String
                if (localElementName == 'order') {
                    // Read single "order" as XML
                    var ns = new Namespace(xmlStreamReader.getNamespaceURI());
                    var xmlOrder = xmlStreamReader.getXMLObject().removeNamespace(ns); // : XML
​
                    Logger.warn('555555555555555555555555'); 
                    Logger.warn(xmlOrder.child('external-order-no').text());
                    
                    // Get Order
                    
                    var xmlOrderId = xmlOrder.child('order-no').text();

                    
                    if(xmlOrderId.toString().indexOf("-") > -1) {
                        if(xmlOrderId.toString().split('-')[0]==='WARINGUS') {
                            var xmlExtOrderId = xmlOrder.child('external-order-no').text();
                            Logger.warn(xmlOrderId);
                            
                            var order = dw.order.OrderMgr.getOrder(xmlOrderId);
                            Logger.warn('66666666666666666666'); 
                            Logger.warn(JSON.stringify(order)); 
        ​

                                Logger.warn('777777777777777777777'); 
                                Transaction.begin();
                                try {
                                    Logger.warn('8888888888888888888'); 
                                    order.custom.sapOrderNumber = xmlExtOrderId;
                                    order.custom.isReceived = true;
                                    order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
                                } catch (error) {
                                    Logger.warn('9999999999999999'); 
                                    Transaction.rollback();
                                    return new Status(Status.ERROR, 'ERROR', 'Is impossible to change the shipping status for the order: {0}', xmlOrderId);
                                }
                                Transaction.commit();
                        }
                    }
                    

                   
                    
                }
            }
        }
​
        xmlStreamReader.close();
        fileReader.close();
​
        processedFilesCounter++;
       
​
        Logger.info('Processed correctly order file number {0}', i);
​
    }
​
    Logger.info('Processed correctly {0} of {1} order files', processedFilesCounter, numberOfFiles);
}