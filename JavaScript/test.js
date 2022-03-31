/*
* @Author: tmh
* @Date: 2022-3-27 14:52:56
* @LastEditors: Andy
* @LastEditTime: 2022-3-27 14:53:05
* @FilePath: \JavaScript\orderdetail.js
* @Description: 订单明细操作
* @copyright: Copyright (c) ${now_year} by Andy/汉得微扬, All Rights Reserved.
*/

/**
 * @description 页面加载事件函数: 
 * @param {*} executionContext  窗体上下文对象
 * @return {*} void
 */
function FormOnload(executionContext) {
    var UserId = Xrm.Page.context.getUserId(); //获取当前用户id
    var UserName = Xrm.Page.context.getUserName(); //获取当前用户的用户名
    var UserRoles = Xrm.Page.context.getUserRoles(); //获取当用户的安全角色
    debugger
    CheckStatus();

    //可见性：只有关联客户的负责人 = 当前用户 &用户安全角色=业务员&已保存的记录&状态=（草稿或审批拒绝）
    let formContext = executionContext.getFormContext();
    debugger
    //字段【订单明细编号】、【订单】、【牌号】、【产品描述】、【等级】、【单价】只读
    formContext.getControl('new_number').setDisabled(true);
    //formContext.getControl('new_order_r1').setDisabled(true);
    //formContext.getControl('new_product_r11').setDisabled(true);
    formContext.getControl('new_productbrand').setDisabled(true);

    formContext.getControl('new_productdescription').setDisabled(true);
    formContext.getControl('new_price').setDisabled(true);

    if (Xrm.Page.ui.getFormType() == 1) { //新增状态
    }
    var new_orderdetailid_control = formContext.getControl('new_orderdetailid');

    //为产品搜索控件注册addPreSearch事件
    //var product_id_control = formContext.getControl('new_product_r11');
    //product_id_control.addPreSearch(function () {
    //    ProductAddFilter();
    //});

    //注册订单onchange事件
    //Xrm.Page.getControl('new_order_r1').getAttribute().addOnChange(function () {
    //    ProductAddFilter();
    //});

    //注册产品onchange事件
    Xrm.Page.getControl('new_product_r11').getAttribute().addOnChange(function () {
        ProductOnChange();
    });

    //注册单价事件
    Xrm.Page.getControl('new_price').getAttribute().addOnChange(function () {
        calculate(formContext);
    });

    //注册数量事件
    Xrm.Page.getControl('new_quantity').getAttribute().addOnChange(function () {
        calculate(formContext);
    });
}

//小计计算事件
function calculate(formContext) {
    debugger
    var new_price = formContext.getAttribute('new_price').getValue() == null ? 0 : formContext.getAttribute('new_price').getValue();
    var new_quantity = formContext.getAttribute('new_quantity').getValue() == null ? 0 : formContext.getAttribute('new_quantity').getValue();
    formContext.getAttribute('new_totolprice').setValue(parseFloat(new_price) * parseFloat(new_quantity));

}

function CheckStatus() {
    debugger
    let order_options = Xrm.Page.getAttribute('new_order_r1').getValue();
    if (order_options) {
        let serviverUrl = Xrm.Page.context.getClientUrl();
        let parameter = "new_orders?$select=new_ordersatus&$filter=new_orderid eq " + order_options[0].id;

        var retrieveReq = new XMLHttpRequest();
        retrieveReq.open("GET", encodeURI(serviverUrl + "/api/data/v9.1/" + parameter), false);
        retrieveReq.setRequestHeader("Accept", "application/json");
        retrieveReq.setRequestHeader("Content-Type", "application/json;charset=utf-8");
        retrieveReq.setRequestHeader("OData-MaxVersion", "4.0");
        retrieveReq.setRequestHeader("OData-Version", "4.0");
        retrieveReq.setRequestHeader("Prefer", "oadata.include-annotations=\"*\"");
        retrieveReq.onreadystatechange = function () {
            if (this.readyState === 4) {
                retrieveReq.onreadystatechange = null;
                if (this.status === 200) {
                    let order_info = JSON.parse(this.response);

                    if (order_info.value.length > 0) {
                        if (order_info.value[0].new_ordersatus != 10) {
                            disabledControls();
                        }
                    }
                }

            } else {
                Xrm.Utility.alertDialog(this.statusText);
            }
        }
        retrieveReq.send();
    };

}

/**
 * @description 下单客户更改事件函数: 
 * @param {*}
 * @return {*}
 */
