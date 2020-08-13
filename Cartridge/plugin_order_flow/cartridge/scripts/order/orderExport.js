'use strict';

/* Job for export orders XML file in WebDAV */

/* API Includes */
var Logger = require('dw/system/Logger').getLogger('custom.job.OrderExport');
var Status = require('dw/system/Status');
var Order = require('dw/order/Order');
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');

var orderExport = function () {
    try {
        Logger.info('Starting orders export job...');

        var errorFlow = false;
        var addOrdersRootNode = true;

        // check if global parameters is empty
        var args = arguments[0];
        if (empty(args.OrderExportTimeDelta) || empty(args.FilesPath) || empty(args.RootDirectoryWebDav) || empty(args.ExportType)) {
            Logger.info('WARNING: global parameters is empty.');
            return new Status(Status.ERROR, 'ERROR', 'global parameters is empty.');
        }

        /* MODEL Includes */
        var ExportTypeModel = require('../../../../plugin_transfer/cartridge/models/' + args.ExportType);
        // get site ID
        var site = dw.system.Site.getCurrent().getID();
        Logger.info(site);
        if (empty(site)) {
            Logger.info('WARNING: site empty.');
            return new Status(Status.OK, 'NO_ORDER_READY_FOR_EXPORT_FOUND', 'No order ready for be exported');
        }
        // get date execution of the job minus X minutes
        var dateNowExportOrder = new Date();
        dateNowExportOrder.setMinutes(dateNowExportOrder.getMinutes() - args.OrderExportTimeDelta);

        if (empty(dateNowExportOrder) || !(dateNowExportOrder instanceof Date) || !(dateNowExportOrder < new Date())) {
            Logger.info('WARNING: Error export Date.');
            return new Status(Status.ERROR, 'ERROR', 'Error export Date.');
        }

        // get all order with "Ready to Export" and "Export Failed" status
        var query = '(exportStatus={0} OR exportStatus={1})';
        var queryArgs = [
            Order.EXPORT_STATUS_READY,
            Order.EXPORT_STATUS_FAILED,
        ];
        var orders = OrderMgr.searchOrders(query, 'creationDate asc', queryArgs);
        var orderToChangeStatus = OrderMgr.searchOrders(query, 'creationDate asc', queryArgs);

        // check if there are orders to be exported
        if (empty(orders)) {
            Logger.info('WARNING: No Orders to Export.');
            return new Status(Status.OK, 'NO_ORDER_READY_FOR_EXPORT_FOUND', 'No order ready for be exported');
        }
        var config = {};
        var NonExportedOrder;
        Logger.info('INFO: Start process orders.');
        while (orders.hasNext()) {
            var order = orders.next();
            var singleOrderXML = {};
            //Transaction.begin()
            // order.custom.siteId = site;
            //Transaction.commit()

            // get order number
            config.orderNo = order.getOrderNo();         

            // check if XML file exist
            if (empty(order.getOrderExportXML(null, null))) {
                errorFlow = true;
                Logger.info('WARNING: XML file not exist for Order {0}.', config.orderNo);
                NonExportedOrder.add(order); 
                continue;
            }
            
            singleOrderXML = order.getOrderExportXML(null, null);   
            singleOrderXML = singleOrderXML.replace("xmlns=\"http://www.demandware.com/xml/impex/order/2006-10-31\"", "").replace("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>", "");
            
            if(empty(config.orderXML)){
                config.orderXML = singleOrderXML;
            }else{
                config.orderXML += singleOrderXML;
            }
        }

        if(!empty(config.orderXML)){
            if (args.ExportType.equals('webDavModel')) {
                var exportTime = (args.TimestampInFilename === true) ? new Date() : '';
                exportTime = (exportTime) ? '_' + exportTime.toISOString().split('.')[0].replace(new RegExp('([-T:])', 'g'), '') : '';
                config.fileName ='order_export_'+ site +'_'+ exportTime + '.xml';

                // EXPORT FILE TO WEBDAV
                var OrderExportInstance = new ExportTypeModel();
                if (empty(OrderExportInstance)) {
                    Logger.info('ERROR: No Export WebDAV Model');
                    return new Status(Status.ERROR, 'ERROR', 'No Export WebDAV Model');
                }

                var folderResult = OrderExportInstance.createFolder(args.FilesPath, args.RootDirectoryWebDav, args.catalogOrLibraryName);
                if (!folderResult.success) {
                    Logger.info('WARNING: Failed create or CD in Folder {0}', args.FilesPath);
                    return new Status(Status.ERROR, 'ERROR', 'Failed create or CD in Folder');
                }
                var fileResult = OrderExportInstance.createFile(folderResult.directory.getFullPath(), config.fileName);
                
                if (!fileResult.success) {
                    errorFlow = true;
                    Logger.info('WARNING: Failed create file for Orders');
                    //continue;
                    return new Status(Status.ERROR, 'ERROR', 'Failed to create file of order');
                }
                let fullXmlContent = "";
                // Add new orders root node 
                if (addOrdersRootNode) {
                    fullXmlContent = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
                    fullXmlContent += "<orders xmlns=\"http://www.demandware.com/xml/impex/order/2006-10-31\">\n";
                    fullXmlContent += config.orderXML.replace("xmlns=\"http://www.demandware.com/xml/impex/order/2006-10-31\"", "").replace("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>", "");
                    fullXmlContent += "\n</orders>\n";
                } else {
                    fullXmlContent = config.orderXML;
                }
                
                var OrderExport = OrderExportInstance.createXmlContent(fileResult.file, fullXmlContent);
                if (!OrderExport.success) {
                    errorFlow = true;
                    Logger.info('WARNING: Failed write xml file for Orders');
                    //continue;
                    return new Status(Status.ERROR, 'ERROR', 'Failed to write xml file for Orders');
                }
                if (OrderExport.success) {
                    Logger.info('Successfully Exported');
                }
                //Logger.info('Created XML file for Order {0}.', config.orderNo);
                
                // SET EXPORT STATUS "EXPORTED"
                var confirmedOrders = orders;
                Logger.info(confirmedOrders); 
                
                //Logger.info(orderToChangeStatus.asList().getLength()); 

                if(empty(NonExportedOrder)){
                    while (orderToChangeStatus.hasNext()) {                   
                        var singleOrder = orderToChangeStatus.next();
                        Transaction.wrap(function () {
                            singleOrder.setExportStatus(Order.EXPORT_STATUS_EXPORTED);
                        });
                        //Logger.info('Order {0} EXPORTED.', config.orderNo);
                    }
                } else{
                    Logger.info('Non Exported Orders'); 
                        while (orderToChangeStatus.hasNext()) {                   
                            var singleOrder = orderToChangeStatus.next();
                            if(!NonExportedOrder.contains(singleOrder)){
                                Transaction.wrap(function () {
                                    singleOrder.setExportStatus(Order.EXPORT_STATUS_EXPORTED);
                                });
                            }
                            //Logger.info('Order {0} EXPORTED.', config.orderNo);
                        }
                } 
            
            } else {
                Logger.info('ERROR: ExportType is not valid.');
                return new Status(Status.ERROR, 'ERROR', 'ExportType is not valid.');
            }
        } else{
            return new Status(Status.ERROR, 'ERROR', 'No Orders to Export');
        }

        
    } catch (error) {
        var errorMessage = error.message;
        Logger.info('Catched Critical Error: ' + errorMessage);
        return new Status(Status.ERROR, 'ERROR', 'Catched Critical Error: ' + errorMessage);
    }

    if (errorFlow) {
        return new Status(Status.ERROR, 'ERROR', 'Failed export some XML files. Check the logs for more information.');
    }

    return new Status(Status.OK, 'OK', 'Orders Export Concluded with NO ERRORS.');
};

exports.OrderExport = orderExport;