function ProductOnChange(formContext) {
    //#region 查产品信息
    let product_options = Xrm.Page.getAttribute('new_product_r11').getValue();
    if (product_options) {
        let serviverUrl = Xrm.Page.context.getClientUrl();
        let parameter = "new_products?$select=new_productbrand,new_productdescription,new_price&$filter=new_productid eq " + product_options[0].id;

        var retrieveReq = new XMLHttpRequest();
        retrieveReq.open("GET", encodeURI(serviverUrl + "/api/data/v9.1/" + parameter), false);
        retrieveReq.setRequestHeader("Accept", "application/json");
        retrieveReq.setRequestHeader("Content-Type", "application/json;charset=utf-8");
        retrieveReq.setRequestHeader("OData-MaxVersion", "4.0");
        retrieveReq.setRequestHeader("OData-Version", "4.0");
        retrieveReq.setRequestHeader("Prefer", "oadata.include-annotations=\"*\"");
        retrieveReq.onreadystatechange = function () {
            if (this.readyState === 4) {
                retrieveReq.onreadystatechange = null;
                if (this.status === 200) {
                    let product_info = JSON.parse(this.response);

                    if (product_info.value.length > 0) {
                        //为订单明显实体得产品信息赋值
                        Xrm.Page.getAttribute('new_productbrand').setValue(product_info.value[0].new_productbrand);
                        Xrm.Page.getAttribute('new_productdescription').setValue(product_info.value[0].new_productdescription);
                        Xrm.Page.getAttribute('new_price').setValue(product_info.value[0].new_price);

                    }
                } else {
                    Xrm.Utility.alertDialog(this.statusText);
                }
            }
        };
        retrieveReq.send();

    } else {
        Xrm.Page.getAttribute('new_productbrand').setValue(null);
        Xrm.Page.getAttribute('new_productdescription').setValue(null);
        Xrm.Page.getAttribute('new_price').setValue(null);
    }
    //#endregion
}

//产品查找事件
function ProductAddFilter() {
    debugger
    var orderId = "";
    let fetchXml = "";
    let fetchXmlfilter = "";
    let order_options = Xrm.Page.getAttribute('new_order_r1').getValue();
    if (order_options) {
        orderId = order_options[0].id.replace('{', '').replace('}', '');
        let serviverUrl = Xrm.Page.context.getClientUrl();
        let parameter = "new_orders?$select=_new_new_contract_r11_value&$filter=new_orderid eq " + orderId;
        var new_contract_r11 = "";
        var retrieveReq = new XMLHttpRequest();
        retrieveReq.open("GET", encodeURI(serviverUrl + "/api/data/v9.1/" + parameter), false);
        retrieveReq.setRequestHeader("Accept", "application/json");
        retrieveReq.setRequestHeader("Content-Type", "application/json;charset=utf-8");
        retrieveReq.setRequestHeader("OData-MaxVersion", "4.0");
        retrieveReq.setRequestHeader("OData-Version", "4.0");
        retrieveReq.setRequestHeader("Prefer", "oadata.include-annotations=\"*\"");
        retrieveReq.onreadystatechange = function () {
            if (this.readyState === 4) {
                retrieveReq.onreadystatechange = null;
                if (this.status === 200) {
                    let order_info = JSON.parse(this.response);

                    if (order_info.value.length > 0) {
                        new_contract_r11 = order_info.value[0]._new_new_contract_r11_value;
                        fetchXml = '<fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="false"><entity name="new_contractdetail"><all-attributes /><filter><condition attribute="new_contract_r11" operator="eq" value="' + new_contract_r11 + '" /></filter><link-entity name="new_product" from="new_productid" to="new_product_r11" alias="p" link-type="inner" /></entity></fetch>';
                    }
                } else {
                    Xrm.Utility.alertDialog(this.statusText);
                }
            }
        };
        retrieveReq.send();

    }

    if (fetchXml != "") {

        debugger;
        var req = new XMLHttpRequest();
        req.open("GET", encodeURI(Xrm.Page.context.getClientUrl() + "/api/data/v9.1/new_contractdetails?fetchXml=" + encodeURI(fetchXml), true));
        req.setRequestHeader("Accept", "application/json");
        req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        req.setRequestHeader("OData-MaxVersion", "4.0");
        req.setRequestHeader("OData-Version", "4.0");
        req.onreadystatechange = function () {
            if (this.readyState == 4) {
                req.onreadystatechange = null;
                if (this.status == 200) {
                    if (JSON.parse(this.response).value.length > 0) var data = JSON.parse(this.response).value;
                    data.value.forEach(function (item) {
                        fetchXmlfilter += '<condition attribute="new_productid" operator="eq" value="' + item.new_productid + '" />';
                    })
                } else {
                    var error = JSON.parse(this.response).error;
                }
            }
        };
        req.send();
    }

    let fetchXml = '<filter type="or"><condition attribute="new_productid" operator="eq" value="9EC602A1-8AAA-EC11-9FB3-000C29E4ACF6" /><condition attribute="new_productid" operator="eq" value="6CDE3DD5-9FAD-EC11-9FB3-000C29E4ACF6" /></filter>';
    Xrm.Page.getControl('new_product_r11').addCustomFilter(fetchXmlfilter);

}